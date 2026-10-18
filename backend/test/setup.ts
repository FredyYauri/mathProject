import { urlBaseDeTest } from './testDatabase';

// Corre antes de importar cada archivo de test: la app y Prisma leen estas
// variables al cargarse (src/config/env.ts), y dotenv no pisa las ya definidas.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = urlBaseDeTest();
process.env.JWT_SECRET ??= 'secreto-solo-para-tests-con-mas-de-32-caracteres';
process.env.CORS_ORIGIN ??= 'http://localhost:5173';
