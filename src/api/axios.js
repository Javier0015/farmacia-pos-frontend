import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
});

let redirigiendoPorSesion = false;

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');

    // Aunque el catálogo sea público, no pasa nada si se manda el token.
    // Pero si quieres evitar mandarlo en rutas públicas, usamos esta validación.
    const esRutaPublica = config.url?.startsWith('/public/');

    if (token && !esRutaPublica) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const rutaActual = window.location.pathname;

    const esPaginaPublica =
      rutaActual === '/catalogo' ||
      rutaActual.startsWith('/catalogo/');

    if (status === 401 && !redirigiendoPorSesion && !esPaginaPublica) {
      redirigiendoPorSesion = true;

      localStorage.removeItem('token');
      localStorage.removeItem('usuario');

      if (rutaActual !== '/' && rutaActual !== '/sesion-expirada') {
        window.location.href = '/sesion-expirada';
      }
    }

    return Promise.reject(error);
  }
);

export default api;