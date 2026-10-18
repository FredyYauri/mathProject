import pino from 'pino';
import { env, isProduction } from '../config/env';

const isTest = env.NODE_ENV === 'test';

// El producto está dirigido a menores de edad: nunca loguear el body completo
// de requests ni campos que puedan contener datos personales del niño.
// En tests va en silencio para que la salida muestre solo los resultados.
export const logger = pino({
  level: isTest ? 'silent' : isProduction ? 'info' : 'debug',
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      '*.password',
      '*.passwordHash',
      '*.email',
    ],
    censor: '[REDACTADO]',
  },
  ...(isProduction || isTest
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:standard' },
        },
      }),
});
