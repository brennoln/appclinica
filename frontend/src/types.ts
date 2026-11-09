export type Role = 'CLINIC' | 'PATIENT';

export type ExamType = 'RAIO_X' | 'ULTRASSOM' | 'RESSONANCIA_MAGNETICA';

export const EXAM_LABELS: Record<ExamType, string> = {
  RAIO_X: 'Raio-X',
  ULTRASSOM: 'Ultrassom',
  RESSONANCIA_MAGNETICA: 'Ressonância Magnética',
};

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Report {
  id: string;
  appointmentId: string;
  title: string;
  content?: string;
  doctorName: string;
  status: 'DRAFT' | 'PUBLISHED';
  publishedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  examType: ExamType;
  dateTime: string;
  status: 'SCHEDULED' | 'CANCELLED';
  patient: {
    id: string;
    name: string;
    email: string;
  };
  report?: Report | null;
}
