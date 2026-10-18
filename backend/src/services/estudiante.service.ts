import { prisma } from '../lib/prisma';
import { HttpError } from '../middleware/errorHandler';

// Lo mínimo que la experiencia del niño necesita saber de su perfil
// (minimización de datos, ver CLAUDE.md): nunca datos del padre/tutor.
export async function obtenerPerfil(estudianteId: string) {
  const estudiante = await prisma.estudiante.findUnique({
    where: { id: estudianteId },
    select: { id: true, nombre: true },
  });

  // 401 y no 404: el token es válido pero el perfil ya no existe, así que para
  // el cliente equivale a no tener perfil activo en el dispositivo.
  if (!estudiante) throw new HttpError(401, 'No hay un perfil activo en este dispositivo');
  return estudiante;
}
