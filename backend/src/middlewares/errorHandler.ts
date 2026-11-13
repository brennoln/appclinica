import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
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

  // Erros conhecidos do Prisma ORM (conflito de unicidade, chave estrangeira, registro ausente)
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      res.status(409).json({
        error: 'Conflito: já existe um registro ativo com estes dados.',
      });
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json({
        error: 'Registro não encontrado.',
      });
      return;
    }
    if (err.code === 'P2003') {
      res.status(400).json({
        error: 'Referência inválida informada nos dados da requisição.',
      });
      return;
    }
  }

  // Erro de JSON malformado no corpo da requisição
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      error: 'Formato JSON inválido no corpo da requisição.',
    });
    return;
  }

  // Erro inesperado
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    error: 'Ocorreu um erro interno no servidor',
  });
}
