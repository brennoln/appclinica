import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';

// Validação de tipo de exame
const EXAM_TYPES = ['RAIO_X', 'ULTRASSOM', 'RESSONANCIA_MAGNETICA'] as const;

const createAppointmentSchema = z.object({
  patientId: z.string().uuid(),
  examType: z.enum(EXAM_TYPES),
  dateTime: z.string().datetime(), // ISO 8601 string
});

export async function createAppointment(req: Request, res: Response): Promise<void> {
  const result = createAppointmentSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: 'Dados inválidos', details: result.error.errors });
    return;
  }

  const { patientId, examType, dateTime } = result.data;
  const targetDate = new Date(dateTime);

  // 1. Regra: Não permitir agendamentos no passado
  const now = new Date();
  if (targetDate.getTime() < now.getTime()) {
    res.status(400).json({ error: 'Não é permitido criar agendamentos em datas passadas' });
    return;
  }

  // 2. Regra: Horários fixos de 30 minutos (minutos devem ser 00 ou 30, segundos e ms 0)
  const minutes = targetDate.getMinutes();
  const seconds = targetDate.getSeconds();
  const ms = targetDate.getMilliseconds();
  if ((minutes !== 0 && minutes !== 30) || seconds !== 0 || ms !== 0) {
    res.status(400).json({
      error: 'Os agendamentos devem ser em horários fixos com intervalos de 30 minutos (ex: 09:00, 09:30).',
    });
    return;
  }

  // 3. Verificar se paciente existe
  const patient = await prisma.user.findFirst({
    where: { id: patientId, role: 'PATIENT' },
  });
  if (!patient) {
    res.status(404).json({ error: 'Paciente não encontrado' });
    return;
  }

  // 4. Regra de Concorrência e Sala Única:
  // Não permitir dois agendamentos ativos no mesmo horário.
  // Permitir reutilizar o horário de um agendamento cancelado.
  try {
    const appointment = await prisma.$transaction(async (tx) => {
      const conflictingAppointment = await tx.appointment.findFirst({
        where: {
          dateTime: targetDate,
          status: 'SCHEDULED',
        },
      });

      if (conflictingAppointment) {
        throw new Error('SLOT_ALREADY_BOOKED');
      }

      return await tx.appointment.create({
        data: {
          patientId,
          examType,
          dateTime: targetDate,
          status: 'SCHEDULED',
        },
        include: {
          patient: {
            select: { id: true, name: true, email: true },
          },
        },
      });
    });

    res.status(201).json(appointment);
  } catch (error: any) {
    if (error.message === 'SLOT_ALREADY_BOOKED') {
      res.status(409).json({ error: 'Já existe um agendamento ativo para este horário' });
      return;
    }
    console.error('Erro ao criar agendamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor ao criar agendamento' });
  }
}

export async function listAppointments(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const { date, patientId } = req.query;

  const whereClause: any = {};

  // Se o usuário logado for paciente, ele SÓ PODE ver os seus próprios agendamentos
  if (user.role === 'PATIENT') {
    whereClause.patientId = user.userId;
  } else if (patientId && typeof patientId === 'string') {
    // Equipe da clínica pode filtrar por paciente
    whereClause.patientId = patientId;
  }

  // Filtro por data (dia específico YYYY-MM-DD)
  if (date && typeof date === 'string') {
    const startOfDay = new Date(`${date}T00:00:00.000Z`);
    const endOfDay = new Date(`${date}T23:59:59.999Z`);
    if (!isNaN(startOfDay.getTime())) {
      whereClause.dateTime = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }
  }

  const appointments = await prisma.appointment.findMany({
    where: whereClause,
    include: {
      patient: {
        select: { id: true, name: true, email: true },
      },
      report: {
        select: {
          id: true,
          status: true,
          title: true,
          doctorName: true,
          publishedAt: true,
          createdAt: true,
          content: user.role === 'CLINIC',
        },
      },
    },
    orderBy: { dateTime: 'asc' },
  });

  const sanitized = appointments.map((appt) => {
    if (user.role === 'PATIENT' && appt.report && appt.report.status !== 'PUBLISHED') {
      return {
        ...appt,
        report: null,
      };
    }
    return appt;
  });

  res.json(sanitized);
}

export async function cancelAppointment(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: { report: true },
  });

  if (!appointment) {
    res.status(404).json({ error: 'Agendamento não encontrado' });
    return;
  }

  // Regra: Agendamentos com laudo publicado não podem ser cancelados
  if (appointment.report && appointment.report.status === 'PUBLISHED') {
    res.status(400).json({
      error: 'Não é possível cancelar um agendamento cujo laudo já foi publicado',
    });
    return;
  }

  if (appointment.status === 'CANCELLED') {
    res.status(400).json({ error: 'Agendamento já está cancelado' });
    return;
  }

  const updated = await prisma.appointment.update({
    where: { id },
    data: { status: 'CANCELLED' },
  });

  res.json(updated);
}
