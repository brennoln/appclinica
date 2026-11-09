import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';

const saveReportSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  content: z.string().min(1, 'Texto do laudo é obrigatório'),
  doctorName: z.string().min(1, 'Nome do profissional responsável é obrigatório'),
  status: z.enum(['DRAFT', 'PUBLISHED']),
});

// Criar laudo (Rascunho ou Publicado)
export async function createReport(req: Request, res: Response): Promise<void> {
  const appointmentId = String(req.params.appointmentId);
  const result = saveReportSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({ error: 'Dados inválidos', details: result.error.errors });
    return;
  }

  const { title, content, doctorName, status } = result.data;

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { report: true },
  });

  if (!appointment) {
    res.status(404).json({ error: 'Agendamento não encontrado' });
    return;
  }

  // Regra: Agendamentos cancelados não podem receber laudos
  if (appointment.status === 'CANCELLED') {
    res.status(400).json({ error: 'Agendamentos cancelados não podem receber laudos' });
    return;
  }

  // Regra: Cada agendamento pode ter apenas um laudo
  if (appointment.report) {
    res.status(400).json({ error: 'Este agendamento já possui um laudo cadastrado' });
    return;
  }

  const report = await prisma.report.create({
    data: {
      appointmentId,
      title,
      content,
      doctorName,
      status,
      publishedAt: status === 'PUBLISHED' ? new Date() : null,
    },
  });

  res.status(201).json(report);
}

// Atualizar laudo (apenas rascunhos podem ser editados / publicados)
export async function updateReport(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);
  const result = saveReportSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({ error: 'Dados inválidos', details: result.error.errors });
    return;
  }

  const { title, content, doctorName, status } = result.data;

  const report = await prisma.report.findUnique({
    where: { id },
  });

  if (!report) {
    res.status(404).json({ error: 'Laudo não encontrado' });
    return;
  }

  // Regra: Para simplificar, laudos publicados não podem ser editados
  if (report.status === 'PUBLISHED') {
    res.status(400).json({ error: 'Laudos já publicados não podem ser alterados' });
    return;
  }

  const updatedReport = await prisma.report.update({
    where: { id },
    data: {
      title,
      content,
      doctorName,
      status,
      publishedAt: status === 'PUBLISHED' ? new Date() : null,
    },
  });

  res.json(updatedReport);
}

// Obter detalhes de um laudo
export async function getReport(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);
  const user = req.user!;

  const report = await prisma.report.findUnique({
    where: { id },
    include: {
      appointment: {
        select: {
          id: true,
          patientId: true,
          examType: true,
          dateTime: true,
          status: true,
        },
      },
    },
  });

  if (!report) {
    res.status(404).json({ error: 'Laudo não encontrado' });
    return;
  }

  // Regras de acesso para Pacientes:
  // 1. Um paciente não pode acessar agendamentos ou laudos de outro paciente
  if (user.role === 'PATIENT' && report.appointment.patientId !== user.userId) {
    res.status(403).json({ error: 'Acesso negado: este laudo pertence a outro paciente' });
    return;
  }

  // 2. Um paciente tenta acessar um rascunho: seu conteúdo não deve ser disponibilizado
  if (user.role === 'PATIENT' && report.status !== 'PUBLISHED') {
    res.status(403).json({ error: 'Acesso negado: este laudo ainda está em fase de rascunho e não foi publicado' });
    return;
  }

  res.json(report);
}
