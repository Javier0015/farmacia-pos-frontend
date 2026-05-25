import api from '../api/axios';

export const consentimientosService = {
  crearConsentimiento: async (data) => {
    const response = await api.post('/consentimientos', data);
    return response.data;
  },

  listarPorExpediente: async (idExpediente) => {
    const response = await api.get(`/consentimientos/expediente/${idExpediente}`);
    return response.data;
  },

  obtenerPorId: async (idConsentimiento) => {
    const response = await api.get(`/consentimientos/${idConsentimiento}`);
    return response.data;
  },
};