import { isAxiosError } from 'axios';
import { httpClient } from './httpClient';
import type { PerfilEstudiante } from '../types/estudiante';

// null = no hay perfil activo en este dispositivo (o expiró). Cualquier otro
// error (red, servidor caído) se propaga para no confundirlo con "sin perfil".
export async function obtenerPerfilActivo(): Promise<PerfilEstudiante | null> {
  try {
    const { data } = await httpClient.get<PerfilEstudiante>('/estudiante/sesion');
    return data;
  } catch (err) {
    if (isAxiosError(err) && err.response?.status === 401) return null;
    throw err;
  }
}
