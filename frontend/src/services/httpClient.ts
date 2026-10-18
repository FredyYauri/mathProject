import axios from 'axios';
import { env } from '../config/env';

// withCredentials: la sesión del padre/tutor viaja como cookie httpOnly
// (nunca como token en localStorage, para no quedar expuesta a XSS).
export const httpClient = axios.create({
  baseURL: env.apiUrl,
  withCredentials: true,
  timeout: 10_000,
});
