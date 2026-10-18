import { beforeEach, describe, expect, it } from 'vitest';
import { api, cookieNino, cookiePadre, jugarNivel } from './helpers/api';
import { crearContenido, crearFamilia, limpiarBase, type Contenido } from './helpers/db';

// Vista de progreso del padre/tutor (spec.md §4, flujo 4): solo lectura.

interface Tema {
  nombre: string;
  estado: 'sin_datos' | 'reforzar' | 'en_progreso' | 'dominado';
  porcentajeAcierto: number | null;
}
interface Progreso {
  resumen: { nivelesCompletados: number; nivelesTotales: number; totalEstrellas: number; totalPuntos: number };
  unidades: Tema[];
  simulacros: Array<{ nombre: string; temasAReforzar: string[] }>;
}

let contenido: Contenido;
let familia: Awaited<ReturnType<typeof crearFamilia>>;
let nino: string;

beforeEach(async () => {
  await limpiarBase();
  contenido = await crearContenido();
  familia = await crearFamilia();
  nino = cookieNino(familia.hijo.id);
});

async function verProgreso() {
  const res = await api()
    .get(`/api/padres/hijos/${familia.hijo.id}/progreso`)
    .set('Cookie', cookiePadre(familia.padre.id));
  return { raw: JSON.stringify(res.body), body: res.body as Progreso };
}
const tema = (p: Progreso, nombre: string) => p.unidades.find((u) => u.nombre === nombre)!;

describe('estado de cada tema', () => {
  it('sin actividad, todos los temas están sin datos', async () => {
    const { body } = await verProgreso();
    expect(body.resumen).toEqual({ nivelesCompletados: 0, nivelesTotales: 3, totalEstrellas: 0, totalPuntos: 0 });
    expect(body.unidades.every((u) => u.estado === 'sin_datos' && u.porcentajeAcierto === null)).toBe(true);
  });

  it('con buen acierto pero niveles pendientes, está en progreso', async () => {
    await jugarNivel(nino, contenido.niveles.a1);
    expect(tema((await verProgreso()).body, 'Unidad A')).toMatchObject({ estado: 'en_progreso', porcentajeAcierto: 100 });
  });

  it('con 70% o más y todos los niveles completados, está dominado', async () => {
    await jugarNivel(nino, contenido.niveles.a1);
    await jugarNivel(nino, contenido.niveles.a2, [0]); // 7 de 8 a la primera
    expect(tema((await verProgreso()).body, 'Unidad A')).toMatchObject({ estado: 'dominado', porcentajeAcierto: 88 });
  });

  it('con menos del 70%, hay que reforzarlo (los reintentos no cuentan)', async () => {
    await jugarNivel(nino, contenido.niveles.a1, [0, 1, 2]); // 1 de 4 a la primera
    const { body } = await verProgreso();
    expect(tema(body, 'Unidad A')).toMatchObject({ estado: 'reforzar', porcentajeAcierto: 25 });
    expect(body.resumen.nivelesCompletados).toBe(1);
  });
});

it('muestra los simulacros con nombre y temas a reforzar por nombre', async () => {
  await jugarNivel(nino, contenido.niveles.a1);
  const inicio = await api().post(`/api/simulacros/${contenido.simulacro.id}/iniciar`).set('Cookie', nino);
  const { sesionId } = inicio.body as { sesionId: string };
  await api().post(`/api/simulacros/sesiones/${sesionId}/finalizar`).set('Cookie', nino);

  const { body } = await verProgreso();
  expect(body.simulacros).toEqual([expect.objectContaining({ nombre: 'Simulacro test', temasAReforzar: ['Unidad A'] })]);
});

it('no expone datos del padre ni respuestas correctas', async () => {
  await jugarNivel(nino, contenido.niveles.a1);
  const { raw } = await verProgreso();
  expect(raw).not.toMatch(/email|passwordHash|padreTutorId|esCorrecta/);
});
