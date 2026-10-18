// Datos de desarrollo: contenido de ejemplo de la franja Básico (6-8 años), un
// padre/tutor y un estudiante demo. Solo para desarrollo local y pruebas — el
// contenido real del piloto se carga aparte (ver spec.md §3, sin panel admin).
//
// Es idempotente: cada registro tiene un id determinístico derivado de una clave
// estable, así que correrlo varias veces actualiza en vez de duplicar, y no borra
// el progreso de los estudiantes.

import 'dotenv/config';
import { createHash } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { PrismaClient, TipoPregunta } from '@prisma/client';

const prisma = new PrismaClient();

// UUID v5-like a partir de una clave legible (ej. "unidad:suma").
function idDe(clave: string): string {
  const h = createHash('sha1').update(`mate-kids-seed:${clave}`).digest('hex');
  const variante = ((parseInt(h.charAt(16), 16) & 0x3) | 0x8).toString(16);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-${variante}${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

// Imágenes como SVG embebido (data URI): el contenido queda autocontenido en la
// base de datos, sin depender de archivos en el frontend.
function imagenTexto(texto: string): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 120">` +
    `<rect width="320" height="120" rx="16" fill="#fff8e7"/>` +
    `<text x="160" y="76" font-size="40" text-anchor="middle">${texto}</text>` +
    `</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function objetos(emoji: string, cantidad: number): string {
  return imagenTexto(emoji.repeat(cantidad));
}

interface OpcionSeed {
  texto: string;
  imagenUrl?: string;
  correcta?: boolean;
}

interface PreguntaSeed {
  tipo: TipoPregunta;
  enunciado: string;
  imagenUrl?: string;
  pista: string;
  explicacion: string;
  opciones: OpcionSeed[];
}

interface NivelSeed {
  clave: string;
  nombre: string;
  dificultad: number;
  // Una lección por nivel en el seed; el modelo admite varias.
  preguntas: PreguntaSeed[];
}

interface UnidadSeed {
  clave: string;
  nombre: string;
  niveles: NivelSeed[];
}

const { SELECCION_MULTIPLE, SELECCION_IMAGEN } = TipoPregunta;

function multiple(
  enunciado: string,
  respuestas: string[],
  correcta: string,
  pista: string,
  explicacion: string,
  imagenUrl?: string,
): PreguntaSeed {
  return {
    tipo: SELECCION_MULTIPLE,
    enunciado,
    ...(imagenUrl ? { imagenUrl } : {}),
    pista,
    explicacion,
    opciones: respuestas.map((texto) => ({ texto, correcta: texto === correcta })),
  };
}

function porImagen(
  enunciado: string,
  emoji: string,
  nombrePlural: string,
  cantidades: number[],
  correcta: number,
  pista: string,
  explicacion: string,
): PreguntaSeed {
  return {
    tipo: SELECCION_IMAGEN,
    enunciado,
    pista,
    explicacion,
    opciones: cantidades.map((n) => ({
      texto: `${n} ${nombrePlural}`,
      imagenUrl: objetos(emoji, n),
      correcta: n === correcta,
    })),
  };
}

const CURSO = { clave: 'curso:basico-6-8', nombre: 'Matemáticas Básico', franjaEtaria: '6-8' };

const UNIDADES: UnidadSeed[] = [
  {
    clave: 'numeros',
    nombre: 'Números',
    niveles: [
      {
        clave: 'contar-hasta-10',
        nombre: 'Contar hasta 10',
        dificultad: 1,
        preguntas: [
          multiple(
            '¿Cuántas manzanas hay?',
            ['3', '4', '5'],
            '4',
            'Toca cada manzana con el dedo mientras cuentas.',
            'Hay 4 manzanas: 1, 2, 3, 4.',
            objetos('🍎', 4),
          ),
          porImagen(
            '¿Dónde hay 3 estrellas?',
            '⭐',
            'estrellas',
            [2, 3, 5],
            3,
            'Cuenta las estrellas de cada grupo.',
            'El grupo correcto tiene 3 estrellas: 1, 2, 3.',
          ),
          multiple(
            '¿Qué número va después del 6?',
            ['5', '7', '8'],
            '7',
            'Cuenta: 4, 5, 6… ¿y luego?',
            'Después del 6 viene el 7.',
          ),
          porImagen(
            '¿Dónde hay 6 globos?',
            '🎈',
            'globos',
            [4, 6, 7],
            6,
            'Cuenta despacio cada globo.',
            'El grupo correcto tiene 6 globos.',
          ),
        ],
      },
      {
        clave: 'comparar-numeros',
        nombre: 'Comparar números',
        dificultad: 2,
        preguntas: [
          multiple(
            '¿Cuál es el número más grande?',
            ['12', '21', '9'],
            '21',
            'Fíjate primero en las decenas.',
            '21 tiene 2 decenas; 12 tiene 1 y 9 no tiene ninguna. 21 es el más grande.',
          ),
          porImagen(
            '¿Dónde hay MÁS peces?',
            '🐟',
            'peces',
            [3, 7, 5],
            7,
            'Cuenta los peces de cada grupo y compara.',
            '7 es más que 5 y más que 3.',
          ),
          multiple(
            '¿Cuál es el número más pequeño?',
            ['15', '11', '19'],
            '11',
            'Todos tienen 1 decena: compara las unidades.',
            '11 tiene solo 1 unidad, menos que 15 y 19.',
          ),
          multiple(
            '¿Qué número está entre el 14 y el 16?',
            ['13', '15', '17'],
            '15',
            'Cuenta: 14, … , 16.',
            'Entre el 14 y el 16 está el 15.',
          ),
        ],
      },
    ],
  },
  {
    clave: 'suma',
    nombre: 'Suma',
    niveles: [
      {
        clave: 'sumas-hasta-10',
        nombre: 'Sumas hasta 10',
        dificultad: 1,
        preguntas: [
          multiple(
            'Hay 2 perritos y llegan 3 más. ¿Cuántos perritos hay ahora?',
            ['4', '5', '6'],
            '5',
            'Junta los dos grupos y cuenta todos.',
            '2 + 3 = 5 perritos.',
            imagenTexto('🐶🐶 + 🐶🐶🐶'),
          ),
          multiple('3 + 4 = ?', ['6', '7', '8'], '7', 'Empieza en 3 y cuenta 4 más.', '3 + 4 = 7.'),
          multiple('5 + 5 = ?', ['9', '10', '55'], '10', 'Usa los dedos de tus dos manos.', '5 + 5 = 10.'),
          porImagen(
            '¿Qué grupo muestra 4 + 2?',
            '🍌',
            'plátanos',
            [6, 5, 8],
            6,
            'Primero calcula 4 + 2 y luego busca ese número de plátanos.',
            '4 + 2 = 6 plátanos.',
          ),
        ],
      },
      {
        clave: 'sumas-hasta-20',
        nombre: 'Sumas hasta 20',
        dificultad: 2,
        preguntas: [
          multiple('8 + 7 = ?', ['14', '15', '16'], '15', 'Completa la decena: 8 + 2 = 10, y te faltan 5.', '8 + 7 = 15.'),
          multiple('12 + 5 = ?', ['17', '16', '7'], '17', 'Suma solo las unidades: 2 + 5.', '12 + 5 = 17.'),
          multiple(
            'Sofía tiene 10 lápices y le regalan 6. ¿Cuántos lápices tiene ahora?',
            ['4', '15', '16'],
            '16',
            'Si le regalan, tiene más: hay que sumar.',
            '10 + 6 = 16 lápices.',
          ),
          multiple('¿Qué número falta? 7 + __ = 12', ['4', '5', '6'], '5', 'Cuenta desde 7 hasta llegar a 12.', '7 + 5 = 12.'),
        ],
      },
    ],
  },
  {
    clave: 'resta',
    nombre: 'Resta',
    niveles: [
      {
        clave: 'restas-hasta-10',
        nombre: 'Restas hasta 10',
        dificultad: 1,
        preguntas: [
          multiple(
            'Hay 5 pastelitos y te comes 2. ¿Cuántos quedan?',
            ['2', '3', '7'],
            '3',
            'Tapa con el dedo los que te comiste y cuenta los demás.',
            '5 − 2 = 3 pastelitos.',
            objetos('🧁', 5),
          ),
          multiple('9 − 4 = ?', ['4', '5', '6'], '5', 'Empieza en 9 y cuenta 4 hacia atrás.', '9 − 4 = 5.'),
          multiple('6 − 6 = ?', ['0', '1', '6'], '0', 'Si quitas todo, ¿cuánto queda?', '6 − 6 = 0.'),
          porImagen(
            'Tenías 7 globos y se volaron 3. ¿Cuántos te quedan?',
            '🎈',
            'globos',
            [4, 3, 10],
            4,
            'Se volaron: quedan menos que 7.',
            '7 − 3 = 4 globos.',
          ),
        ],
      },
      {
        clave: 'restas-hasta-20',
        nombre: 'Restas hasta 20',
        dificultad: 2,
        preguntas: [
          multiple('15 − 5 = ?', ['10', '11', '20'], '10', 'Quita solo las unidades.', '15 − 5 = 10.'),
          multiple('18 − 9 = ?', ['8', '9', '11'], '9', 'Piensa: ¿9 + cuánto da 18?', '18 − 9 = 9, porque 9 + 9 = 18.'),
          multiple(
            'Juan tenía 14 caramelos y regaló 6. ¿Cuántos le quedan?',
            ['8', '20', '9'],
            '8',
            'Si regala, le quedan menos: hay que restar.',
            '14 − 6 = 8 caramelos.',
          ),
          multiple('¿Qué número falta? 12 − __ = 7', ['4', '5', '6'], '5', 'Cuenta desde 7 hasta 12.', '12 − 5 = 7.'),
        ],
      },
    ],
  },
];

async function seedContenido() {
  const cursoId = idDe(CURSO.clave);
  const cursoData = { nombre: CURSO.nombre, franjaEtaria: CURSO.franjaEtaria, activo: true, orden: 0 };
  await prisma.curso.upsert({ where: { id: cursoId }, create: { id: cursoId, ...cursoData }, update: cursoData });

  for (const [iUnidad, unidad] of UNIDADES.entries()) {
    const unidadId = idDe(`unidad:${unidad.clave}`);
    const unidadData = { cursoId, nombre: unidad.nombre, orden: iUnidad };
    await prisma.unidad.upsert({ where: { id: unidadId }, create: { id: unidadId, ...unidadData }, update: unidadData });

    for (const [iNivel, nivel] of unidad.niveles.entries()) {
      const nivelId = idDe(`nivel:${unidad.clave}:${nivel.clave}`);
      const nivelData = { unidadId, nombre: nivel.nombre, orden: iNivel, dificultad: nivel.dificultad };
      await prisma.nivel.upsert({ where: { id: nivelId }, create: { id: nivelId, ...nivelData }, update: nivelData });

      const leccionId = idDe(`leccion:${unidad.clave}:${nivel.clave}:1`);
      const leccionData = { nivelId, orden: 0 };
      await prisma.leccion.upsert({ where: { id: leccionId }, create: { id: leccionId, ...leccionData }, update: leccionData });

      for (const [iPregunta, pregunta] of nivel.preguntas.entries()) {
        const preguntaClave = `pregunta:${unidad.clave}:${nivel.clave}:${iPregunta}`;
        const preguntaId = idDe(preguntaClave);
        const preguntaData = {
          leccionId,
          tipo: pregunta.tipo,
          enunciado: pregunta.enunciado,
          imagenUrl: pregunta.imagenUrl ?? null,
          pista: pregunta.pista,
          explicacion: pregunta.explicacion,
          orden: iPregunta,
        };
        await prisma.pregunta.upsert({
          where: { id: preguntaId },
          create: { id: preguntaId, ...preguntaData },
          update: preguntaData,
        });

        for (const [iOpcion, opcion] of pregunta.opciones.entries()) {
          const opcionId = idDe(`${preguntaClave}:opcion:${iOpcion}`);
          const opcionData = {
            preguntaId,
            texto: opcion.texto,
            imagenUrl: opcion.imagenUrl ?? null,
            esCorrecta: opcion.correcta ?? false,
            orden: iOpcion,
          };
          await prisma.opcion.upsert({ where: { id: opcionId }, create: { id: opcionId, ...opcionData }, update: opcionData });
        }
      }
    }
  }

  const simulacroId = idDe('simulacro:numeros-suma-resta');
  const simulacroData = {
    nombre: 'Simulacro: Números, Suma y Resta',
    duracionSegundos: 300,
    numeroPreguntas: 8,
    unidadesIds: UNIDADES.map((u) => idDe(`unidad:${u.clave}`)),
  };
  await prisma.simulacro.upsert({
    where: { id: simulacroId },
    create: { id: simulacroId, ...simulacroData },
    update: simulacroData,
  });
}

// Cuenta demo para probar la sección de padres. La contraseña se puede fijar con
// SEED_PADRE_PASSWORD; nunca se usa este seed en producción.
async function seedUsuariosDemo() {
  const email = 'padre.demo@example.com';
  const password = process.env.SEED_PADRE_PASSWORD ?? 'demo-padre-123';
  const passwordHash = await bcrypt.hash(password, 12);

  const padre = await prisma.padreTutor.upsert({
    where: { email },
    create: { email, passwordHash },
    update: { passwordHash },
  });

  const estudianteId = idDe('estudiante:demo');
  const estudianteData = { nombre: 'Estudiante demo', padreTutorId: padre.id };
  await prisma.estudiante.upsert({
    where: { id: estudianteId },
    create: { id: estudianteId, ...estudianteData },
    update: estudianteData,
  });

  return { email, password, estudianteId };
}

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('El seed de desarrollo no se ejecuta con NODE_ENV=production.');
  }

  await seedContenido();
  const demo = await seedUsuariosDemo();

  const totalPreguntas = UNIDADES.flatMap((u) => u.niveles).reduce((n, nivel) => n + nivel.preguntas.length, 0);
  console.log(`Seed OK: 1 curso, ${UNIDADES.length} unidades, ${totalPreguntas} preguntas, 1 simulacro.`);
  console.log(`Padre demo: ${demo.email} / ${demo.password}`);
  console.log(`Estudiante demo id: ${demo.estudianteId}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
