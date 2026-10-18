import { defineConfig, devices } from '@playwright/test';

// Recorrido de punta a punta: backend + frontend reales sobre una base propia
// (matematicas_kids_e2e, recreada con el seed en e2e/globalSetup.ts). Usa
// puertos distintos a los de desarrollo para poder correr con `npm run dev`
// abierto.
const API_PORT = 3101;
const APP_PORT = 5174;
export const E2E_DATABASE_URL =
  process.env.E2E_DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/matematicas_kids_e2e?schema=public';

// Navegador instalado en la máquina, sin descargar los de Playwright. Chrome por
// defecto: con Edge en Windows los tests pasan pero el proceso no termina
// (Playwright no logra borrar el perfil temporal que Edge deja tomado).
const channel = process.env.PW_CHANNEL ?? 'chrome';

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/globalSetup.ts',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${APP_PORT}`,
    channel,
    locale: 'es',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'movil', use: { ...devices['Pixel 7'], channel } },
    { name: 'escritorio', use: { viewport: { width: 1280, height: 900 }, channel } },
  ],
  webServer: [
    {
      command: 'npx tsx src/server.ts',
      cwd: '../backend',
      url: `http://localhost:${API_PORT}/api/health`,
      reuseExistingServer: false,
      env: {
        NODE_ENV: 'test',
        PORT: String(API_PORT),
        DATABASE_URL: E2E_DATABASE_URL,
        CORS_ORIGIN: `http://localhost:${APP_PORT}`,
      },
    },
    {
      command: `npx vite --port ${APP_PORT} --strictPort`,
      url: `http://localhost:${APP_PORT}`,
      reuseExistingServer: false,
      env: { VITE_API_URL: `http://localhost:${API_PORT}/api` },
    },
  ],
});
