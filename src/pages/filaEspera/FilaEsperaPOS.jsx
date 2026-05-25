import React, { useEffect, useMemo, useState } from 'react';
import {
  UserPlus,
  Clock,
  Search,
  Stethoscope,
  Phone,
  FileText,
  X,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  User,
  Store,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { doctorFilaService } from '../../services/doctorFilaService';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const estadoStyles = {
  EN_ESPERA: {
    label: 'En espera',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  EN_ATENCION: {
    label: 'En atención',
    className: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  ATENDIDO: {
    label: 'Atendido',
    className: 'bg-green-100 text-green-800 border-green-200',
  },
  CANCELADO: {
    label: 'Cancelado',
    className: 'bg-red-100 text-red-800 border-red-200',
  },
  NO_ASISTIO: {
    label: 'No asistió',
    className: 'bg-gray-100 text-gray-800 border-gray-200',
  },
};

const tiposAtencion = [
  {
    value: 'CONSULTA_MEDICA',
    label: 'Consulta médica',
    descripcion: 'Requiere nota médica completa.',
  },
  {
    value: 'SERVICIO_RAPIDO',
    label: 'Servicio clínico rápido',
    descripcion: 'Inyección, curación, toma de presión, glucosa, etc.',
  },
  {
    value: 'SOLO_RECETA',
    label: 'Solo receta',
    descripcion: 'Generación de receta sin consulta completa.',
  },
  {
    value: 'LABORATORIO',
    label: 'Laboratorio',
    descripcion: 'Solicitud de estudios de laboratorio.',
  },
];

const tipoAtencionStyles = {
  CONSULTA_MEDICA: {
    label: 'Consulta médica',
    className: 'bg-sky-100 text-sky-700 border-sky-200',
  },
  SERVICIO_RAPIDO: {
    label: 'Servicio rápido',
    className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
  SOLO_RECETA: {
    label: 'Solo receta',
    className: 'bg-purple-100 text-purple-700 border-purple-200',
  },
  LABORATORIO: {
    label: 'Laboratorio',
    className: 'bg-orange-100 text-orange-700 border-orange-200',
  },
};

const formInicial = {
  id_sucursal: '',
  nombre_paciente: '',
  telefono: '',
  tipo_atencion: 'CONSULTA_MEDICA',
  motivo: '',
  observaciones: '',
};

const formatearFechaHora = (fecha) => {
  if (!fecha) return 'Sin fecha';

  return new Date(fecha).toLocaleString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const calcularTiempoEspera = (fecha) => {
  if (!fecha) return 'Sin registro';

  const inicio = new Date(fecha).getTime();
  const ahora = Date.now();
  const diferencia = Math.max(0, ahora - inicio);

  const minutos = Math.floor(diferencia / 60000);
  const horas = Math.floor(minutos / 60);

  if (minutos < 1) return 'Hace unos segundos';
  if (minutos < 60) return `${minutos} min`;
  return `${horas} h ${minutos % 60} min`;
};

const normalizarListaSucursales = (data) => {
  const lista =
    data?.sucursales ||
    data?.data ||
    data?.resultado ||
    data?.rows ||
    data ||
    [];

  return Array.isArray(lista) ? lista : [];
};

const obtenerIdSucursalUsuario = (usuario) => {
  if (!usuario) return '';

  if (usuario.id_sucursal) return usuario.id_sucursal;
  if (usuario.sucursal_id) return usuario.sucursal_id;
  if (usuario.sucursal?.id_sucursal) return usuario.sucursal.id_sucursal;
  if (usuario.sucursal?.id) return usuario.sucursal.id;

  const sucursalesAsignadas =
    usuario.sucursales_asignadas ||
    usuario.sucursalesAsignadas ||
    usuario.sucursales ||
    usuario.sucursales_ids ||
    [];

  if (Array.isArray(sucursalesAsignadas) && sucursalesAsignadas.length > 0) {
    const primeraSucursal = sucursalesAsignadas[0];

    if (typeof primeraSucursal === 'number' || typeof primeraSucursal === 'string') {
      return primeraSucursal;
    }

    return (
      primeraSucursal.id_sucursal ||
      primeraSucursal.id ||
      primeraSucursal.sucursal_id ||
      ''
    );
  }

  return '';
};

const FilaEsperaPOS = () => {
  const { usuario } = useAuth();

  const [fila, setFila] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(false);
  const [cargandoSucursales, setCargandoSucursales] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [form, setForm] = useState(formInicial);

  const rolUsuario = usuario?.rol || usuario?.nombre_rol || '';
  const esCajero = rolUsuario === 'CAJERO';

  const idSucursalUsuario = useMemo(() => {
    return obtenerIdSucursalUsuario(usuario);
  }, [usuario]);

  const sucursalesVisibles = useMemo(() => {
    if (!sucursales.length) return [];

    if (esCajero && idSucursalUsuario) {
      return sucursales.filter(
        (sucursal) =>
          Number(sucursal.id_sucursal) === Number(idSucursalUsuario)
      );
    }

    return sucursales;
  }, [sucursales, esCajero, idSucursalUsuario]);

  const cargarSucursales = async () => {
    try {
      setCargandoSucursales(true);

      const response = await api.get('/sucursales');
      const lista = normalizarListaSucursales(response.data);

      const sucursalesActivas = lista.filter((sucursal) => {
        if (sucursal.activo === undefined || sucursal.activo === null) {
          return true;
        }

        return (
          sucursal.activo === true ||
          sucursal.activo === 'true' ||
          sucursal.activo === 1
        );
      });

      setSucursales(sucursalesActivas);
    } catch (error) {
      console.error('Error al cargar sucursales:', error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudieron cargar las sucursales.',
      });
    } finally {
      setCargandoSucursales(false);
    }
  };

  const cargarFila = async () => {
    try {
      setCargando(true);

      const data = await doctorFilaService.listarFilaEspera();

      if (data.ok) {
        setFila(data.fila || []);
      } else {
        setFila([]);
      }
    } catch (error) {
      console.error('Error al cargar fila de espera:', error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudo cargar la fila de espera.',
      });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarSucursales();
    cargarFila();

    const intervalo = setInterval(() => {
      cargarFila();
    }, 10000);

    return () => clearInterval(intervalo);
  }, []);

  const abrirModal = () => {
    let sucursalInicial = '';

    if (esCajero) {
      sucursalInicial = idSucursalUsuario ? String(idSucursalUsuario) : '';
    }

    setForm({
      ...formInicial,
      id_sucursal: sucursalInicial,
    });

    setModalAbierto(true);
  };

  const cerrarModal = () => {
    if (guardando) return;

    setModalAbierto(false);
    setForm(formInicial);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const seleccionarSucursal = (idSucursal) => {
    if (esCajero) return;

    setForm((prev) => ({
      ...prev,
      id_sucursal: String(idSucursal),
    }));
  };

  const seleccionarTipoAtencion = (tipoAtencion) => {
    setForm((prev) => ({
      ...prev,
      tipo_atencion: tipoAtencion,
    }));
  };

  const guardarPaciente = async (e) => {
    e.preventDefault();

    let idSucursalFinal = form.id_sucursal;

    if (!idSucursalFinal && esCajero && sucursalesVisibles.length === 1) {
      idSucursalFinal = String(sucursalesVisibles[0].id_sucursal);
    }

    if (!idSucursalFinal) {
      Swal.fire({
        icon: 'warning',
        title: 'Sucursal requerida',
        text: esCajero
          ? 'Tu usuario no tiene una sucursal asignada. Solicita al administrador que revise tu cuenta.'
          : 'Selecciona la sucursal a la que pertenece el paciente.',
      });
      return;
    }

    if (!form.nombre_paciente.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Nombre requerido',
        text: 'Ingresa el nombre del paciente.',
      });
      return;
    }

    if (!form.tipo_atencion) {
      Swal.fire({
        icon: 'warning',
        title: 'Tipo de atención requerido',
        text: 'Selecciona el tipo de atención que recibirá el paciente.',
      });
      return;
    }

    if (!form.motivo.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Motivo requerido',
        text: 'Ingresa el motivo de la atención.',
      });
      return;
    }

    try {
      setGuardando(true);

      const payload = {
        id_sucursal: Number(idSucursalFinal),
        nombre_paciente: form.nombre_paciente.trim(),
        telefono: form.telefono.trim() || null,
        tipo_atencion: form.tipo_atencion,
        motivo: form.motivo.trim(),
        observaciones: form.observaciones.trim() || null,
      };

      const data = await doctorFilaService.crearPacienteFila(payload);

      if (!data.ok) {
        throw new Error(data.mensaje || 'No se pudo registrar el paciente.');
      }

      Swal.fire({
        icon: 'success',
        title: 'Paciente agregado',
        text: 'El paciente fue enviado correctamente a la fila de espera.',
        timer: 1800,
        showConfirmButton: false,
      });

      cerrarModal();
      cargarFila();
    } catch (error) {
      console.error('Error al guardar paciente:', error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          error.message ||
          'No se pudo agregar el paciente a la fila.',
      });
    } finally {
      setGuardando(false);
    }
  };

  const cancelarPaciente = async (paciente) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Cancelar registro',
      html: `
        <p style="margin-bottom:8px;">¿Deseas cancelar el registro de:</p>
        <strong>${paciente.nombre_paciente}</strong>
      `,
      input: 'textarea',
      inputPlaceholder: 'Motivo de cancelación opcional...',
      showCancelButton: true,
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'No',
      confirmButtonColor: '#dc2626',
    });

    if (!result.isConfirmed) return;

    try {
      const data = await doctorFilaService.cancelarPaciente(
        paciente.id_fila,
        result.value || ''
      );

      if (!data.ok) {
        throw new Error(data.mensaje || 'No se pudo cancelar el registro.');
      }

      Swal.fire({
        icon: 'success',
        title: 'Registro cancelado',
        timer: 1600,
        showConfirmButton: false,
      });

      cargarFila();
    } catch (error) {
      console.error('Error al cancelar paciente:', error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          error.message ||
          'No se pudo cancelar el registro.',
      });
    }
  };

  const verDetalle = (paciente) => {
    const estado = estadoStyles[paciente.estatus] || estadoStyles.EN_ESPERA;

    const tipoAtencion =
      tipoAtencionStyles[paciente.tipo_atencion] || {
        label: 'No especificado',
        className: 'bg-slate-100 text-slate-600 border-slate-200',
      };

    Swal.fire({
      title: paciente.nombre_paciente,
      html: `
        <div style="text-align:left; font-size:14px; line-height:1.6;">
          <p><strong>Estatus:</strong> ${estado.label}</p>
          <p><strong>Tipo de atención:</strong> ${tipoAtencion.label}</p>
          <p><strong>Teléfono:</strong> ${paciente.telefono || 'No registrado'}</p>
          <p><strong>Motivo:</strong> ${paciente.motivo || 'Sin motivo'}</p>
          <p><strong>Observaciones:</strong> ${paciente.observaciones || 'Sin observaciones'}</p>
          <p><strong>Registrado:</strong> ${formatearFechaHora(paciente.fecha_registro)}</p>
          <p><strong>Registrado por:</strong> ${paciente.registrado_por || 'No disponible'}</p>
          <p><strong>Sucursal:</strong> ${paciente.sucursal_nombre || 'No asignada'}</p>
          ${
            paciente.doctor_nombre
              ? `<p><strong>Doctor:</strong> ${paciente.doctor_nombre}</p>`
              : ''
          }
        </div>
      `,
      confirmButtonText: 'Cerrar',
    });
  };

  const filaFiltrada = fila.filter((item) => {
    const tipoAtencion =
      tipoAtencionStyles[item.tipo_atencion]?.label || item.tipo_atencion || '';

    const texto = `${item.nombre_paciente || ''} ${item.telefono || ''} ${
      item.motivo || ''
    } ${item.estatus || ''} ${
      item.sucursal_nombre || ''
    } ${tipoAtencion}`.toLowerCase();

    return texto.includes(busqueda.toLowerCase());
  });

  const totalEnEspera = fila.filter(
    (item) => item.estatus === 'EN_ESPERA'
  ).length;

  const totalEnAtencion = fila.filter(
    (item) => item.estatus === 'EN_ATENCION'
  ).length;

  const totalConsultaMedica = fila.filter(
    (item) => item.tipo_atencion === 'CONSULTA_MEDICA'
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
                <Stethoscope size={28} />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-slate-800">
                  Fila de espera médica
                </h1>
                <p className="text-sm text-slate-500">
                  Registra pacientes para atención del Doctor Shaddai.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={abrirModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-sky-700"
          >
            <UserPlus size={19} />
            Agregar paciente
          </button>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Total en fila</p>
            <p className="mt-2 text-3xl font-bold text-slate-800">
              {fila.length}
            </p>
          </div>

          <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5 shadow-sm">
            <p className="text-sm font-medium text-yellow-700">En espera</p>
            <p className="mt-2 text-3xl font-bold text-yellow-800">
              {totalEnEspera}
            </p>
          </div>

          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
            <p className="text-sm font-medium text-blue-700">En atención</p>
            <p className="mt-2 text-3xl font-bold text-blue-800">
              {totalEnAtencion}
            </p>
          </div>

          <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5 shadow-sm">
            <p className="text-sm font-medium text-sky-700">Consultas médicas</p>
            <p className="mt-2 text-3xl font-bold text-sky-800">
              {totalConsultaMedica}
            </p>
          </div>
        </div>

        <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-md">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre, teléfono, motivo, tipo o sucursal..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
              />
            </div>

            <div className="inline-flex items-center justify-center gap-2 rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-700">
              <RefreshCw
                size={17}
                className={cargando ? 'animate-spin' : ''}
              />
              Actualización automática cada 10 segundos
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {cargando && fila.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500">
              <RefreshCw className="mb-3 animate-spin" size={28} />
              <p>Cargando fila de espera...</p>
            </div>
          ) : filaFiltrada.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500">
              <AlertCircle className="mb-3" size={32} />
              <p className="font-medium">No hay pacientes en fila.</p>
              <p className="text-sm">
                Cuando registres uno, aparecerá en esta sección.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filaFiltrada.map((paciente) => {
                const estado =
                  estadoStyles[paciente.estatus] || estadoStyles.EN_ESPERA;

                const tipoAtencion =
                  tipoAtencionStyles[paciente.tipo_atencion] || {
                    label: 'Sin tipo',
                    className: 'bg-slate-100 text-slate-600 border-slate-200',
                  };

                return (
                  <div
                    key={paciente.id_fila}
                    className="flex flex-col gap-4 p-4 transition hover:bg-slate-50 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                        <User size={24} />
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-slate-800">
                            {paciente.nombre_paciente}
                          </h3>

                          <span
                            className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${estado.className}`}
                          >
                            {estado.label}
                          </span>

                          <span
                            className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${tipoAtencion.className}`}
                          >
                            {tipoAtencion.label}
                          </span>
                        </div>

                        <div className="mt-2 grid gap-1 text-sm text-slate-500">
                          <p className="flex items-center gap-2">
                            <Clock size={15} />
                            Registrado: {formatearFechaHora(paciente.fecha_registro)}
                            <span className="font-semibold text-slate-700">
                              ({calcularTiempoEspera(paciente.fecha_registro)})
                            </span>
                          </p>

                          {paciente.telefono && (
                            <p className="flex items-center gap-2">
                              <Phone size={15} />
                              {paciente.telefono}
                            </p>
                          )}

                          <p className="flex items-center gap-2">
                            <FileText size={15} />
                            {paciente.motivo}
                          </p>

                          {paciente.sucursal_nombre && (
                            <p className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                              <Store size={14} />
                              Sucursal: {paciente.sucursal_nombre}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 md:justify-end">
                      <button
                        type="button"
                        onClick={() => verDetalle(paciente)}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                      >
                        Ver detalle
                      </button>

                      {paciente.estatus === 'EN_ESPERA' && (
                        <button
                          type="button"
                          onClick={() => cancelarPaciente(paciente)}
                          className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Agregar paciente a fila
                </h2>
                <p className="text-sm text-slate-500">
                  El doctor podrá visualizar este registro en su panel.
                </p>
              </div>

              <button
                type="button"
                onClick={cerrarModal}
                className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100"
              >
                <X size={22} />
              </button>
            </div>

            <form
              onSubmit={guardarPaciente}
              className="max-h-[calc(92vh-81px)] overflow-y-auto p-5"
            >
              <div className="grid gap-4 md:grid-cols-2">
                {!esCajero && (
                  <div className="md:col-span-2">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <label className="block text-sm font-semibold text-slate-700">
                        Sucursal asignada *
                      </label>
                    </div>

                    {cargandoSucursales ? (
                      <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-500">
                        <RefreshCw size={17} className="animate-spin" />
                        Cargando sucursales...
                      </div>
                    ) : sucursalesVisibles.length === 0 ? (
                      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                        No hay sucursales disponibles para asignar.
                      </div>
                    ) : (
                      <div className="grid gap-3 md:grid-cols-2">
                        {sucursalesVisibles.map((sucursal) => {
                          const seleccionada =
                            String(form.id_sucursal) ===
                            String(sucursal.id_sucursal);

                          return (
                            <button
                              type="button"
                              key={sucursal.id_sucursal}
                              onClick={() =>
                                seleccionarSucursal(sucursal.id_sucursal)
                              }
                              className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${
                                seleccionada
                                  ? 'border-sky-400 bg-sky-50 ring-2 ring-sky-100'
                                  : 'border-slate-200 bg-white hover:border-sky-200 hover:bg-slate-50'
                              }`}
                            >
                              <span
                                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${
                                  seleccionada
                                    ? 'border-sky-600 bg-sky-600 text-white'
                                    : 'border-slate-300 bg-white'
                                }`}
                              >
                                {seleccionada && <CheckCircle2 size={15} />}
                              </span>

                              <span className="min-w-0">
                                <span className="block truncate font-bold text-slate-800">
                                  {sucursal.nombre}
                                </span>
                                <span className="block truncate text-sm text-slate-500">
                                  {sucursal.codigo ||
                                    sucursal.clave ||
                                    sucursal.nombre_corto ||
                                    sucursal.direccion ||
                                    'Sucursal'}
                                </span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Nombre del paciente *
                  </label>
                  <input
                    name="nombre_paciente"
                    value={form.nombre_paciente}
                    onChange={handleChange}
                    placeholder="Ej. Juan Pérez"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Teléfono
                  </label>
                  <input
                    name="telefono"
                    value={form.telefono}
                    onChange={handleChange}
                    placeholder="Ej. 7711234567"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Tipo de atención *
                  </label>

                  <div className="grid gap-3 md:grid-cols-2">
                    {tiposAtencion.map((tipo) => {
                      const seleccionado = form.tipo_atencion === tipo.value;

                      return (
                        <button
                          type="button"
                          key={tipo.value}
                          onClick={() => seleccionarTipoAtencion(tipo.value)}
                          className={`rounded-2xl border p-4 text-left transition ${
                            seleccionado
                              ? 'border-sky-400 bg-sky-50 ring-2 ring-sky-100'
                              : 'border-slate-200 bg-white hover:border-sky-200 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${
                                seleccionado
                                  ? 'border-sky-600 bg-sky-600 text-white'
                                  : 'border-slate-300 bg-white'
                              }`}
                            >
                              {seleccionado && <CheckCircle2 size={15} />}
                            </span>

                            <span>
                              <span className="block font-bold text-slate-800">
                                {tipo.label}
                              </span>
                              <span className="mt-1 block text-xs leading-relaxed text-slate-500">
                                {tipo.descripcion}
                              </span>
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Motivo de atención *
                  </label>
                  <textarea
                    name="motivo"
                    value={form.motivo}
                    onChange={handleChange}
                    placeholder="Ej. Dolor de garganta, aplicación de inyección, toma de presión, solicitud de laboratorio..."
                    rows={3}
                    className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Observaciones
                  </label>
                  <textarea
                    name="observaciones"
                    value={form.observaciones}
                    onChange={handleChange}
                    placeholder="Datos adicionales opcionales..."
                    rows={3}
                    className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 md:flex-row md:justify-end">
                <button
                  type="button"
                  onClick={cerrarModal}
                  disabled={guardando}
                  className="rounded-xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={guardando}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-3 font-semibold text-white transition hover:bg-sky-700 disabled:opacity-60"
                >
                  {guardando ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={18} />
                      Enviar a fila
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilaEsperaPOS;