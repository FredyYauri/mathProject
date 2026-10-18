import { beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../src/lib/prisma';
import { api, cookieNino, cookiePadre } from './helpers/api';
import { PASSWORD_FAMILIA, crearContenido, crearFamilia, limpiarBase, type Contenido } from './helpers/db';

// Registro, login y la separación entre la sesión del padre y la del niño
// (spec.md §5; CLAUDE.md, consideraciones no negociables).

let contenido: Contenido;
let familia: Awaited<ReturnType<typeof crearFamilia>>;
let otraFamilia: Awaited<ReturnType<typeof crearFamilia>>;

beforeAll(async () => {
  await limpiarBase();
  contenido = await crearContenido();
  familia = await crearFamilia('familia@test.local', 'Ana');
  otraFamilia = await crearFamilia('otra@test.local', 'Beto');
});

const cookies = (res: { headers: Record<string, unknown> }) => (res.headers['set-cookie'] as string[] | undefined) ?? [];

describe('registro de padres/tutores', () => {
  // El límite es de 5 registros por hora: se cuentan todos los intentos del archivo.
  let intentos = 0;
  const registrar = (body: object) => {
    intentos += 1;
    return api().post('/api/padres/registro').send(body);
  };
  const valido = { email: 'nueva@test.local', password: 'clave-segura-1', declaroSerTutor: true };

  it('exige la declaración de ser tutor legal', async () => {
    const res = await registrar({ ...valido, declaroSerTutor: false });
    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toContain('tutor legal');
  });

  it('rechaza contraseñas cortas y de más de 72 bytes (bcrypt las truncaría)', async () => {
    expect((await registrar({ ...valido, password: 'corta' })).status).toBe(400);
    expect((await registrar({ ...valido, password: 'ñ'.repeat(40) })).status).toBe(400);
  });

  it('crea la cuenta, normaliza el correo y deja la sesión abierta', async () => {
    const res = await registrar({ ...valido, email: '  NUEVA@Test.Local ' });
    expect(res.status).toBe(201);
    expect(cookies(res).some((c) => c.startsWith('parent_session='))).toBe(true);

    const padre = await prisma.padreTutor.findUniqueOrThrow({ where: { email: 'nueva@test.local' } });
    expect(padre.passwordHash).toMatch(/^\$2[aby]\$/);
    expect(padre.declaroSerTutorEn).toBeInstanceOf(Date);
  });

  it('no permite dos cuentas con el mismo correo', async () => {
    const res = await registrar({ ...valido, email: 'Nueva@test.local' });
    expect(res.status).toBe(409);
  });

  it('limita los registros por conexión a 5 por hora', async () => {
    expect(intentos).toBe(5);
    const res = await registrar({ ...valido, email: 'sexta@test.local' });
    expect(res.status).toBe(429);
  });
});

describe('login del padre/tutor', () => {
  it('abre sesión con las credenciales correctas', async () => {
    const res = await api().post('/api/padres/login').send({ email: 'familia@test.local', password: PASSWORD_FAMILIA });
    expect(res.status).toBe(200);
    expect(cookies(res).some((c) => c.startsWith('parent_session='))).toBe(true);
  });

  it('da el mismo error para correo inexistente y contraseña incorrecta', async () => {
    const malaClave = await api().post('/api/padres/login').send({ email: 'familia@test.local', password: 'otra-clave-1' });
    const sinCuenta = await api().post('/api/padres/login').send({ email: 'nadie@test.local', password: 'otra-clave-1' });
    expect(malaClave.status).toBe(401);
    expect(sinCuenta.status).toBe(401);
    expect(malaClave.body).toEqual(sinCuenta.body);
  });
});

describe('sesión del niño en el dispositivo', () => {
  it('sin perfil activo, las rutas del niño responden 401', async () => {
    expect((await api().get('/api/estudiante/sesion')).status).toBe(401);
    expect((await api().get('/api/progreso/mapa')).status).toBe(401);
    expect((await api().get('/api/simulacros')).status).toBe(401);
  });

  it('el padre activa el perfil de su hijo y su propia sesión se cierra', async () => {
    const res = await api()
      .post(`/api/padres/hijos/${familia.hijo.id}/dispositivo`)
      .set('Cookie', cookiePadre(familia.padre.id));
    expect(res.status).toBe(204);
    expect(cookies(res).some((c) => c.startsWith('student_session=') && !c.startsWith('student_session=;'))).toBe(true);
    expect(cookies(res).some((c) => c.startsWith('parent_session=;'))).toBe(true);
  });

  it('no se puede activar el perfil del hijo de otra familia', async () => {
    const res = await api()
      .post(`/api/padres/hijos/${otraFamilia.hijo.id}/dispositivo`)
      .set('Cookie', cookiePadre(familia.padre.id));
    expect(res.status).toBe(404);
  });

  it('devuelve solo id y nombre del perfil activo', async () => {
    const res = await api().get('/api/estudiante/sesion').set('Cookie', cookieNino(familia.hijo.id));
    expect(res.body).toEqual({ id: familia.hijo.id, nombre: 'Ana' });
  });

  it('una sesión no sirve como la otra (audiencias distintas)', async () => {
    const tokenPadre = cookiePadre(familia.padre.id).split('=')[1];
    const tokenNino = cookieNino(familia.hijo.id).split('=')[1];
    expect((await api().get('/api/estudiante/sesion').set('Cookie', `student_session=${tokenPadre}`)).status).toBe(401);
    expect((await api().get('/api/padres/hijos').set('Cookie', `parent_session=${tokenNino}`)).status).toBe(401);
  });

  it('el progreso se registra a nombre del perfil de la sesión, nunca de un id enviado', async () => {
    const { a1 } = contenido.niveles;
    const cookie = cookieNino(familia.hijo.id);
    const inicio = await api().post(`/api/progreso/lecciones/${a1.leccionId}/iniciar`).set('Cookie', cookie);
    const pregunta = a1.preguntas[0]!;
    const res = await api().post('/api/progreso/respuestas').set('Cookie', cookie).send({
      sesionLeccionId: (inicio.body as { sesionId: string }).sesionId,
      preguntaId: pregunta.id,
      opcionSeleccionadaId: pregunta.correcta,
      estudianteId: otraFamilia.hijo.id,
    });
    expect(res.status).toBe(201);
    const registro = await prisma.respuestaRegistro.findFirstOrThrow({ orderBy: { creadoEn: 'desc' } });
    expect(registro.estudianteId).toBe(familia.hijo.id);
  });

  it('el padre puede quitar el perfil del dispositivo', async () => {
    const res = await api().delete('/api/padres/dispositivo').set('Cookie', cookiePadre(familia.padre.id));
    expect(res.status).toBe(204);
    expect(cookies(res).some((c) => c.startsWith('student_session=;'))).toBe(true);
  });
});

describe('perfiles de hijos', () => {
  const crear = (padreId: string, body: object) =>
    api().post('/api/padres/hijos').set('Cookie', cookiePadre(padreId)).send(body);

  it('guarda solo un nombre o apodo, sin espacios sobrantes', async () => {
    const res = await crear(familia.padre.id, { nombre: '  Lu  ' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ nombre: 'Lu' });
    expect(Object.keys(res.body as object).sort()).toEqual(['creadoEn', 'id', 'nombre']);
  });

  it('valida el nombre (vacío o de más de 40 caracteres)', async () => {
    expect((await crear(familia.padre.id, { nombre: '   ' })).status).toBe(400);
    expect((await crear(familia.padre.id, { nombre: 'x'.repeat(41) })).status).toBe(400);
  });

  it('el hijo queda en la cuenta de quien lo crea, aunque se envíe otro padre', async () => {
    const res = await crear(familia.padre.id, { nombre: 'Intruso', padreTutorId: otraFamilia.padre.id });
    const hijo = await prisma.estudiante.findUniqueOrThrow({ where: { id: (res.body as { id: string }).id } });
    expect(hijo.padreTutorId).toBe(familia.padre.id);
  });

  it('un padre no ve los hijos ni el progreso de otra familia', async () => {
    const lista = await api().get('/api/padres/hijos').set('Cookie', cookiePadre(otraFamilia.padre.id));
    expect((lista.body as Array<{ nombre: string }>).map((h) => h.nombre)).toEqual(['Beto']);
    const progreso = await api()
      .get(`/api/padres/hijos/${familia.hijo.id}/progreso`)
      .set('Cookie', cookiePadre(otraFamilia.padre.id));
    expect(progreso.status).toBe(404);
  });

  it('permite hasta 10 perfiles por cuenta', async () => {
    const actuales = await prisma.estudiante.count({ where: { padreTutorId: familia.padre.id } });
    for (let i = actuales; i < 10; i++) await crear(familia.padre.id, { nombre: `Hijo ${i}` });
    const res = await crear(familia.padre.id, { nombre: 'Uno más' });
    expect(res.status).toBe(409);
  });

  it('sin sesión de padre no se pueden crear perfiles', async () => {
    expect((await api().post('/api/padres/hijos').send({ nombre: 'X' })).status).toBe(401);
  });
});
