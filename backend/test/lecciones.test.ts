import { beforeEach, describe, expect, it } from 'vitest';
import { api, cookieNino, jugarNivel } from './helpers/api';
import { crearContenido, crearFamilia, limpiarBase, type Contenido } from './helpers/db';

// Cierre de lección, estrellas, puntos y desbloqueo (spec.md §3 y §4, flujo 1).

interface NivelEnMapa {
  id: string;
  estado: 'bloqueado' | 'disponible' | 'completado';
  estrellas: number;
  lecciones: Array<{ id: string; completada: boolean }>;
}
interface Mapa {
  totalEstrellas: number;
  totalPuntos: number;
  cursos: Array<{ unidades: Array<{ niveles: NivelEnMapa[] }> }>;
}

let contenido: Contenido;
let cookie: string;

beforeEach(async () => {
  await limpiarBase();
  contenido = await crearContenido();
  const { hijo } = await crearFamilia();
  cookie = cookieNino(hijo.id);
});

async function mapa() {
  const res = await api().get('/api/progreso/mapa').set('Cookie', cookie);
  const body = res.body as Mapa;
  return { ...body, niveles: body.cursos.flatMap((c) => c.unidades.flatMap((u) => u.niveles)) };
}

describe('contenido de la lección', () => {
  it('nunca expone cuál opción es la correcta', async () => {
    const res = await api().get(`/api/contenido/lecciones/${contenido.niveles.a1.leccionId}`);
    expect(res.status).toBe(200);
    expect(JSON.stringify(res.body)).not.toContain('esCorrecta');
  });
});

describe('mapa y desbloqueo', () => {
  it('al empezar, solo el primer nivel está disponible', async () => {
    const m = await mapa();
    expect(m.niveles.map((n) => n.estado)).toEqual(['disponible', 'bloqueado', 'bloqueado']);
    expect(m.totalEstrellas).toBe(0);
    expect(m.totalPuntos).toBe(0);
  });

  it('el servidor no deja entrar a un nivel bloqueado', async () => {
    const res = await api()
      .post(`/api/progreso/lecciones/${contenido.niveles.a2.leccionId}/iniciar`)
      .set('Cookie', cookie);
    expect(res.status).toBe(403);
  });

  it('una lección perfecta da 3 estrellas, 160 puntos y abre el siguiente nivel', async () => {
    const r = await jugarNivel(cookie, contenido.niveles.a1);
    expect(r.porcentaje).toBe(100);
    expect(r.nivel.estrellas).toBe(3);
    expect(r.puntosGanados).toBe(4 * 10 + 20 + 100);
    expect(r.nivelDesbloqueado?.id).toBe(contenido.niveles.a2.id);

    const m = await mapa();
    expect(m.niveles.map((n) => n.estado)).toEqual(['completado', 'disponible', 'bloqueado']);
    expect(m.niveles[0]!.lecciones[0]!.completada).toBe(true);
  });

  it('con menos del 70% el nivel se completa pero no abre el siguiente', async () => {
    await jugarNivel(cookie, contenido.niveles.a1);
    const r = await jugarNivel(cookie, contenido.niveles.a2, [0, 1]); // 50%
    expect(r.nivel.completado).toBe(true);
    expect(r.nivel.estrellas).toBe(0);
    expect(r.nivelDesbloqueado).toBeNull();
    expect((await mapa()).niveles[2]!.estado).toBe('bloqueado');
  });

  it('el desbloqueo cruza de una unidad a la siguiente', async () => {
    await jugarNivel(cookie, contenido.niveles.a1);
    const r = await jugarNivel(cookie, contenido.niveles.a2, [3]); // 75%
    expect(r.nivel.estrellas).toBe(2);
    expect(r.nivelDesbloqueado?.id).toBe(contenido.niveles.b1.id);
  });

  it('volver a jugar no quita estrellas ni repite el bonus del nivel', async () => {
    await jugarNivel(cookie, contenido.niveles.a1);
    const r = await jugarNivel(cookie, contenido.niveles.a1, [0, 1, 2]); // 25%
    expect(r.nivel.estrellas).toBe(3);
    expect(r.puntosGanados).toBe(1 * 10 + 20);
    expect(r.nivelDesbloqueado).toBeNull();
    expect((await mapa()).totalPuntos).toBe(160 + 30);
  });
});

describe('cierre de la lección', () => {
  it('no se puede cerrar sin haber acertado todas las preguntas', async () => {
    const inicio = await api()
      .post(`/api/progreso/lecciones/${contenido.niveles.a1.leccionId}/iniciar`)
      .set('Cookie', cookie);
    const sesionId = (inicio.body as { sesionId: string }).sesionId;
    const res = await api().post(`/api/progreso/sesiones/${sesionId}/completar`).set('Cookie', cookie);
    expect(res.status).toBe(400);
  });

  it('una sesión solo se cierra una vez', async () => {
    const { a1 } = contenido.niveles;
    const inicio = await api().post(`/api/progreso/lecciones/${a1.leccionId}/iniciar`).set('Cookie', cookie);
    const sesionLeccionId = (inicio.body as { sesionId: string }).sesionId;
    for (const p of a1.preguntas) {
      await api()
        .post('/api/progreso/respuestas')
        .set('Cookie', cookie)
        .send({ sesionLeccionId, preguntaId: p.id, opcionSeleccionadaId: p.correcta });
    }
    const cerrar = () => api().post(`/api/progreso/sesiones/${sesionLeccionId}/completar`).set('Cookie', cookie);
    const [primero, segundo] = await Promise.all([cerrar(), cerrar()]);
    expect([primero.status, segundo.status].sort()).toEqual([200, 409]);
    expect((await mapa()).totalPuntos).toBe(160);
  });

  it('rechaza preguntas que no son de la lección de la sesión', async () => {
    const inicio = await api()
      .post(`/api/progreso/lecciones/${contenido.niveles.a1.leccionId}/iniciar`)
      .set('Cookie', cookie);
    const ajena = contenido.niveles.a2.preguntas[0]!;
    const res = await api().post('/api/progreso/respuestas').set('Cookie', cookie).send({
      sesionLeccionId: (inicio.body as { sesionId: string }).sesionId,
      preguntaId: ajena.id,
      opcionSeleccionadaId: ajena.correcta,
    });
    expect(res.status).toBe(400);
  });

  it('una sesión de otro niño no se puede usar', async () => {
    const inicio = await api()
      .post(`/api/progreso/lecciones/${contenido.niveles.a1.leccionId}/iniciar`)
      .set('Cookie', cookie);
    const { hijo: otro } = await crearFamilia('otra@test.local');
    const res = await api()
      .post(`/api/progreso/sesiones/${(inicio.body as { sesionId: string }).sesionId}/completar`)
      .set('Cookie', cookieNino(otro.id));
    expect(res.status).toBe(404);
  });
});
