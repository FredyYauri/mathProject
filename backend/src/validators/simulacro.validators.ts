import { z } from 'zod';

export const simulacroIdParamSchema = z.object({
  simulacroId: z.string().uuid(),
});

export const sesionIdParamSchema = z.object({
  sesionId: z.string().uuid(),
});

export const responderSimulacroSchema = z.object({
  preguntaId: z.string().uuid(),
  opcionSeleccionadaId: z.string().uuid(),
});
