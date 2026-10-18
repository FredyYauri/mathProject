import rateLimit from 'express-rate-limit';

// Límite general de la API — mitiga abuso/DoS básico a nivel de aplicación.
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

// Registro abierto de padres/tutores — mitiga la creación masiva de cuentas
// y el sondeo de qué correos ya están registrados.
export const registroLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados registros desde esta conexión. Intenta más tarde.' },
});

// Límite estricto para login del padre/tutor — mitiga fuerza bruta de credenciales.
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Intenta nuevamente en unos minutos.' },
});
