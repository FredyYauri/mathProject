import { describe, expect, it, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import { env, envSchema } from '../src/config/env';
import { httpLogSerializers } from '../src/lib/logger';
import { api } from './helpers/api';
import { PASSWORD_FAMILIA, crearFamilia, limpiarBase } from './helpers/db';

// Endurecimiento de la configuración (security/reporte-seguridad.md, SEC-01 a SEC-03 y SEC-12).

const base = {
  NODE_ENV: 'production',
  DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
  CORS_ORIGIN: 'https://app.example.com',
  JWT_SECRET: '3e469e9f1d1ee97c23d3561e789d5a119637d57b',
};

describe('variables de entorno', () => {
  it('exige NODE_ENV en vez de asumir desarrollo', () => {
    expect(envSchema.safeParse({ ...base, NODE_ENV: undefined }).success).toBe(false);
  });

  it('en producción exige un frontend con https', () => {
    expect(envSchema.safeParse(base).success).toBe(true);
    expect(envSchema.safeParse({ ...base, CORS_ORIGIN: 'http://app.example.com' }).success).toBe(false);
    expect(envSchema.safeParse({ ...base, NODE_ENV: 'development', CORS_ORIGIN: 'http://localhost:5173' }).success).toBe(
      true,
    );
  });

  it('rechaza el JWT_SECRET de .env.example y secretos repetidos', () => {
    const ejemplo = 'cambia-este-valor-por-un-secreto-largo-y-aleatorio';
    expect(envSchema.safeParse({ ...base, JWT_SECRET: ejemplo }).success).toBe(false);
    expect(envSchema.safeParse({ ...base, JWT_SECRET: 'ab'.repeat(20) }).success).toBe(false);
  });

  it('TRUST_PROXY es "false" por defecto y no acepta "true"', () => {
    expect(envSchema.parse(base).TRUST_PROXY).toBe(false);
    expect(envSchema.parse({ ...base, TRUST_PROXY: '1' }).TRUST_PROXY).toBe(1);
    expect(envSchema.safeParse({ ...base, TRUST_PROXY: 'true' }).success).toBe(false);
  });
});

describe('sesión del padre', () => {
  it('la cookie y el JWT vencen al mismo tiempo', async () => {
    await limpiarBase();
    const { padre } = await crearFamilia('vencimiento@test.local', 'Ana');
    const res = await api().post('/api/padres/login').send({ email: padre.email, password: PASSWORD_FAMILIA });
    expect(res.status).toBe(200);

    const cookie = ((res.headers['set-cookie'] as string[] | undefined) ?? []).find((c) => c.startsWith('parent_session='));
    const token = cookie?.split(';')[0]?.split('=')[1] ?? '';
    const { iat, exp } = jwt.decode(token) as { iat: number; exp: number };
    const maxAge = Number(/Max-Age=(\d+)/.exec(cookie ?? '')?.[1]);

    expect(exp - iat).toBe(env.PARENT_SESSION_HOURS * 3600);
    expect(maxAge).toBe(env.PARENT_SESSION_HOURS * 3600);
  });
});

describe('logs de cada request', () => {
  it('no incluyen cookies, cabeceras, IP ni query string', () => {
    const req = httpLogSerializers.req({ id: 1, method: 'POST', url: '/api/padres/login?x=1' });
    const res = httpLogSerializers.res({ statusCode: 200 });
    expect(req).toEqual({ id: 1, method: 'POST', url: '/api/padres/login' });
    expect(res).toEqual({ statusCode: 200 });
  });
});

describe('rate limit sin proxy de confianza', () => {
  it('no se salta cambiando X-Forwarded-For en cada intento', async () => {
    // express-rate-limit avisa por consola que llegó un X-Forwarded-For sin proxy
    // de confianza: es justo el caso que se prueba, así que se silencia acá.
    vi.spyOn(console, 'error').mockImplementation(() => {});
    // registroLimiter: 5 por hora. Cuerpo inválido a propósito (400): igual cuenta.
    for (let i = 0; i < 5; i++) {
      const res = await api().post('/api/padres/registro').set('X-Forwarded-For', `203.0.113.${i}`).send({});
      expect(res.status).toBe(400);
    }
    const res = await api().post('/api/padres/registro').set('X-Forwarded-For', '203.0.113.99').send({});
    expect(res.status).toBe(429);
  });
});
