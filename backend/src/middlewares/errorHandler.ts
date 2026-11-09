import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/AppError.js';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Erro operacional conhecido da aplicação
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
    return;
  }

  // Erro de validação do Zod
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    res.status(400).json({
      error: 'Falha na validação dos dados',
      details: formattedErrors,
    });
    return;
  }

  // Erro inesperado
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    error: 'Ocorreu um erro interno no servidor',
  });
}
