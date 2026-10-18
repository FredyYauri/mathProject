import { beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../src/lib/prisma';
import { LimiteTasaStore } from '../src/services/limiteTasa.service';
import { limpiarBase } from './helpers/db';

// Contadores del rate limit en Postgres (security/reporte-seguridad.md, SEC-07):
// compartidos entre instancias, atómicos y sin la IP en claro.

const nuevoStore = (windowMs = 60_000) => {
  const store = new LimiteTasaStore('test');
  store.init({ windowMs } as Parameters<LimiteTasaStore['init']>[0]);
  return store;
};

beforeEach(async () => {
  await limpiarBase();
});

describe('LimiteTasaStore', () => {
  it('dos instancias comparten el contador (como dos funciones serverless)', async () => {
    const a = nuevoStore();
    const b = nuevoStore();
    expect((await a.increment('203.0.113.7')).totalHits).toBe(1);
    expect((await b.increment('203.0.113.7')).totalHits).toBe(2);
    expect((await a.increment('203.0.113.8')).totalHits).toBe(1);
  });

  it('cuenta bien requests simultáneas', async () => {
    const store = nuevoStore();
    await Promise.all(Array.from({ length: 20 }, () => store.increment('203.0.113.9')));
    expect((await store.increment('203.0.113.9')).totalHits).toBe(21);
  });

  it('reinicia el contador cuando vence la ventana', async () => {
    const store = nuevoStore(50);
    await store.increment('203.0.113.10');
    await store.increment('203.0.113.10');
    await new Promise((r) => setTimeout(r, 80));
    expect((await store.increment('203.0.113.10')).totalHits).toBe(1);
  });

  it('decrement y resetKey', async () => {
    const store = nuevoStore();
    await store.increment('203.0.113.11');
    await store.increment('203.0.113.11');
    await store.decrement('203.0.113.11');
    expect((await store.increment('203.0.113.11')).totalHits).toBe(2);
    await store.resetKey('203.0.113.11');
    expect((await store.increment('203.0.113.11')).totalHits).toBe(1);
  });

  it('no guarda la IP en claro', async () => {
    await nuevoStore().increment('203.0.113.12');
    const filas = await prisma.limiteTasa.findMany();
    expect(filas).toHaveLength(1);
    expect(filas[0]?.clave).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(filas)).not.toContain('203.0.113.12');
  });
});
