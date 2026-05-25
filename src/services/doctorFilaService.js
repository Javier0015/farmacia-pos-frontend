import api from '../api/axios';

export const doctorFilaService = {
  crearPacienteFila: async (data) => {
    const response = await api.post('/doctor-fila', data);
    return response.data;
  },

  listarFilaEspera: async () => {
    const response = await api.get('/doctor-fila');
    return response.data;
  },

  listarHistoricoFila: async () => {
    const response = await api.get('/doctor-fila/historico');
    return response.data;
  },

  atenderPaciente: async (idFila) => {
    const response = await api.put(`/doctor-fila/${idFila}/atender`);
    return response.data;
  },

  vincularExpediente: async (idFila, idExpediente) => {
    const response = await api.put(`/doctor-fila/${idFila}/expediente`, {
      id_expediente: idExpediente,
    });

    return response.data;
  },

  finalizarPaciente: async (idFila) => {
    const response = await api.put(`/doctor-fila/${idFila}/finalizar`);
    return response.data;
  },

  cancelarPaciente: async (idFila, motivo_cancelacion = '') => {
    const response = await api.put(`/doctor-fila/${idFila}/cancelar`, {
      motivo_cancelacion,
    });

    return response.data;
  },

  marcarNoAsistio: async (idFila) => {
    const response = await api.put(`/doctor-fila/${idFila}/no-asistio`);
    return response.data;
  },
};