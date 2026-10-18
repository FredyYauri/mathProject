// Extiende Request con las identidades adjuntadas por src/middleware/auth.ts tras
// verificar la cookie correspondiente: requireParentAuth (padre/tutor) y
// requireStudentSession (perfil del niño activo en el dispositivo).
declare namespace Express {
  export interface Request {
    parentId?: string;
    estudianteId?: string;
  }
}
