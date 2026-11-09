import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppointmentService } from '../src/services/AppointmentService.js';
import { BadRequestError, NotFoundError, ConflictError } from '../src/errors/AppError.js';

describe('AppointmentService (Testes Unitários)', () => {
  let appointmentService: AppointmentService;
  let mockAppointmentRepo: any;
  let mockUserRepo: any;

  beforeEach(() => {
    mockAppointmentRepo = {
      findById: vi.fn(),
      findActiveByDateTime: vi.fn(),
      create: vi.fn(),
      list: vi.fn(),
      updateStatus: vi.fn(),
      transaction: vi.fn(async (cb) => cb(mockAppointmentRepo)),
    };

    mockUserRepo = {
      findById: vi.fn(),
    };

    appointmentService = new AppointmentService(mockAppointmentRepo, mockUserRepo);
  });

  describe('createAppointment', () => {
    it('deve rejeitar agendamento em datas passadas', async () => {
      const pastDate = new Date('2020-01-01T10:00:00.000Z').toISOString();

      await expect(
        appointmentService.createAppointment({
          patientId: 'patient-uuid',
          examType: 'RAIO_X',
          dateTime: pastDate,
        })
      ).rejects.toThrow(BadRequestError);
    });

    it('deve rejeitar agendamentos que não respeitam intervalos de 30 minutos', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 2);
      futureDate.setHours(10, 15, 0, 0); // 10:15 não é múltiplo de 30 minutos

      await expect(
        appointmentService.createAppointment({
          patientId: 'patient-uuid',
          examType: 'RAIO_X',
          dateTime: futureDate.toISOString(),
        })
      ).rejects.toThrow('horários fixos com intervalos de 30 minutos');
    });

    it('deve lançar NotFoundError caso o paciente não exista ou não possua perfil PATIENT', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 2);
      futureDate.setHours(10, 0, 0, 0);

      mockUserRepo.findById.mockResolvedValue(null);

      await expect(
        appointmentService.createAppointment({
          patientId: 'unknown-id',
          examType: 'RAIO_X',
          dateTime: futureDate.toISOString(),
        })
      ).rejects.toThrow(NotFoundError);
    });

    it('deve lançar ConflictError caso já exista agendamento ativo no mesmo horário', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 2);
      futureDate.setHours(10, 0, 0, 0);

      mockUserRepo.findById.mockResolvedValue({ id: 'patient-uuid', role: 'PATIENT' });
      mockAppointmentRepo.findActiveByDateTime.mockResolvedValue({ id: 'existing-appt-id' });

      await expect(
        appointmentService.createAppointment({
          patientId: 'patient-uuid',
          examType: 'RAIO_X',
          dateTime: futureDate.toISOString(),
        })
      ).rejects.toThrow(ConflictError);
    });

    it('deve criar o agendamento com sucesso quando os dados forem válidos e o horário estiver livre', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 2);
      futureDate.setHours(10, 0, 0, 0);

      mockUserRepo.findById.mockResolvedValue({ id: 'patient-uuid', role: 'PATIENT' });
      mockAppointmentRepo.findActiveByDateTime.mockResolvedValue(null);
      mockAppointmentRepo.create.mockResolvedValue({
        id: 'new-appt-id',
        patientId: 'patient-uuid',
        examType: 'RAIO_X',
        dateTime: futureDate,
        status: 'SCHEDULED',
      });

      const result = await appointmentService.createAppointment({
        patientId: 'patient-uuid',
        examType: 'RAIO_X',
        dateTime: futureDate.toISOString(),
      });

      expect(result).toBeDefined();
      expect(result.id).toBe('new-appt-id');
      expect(mockAppointmentRepo.create).toHaveBeenCalled();
    });
  });

  describe('cancelAppointment', () => {
    it('deve impedir o cancelamento de agendamentos com laudo publicado', async () => {
      mockAppointmentRepo.findById.mockResolvedValue({
        id: 'appt-1',
        status: 'SCHEDULED',
        report: { status: 'PUBLISHED' },
      });

      await expect(appointmentService.cancelAppointment('appt-1')).rejects.toThrow(
        'Não é possível cancelar um agendamento cujo laudo já foi publicado'
      );
    });

    it('deve lançar erro se o agendamento já estiver cancelado', async () => {
      mockAppointmentRepo.findById.mockResolvedValue({
        id: 'appt-1',
        status: 'CANCELLED',
        report: null,
      });

      await expect(appointmentService.cancelAppointment('appt-1')).rejects.toThrow(
        'Agendamento já está cancelado'
      );
    });

    it('deve cancelar o agendamento quando as condições forem atendidas', async () => {
      mockAppointmentRepo.findById.mockResolvedValue({
        id: 'appt-1',
        status: 'SCHEDULED',
        report: { status: 'DRAFT' },
      });
      mockAppointmentRepo.updateStatus.mockResolvedValue({
        id: 'appt-1',
        status: 'CANCELLED',
      });

      const res = await appointmentService.cancelAppointment('appt-1');
      expect(res.status).toBe('CANCELLED');
      expect(mockAppointmentRepo.updateStatus).toHaveBeenCalledWith('appt-1', 'CANCELLED');
    });
  });

  describe('listAppointments (Permissões e Filtros)', () => {
    it('deve omitir rascunhos de laudos quando o usuário for do tipo PATIENT', async () => {
      const mockList = [
        {
          id: '1',
          patientId: 'pat-1',
          report: { id: 'rep-draft', status: 'DRAFT', title: 'Rascunho' },
        },
        {
          id: '2',
          patientId: 'pat-1',
          report: { id: 'rep-pub', status: 'PUBLISHED', title: 'Publicado' },
        },
      ];

      mockAppointmentRepo.list.mockResolvedValue(mockList);

      const result = await appointmentService.listAppointments('PATIENT', 'pat-1', {});

      expect(result[0].report).toBeNull(); // Ocultado para paciente
      expect(result[1].report).not.toBeNull(); // Mantido publicado
    });
  });
});
