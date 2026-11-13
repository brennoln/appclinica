import { AppointmentRepository, ReportRepository } from '../repositories/index.js';
import { BadRequestError, NotFoundError, ForbiddenError } from '../errors/AppError.js';

export interface SaveReportDTO {
  title: string;
  content: string;
  doctorName: string;
  status: 'DRAFT' | 'PUBLISHED';
}

export class ReportService {
  constructor(
    private readonly reportRepo: ReportRepository = new ReportRepository(),
    private readonly appointmentRepo: AppointmentRepository = new AppointmentRepository()
  ) {}

  async createReport(appointmentId: string, dto: SaveReportDTO) {
    const runTx = this.appointmentRepo.transaction
      ? this.appointmentRepo.transaction.bind(this.appointmentRepo)
      : async <T>(cb: (tx?: any) => Promise<T>) => cb(undefined);

    return runTx(async (tx) => {
      const appointment = await this.appointmentRepo.findById(appointmentId, tx);

      if (!appointment) {
        throw new NotFoundError('Agendamento não encontrado');
      }

      // Regra: Agendamentos cancelados não podem receber laudos
      if (appointment.status === 'CANCELLED') {
        throw new BadRequestError('Agendamentos cancelados não podem receber laudos');
      }

      // Regra: Cada agendamento pode ter apenas um laudo
      if (appointment.report) {
        throw new BadRequestError('Este agendamento já possui um laudo cadastrado');
      }

      const payload = {
        appointmentId,
        title: dto.title,
        content: dto.content,
        doctorName: dto.doctorName,
        status: dto.status,
        publishedAt: dto.status === 'PUBLISHED' ? new Date() : null,
      };

      return tx && tx !== this.appointmentRepo
        ? this.reportRepo.create(payload, tx)
        : this.reportRepo.create(payload);
    });
  }

  async updateReport(reportId: string, dto: SaveReportDTO) {
    const runTx = this.appointmentRepo.transaction
      ? this.appointmentRepo.transaction.bind(this.appointmentRepo)
      : async <T>(cb: (tx?: any) => Promise<T>) => cb(undefined);

    return runTx(async (tx) => {
      const report = await this.reportRepo.findById(reportId, tx);

      if (!report) {
        throw new NotFoundError('Laudo não encontrado');
      }

      // Regra: Agendamentos cancelados não podem ter laudos editados ou publicados
      if (report.appointment && report.appointment.status === 'CANCELLED') {
        throw new BadRequestError('Agendamentos cancelados não podem receber ou publicar laudos');
      }

      // Regra: Laudos publicados não podem ser editados
      if (report.status === 'PUBLISHED') {
        throw new BadRequestError('Laudos já publicados não podem ser alterados');
      }

      const payload = {
        title: dto.title,
        content: dto.content,
        doctorName: dto.doctorName,
        status: dto.status,
        publishedAt: dto.status === 'PUBLISHED' ? new Date() : null,
      };

      return tx && tx !== this.appointmentRepo
        ? this.reportRepo.update(reportId, payload, tx)
        : this.reportRepo.update(reportId, payload);
    });
  }

  async getReportById(reportId: string, user: { userId: string; role: 'CLINIC' | 'PATIENT' }) {
    const report = await this.reportRepo.findById(reportId);

    if (!report) {
      throw new NotFoundError('Laudo não encontrado');
    }

    // Regras de autorização do Paciente:
    if (user.role === 'PATIENT') {
      // 1. Não pode consultar laudo de outro paciente
      if (report.appointment.patientId !== user.userId) {
        throw new ForbiddenError('Acesso negado: este laudo pertence a outro paciente');
      }

      // 2. Não pode acessar rascunho nem laudo de exame cancelado
      if (report.status !== 'PUBLISHED' || report.appointment.status === 'CANCELLED') {
        throw new ForbiddenError('Acesso negado: este laudo ainda está em fase de rascunho e não foi publicado');
      }
    }

    return report;
  }
}
