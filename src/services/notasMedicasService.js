import api from '../api/axios';

export const notasMedicasService = {
  crearNotaMedica: async (payload) => {
    const response = await api.post('/notas-medicas', payload);
    return response.data;
  },

  obtenerNotaPorFila: async (idFila) => {
    const response = await api.get(`/notas-medicas/fila/${idFila}`);
    return response.data;
  },

  listarNotasPorExpediente: async (idExpediente) => {
    const response = await api.get(`/notas-medicas/expediente/${idExpediente}`);
    return response.data;
  },

  obtenerNotaPorId: async (idNota) => {
    const response = await api.get(`/notas-medicas/${idNota}`);
    return response.data;
  },

  actualizarNotaMedica: async (idNota, payload) => {
    const response = await api.put(`/notas-medicas/${idNota}`, payload);
    return response.data;
  },

  eliminarNotaMedica: async (idNota) => {
    const response = await api.delete(`/notas-medicas/${idNota}`);
    return response.data;
  },
};