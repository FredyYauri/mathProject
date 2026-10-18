import { Router } from 'express';
import * as simulacroController from '../controllers/simulacro.controller';
import { requireStudentSession } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  responderSimulacroSchema,
  sesionIdParamSchema,
  simulacroIdParamSchema,
} from '../validators/simulacro.validators';

export const simulacroRouter = Router();

// Experiencia del niño: siempre a nombre del perfil activo en el dispositivo.
simulacroRouter.use(requireStudentSession);

simulacroRouter.get('/', simulacroController.getSimulacros);
simulacroRouter.post(
  '/:simulacroId/iniciar',
  validate({ params: simulacroIdParamSchema }),
  simulacroController.postIniciar,
);
simulacroRouter.post(
  '/sesiones/:sesionId/respuestas',
  validate({ params: sesionIdParamSchema, body: responderSimulacroSchema }),
  simulacroController.postRespuesta,
);
simulacroRouter.post(
  '/sesiones/:sesionId/finalizar',
  validate({ params: sesionIdParamSchema }),
  simulacroController.postFinalizar,
);
