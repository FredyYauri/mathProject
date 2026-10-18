import type { OpcionPregunta } from '../../types/contenido';

// En las opciones con imagen el texto ("3 estrellas") queda solo como texto
// alternativo: si se viera, el niño leería la respuesta en vez de contar.
export function ContenidoOpcion({ opcion }: { opcion: OpcionPregunta }) {
  if (!opcion.imagenUrl) return <>{opcion.texto}</>;
  return <img src={opcion.imagenUrl} alt={opcion.texto ?? ''} />;
}
