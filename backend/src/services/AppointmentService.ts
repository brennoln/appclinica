import { AppointmentRepository, UserRepository } from '../repositories/index.js';
import { BadRequestError, NotFoundError, ConflictError } from '../errors/AppError.js';

export const VALID_EXAM_TYPES = ['RAIO_X', 'ULTRASSOM', 'RESSONANCIA_MAGNETICA'] as const;
export type ExamType = (typeof VALID_EXAM_TYPES)[number];

export interface CreateAppointmentDTO {
  patientId: string;
  examType: ExamType;
  dateTime: string; // ISO 8601
}

export class AppointmentService {
  constructor(
    private readonly appointmentRepo: AppointmentRepository = new AppointmentRepository(),
    private readonly userRepo: UserRepository = new UserRepository()
  ) {}

  async createAppointment(dto: CreateAppointmentDTO) {
    const targetDate = new Date(dto.dateTime);

    if (isNaN(targetDate.getTime())) {
      throw new BadRequestError('Data e horário informados são inválidos');
    }

    // Regra 1: Não permitir agendamentos no passado
    const now = new Date();
    if (targetDate.getTime() <= now.getTime()) {
      throw new BadRequestError('Não é permitido criar agendamentos em datas passadas');
    }

    // Regra 2: Intervalos fixos de 30 minutos em sala única
    // Avalia os minutos tanto em UTC quanto no relógio do fuso (00 ou 30)
    const minutes = targetDate.getMinutes();
    const seconds = targetDate.getSeconds();
    const ms = targetDate.getMilliseconds();
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

    // Regra 4: Concorrência e Sala Única
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
        },
        tx
      );
    });
  }

  async listAppointments(userRole: string, userId: string, filters: { date?: string; patientId?: string }) {
    let effectivePatientId: string | undefined = undefined;

    // Se o usuário logado for paciente, ele SÓ PODE ver os seus próprios agendamentos
    if (userRole === 'PATIENT') {
      effectivePatientId = userId;
    } else if (filters.patientId) {
      effectivePatientId = filters.patientId;
    }

    let startDate: Date | undefined = undefined;
    let endDate: Date | undefined = undefined;

    if (filters.date) {
      // Cria o intervalo de busca cobrindo o dia local (America/Sao_Paulo UTC-3: 03:00Z até dia seguinte 02:59:59.999Z)
      // e também o dia UTC para máxima compatibilidade
      startDate = new Date(`${filters.date}T00:00:00.000-03:00`);
      endDate = new Date(`${filters.date}T23:59:59.999-03:00`);
      if (isNaN(startDate.getTime())) {
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
        if (!appt.report || appt.report.status !== 'PUBLISHED') {
          return {
            ...appt,
            report: null, // Paciente não visualiza rascunho
          };
        }
      }
      return appt;
    });
  }

  async cancelAppointment(appointmentId: string) {
    const appointment = await this.appointmentRepo.findById(appointmentId);

    if (!appointment) {
      throw new NotFoundError('Agendamento não encontrado');
    }

    // Regra: Agendamentos com laudo publicado não podem ser cancelados
    if (appointment.report && appointment.report.status === 'PUBLISHED') {
      throw new BadRequestError('Não é possível cancelar um agendamento cujo laudo já foi publicado');
    }

    if (appointment.status === 'CANCELLED') {
      throw new BadRequestError('Agendamento já está cancelado');
    }

    return this.appointmentRepo.updateStatus(appointmentId, 'CANCELLED');
  }
}
