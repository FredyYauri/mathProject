import request from 'supertest';
import { createApp } from '../../src/app';
import { env } from '../../src/config/env';
import { signParentToken, signStudentToken } from '../../src/middleware/auth';
import type { NivelFixture } from './db';

export const app = createApp();
export const api = () => request(app);

// Sesiones firmadas directamente (como lo haría el login): así los tests no
// gastan el límite de 10 logins por ventana. El login real tiene su propio test.
export const cookiePadre = (padreId: string) => `${env.PARENT_SESSION_COOKIE_NAME}=${signParentToken(padreId)}`;
export const cookieNino = (estudianteId: string) =>
  `${env.STUDENT_SESSION_COOKIE_NAME}=${signStudentToken(estudianteId)}`;

export interface ResultadoLeccion {
  aciertos: number;
  total: number;
  porcentaje: number;
  puntosGanados: number;
  nivel: { completado: boolean; estrellas: number; porcentaje: number };
  nivelDesbloqueado: { id: string; nombre: string } | null;
}

// Juega la lección del nivel: en las preguntas de `fallarPrimero` responde mal
// una vez antes de acertar. Devuelve el resultado del cierre.
export async function jugarNivel(cookie: string, nivel: NivelFixture, fallarPrimero: number[] = []) {
  const inicio = await api().post(`/api/progreso/lecciones/${nivel.leccionId}/iniciar`).set('Cookie', cookie);
  const sesionLeccionId = (inicio.body as { sesionId: string }).sesionId;

  for (const [i, p] of nivel.preguntas.entries()) {
    if (fallarPrimero.includes(i)) {
      await api()
        .post('/api/progreso/respuestas')
        .set('Cookie', cookie)
        .send({ sesionLeccionId, preguntaId: p.id, opcionSeleccionadaId: p.incorrecta });
    }
    await api()
      .post('/api/progreso/respuestas')
      .set('Cookie', cookie)
      .send({ sesionLeccionId, preguntaId: p.id, opcionSeleccionadaId: p.correcta });
  }

  const cierre = await api().post(`/api/progreso/sesiones/${sesionLeccionId}/completar`).set('Cookie', cookie);
  return cierre.body as ResultadoLeccion;
}
