import type { Request, Response, NextFunction } from 'express';
import * as estudianteService from '../services/estudiante.service';

// Usado por el frontend del niño para saber qué perfil está activo en el
// dispositivo (o si no hay ninguno y hay que pedirle a un adulto que lo active).
export async function getSesion(req: Request, res: Response, next: NextFunction) {
  try {
    const perfil = await estudianteService.obtenerPerfil(req.estudianteId as string);
    res.json(perfil);
  } catch (err) {
    next(err);
  }
}
