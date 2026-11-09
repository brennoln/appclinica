import { Router } from 'express';
import { login, me, listPatients } from '../controllers/authController.js';
import {
  createAppointment,
  listAppointments,
  cancelAppointment,
} from '../controllers/appointmentController.js';
import {
  createReport,
  updateReport,
  getReport,
} from '../controllers/reportController.js';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.js';

export const routes = Router();

// Rotas públicas
routes.post('/auth/login', login);

// Rotas autenticadas (Clínica ou Paciente)
routes.get('/auth/me', authMiddleware, me);

// Agendamentos
routes.get('/appointments', authMiddleware, listAppointments);
routes.post('/appointments', authMiddleware, roleMiddleware(['CLINIC']), createAppointment);
routes.patch('/appointments/:id/cancel', authMiddleware, roleMiddleware(['CLINIC']), cancelAppointment);

// Pacientes (para o dropdown do agendamento pela clínica)
routes.get('/patients', authMiddleware, roleMiddleware(['CLINIC']), listPatients);

// Laudos
routes.get('/reports/:id', authMiddleware, getReport);
routes.post('/appointments/:appointmentId/report', authMiddleware, roleMiddleware(['CLINIC']), createReport);
routes.put('/reports/:id', authMiddleware, roleMiddleware(['CLINIC']), updateReport);
