import { Request, Response } from 'express';
import { z } from 'zod';
import { AppointmentService, VALID_EXAM_TYPES } from '../services/AppointmentService.js';

const createAppointmentSchema = z.object({
  patientId: z.string().uuid('ID do paciente inválido'),
  examType: z.enum(VALID_EXAM_TYPES),
  dateTime: z.string().datetime('Data e horário devem estar em formato ISO 8601'),
  preparationNotes: z.string().optional(),
});

const listAppointmentsQuerySchema = z.object({
  date: z.string().optional(),
  patientId: z.string().optional(),
});

const updatePreparationSchema = z.object({
  preparationNotes: z.string().nullable(),
});

export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService = new AppointmentService()) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const data = createAppointmentSchema.parse(req.body);
    const appointment = await this.appointmentService.createAppointment(data);
    res.status(201).json(appointment);
  };

  list = async (req: Request, res: Response): Promise<void> => {
    const filters = listAppointmentsQuerySchema.parse(req.query);
    const appointments = await this.appointmentService.listAppointments(
      req.user!.role,
      req.user!.userId,
      filters
    );
    res.json(appointments);
  };

  cancel = async (req: Request, res: Response): Promise<void> => {
    const id = String(req.params.id);
    const updated = await this.appointmentService.cancelAppointment(id);
    res.json(updated);
  };

  updatePreparation = async (req: Request, res: Response): Promise<void> => {
    const id = String(req.params.id);
    const { preparationNotes } = updatePreparationSchema.parse(req.body);
    const updated = await this.appointmentService.updatePreparationNotes(id, preparationNotes);
    res.json(updated);
  };

  confirm = async (req: Request, res: Response): Promise<void> => {
    const id = String(req.params.id);
    const updated = await this.appointmentService.confirmAttendance(id, req.user!.userId);
    res.json(updated);
  };
}
