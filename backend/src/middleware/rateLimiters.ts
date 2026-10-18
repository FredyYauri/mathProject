import rateLimit from 'express-rate-limit';
import { LimiteTasaStore } from '../services/limiteTasa.service';

// Los contadores viven en Postgres (LimiteTasaStore), no en memoria: con varias
// instancias o en serverless (Vercel) un contador en memoria no limita nada.

// Límite general de la API — mitiga abuso/DoS básico a nivel de aplicación.
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  store: new LimiteTasaStore('api'),
  // El health check no cuenta ni depende de la base: lo consultan monitores y
  // el e2e antes de que existan las tablas.
  skip: (req) => req.path === '/api/health',
});

// Registro abierto de padres/tutores — mitiga la creación masiva de cuentas
// y el sondeo de qué correos ya están registrados.
export const registroLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados registros desde esta conexión. Intenta más tarde.' },
  store: new LimiteTasaStore('registro'),
});

// Límite estricto para login del padre/tutor — mitiga fuerza bruta de credenciales.
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Intenta nuevamente en unos minutos.' },
  store: new LimiteTasaStore('login'),
});
