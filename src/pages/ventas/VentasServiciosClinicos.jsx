import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import {
  Search,
  RefreshCw,
  ReceiptText,
  Stethoscope,
  CalendarDays,
  DollarSign,
  Building2,
  UserRound,
  Eye,
  X,
  Loader2,
  BadgeCheck,
  ClipboardList,
} from 'lucide-react';

import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import {
  esSuperAdmin,
  obtenerSucursalInicial,
  filtrarSucursalesPorRol,
} from '../../utils/sucursalPermisos';

const obtenerFechaInicioMes = () => {
  const fecha = new Date();
  const yyyy = fecha.getFullYear();
  const mm = String(fecha.getMonth() + 1).padStart(2, '0');

  return `${yyyy}-${mm}-01`;
};

const obtenerFechaHoy = () => {
  const fecha = new Date();
  const yyyy = fecha.getFullYear();
  const mm = String(fecha.getMonth() + 1).padStart(2, '0');
  const dd = String(fecha.getDate()).padStart(2, '0');

  return `${yyyy}-${mm}-${dd}`;
};

const ESTATUS_SERVICIO_CLASES = {
  PENDIENTE_CAJERO: 'bg-amber-100 text-amber-700',
  PAGADO: 'bg-emerald-100 text-sky-700',
  REALIZADO: 'bg-sky-100 text-sky-700',
  CANCELADO: 'bg-red-100 text-red-700',
};

const ESTATUS_SERVICIO_TEXTO = {
  PENDIENTE_CAJERO: 'Pendiente cajero',
  PAGADO: 'Pagado',
  REALIZADO: 'Realizado',
  CANCELADO: 'Cancelado',
};

