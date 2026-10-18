import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { HttpError } from '../middleware/errorHandler';
import { obtenerMapa } from './mapa.service';

const SALT_ROUNDS = 12;

// Estado de un tema (unidad) para el padre/tutor (spec.md §4, flujo 4: "temas
// fuertes y temas a reforzar"). Se mide con las respuestas a la primera, de
// lecciones y simulacros: los reintentos no dicen cuánto domina el tema.
const MINIMO_RESPUESTAS_PARA_OPINAR = 4;
const PORCENTAJE_MINIMO_DOMINIO = 70;

type EstadoTema = 'sin_datos' | 'reforzar' | 'en_progreso' | 'dominado';

export async function autenticarPadre(email: string, password: string): Promise<string> {
  const padre = await prisma.padreTutor.findUnique({ where: { email } });

  // Mismo mensaje de error para email inexistente y password incorrecta:
  // evita que un atacante enumere qué emails están registrados.
  if (!padre) throw new HttpError(401, 'Credenciales inválidas');

  const passwordValida = await bcrypt.compare(password, padre.passwordHash);
  if (!passwordValida) throw new HttpError(401, 'Credenciales inválidas');

  return padre.id;
}

// Registro abierto (cualquier adulto puede crear su cuenta). La declaración de
// ser tutor ya viene validada como obligatoria por registroPadreSchema.
export async function crearPadre(email: string, password: string): Promise<string> {
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  try {
    const padre = await prisma.padreTutor.create({
      data: { email, passwordHash, declaroSerTutorEn: new Date() },
    });
    return padre.id;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new HttpError(409, 'Ya existe una cuenta con ese correo. Ingresa con tu contraseña.');
    }
    throw err;
  }
}

const MAXIMO_HIJOS_POR_PADRE = 10;

export async function crearHijo(padreId: string, nombre: string) {
  const cantidad = await prisma.estudiante.count({ where: { padreTutorId: padreId } });
  if (cantidad >= MAXIMO_HIJOS_POR_PADRE) {
    throw new HttpError(409, `Puedes tener hasta ${MAXIMO_HIJOS_POR_PADRE} perfiles de hijos`);
  }
  return prisma.estudiante.create({
    data: { nombre, padreTutorId: padreId },
    select: { id: true, nombre: true, creadoEn: true },
  });
}

async function aciertoPorUnidad(estudianteId: string) {
  const respuestas = await prisma.respuestaRegistro.findMany({
    where: { estudianteId, numeroIntento: 1 },
    select: { esCorrecta: true, pregunta: { select: { leccion: { select: { nivel: { select: { unidadId: true } } } } } } },
  });

  const porUnidad = new Map<string, { total: number; correctas: number }>();
  for (const r of respuestas) {
    const unidadId = r.pregunta.leccion.nivel.unidadId;
    const acumulado = porUnidad.get(unidadId) ?? { total: 0, correctas: 0 };
    acumulado.total += 1;
    if (r.esCorrecta) acumulado.correctas += 1;
    porUnidad.set(unidadId, acumulado);
  }
  return porUnidad;
}

function estadoTema(
  acierto: { total: number; correctas: number } | undefined,
  todosLosNivelesCompletados: boolean,
): { estado: EstadoTema; porcentajeAcierto: number | null } {
  if (!acierto || acierto.total < MINIMO_RESPUESTAS_PARA_OPINAR) {
    return { estado: 'sin_datos', porcentajeAcierto: null };
  }
  const porcentajeAcierto = Math.round((acierto.correctas / acierto.total) * 100);
  if (porcentajeAcierto < PORCENTAJE_MINIMO_DOMINIO) return { estado: 'reforzar', porcentajeAcierto };
  return { estado: todosLosNivelesCompletados ? 'dominado' : 'en_progreso', porcentajeAcierto };
}

// Control de acceso a nivel de datos: un padre solo puede consultar el
// progreso de sus propios estudiantes, nunca de otro perfil por id adivinado.
// Solo lectura (spec.md §4, flujo 4): el padre no modifica contenido ni gamificación.
export async function obtenerProgresoDeHijo(padreId: string, estudianteId: string) {
  const estudiante = await prisma.estudiante.findFirst({
    where: { id: estudianteId, padreTutorId: padreId },
    select: {
      id: true,
      nombre: true,
      resultadosSimulacro: {
        orderBy: { creadoEn: 'desc' },
        take: 10,
        select: {
          id: true,
          creadoEn: true,
          puntajePorcentaje: true,
          correctas: true,
          incorrectas: true,
          sinResponder: true,
          tiempoUtilizadoSegundos: true,
          unidadesAReforzarIds: true,
          simulacro: { select: { nombre: true } },
        },
      },
    },
  });

  if (!estudiante) throw new HttpError(404, 'Estudiante no encontrado');

  const [mapa, acierto] = await Promise.all([obtenerMapa(estudianteId), aciertoPorUnidad(estudianteId)]);

  const unidades = mapa.cursos.flatMap((curso) =>
    curso.unidades.map((unidad) => ({
      id: unidad.id,
      nombre: unidad.nombre,
      ...estadoTema(
        acierto.get(unidad.id),
        unidad.niveles.length > 0 && unidad.niveles.every((n) => n.estado === 'completado'),
      ),
      niveles: unidad.niveles.map((n) => ({ id: n.id, nombre: n.nombre, estado: n.estado, estrellas: n.estrellas })),
    })),
  );
  const nombreDeUnidad = new Map(unidades.map((u) => [u.id, u.nombre]));
  const niveles = unidades.flatMap((u) => u.niveles);

  return {
    id: estudiante.id,
    nombre: estudiante.nombre,
    resumen: {
      nivelesCompletados: niveles.filter((n) => n.estado === 'completado').length,
      nivelesTotales: niveles.length,
      totalEstrellas: mapa.totalEstrellas,
      totalPuntos: mapa.totalPuntos,
    },
    unidades,
    simulacros: estudiante.resultadosSimulacro.map(({ unidadesAReforzarIds, simulacro, ...resultado }) => ({
      ...resultado,
      nombre: simulacro.nombre,
      temasAReforzar: unidadesAReforzarIds.flatMap((id) => nombreDeUnidad.get(id) ?? []),
    })),
  };
}

// Mismo control que arriba: solo se puede activar en un dispositivo el perfil
// de un hijo propio.
export async function verificarHijoDePadre(padreId: string, estudianteId: string): Promise<void> {
  const estudiante = await prisma.estudiante.findFirst({
    where: { id: estudianteId, padreTutorId: padreId },
    select: { id: true },
  });

  if (!estudiante) throw new HttpError(404, 'Estudiante no encontrado');
}

export async function listarHijos(padreId: string) {
  return prisma.estudiante.findMany({
    where: { padreTutorId: padreId },
    orderBy: { creadoEn: 'asc' },
    select: { id: true, nombre: true, creadoEn: true },
  });
}
