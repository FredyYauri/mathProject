// Estado de la puerta parental en la pestaña actual (sessionStorage). Separado
// del componente para poder cerrarla al dejar el dispositivo en modo niño.
const SESSION_KEY = 'puerta_parental_ok';

export function puertaParentalAbierta(): boolean {
  return sessionStorage.getItem(SESSION_KEY) === '1';
}

export function abrirPuertaParental(): void {
  sessionStorage.setItem(SESSION_KEY, '1');
}

export function cerrarPuertaParental(): void {
  sessionStorage.removeItem(SESSION_KEY);
}
