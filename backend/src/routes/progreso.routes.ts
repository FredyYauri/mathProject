import { Router } from 'express';
import * as progresoController from '../controllers/progreso.controller';
import { requireStudentSession } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  leccionIdParamSchema,
  registrarRespuestaSchema,
  sesionIdParamSchema,
} from '../validators/progreso.validators';

export const progresoRouter = Router();

// El progreso siempre se registra a nombre del perfil activo en el dispositivo.
progresoRouter.use(requireStudentSession);

progresoRouter.get('/mapa', progresoController.getMapa);
progresoRouter.post(
  '/lecciones/:leccionId/iniciar',
  validate({ params: leccionIdParamSchema }),
  progresoController.postIniciarLeccion,
);
progresoRouter.post(
  '/respuestas',
  validate({ body: registrarRespuestaSchema }),
  progresoController.postRespuesta,
);
progresoRouter.post(
  '/sesiones/:sesionId/completar',
  validate({ params: sesionIdParamSchema }),
  progresoController.postCompletarLeccion,
);
