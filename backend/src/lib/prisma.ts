import { PrismaClient } from '@prisma/client';
import { env, isProduction } from '../config/env';

// Singleton: evita agotar el pool de conexiones por recrear el cliente
// en cada hot-reload durante desarrollo.
declare global {
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ??
  new PrismaClient({
    // En tests, sin logs: los errores esperados (ej. correo duplicado → 409)
    // ensuciarían la salida.
    log: env.NODE_ENV === 'test' ? [] : ['error', 'warn'],
  });

if (!isProduction) {
  global.__prisma = prisma;
}
