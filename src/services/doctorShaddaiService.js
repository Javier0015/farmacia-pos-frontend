import api from '../api/axios';

export const listarExpedientesClinicos = async (busqueda = '') => {
  const { data } = await api.get('/doctor-shaddai/expedientes', {
    params: {
      busqueda,
    },
  });

  return data;
};

export const obtenerExpedienteClinicoPorId = async (id) => {
  const { data } = await api.get(`/doctor-shaddai/expedientes/${id}`);

  return data;
};

export const crearExpedienteClinico = async (expediente) => {
  const { data } = await api.post('/doctor-shaddai/expedientes', expediente);

  return data;
};

export const actualizarExpedienteClinico = async (id, expediente) => {
  const { data } = await api.put(
    `/doctor-shaddai/expedientes/${id}`,
    expediente
  );

  return data;
};

export const eliminarExpedienteClinico = async (id) => {
  const { data } = await api.delete(`/doctor-shaddai/expedientes/${id}`);

  return data;
};