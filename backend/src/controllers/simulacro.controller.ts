import type { Request, Response, NextFunction } from 'express';
import type { z } from 'zod';
import * as simulacroService from '../services/simulacro.service';
import type { responderSimulacroSchema } from '../validators/simulacro.validators';

type ResponderBody = z.infer<typeof responderSimulacroSchema>;

export async function getSimulacros(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await simulacroService.listarSimulacros(req.estudianteId as string));
  } catch (err) {
    next(err);
  }
}

export async function postIniciar(req: Request, res: Response, next: NextFunction) {
  try {
    const sesion = await simulacroService.iniciarSimulacro(
      req.estudianteId as string,
      req.params.simulacroId as string,
    );
    res.status(201).json(sesion);
  } catch (err) {
    next(err);
  }
}

export async function postRespuesta(
  req: Request<{ sesionId: string }, unknown, ResponderBody>,
  res: Response,
  next: NextFunction,
) {
  try {
    await simulacroService.registrarRespuesta(
      req.estudianteId as string,
      req.params.sesionId,
      req.body.preguntaId,
      req.body.opcionSeleccionadaId,
    );
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function postFinalizar(req: Request, res: Response, next: NextFunction) {
  try {
    const resultado = await simulacroService.finalizarSimulacro(
      req.estudianteId as string,
      req.params.sesionId as string,
    );
    res.json(resultado);
  } catch (err) {
    next(err);
  }
}
