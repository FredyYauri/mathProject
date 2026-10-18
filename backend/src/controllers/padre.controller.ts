import type { Request, Response, NextFunction } from 'express';
import * as padreService from '../services/padre.service';
import { signParentToken, signStudentToken } from '../middleware/auth';
import { env, isProduction } from '../config/env';

// httpOnly + sameSite=strict: el token nunca es accesible desde JS del
// frontend (mitiga robo de sesión vía XSS) y no viaja en requests cross-site.
function abrirSesionPadre(res: Response, padreId: string) {
  res.cookie(env.PARENT_SESSION_COOKIE_NAME, signParentToken(padreId), {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: env.PARENT_SESSION_HOURS * 60 * 60 * 1000,
  });
}

export async function postLogin(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body as { email: string; password: string };
    const padreId = await padreService.autenticarPadre(email, password);
    abrirSesionPadre(res, padreId);
    res.status(200).json({ ok: true });
  } catch (err) {
    next(err);
  }
}

// Crea la cuenta y deja la sesión abierta, para seguir directo a agregar hijos.
export async function postRegistro(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body as { email: string; password: string };
    const padreId = await padreService.crearPadre(email, password);
    abrirSesionPadre(res, padreId);
    res.status(201).json({ ok: true });
  } catch (err) {
    next(err);
  }
}

export async function postHijo(req: Request, res: Response, next: NextFunction) {
  try {
    const { nombre } = req.body as { nombre: string };
    const hijo = await padreService.crearHijo(req.parentId as string, nombre);
    res.status(201).json(hijo);
  } catch (err) {
    next(err);
  }
}

export function postLogout(_req: Request, res: Response) {
  res.clearCookie(env.PARENT_SESSION_COOKIE_NAME);
  res.status(204).send();
}

// Usado por el frontend para saber si ya hay una sesión de padre válida
// (p. ej. al recargar la página) sin exponer nada del contenido del niño.
export function getSesion(_req: Request, res: Response) {
  res.status(200).json({ ok: true });
}

export async function getHijos(req: Request, res: Response, next: NextFunction) {
  try {
    const hijos = await padreService.listarHijos(req.parentId as string);
    res.json(hijos);
  } catch (err) {
    next(err);
  }
}

// Activa el perfil del hijo en este dispositivo y cierra la sesión del padre:
// el dispositivo queda en "modo niño", y volver a /padres exige la puerta
// parental y el login de nuevo.
export async function postActivarPerfilEnDispositivo(req: Request, res: Response, next: NextFunction) {
  try {
    const estudianteId = req.params.estudianteId as string;
    await padreService.verificarHijoDePadre(req.parentId as string, estudianteId);

    res.cookie(env.STUDENT_SESSION_COOKIE_NAME, signStudentToken(estudianteId), {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: env.STUDENT_SESSION_DAYS * 24 * 60 * 60 * 1000,
    });
    res.clearCookie(env.PARENT_SESSION_COOKIE_NAME);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export function deletePerfilDelDispositivo(_req: Request, res: Response) {
  res.clearCookie(env.STUDENT_SESSION_COOKIE_NAME);
  res.status(204).send();
}

export async function getProgresoHijo(req: Request, res: Response, next: NextFunction) {
  try {
    const progreso = await padreService.obtenerProgresoDeHijo(
      req.parentId as string,
      req.params.estudianteId as string,
    );
    res.json(progreso);
  } catch (err) {
    next(err);
  }
}
