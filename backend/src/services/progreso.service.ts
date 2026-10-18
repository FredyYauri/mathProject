import { prisma } from '../lib/prisma';
import { HttpError } from '../middleware/errorHandler';
import { cumpleDesbloqueo, obtenerEstadoNivel, obtenerSiguienteNivel } from './mapa.service';
import {
  PUNTOS_POR_LECCION_COMPLETADA,
  PUNTOS_POR_NIVEL_COMPLETADO,
  PUNTOS_POR_RESPUESTA_CORRECTA,
  calcularEstrellas,
} from './gamificacion';

// Empieza una partida de la lección. Valida en el servidor que el nivel esté
// desbloqueado: el frontend solo oculta el botón, no es la barrera real.
export async function iniciarLeccion(estudianteId: string, leccionId: string) {
  const leccion = await prisma.leccion.findUnique({ where: { id: leccionId }, select: { nivelId: true } });
  if (!leccion) throw new HttpError(404, 'Lección no encontrada');

  const estado = await obtenerEstadoNivel(estudianteId, leccion.nivelId);
  if (estado === 'bloqueado' || estado === null) {
    throw new HttpError(403, 'Este nivel todavía está bloqueado');
  }

  const sesion = await prisma.sesionLeccion.create({
    data: { estudianteId, leccionId },
    select: { id: true },
  });
  return { sesionId: sesion.id };
}

interface RegistrarRespuestaInput {
  estudianteId: string;
  sesionLeccionId: string;
  preguntaId: string;
  opcionSeleccionadaId: string;
}

interface ResultadoRespuesta {
  esCorrecta: boolean;
  intentosRestantes: number;
  pista: string | null;
  explicacion: string | null;
  // Solo al agotar los intentos sin acertar. Es la única vez que el servidor
  // revela la opción correcta (ver contenido.service.ts).
  opcionCorrectaId: string | null;
}

// Valida la respuesta en el servidor (nunca confiar en el cliente para saber
// si una respuesta es correcta) y deja registro para detectar temas a reforzar.
// Los intentos también los cuenta el servidor, a partir de las respuestas ya
// registradas en esta sesión (spec.md §3, configuración de intentos).
export async function registrarRespuesta(input: RegistrarRespuestaInput): Promise<ResultadoRespuesta> {
  const [sesion, pregunta, previas] = await Promise.all([
    prisma.sesionLeccion.findFirst({
      where: { id: input.sesionLeccionId, estudianteId: input.estudianteId },
      select: { leccionId: true, completadaEn: true },
    }),
    prisma.pregunta.findUnique({ where: { id: input.preguntaId }, include: { opciones: true } }),
    prisma.respuestaRegistro.findMany({
      where: { sesionLeccionId: input.sesionLeccionId, preguntaId: input.preguntaId },
      select: { esCorrecta: true },
    }),
  ]);

  if (!sesion) throw new HttpError(404, 'Sesión de lección no encontrada');
  if (sesion.completadaEn) throw new HttpError(409, 'Esta lección ya se completó');
  if (!pregunta) throw new HttpError(404, 'Pregunta no encontrada');
  if (pregunta.leccionId !== sesion.leccionId) {
    throw new HttpError(400, 'La pregunta no pertenece a esta lección');
  }
  if (previas.some((r) => r.esCorrecta)) throw new HttpError(409, 'Esta pregunta ya se respondió');

  const opcionSeleccionada = pregunta.opciones.find((o) => o.id === input.opcionSeleccionadaId);
  if (!opcionSeleccionada) throw new HttpError(400, 'La opción no pertenece a esta pregunta');

  const esCorrecta = opcionSeleccionada.esCorrecta;
  const numeroIntento = previas.length + 1;

  await prisma.respuestaRegistro.create({
    data: {
      estudianteId: input.estudianteId,
      sesionLeccionId: input.sesionLeccionId,
      preguntaId: input.preguntaId,
      esCorrecta,
      numeroIntento,
    },
  });

  if (esCorrecta) {
    return { esCorrecta, intentosRestantes: 0, pista: null, explicacion: pregunta.explicacion, opcionCorrectaId: null };
  }

  // Al agotar los intentos (y en cada error posterior mientras no marque la
  // correcta) se revela la respuesta: el niño debe marcarla para continuar.
  const errores = numeroIntento;
  const maxIntentos = Math.max(1, pregunta.maxIntentos);
  const intentosRestantes = Math.max(0, maxIntentos - errores);
  const agotados = intentosRestantes === 0;
  const opcionCorrecta = pregunta.opciones.find((o) => o.esCorrecta);

  return {
    esCorrecta,
    intentosRestantes,
    pista: errores >= pregunta.pistaDesdeError ? pregunta.pista : null,
    explicacion: agotados ? pregunta.explicacion : null,
    opcionCorrectaId: agotados ? (opcionCorrecta?.id ?? null) : null,
  };
}

