import { Router } from 'express';
import { healthRouter } from './health.routes';
import { contenidoRouter } from './contenido.routes';
import { progresoRouter } from './progreso.routes';
import { padreRouter } from './padre.routes';
import { estudianteRouter } from './estudiante.routes';
import { simulacroRouter } from './simulacro.routes';

export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/estudiante', estudianteRouter);
apiRouter.use('/contenido', contenidoRouter);
apiRouter.use('/progreso', progresoRouter);
apiRouter.use('/simulacros', simulacroRouter);
apiRouter.use('/padres', padreRouter);
