import { Router } from 'express';
import { AuthController } from '../controllers/AuthController.js';
import { AppointmentController } from '../controllers/AppointmentController.js';
import { ReportController } from '../controllers/ReportController.js';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.js';

export const routes = Router();

const authController = new AuthController();
const appointmentController = new AppointmentController();
const reportController = new ReportController();

// Rotas públicas de autenticação
routes.post('/auth/login', authController.login);

// Rotas autenticadas gerais
routes.get('/auth/me', authMiddleware, authController.me);

// Agendamentos
routes.get('/appointments', authMiddleware, appointmentController.list);
routes.post('/appointments', authMiddleware, roleMiddleware(['CLINIC']), appointmentController.create);
routes.patch('/appointments/:id/cancel', authMiddleware, roleMiddleware(['CLINIC']), appointmentController.cancel);
routes.patch('/appointments/:id/preparation', authMiddleware, roleMiddleware(['CLINIC']), appointmentController.updatePreparation);
routes.patch('/appointments/:id/confirm', authMiddleware, roleMiddleware(['PATIENT']), appointmentController.confirm);

// Pacientes (para seleção e cadastro rápido no painel da clínica)
routes.get('/patients', authMiddleware, roleMiddleware(['CLINIC']), authController.listPatients);
routes.post('/patients', authMiddleware, roleMiddleware(['CLINIC']), authController.createPatient);

// Laudos
routes.get('/reports/:id', authMiddleware, reportController.getById);
routes.post('/appointments/:appointmentId/report', authMiddleware, roleMiddleware(['CLINIC']), reportController.create);
routes.put('/reports/:id', authMiddleware, roleMiddleware(['CLINIC']), reportController.update);
