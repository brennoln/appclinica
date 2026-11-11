import { PrismaClient, User, Appointment, Report, Prisma } from '@prisma/client';
import { prisma } from '../config/database.js';

export class UserRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.db.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.db.user.findUnique({
      where: { id },
    });
  }

  async listPatients(): Promise<Pick<User, 'id' | 'name' | 'email'>[]> {
    return this.db.user.findMany({
      where: { role: 'PATIENT' },
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    });
  }

  async createPatient(data: { name: string; email: string; password: string }): Promise<Pick<User, 'id' | 'name' | 'email' | 'role'>> {
    return this.db.user.create({
      data: {
        ...data,
        role: 'PATIENT',
      },
      select: { id: true, name: true, email: true, role: true },
    });
  }
}

export class AppointmentRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  async findById(id: string) {
    return this.db.appointment.findUnique({
      where: { id },
      include: {
        patient: { select: { id: true, name: true, email: true } },
        report: true,
      },
    });
  }

  async findActiveByDateTime(dateTime: Date, tx?: Prisma.TransactionClient) {
    const client = tx || this.db;
    return client.appointment.findFirst({
      where: {
        dateTime,
        status: 'SCHEDULED',
      },
    });
  }

  async create(
    data: { patientId: string; examType: string; dateTime: Date; preparationNotes?: string | null },
    tx?: Prisma.TransactionClient
  ) {
    const client = tx || this.db;
    return client.appointment.create({
      data: {
        ...data,
        status: 'SCHEDULED',
      },
      include: {
        patient: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async list(filters: { patientId?: string; startDate?: Date; endDate?: Date }) {
    const where: Prisma.AppointmentWhereInput = {};

    if (filters.patientId) {
      where.patientId = filters.patientId;
    }

    if (filters.startDate && filters.endDate) {
      where.dateTime = {
        gte: filters.startDate,
        lte: filters.endDate,
      };
    }

    return this.db.appointment.findMany({
      where,
      include: {
        patient: { select: { id: true, name: true, email: true } },
        report: {
          select: {
            id: true,
            status: true,
            title: true,
            doctorName: true,
            publishedAt: true,
            createdAt: true,
            content: true,
          },
        },
      },
      orderBy: { dateTime: 'asc' },
    });
  }

  async updateStatus(id: string, status: 'SCHEDULED' | 'CANCELLED') {
    return this.db.appointment.update({
      where: { id },
      data: { status },
      include: {
        patient: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async updatePreparationNotes(id: string, preparationNotes: string | null) {
    return this.db.appointment.update({
      where: { id },
      data: { preparationNotes },
      include: {
        patient: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async confirmAttendance(id: string, confirmedAt: Date) {
    return this.db.appointment.update({
      where: { id },
      data: { confirmedAt },
      include: {
        patient: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async transaction<T>(callback: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.db.$transaction(callback);
  }
}

export class ReportRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  async findById(id: string) {
    return this.db.report.findUnique({
      where: { id },
      include: {
        appointment: {
          select: {
            id: true,
            patientId: true,
            examType: true,
            dateTime: true,
            status: true,
            preparationNotes: true,
          },
        },
      },
    });
  }

  async findByAppointmentId(appointmentId: string) {
    return this.db.report.findUnique({
      where: { appointmentId },
    });
  }

  async create(data: {
    appointmentId: string;
    title: string;
    content: string;
    doctorName: string;
    status: 'DRAFT' | 'PUBLISHED';
    publishedAt?: Date | null;
  }) {
    return this.db.report.create({
      data,
    });
  }

  async update(id: string, data: {
    title: string;
    content: string;
    doctorName: string;
    status: 'DRAFT' | 'PUBLISHED';
    publishedAt?: Date | null;
  }) {
    return this.db.report.update({
      where: { id },
      data,
    });
  }
}
