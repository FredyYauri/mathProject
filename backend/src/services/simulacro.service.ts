import { randomInt } from 'node:crypto';
import { prisma } from '../lib/prisma';
import { HttpError } from '../middleware/errorHandler';
import { PUNTOS_POR_RESPUESTA_CORRECTA, PUNTOS_POR_SIMULACRO_COMPLETADO } from './gamificacion';

// Simulacros (spec.md §3 y §4, flujo 3): evaluación con número fijo de preguntas
// y tiempo límite. A diferencia de una lección, no hay retroalimentación por
// pregunta ni reintentos: el resultado se muestra al final.

// Una unidad se marca "a reforzar" si en el simulacro se acertó menos de esto.
const PORCENTAJE_MINIMO_DOMINIO = 70;

// Margen para respuestas que salen justo antes de la hora límite y llegan
// después por la latencia de la red.
const MARGEN_LATENCIA_MS = 5_000;

function mezclar<T>(items: T[]): T[] {
  const copia = [...items];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [copia[i], copia[j]] = [copia[j] as T, copia[i] as T];
  }
  return copia;
}

// Preguntas de los temas "ya vistos": las lecciones de los niveles que el
// estudiante completó dentro de las unidades del simulacro.
async function preguntasCandidatas(estudianteId: string, unidadesIds: string[]) {
  const preguntas = await prisma.pregunta.findMany({
    where: {
      leccion: {
        nivel: {
          unidadId: { in: unidadesIds },
          progresos: { some: { estudianteId, completado: true } },
        },
      },
    },
    select: { id: true, leccion: { select: { nivel: { select: { unidadId: true } } } } },
  });
  return preguntas.map((p) => ({ id: p.id, unidadId: p.leccion.nivel.unidadId }));
}

// Sorteo repartido: se toma una pregunta de cada unidad por turno, para que un
// tema con muchas preguntas no acapare el simulacro.
function sortearPreguntas(candidatas: Array<{ id: string; unidadId: string }>, cantidad: number): string[] {
  const porUnidad = new Map<string, string[]>();
  for (const c of candidatas) {
    porUnidad.set(c.unidadId, [...(porUnidad.get(c.unidadId) ?? []), c.id]);
  }
  const colas = mezclar([...porUnidad.values()].map((ids) => mezclar(ids)));

  const elegidas: string[] = [];
  while (elegidas.length < cantidad && colas.some((cola) => cola.length > 0)) {
    for (const cola of colas) {
      const id = cola.shift();
      if (id && elegidas.length < cantidad) elegidas.push(id);
    }
  }
  return mezclar(elegidas);
}

export async function listarSimulacros(estudianteId: string) {
  const simulacros = await prisma.simulacro.findMany({
    orderBy: { nombre: 'asc' },
    select: {
      id: true,
      nombre: true,
      duracionSegundos: true,
      numeroPreguntas: true,
      unidadesIds: true,
      resultados: {
        where: { estudianteId },
        orderBy: { creadoEn: 'desc' },
        take: 1,
        select: { puntajePorcentaje: true, creadoEn: true },
      },
    },
  });

  return Promise.all(
    simulacros.map(async (s) => {
      const candidatas = await preguntasCandidatas(estudianteId, s.unidadesIds);
      return {
        id: s.id,
        nombre: s.nombre,
        duracionSegundos: s.duracionSegundos,
        numeroPreguntas: Math.min(s.numeroPreguntas, candidatas.length),
        disponible: candidatas.length > 0,
        ultimoResultado: s.resultados[0] ?? null,
      };
    }),
  );
}

export async function iniciarSimulacro(estudianteId: string, simulacroId: string) {
  const simulacro = await prisma.simulacro.findUnique({ where: { id: simulacroId } });
  if (!simulacro) throw new HttpError(404, 'Simulacro no encontrado');

  const candidatas = await preguntasCandidatas(estudianteId, simulacro.unidadesIds);
  if (candidatas.length === 0) {
    throw new HttpError(403, 'Completa al menos un nivel de estos temas para hacer el simulacro');
  }
  const preguntasIds = sortearPreguntas(candidatas, simulacro.numeroPreguntas);

  const sesion = await prisma.sesionSimulacro.create({
    data: {
      simulacroId,
      estudianteId,
      preguntasIds,
      venceEn: new Date(Date.now() + simulacro.duracionSegundos * 1000),
    },
  });

  const preguntas = await prisma.pregunta.findMany({
    where: { id: { in: preguntasIds } },
    select: {
      id: true,
      tipo: true,
      enunciado: true,
      imagenUrl: true,
      opciones: {
        orderBy: { orden: 'asc' },
        // Sin `esCorrecta`, igual que en contenido.service.ts.
        select: { id: true, texto: true, imagenUrl: true },
      },
    },
  });
  const porId = new Map(preguntas.map((p) => [p.id, p]));

  return {
    sesionId: sesion.id,
    nombre: simulacro.nombre,
    // Segundos y no la hora: así el contador del cliente no depende de que su
    // reloj esté en hora.
    segundosRestantes: simulacro.duracionSegundos,
    preguntas: preguntasIds.map((id) => porId.get(id)).filter((p) => p !== undefined),
  };
}

