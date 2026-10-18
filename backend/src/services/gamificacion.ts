// Valores de gamificación (spec.md §3, "con valores configurables"). Por ahora
// viven aquí; si se necesita cambiarlos sin desplegar, pasarlos a la base de datos.
export const PUNTOS_POR_RESPUESTA_CORRECTA = 10;
export const PUNTOS_POR_LECCION_COMPLETADA = 20;
export const PUNTOS_POR_NIVEL_COMPLETADO = 100;
export const PUNTOS_POR_SIMULACRO_COMPLETADO = 50;

export function calcularEstrellas(porcentajeAcierto: number): number {
  if (porcentajeAcierto >= 90) return 3;
  if (porcentajeAcierto >= 70) return 2;
  if (porcentajeAcierto >= 60) return 1;
  return 0;
}
