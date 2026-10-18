import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import pinoHttp from 'pino-http';
import { env } from './config/env';
import { httpLogSerializers, logger } from './lib/logger';
import { apiLimiter } from './middleware/rateLimiters';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { apiRouter } from './routes';

export function createApp() {
  const app = express();

  // Solo los proxies que de verdad hay delante (TRUST_PROXY): así rate-limit y
  // cookies "secure" ven la IP/protocolo reales sin aceptar un X-Forwarded-For
  // inventado por el cliente.
  app.set('trust proxy', env.TRUST_PROXY);

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true, // requerido para que la cookie de sesión del padre viaje
    }),
  );
  app.use(compression());
  app.use(cookieParser());
  app.use(express.json({ limit: '100kb' })); // límite bajo: esta API no recibe archivos
  app.use(pinoHttp({ logger, serializers: httpLogSerializers }));
  app.use(apiLimiter);

  app.use('/api', apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
