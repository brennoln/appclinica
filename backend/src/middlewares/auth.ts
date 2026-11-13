import 'dotenv/config';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError, ForbiddenError } from '../errors/AppError.js';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';

export interface TokenPayload {
  userId: string;
  name: string;
  email: string;
  role: 'CLINIC' | 'PATIENT';
}

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Token de autenticação não fornecido');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    req.user = decoded;
    next();
  } catch (err) {
    throw new UnauthorizedError('Token inválido ou expirado');
  }
}

export function roleMiddleware(allowedRoles: ('CLINIC' | 'PATIENT')[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('Usuário não autenticado');
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenError('Acesso negado: permissão insuficiente para este perfil');
    }

    next();
  };
}
