import { z } from 'zod';

export const loginPadreSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(200),
});

export const registroPadreSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  // bcrypt ignora lo que pase de 72 bytes: se rechaza en vez de truncar en silencio.
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .refine((p) => Buffer.byteLength(p, 'utf8') <= 72, 'La contraseña es demasiado larga'),
  // Declaración obligatoria: la cuenta la crea un adulto responsable del niño.
  declaroSerTutor: z.literal(true, {
    errorMap: () => ({ message: 'Debes declarar que eres mayor de edad y padre, madre o tutor legal' }),
  }),
});

// Minimización de datos (CLAUDE.md): del niño solo se guarda un nombre o apodo
// para mostrar dentro de la app.
export const crearHijoSchema = z.object({
  nombre: z.string().trim().min(1, 'Escribe un nombre o apodo').max(40),
});

export const estudianteIdParamSchema = z.object({
  estudianteId: z.string().uuid(),
});
