import 'dotenv/config';
import { z } from 'zod';

// Falla rápido al arrancar si falta una variable de entorno requerida,
// en vez de descubrirlo a mitad de una request en producción.
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL es requerida'),
  CORS_ORIGIN: z.string().min(1, 'CORS_ORIGIN es requerida'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET debe tener al menos 32 caracteres'),
  JWT_EXPIRES_IN: z.string().default('1d'),
  PARENT_SESSION_COOKIE_NAME: z.string().default('parent_session'),
  // Sesión del niño en un dispositivo, activada por el padre/tutor. Dura más que
  // la del padre para que el niño no dependa de un adulto en cada uso.
  STUDENT_SESSION_COOKIE_NAME: z.string().default('student_session'),
  STUDENT_SESSION_DAYS: z.coerce.number().int().positive().default(180),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Variables de entorno inválidas:', parsed.error.flatten().fieldErrors);
  throw new Error('Configuración de entorno inválida. Revisa tu archivo .env contra .env.example.');
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === 'production';
