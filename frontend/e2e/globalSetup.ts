import { execSync } from 'node:child_process';
import { E2E_DATABASE_URL } from '../playwright.config.ts';

// Prepara la base del recorrido sin borrar nada: aplica las migraciones (crea la
// base si no existe) y carga el seed, que es idempotente. No hace falta vaciarla
// porque cada corrida del recorrido crea su propia familia.
export default function globalSetup() {
  const nombre = new URL(E2E_DATABASE_URL).pathname.replace(/^\//, '');
  if (!nombre.endsWith('_e2e')) {
    throw new Error(`E2E_DATABASE_URL debe apuntar a una base terminada en "_e2e" (es "${nombre}").`);
  }

  const opciones = { cwd: '../backend', env: { ...process.env, DATABASE_URL: E2E_DATABASE_URL }, stdio: 'pipe' as const };
  execSync('npx prisma migrate deploy', opciones);
  execSync('npx prisma db seed', opciones);
}
