import 'dotenv/config';
import { z } from 'zod';

const SECRETO_DE_EJEMPLO = 'cambia-este-valor-por-un-secreto-largo-y-aleatorio';

// Falla rápido al arrancar si falta una variable de entorno requerida,
// en vez de descubrirlo a mitad de una request en producción.
export const envSchema = z
  .object({
    // Sin default a propósito: si faltara en el despliegue, producción correría
    // como desarrollo (cookies sin `secure`, errores con detalle interno).
    NODE_ENV: z.enum(['development', 'test', 'production'], {
      errorMap: () => ({ message: 'NODE_ENV es requerida: development, test o production' }),
    }),
    PORT: z.coerce.number().int().positive().default(3001),
    DATABASE_URL: z.string().min(1, 'DATABASE_URL es requerida'),
    CORS_ORIGIN: z.string().min(1, 'CORS_ORIGIN es requerida'),
    // Cantidad de proxies delante de la API ("false" = ninguno). Si se confía en
    // más proxies de los que hay, el cliente elige su IP con X-Forwarded-For y
    // se salta el rate limit. Nunca "true" (confiar en cualquier salto).
    TRUST_PROXY: z
      .string()
      .regex(/^(false|\d+)$/, 'TRUST_PROXY debe ser "false" o la cantidad de proxies (ej. 1)')
      .default('false')
      .transform((v) => (v === 'false' ? false : Number(v))),
    JWT_SECRET: z
      .string()
      .min(32, 'JWT_SECRET debe tener al menos 32 caracteres')
      // El de .env.example es público: copiarlo tal cual dejaría firmar sesiones a cualquiera.
      .refine((s) => s !== SECRETO_DE_EJEMPLO, 'JWT_SECRET sigue con el valor de .env.example')
      // Una cadena repetida ("aaaa...") cumple el largo pero no es aleatoria.
      .refine((s) => new Set(s).size >= 10, 'JWT_SECRET no parece aleatorio: genera uno con `openssl rand -hex 32`'),
    // Una sola duración para el JWT y la cookie del padre, para que no se desfasen.
    PARENT_SESSION_HOURS: z.coerce.number().int().positive().max(24 * 7).default(24),
    PARENT_SESSION_COOKIE_NAME: z.string().default('parent_session'),
    // Sesión del niño en un dispositivo, activada por el padre/tutor. Dura más que
    // la del padre para que el niño no dependa de un adulto en cada uso.
    STUDENT_SESSION_COOKIE_NAME: z.string().default('student_session'),
    STUDENT_SESSION_DAYS: z.coerce.number().int().positive().default(180),
  })
  // En producción las cookies son `secure`: con un frontend en http el
  // navegador no las enviaría, así que se exige https en vez de desactivarlas.
  .refine((e) => e.NODE_ENV !== 'production' || e.CORS_ORIGIN.startsWith('https://'), {
    message: 'En producción CORS_ORIGIN debe usar https://',
    path: ['CORS_ORIGIN'],
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Variables de entorno inválidas:', parsed.error.flatten().fieldErrors);
  throw new Error('Configuración de entorno inválida. Revisa tu archivo .env contra .env.example.');
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === 'production';
