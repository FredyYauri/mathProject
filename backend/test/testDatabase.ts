import 'dotenv/config';

const POR_DEFECTO = 'postgresql://postgres:postgres@localhost:5432/matematicas_kids_test?schema=public';

// Los tests vacían tablas: solo se permite una base cuyo nombre termine en
// "_test", para no borrar nunca por error la base de desarrollo.
export function urlBaseDeTest(): string {
  const url = process.env.TEST_DATABASE_URL ?? POR_DEFECTO;
  const nombre = new URL(url).pathname.replace(/^\//, '');
  if (!nombre.endsWith('_test')) {
    throw new Error(`TEST_DATABASE_URL debe apuntar a una base terminada en "_test" (es "${nombre}").`);
  }
  return url;
}
