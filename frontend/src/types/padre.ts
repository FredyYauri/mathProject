import type { EstadoNivel } from './progreso';

export interface Hijo {
  id: string;
  nombre: string;
  creadoEn: string;
}

// Ver backend/src/services/padre.service.ts para cómo se calcula cada estado.
export type EstadoTema = 'sin_datos' | 'reforzar' | 'en_progreso' | 'dominado';

export interface TemaHijo {
  id: string;
  nombre: string;
  estado: EstadoTema;
  porcentajeAcierto: number | null;
  niveles: Array<{ id: string; nombre: string; estado: EstadoNivel; estrellas: number }>;
}

export interface SimulacroResultadoResumen {
  id: string;
  nombre: string;
  creadoEn: string;
  puntajePorcentaje: number;
  correctas: number;
  incorrectas: number;
  sinResponder: number;
  tiempoUtilizadoSegundos: number;
  temasAReforzar: string[];
}

export interface ProgresoHijoDetalle {
  id: string;
  nombre: string;
  resumen: {
    nivelesCompletados: number;
    nivelesTotales: number;
    totalEstrellas: number;
    totalPuntos: number;
  };
  unidades: TemaHijo[];
  simulacros: SimulacroResultadoResumen[];
}
