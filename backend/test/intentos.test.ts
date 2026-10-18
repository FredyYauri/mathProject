import { beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../src/lib/prisma';
import { api, cookieNino } from './helpers/api';
import { crearContenido, crearFamilia, limpiarBase, type Contenido, type PreguntaFixture } from './helpers/db';

// Límite de intentos por pregunta (spec.md §3; casos borde: al agotarlos se
// muestra la correcta y hay que marcarla para continuar).

interface Respuesta {
  esCorrecta: boolean;
  intentosRestantes: number;
  pista: string | null;
  explicacion: string | null;
  opcionCorrectaId: string | null;
}

let contenido: Contenido;
let cookie: string;
let sesionLeccionId: string;

beforeEach(async () => {
  await limpiarBase();
  contenido = await crearContenido();
  const { hijo } = await crearFamilia();
  cookie = cookieNino(hijo.id);
  const inicio = await api()
    .post(`/api/progreso/lecciones/${contenido.niveles.a1.leccionId}/iniciar`)
    .set('Cookie', cookie);
  sesionLeccionId = (inicio.body as { sesionId: string }).sesionId;
});

const pregunta = (i: number) => contenido.niveles.a1.preguntas[i]!;
async function responder(p: PreguntaFixture, opcion: string) {
  const res = await api()
    .post('/api/progreso/respuestas')
    .set('Cookie', cookie)
    .send({ sesionLeccionId, preguntaId: p.id, opcionSeleccionadaId: opcion });
  return { status: res.status, body: res.body as Respuesta };
}

describe('con la configuración por defecto (2 intentos, pista desde el 1.er error)', () => {
  it('el primer error da pista y un intento más, sin revelar la correcta', async () => {
    const { body } = await responder(pregunta(0), pregunta(0).incorrecta);
    expect(body).toEqual({
      esCorrecta: false,
      intentosRestantes: 1,
      pista: 'Pista 1',
      explicacion: null,
      opcionCorrectaId: null,
    });
  });

  it('al agotar los intentos revela la correcta con su explicación', async () => {
    await responder(pregunta(0), pregunta(0).incorrecta);
    const { body } = await responder(pregunta(0), pregunta(0).incorrecta);
    expect(body.intentosRestantes).toBe(0);
    expect(body.opcionCorrectaId).toBe(pregunta(0).correcta);
    expect(body.explicacion).toBe('Explicación 1');
  });

  it('mientras no marque la correcta, sigue revelándola', async () => {
    await responder(pregunta(0), pregunta(0).incorrecta);
    await responder(pregunta(0), pregunta(0).incorrecta);
    const { body } = await responder(pregunta(0), pregunta(0).incorrecta);
    expect(body.opcionCorrectaId).toBe(pregunta(0).correcta);
  });

  it('una pregunta ya acertada no se puede volver a responder', async () => {
    await responder(pregunta(0), pregunta(0).correcta);
    expect((await responder(pregunta(0), pregunta(0).correcta)).status).toBe(409);
  });

  it('el servidor numera los intentos (el cliente no los manda)', async () => {
    await responder(pregunta(0), pregunta(0).incorrecta);
    await responder(pregunta(0), pregunta(0).incorrecta);
    await responder(pregunta(0), pregunta(0).correcta);
    const registros = await prisma.respuestaRegistro.findMany({
      where: { sesionLeccionId, preguntaId: pregunta(0).id },
      orderBy: { creadoEn: 'asc' },
    });
    expect(registros.map((r) => r.numeroIntento)).toEqual([1, 2, 3]);
  });
});

describe('configuración por pregunta', () => {
  it('con pistaDesdeError = 2, el primer error no muestra pista', async () => {
    await prisma.pregunta.update({ where: { id: pregunta(1).id }, data: { pistaDesdeError: 2 } });
    const { body } = await responder(pregunta(1), pregunta(1).incorrecta);
    expect(body.pista).toBeNull();
    expect(body.intentosRestantes).toBe(1);
  });

  it('con maxIntentos = 1, el primer error ya revela la correcta', async () => {
    await prisma.pregunta.update({ where: { id: pregunta(2).id }, data: { maxIntentos: 1 } });
    const { body } = await responder(pregunta(2), pregunta(2).incorrecta);
    expect(body.intentosRestantes).toBe(0);
    expect(body.opcionCorrectaId).toBe(pregunta(2).correcta);
  });
});

it('al cerrar, solo cuenta como acierto lo respondido bien a la primera', async () => {
  await responder(pregunta(0), pregunta(0).incorrecta);
  await responder(pregunta(0), pregunta(0).incorrecta);
  await responder(pregunta(0), pregunta(0).correcta); // marcó la revelada
  await responder(pregunta(1), pregunta(1).incorrecta);
  await responder(pregunta(1), pregunta(1).correcta);
  await responder(pregunta(2), pregunta(2).correcta);
  await responder(pregunta(3), pregunta(3).correcta);

  const res = await api().post(`/api/progreso/sesiones/${sesionLeccionId}/completar`).set('Cookie', cookie);
  expect(res.body).toMatchObject({ aciertos: 2, total: 4, porcentaje: 50 });
});
