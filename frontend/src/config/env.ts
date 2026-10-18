// Falla rápido en build/dev si falta configuración, en vez de que la app
// arranque silenciosamente apuntando a `undefined`.
const apiUrl = import.meta.env.VITE_API_URL;

if (!apiUrl) {
  throw new Error('VITE_API_URL no está definida. Copia .env.example a .env.local y complétala.');
}

export const env = {
  apiUrl,
};
