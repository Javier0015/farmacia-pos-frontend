import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import {
  Bell,
  Plus,
  Send,
  Trash2,
  AlertTriangle,
  Info,
  Megaphone,
  Store,
  Users,
  ShieldAlert,
  RefreshCw,
} from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import {
  esSuperAdmin,
  filtrarSucursalesPorRol,
} from '../../utils/sucursalPermisos';

const alertaInicial = {
  titulo: '',
  mensaje: '',
  prioridad: 'NORMAL',
  destino_tipo: 'TODOS',
  destino_rol: '',
  id_sucursal: '',
};

const rolesDisponibles = [
  { value: 'SUPER_ADMIN', label: 'Super administrador' },
  { value: 'ADMIN_SUCURSAL', label: 'Administrador de sucursal' },
  { value: 'CAJERO', label: 'Cajero' },
  { value: 'ALMACEN', label: 'Almacén' },
  { value: 'COMPRAS', label: 'Compras' },
  { value: 'LECTURA', label: 'Lectura' },
];

export default function Alertas() {
  const { usuario } = useAuth();

  const puedeVerTodasSucursales = esSuperAdmin(usuario);

  const [formAlerta, setFormAlerta] = useState(alertaInicial);
  const [alertas, setAlertas] = useState([]);
  const [sucursales, setSucursales] = useState([]);

  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const sucursalesDisponibles = useMemo(() => {
    return filtrarSucursalesPorRol(usuario, sucursales);
  }, [usuario, sucursales]);

  const cargarSucursales = async () => {
    try {
      const { data } = await api.get('/sucursales');

      if (data.ok) {
        const activas = (data.sucursales || []).filter((s) => s.activo);
        setSucursales(activas);
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar las sucursales.',
      });
    }
  };

  const cargarAlertas = async () => {
    try {
      setCargando(true);

      const { data } = await api.get('/alertas');

      if (data.ok) {
        setAlertas(data.alertas || []);
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudieron cargar las alertas.',
      });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarSucursales();
    cargarAlertas();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormAlerta((prev) => {
      const nuevo = {
        ...prev,
        [name]: value,
      };

      if (name === 'destino_tipo') {
        nuevo.destino_rol = '';
        nuevo.id_sucursal = '';
      }

      return nuevo;
    });
  };

  const validarAlerta = () => {
    if (!formAlerta.titulo.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Título obligatorio',
        text: 'Escribe el título de la alerta.',
      });
      return false;
    }

    if (!formAlerta.mensaje.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Mensaje obligatorio',
        text: 'Escribe el mensaje de la alerta.',
      });
      return false;
    }

    if (formAlerta.destino_tipo === 'ROL' && !formAlerta.destino_rol) {
      Swal.fire({
        icon: 'warning',
        title: 'Rol obligatorio',
        text: 'Selecciona el rol al que se enviará la alerta.',
      });
      return false;
    }

    if (formAlerta.destino_tipo === 'SUCURSAL' && !formAlerta.id_sucursal) {
      Swal.fire({
        icon: 'warning',
        title: 'Sucursal obligatoria',
        text: 'Selecciona la sucursal a la que se enviará la alerta.',
      });
      return false;
    }

    return true;
  };

  const crearAlerta = async (e) => {
    e.preventDefault();

    if (!validarAlerta()) return;

    try {
      setGuardando(true);

      const payload = {
        titulo: formAlerta.titulo.trim(),
        mensaje: formAlerta.mensaje.trim(),
        prioridad: formAlerta.prioridad,
        destino_rol:
          formAlerta.destino_tipo === 'TODOS'
            ? 'TODOS'
            : formAlerta.destino_tipo === 'ROL'
              ? formAlerta.destino_rol
              : null,
        id_sucursal:
          formAlerta.destino_tipo === 'SUCURSAL'
            ? Number(formAlerta.id_sucursal)
            : null,
      };

      const { data } = await api.post('/alertas', payload);

      if (data.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Alerta enviada',
          text: data.mensaje,
          timer: 1600,
          showConfirmButton: false,
        });

        setFormAlerta(alertaInicial);
        await cargarAlertas();
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudo crear la alerta.',
      });
    } finally {
      setGuardando(false);
    }
  };

  const desactivarAlerta = async (idAlerta) => {
    const confirmacion = await Swal.fire({
      icon: 'warning',
      title: '¿Desactivar alerta?',
      text: 'La alerta dejará de mostrarse a los usuarios.',
      showCancelButton: true,
      confirmButtonText: 'Sí, desactivar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
    });

    if (!confirmacion.isConfirmed) return;

    try {
      const { data } = await api.delete(`/alertas/${idAlerta}`);

      if (data.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Alerta desactivada',
          text: data.mensaje,
          timer: 1400,
          showConfirmButton: false,
        });

        await cargarAlertas();
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudo desactivar la alerta.',
      });
    }
  };

  const obtenerClasePrioridad = (prioridad) => {
    switch (prioridad) {
      case 'URGENTE':
        return {
          badge: 'bg-red-100 text-red-700 border-red-200',
          icono: ShieldAlert,
        };
      case 'IMPORTANTE':
        return {
          badge: 'bg-amber-100 text-amber-700 border-amber-200',
          icono: AlertTriangle,
        };
      default:
        return {
          badge: 'bg-sky-100 text-sky-700 border-sky-200',
          icono: Info,
        };
    }
  };

  const formatoFecha = (fecha) => {
    if (!fecha) return '—';

    return new Date(fecha).toLocaleString('es-MX', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const obtenerDestino = (alerta) => {
    if (alerta.id_sucursal) {
      return alerta.sucursal || `Sucursal #${alerta.id_sucursal}`;
    }

    if (alerta.destino_rol === 'TODOS' || !alerta.destino_rol) {
      return 'Todos los usuarios';
    }

    return alerta.destino_rol;
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-gradient-to-r from-sky-700 to-sky-500 text-white p-6 shadow-lg shadow-sky-900/20">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center">
              <Bell size={26} />
            </div>

            <div>
              <h1 className="text-2xl font-bold">
                Alertas del sistema
              </h1>
              <p className="text-sky-100 text-sm">
                Envía avisos a cajeros, administradores o sucursales específicas.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={cargarAlertas}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white/15 hover:bg-white/20 text-white font-bold transition"
          >
            <RefreshCw size={18} />
            Actualizar
          </button>
        </div>
      </section>

      <section className="grid xl:grid-cols-[420px_1fr] gap-6">
        <form
          onSubmit={crearAlerta}
          className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 space-y-5"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center">
              <Megaphone size={23} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Nueva alerta
              </h2>
              <p className="text-sm text-slate-500">
                El mensaje aparecerá en la campana de los usuarios destino.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Título *
            </label>
            <input
              name="titulo"
              value={formAlerta.titulo}
              onChange={handleChange}
              maxLength={150}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="Ej. Promoción del día"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Mensaje *
            </label>
            <textarea
              name="mensaje"
              value={formAlerta.mensaje}
              onChange={handleChange}
              rows="5"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
              placeholder="Escribe el mensaje que verán los usuarios..."
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Prioridad
            </label>
            <select
              name="prioridad"
              value={formAlerta.prioridad}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="NORMAL">Normal</option>
              <option value="IMPORTANTE">Importante</option>
              <option value="URGENTE">Urgente</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Destino
            </label>
            <select
              name="destino_tipo"
              value={formAlerta.destino_tipo}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="TODOS">Todos los usuarios</option>
              <option value="ROL">Por rol</option>
              <option value="SUCURSAL">Por sucursal</option>
            </select>
          </div>

          {formAlerta.destino_tipo === 'ROL' && (
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Rol destino *
              </label>
              <select
                name="destino_rol"
                value={formAlerta.destino_rol}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="">Selecciona rol</option>
                {rolesDisponibles.map((rol) => (
                  <option key={rol.value} value={rol.value}>
                    {rol.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {formAlerta.destino_tipo === 'SUCURSAL' && (
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Sucursal destino *
              </label>
              <select
                name="id_sucursal"
                value={formAlerta.id_sucursal}
                onChange={handleChange}
                disabled={!puedeVerTodasSucursales && sucursalesDisponibles.length === 1}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-100"
              >
                <option value="">Selecciona sucursal</option>
                {sucursalesDisponibles.map((sucursal) => (
                  <option
                    key={sucursal.id_sucursal}
                    value={sucursal.id_sucursal}
                  >
                    {sucursal.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={guardando}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-sky-700 hover:bg-sky-800 text-white font-bold transition disabled:opacity-60 shadow-lg shadow-sky-900/20"
          >
            <Send size={19} />
            {guardando ? 'Enviando...' : 'Enviar alerta'}
          </button>
        </form>

        <section className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Alertas enviadas
              </h2>
              <p className="text-sm text-slate-500">
                Historial de alertas activas e inactivas.
              </p>
            </div>

            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-sm font-bold">
              {alertas.length} alertas
            </span>
          </div>

          {cargando ? (
            <div className="p-10 text-center text-slate-500">
              Cargando alertas...
            </div>
          ) : alertas.length === 0 ? (
            <div className="p-10 text-center">
              <div className="w-16 h-16 rounded-3xl bg-sky-100 text-sky-700 flex items-center justify-center mx-auto mb-4">
                <Bell size={30} />
              </div>

              <h3 className="font-bold text-slate-800">
                No hay alertas registradas
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Crea una alerta para que aparezca en la campana de los usuarios.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {alertas.map((alerta) => {
                const prioridad = obtenerClasePrioridad(alerta.prioridad);
                const IconoPrioridad = prioridad.icono;

                return (
                  <div
                    key={alerta.id_alerta}
                    className={`p-5 hover:bg-slate-50 transition ${
                      !alerta.activa ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${prioridad.badge}`}
                          >
                            <IconoPrioridad size={14} />
                            {alerta.prioridad}
                          </span>

                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                              alerta.activa
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {alerta.activa ? 'Activa' : 'Inactiva'}
                          </span>
                        </div>

                        <h3 className="font-bold text-slate-800 mt-3">
                          {alerta.titulo}
                        </h3>

                        <p className="text-sm text-slate-600 mt-1">
                          {alerta.mensaje}
                        </p>

                        <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <Users size={14} />
                            {obtenerDestino(alerta)}
                          </span>

                          {alerta.sucursal && (
                            <span className="inline-flex items-center gap-1">
                              <Store size={14} />
                              {alerta.sucursal}
                            </span>
                          )}

                          <span>
                            Creada: {formatoFecha(alerta.fecha_creacion)}
                          </span>

                          <span>
                            Lecturas: {Number(alerta.total_lecturas || 0)}
                          </span>
                        </div>
                      </div>

                      {alerta.activa && (
                        <button
                          type="button"
                          onClick={() => desactivarAlerta(alerta.id_alerta)}
                          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 font-bold transition"
                        >
                          <Trash2 size={17} />
                          Desactivar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </section>
    </div>
  );
}