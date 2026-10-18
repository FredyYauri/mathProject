export interface ResultadoRespuesta {
  esCorrecta: boolean;
  intentosRestantes: number;
  pista: string | null;
  explicacion: string | null;
  // Solo llega cuando el niño agotó los intentos: hay que marcarla para seguir.
  opcionCorrectaId: string | null;
}

export type EstadoNivel = 'bloqueado' | 'disponible' | 'completado';

export interface NivelEnMapa {
  id: string;
  nombre: string;
  dificultad: number;
  estado: EstadoNivel;
  estrellas: number;
  lecciones: Array<{ id: string; completada: boolean }>;
}

export interface MapaAprendizaje {
  totalEstrellas: number;
  totalPuntos: number;
  cursos: Array<{
    id: string;
    nombre: string;
    unidades: Array<{ id: string; nombre: string; niveles: NivelEnMapa[] }>;
  }>;
}

export interface ResultadoLeccion {
  aciertos: number;
  total: number;
  porcentaje: number;
  puntosGanados: number;
  nivel: { completado: boolean; estrellas: number; porcentaje: number };
  nivelDesbloqueado: { id: string; nombre: string } | null;
}