export default function VentasServiciosClinicos() {
  const { usuario } = useAuth();
  const puedeCambiarSucursal = esSuperAdmin(usuario);

  const [sucursales, setSucursales] = useState([]);
  const [idSucursal, setIdSucursal] = useState('');
  const [fechaInicio, setFechaInicio] = useState(obtenerFechaInicioMes());
  const [fechaFin, setFechaFin] = useState(obtenerFechaHoy());
  const [busqueda, setBusqueda] = useState('');

  const [ventasServicios, setVentasServicios] = useState([]);
  const [resumenBackend, setResumenBackend] = useState(null);
  const [cargando, setCargando] = useState(false);

  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
  const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false);

  const sucursalActual = useMemo(() => {
    return sucursales.find((sucursal) => Number(sucursal.id_sucursal) === Number(idSucursal));
  }, [sucursales, idSucursal]);

  const formatoMoneda = (valor) => {
    return Number(valor || 0).toLocaleString('es-MX', {
      style: 'currency',
      currency: 'MXN',
    });
  };

  const formatoNumero = (valor) => {
    return Number(valor || 0).toLocaleString('es-MX', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';

    const valor = new Date(fecha);

    if (Number.isNaN(valor.getTime())) return 'N/A';

    return valor.toLocaleString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const cargarSucursales = async () => {
    try {
      const { data } = await api.get('/sucursales');

      if (data.ok) {
        const activas = (data.sucursales || []).filter((sucursal) => sucursal.activo);
        const permitidas = filtrarSucursalesPorRol(usuario, activas);

        setSucursales(permitidas);

        if (!idSucursal) {
          setIdSucursal(obtenerSucursalInicial(usuario, permitidas));
        }
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

  const cargarVentasServicios = async () => {
    try {
      setCargando(true);

      const params = {};

      if (idSucursal) params.sucursal = idSucursal;
      if (fechaInicio) params.fecha_inicio = fechaInicio;
      if (fechaFin) params.fecha_fin = fechaFin;
      if (busqueda.trim()) params.busqueda = busqueda.trim();

      const { data } = await api.get('/ventas/servicios-clinicos', {
        params,
      });

      if (!data.ok) {
        throw new Error(data.mensaje || 'No se pudieron consultar las ventas de servicios clínicos.');
      }

      setVentasServicios(data.ventas_servicios || []);
      setResumenBackend(data.resumen || null);
    } catch (error) {
      console.error('Error al cargar ventas de servicios clínicos:', error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          error.response?.data?.error ||
          error.message ||
          'No se pudieron cargar las ventas de servicios clínicos.',
      });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (usuario) {
      cargarSucursales();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario]);

  useEffect(() => {
    if (idSucursal) {
      cargarVentasServicios();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idSucursal]);

  const resumen = useMemo(() => {
    if (resumenBackend) {
      return {
        totalRegistros: Number(resumenBackend.total_registros || 0),
        totalVentas: Number(resumenBackend.total_ventas || 0),
        totalCantidadServicios: Number(resumenBackend.total_cantidad_servicios || 0),
        subtotalServicios: Number(resumenBackend.subtotal_servicios || 0),
      };
    }

    const totalVentasUnicas = new Set(
      ventasServicios.map((item) => Number(item.id_venta)).filter(Boolean)
    ).size;

    return {
      totalRegistros: ventasServicios.length,
      totalVentas: totalVentasUnicas,
      totalCantidadServicios: ventasServicios.reduce(
        (acc, item) => acc + Number(item.cantidad || 0),
        0
      ),
      subtotalServicios: ventasServicios.reduce(
        (acc, item) => acc + Number(item.subtotal_servicio || item.subtotal || 0),
        0
      ),
    };
  }, [ventasServicios, resumenBackend]);

  const abrirDetalle = (ventaServicio) => {
    setVentaSeleccionada(ventaServicio);
    setModalDetalleAbierto(true);
  };

  const cerrarDetalle = () => {
    setVentaSeleccionada(null);
    setModalDetalleAbierto(false);
  };

  const limpiarFiltros = () => {
    setFechaInicio(obtenerFechaInicioMes());
    setFechaFin(obtenerFechaHoy());
    setBusqueda('');
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-8">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="relative bg-gradient-to-r from-sky-700 via-cyan-600 to-teal-500 p-6 text-white sm:p-7">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-20 left-10 h-52 w-52 rounded-full bg-white/10 blur-3xl" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-white/15 shadow-lg">
                <Stethoscope size={30} />
              </div>

              <div>
                <p className="text-sm font-black uppercase tracking-wide text-sky-100">
                  Historial
                </p>
                <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
                  Ventas de servicios clínicos
                </h1>
                <p className="mt-1 max-w-2xl text-sm text-sky-50 sm:text-base">
                  Consulta los servicios clínicos cobrados desde POS, con folio de venta,
                  paciente, servicio, cajero, sucursal y doctor.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={cargarVentasServicios}
              disabled={cargando}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-sky-700 shadow-sm transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw size={18} className={cargando ? 'animate-spin' : ''} />
              Actualizar
            </button>
          </div>
        </div>

        <div className="grid gap-4 border-b border-slate-100 p-4 sm:p-5 lg:grid-cols-4">
          <ResumenCard
            icono={ReceiptText}
            titulo="Ventas"
            valor={formatoNumero(resumen.totalVentas)}
            detalle="Ventas únicas con servicios"
            clase="bg-sky-50 text-sky-700"
          />

          <ResumenCard
            icono={ClipboardList}
            titulo="Registros"
            valor={formatoNumero(resumen.totalRegistros)}
            detalle="Renglones de servicio"
            clase="bg-purple-50 text-purple-700"
          />

          <ResumenCard
            icono={BadgeCheck}
            titulo="Servicios"
            valor={formatoNumero(resumen.totalCantidadServicios)}
            detalle="Cantidad cobrada"
            clase="bg-emerald-50 text-sky-700"
          />

          <ResumenCard
            icono={DollarSign}
            titulo="Importe servicios"
            valor={formatoMoneda(resumen.subtotalServicios)}
            detalle="Subtotal de servicios"
            clase="bg-amber-50 text-amber-700"
          />
        </div>

        <div className="grid gap-3 p-4 sm:p-5 lg:grid-cols-[1fr_1fr_1fr_1.5fr_auto_auto]">
          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">
              Sucursal
            </label>

            {puedeCambiarSucursal ? (
              <select
                value={idSucursal}
                onChange={(e) => setIdSucursal(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:ring-2 focus:ring-sky-500"
              >
                <option value="">Todas</option>
                {sucursales.map((sucursal) => (
                  <option key={sucursal.id_sucursal} value={sucursal.id_sucursal}>
                    {sucursal.nombre}
                  </option>
                ))}
              </select>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700">
                {sucursalActual?.nombre || sucursales[0]?.nombre || 'Sucursal asignada'}
              </div>
            )}
          </div>

          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">
              Fecha inicio
            </label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">
              Fecha fin
            </label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">
              Buscar
            </label>
            <div className="relative">
              <Search className="absolute left-4 top-3.5 text-slate-400" size={19} />
              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') cargarVentasServicios();
                }}
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm font-semibold text-slate-700 outline-none transition focus:ring-2 focus:ring-sky-500"
                placeholder="Folio, paciente, servicio, doctor..."
              />
            </div>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={cargarVentasServicios}
              disabled={cargando}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-700 px-5 py-3 text-sm font-black text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {cargando ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
              Buscar
            </button>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={limpiarFiltros}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-200"
            >
              Limpiar
            </button>
          </div>
        </div>
      </section>

      <section className="mt-5 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900">
                Servicios cobrados
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Cada renglón representa un servicio clínico vendido.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-black text-slate-700">
              {formatoNumero(ventasServicios.length)} resultado(s)
            </div>
          </div>
        </div>

        {cargando ? (
          <div className="flex min-h-[360px] items-center justify-center gap-3 text-sm font-black text-slate-600">
            <Loader2 size={22} className="animate-spin" />
            Cargando ventas de servicios clínicos...
          </div>
        ) : ventasServicios.length === 0 ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center p-8 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-500">
              <Stethoscope size={34} />
            </div>

            <h3 className="text-lg font-black text-slate-800">
              Sin ventas de servicios
            </h3>

            <p className="mt-2 max-w-md text-sm text-slate-500">
              No se encontraron servicios clínicos cobrados con los filtros seleccionados.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1200px] w-full border-collapse">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-black uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-4">Venta</th>
                  <th className="px-5 py-4">Servicio</th>
                  <th className="px-5 py-4">Paciente</th>
                  <th className="px-5 py-4">Importe</th>
                  <th className="px-5 py-4">Pago</th>
                  <th className="px-5 py-4">Sucursal / caja</th>
                  <th className="px-5 py-4">Doctor</th>
                  <th className="px-5 py-4">Estatus</th>
                  <th className="px-5 py-4 text-right">Acciones</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {ventasServicios.map((item) => (
                  <tr key={item.id_venta_servicio} className="align-top transition hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <p className="font-black text-slate-900">{item.folio_venta}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {formatearFecha(item.fecha_venta)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Venta #{item.id_venta}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-black text-slate-900">
                        {item.nombre_servicio || 'Servicio clínico'}
                      </p>
                      <p className="mt-1 text-xs font-bold text-sky-700">
                        {item.folio_servicio || 'Sin folio servicio'}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Cantidad: {formatoNumero(item.cantidad)}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-800">
                        {item.nombre_paciente || 'Paciente no registrado'}
                      </p>
                      {item.diagnostico && (
                        <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                          Diagnóstico: {item.diagnostico}
                        </p>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-black text-slate-900">
                        {formatoMoneda(item.subtotal_servicio)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Unitario: {formatoMoneda(item.precio_unitario)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Total venta: {formatoMoneda(item.total_venta)}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="rounded-full bg-slate-100 px-3 py-1 text-center text-xs font-black text-slate-700">
                        {item.metodo_pago || 'N/A'}
                      </p>
                      <p className="mt-2 text-xs text-slate-500">
                        Recibido: {formatoMoneda(item.monto_recibido)}
                      </p>
                      <p className="text-xs text-slate-500">
                        Cambio: {formatoMoneda(item.cambio)}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-800">
                        {item.sucursal || 'Sucursal'}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Caja: {item.caja || item.id_caja || 'N/A'}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Cajero: {item.cajero || 'N/A'}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-800">
                        {item.doctor_shaddai || 'N/A'}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${
                          ESTATUS_SERVICIO_CLASES[item.estatus_servicio] ||
                          'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {ESTATUS_SERVICIO_TEXTO[item.estatus_servicio] ||
                          item.estatus_servicio ||
                          'N/A'}
                      </span>

                      <p className="mt-2 text-xs text-slate-500">
                        Venta: {item.estado_venta || 'N/A'}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => abrirDetalle(item)}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-black text-white transition hover:bg-slate-800"
                      >
                        <Eye size={17} />
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modalDetalleAbierto && ventaSeleccionada && (
        <ModalDetalleVentaServicio
          item={ventaSeleccionada}
          formatoMoneda={formatoMoneda}
          formatearFecha={formatearFecha}
          onClose={cerrarDetalle}
        />
      )}
    </div>
  );
}

function ResumenCard({ icono: Icono, titulo, valor, detalle, clase }) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${clase}`}>
          <Icono size={22} />
        </div>

        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-wide text-slate-500">
            {titulo}
          </p>
          <p className="mt-1 text-2xl font-black text-slate-900">
            {valor}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {detalle}
          </p>
        </div>
      </div>
    </div>
  );
}

function ModalDetalleVentaServicio({
  item,
  formatoMoneda,
  formatearFecha,
  onClose,
}) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-6">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-sky-700">
              Detalle de servicio cobrado
            </p>
            <h2 className="mt-1 text-2xl font-black text-slate-900">
              {item.nombre_servicio || 'Servicio clínico'}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {item.folio_servicio || 'Sin folio de servicio'} · Venta {item.folio_venta}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 transition hover:bg-slate-200"
          >
            <X size={22} />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-6">
          <div className="grid gap-4 md:grid-cols-3">
            <InfoBox
              icono={ReceiptText}
              titulo="Venta"
              valor={item.folio_venta}
              detalle={formatearFecha(item.fecha_venta)}
            />

            <InfoBox
              icono={UserRound}
              titulo="Paciente"
              valor={item.nombre_paciente || 'N/A'}
              detalle={item.folio_servicio || 'Sin folio servicio'}
            />

            <InfoBox
              icono={DollarSign}
              titulo="Importe servicio"
              valor={formatoMoneda(item.subtotal_servicio)}
              detalle={`Total venta: ${formatoMoneda(item.total_venta)}`}
            />
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
              <h3 className="mb-4 text-lg font-black text-slate-900">
                Servicio clínico
              </h3>

              <DetalleLinea label="Servicio" value={item.nombre_servicio} />
              <DetalleLinea label="Cantidad" value={item.cantidad} />
              <DetalleLinea label="Precio unitario" value={formatoMoneda(item.precio_unitario)} />
              <DetalleLinea label="Subtotal" value={formatoMoneda(item.subtotal_servicio)} />
              <DetalleLinea label="Estatus" value={item.estatus_servicio || 'N/A'} />
              <DetalleLinea label="Fecha pago" value={formatearFecha(item.fecha_pago)} />
            </div>

            <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
              <h3 className="mb-4 text-lg font-black text-slate-900">
                Datos de venta
              </h3>

              <DetalleLinea label="Sucursal" value={item.sucursal} />
              <DetalleLinea label="Caja" value={item.caja || item.id_caja} />
              <DetalleLinea label="Cajero" value={item.cajero} />
              <DetalleLinea label="Método de pago" value={item.metodo_pago} />
              <DetalleLinea label="Recibido" value={formatoMoneda(item.monto_recibido)} />
              <DetalleLinea label="Cambio" value={formatoMoneda(item.cambio)} />
            </div>
          </div>

          <div className="mt-5 rounded-3xl border border-slate-100 bg-white p-5">
            <h3 className="mb-4 text-lg font-black text-slate-900">
              Datos clínicos
            </h3>

            <div className="grid gap-4 md:grid-cols-2">
              <DetalleLinea label="Doctor Shaddai" value={item.doctor_shaddai || 'N/A'} />
              <DetalleLinea label="Fecha realizado" value={formatearFecha(item.fecha_realizado)} />
              <DetalleLinea label="Diagnóstico" value={item.diagnostico || 'N/A'} />
              <DetalleLinea label="Observaciones" value={item.observaciones || 'N/A'} />
            </div>
          </div>
        </div>

        <div className="flex justify-end border-t border-slate-100 p-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoBox({ icono: Icono, titulo, valor, detalle }) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-sky-700">
          <Icono size={21} />
        </div>

        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-wide text-slate-500">
            {titulo}
          </p>
          <p className="mt-1 truncate text-lg font-black text-slate-900">
            {valor || 'N/A'}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {detalle || '—'}
          </p>
        </div>
      </div>
    </div>
  );
}

function DetalleLinea({ label, value }) {
  return (
    <div className="border-b border-slate-200 py-3 last:border-b-0">
      <p className="text-xs font-black uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-bold text-slate-800">
        {value || 'N/A'}
      </p>
    </div>
  );
}
