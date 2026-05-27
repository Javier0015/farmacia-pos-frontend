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
  Store,
  CalendarDays,
  CircleDollarSign,
  BadgeDollarSign,
  ChartNoAxesColumnIncreasing,
  Download,
  X,
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
import * as XLSX from 'xlsx';
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

  const [modalGastosAbierto, setModalGastosAbierto] = useState(false);
  const [busquedaGastos, setBusquedaGastos] = useState('');
  const [paginaGastos, setPaginaGastos] = useState(1);
  const [filasPorPaginaGastos, setFilasPorPaginaGastos] = useState(10);

  const [modalGananciasAbierto, setModalGananciasAbierto] = useState(false);
  const [busquedaGanancias, setBusquedaGanancias] = useState('');
  const [paginaGanancias, setPaginaGanancias] = useState(1);
  const [filasPorPaginaGanancias, setFilasPorPaginaGanancias] = useState(10);

  const resumen = dashboard?.resumen || {};
  const ultimasVentas = dashboard?.ultimas_ventas || [];
  const productosBajoStock = dashboard?.productos_bajo_stock || [];
  const productosCaducidadDetalle = dashboard?.productos_caducidad_detalle || [];
  const gastosOperativosDetalle = dashboard?.gastos_operativos_detalle || [];
  const gananciasProductosDetalle = dashboard?.ganancias_productos_detalle || [];

  const ventasPorMetodoPago = dashboard?.ventas_por_metodo_pago || [];
  const productosMasVendidos = dashboard?.productos_mas_vendidos || [];
  const categoriasMasVendidas = dashboard?.categorias_mas_vendidas || [];

  const sucursalActual = useMemo(() => {
    return sucursales.find(
      (sucursal) => Number(sucursal.id_sucursal) === Number(idSucursal)
    );
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

  const gastosFiltrados = useMemo(() => {
    const texto = busquedaGastos.trim().toLowerCase();

    if (!texto) return gastosOperativosDetalle;

    return gastosOperativosDetalle.filter((item) => {
      return [
        item.tipo,
        item.concepto,
        item.metodo_pago,
        item.referencia,
        item.observaciones,
        item.usuario,
        formatoFecha(item.fecha_movimiento),
        formatoMoneda(item.monto),
      ]
        .join(' ')
        .toLowerCase()
        .includes(texto);
    });
  }, [gastosOperativosDetalle, busquedaGastos]);

  const totalGastosFiltrados = useMemo(() => {
    return gastosFiltrados.reduce(
      (acc, item) => acc + Number(item.monto || 0),
      0
    );
  }, [gastosFiltrados]);

  const totalPaginasGastos = Math.max(
    1,
    Math.ceil(gastosFiltrados.length / filasPorPaginaGastos)
  );

  const gastosPaginados = useMemo(() => {
    const inicio = (paginaGastos - 1) * filasPorPaginaGastos;
    const fin = inicio + filasPorPaginaGastos;

    return gastosFiltrados.slice(inicio, fin);
  }, [gastosFiltrados, paginaGastos, filasPorPaginaGastos]);

  const gananciasFiltradas = useMemo(() => {
    const texto = busquedaGanancias.trim().toLowerCase();

    if (!texto) return gananciasProductosDetalle;

    return gananciasProductosDetalle.filter((item) => {
      return [
        item.producto,
        formatoNumero(item.cantidad_vendida),
        formatoMoneda(item.costo_compra_unitario),
        formatoMoneda(item.precio_venta_promedio),
        formatoMoneda(item.total_costo_compra),
        formatoMoneda(item.total_vendido),
        formatoMoneda(item.ganancia),
        `${formatoNumero(item.margen_porcentaje)}%`,
      ]
        .join(' ')
        .toLowerCase()
        .includes(texto);
    });
  }, [gananciasProductosDetalle, busquedaGanancias]);

  const totalGananciaFiltrada = useMemo(() => {
    return gananciasFiltradas.reduce(
      (acc, item) => acc + Number(item.ganancia || 0),
      0
    );
  }, [gananciasFiltradas]);

  const totalVendidoGananciaFiltrada = useMemo(() => {
    return gananciasFiltradas.reduce(
      (acc, item) => acc + Number(item.total_vendido || 0),
      0
    );
  }, [gananciasFiltradas]);

  const totalCostoGananciaFiltrada = useMemo(() => {
    return gananciasFiltradas.reduce(
      (acc, item) => acc + Number(item.total_costo_compra || 0),
      0
    );
  }, [gananciasFiltradas]);

  const totalPaginasGanancias = Math.max(
    1,
    Math.ceil(gananciasFiltradas.length / filasPorPaginaGanancias)
  );

  const gananciasPaginadas = useMemo(() => {
    const inicio = (paginaGanancias - 1) * filasPorPaginaGanancias;
    const fin = inicio + filasPorPaginaGanancias;

    return gananciasFiltradas.slice(inicio, fin);
  }, [gananciasFiltradas, paginaGanancias, filasPorPaginaGanancias]);

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

  const abrirModalGastosOperativos = () => {
    setBusquedaGastos('');
    setPaginaGastos(1);
    setModalGastosAbierto(true);
  };

  const abrirModalGanancias = () => {
    setBusquedaGanancias('');
    setPaginaGanancias(1);
    setModalGananciasAbierto(true);
  };

  const exportarGastosExcel = () => {
    if (gastosFiltrados.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'Sin datos',
        text: 'No hay gastos operativos para exportar.',
        confirmButtonColor: '#0284c7',
      });
      return;
    }

    const datosExcel = gastosFiltrados.map((item) => ({
      Fecha: formatoFecha(item.fecha_movimiento),
      Tipo: item.tipo || '',
      Concepto: item.concepto || '',
      Método: item.metodo_pago || '',
      Monto: Number(item.monto || 0),
      Referencia: item.referencia || '',
      Observaciones: item.observaciones || '',
      Usuario: item.usuario || '',
    }));

    datosExcel.push({
      Fecha: '',
      Tipo: '',
      Concepto: '',
      Método: 'TOTAL',
      Monto: totalGastosFiltrados,
      Referencia: '',
      Observaciones: '',
      Usuario: '',
    });

    const hoja = XLSX.utils.json_to_sheet(datosExcel);
    const libro = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(libro, hoja, 'Gastos operativos');

    const nombreArchivo = `gastos_operativos_${fechaInicio}_al_${fechaFin}.xlsx`;

    XLSX.writeFile(libro, nombreArchivo);
  };

  const exportarGananciasExcel = () => {
    if (gananciasFiltradas.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'Sin datos',
        text: 'No hay productos para exportar.',
        confirmButtonColor: '#0284c7',
      });
      return;
    }

    const margenGeneral =
      totalVendidoGananciaFiltrada > 0
        ? (totalGananciaFiltrada / totalVendidoGananciaFiltrada) * 100
        : 0;

    const datosExcel = gananciasFiltradas.map((item) => ({
      Producto: item.producto || '',
      'Cantidad vendida': Number(item.cantidad_vendida || 0),
      'Costo compra unitario': Number(item.costo_compra_unitario || 0),
      'Precio venta promedio': Number(item.precio_venta_promedio || 0),
      'Total costo compra': Number(item.total_costo_compra || 0),
      'Total vendido': Number(item.total_vendido || 0),
      'Ganancia estimada': Number(item.ganancia || 0),
      'Margen %': Number(item.margen_porcentaje || 0),
    }));

    datosExcel.push({
      Producto: 'TOTAL',
      'Cantidad vendida': '',
      'Costo compra unitario': '',
      'Precio venta promedio': '',
      'Total costo compra': totalCostoGananciaFiltrada,
      'Total vendido': totalVendidoGananciaFiltrada,
      'Ganancia estimada': totalGananciaFiltrada,
      'Margen %': margenGeneral,
    });

    const hoja = XLSX.utils.json_to_sheet(datosExcel);
    const libro = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(libro, hoja, 'Ganancias por producto');

    const nombreArchivo = `ganancias_productos_${fechaInicio}_al_${fechaFin}.xlsx`;

    XLSX.writeFile(libro, nombreArchivo);
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
      detail: 'Clic para ver utilidad por producto',
      color: 'emerald',
      onClick: abrirModalGanancias,
      clickable: true,
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
      title: 'Gastos operativos',
      value: formatoMoneda(resumen.gastos_operativos),
      icon: CircleDollarSign,
      detail: `${resumen.total_gastos_operativos || 0} movimiento(s) en el periodo`,
      color: Number(resumen.gastos_operativos || 0) > 0 ? 'red' : 'sky',
      onClick: abrirModalGastosOperativos,
      clickable: true,
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
    <div className="w-full max-w-full overflow-hidden pb-10 space-y-6">
      {/* ENCABEZADO */}
      <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-600/40 via-cyan-500/20 to-emerald-500/10" />
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-sky-400/20 blur-3xl" />
        <div className="absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="relative p-5 sm:p-7 lg:p-8">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs sm:text-sm font-bold text-sky-100 border border-white/10">
                <Store size={15} />
                Panel general de farmacia
              </div>

              <h1 className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight break-words">
                Hola, {usuario?.nombre}
              </h1>

              <p className="mt-3 max-w-3xl text-sm sm:text-base text-slate-200 leading-relaxed">
                Consulta el rendimiento de ventas, caja, inventario, gastos operativos,
                utilidad estimada y movimientos recientes por sucursal.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full xl:w-auto">
              <div className="rounded-3xl bg-white/10 border border-white/10 p-4 backdrop-blur-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-sky-100">
                  Venta periodo
                </p>
                <p className="mt-2 text-xl font-black">
                  {cargando ? '...' : formatoMoneda(resumen.total_vendido)}
                </p>
              </div>

              <div className="rounded-3xl bg-white/10 border border-white/10 p-4 backdrop-blur-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-100">
                  Ganancia
                </p>
                <p className="mt-2 text-xl font-black">
                  {cargando ? '...' : formatoMoneda(resumen.ganancia_total)}
                </p>
              </div>

              <div className="rounded-3xl bg-white/10 border border-white/10 p-4 backdrop-blur-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-cyan-100">
                  Ventas
                </p>
                <p className="mt-2 text-xl font-black">
                  {cargando ? '...' : resumen.total_ventas || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FILTROS */}
      <section className="bg-white rounded-[2rem] p-4 sm:p-5 shadow-sm border border-slate-100">
        <div className="flex flex-col lg:flex-row lg:items-end gap-4">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="xl:col-span-2 min-w-0">
              <label className="block text-sm font-black text-slate-700 mb-2">
                Sucursal
              </label>

              {puedeCambiarSucursal ? (
                <select
                  value={idSucursal}
                  onChange={(e) => setIdSucursal(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="">Selecciona sucursal</option>
                  {sucursales.map((sucursal) => (
                    <option
                      key={sucursal.id_sucursal}
                      value={sucursal.id_sucursal}
                    >
                      {sucursal.nombre}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 font-bold truncate">
                  {sucursalActual?.nombre ||
                    sucursales[0]?.nombre ||
                    'Sucursal asignada'}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-black text-slate-700 mb-2">
                Fecha inicio
              </label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-sm font-black text-slate-700 mb-2">
                Fecha fin
              </label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <button
            onClick={cargarDashboard}
            disabled={!idSucursal || cargando}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-slate-950 hover:bg-slate-800 text-white font-black transition disabled:opacity-50"
          >
            <RefreshCw size={19} className={cargando ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3 text-sm text-slate-500">
          <div className="inline-flex items-center gap-2">
            <Store size={16} />
            <span>
              {sucursalActual
                ? `Sucursal: ${sucursalActual.nombre}`
                : 'Selecciona una sucursal'}
            </span>
          </div>

          <span className="hidden sm:inline text-slate-300">•</span>

          <div className="inline-flex items-center gap-2">
            <CalendarDays size={16} />
            <span>
              Periodo: {fechaInicio} al {fechaFin}
            </span>
          </div>
        </div>
      </section>

      {/* KPIS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;

          const isPrincipal =
            card.title === 'Total vendido' ||
            card.title === 'Ganancia estimada' ||
            card.title === 'Caja actual';

          const spanClass =
            card.title === 'Total vendido' || card.title === 'Ganancia estimada'
              ? 'xl:col-span-3'
              : card.title === 'Caja actual'
                ? 'xl:col-span-4'
                : 'xl:col-span-2';

          const borderClass =
            card.color === 'emerald'
              ? 'hover:border-emerald-200'
              : card.color === 'red'
                ? 'hover:border-red-200'
                : card.color === 'amber'
                  ? 'hover:border-amber-200'
                  : 'hover:border-sky-200';

          return (
            <button
              key={card.title}
              type="button"
              onClick={card.onClick}
              disabled={!card.clickable}
              className={`text-left bg-white rounded-[1.7rem] p-5 sm:p-6 border border-slate-100 shadow-sm transition group min-w-0 ${spanClass} ${card.clickable
                ? `hover:-translate-y-1 hover:shadow-xl ${borderClass} cursor-pointer`
                : 'cursor-default'
                }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${getColorClass(
                    card.color
                  )}`}
                >
                  <Icon size={23} />
                </div>

                {card.clickable && (
                  <span className="text-xs font-black text-sky-700 bg-sky-50 px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition">
                    Ver detalle
                  </span>
                )}
              </div>

              <div className={isPrincipal ? 'mt-8' : 'mt-5'}>
                <p className="text-sm font-bold text-slate-500">
                  {card.title}
                </p>

                <h3
                  className={`mt-1 font-black text-slate-950 break-words ${isPrincipal
                    ? 'text-3xl sm:text-4xl'
                    : 'text-2xl sm:text-3xl'
                    }`}
                >
                  {cargando ? '...' : card.value}
                </h3>

                <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                  {card.detail}
                </p>
              </div>
            </button>
          );
        })}
      </section>

      {/* RESUMEN VISUAL */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* FORMAS DE PAGO */}
        <div className="xl:col-span-4 bg-white rounded-[2rem] p-5 sm:p-6 shadow-sm border border-slate-100 min-w-0 overflow-hidden">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-900">
                Formas de pago
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Distribución del dinero recibido.
              </p>
            </div>

            <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center">
              <CircleDollarSign size={22} />
            </div>
          </div>

          <div className="mt-6 h-72">
            {ventasPorMetodoGrafica.length === 0 ? (
              <div className="h-full rounded-3xl bg-slate-50 flex items-center justify-center text-slate-500 font-bold text-center px-4">
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
                    innerRadius={52}
                    outerRadius={88}
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

        {/* PRODUCTOS MAS VENDIDOS */}
        <div className="xl:col-span-8 bg-white rounded-[2rem] p-5 sm:p-6 shadow-sm border border-slate-100 min-w-0 overflow-hidden">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="text-lg font-black text-slate-900">
                Productos más vendidos
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Ranking por cantidad vendida en el periodo.
              </p>
            </div>

            <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
              <Package size={22} />
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <div className="h-80 min-w-[640px]">
              {productosMasVendidosGrafica.length === 0 ? (
                <div className="h-full rounded-3xl bg-slate-50 flex items-center justify-center text-slate-500 font-bold text-center px-4">
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
                      width={150}
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
                      radius={[0, 10, 10, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORÍAS */}
      <section className="bg-white rounded-[2rem] p-5 sm:p-6 shadow-sm border border-slate-100 min-w-0 overflow-hidden">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-lg font-black text-slate-900">
              Categorías más vendidas
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Comparativa de ingresos y utilidad por categoría.
            </p>
          </div>

          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <ChartNoAxesColumnIncreasing size={22} />
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <div className="h-80 sm:h-96 min-w-[720px]">
            {categoriasMasVendidasGrafica.length === 0 ? (
              <div className="h-full rounded-3xl bg-slate-50 flex items-center justify-center text-slate-500 font-bold text-center px-4">
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
                    radius={[10, 10, 0, 0]}
                  />
                  <Bar
                    dataKey="ganancia"
                    name="Ganancia"
                    fill="#10b981"
                    radius={[10, 10, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </section>

      {/* ÚLTIMAS VENTAS + BAJO STOCK */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* ÚLTIMAS VENTAS */}
        <div className="xl:col-span-8 bg-white rounded-[2rem] p-5 sm:p-6 shadow-sm border border-slate-100 min-w-0 overflow-hidden">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="text-lg font-black text-slate-900">
                Últimas ventas
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Movimientos recientes del punto de venta.
              </p>
            </div>

            <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
              <ReceiptText size={22} />
            </div>
          </div>

          {/* MÓVIL */}
          <div className="mt-5 space-y-3 md:hidden">
            {ultimasVentas.length === 0 ? (
              <div className="rounded-3xl bg-slate-50 p-5 text-center text-slate-500 font-bold">
                No hay ventas recientes.
              </div>
            ) : (
              ultimasVentas.map((venta) => (
                <div
                  key={venta.id_venta}
                  className="rounded-3xl border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500 font-black uppercase">
                        Folio
                      </p>
                      <p className="font-black text-slate-900 break-words">
                        {venta.folio}
                      </p>
                    </div>

                    <p className="font-black text-sky-700 text-right shrink-0">
                      {formatoMoneda(venta.total)}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-2 mt-4 text-sm">
                    <div>
                      <span className="text-slate-500">Fecha: </span>
                      <span className="font-bold text-slate-700">
                        {formatoFecha(venta.fecha_venta)}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500">Método: </span>
                      <span className="font-bold text-slate-700">
                        {venta.metodo_pago}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500">Cajero: </span>
                      <span className="font-bold text-slate-700">
                        {venta.usuario}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* DESKTOP */}
          <div className="mt-5 overflow-x-auto hidden md:block rounded-3xl border border-slate-100">
            <table className="w-full min-w-[760px]">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-black text-slate-500 uppercase">
                    Folio
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-black text-slate-500 uppercase">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-black text-slate-500 uppercase">
                    Método
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-black text-slate-500 uppercase">
                    Cajero
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-black text-slate-500 uppercase">
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
                      <td className="px-4 py-3 font-black text-slate-900">
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
                      <td className="px-4 py-3 text-right font-black text-sky-700">
                        {formatoMoneda(venta.total)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* BAJO STOCK */}
        <div className="xl:col-span-4 bg-white rounded-[2rem] p-5 sm:p-6 shadow-sm border border-slate-100 min-w-0 overflow-hidden">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="text-lg font-black text-slate-900">
                Bajo stock
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Productos que requieren revisión.
              </p>
            </div>

            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <AlertTriangle size={22} />
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {productosBajoStock.length === 0 ? (
              <div className="rounded-3xl bg-sky-50 p-5 text-sky-700 font-bold text-sm">
                No hay productos bajo stock.
              </div>
            ) : (
              productosBajoStock.slice(0, 6).map((item) => (
                <button
                  key={item.id_inventario}
                  type="button"
                  onClick={abrirModalBajoStock}
                  className="w-full text-left rounded-3xl bg-amber-50 border border-amber-100 p-4 hover:bg-amber-100 transition"
                >
                  <p className="font-black text-slate-900 break-words">
                    {item.producto}
                  </p>

                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-2xl bg-white/70 p-3">
                      <p className="text-xs text-slate-500 font-bold">
                        Actual
                      </p>
                      <p className="font-black text-amber-700">
                        {formatoNumero(item.stock_actual)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white/70 p-3">
                      <p className="text-xs text-slate-500 font-bold">
                        Mínimo
                      </p>
                      <p className="font-black text-slate-700">
                        {formatoNumero(item.stock_minimo)}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {productosBajoStock.length > 6 && (
            <button
              type="button"
              onClick={abrirModalBajoStock}
              className="mt-4 w-full rounded-2xl bg-slate-950 hover:bg-slate-800 text-white font-black px-4 py-3 transition"
            >
              Ver todos
            </button>
          )}
        </div>
      </section>

      {/* MODAL GASTOS OPERATIVOS */}
      {modalGastosAbierto && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
          <div className="w-full max-w-7xl max-h-[92vh] overflow-hidden bg-white rounded-[2rem] shadow-2xl border border-slate-200">
            <div className="flex items-start justify-between gap-4 p-5 sm:p-6 border-b border-slate-100">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 rounded-full bg-red-50 text-red-700 px-3 py-1 text-xs font-black uppercase tracking-wide">
                  <CircleDollarSign size={15} />
                  Gastos operativos
                </div>
                <h2 className="mt-3 text-xl sm:text-2xl font-black text-slate-900">
                  Detalle de gastos operativos
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Movimientos registrados del {fechaInicio} al {fechaFin}.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setModalGastosAbierto(false)}
                className="w-11 h-11 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 transition"
                aria-label="Cerrar modal de gastos operativos"
              >
                <X size={21} />
              </button>
            </div>

            <div className="p-5 sm:p-6 overflow-auto max-h-[76vh]">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                <div className="rounded-3xl bg-red-50 border border-red-100 p-4">
                  <p className="text-xs font-black text-red-700 uppercase tracking-wide">
                    Total filtrado
                  </p>
                  <p className="mt-2 text-2xl sm:text-3xl font-black text-red-700">
                    {formatoMoneda(totalGastosFiltrados)}
                  </p>
                </div>

                <div className="rounded-3xl bg-slate-50 border border-slate-100 p-4">
                  <p className="text-xs font-black text-slate-500 uppercase tracking-wide">
                    Registros
                  </p>
                  <p className="mt-2 text-2xl sm:text-3xl font-black text-slate-900">
                    {gastosFiltrados.length}
                  </p>
                </div>

                <div className="rounded-3xl bg-sky-50 border border-sky-100 p-4">
                  <p className="text-xs font-black text-sky-700 uppercase tracking-wide">
                    Sucursal
                  </p>
                  <p className="mt-2 text-base font-black text-sky-800 truncate">
                    {sucursalActual?.nombre || 'Sucursal seleccionada'}
                  </p>
                </div>
              </div>

              <div className="mb-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                <div className="flex flex-col sm:flex-row gap-3 flex-1">
                  <input
                    type="text"
                    value={busquedaGastos}
                    onChange={(e) => {
                      setBusquedaGastos(e.target.value);
                      setPaginaGastos(1);
                    }}
                    placeholder="Buscar por concepto, método, usuario, referencia..."
                    className="w-full lg:max-w-xl px-4 py-3 rounded-2xl border border-slate-200 bg-white text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />

                  <select
                    value={filasPorPaginaGastos}
                    onChange={(e) => {
                      setFilasPorPaginaGastos(Number(e.target.value));
                      setPaginaGastos(1);
                    }}
                    className="px-4 py-3 rounded-2xl border border-slate-200 bg-white text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value={10}>10 filas</option>
                    <option value={25}>25 filas</option>
                    <option value={50}>50 filas</option>
                    <option value={100}>100 filas</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={exportarGastosExcel}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black transition"
                >
                  <Download size={18} />
                  Exportar Excel
                </button>
              </div>

              <div className="overflow-x-auto rounded-3xl border border-slate-100">
                <table className="w-full min-w-[1100px]">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-black text-slate-500 uppercase">
                        Fecha
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-black text-slate-500 uppercase">
                        Tipo
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-black text-slate-500 uppercase">
                        Concepto
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-black text-slate-500 uppercase">
                        Método
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-black text-slate-500 uppercase">
                        Monto
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-black text-slate-500 uppercase">
                        Referencia
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-black text-slate-500 uppercase">
                        Usuario
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-black text-slate-500 uppercase">
                        Observaciones
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {gastosPaginados.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="px-4 py-12 text-center text-slate-500 font-bold">
                          No hay gastos operativos para mostrar.
                        </td>
                      </tr>
                    ) : (
                      gastosPaginados.map((item, index) => (
                        <tr key={`${item.id_movimiento || item.id || index}`} className="hover:bg-slate-50 transition">
                          <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                            {formatoFecha(item.fecha_movimiento)}
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-slate-700">
                            {item.tipo || '—'}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-700 font-semibold">
                            {item.concepto || '—'}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {item.metodo_pago || '—'}
                          </td>
                          <td className="px-4 py-3 text-right font-black text-red-600 whitespace-nowrap">
                            {formatoMoneda(item.monto)}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {item.referencia || '—'}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {item.usuario || '—'}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-500 max-w-xs truncate">
                            {item.observaciones || '—'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <p className="text-sm font-bold text-slate-500">
                  Mostrando {gastosPaginados.length} de {gastosFiltrados.length} registro(s)
                </p>

                <div className="flex items-center justify-between sm:justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setPaginaGastos((pagina) => Math.max(1, pagina - 1))}
                    disabled={paginaGastos <= 1}
                    className="px-4 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>

                  <span className="text-sm font-black text-slate-600">
                    Página {paginaGastos} de {totalPaginasGastos}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setPaginaGastos((pagina) => Math.min(totalPaginasGastos, pagina + 1))
                    }
                    disabled={paginaGastos >= totalPaginasGastos}
                    className="px-4 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL GANANCIAS POR PRODUCTO */}
      {modalGananciasAbierto && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
          <div className="w-full max-w-7xl max-h-[92vh] overflow-hidden bg-white rounded-[2rem] shadow-2xl border border-slate-200">
            <div className="flex items-start justify-between gap-4 p-5 sm:p-6 border-b border-slate-100">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 text-emerald-700 px-3 py-1 text-xs font-black uppercase tracking-wide">
                  <TrendingUp size={15} />
                  Ganancia estimada
                </div>
                <h2 className="mt-3 text-xl sm:text-2xl font-black text-slate-900">
                  Utilidad por producto
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Comparativa de costo, venta, margen y utilidad del {fechaInicio} al {fechaFin}.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setModalGananciasAbierto(false)}
                className="w-11 h-11 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 transition"
                aria-label="Cerrar modal de ganancias"
              >
                <X size={21} />
              </button>
            </div>

            <div className="p-5 sm:p-6 overflow-auto max-h-[76vh]">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                <div className="rounded-3xl bg-emerald-50 border border-emerald-100 p-4">
                  <p className="text-xs font-black text-emerald-700 uppercase tracking-wide">
                    Ganancia filtrada
                  </p>
                  <p className="mt-2 text-2xl sm:text-3xl font-black text-emerald-700">
                    {formatoMoneda(totalGananciaFiltrada)}
                  </p>
                </div>

                <div className="rounded-3xl bg-sky-50 border border-sky-100 p-4">
                  <p className="text-xs font-black text-sky-700 uppercase tracking-wide">
                    Total vendido
                  </p>
                  <p className="mt-2 text-2xl sm:text-3xl font-black text-sky-700">
                    {formatoMoneda(totalVendidoGananciaFiltrada)}
                  </p>
                </div>

                <div className="rounded-3xl bg-slate-50 border border-slate-100 p-4">
                  <p className="text-xs font-black text-slate-500 uppercase tracking-wide">
                    Costo estimado
                  </p>
                  <p className="mt-2 text-2xl sm:text-3xl font-black text-slate-900">
                    {formatoMoneda(totalCostoGananciaFiltrada)}
                  </p>
                </div>
              </div>

              <div className="mb-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                <div className="flex flex-col sm:flex-row gap-3 flex-1">
                  <input
                    type="text"
                    value={busquedaGanancias}
                    onChange={(e) => {
                      setBusquedaGanancias(e.target.value);
                      setPaginaGanancias(1);
                    }}
                    placeholder="Buscar producto..."
                    className="w-full lg:max-w-xl px-4 py-3 rounded-2xl border border-slate-200 bg-white text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />

                  <select
                    value={filasPorPaginaGanancias}
                    onChange={(e) => {
                      setFilasPorPaginaGanancias(Number(e.target.value));
                      setPaginaGanancias(1);
                    }}
                    className="px-4 py-3 rounded-2xl border border-slate-200 bg-white text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value={10}>10 filas</option>
                    <option value={25}>25 filas</option>
                    <option value={50}>50 filas</option>
                    <option value={100}>100 filas</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={exportarGananciasExcel}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black transition"
                >
                  <Download size={18} />
                  Exportar Excel
                </button>
              </div>

              <div className="overflow-x-auto rounded-3xl border border-slate-100">
                <table className="w-full min-w-[1200px]">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-black text-slate-500 uppercase">
                        Producto
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-black text-slate-500 uppercase">
                        Cantidad
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-black text-slate-500 uppercase">
                        Costo unitario
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-black text-slate-500 uppercase">
                        Venta promedio
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-black text-slate-500 uppercase">
                        Total costo
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-black text-slate-500 uppercase">
                        Total vendido
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-black text-slate-500 uppercase">
                        Ganancia
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-black text-slate-500 uppercase">
                        Margen
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {gananciasPaginadas.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="px-4 py-12 text-center text-slate-500 font-bold">
                          No hay productos vendidos para mostrar.
                        </td>
                      </tr>
                    ) : (
                      gananciasPaginadas.map((item, index) => (
                        <tr key={`${item.id_producto || index}`} className="hover:bg-slate-50 transition">
                          <td className="px-4 py-3 font-bold text-slate-800 min-w-[260px]">
                            {item.producto || '—'}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600 whitespace-nowrap">
                            {formatoNumero(item.cantidad_vendida)}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600 whitespace-nowrap">
                            {formatoMoneda(item.costo_compra_unitario)}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600 whitespace-nowrap">
                            {formatoMoneda(item.precio_venta_promedio)}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600 whitespace-nowrap">
                            {formatoMoneda(item.total_costo_compra)}
                          </td>
                          <td className="px-4 py-3 text-right text-sky-700 font-black whitespace-nowrap">
                            {formatoMoneda(item.total_vendido)}
                          </td>
                          <td className="px-4 py-3 text-right text-emerald-700 font-black whitespace-nowrap">
                            {formatoMoneda(item.ganancia)}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-700 font-black whitespace-nowrap">
                            {formatoNumero(item.margen_porcentaje)}%
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <p className="text-sm font-bold text-slate-500">
                  Mostrando {gananciasPaginadas.length} de {gananciasFiltradas.length} producto(s)
                </p>

                <div className="flex items-center justify-between sm:justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setPaginaGanancias((pagina) => Math.max(1, pagina - 1))}
                    disabled={paginaGanancias <= 1}
                    className="px-4 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>

                  <span className="text-sm font-black text-slate-600">
                    Página {paginaGanancias} de {totalPaginasGanancias}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setPaginaGanancias((pagina) => Math.min(totalPaginasGanancias, pagina + 1))
                    }
                    disabled={paginaGanancias >= totalPaginasGanancias}
                    className="px-4 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}