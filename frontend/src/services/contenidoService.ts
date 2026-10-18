import { httpClient } from './httpClient';
import type { Curso, Leccion, Unidad } from '../types/contenido';

export async function obtenerCursos(): Promise<Curso[]> {
  const { data } = await httpClient.get<Curso[]>('/contenido/cursos');
  return data;
}

export async function obtenerMapaUnidad(unidadId: string): Promise<Unidad> {
  const { data } = await httpClient.get<Unidad>(`/contenido/unidades/${unidadId}/mapa`);
  return data;
}

export async function obtenerLeccion(leccionId: string): Promise<Leccion> {
  const { data } = await httpClient.get<Leccion>(`/contenido/lecciones/${leccionId}`);
  return data;
}
