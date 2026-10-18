import { useOutletContext } from 'react-router-dom';
import type { PerfilEstudiante } from '../../types/estudiante';

// Perfil activo, provisto por RutaEstudiante. Solo usar en páginas montadas
// debajo de ese guard.
export function usePerfilEstudiante(): PerfilEstudiante {
  return useOutletContext<PerfilEstudiante>();
}
