import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import {
  Bell,
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
  // Más seguro que enviar una alerta global por omisión.
  destino_tipo: 'SUCURSAL',
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
  { value: 'DOCTOR_SHADDAI', label: 'Doctor Shaddai' },
];

const esActivo = (valor) => {
  return valor === true || valor === 'true' || valor === 1 || valor === '1';
};

const requiereRol = (tipoDestino) => {
  return ['ROL', 'ROL_SUCURSAL'].includes(tipoDestino);
};

const requiereSucursal = (tipoDestino) => {
  return ['SUCURSAL', 'ROL_SUCURSAL'].includes(tipoDestino);
};

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

  const esVistaAdministrativa = puedeVerTodasSucursales;

  const cargarSucursales = async () => {
    try {
      const { data } = await api.get('/sucursales');

      if (data.ok) {
        const activas = (data.sucursales || []).filter((sucursal) =>
          esActivo(sucursal.activo)
        );

        setSucursales(activas);
      }
    } catch (error) {
      console.error('Error al cargar sucursales:', error);

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

      /*
        SUPER_ADMIN conserva la vista administrativa/global para gestionar el
        historial. Los demás usuarios consultan exclusivamente sus alertas
        filtradas por rol, sucursal y usuario destino.
      */
      const endpoint = esVistaAdministrativa
        ? '/alertas'
        : '/alertas/mis-alertas';

      const { data } = await api.get(endpoint);

      if (data.ok) {
        setAlertas(data.alertas || []);
      } else {
        setAlertas([]);
      }
    } catch (error) {
      console.error('Error al cargar alertas:', error);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [esVistaAdministrativa]);

  /*
    Para un usuario asignado a una sola sucursal, la sucursal se precarga.
    Así se evita que una alerta operativa termine sin destino de sucursal.
  */
  useEffect(() => {
    if (
      !puedeVerTodasSucursales &&
      sucursalesDisponibles.length === 1 &&
      !formAlerta.id_sucursal
    ) {
      setFormAlerta((prev) => ({
        ...prev,
        id_sucursal: String(sucursalesDisponibles[0].id_sucursal),
      }));
    }
  }, [
    puedeVerTodasSucursales,
    sucursalesDisponibles,
    formAlerta.id_sucursal,
  ]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormAlerta((prev) => {
      const nuevo = {
        ...prev,
        [name]: value,
      };

      if (name === 'destino_tipo') {
        nuevo.destino_rol = '';
        nuevo.id_sucursal = '';

        if (
          requiereSucursal(value) &&
          !puedeVerTodasSucursales &&
          sucursalesDisponibles.length === 1
        ) {
          nuevo.id_sucursal = String(sucursalesDisponibles[0].id_sucursal);
        }
      }

      return nuevo;
    });
  };

  const validarAlerta = () => {
    const tipoDestino = formAlerta.destino_tipo;

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

    if (tipoDestino === 'TODOS' && !puedeVerTodasSucursales) {
      Swal.fire({
        icon: 'warning',
        title: 'Destino no permitido',
        text: 'Solo un superadministrador puede enviar alertas a todos los usuarios.',
      });
      return false;
    }

    if (requiereRol(tipoDestino) && !formAlerta.destino_rol) {
      Swal.fire({
        icon: 'warning',
        title: 'Rol obligatorio',
        text: 'Selecciona el rol al que se enviará la alerta.',
      });
      return false;
    }

    if (requiereSucursal(tipoDestino) && !formAlerta.id_sucursal) {
      Swal.fire({
        icon: 'warning',
        title: 'Sucursal obligatoria',
        text: 'Selecciona la sucursal a la que se enviará la alerta.',
      });
      return false;
    }

    return true;
  };

  const crearAlerta = async (event) => {
    event.preventDefault();

    if (!validarAlerta()) return;

    const tipoDestino = formAlerta.destino_tipo;

    try {
      setGuardando(true);

      const payload = {
        titulo: formAlerta.titulo.trim(),
        mensaje: formAlerta.mensaje.trim(),
        prioridad: formAlerta.prioridad,

        /*
          IMPORTANTE:
          El backend espera exactamente "tipo_destino".
          Si se omite, alertas.controller.js utiliza TODOS por defecto.
        */
        tipo_destino: tipoDestino,

        destino_rol: requiereRol(tipoDestino)
          ? formAlerta.destino_rol
          : null,

        id_sucursal: requiereSucursal(tipoDestino)
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

        setFormAlerta({
          ...alertaInicial,
          id_sucursal:
            !puedeVerTodasSucursales && sucursalesDisponibles.length === 1
              ? String(sucursalesDisponibles[0].id_sucursal)
              : '',
        });

        await cargarAlertas();
      }
    } catch (error) {
      console.error('Error al crear alerta:', error);

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
    if (!esVistaAdministrativa) {
      Swal.fire({
        icon: 'warning',
        title: 'Acción no permitida',
        text: 'Solo el superadministrador puede desactivar alertas desde esta pantalla.',
      });
      return;
    }

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
      console.error('Error al desactivar alerta:', error);

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
    const tipoDestino = String(alerta.tipo_destino || '').toUpperCase();
    const tieneSucursal = Boolean(alerta.id_sucursal);
    const sucursal = alerta.sucursal || `Sucursal #${alerta.id_sucursal}`;

    if (tipoDestino === 'ROL_SUCURSAL') {
      return `${alerta.destino_rol || 'Rol'} · ${sucursal}`;
    }

    if (tipoDestino === 'SUCURSAL' || tieneSucursal) {
      return sucursal;
    }

    if (tipoDestino === 'ROL' && alerta.destino_rol) {
      return alerta.destino_rol;
    }

    if (tipoDestino === 'USUARIO') {
      return 'Usuario específico';
    }

    return 'Todos los usuarios';
  };

  const obtenerEstadoAlerta = (alerta) => {
    if (esVistaAdministrativa) {
      return esActivo(alerta.activa)
        ? { texto: 'Activa', clase: 'bg-emerald-100 text-emerald-700' }
        : { texto: 'Inactiva', clase: 'bg-slate-100 text-slate-500' };
    }

    return alerta.leida
      ? { texto: 'Leída', clase: 'bg-slate-100 text-slate-600' }
      : { texto: 'Sin leer', clase: 'bg-violet-100 text-violet-700' };
  };

  const totalActivas = alertas.filter((alerta) => {
    return esVistaAdministrativa ? esActivo(alerta.activa) : !alerta.leida;
  }).length;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-gradient-to-r from-sky-700 to-sky-500 p-6 text-white shadow-lg shadow-sky-900/20">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
              <Bell size={26} />
            </div>

            <div>
              <h1 className="text-2xl font-bold">Alertas del sistema</h1>
              <p className="text-sm text-sky-100">
                {esVistaAdministrativa
                  ? 'Gestiona avisos globales, por rol y por sucursal.'
                  : 'Consulta las alertas dirigidas a tu rol y sucursal.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={cargarAlertas}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/15 px-4 py-3 font-bold text-white transition hover:bg-white/20"
          >
            <RefreshCw size={18} className={cargando ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <form
          onSubmit={crearAlerta}
          className="space-y-5 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
              <Megaphone size={23} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-800">Nueva alerta</h2>
              <p className="text-sm text-slate-500">
                Elige explícitamente quién debe recibir el aviso.
              </p>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Título *
            </label>
            <input
              name="titulo"
              value={formAlerta.titulo}
              onChange={handleChange}
              maxLength={150}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="Ej. Promoción del día"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Mensaje *
            </label>
            <textarea
              name="mensaje"
              value={formAlerta.mensaje}
              onChange={handleChange}
              rows="5"
              className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="Escribe el mensaje que verán los usuarios..."
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Prioridad
            </label>
            <select
              name="prioridad"
              value={formAlerta.prioridad}
              onChange={handleChange}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="NORMAL">Normal</option>
              <option value="IMPORTANTE">Importante</option>
              <option value="URGENTE">Urgente</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Destino *
            </label>
            <select
              name="destino_tipo"
              value={formAlerta.destino_tipo}
              onChange={handleChange}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              {puedeVerTodasSucursales && (
                <option value="TODOS">Todos los usuarios</option>
              )}
              <option value="ROL">Por rol</option>
              <option value="SUCURSAL">Por sucursal</option>
              <option value="ROL_SUCURSAL">Por rol y sucursal</option>
            </select>
          </div>

          {requiereRol(formAlerta.destino_tipo) && (
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Rol destino *
              </label>
              <select
                name="destino_rol"
                value={formAlerta.destino_rol}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-500"
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

          {requiereSucursal(formAlerta.destino_tipo) && (
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Sucursal destino *
              </label>
              <select
                name="id_sucursal"
                value={formAlerta.id_sucursal}
                onChange={handleChange}
                disabled={
                  !puedeVerTodasSucursales &&
                  sucursalesDisponibles.length === 1
                }
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-100"
              >
                <option value="">Selecciona sucursal</option>
                {sucursalesDisponibles.map((sucursal) => (
                  <option key={sucursal.id_sucursal} value={sucursal.id_sucursal}>
                    {sucursal.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={guardando}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-700 px-5 py-3 font-bold text-white shadow-lg shadow-sky-900/20 transition hover:bg-sky-800 disabled:opacity-60"
          >
            <Send size={19} />
            {guardando ? 'Enviando...' : 'Enviar alerta'}
          </button>
        </form>

        <section className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 p-6">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                {esVistaAdministrativa ? 'Alertas enviadas' : 'Mis alertas'}
              </h2>
              <p className="text-sm text-slate-500">
                {esVistaAdministrativa
                  ? 'Historial global de alertas activas e inactivas.'
                  : 'Alertas disponibles para tu rol y sucursal asignada.'}
              </p>
            </div>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-700">
              {totalActivas} {esVistaAdministrativa ? 'activas' : 'sin leer'}
            </span>
          </div>

          {cargando ? (
            <div className="p-10 text-center text-slate-500">Cargando alertas...</div>
          ) : alertas.length === 0 ? (
            <div className="p-10 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-sky-100 text-sky-700">
                <Bell size={30} />
              </div>

              <h3 className="font-bold text-slate-800">No hay alertas registradas</h3>
              <p className="mt-1 text-sm text-slate-500">
                {esVistaAdministrativa
                  ? 'Crea una alerta para que aparezca en la campana de los usuarios.'
                  : 'No tienes alertas pendientes para tu rol o sucursal.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {alertas.map((alerta) => {
                const prioridad = obtenerClasePrioridad(alerta.prioridad);
                const IconoPrioridad = prioridad.icono;
                const estado = obtenerEstadoAlerta(alerta);

                return (
                  <div
                    key={alerta.id_alerta}
                    className={`p-5 transition hover:bg-slate-50 ${
                      esVistaAdministrativa && !esActivo(alerta.activa)
                        ? 'opacity-60'
                        : ''
                    }`}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${prioridad.badge}`}
                          >
                            <IconoPrioridad size={14} />
                            {alerta.prioridad}
                          </span>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${estado.clase}`}
                          >
                            {estado.texto}
                          </span>
                        </div>

                        <h3 className="mt-3 font-bold text-slate-800">{alerta.titulo}</h3>
                        <p className="mt-1 text-sm text-slate-600">{alerta.mensaje}</p>

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

                          <span>Creada: {formatoFecha(alerta.fecha_creacion)}</span>

                          {esVistaAdministrativa && (
                            <span>Lecturas: {Number(alerta.total_lecturas || 0)}</span>
                          )}
                        </div>
                      </div>

                      {esVistaAdministrativa && esActivo(alerta.activa) && (
                        <button
                          type="button"
                          onClick={() => desactivarAlerta(alerta.id_alerta)}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-2 font-bold text-red-700 transition hover:bg-red-100"
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
