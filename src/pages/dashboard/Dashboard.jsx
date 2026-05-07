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
  BadgeDollarSign,
  ChartNoAxesColumnIncreasing,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
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

  const fechaActual = new Date();

  const primerDiaMes = new Date(
    fechaActual.getFullYear(),
    fechaActual.getMonth(),
    1
  ).toLocaleDateString('en-CA');

  const hoy = fechaActual.toLocaleDateString('en-CA');

  const [idSucursal, setIdSucursal] = useState('');
  const [sucursales, setSucursales] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [cargando, setCargando] = useState(false);

  const [fechaInicio, setFechaInicio] = useState(primerDiaMes);
  const [fechaFin, setFechaFin] = useState(hoy);

  const resumen = dashboard?.resumen || {};
  const ultimasVentas = dashboard?.ultimas_ventas || [];
  const productosBajoStock = dashboard?.productos_bajo_stock || [];
  const productosCaducidadDetalle = dashboard?.productos_caducidad_detalle || [];

  const ventasPorMetodoPago = dashboard?.ventas_por_metodo_pago || [];
  const productosMasVendidos = dashboard?.productos_mas_vendidos || [];
  const categoriasMasVendidas = dashboard?.categorias_mas_vendidas || [];

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

    if (!fechaInicio || !fechaFin) {
      Swal.fire({
        icon: 'warning',
        title: 'Fechas requeridas',
        text: 'Selecciona la fecha de inicio y la fecha final.',
      });
      return;
    }

    if (fechaInicio > fechaFin) {
      Swal.fire({
        icon: 'warning',
        title: 'Rango inválido',
        text: 'La fecha de inicio no puede ser mayor que la fecha final.',
      });
      return;
    }

    try {
      setCargando(true);

      const { data } = await api.get(
        `/dashboard/resumen?sucursal=${idSucursal}&fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`
      );

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

  const formatoFechaSimple = (fecha) => {
    if (!fecha) return '—';

    return new Date(fecha).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const ventasPorMetodoGrafica = useMemo(() => {
    return ventasPorMetodoPago.map((item) => ({
      metodo: item.metodo || 'No especificado',
      ventas: Number(item.ventas || 0),
      total: Number(item.total || 0),
    }));
  }, [ventasPorMetodoPago]);

  const productosMasVendidosGrafica = useMemo(() => {
    return productosMasVendidos.slice(0, 10).map((item) => ({
      ...item,
      producto:
        item.producto?.length > 22
          ? `${item.producto.substring(0, 22)}...`
          : item.producto,
      cantidad: Number(item.cantidad || 0),
      total: Number(item.total || 0),
      ganancia: Number(item.ganancia || 0),
    }));
  }, [productosMasVendidos]);

  const categoriasMasVendidasGrafica = useMemo(() => {
    return categoriasMasVendidas.slice(0, 8).map((item) => ({
      ...item,
      categoria:
        item.categoria?.length > 18
          ? `${item.categoria.substring(0, 18)}...`
          : item.categoria,
      cantidad: Number(item.cantidad || 0),
      total: Number(item.total || 0),
      ganancia: Number(item.ganancia || 0),
    }));
  }, [categoriasMasVendidas]);

  const coloresGrafica = [
    '#0284c7',
    '#0ea5e9',
    '#38bdf8',
    '#7dd3fc',
    '#10b981',
    '#22c55e',
    '#f59e0b',
    '#ef4444',
  ];

  const abrirModalBajoStock = () => {
    if (productosBajoStock.length === 0) {
      Swal.fire({
        icon: 'success',
        title: 'Sin productos bajo stock',
        text: 'No hay productos que requieran revisión por bajo stock.',
        confirmButtonColor: '#0284c7',
      });
      return;
    }

    const filas = productosBajoStock
      .map(
        (item) => `
          <tr>
            <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:left;">
              <strong style="color:#0f172a;">${item.producto}</strong>
            </td>
            <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:center;color:#b45309;font-weight:700;">
              ${formatoNumero(item.stock_actual)}
            </td>
            <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:center;color:#334155;font-weight:700;">
              ${formatoNumero(item.stock_minimo)}
            </td>
          </tr>
        `
      )
      .join('');

    Swal.fire({
      title: 'Productos bajo stock',
      width: '95%',
      html: `
        <div style="text-align:left;margin-bottom:14px;color:#475569;font-size:14px;">
          Estos productos tienen stock actual menor o igual al mínimo configurado.
        </div>

        <div style="overflow-x:auto;border:1px solid #e5e7eb;border-radius:16px;">
          <table style="width:100%;min-width:620px;border-collapse:collapse;font-size:14px;">
            <thead>
              <tr style="background:#f8fafc;">
                <th style="padding:12px;text-align:left;border-bottom:1px solid #e5e7eb;color:#475569;">Producto</th>
                <th style="padding:12px;text-align:center;border-bottom:1px solid #e5e7eb;color:#475569;">Stock actual</th>
                <th style="padding:12px;text-align:center;border-bottom:1px solid #e5e7eb;color:#475569;">Stock mínimo</th>
              </tr>
            </thead>
            <tbody>
              ${filas}
            </tbody>
          </table>
        </div>
      `,
      confirmButtonText: 'Cerrar',
      confirmButtonColor: '#0284c7',
    });
  };

  const abrirModalCaducidad = () => {
    if (productosCaducidadDetalle.length === 0) {
      Swal.fire({
        icon: 'success',
        title: 'Sin caducidades próximas',
        text: 'No hay productos próximos a caducar en los próximos 90 días.',
        confirmButtonColor: '#0284c7',
      });
      return;
    }

    const filas = productosCaducidadDetalle
      .map((item) => {
        const dias = Number(item.dias_restantes || 0);

        const color =
          dias <= 0
            ? '#dc2626'
            : dias <= 30
            ? '#ea580c'
            : '#ca8a04';

        const fondo =
          dias <= 0
            ? '#fee2e2'
            : dias <= 30
            ? '#ffedd5'
            : '#fef9c3';

        const textoDias = dias <= 0 ? 'Vencido' : `${dias} día(s)`;

        return `
          <tr>
            <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:left;">
              <strong style="color:#0f172a;">${item.producto}</strong>
              <br />
              <span style="font-size:12px;color:#64748b;">
                Lote: ${item.lote || 'Sin lote'}
              </span>
            </td>
            <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:center;color:#334155;font-weight:700;">
              ${formatoNumero(item.stock_actual)}
            </td>
            <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:center;color:#334155;">
              ${formatoFechaSimple(item.fecha_caducidad)}
            </td>
            <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:center;">
              <span style="display:inline-block;padding:5px 10px;border-radius:999px;background:${fondo};color:${color};font-weight:700;font-size:12px;">
                ${textoDias}
              </span>
            </td>
          </tr>
        `;
      })
      .join('');

    Swal.fire({
      title: 'Productos próximos a caducar',
      width: '95%',
      html: `
        <div style="text-align:left;margin-bottom:14px;color:#475569;font-size:14px;">
          Productos con existencia y fecha de caducidad dentro de los próximos 90 días.
        </div>

        <div style="overflow-x:auto;border:1px solid #e5e7eb;border-radius:16px;">
          <table style="width:100%;min-width:760px;border-collapse:collapse;font-size:14px;">
            <thead>
              <tr style="background:#f8fafc;">
                <th style="padding:12px;text-align:left;border-bottom:1px solid #e5e7eb;color:#475569;">Producto</th>
                <th style="padding:12px;text-align:center;border-bottom:1px solid #e5e7eb;color:#475569;">Stock</th>
                <th style="padding:12px;text-align:center;border-bottom:1px solid #e5e7eb;color:#475569;">Caducidad</th>
                <th style="padding:12px;text-align:center;border-bottom:1px solid #e5e7eb;color:#475569;">Restante</th>
              </tr>
            </thead>
            <tbody>
              ${filas}
            </tbody>
          </table>
        </div>
      `,
      confirmButtonText: 'Cerrar',
      confirmButtonColor: '#0284c7',
    });
  };

  const cards = [
    {
      title: 'Total vendido',
      value: formatoMoneda(resumen.total_vendido),
      icon: ShoppingCart,
      detail: `${resumen.total_ventas || 0} venta(s) en el periodo`,
      color: 'sky',
    },
    {
      title: 'Ganancia estimada',
      value: formatoMoneda(resumen.ganancia_total),
      icon: TrendingUp,
      detail: 'Utilidad calculada por costo y precio de venta',
      color: 'emerald',
    },
    {
      title: 'Ticket promedio',
      value: formatoMoneda(resumen.ticket_promedio),
      icon: ReceiptText,
      detail: 'Promedio vendido por venta',
      color: 'violet',
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
      title: 'Bajo stock',
      value: formatoNumero(resumen.productos_bajo_stock),
      icon: AlertTriangle,
      detail: 'Clic para ver productos',
      color: Number(resumen.productos_bajo_stock || 0) > 0 ? 'amber' : 'sky',
      onClick: abrirModalBajoStock,
      clickable: true,
    },
    {
      title: 'Próxima caducidad',
      value: formatoNumero(resumen.productos_caducidad),
      icon: CalendarDays,
      detail: 'Clic para ver productos',
      color: Number(resumen.productos_caducidad || 0) > 0 ? 'red' : 'sky',
      onClick: abrirModalCaducidad,
      clickable: true,
    },
  ];

  const getColorClass = (color) => {
    const colors = {
      sky: 'bg-sky-50 text-sky-700',
      blue: 'bg-blue-50 text-blue-700',
      emerald: 'bg-emerald-50 text-emerald-700',
      violet: 'bg-violet-50 text-violet-700',
      amber: 'bg-amber-50 text-amber-700',
      red: 'bg-red-50 text-red-700',
      slate: 'bg-slate-100 text-slate-700',
    };

    return colors[color] || colors.sky;
  };

  return (
    <div className="w-full max-w-full overflow-hidden space-y-5 sm:space-y-6 pb-8">
      <section className="rounded-2xl sm:rounded-3xl bg-gradient-to-r from-sky-700 to-cyan-700 text-white p-5 sm:p-6 lg:p-8 shadow-xl overflow-hidden">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5 sm:gap-6">
          <div className="min-w-0">
            <p className="text-sky-100 font-semibold text-sm sm:text-base">
              Bienvenido al sistema
            </p>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mt-2 break-words">
              Hola, {usuario?.nombre}
            </h1>

            <p className="text-sky-100 mt-3 max-w-2xl text-sm sm:text-base leading-relaxed">
              Desde este panel podrás controlar ventas, inventario, cortes de caja,
              sucursales y operaciones principales de la farmacia.
            </p>
          </div>

          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 gap-3 w-full xl:w-auto">
            <div className="rounded-2xl bg-white/15 p-4 min-w-0">
              <BadgeDollarSign size={24} />
              <p className="text-sm mt-2 text-sky-100">
                Ganancia del periodo
              </p>
              <p className="font-bold break-words">
                {formatoMoneda(resumen.ganancia_total)}
              </p>
            </div>

            <div className="rounded-2xl bg-white/15 p-4 min-w-0">
              <Boxes size={24} />
              <p className="text-sm mt-2 text-sky-100">
                Sucursales asignadas
              </p>
              <p className="font-bold">
                {usuario?.sucursales?.length || 0}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-100 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 items-end">
          <div className="md:col-span-2 xl:col-span-2 min-w-0">
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Sucursal
            </label>

            {puedeCambiarSucursal ? (
              <select
                value={idSucursal}
                onChange={(e) => setIdSucursal(e.target.value)}
                className="w-full min-w-0 px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
              >
                <option value="">Selecciona sucursal</option>
                {sucursales.map((sucursal) => (
                  <option key={sucursal.id_sucursal} value={sucursal.id_sucursal}>
                    {sucursal.nombre}
                  </option>
                ))}
              </select>
            ) : (
              <div className="w-full min-w-0 px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 font-semibold truncate">
                {sucursalActual?.nombre || sucursales[0]?.nombre || 'Sucursal asignada'}
              </div>
            )}
          </div>

          <div className="min-w-0">
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Fecha inicio
            </label>

            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full min-w-0 px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="min-w-0">
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Fecha fin
            </label>

            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="w-full min-w-0 px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <button
            onClick={cargarDashboard}
            disabled={!idSucursal || cargando}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition disabled:opacity-50"
          >
            <RefreshCw size={19} className={cargando ? 'animate-spin' : ''} />
            Filtrar
          </button>
        </div>

        <div className="mt-4 flex flex-col lg:flex-row lg:items-center gap-2 text-sm text-slate-500">
          <div className="flex items-start sm:items-center gap-2 min-w-0">
            <Store size={16} className="shrink-0 mt-0.5 sm:mt-0" />
            <span className="break-words">
              {sucursalActual
                ? `Mostrando datos de ${sucursalActual.nombre}`
                : 'Selecciona una sucursal para ver datos reales'}
            </span>
          </div>

          <span className="hidden lg:inline">•</span>

          <div className="flex items-start sm:items-center gap-2 min-w-0">
            <CalendarDays size={16} className="shrink-0 mt-0.5 sm:mt-0" />
            <span className="break-words">
              Periodo: {fechaInicio} al {fechaFin}
            </span>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-4 sm:gap-5">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              onClick={card.onClick}
              className={`bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-100 transition min-w-0 ${
                card.clickable
                  ? 'cursor-pointer hover:-translate-y-1 hover:shadow-lg hover:border-sky-200'
                  : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${getColorClass(
                    card.color
                  )}`}
                >
                  <Icon size={24} />
                </div>
              </div>

              <p className="text-sm text-slate-500 mt-5">
                {card.title}
              </p>

              <h3 className="text-2xl sm:text-3xl font-bold text-slate-800 mt-1 break-words">
                {cargando ? '...' : card.value}
              </h3>

              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                {card.detail}
              </p>
            </div>
          );
        })}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-5 sm:gap-6">
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-100 min-w-0 overflow-hidden">
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              Formas de pago
            </h3>
            <p className="text-sm text-slate-500">
              Dinero recibido por método de pago.
            </p>
          </div>

          <div className="mt-6 h-72 sm:h-80 min-w-0">
            {ventasPorMetodoGrafica.length === 0 ? (
              <div className="h-full rounded-2xl bg-slate-50 flex items-center justify-center text-slate-500 font-semibold text-center px-4">
                No hay pagos registrados para graficar.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ventasPorMetodoGrafica}
                    dataKey="total"
                    nameKey="metodo"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={85}
                    paddingAngle={4}
                  >
                    {ventasPorMetodoGrafica.map((entry, index) => (
                      <Cell
                        key={`cell-${entry.metodo}`}
                        fill={coloresGrafica[index % coloresGrafica.length]}
                      />
                    ))}
                  </Pie>

                  <Tooltip formatter={(value) => formatoMoneda(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="xl:col-span-2 bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-100 min-w-0 overflow-hidden">
          <div className="flex items-start sm:items-center justify-between gap-4">
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-slate-800">
                Productos más vendidos
              </h3>
              <p className="text-sm text-slate-500">
                Productos con mayor movimiento en el periodo seleccionado.
              </p>
            </div>

            <Package className="text-sky-600 shrink-0" />
          </div>

          <div className="mt-6 overflow-x-auto">
            <div className="h-80 min-w-[620px]">
              {productosMasVendidosGrafica.length === 0 ? (
                <div className="h-full rounded-2xl bg-slate-50 flex items-center justify-center text-slate-500 font-semibold text-center px-4">
                  No hay productos vendidos en este periodo.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={productosMasVendidosGrafica}
                    layout="vertical"
                    margin={{ left: 30, right: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis
                      type="category"
                      dataKey="producto"
                      tick={{ fontSize: 12 }}
                      width={140}
                    />
                    <Tooltip
                      formatter={(value, name) => {
                        if (name === 'Total vendido' || name === 'Ganancia') {
                          return formatoMoneda(value);
                        }

                        return formatoNumero(value);
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="cantidad"
                      name="Cantidad vendida"
                      fill="#0284c7"
                      radius={[0, 8, 8, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-100 min-w-0 overflow-hidden">
        <div className="flex items-start sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-slate-800">
              Categorías más vendidas
            </h3>
            <p className="text-sm text-slate-500">
              Categorías que generan más ingresos y utilidad.
            </p>
          </div>

          <ChartNoAxesColumnIncreasing className="text-sky-600 shrink-0" />
        </div>

        <div className="mt-6 overflow-x-auto">
          <div className="h-80 sm:h-96 min-w-[680px]">
            {categoriasMasVendidasGrafica.length === 0 ? (
              <div className="h-full rounded-2xl bg-slate-50 flex items-center justify-center text-slate-500 font-semibold text-center px-4">
                No hay categorías vendidas en este periodo.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoriasMasVendidasGrafica} margin={{ right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="categoria" tick={{ fontSize: 12 }} />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) =>
                      `$${Number(value).toLocaleString('es-MX')}`
                    }
                  />
                  <Tooltip formatter={(value) => formatoMoneda(value)} />
                  <Legend />
                  <Bar
                    dataKey="total"
                    name="Total vendido"
                    fill="#0284c7"
                    radius={[8, 8, 0, 0]}
                  />
                  <Bar
                    dataKey="ganancia"
                    name="Ganancia"
                    fill="#10b981"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-5 sm:gap-6">
        <div className="xl:col-span-2 bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-100 min-w-0 overflow-hidden">
          <div className="flex items-start sm:items-center justify-between gap-4">
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-slate-800">
                Últimas ventas
              </h3>
              <p className="text-sm text-slate-500">
                Movimientos recientes del punto de venta.
              </p>
            </div>

            <ReceiptText className="text-slate-400 shrink-0" />
          </div>

          {/* Vista móvil */}
          <div className="mt-5 space-y-3 md:hidden">
            {ultimasVentas.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 p-5 text-center text-slate-500 font-semibold">
                No hay ventas recientes.
              </div>
            ) : (
              ultimasVentas.map((venta) => (
                <div
                  key={venta.id_venta}
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500 font-bold uppercase">
                        Folio
                      </p>
                      <p className="font-bold text-slate-800 break-words">
                        {venta.folio}
                      </p>
                    </div>

                    <p className="font-bold text-sky-700 text-right shrink-0">
                      {formatoMoneda(venta.total)}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-2 mt-4 text-sm">
                    <div>
                      <span className="text-slate-500">Fecha: </span>
                      <span className="font-semibold text-slate-700">
                        {formatoFecha(venta.fecha_venta)}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500">Método: </span>
                      <span className="font-semibold text-slate-700">
                        {venta.metodo_pago}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500">Cajero: </span>
                      <span className="font-semibold text-slate-700">
                        {venta.usuario}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Vista escritorio/tablet */}
          <div className="mt-5 overflow-x-auto hidden md:block">
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
                      <td className="px-4 py-3 text-right font-bold text-sky-700">
                        {formatoMoneda(venta.total)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-100 min-w-0 overflow-hidden">
          <div className="flex items-start sm:items-center justify-between gap-4">
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-slate-800">
                Productos bajo stock
              </h3>
              <p className="text-sm text-slate-500">
                Requieren revisión.
              </p>
            </div>

            <AlertTriangle className="text-amber-500 shrink-0" />
          </div>

          <div className="mt-5 space-y-3">
            {productosBajoStock.length === 0 ? (
              <div className="rounded-2xl bg-sky-50 p-4 text-sky-700 font-semibold text-sm">
                No hay productos bajo stock.
              </div>
            ) : (
              productosBajoStock.slice(0, 5).map((item) => (
                <div
                  key={item.id_inventario}
                  className="rounded-2xl bg-amber-50 border border-amber-100 p-4"
                >
                  <p className="font-bold text-slate-800 break-words">
                    {item.producto}
                  </p>

                  <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                    <span className="text-slate-500">
                      Stock actual
                    </span>
                    <span className="font-bold text-amber-700">
                      {formatoNumero(item.stock_actual)}
                    </span>
                  </div>

                  <div className="mt-1 flex items-center justify-between gap-3 text-sm">
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

    </div>
  );
}