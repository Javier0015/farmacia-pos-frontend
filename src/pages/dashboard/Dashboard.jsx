import { useEffect, useMemo, useState } from 'react';
import {
  Package,
  ShoppingCart,
  Wallet,
  AlertTriangle,
  TrendingUp,
  Boxes,
  RefreshCw,
  ReceiptText,
  Clock,
  Store,
  CalendarDays,
  CircleDollarSign,
} from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import {
  esSuperAdmin,
  obtenerSucursalInicial,
  filtrarSucursalesPorRol,
} from '../../utils/sucursalPermisos';

export default function Dashboard() {
  const { usuario } = useAuth();

  const puedeCambiarSucursal = esSuperAdmin(usuario);

  const [idSucursal, setIdSucursal] = useState('');
  const [sucursales, setSucursales] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [cargando, setCargando] = useState(false);

  const resumen = dashboard?.resumen || {};
  const ultimasVentas = dashboard?.ultimas_ventas || [];
  const productosBajoStock = dashboard?.productos_bajo_stock || [];

  const sucursalActual = useMemo(() => {
    return sucursales.find(
      (sucursal) => Number(sucursal.id_sucursal) === Number(idSucursal)
    );
  }, [sucursales, idSucursal]);

  const cargarSucursales = async () => {
    try {
      const { data } = await api.get('/sucursales');

      if (data.ok) {
        const activas = (data.sucursales || []).filter((s) => s.activo);
        const sucursalesPermitidas = filtrarSucursalesPorRol(usuario, activas);

        setSucursales(sucursalesPermitidas);

        if (!idSucursal) {
          setIdSucursal(obtenerSucursalInicial(usuario, sucursalesPermitidas));
        }
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

  const cargarDashboard = async () => {
    if (!idSucursal) return;

    try {
      setCargando(true);

      const { data } = await api.get(`/dashboard/resumen?sucursal=${idSucursal}`);

      if (data.ok) {
        setDashboard(data);
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudo cargar el resumen del dashboard.',
      });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (usuario) {
      cargarSucursales();
    }
  }, [usuario]);

  useEffect(() => {
    if (idSucursal) {
      cargarDashboard();
    }
  }, [idSucursal]);

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

  const formatoFecha = (fecha) => {
    if (!fecha) return '—';

    return new Date(fecha).toLocaleString('es-MX', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const cards = [
    {
      title: 'Ventas de hoy',
      value: formatoMoneda(resumen.total_vendido_hoy),
      icon: ShoppingCart,
      detail: `${resumen.ventas_hoy || 0} venta(s) completada(s)`,
      color: 'emerald',
    },
    {
      title: 'Caja actual',
      value: formatoMoneda(resumen.monto_esperado_caja),
      icon: Wallet,
      detail: resumen.caja_abierta
        ? `${resumen.caja_actual?.caja || 'Caja abierta'}`
        : 'Sin caja abierta',
      color: resumen.caja_abierta ? 'blue' : 'slate',
    },
    {
      title: 'Productos',
      value: formatoNumero(resumen.total_productos),
      icon: Package,
      detail: 'Productos activos en catálogo',
      color: 'violet',
    },
    {
      title: 'Bajo stock',
      value: formatoNumero(resumen.productos_bajo_stock),
      icon: AlertTriangle,
      detail: 'Productos por revisar',
      color: Number(resumen.productos_bajo_stock || 0) > 0 ? 'amber' : 'emerald',
    },
    {
      title: 'Caducidad próxima',
      value: formatoNumero(resumen.productos_caducidad),
      icon: CalendarDays,
      detail: 'Lotes vencidos o próximos a vencer',
      color: Number(resumen.productos_caducidad || 0) > 0 ? 'red' : 'emerald',
    },
  ];

  const getColorClass = (color) => {
    const colors = {
      emerald: 'bg-emerald-50 text-emerald-700',
      blue: 'bg-blue-50 text-blue-700',
      violet: 'bg-violet-50 text-violet-700',
      amber: 'bg-amber-50 text-amber-700',
      red: 'bg-red-50 text-red-700',
      slate: 'bg-slate-100 text-slate-700',
    };

    return colors[color] || colors.emerald;
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-gradient-to-r from-emerald-700 to-teal-700 text-white p-8 shadow-xl">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div>
            <p className="text-emerald-100 font-semibold">
              Bienvenido al sistema
            </p>

            <h1 className="text-3xl md:text-4xl font-bold mt-2">
              Hola, {usuario?.nombre}
            </h1>

            <p className="text-emerald-100 mt-3 max-w-2xl">
              Desde este panel podrás controlar ventas, inventario, cortes de caja,
              sucursales y operaciones principales de la farmacia.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/15 p-4 min-w-40">
              <TrendingUp size={24} />
              <p className="text-sm mt-2 text-emerald-100">
                Operación
              </p>
              <p className="font-bold">
                {resumen.caja_abierta ? 'Caja abierta' : 'Sin caja abierta'}
              </p>
            </div>

            <div className="rounded-2xl bg-white/15 p-4 min-w-40">
              <Boxes size={24} />
              <p className="text-sm mt-2 text-emerald-100">
                Sucursales asignadas
              </p>
              <p className="font-bold">
                {usuario?.sucursales?.length || 0}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row md:items-end gap-4 justify-between">
          <div className="w-full md:max-w-md">
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Sucursal
            </label>

            {puedeCambiarSucursal ? (
              <select
                value={idSucursal}
                onChange={(e) => setIdSucursal(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Selecciona sucursal</option>
                {sucursales.map((sucursal) => (
                  <option key={sucursal.id_sucursal} value={sucursal.id_sucursal}>
                    {sucursal.nombre}
                  </option>
                ))}
              </select>
            ) : (
              <div className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 font-semibold">
                {sucursalActual?.nombre || sucursales[0]?.nombre || 'Sucursal asignada'}
              </div>
            )}
          </div>

          <button
            onClick={cargarDashboard}
            disabled={!idSucursal}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition disabled:opacity-50"
          >
            <RefreshCw size={19} className={cargando ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>

        <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
          <Store size={16} />
          <span>
            {sucursalActual
              ? `Mostrando datos de ${sucursalActual.nombre}`
              : 'Selecciona una sucursal para ver datos reales'}
          </span>
        </div>
      </section>

      <section className="grid sm:grid-cols-2 xl:grid-cols-5 gap-5">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100"
            >
              <div className="flex items-center justify-between">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center ${getColorClass(
                    card.color
                  )}`}
                >
                  <Icon size={24} />
                </div>
              </div>

              <p className="text-sm text-slate-500 mt-5">
                {card.title}
              </p>

              <h3 className="text-3xl font-bold text-slate-800 mt-1">
                {cargando ? '...' : card.value}
              </h3>

              <p className="text-sm text-slate-400 mt-2">
                {card.detail}
              </p>
            </div>
          );
        })}
      </section>

      <section className="grid xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                Últimas ventas
              </h3>
              <p className="text-sm text-slate-500">
                Movimientos recientes del punto de venta.
              </p>
            </div>

            <ReceiptText className="text-slate-400" />
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                    Folio
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                    Método
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                    Cajero
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase">
                    Total
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {ultimasVentas.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-10 text-center text-slate-500">
                      No hay ventas recientes.
                    </td>
                  </tr>
                ) : (
                  ultimasVentas.map((venta) => (
                    <tr key={venta.id_venta} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-bold text-slate-800">
                        {venta.folio}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {formatoFecha(venta.fecha_venta)}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {venta.metodo_pago}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {venta.usuario}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-700">
                        {formatoMoneda(venta.total)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                Productos bajo stock
              </h3>
              <p className="text-sm text-slate-500">
                Requieren revisión.
              </p>
            </div>

            <AlertTriangle className="text-amber-500" />
          </div>

          <div className="mt-5 space-y-3">
            {productosBajoStock.length === 0 ? (
              <div className="rounded-2xl bg-emerald-50 p-4 text-emerald-700 font-semibold text-sm">
                No hay productos bajo stock.
              </div>
            ) : (
              productosBajoStock.map((item) => (
                <div
                  key={item.id_inventario}
                  className="rounded-2xl bg-amber-50 border border-amber-100 p-4"
                >
                  <p className="font-bold text-slate-800">
                    {item.producto}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-slate-500">
                      Stock actual
                    </span>
                    <span className="font-bold text-amber-700">
                      {formatoNumero(item.stock_actual)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-sm">
                    <span className="text-slate-500">
                      Mínimo
                    </span>
                    <span className="font-bold text-slate-700">
                      {formatoNumero(item.stock_minimo)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800">
            Accesos rápidos
          </h3>

          <div className="grid sm:grid-cols-2 gap-4 mt-5">
            <a
              href="/app/pos"
              className="rounded-2xl border border-slate-200 p-4 hover:border-emerald-500 hover:bg-emerald-50 transition"
            >
              <ShoppingCart className="text-emerald-700" />
              <p className="font-bold text-slate-800 mt-3">
                Nueva venta
              </p>
              <p className="text-sm text-slate-500">
                Abrir punto de venta
              </p>
            </a>

            <a
              href="/app/inventario"
              className="rounded-2xl border border-slate-200 p-4 hover:border-emerald-500 hover:bg-emerald-50 transition"
            >
              <Boxes className="text-emerald-700" />
              <p className="font-bold text-slate-800 mt-3">
                Inventario
              </p>
              <p className="text-sm text-slate-500">
                Revisar existencias
              </p>
            </a>

            <a
              href="/app/compras"
              className="rounded-2xl border border-slate-200 p-4 hover:border-emerald-500 hover:bg-emerald-50 transition"
            >
              <Package className="text-emerald-700" />
              <p className="font-bold text-slate-800 mt-3">
                Nueva compra
              </p>
              <p className="text-sm text-slate-500">
                Entrada por proveedor
              </p>
            </a>

            <a
              href="/app/caja"
              className="rounded-2xl border border-slate-200 p-4 hover:border-emerald-500 hover:bg-emerald-50 transition"
            >
              <CircleDollarSign className="text-emerald-700" />
              <p className="font-bold text-slate-800 mt-3">
                Caja
              </p>
              <p className="text-sm text-slate-500">
                Ver corte y movimientos
              </p>
            </a>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800">
            Estado del sistema
          </h3>

          <div className="space-y-3 mt-5">
            {[
              {
                label: 'Backend conectado',
                status: 'OK',
              },
              {
                label: 'Login con JWT activo',
                status: 'OK',
              },
              {
                label: 'Caja',
                status: resumen.caja_abierta ? 'ABIERTA' : 'CERRADA',
              },
              {
                label: 'Inventario por lotes',
                status: 'OK',
              },
              {
                label: 'Ventas FEFO',
                status: 'OK',
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"
              >
                <span className="text-sm font-semibold text-slate-700">
                  {item.label}
                </span>
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full ${
                    item.status === 'CERRADA'
                      ? 'text-red-700 bg-red-100'
                      : item.status === 'ABIERTA'
                      ? 'text-emerald-700 bg-emerald-100'
                      : 'text-emerald-700 bg-emerald-100'
                  }`}
                >
                  {item.status}
                </span>
              </div>
            ))}
          </div>

          {resumen.caja_actual && (
            <div className="mt-5 rounded-2xl bg-blue-50 border border-blue-100 p-4">
              <div className="flex items-center gap-2 text-blue-800 font-bold">
                <Clock size={18} />
                Caja abierta
              </div>
              <p className="text-sm text-blue-700 mt-2">
                {resumen.caja_actual.caja} · Sesión #{resumen.caja_actual.id_sesion}
              </p>
              <p className="text-sm text-blue-700">
                Apertura: {formatoFecha(resumen.caja_actual.fecha_apertura)}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}