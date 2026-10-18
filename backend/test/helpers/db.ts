import bcrypt from 'bcryptjs';
import { TipoPregunta } from '@prisma/client';
import { prisma } from '../../src/lib/prisma';

// Vacía todas las tablas de la base de test (no toca la tabla de migraciones).
// Doble chequeo además de urlBaseDeTest(): pregunta a la propia base su nombre.
export async function limpiarBase(): Promise<void> {
  const [fila] = await prisma.$queryRaw<Array<{ nombre: string }>>`select current_database() as nombre`;
  const nombre = fila?.nombre ?? '';
  if (!nombre.endsWith('_test')) throw new Error(`Me negué a vaciar la base "${nombre}": no es de test.`);

  const tablas = await prisma.$queryRaw<Array<{ tablename: string }>>`
    select tablename from pg_tables where schemaname = 'public' and tablename <> '_prisma_migrations'`;
  const lista = tablas.map((t) => `"public"."${t.tablename}"`).join(', ');
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${lista} CASCADE`);
}

export interface PreguntaFixture {
  id: string;
  correcta: string;
  incorrecta: string;
}

export interface NivelFixture {
  id: string;
  nombre: string;
  leccionId: string;
  preguntas: PreguntaFixture[];
}

// Contenido mínimo y fijo, independiente del seed de desarrollo:
//   Unidad A: nivel A1, nivel A2   ·   Unidad B: nivel B1
// Cada nivel tiene una lección de 4 preguntas de selección múltiple ("1" es la
// correcta) y desbloquea el siguiente con 70%. Un simulacro de 6 preguntas.
export async function crearContenido() {
  const curso = await prisma.curso.create({ data: { nombre: 'Curso test', franjaEtaria: '6-8' } });

  async function crearNivel(unidadId: string, nombre: string, orden: number): Promise<NivelFixture> {
    const nivel = await prisma.nivel.create({ data: { unidadId, nombre, orden, porcentajeDesbloqueo: 70 } });
    const leccion = await prisma.leccion.create({ data: { nivelId: nivel.id } });
    const preguntas: PreguntaFixture[] = [];
    for (let i = 0; i < 4; i++) {
      const pregunta = await prisma.pregunta.create({
        data: {
          leccionId: leccion.id,
          tipo: TipoPregunta.SELECCION_MULTIPLE,
          enunciado: `${nombre} pregunta ${i + 1}`,
          pista: `Pista ${i + 1}`,
          explicacion: `Explicación ${i + 1}`,
          orden: i,
          opciones: {
            create: [
              { texto: '0', esCorrecta: false, orden: 0 },
              { texto: '1', esCorrecta: true, orden: 1 },
              { texto: '2', esCorrecta: false, orden: 2 },
            ],
          },
        },
        include: { opciones: true },
      });
      preguntas.push({
        id: pregunta.id,
        correcta: pregunta.opciones.find((o) => o.esCorrecta)!.id,
        incorrecta: pregunta.opciones.find((o) => !o.esCorrecta)!.id,
      });
    }
    return { id: nivel.id, nombre, leccionId: leccion.id, preguntas };
  }

  const unidadA = await prisma.unidad.create({ data: { cursoId: curso.id, nombre: 'Unidad A', orden: 0 } });
  const unidadB = await prisma.unidad.create({ data: { cursoId: curso.id, nombre: 'Unidad B', orden: 1 } });
  const a1 = await crearNivel(unidadA.id, 'A1', 0);
  const a2 = await crearNivel(unidadA.id, 'A2', 1);
  const b1 = await crearNivel(unidadB.id, 'B1', 0);

  const simulacro = await prisma.simulacro.create({
    data: {
      nombre: 'Simulacro test',
      duracionSegundos: 300,
      numeroPreguntas: 6,
      unidadesIds: [unidadA.id, unidadB.id],
    },
  });

  return { curso, unidadA, unidadB, niveles: { a1, a2, b1 }, simulacro };
}

export type Contenido = Awaited<ReturnType<typeof crearContenido>>;

export const PASSWORD_FAMILIA = 'clave-de-test-1';

// Padre/tutor con un hijo. Costo de bcrypt bajo: solo acelera los tests.
export async function crearFamilia(email = 'familia@test.local', nombreHijo = 'Hijo test') {
  const padre = await prisma.padreTutor.create({
    data: { email, passwordHash: await bcrypt.hash(PASSWORD_FAMILIA, 4) },
  });
  const hijo = await prisma.estudiante.create({ data: { nombre: nombreHijo, padreTutorId: padre.id } });
  return { padre, hijo };
}
