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
    const appointment = await this.appointmentRepo.findById(appointmentId);

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

    return this.reportRepo.create({
      appointmentId,
      title: dto.title,
      content: dto.content,
      doctorName: dto.doctorName,
      status: dto.status,
      publishedAt: dto.status === 'PUBLISHED' ? new Date() : null,
    });
  }

  async updateReport(reportId: string, dto: SaveReportDTO) {
    const report = await this.reportRepo.findById(reportId);

    if (!report) {
      throw new NotFoundError('Laudo não encontrado');
    }

    // Regra: Laudos publicados não podem ser editados
    if (report.status === 'PUBLISHED') {
      throw new BadRequestError('Laudos já publicados não podem ser alterados');
    }

    return this.reportRepo.update(reportId, {
      title: dto.title,
      content: dto.content,
      doctorName: dto.doctorName,
      status: dto.status,
      publishedAt: dto.status === 'PUBLISHED' ? new Date() : null,
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

      // 2. Não pode acessar rascunho
      if (report.status !== 'PUBLISHED') {
        throw new ForbiddenError('Acesso negado: este laudo ainda está em fase de rascunho e não foi publicado');
      }
    }

    return report;
  }
}
