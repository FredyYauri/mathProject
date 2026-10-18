import { z } from 'zod';

// Sin estudianteId ni número de intento: el servidor toma el estudiante de la
// sesión del niño y cuenta los intentos con las respuestas ya registradas.
export const registrarRespuestaSchema = z.object({
  sesionLeccionId: z.string().uuid(),
  preguntaId: z.string().uuid(),
  opcionSeleccionadaId: z.string().uuid(),
});

export const leccionIdParamSchema = z.object({
  leccionId: z.string().uuid(),
});

export const sesionIdParamSchema = z.object({
  sesionId: z.string().uuid(),
});
