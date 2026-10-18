import type { Request, Response, NextFunction } from 'express';
import * as contenidoService from '../services/contenido.service';

export async function getCursos(_req: Request, res: Response, next: NextFunction) {
  try {
    const cursos = await contenidoService.listarCursosActivos();
    res.json(cursos);
  } catch (err) {
    next(err);
  }
}

export async function getMapaUnidad(req: Request, res: Response, next: NextFunction) {
  try {
    const unidad = await contenidoService.obtenerMapaDeUnidad(req.params.unidadId as string);
    res.json(unidad);
  } catch (err) {
    next(err);
  }
}

export async function getLeccion(req: Request, res: Response, next: NextFunction) {
  try {
    const leccion = await contenidoService.obtenerLeccionParaJugar(req.params.leccionId as string);
    res.json(leccion);
  } catch (err) {
    next(err);
  }
}
