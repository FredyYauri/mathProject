import { Router } from 'express';
import * as contenidoController from '../controllers/contenido.controller';

export const contenidoRouter = Router();

contenidoRouter.get('/cursos', contenidoController.getCursos);
contenidoRouter.get('/unidades/:unidadId/mapa', contenidoController.getMapaUnidad);
contenidoRouter.get('/lecciones/:leccionId', contenidoController.getLeccion);
