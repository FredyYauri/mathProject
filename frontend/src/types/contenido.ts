export type TipoPregunta = 'SELECCION_MULTIPLE' | 'SELECCION_IMAGEN';

export interface Curso {
  id: string;
  nombre: string;
  franjaEtaria: string;
}

export interface NivelResumen {
  id: string;
  nombre: string;
  orden: number;
  dificultad: number;
}

export interface Unidad {
  id: string;
  nombre: string;
  orden: number;
  niveles: NivelResumen[];
}

// Nota: nunca incluye cuál opción es correcta — esa validación vive en el
// backend (ver backend/src/services/contenido.service.ts).
export interface OpcionPregunta {
  id: string;
  texto: string | null;
  imagenUrl: string | null;
}

export interface Pregunta {
  id: string;
  tipo: TipoPregunta;
  enunciado: string;
  imagenUrl: string | null;
  orden: number;
  opciones: OpcionPregunta[];
}

export interface Leccion {
  id: string;
  preguntas: Pregunta[];
}
