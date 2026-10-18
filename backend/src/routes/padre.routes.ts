import { Router } from 'express';
import * as padreController from '../controllers/padre.controller';
import { requireParentAuth } from '../middleware/auth';
import { loginLimiter, registroLimiter } from '../middleware/rateLimiters';
import { validate } from '../middleware/validate';
import {
  crearHijoSchema,
  estudianteIdParamSchema,
  loginPadreSchema,
  registroPadreSchema,
} from '../validators/padre.validators';

export const padreRouter = Router();

// Rutas públicas de autenticación (con rate limit propio contra fuerza bruta).
padreRouter.post('/login', loginLimiter, validate({ body: loginPadreSchema }), padreController.postLogin);
padreRouter.post(
  '/registro',
  registroLimiter,
  validate({ body: registroPadreSchema }),
  padreController.postRegistro,
);
padreRouter.post('/logout', padreController.postLogout);

// A partir de aquí, todas las rutas requieren sesión de padre/tutor válida.
// Este router se monta separado del de contenido/progreso del niño a propósito
// (ver spec.md §3 y CLAUDE.md, separación niño/padre).
padreRouter.use(requireParentAuth);

padreRouter.get('/sesion', padreController.getSesion);
padreRouter.get('/hijos', padreController.getHijos);
padreRouter.post('/hijos', validate({ body: crearHijoSchema }), padreController.postHijo);
padreRouter.get(
  '/hijos/:estudianteId/progreso',
  validate({ params: estudianteIdParamSchema }),
  padreController.getProgresoHijo,
);
padreRouter.post(
  '/hijos/:estudianteId/dispositivo',
  validate({ params: estudianteIdParamSchema }),
  padreController.postActivarPerfilEnDispositivo,
);
padreRouter.delete('/dispositivo', padreController.deletePerfilDelDispositivo);