// Cierra la partida: calcula el resultado con las respuestas registradas en esta
// sesión (no con lo que diga el cliente), actualiza el progreso del nivel y
// evalúa si se desbloquea el siguiente (spec.md §4, flujo 1, paso 5).
export async function completarLeccion(estudianteId: string, sesionId: string) {
  const sesion = await prisma.sesionLeccion.findFirst({
    where: { id: sesionId, estudianteId },
    select: {
      completadaEn: true,
      leccion: {
        select: {
          id: true,
          nivelId: true,
          nivel: { select: { lecciones: { select: { id: true } } } },
          preguntas: { select: { id: true } },
        },
      },
      respuestas: { orderBy: { creadoEn: 'asc' }, select: { preguntaId: true, esCorrecta: true } },
    },
  });

  if (!sesion) throw new HttpError(404, 'Sesión de lección no encontrada');
  if (sesion.completadaEn) throw new HttpError(409, 'Esta lección ya se completó');

  const { leccion } = sesion;
  const total = leccion.preguntas.length;
  if (total === 0) throw new HttpError(400, 'La lección no tiene preguntas');

  // Acierto = la primera respuesta a esa pregunta fue correcta. Para cerrar la
  // lección cada pregunta tiene que haber llegado a una respuesta correcta.
  let aciertos = 0;
  for (const { id } of leccion.preguntas) {
    const respuestas = sesion.respuestas.filter((r) => r.preguntaId === id);
    if (!respuestas.some((r) => r.esCorrecta)) {
      throw new HttpError(400, 'Faltan preguntas por responder');
    }
    if (respuestas[0]?.esCorrecta) aciertos += 1;
  }
  const porcentaje = Math.round((aciertos / total) * 100);

  const siguiente = await obtenerSiguienteNivel(leccion.nivelId);

  return prisma.$transaction(async (tx) => {
    // Condicionado a completadaEn = null: si llegan dos cierres a la vez (doble
    // clic), solo uno suma puntos.
    const cerrada = await tx.sesionLeccion.updateMany({
      where: { id: sesionId, completadaEn: null },
      data: { completadaEn: new Date(), porcentaje },
    });
    if (cerrada.count === 0) throw new HttpError(409, 'Esta lección ya se completó');

    // % del nivel = promedio del mejor resultado de cada una de sus lecciones
    // (las que aún no se completaron cuentan como 0).
    const leccionIds = leccion.nivel.lecciones.map((l) => l.id);
    const mejores = await tx.sesionLeccion.groupBy({
      by: ['leccionId'],
      where: { estudianteId, leccionId: { in: leccionIds }, completadaEn: { not: null } },
      _max: { porcentaje: true },
    });
    const nivelCompleto = mejores.length === leccionIds.length;
    const porcentajeNivel = Math.round(
      mejores.reduce((suma, m) => suma + (m._max.porcentaje ?? 0), 0) / leccionIds.length,
    );

    const anterior = await tx.progreso.findUnique({
      where: { estudianteId_nivelId: { estudianteId, nivelId: leccion.nivelId } },
    });
    const nivelCompletadoPorPrimeraVez = nivelCompleto && !anterior?.completado;

    const puntosGanados =
      aciertos * PUNTOS_POR_RESPUESTA_CORRECTA +
      PUNTOS_POR_LECCION_COMPLETADA +
      (nivelCompletadoPorPrimeraVez ? PUNTOS_POR_NIVEL_COMPLETADO : 0);

    const datos = {
      completado: nivelCompleto || (anterior?.completado ?? false),
      estrellas: Math.max(anterior?.estrellas ?? 0, nivelCompleto ? calcularEstrellas(porcentajeNivel) : 0),
      mejorPorcentaje: Math.max(anterior?.mejorPorcentaje ?? 0, porcentajeNivel),
    };

    const progreso = await tx.progreso.upsert({
      where: { estudianteId_nivelId: { estudianteId, nivelId: leccion.nivelId } },
      create: { estudianteId, nivelId: leccion.nivelId, ...datos, puntos: puntosGanados, intentos: 1 },
      update: { ...datos, puntos: { increment: puntosGanados }, intentos: { increment: 1 } },
    });

    const nivelDesbloqueado =
      siguiente && cumpleDesbloqueo(progreso, siguiente) && !cumpleDesbloqueo(anterior ?? undefined, siguiente)
        ? { id: siguiente.id, nombre: siguiente.nombre }
        : null;

    return {
      aciertos,
      total,
      porcentaje,
      puntosGanados,
      nivel: {
        completado: progreso.completado,
        estrellas: progreso.estrellas,
        porcentaje: porcentajeNivel,
      },
      nivelDesbloqueado,
    };
  });
}
