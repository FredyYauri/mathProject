import { createHash, randomInt } from 'node:crypto';
import type { IncrementResponse, Options, Store } from 'express-rate-limit';
import { prisma } from '../lib/prisma';

// Cada cuánto (en promedio, 1 de N incrementos) se borran los contadores
// vencidos: así la tabla no crece con IPs que no vuelven.
const LIMPIEZA_CADA = 100;

// Store de express-rate-limit sobre Postgres, compartido entre todas las
// instancias (en Vercel cada función serverless tiene su propia memoria, y un
// contador en memoria no limitaría nada). La IP no se guarda en claro: es un
// dato personal y para contar basta con un hash.
export class LimiteTasaStore implements Store {
  localKeys = false;
  private windowMs = 60_000;

  constructor(public readonly prefix: string) {}

  init(options: Options): void {
    this.windowMs = options.windowMs;
  }

  private clave(key: string): string {
    return createHash('sha256').update(`${this.prefix}:${key}`).digest('hex');
  }

  async increment(key: string): Promise<IncrementResponse> {
    const ahora = new Date();
    const nuevoReinicio = new Date(ahora.getTime() + this.windowMs);

    // Un solo statement atómico: dos requests a la vez no pueden leer el mismo
    // contador y escribir los dos el mismo valor.
    const [fila] = await prisma.$queryRaw<Array<{ hits: number; reiniciaEn: Date }>>`
      INSERT INTO "limites_tasa" ("clave", "hits", "reiniciaEn")
      VALUES (${this.clave(key)}, 1, ${nuevoReinicio})
      ON CONFLICT ("clave") DO UPDATE SET
        "hits" = CASE WHEN "limites_tasa"."reiniciaEn" <= ${ahora} THEN 1 ELSE "limites_tasa"."hits" + 1 END,
        "reiniciaEn" = CASE WHEN "limites_tasa"."reiniciaEn" <= ${ahora} THEN EXCLUDED."reiniciaEn" ELSE "limites_tasa"."reiniciaEn" END
      RETURNING "hits", "reiniciaEn"`;

    if (randomInt(LIMPIEZA_CADA) === 0) {
      await prisma.limiteTasa.deleteMany({ where: { reiniciaEn: { lt: ahora } } });
    }

    return { totalHits: fila?.hits ?? 1, resetTime: fila?.reiniciaEn ?? nuevoReinicio };
  }

  async decrement(key: string): Promise<void> {
    await prisma.limiteTasa.updateMany({ where: { clave: this.clave(key), hits: { gt: 0 } }, data: { hits: { decrement: 1 } } });
  }

  async resetKey(key: string): Promise<void> {
    await prisma.limiteTasa.deleteMany({ where: { clave: this.clave(key) } });
  }
}