async function obtenerSesionAbierta(estudianteId: string, sesionId: string) {
  const sesion = await prisma.sesionSimulacro.findFirst({ where: { id: sesionId, estudianteId } });
  if (!sesion) throw new HttpError(404, 'Simulacro no encontrado');
  if (sesion.finalizadaEn) throw new HttpError(409, 'Este simulacro ya terminó');
  return sesion;
}

// No devuelve si la respuesta fue correcta: en el simulacro todo se ve al final.
export async function registrarRespuesta(
  estudianteId: string,
  sesionId: string,
  preguntaId: string,
  opcionSeleccionadaId: string,
): Promise<void> {
  const sesion = await obtenerSesionAbierta(estudianteId, sesionId);

  if (Date.now() > sesion.venceEn.getTime() + MARGEN_LATENCIA_MS) {
    throw new HttpError(409, 'Se acabó el tiempo');
  }
  if (!sesion.preguntasIds.includes(preguntaId)) {
    throw new HttpError(400, 'La pregunta no es parte de este simulacro');
  }

  const [opcion, yaRespondida] = await Promise.all([
    prisma.opcion.findFirst({ where: { id: opcionSeleccionadaId, preguntaId }, select: { esCorrecta: true } }),
    prisma.respuestaRegistro.findFirst({ where: { sesionSimulacroId: sesionId, preguntaId }, select: { id: true } }),
  ]);
  if (!opcion) throw new HttpError(400, 'La opción no pertenece a esta pregunta');
  if (yaRespondida) throw new HttpError(409, 'Esta pregunta ya se respondió');

  await prisma.respuestaRegistro.create({
    data: {
      estudianteId,
      sesionSimulacroId: sesionId,
      preguntaId,
      esCorrecta: opcion.esCorrecta,
      numeroIntento: 1,
    },
  });
}

// Cierra el simulacro: al responder todo o al acabarse el tiempo. Lo que quedó
// sin responder no suma (spec.md §4, flujo 3: "califica solo lo respondido").
export async function finalizarSimulacro(estudianteId: string, sesionId: string) {
  const sesion = await obtenerSesionAbierta(estudianteId, sesionId);

  const [respuestas, preguntas] = await Promise.all([
    prisma.respuestaRegistro.findMany({
      where: { sesionSimulacroId: sesionId },
      select: { preguntaId: true, esCorrecta: true },
    }),
    prisma.pregunta.findMany({
      where: { id: { in: sesion.preguntasIds } },
      select: { id: true, leccion: { select: { nivel: { select: { unidadId: true } } } } },
    }),
  ]);

  const total = sesion.preguntasIds.length;
  const correctas = respuestas.filter((r) => r.esCorrecta).length;
  const incorrectas = respuestas.length - correctas;
  const sinResponder = total - respuestas.length;
  const puntajePorcentaje = total === 0 ? 0 : Math.round((correctas / total) * 100);

  // Temas a reforzar: unidades con menos del mínimo de acierto (lo no
  // respondido cuenta como no acertado).
  const correctaPorPregunta = new Map(respuestas.map((r) => [r.preguntaId, r.esCorrecta]));
  const porUnidad = new Map<string, { total: number; correctas: number }>();
  for (const p of preguntas) {
    const unidadId = p.leccion.nivel.unidadId;
    const acumulado = porUnidad.get(unidadId) ?? { total: 0, correctas: 0 };
    acumulado.total += 1;
    if (correctaPorPregunta.get(p.id)) acumulado.correctas += 1;
    porUnidad.set(unidadId, acumulado);
  }
  const unidadesAReforzarIds = [...porUnidad.entries()]
    .filter(([, a]) => (a.correctas / a.total) * 100 < PORCENTAJE_MINIMO_DOMINIO)
    .map(([unidadId]) => unidadId);

  const ahora = new Date();
  const fin = Math.min(ahora.getTime(), sesion.venceEn.getTime());
  const tiempoUtilizadoSegundos = Math.max(0, Math.round((fin - sesion.iniciadaEn.getTime()) / 1000));
  const puntos = correctas * PUNTOS_POR_RESPUESTA_CORRECTA + PUNTOS_POR_SIMULACRO_COMPLETADO;

  const resultado = await prisma.$transaction(async (tx) => {
    // Condicionado a finalizadaEn = null: si llegan dos cierres a la vez (el
    // contador y el botón), solo uno crea el resultado.
    const cerrada = await tx.sesionSimulacro.updateMany({
      where: { id: sesionId, finalizadaEn: null },
      data: { finalizadaEn: ahora },
    });
    if (cerrada.count === 0) throw new HttpError(409, 'Este simulacro ya terminó');

    return tx.simulacroResultado.create({
      data: {
        simulacroId: sesion.simulacroId,
        estudianteId,
        sesionSimulacroId: sesionId,
        puntajePorcentaje,
        correctas,
        incorrectas,
        sinResponder,
        tiempoUtilizadoSegundos,
        puntos,
        unidadesAReforzarIds,
      },
    });
  });

  const unidades = await prisma.unidad.findMany({
    where: { id: { in: unidadesAReforzarIds } },
    orderBy: { orden: 'asc' },
    select: { id: true, nombre: true },
  });

  return {
    puntajePorcentaje: resultado.puntajePorcentaje,
    correctas,
    incorrectas,
    sinResponder,
    total,
    tiempoUtilizadoSegundos,
    puntos,
    temasAReforzar: unidades,
  };
}
