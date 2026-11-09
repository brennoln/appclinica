import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/AuthService.js';

const loginSchema = z.object({
  email: z.string().email('E-mail em formato inválido'),
  password: z.string().min(1, 'A senha é obrigatória'),
});

export class AuthController {
  constructor(private readonly authService: AuthService = new AuthService()) {}

  login = async (req: Request, res: Response): Promise<void> => {
    const data = loginSchema.parse(req.body);
    const result = await this.authService.authenticate(data.email, data.password);
    res.json(result);
  };

  me = async (req: Request, res: Response): Promise<void> => {
    const result = await this.authService.getProfile(req.user!.userId);
    res.json(result);
  };

  listPatients = async (_req: Request, res: Response): Promise<void> => {
    const patients = await this.authService.getPatients();
    res.json(patients);
  };
}
