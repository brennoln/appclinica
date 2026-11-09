import { Request, Response } from 'express';
import { z } from 'zod';
import { ReportService } from '../services/ReportService.js';

const saveReportSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  content: z.string().min(1, 'Texto do laudo é obrigatório'),
  doctorName: z.string().min(1, 'Nome do profissional responsável é obrigatório'),
  status: z.enum(['DRAFT', 'PUBLISHED']),
});

export class ReportController {
  constructor(private readonly reportService: ReportService = new ReportService()) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const appointmentId = String(req.params.appointmentId);
    const data = saveReportSchema.parse(req.body);
    const report = await this.reportService.createReport(appointmentId, data);
    res.status(201).json(report);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const id = String(req.params.id);
    const data = saveReportSchema.parse(req.body);
    const report = await this.reportService.updateReport(id, data);
    res.json(report);
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const id = String(req.params.id);
    const report = await this.reportService.getReportById(id, {
      userId: req.user!.userId,
      role: req.user!.role,
    });
    res.json(report);
  };
}
