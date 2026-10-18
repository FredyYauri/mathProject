import { httpClient } from './httpClient';
import type { Hijo, ProgresoHijoDetalle } from '../types/padre';

export async function loginPadre(email: string, password: string): Promise<void> {
  await httpClient.post('/padres/login', { email, password });
}

// Crea la cuenta y deja la sesión del padre abierta.
export async function registrarPadre(email: string, password: string, declaroSerTutor: boolean): Promise<void> {
  await httpClient.post('/padres/registro', { email, password, declaroSerTutor });
}

export async function crearHijo(nombre: string): Promise<Hijo> {
  const { data } = await httpClient.post<Hijo>('/padres/hijos', { nombre });
  return data;
}

export async function haySesionActiva(): Promise<boolean> {
  try {
    await httpClient.get('/padres/sesion');
    return true;
  } catch {
    return false;
  }
}

export async function logoutPadre(): Promise<void> {
  await httpClient.post('/padres/logout');
}

export async function obtenerHijos(): Promise<Hijo[]> {
  const { data } = await httpClient.get<Hijo[]>('/padres/hijos');
  return data;
}

// Deja el dispositivo en "modo niño" con el perfil de este hijo. El backend
// cierra además la sesión del padre en el mismo paso.
export async function activarPerfilEnDispositivo(estudianteId: string): Promise<void> {
  await httpClient.post(`/padres/hijos/${estudianteId}/dispositivo`);
}

export async function quitarPerfilDelDispositivo(): Promise<void> {
  await httpClient.delete('/padres/dispositivo');
}

export async function obtenerProgresoHijo(estudianteId: string): Promise<ProgresoHijoDetalle> {
  const { data } = await httpClient.get<ProgresoHijoDetalle>(
    `/padres/hijos/${estudianteId}/progreso`,
  );
  return data;
}
