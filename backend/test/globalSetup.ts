import { execSync } from 'node:child_process';
import { urlBaseDeTest } from './testDatabase';

// Una vez por corrida: aplica las migraciones a la base de test (la crea si
// no existe). Mismas migraciones que producción, así el esquema es el real.
export default function setup() {
  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: urlBaseDeTest() },
    stdio: 'pipe',
  });
}
