import { AppointmentRepository, UserRepository } from '../repositories/index.js';
import { BadRequestError, NotFoundError, ConflictError } from '../errors/AppError.js';

export const VALID_EXAM_TYPES = ['RAIO_X', 'ULTRASSOM', 'RESSONANCIA_MAGNETICA'] as const;
export type ExamType = (typeof VALID_EXAM_TYPES)[number];

export interface CreateAppointmentDTO {
  patientId: string;
  examType: ExamType;
  dateTime: string; // ISO 8601
  preparationNotes?: string;
}

export class AppointmentService {
  constructor(
    private readonly appointmentRepo: AppointmentRepository = new AppointmentRepository(),
    private readonly userRepo: UserRepository = new UserRepository()
  ) {}

  async createAppointment(dto: CreateAppointmentDTO) {
    const rawDateTime = dto.dateTime.trim();
    const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(rawDateTime);
    const normalizedDateTime = hasTimezone ? rawDateTime : `${rawDateTime}-03:00`;
    const targetDate = new Date(normalizedDateTime);

    if (isNaN(targetDate.getTime())) {
      throw new BadRequestError('Data e horário informados são inválidos');
    }

    // Regra 1: Não permitir agendamentos no passado
    const now = new Date();
    if (targetDate.getTime() <= now.getTime()) {
      throw new BadRequestError('Não é permitido criar agendamentos em datas passadas');
    }

    // Regra 2: Intervalos fixos de 30 minutos em sala única (avaliado em UTC/America_Sao_Paulo)
    const minutes = targetDate.getUTCMinutes();
    const seconds = targetDate.getUTCSeconds();
    const ms = targetDate.getUTCMilliseconds();
    if ((minutes !== 0 && minutes !== 30) || seconds !== 0 || ms !== 0) {
      throw new BadRequestError(
        'Os agendamentos devem ser em horários fixos com intervalos de 30 minutos (ex: 09:00, 09:30).'
      );
    }

    // Regra 3: Validar existência do paciente
    const patient = await this.userRepo.findById(dto.patientId);
    if (!patient || patient.role !== 'PATIENT') {
      throw new NotFoundError('Paciente não encontrado');
    }

    // Regra 4: Concorrência e Sala Única (serializada via transação com lock de escrita)
    return this.appointmentRepo.transaction(async (tx) => {
      const activeSlot = await this.appointmentRepo.findActiveByDateTime(targetDate, tx);
      if (activeSlot) {
        throw new ConflictError('Já existe um agendamento ativo para este horário');
      }

      return this.appointmentRepo.create(
        {
          patientId: dto.patientId,
          examType: dto.examType,
          dateTime: targetDate,
          preparationNotes: dto.preparationNotes || null,
        },
        tx
      );
    });
  }

  async listAppointments(userRole: string, userId: string, filters: { date?: string; patientId?: string }) {
    let effectivePatientId: string | undefined = undefined;

    if (userRole === 'PATIENT') {
      effectivePatientId = userId;
    } else if (filters.patientId) {
      effectivePatientId = filters.patientId;
    }

    let startDate: Date | undefined = undefined;
    let endDate: Date | undefined = undefined;

    if (filters.date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(filters.date)) {
        throw new BadRequestError('Formato de data inválido. Use AAAA-MM-DD');
      }
      startDate = new Date(`${filters.date}T00:00:00.000-03:00`);
      endDate = new Date(`${filters.date}T23:59:59.999-03:00`);
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new BadRequestError('Formato de data inválido. Use AAAA-MM-DD');
      }
    }

    const appointments = await this.appointmentRepo.list({
      patientId: effectivePatientId,
      startDate,
      endDate,
    });

    return appointments.map((appt) => {
      if (userRole === 'PATIENT') {
        if (appt.status === 'CANCELLED' || !appt.report || appt.report.status !== 'PUBLISHED') {
          return {
            ...appt,
            report: null,
          };
        }
      }
      return appt;
    });
  }

  async cancelAppointment(appointmentId: string) {
    const runTx = this.appointmentRepo.transaction
      ? this.appointmentRepo.transaction.bind(this.appointmentRepo)
      : async <T>(cb: (tx?: any) => Promise<T>) => cb(undefined);

    return runTx(async (tx) => {
      const appointment = await this.appointmentRepo.findById(appointmentId, tx);

      if (!appointment) {
        throw new NotFoundError('Agendamento não encontrado');
      }

      if (appointment.report && appointment.report.status === 'PUBLISHED') {
        throw new BadRequestError('Não é possível cancelar um agendamento cujo laudo já foi publicado');
      }

      if (appointment.status === 'CANCELLED') {
        throw new BadRequestError('Agendamento já está cancelado');
      }

      return tx && tx !== this.appointmentRepo
        ? this.appointmentRepo.updateStatus(appointmentId, 'CANCELLED', tx)
        : this.appointmentRepo.updateStatus(appointmentId, 'CANCELLED');
    });
  }

  async updatePreparationNotes(appointmentId: string, preparationNotes: string | null) {
    const runTx = this.appointmentRepo.transaction
      ? this.appointmentRepo.transaction.bind(this.appointmentRepo)
      : async <T>(cb: (tx?: any) => Promise<T>) => cb(undefined);

    return runTx(async (tx) => {
      const appointment = await this.appointmentRepo.findById(appointmentId, tx);

      if (!appointment) {
        throw new NotFoundError('Agendamento não encontrado');
      }

      if (appointment.status === 'CANCELLED') {
        throw new BadRequestError('Não é possível editar orientações de preparo de um agendamento cancelado');
      }

      return tx && tx !== this.appointmentRepo
        ? this.appointmentRepo.updatePreparationNotes(appointmentId, preparationNotes, tx)
        : this.appointmentRepo.updatePreparationNotes(appointmentId, preparationNotes);
    });
  }

  async confirmAttendance(appointmentId: string, patientId: string) {
    const runTx = this.appointmentRepo.transaction
      ? this.appointmentRepo.transaction.bind(this.appointmentRepo)
      : async <T>(cb: (tx?: any) => Promise<T>) => cb(undefined);

    return runTx(async (tx) => {
      const appointment = await this.appointmentRepo.findById(appointmentId, tx);

      if (!appointment) {
        throw new NotFoundError('Agendamento não encontrado');
      }

      if (appointment.patientId !== patientId) {
        throw new BadRequestError('Você só pode confirmar a presença dos seus próprios exames');
      }

      if (appointment.status === 'CANCELLED') {
        throw new BadRequestError('Não é possível confirmar presença em um agendamento cancelado');
      }

      // Regra estrita: só permite confirmar a partir de 2 dias antes do exame
      const now = new Date();
      const apptDate = new Date(appointment.dateTime);
      const twoDaysInMs = 2 * 24 * 60 * 60 * 1000;
      const diff = apptDate.getTime() - now.getTime();

      if (diff > twoDaysInMs) {
        throw new BadRequestError(
          'A confirmação de presença só é liberada a partir de 2 dias (48 horas) antes do exame para garantir pontualidade.'
        );
      }

      if (diff < 0) {
        throw new BadRequestError('Não é possível confirmar a presença de um exame que já ocorreu');
      }

      return tx && tx !== this.appointmentRepo
        ? this.appointmentRepo.confirmAttendance(appointmentId, now, tx)
        : this.appointmentRepo.confirmAttendance(appointmentId, now);
    });
  }
}
