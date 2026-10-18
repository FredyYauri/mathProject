import { beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../src/lib/prisma';
import { api, cookieNino, jugarNivel } from './helpers/api';
import { crearContenido, crearFamilia, limpiarBase, type Contenido, type NivelFixture } from './helpers/db';

// Simulacros (spec.md §3 y §4, flujo 3).

interface Sesion {
  sesionId: string;
  segundosRestantes: number;
  preguntas: Array<{ id: string }>;
}
interface Resultado {
  puntajePorcentaje: number;
  correctas: number;
  incorrectas: number;
  sinResponder: number;
  total: number;
  tiempoUtilizadoSegundos: number;
  puntos: number;
  temasAReforzar: Array<{ id: string; nombre: string }>;
}

interface InfoPregunta {
  correcta: string;
  incorrecta: string;
  unidad: 'A' | 'B';
}

let contenido: Contenido;
let cookie: string;
// Las preguntas del simulacro llegan sorteadas: este índice da su respuesta y unidad.
let todas: Map<string, InfoPregunta>;

beforeEach(async () => {
  await limpiarBase();
  contenido = await crearContenido();
  const { hijo } = await crearFamilia();
  cookie = cookieNino(hijo.id);
  const { a1, a2, b1 } = contenido.niveles;
  const entradas = (nivel: NivelFixture, unidad: 'A' | 'B') =>
    nivel.preguntas.map((p): [string, InfoPregunta] => [p.id, { ...p, unidad }]);
  todas = new Map([...entradas(a1, 'A'), ...entradas(a2, 'A'), ...entradas(b1, 'B')]);
});

const listar = async () =>
  (await api().get('/api/simulacros').set('Cookie', cookie)).body as Array<{
    disponible: boolean;
    numeroPreguntas: number;
  }>;
const iniciar = async () => {
  const res = await api().post(`/api/simulacros/${contenido.simulacro.id}/iniciar`).set('Cookie', cookie);
  return { status: res.status, raw: JSON.stringify(res.body), sesion: res.body as Sesion };
};
const responder = (sesionId: string, preguntaId: string, opcion: string) =>
  api()
    .post(`/api/simulacros/sesiones/${sesionId}/respuestas`)
    .set('Cookie', cookie)
    .send({ preguntaId, opcionSeleccionadaId: opcion });
const finalizar = (sesionId: string) =>
  api().post(`/api/simulacros/sesiones/${sesionId}/finalizar`).set('Cookie', cookie);

describe('disponibilidad', () => {
  it('sin niveles completados no está disponible', async () => {
    expect((await listar())[0]).toMatchObject({ disponible: false, numeroPreguntas: 0 });
    expect((await iniciar()).status).toBe(403);
  });

  it('usa solo preguntas de los niveles ya completados', async () => {
    await jugarNivel(cookie, contenido.niveles.a1);
    expect((await listar())[0]).toMatchObject({ disponible: true, numeroPreguntas: 4 });

    const { sesion, raw } = await iniciar();
    const deA1 = new Set(contenido.niveles.a1.preguntas.map((p) => p.id));
    expect(sesion.preguntas.every((p) => deA1.has(p.id))).toBe(true);
    expect(sesion.segundosRestantes).toBe(300);
    expect(raw).not.toContain('esCorrecta');
  });

  it('reparte las preguntas entre unidades y no las repite', async () => {
    await jugarNivel(cookie, contenido.niveles.a1);
    await jugarNivel(cookie, contenido.niveles.a2);
    await jugarNivel(cookie, contenido.niveles.b1);
    const { sesion } = await iniciar();
    expect(sesion.preguntas).toHaveLength(6);
    expect(new Set(sesion.preguntas.map((p) => p.id)).size).toBe(6);
    const porUnidad = sesion.preguntas.map((p) => todas.get(p.id)!.unidad);
    expect(porUnidad.filter((u) => u === 'A')).toHaveLength(3);
    expect(porUnidad.filter((u) => u === 'B')).toHaveLength(3);
  });
});

describe('respuestas y resultado', () => {
  beforeEach(async () => {
    await jugarNivel(cookie, contenido.niveles.a1);
  });

  it('no dice si la respuesta fue correcta (se ve al final)', async () => {
    const { sesion } = await iniciar();
    const p = sesion.preguntas[0]!;
    const res = await responder(sesion.sesionId, p.id, todas.get(p.id)!.correcta);
    expect(res.status).toBe(204);
    expect(res.text).toBe('');
  });

  it('califica, suma puntos y marca temas a reforzar', async () => {
    const { sesion } = await iniciar();
    const [p0, p1, p2] = sesion.preguntas as [{ id: string }, { id: string }, { id: string }];
    await responder(sesion.sesionId, p0.id, todas.get(p0.id)!.correcta);
    await responder(sesion.sesionId, p1.id, todas.get(p1.id)!.correcta);
    await responder(sesion.sesionId, p2.id, todas.get(p2.id)!.incorrecta);

    const res = await finalizar(sesion.sesionId);
    expect(res.body).toMatchObject({
      puntajePorcentaje: 50,
      correctas: 2,
      incorrectas: 1,
      sinResponder: 1,
      total: 4,
      puntos: 2 * 10 + 50,
      temasAReforzar: [{ id: contenido.unidadA.id, nombre: 'Unidad A' }],
    } satisfies Partial<Resultado>);
  });

  it('rechaza respuestas repetidas, ajenas o después de terminar', async () => {
    const { sesion } = await iniciar();
    const p = sesion.preguntas[0]!;
    const { correcta } = todas.get(p.id)!;
    await responder(sesion.sesionId, p.id, correcta);
    expect((await responder(sesion.sesionId, p.id, correcta)).status).toBe(409);

    const ajena = contenido.niveles.b1.preguntas[0]!;
    expect((await responder(sesion.sesionId, ajena.id, ajena.correcta)).status).toBe(400);

    await finalizar(sesion.sesionId);
    expect((await finalizar(sesion.sesionId)).status).toBe(409);
    const otra = sesion.preguntas[1]!;
    expect((await responder(sesion.sesionId, otra.id, todas.get(otra.id)!.correcta)).status).toBe(409);
  });

  it('con el tiempo vencido, rechaza respuestas y califica solo lo respondido', async () => {
    const { sesion } = await iniciar();
    const p = sesion.preguntas[0]!;
    await responder(sesion.sesionId, p.id, todas.get(p.id)!.correcta);
    await prisma.sesionSimulacro.update({
      where: { id: sesion.sesionId },
      data: { iniciadaEn: new Date(Date.now() - 400_000), venceEn: new Date(Date.now() - 100_000) },
    });

    const tarde = sesion.preguntas[1]!;
    expect((await responder(sesion.sesionId, tarde.id, todas.get(tarde.id)!.correcta)).status).toBe(409);

    const res = await finalizar(sesion.sesionId);
    expect(res.body).toMatchObject({ correctas: 1, sinResponder: 3, tiempoUtilizadoSegundos: 300 });
  });

  it('los puntos del simulacro suman al total del mapa', async () => {
    const { sesion } = await iniciar();
    for (const p of sesion.preguntas) await responder(sesion.sesionId, p.id, todas.get(p.id)!.correcta);
    const res = await finalizar(sesion.sesionId);
    expect((res.body as Resultado).temasAReforzar).toEqual([]);

    const mapa = await api().get('/api/progreso/mapa').set('Cookie', cookie);
    expect((mapa.body as { totalPuntos: number }).totalPuntos).toBe(160 + 4 * 10 + 50);
  });
});
