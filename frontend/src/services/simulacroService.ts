import { httpClient } from './httpClient';
import type { ResultadoSimulacro, SesionSimulacro, SimulacroResumen } from '../types/simulacro';

export async function listarSimulacros(): Promise<SimulacroResumen[]> {
  const { data } = await httpClient.get<SimulacroResumen[]>('/simulacros');
  return data;
}

export async function iniciarSimulacro(simulacroId: string): Promise<SesionSimulacro> {
  const { data } = await httpClient.post<SesionSimulacro>(`/simulacros/${simulacroId}/iniciar`);
  return data;
}

export async function responderSimulacro(
  sesionId: string,
  preguntaId: string,
  opcionSeleccionadaId: string,
): Promise<void> {
  await httpClient.post(`/simulacros/sesiones/${sesionId}/respuestas`, { preguntaId, opcionSeleccionadaId });
}

export async function finalizarSimulacro(sesionId: string): Promise<ResultadoSimulacro> {
  const { data } = await httpClient.post<ResultadoSimulacro>(`/simulacros/sesiones/${sesionId}/finalizar`);
  return data;
}
