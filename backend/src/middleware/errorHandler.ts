import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { logger } from '../lib/logger';
import { isProduction } from '../config/env';

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ error: 'No encontrado', path: req.path });
}

// Manejador centralizado: nunca exponer stack traces ni detalles internos
// al cliente en producción (evita filtrar detalles de implementación/infra).
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    res.status(400).json({ error: 'Datos inválidos', detalles: err.flatten() });
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }

  logger.error({ err, path: req.path }, 'Error no controlado');
  res.status(500).json({
    error: 'Error interno del servidor',
    ...(isProduction ? {} : { detalle: err instanceof Error ? err.message : String(err) }),
  });
}
