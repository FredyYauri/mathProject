import pino from 'pino';
import { env, isProduction } from '../config/env';

const isTest = env.NODE_ENV === 'test';

// El producto está dirigido a menores de edad: nunca loguear el body completo
// de requests ni campos que puedan contener datos personales del niño.
// En tests va en silencio para que la salida muestre solo los resultados.
export const logger = pino({
  level: isTest ? 'silent' : isProduction ? 'info' : 'debug',
  redact: {
    // Respaldo por si algún log arma su propio objeto req/res: los de cada
    // request ya salen sin cabeceras (httpLogSerializers).
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'res.headers["set-cookie"]',
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

interface SerializedReq {
  id?: unknown;
  method?: string;
  url?: string;
}

// Log de cada request (pino-http) con lo mínimo para depurar. Sin cabeceras:
// la respuesta lleva el JWT de sesión en Set-Cookie y la request la cookie.
// Sin IP ni user-agent (son datos personales, aquí de menores) ni query string.
export const httpLogSerializers = {
  req: (req: SerializedReq) => ({ id: req.id, method: req.method, url: req.url?.split('?')[0] }),
  res: (res: { statusCode?: number | null }) => ({ statusCode: res.statusCode }),
};
