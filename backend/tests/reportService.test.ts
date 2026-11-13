import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReportService } from '../src/services/ReportService.js';
import { BadRequestError, NotFoundError, ForbiddenError } from '../src/errors/AppError.js';

describe('ReportService (Testes Unitários)', () => {
  let reportService: ReportService;
  let mockReportRepo: any;
  let mockAppointmentRepo: any;

  beforeEach(() => {
    mockReportRepo = {
      findById: vi.fn(),
      findByAppointmentId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    };

    mockAppointmentRepo = {
      findById: vi.fn(),
    };

    reportService = new ReportService(mockReportRepo, mockAppointmentRepo);
  });

  describe('createReport', () => {
    it('deve impedir criação de laudo para agendamento cancelado', async () => {
      mockAppointmentRepo.findById.mockResolvedValue({
        id: 'appt-1',
        status: 'CANCELLED',
        report: null,
      });

      await expect(
        reportService.createReport('appt-1', {
          title: 'Raio-X',
          content: 'Exame',
          doctorName: 'Dr. Teste',
          status: 'DRAFT',
        })
      ).rejects.toThrow(BadRequestError);
    });

    it('deve impedir mais de um laudo para o mesmo agendamento', async () => {
      mockAppointmentRepo.findById.mockResolvedValue({
        id: 'appt-1',
        status: 'SCHEDULED',
        report: { id: 'existing-rep' },
      });

      await expect(
        reportService.createReport('appt-1', {
          title: 'Raio-X',
          content: 'Exame',
          doctorName: 'Dr. Teste',
          status: 'DRAFT',
        })
      ).rejects.toThrow('Este agendamento já possui um laudo cadastrado');
    });

    it('deve criar laudo com sucesso quando o agendamento for elegível', async () => {
      mockAppointmentRepo.findById.mockResolvedValue({
        id: 'appt-1',
        status: 'SCHEDULED',
        report: null,
      });

      mockReportRepo.create.mockResolvedValue({
        id: 'new-report-id',
        title: 'Raio-X',
        status: 'PUBLISHED',
      });

      const res = await reportService.createReport('appt-1', {
        title: 'Raio-X',
        content: 'Conteúdo',
        doctorName: 'Dra. Médica',
        status: 'PUBLISHED',
      });

      expect(res.id).toBe('new-report-id');
      expect(mockReportRepo.create).toHaveBeenCalled();
    });
  });

  describe('updateReport', () => {
    it('deve impedir edição de laudo já publicado', async () => {
      mockReportRepo.findById.mockResolvedValue({
        id: 'rep-1',
        status: 'PUBLISHED',
        appointment: { status: 'SCHEDULED' },
      });

      await expect(
        reportService.updateReport('rep-1', {
          title: 'Tentativa de alteração',
          content: 'Mudança',
          doctorName: 'Dr.',
          status: 'PUBLISHED',
        })
      ).rejects.toThrow('Laudos já publicados não podem ser alterados');
    });

    it('deve impedir publicação ou edição de rascunho se o agendamento foi cancelado', async () => {
      mockReportRepo.findById.mockResolvedValue({
        id: 'rep-draft',
        status: 'DRAFT',
        appointment: { status: 'CANCELLED' },
      });

      await expect(
        reportService.updateReport('rep-draft', {
          title: 'Tentativa após cancelamento',
          content: 'Conteúdo',
          doctorName: 'Dr.',
          status: 'PUBLISHED',
        })
      ).rejects.toThrow('Agendamentos cancelados não podem receber ou publicar laudos');
    });
  });

  describe('getReportById (Controle de Acesso)', () => {
    it('deve impedir paciente de acessar laudo de outro paciente', async () => {
      mockReportRepo.findById.mockResolvedValue({
        id: 'rep-1',
        status: 'PUBLISHED',
        appointment: {
          patientId: 'patient-A',
        },
      });

      await expect(
        reportService.getReportById('rep-1', {
          userId: 'patient-B',
          role: 'PATIENT',
        })
      ).rejects.toThrow(ForbiddenError);
    });

    it('deve impedir paciente de acessar laudo em rascunho mesmo sendo seu próprio exame', async () => {
      mockReportRepo.findById.mockResolvedValue({
        id: 'rep-1',
        status: 'DRAFT',
        appointment: {
          patientId: 'patient-A',
        },
      });

      await expect(
        reportService.getReportById('rep-1', {
          userId: 'patient-A',
          role: 'PATIENT',
        })
      ).rejects.toThrow('este laudo ainda está em fase de rascunho');
    });

    it('deve permitir acesso da clínica a qualquer laudo mesmo em rascunho', async () => {
      mockReportRepo.findById.mockResolvedValue({
        id: 'rep-1',
        status: 'DRAFT',
        appointment: {
          patientId: 'patient-A',
        },
      });

      const res = await reportService.getReportById('rep-1', {
        userId: 'clinic-user',
        role: 'CLINIC',
      });

      expect(res.id).toBe('rep-1');
    });
  });
});
