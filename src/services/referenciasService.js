import api from '../api/axios';

export const referenciasService = {
  crearReferencia: async (data) => {
    const response = await api.post('/referencias', data);
    return response.data;
  },

  listarPorExpediente: async (idExpediente) => {
    const response = await api.get(`/referencias/expediente/${idExpediente}`);
    return response.data;
  },

  obtenerPorId: async (idReferencia) => {
    const response = await api.get(`/referencias/${idReferencia}`);
    return response.data;
  },
};