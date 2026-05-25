// src/services/violenciaLesionService.js

import api from '../api/axios';

export const violenciaLesionService = {
  crearHoja: async (data) => {
    const response = await api.post('/violencia-lesion', data);
    return response.data;
  },

  listarPorExpediente: async (idExpediente) => {
    const response = await api.get(`/violencia-lesion/expediente/${idExpediente}`);
    return response.data;
  },

  obtenerPorId: async (idViolenciaLesion) => {
    const response = await api.get(`/violencia-lesion/${idViolenciaLesion}`);
    return response.data;
  },
};