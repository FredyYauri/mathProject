import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { HttpError } from './errorHandler';

interface ParentTokenPayload {
  parentId: string;
}

interface StudentTokenPayload {
  estudianteId: string;
}

// Cada sesión firma con su propia audiencia: un token de padre nunca valida
// como token de niño ni al revés, aunque compartan el mismo secreto.
const PARENT_AUDIENCE = 'padre';
const STUDENT_AUDIENCE = 'estudiante';

// Separación estricta niño/padre (ver spec.md §3 y CLAUDE.md, "Consideraciones no
// negociables"): las rutas bajo /api/padres exigen esta sesión; las rutas del niño
// (contenido, progreso, simulacros) nunca deben requerir ni aceptar esta cookie
// como forma de "elevar" permisos — son superficies separadas a propósito.
export function requireParentAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = req.cookies?.[env.PARENT_SESSION_COOKIE_NAME] as string | undefined;

  if (!token) {
    next(new HttpError(401, 'Sesión de padre/tutor requerida'));
    return;
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET, { audience: PARENT_AUDIENCE }) as ParentTokenPayload;
    req.parentId = payload.parentId;
    next();
  } catch {
    next(new HttpError(401, 'Sesión inválida o expirada'));
  }
}

export function signParentToken(parentId: string): string {
  return jwt.sign({ parentId } satisfies ParentTokenPayload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
    audience: PARENT_AUDIENCE,
  } as jwt.SignOptions);
}

// Sesión del niño: la activa un padre/tutor autenticado eligiendo el perfil en
// el dispositivo (POST /api/padres/hijos/:id/dispositivo). El niño nunca envía
// su propio id — el servidor lo toma de esta cookie, así no se puede registrar
// progreso a nombre de otro estudiante.
export function requireStudentSession(req: Request, _res: Response, next: NextFunction): void {
  const token = req.cookies?.[env.STUDENT_SESSION_COOKIE_NAME] as string | undefined;

  if (!token) {
    next(new HttpError(401, 'No hay un perfil activo en este dispositivo'));
    return;
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET, { audience: STUDENT_AUDIENCE }) as StudentTokenPayload;
    req.estudianteId = payload.estudianteId;
    next();
  } catch {
    next(new HttpError(401, 'El perfil de este dispositivo expiró'));
  }
}

export function signStudentToken(estudianteId: string): string {
  return jwt.sign({ estudianteId } satisfies StudentTokenPayload, env.JWT_SECRET, {
    expiresIn: `${env.STUDENT_SESSION_DAYS}d`,
    audience: STUDENT_AUDIENCE,
  } as jwt.SignOptions);
}
