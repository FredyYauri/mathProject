import { defineConfig } from 'vitest/config';

// Tests de integración: la API completa (Express + Prisma) contra una base de
// datos de test real (TEST_DATABASE_URL). Los archivos corren uno por vez
// porque comparten esa base.
export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    globalSetup: './test/globalSetup.ts',
    setupFiles: ['./test/setup.ts'],
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 60_000,
  },
});
