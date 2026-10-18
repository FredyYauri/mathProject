// Backend (Express) como función serverless de Vercel. vercel.json reescribe
// /api/* a esta función, así la API comparte dominio con el frontend y las
// cookies de sesión (sameSite=strict) siguen siendo del mismo sitio.
import { createApp } from '../backend/src/app';

export default createApp();
