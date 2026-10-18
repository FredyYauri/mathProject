import type { Request, Response, NextFunction } from 'express';
import * as progresoService from '../services/progreso.service';
import * as mapaService from '../services/mapa.service';
import type { registrarRespuestaSchema } from '../validators/progreso.validators';
import type { z } from 'zod';

type RegistrarRespuestaBody = z.infer<typeof registrarRespuestaSchema>;

export async function getMapa(req: Request, res: Response, next: NextFunction) {
  try {
    const mapa = await mapaService.obtenerMapa(req.estudianteId as string);
    res.json(mapa);
  } catch (err) {
    next(err);
  }
}

export async function postIniciarLeccion(req: Request, res: Response, next: NextFunction) {
  try {
    const sesion = await progresoService.iniciarLeccion(
      req.estudianteId as string,
      req.params.leccionId as string,
    );
    res.status(201).json(sesion);
  } catch (err) {
    next(err);
  }
}

export async function postRespuesta(
  req: Request<unknown, unknown, RegistrarRespuestaBody>,
  res: Response,
  next: NextFunction,
) {
  try {
    const resultado = await progresoService.registrarRespuesta({
      ...req.body,
      estudianteId: req.estudianteId as string,
    });
    res.status(201).json(resultado);
  } catch (err) {
    next(err);
  }
}

export async function postCompletarLeccion(req: Request, res: Response, next: NextFunction) {
  try {
    const resultado = await progresoService.completarLeccion(
      req.estudianteId as string,
      req.params.sesionId as string,
    );
    res.json(resultado);
  } catch (err) {
    next(err);
  }
}
