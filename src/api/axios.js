import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

let redirigiendoPorSesion = false;

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');

    if (token) {
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

    if (status === 401 && !redirigiendoPorSesion) {
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