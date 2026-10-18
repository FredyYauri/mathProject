import { prisma } from '../lib/prisma';
import { HttpError } from '../middleware/errorHandler';

// Lectura de contenido para el niño. v1 no tiene panel administrativo: el
// contenido se carga directo a la base de datos (ver spec.md §3 y §5).
// Importante: nunca incluir `esCorrecta` de las opciones en la respuesta al
// cliente — eso permitiría a un niño ver la respuesta correcta inspeccionando
// la red del navegador. La validación de la respuesta vive en el backend
// (progreso.service.ts), no en el frontend; la única vez que se revela la
// opción correcta es allí, cuando el niño ya agotó sus intentos.

export async function listarCursosActivos() {
  return prisma.curso.findMany({
    where: { activo: true },
    orderBy: { orden: 'asc' },
    select: { id: true, nombre: true, franjaEtaria: true },
  });
}

export async function obtenerMapaDeUnidad(unidadId: string) {
  const unidad = await prisma.unidad.findUnique({
    where: { id: unidadId },
    include: {
      niveles: {
        orderBy: { orden: 'asc' },
        select: { id: true, nombre: true, orden: true, dificultad: true },
      },
    },
  });

  if (!unidad) throw new HttpError(404, 'Unidad no encontrada');
  return unidad;
}

export async function obtenerLeccionParaJugar(leccionId: string) {
  const leccion = await prisma.leccion.findUnique({
    where: { id: leccionId },
    include: {
      preguntas: {
        orderBy: { orden: 'asc' },
        select: {
          id: true,
          tipo: true,
          enunciado: true,
          imagenUrl: true,
          orden: true,
          opciones: {
            orderBy: { orden: 'asc' },
            // Deliberadamente sin `esCorrecta` — ver nota arriba.
            select: { id: true, texto: true, imagenUrl: true },
          },
        },
      },
    },
  });

  if (!leccion) throw new HttpError(404, 'Lección no encontrada');
  return leccion;
}
