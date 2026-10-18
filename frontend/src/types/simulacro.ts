import type { Pregunta } from './contenido';

export interface SimulacroResumen {
  id: string;
  nombre: string;
  duracionSegundos: number;
  numeroPreguntas: number;
  // false si el niño todavía no completó ningún nivel de estos temas.
  disponible: boolean;
  ultimoResultado: { puntajePorcentaje: number; creadoEn: string } | null;
}

export interface SesionSimulacro {
  sesionId: string;
  nombre: string;
  segundosRestantes: number;
  preguntas: Array<Omit<Pregunta, 'orden'>>;
}

export interface ResultadoSimulacro {
  puntajePorcentaje: number;
  correctas: number;
  incorrectas: number;
  sinResponder: number;
  total: number;
  tiempoUtilizadoSegundos: number;
  puntos: number;
  temasAReforzar: Array<{ id: string; nombre: string }>;
}
