import { prisma } from '../lib/prisma';

// Estado de los niveles de un estudiante (spec.md §3, progreso y desbloqueo).
// El desbloqueo se calcula al leer, no se guarda: si se reordena o se agrega
// contenido en la base de datos, el mapa se ajusta solo.
//
// Regla: los niveles de un curso forman un recorrido único ordenado por
// (unidad.orden, nivel.orden). El primero siempre está disponible; cada uno de
// los siguientes se desbloquea cuando el anterior está completado con al menos
// su `porcentajeDesbloqueo`.

export type EstadoNivel = 'bloqueado' | 'disponible' | 'completado';

interface ProgresoParaDesbloqueo {
  completado: boolean;
  mejorPorcentaje: number;
}

export function cumpleDesbloqueo(
  progresoAnterior: ProgresoParaDesbloqueo | undefined,
  nivel: { porcentajeDesbloqueo: number },
): boolean {
  return (
    !!progresoAnterior &&
    progresoAnterior.completado &&
    progresoAnterior.mejorPorcentaje >= nivel.porcentajeDesbloqueo
  );
}

async function cargarCursoConProgreso(cursoId: string, estudianteId: string) {
  const curso = await prisma.curso.findUnique({
    where: { id: cursoId },
    select: {
      id: true,
      nombre: true,
      unidades: {
        orderBy: { orden: 'asc' },
        select: {
          id: true,
          nombre: true,
          niveles: {
            orderBy: { orden: 'asc' },
            select: {
              id: true,
              nombre: true,
              dificultad: true,
              porcentajeDesbloqueo: true,
              lecciones: { orderBy: { orden: 'asc' }, select: { id: true } },
              progresos: {
                where: { estudianteId },
                select: { completado: true, estrellas: true, mejorPorcentaje: true },
              },
            },
          },
        },
      },
    },
  });
  if (!curso) return null;

  // Lecciones con al menos una sesión completada, para que el mapa sepa cuál
  // lección del nivel sigue.
  const leccionIds = curso.unidades.flatMap((u) => u.niveles.flatMap((n) => n.lecciones.map((l) => l.id)));
  const completadas = await prisma.sesionLeccion.findMany({
    where: { estudianteId, leccionId: { in: leccionIds }, completadaEn: { not: null } },
    distinct: ['leccionId'],
    select: { leccionId: true },
  });
  const leccionesCompletadas = new Set(completadas.map((s) => s.leccionId));

  let progresoAnterior: ProgresoParaDesbloqueo | undefined;
  let esPrimero = true;

  const unidades = curso.unidades.map((unidad) => ({
    id: unidad.id,
    nombre: unidad.nombre,
    niveles: unidad.niveles.map((nivel) => {
      const progreso = nivel.progresos[0];
      const desbloqueado = esPrimero || cumpleDesbloqueo(progresoAnterior, nivel);
      const estado: EstadoNivel = progreso?.completado
        ? 'completado'
        : desbloqueado
          ? 'disponible'
          : 'bloqueado';

      esPrimero = false;
      progresoAnterior = progreso;

      return {
        id: nivel.id,
        nombre: nivel.nombre,
        dificultad: nivel.dificultad,
        estado,
        estrellas: progreso?.estrellas ?? 0,
        lecciones: nivel.lecciones.map((l) => ({ id: l.id, completada: leccionesCompletadas.has(l.id) })),
      };
    }),
  }));

  return { id: curso.id, nombre: curso.nombre, unidades };
}

export async function obtenerMapa(estudianteId: string) {
  const [cursosActivos, totales, totalesSimulacros] = await Promise.all([
    prisma.curso.findMany({ where: { activo: true }, orderBy: { orden: 'asc' }, select: { id: true } }),
    prisma.progreso.aggregate({ where: { estudianteId }, _sum: { estrellas: true, puntos: true } }),
    prisma.simulacroResultado.aggregate({ where: { estudianteId }, _sum: { puntos: true } }),
  ]);

  const cursos = await Promise.all(cursosActivos.map((c) => cargarCursoConProgreso(c.id, estudianteId)));

  return {
    totalEstrellas: totales._sum.estrellas ?? 0,
    totalPuntos: (totales._sum.puntos ?? 0) + (totalesSimulacros._sum.puntos ?? 0),
    cursos: cursos.filter((c) => c !== null),
  };
}

// Estado de un nivel puntual, para validar en el servidor que el niño no
// entre a una lección de un nivel bloqueado.
export async function obtenerEstadoNivel(estudianteId: string, nivelId: string): Promise<EstadoNivel | null> {
  const nivel = await prisma.nivel.findUnique({
    where: { id: nivelId },
    select: { unidad: { select: { cursoId: true } } },
  });
  if (!nivel) return null;

  const curso = await cargarCursoConProgreso(nivel.unidad.cursoId, estudianteId);
  const encontrado = curso?.unidades.flatMap((u) => u.niveles).find((n) => n.id === nivelId);
  return encontrado?.estado ?? null;
}

// Siguiente nivel del recorrido del curso (cruza de una unidad a la siguiente).
export async function obtenerSiguienteNivel(nivelId: string) {
  const nivel = await prisma.nivel.findUnique({
    where: { id: nivelId },
    select: { unidad: { select: { cursoId: true } } },
  });
  if (!nivel) return null;

  const niveles = await prisma.nivel.findMany({
    where: { unidad: { cursoId: nivel.unidad.cursoId } },
    orderBy: [{ unidad: { orden: 'asc' } }, { orden: 'asc' }],
    select: { id: true, nombre: true, porcentajeDesbloqueo: true },
  });
  const indice = niveles.findIndex((n) => n.id === nivelId);
  return niveles[indice + 1] ?? null;
}
