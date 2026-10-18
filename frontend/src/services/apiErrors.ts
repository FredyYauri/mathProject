import { isAxiosError } from 'axios';

interface ErrorApi {
  error?: string;
  detalles?: { fieldErrors?: Record<string, string[] | undefined> };
}

// Mensaje legible de un error de la API: el primero de validación (zod) si lo
// hay, si no el mensaje general, si no el de respaldo.
export function mensajeDeError(err: unknown, respaldo: string): string {
  if (!isAxiosError<ErrorApi>(err) || !err.response) return respaldo;
  const { error, detalles } = err.response.data ?? {};
  const deCampo = Object.values(detalles?.fieldErrors ?? {}).flat()[0];
  return deCampo ?? error ?? respaldo;
}
