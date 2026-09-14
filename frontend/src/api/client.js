import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/*
 * Rutas donde un 401 es una respuesta esperada y no una sesión vencida:
 * si escribís mal la contraseña, el login devuelve 401 y no hay que echarte.
 */
const ESPERAN_401 = ['/auth/login', '/auth/register', '/auth/password', '/auth/recuperar'];

api.interceptors.response.use(
  (respuesta) => respuesta,
  (error) => {
    const url = error.config?.url || '';
    const esperado = ESPERAN_401.some((r) => url.startsWith(r));

    // El token vence a los 30 días. Sin esto, al vencerse las pantallas fallaban
    // en silencio: seguías "adentro" pero ninguna petición funcionaba.
    if (error.response?.status === 401 && !esperado && localStorage.getItem('token')) {
      localStorage.removeItem('token');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.replace('/login?sesion=vencida');
      }
    }
    return Promise.reject(error);
  },
);

export default api;
