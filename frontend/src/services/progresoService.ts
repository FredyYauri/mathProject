import { httpClient } from './httpClient';
import type { MapaAprendizaje, ResultadoLeccion, ResultadoRespuesta } from '../types/progreso';

// Sin estudianteId en ninguna llamada: el backend lo toma de la sesión del niño
// en el dispositivo. Los intentos también los cuenta el backend.

export async function obtenerMapa(): Promise<MapaAprendizaje> {
  const { data } = await httpClient.get<MapaAprendizaje>('/progreso/mapa');
  return data;
}

export async function iniciarLeccion(leccionId: string): Promise<{ sesionId: string }> {
  const { data } = await httpClient.post<{ sesionId: string }>(`/progreso/lecciones/${leccionId}/iniciar`);
  return data;
}

interface RegistrarRespuestaInput {
  sesionLeccionId: string;
  preguntaId: string;
  opcionSeleccionadaId: string;
}

export async function registrarRespuesta(
  input: RegistrarRespuestaInput,
): Promise<ResultadoRespuesta> {
  const { data } = await httpClient.post<ResultadoRespuesta>('/progreso/respuestas', input);
  return data;
}

export async function completarLeccion(sesionId: string): Promise<ResultadoLeccion> {
  const { data } = await httpClient.post<ResultadoLeccion>(`/progreso/sesiones/${sesionId}/completar`);
  return data;
}
