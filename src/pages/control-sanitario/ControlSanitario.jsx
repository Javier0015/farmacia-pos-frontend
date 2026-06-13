import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  RefreshCw,
  ClipboardList,
  FileText,
  Eye,
  X,
  Filter,
  CalendarDays,
  Building2,
  Package,
  User,
  Stethoscope,
  ReceiptText,
  AlertTriangle,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import Swal from 'sweetalert2';

import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import {
  esSuperAdmin,
  obtenerSucursalInicial,
  filtrarSucursalesPorRol,
} from '../../utils/sucursalPermisos';

const TIPO_RECETA_OPTIONS = [
  { value: '', label: 'Todas' },
  { value: 'EXTERNA', label: 'Externa' },
  { value: 'SHADDAI', label: 'Doctor Shaddai' },
];

const TIPO_SURTIDO_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'COMPLETO', label: 'Completo' },
  { value: 'PARCIAL', label: 'Parcial' },
];

const obtenerFechaInicialMes = () => {
  const fecha = new Date();
  const yyyy = fecha.getFullYear();
  const mm = String(fecha.getMonth() + 1).padStart(2, '0');
  return `${yyyy}-${mm}-01`;
};

const obtenerFechaActual = () => {
  const fecha = new Date();
  const yyyy = fecha.getFullYear();
  const mm = String(fecha.getMonth() + 1).padStart(2, '0');
  const dd = String(fecha.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
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

const formatearFechaCorta = (fecha) => {
  if (!fecha) return 'N/A';
  const valor = new Date(fecha);
  if (Number.isNaN(valor.getTime())) return 'N/A';

  return valor.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

const formatoNumero = (valor) => {
  return Number(valor || 0).toLocaleString('es-MX', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

const formatoMoneda = (valor) => {
  return Number(valor || 0).toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
  });
};

const normalizarTexto = (valor) => {
  return String(valor || '').trim();
};

const limpiarValorExcel = (valor) => {
  if (valor === null || valor === undefined || valor === '') return '';
  return String(valor)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
};

const formatearFechaArchivo = () => {
  const fecha = new Date();
  const yyyy = fecha.getFullYear();
  const mm = String(fecha.getMonth() + 1).padStart(2, '0');
  const dd = String(fecha.getDate()).padStart(2, '0');
  const hh = String(fecha.getHours()).padStart(2, '0');
  const mi = String(fecha.getMinutes()).padStart(2, '0');

  return `${yyyy}${mm}${dd}_${hh}${mi}`;
};

const badgeTipoMovimiento = (tipo) => {
  const valor = String(tipo || '').toUpperCase();

  if (valor === 'SALIDA') {
    return 'bg-red-100 text-red-700 ring-red-200';
  }

  if (valor === 'ENTRADA') {
    return 'bg-emerald-100 text-emerald-700 ring-emerald-200';
  }

  if (valor === 'CANCELACION') {
    return 'bg-amber-100 text-amber-800 ring-amber-200';
  }

  return 'bg-slate-100 text-slate-700 ring-slate-200';
};

const badgeTipoReceta = (tipo) => {
  const valor = String(tipo || '').toUpperCase();

  if (valor === 'SHADDAI') {
    return 'bg-sky-100 text-sky-700 ring-sky-200';
  }

  if (valor === 'EXTERNA') {
    return 'bg-violet-100 text-violet-700 ring-violet-200';
  }

  return 'bg-slate-100 text-slate-700 ring-slate-200';
};

const badgeTipoSurtido = (tipo) => {
  const valor = String(tipo || '').toUpperCase();

  if (valor === 'COMPLETO') {
    return 'bg-emerald-100 text-emerald-700 ring-emerald-200';
  }

  if (valor === 'PARCIAL') {
    return 'bg-orange-100 text-orange-700 ring-orange-200';
  }

  return 'bg-slate-100 text-slate-700 ring-slate-200';
};

export default function ControlSanitario() {
  const { usuario } = useAuth();

  const puedeVerTodasSucursales = esSuperAdmin(usuario);

  const [sucursales, setSucursales] = useState([]);
  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [detalleSeleccionado, setDetalleSeleccionado] = useState(null);

  const [filtros, setFiltros] = useState({
    sucursal: '',
    fecha_inicio: obtenerFechaInicialMes(),
    fecha_fin: obtenerFechaActual(),
    buscar: '',
    tipo_receta: '',
    tipo_surtido: '',
  });

  const sucursalActual = useMemo(() => {
    return sucursales.find((sucursal) => {
      return Number(sucursal.id_sucursal) === Number(filtros.sucursal);
    });
  }, [sucursales, filtros.sucursal]);

  const resumen = useMemo(() => {
    const totalRegistros = registros.length;
    const salidas = registros.filter((item) => String(item.tipo_movimiento).toUpperCase() === 'SALIDA');
    const cancelaciones = registros.filter((item) => String(item.tipo_movimiento).toUpperCase() === 'CANCELACION');
    const recetasExternas = registros.filter((item) => String(item.tipo_receta).toUpperCase() === 'EXTERNA');
    const recetasParciales = registros.filter((item) => String(item.tipo_surtido).toUpperCase() === 'PARCIAL');

    const piezasSalida = salidas.reduce((acc, item) => acc + Number(item.cantidad_salida || 0), 0);

    return {
      totalRegistros,
      totalSalidas: salidas.length,
      totalCancelaciones: cancelaciones.length,
      totalExternas: recetasExternas.length,
      totalParciales: recetasParciales.length,
      piezasSalida,
    };
  }, [registros]);

  const cargarSucursales = async () => {
    try {
      const { data } = await api.get('/sucursales');

      if (data.ok) {
        const activas = (data.sucursales || []).filter((sucursal) => sucursal.activo);
        const permitidas = filtrarSucursalesPorRol(usuario, activas);

        setSucursales(permitidas);

        if (!puedeVerTodasSucursales && !filtros.sucursal) {
          setFiltros((prev) => ({
            ...prev,
            sucursal: obtenerSucursalInicial(usuario, permitidas),
          }));
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

  const construirParametros = () => {
    const params = new URLSearchParams();

    if (puedeVerTodasSucursales && filtros.sucursal) {
      params.append('sucursal', filtros.sucursal);
    }

    if (filtros.fecha_inicio) {
      params.append('fecha_inicio', filtros.fecha_inicio);
    }

    if (filtros.fecha_fin) {
      params.append('fecha_fin', filtros.fecha_fin);
    }

    if (filtros.buscar.trim()) {
      params.append('buscar', filtros.buscar.trim());
    }

    if (filtros.tipo_receta) {
      params.append('tipo_receta', filtros.tipo_receta);
    }

    if (filtros.tipo_surtido) {
      params.append('tipo_surtido', filtros.tipo_surtido);
    }

    return params;
  };

  const cargarLibroControl = async () => {
    try {
      setCargando(true);

      const params = construirParametros();
      const { data } = await api.get(`/control-sanitario/libro?${params.toString()}`);

      if (data.ok) {
        setRegistros(data.registros || []);
      }
    } catch (error) {
      console.error('Error al cargar libro de control sanitario:', error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudo cargar el libro de control sanitario.',
      });
    } finally {
      setCargando(false);
    }
  };

  const limpiarFiltros = () => {
    setFiltros({
      sucursal: puedeVerTodasSucursales ? '' : filtros.sucursal,
      fecha_inicio: obtenerFechaInicialMes(),
      fecha_fin: obtenerFechaActual(),
      buscar: '',
      tipo_receta: '',
      tipo_surtido: '',
    });
  };

  const actualizarFiltro = (campo, valor) => {
    setFiltros((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  };

  useEffect(() => {
    if (usuario) {
      cargarSucursales();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario]);

  useEffect(() => {
    if (usuario) {
      cargarLibroControl();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario]);

  const exportarExcelLibroControl = () => {
    if (!registros.length) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin registros',
        text: 'No hay registros para exportar con los filtros actuales.',
      });
      return;
    }

    const columnas = [
      { key: 'id_movimiento', label: 'ID movimiento' },
      { key: 'fecha_registro', label: 'Fecha registro', format: formatearFecha },
      { key: 'tipo_movimiento', label: 'Tipo movimiento' },
      { key: 'estatus', label: 'Estatus' },

      { key: 'folio_venta', label: 'Folio venta' },
      { key: 'fecha_venta', label: 'Fecha venta', format: formatearFecha },
      { key: 'estado_venta', label: 'Estado venta' },
      { key: 'metodo_pago', label: 'Método pago' },
      { key: 'total_venta', label: 'Total venta' },

      { key: 'codigo_barras', label: 'Código barras' },
      { key: 'producto', label: 'Producto' },
      { key: 'laboratorio', label: 'Laboratorio' },
      { key: 'presentacion', label: 'Presentación' },
      { key: 'lote', label: 'Lote' },
      { key: 'fecha_caducidad', label: 'Caducidad', format: formatearFechaCorta },

      { key: 'sucursal', label: 'Sucursal' },
      { key: 'usuario_registro', label: 'Usuario registro' },

      { key: 'cantidad_entrada', label: 'Cantidad entrada' },
      { key: 'cantidad_salida', label: 'Cantidad salida' },
      { key: 'existencia_despues', label: 'Existencia después' },

      { key: 'tipo_receta', label: 'Tipo receta' },
      { key: 'numero_receta', label: 'Número receta' },
      { key: 'fecha_receta', label: 'Fecha receta', format: formatearFechaCorta },

      { key: 'medico_nombre', label: 'Médico' },
      { key: 'medico_cedula', label: 'Cédula médico' },

      { key: 'paciente_nombre', label: 'Paciente' },
      { key: 'paciente_telefono', label: 'Teléfono paciente' },

      { key: 'cantidad_recetada', label: 'Cantidad recetada' },
      { key: 'cantidad_surtida', label: 'Cantidad surtida' },
      { key: 'cantidad_pendiente', label: 'Cantidad pendiente' },
      { key: 'tipo_surtido', label: 'Tipo surtimiento' },

      { key: 'observaciones', label: 'Observaciones' },
    ];

    const encabezados = columnas
      .map((columna) => `<th>${limpiarValorExcel(columna.label)}</th>`)
      .join('');

    const filas = registros
      .map((registro) => {
        const celdas = columnas
          .map((columna) => {
            const valor = columna.format
              ? columna.format(registro[columna.key])
              : registro[columna.key];

            return `<td>${limpiarValorExcel(valor)}</td>`;
          })
          .join('');

        return `<tr>${celdas}</tr>`;
      })
      .join('');

    const filtrosAplicados = [
      ['Sucursal', puedeVerTodasSucursales ? (sucursalActual?.nombre || 'Todas') : (sucursalActual?.nombre || 'Sucursal asignada')],
      ['Fecha inicio', filtros.fecha_inicio || 'Todas'],
      ['Fecha fin', filtros.fecha_fin || 'Todas'],
      ['Búsqueda', filtros.buscar || 'Sin búsqueda'],
      ['Tipo receta', filtros.tipo_receta || 'Todas'],
      ['Tipo surtimiento', filtros.tipo_surtido || 'Todos'],
    ];

    const filasFiltros = filtrosAplicados
      .map(([label, value]) => `
        <tr>
          <td style="font-weight:bold;background:#f1f5f9">${limpiarValorExcel(label)}</td>
          <td>${limpiarValorExcel(value)}</td>
        </tr>
      `)
      .join('');

    const html = `
      <html>
        <head>
          <meta charset="UTF-8" />
          <style>
            table { border-collapse: collapse; width: 100%; }
            th {
              background: #ea580c;
              color: #ffffff;
              font-weight: bold;
              border: 1px solid #cbd5e1;
              padding: 8px;
              text-align: left;
            }
            td {
              border: 1px solid #cbd5e1;
              padding: 7px;
              mso-number-format: "\\@";
            }
            .titulo {
              font-size: 20px;
              font-weight: bold;
              color: #0f172a;
            }
            .subtitulo {
              color: #475569;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <table>
            <tr>
              <td class="titulo" colspan="${columnas.length}">Libro de control sanitario</td>
            </tr>
            <tr>
              <td class="subtitulo" colspan="${columnas.length}">
                Exportado: ${limpiarValorExcel(formatearFecha(new Date()))}
              </td>
            </tr>
            <tr>
              <td class="subtitulo" colspan="${columnas.length}">
                Registros: ${limpiarValorExcel(registros.length)}
              </td>
            </tr>
          </table>

          <br />

          <table>
            <tr>
              <th colspan="2">Filtros aplicados</th>
            </tr>
            ${filasFiltros}
          </table>

          <br />

          <table>
            <thead>
              <tr>${encabezados}</tr>
            </thead>
            <tbody>
              ${filas}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const blob = new Blob([html], {
      type: 'application/vnd.ms-excel;charset=utf-8;',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `libro_control_sanitario_${formatearFechaArchivo()}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    Swal.fire({
      icon: 'success',
      title: 'Excel generado',
      text: `Se exportaron ${registros.length} registro(s).`,
      timer: 1400,
      showConfirmButton: false,
    });
  };

  const alPresionarEnterBusqueda = (event) => {
    if (event.key === 'Enter') {
      cargarLibroControl();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-8">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-orange-600 text-white shadow-lg shadow-orange-600/20">
              <ClipboardList size={28} />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                  Control sanitario
                </h1>

                <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-700">
                  Libro de control
                </span>
              </div>

              <p className="mt-1 max-w-3xl text-sm text-slate-500 sm:text-base">
                Consulta los movimientos de medicamentos controlados, recetas externas, surtimientos parciales y cancelaciones.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={exportarExcelLibroControl}
              disabled={cargando || registros.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FileText size={18} />
              Exportar Excel
            </button>

            <button
              type="button"
              onClick={cargarLibroControl}
              disabled={cargando}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw size={18} className={cargando ? 'animate-spin' : ''} />
              Actualizar
            </button>
          </div>
        </div>
      </section>

      <section className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        <ResumenCard
          titulo="Registros"
          valor={formatoNumero(resumen.totalRegistros)}
          subtitulo="Movimientos encontrados"
          icono={FileText}
          className="border-slate-200 bg-white text-slate-900"
        />

        <ResumenCard
          titulo="Salidas"
          valor={formatoNumero(resumen.totalSalidas)}
          subtitulo={`${formatoNumero(resumen.piezasSalida)} pieza(s)`}
          icono={Package}
          className="border-red-200 bg-red-50 text-red-900"
        />

        <ResumenCard
          titulo="Externas"
          valor={formatoNumero(resumen.totalExternas)}
          subtitulo="Recetas no Shaddai"
          icono={ReceiptText}
          className="border-violet-200 bg-violet-50 text-violet-900"
        />

        <ResumenCard
          titulo="Parciales"
          valor={formatoNumero(resumen.totalParciales)}
          subtitulo="Pendientes por surtir"
          icono={AlertTriangle}
          className="border-orange-200 bg-orange-50 text-orange-900"
        />

        <ResumenCard
          titulo="Cancelaciones"
          valor={formatoNumero(resumen.totalCancelaciones)}
          subtitulo="Movimientos reversados"
          icono={CheckCircle}
          className="border-amber-200 bg-amber-50 text-amber-900"
        />
      </section>

      <section className="mt-5 rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex items-center gap-2">
          <Filter size={20} className="text-slate-500" />
          <h2 className="text-lg font-black text-slate-900">Filtros</h2>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
          <div className="xl:col-span-2">
            <label className="mb-1 block text-xs font-black uppercase text-slate-500">
              Buscar
            </label>
            <div className="relative">
              <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
              <input
                value={filtros.buscar}
                onChange={(event) => actualizarFiltro('buscar', event.target.value)}
                onKeyDown={alPresionarEnterBusqueda}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition focus:bg-white focus:ring-2 focus:ring-orange-500"
                placeholder="Producto, receta, paciente, médico, lote..."
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-black uppercase text-slate-500">
              Fecha inicio
            </label>
            <input
              type="date"
              value={filtros.fecha_inicio}
              onChange={(event) => actualizarFiltro('fecha_inicio', event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:bg-white focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-black uppercase text-slate-500">
              Fecha fin
            </label>
            <input
              type="date"
              value={filtros.fecha_fin}
              onChange={(event) => actualizarFiltro('fecha_fin', event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:bg-white focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-black uppercase text-slate-500">
              Tipo receta
            </label>
            <select
              value={filtros.tipo_receta}
              onChange={(event) => actualizarFiltro('tipo_receta', event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:bg-white focus:ring-2 focus:ring-orange-500"
            >
              {TIPO_RECETA_OPTIONS.map((opcion) => (
                <option key={opcion.value} value={opcion.value}>
                  {opcion.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-black uppercase text-slate-500">
              Surtimiento
            </label>
            <select
              value={filtros.tipo_surtido}
              onChange={(event) => actualizarFiltro('tipo_surtido', event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:bg-white focus:ring-2 focus:ring-orange-500"
            >
              {TIPO_SURTIDO_OPTIONS.map((opcion) => (
                <option key={opcion.value} value={opcion.value}>
                  {opcion.label}
                </option>
              ))}
            </select>
          </div>

          {puedeVerTodasSucursales && (
            <div className="xl:col-span-2">
              <label className="mb-1 block text-xs font-black uppercase text-slate-500">
                Sucursal
              </label>
              <select
                value={filtros.sucursal}
                onChange={(event) => actualizarFiltro('sucursal', event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:bg-white focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Todas las sucursales</option>
                {sucursales.map((sucursal) => (
                  <option key={sucursal.id_sucursal} value={sucursal.id_sucursal}>
                    {sucursal.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}

          {!puedeVerTodasSucursales && (
            <div className="xl:col-span-2">
              <label className="mb-1 block text-xs font-black uppercase text-slate-500">
                Sucursal
              </label>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700">
                {sucursalActual?.nombre || 'Sucursal asignada'}
              </div>
            </div>
          )}

          <div className="flex items-end gap-2 xl:col-span-2">
            <button
              type="button"
              onClick={cargarLibroControl}
              disabled={cargando}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-orange-600 px-5 py-3 text-sm font-black text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {cargando ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
              Consultar
            </button>

            <button
              type="button"
              onClick={limpiarFiltros}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-200"
            >
              Limpiar
            </button>
          </div>
        </div>
      </section>

      <section className="mt-5 rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <h2 className="text-lg font-black text-slate-900">
              Movimientos del libro
            </h2>
            <p className="text-sm text-slate-500">
              {cargando ? 'Cargando registros...' : `${formatoNumero(registros.length)} registro(s) encontrado(s)`}
            </p>
          </div>

          <button
            type="button"
            onClick={exportarExcelLibroControl}
            disabled={cargando || registros.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-50 px-5 py-3 text-sm font-black text-emerald-700 ring-1 ring-emerald-100 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FileText size={18} />
            Exportar Excel
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1450px] w-full text-left">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 font-black">Fecha</th>
                <th className="px-4 py-3 font-black">Movimiento</th>
                <th className="px-4 py-3 font-black">Venta</th>
                <th className="px-4 py-3 font-black">Producto</th>
                <th className="px-4 py-3 font-black">Lote</th>
                <th className="px-4 py-3 font-black">Salida</th>
                <th className="px-4 py-3 font-black">Existencia</th>
                <th className="px-4 py-3 font-black">Receta</th>
                <th className="px-4 py-3 font-black">Surtimiento</th>
                <th className="px-4 py-3 font-black">Paciente</th>
                <th className="px-4 py-3 font-black">Médico</th>
                <th className="px-4 py-3 font-black">Sucursal</th>
                <th className="px-4 py-3 text-right font-black">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {cargando && (
                <tr>
                  <td colSpan={13} className="px-4 py-10 text-center">
                    <div className="flex flex-col items-center justify-center gap-3 text-slate-500">
                      <Loader2 size={28} className="animate-spin" />
                      <p className="text-sm font-bold">Cargando libro de control...</p>
                    </div>
                  </td>
                </tr>
              )}

              {!cargando && registros.length === 0 && (
                <tr>
                  <td colSpan={13} className="px-4 py-10 text-center">
                    <div className="flex flex-col items-center justify-center gap-3 text-slate-500">
                      <ClipboardList size={32} />
                      <p className="text-sm font-bold">No hay registros con los filtros seleccionados.</p>
                    </div>
                  </td>
                </tr>
              )}

              {!cargando &&
                registros.map((registro) => (
                  <tr key={registro.id_movimiento} className="align-top transition hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-bold text-slate-700">
                      {formatearFecha(registro.fecha_registro)}
                    </td>

                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black ring-1 ${badgeTipoMovimiento(registro.tipo_movimiento)}`}>
                        {registro.tipo_movimiento || 'N/A'}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <p className="text-sm font-black text-slate-900">
                        {registro.folio_venta || 'Sin venta'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {registro.metodo_pago || 'N/A'} · {formatoMoneda(registro.total_venta || 0)}
                      </p>
                    </td>

                    <td className="px-4 py-3">
                      <p className="max-w-[250px] truncate text-sm font-black text-slate-900">
                        {registro.producto}
                      </p>
                      <p className="text-xs text-slate-500">
                        {registro.codigo_barras || 'Sin código'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {registro.laboratorio || 'Sin laboratorio'} · {registro.presentacion || 'Sin presentación'}
                      </p>
                    </td>

                    <td className="px-4 py-3">
                      <p className="text-sm font-black text-slate-800">
                        {registro.lote || 'N/A'}
                      </p>
                      <p className="text-xs text-slate-500">
                        Cad. {formatearFechaCorta(registro.fecha_caducidad)}
                      </p>
                    </td>

                    <td className="px-4 py-3 text-sm font-black text-red-700">
                      {formatoNumero(registro.cantidad_salida)}
                    </td>

                    <td className="px-4 py-3 text-sm font-black text-slate-700">
                      {formatoNumero(registro.existencia_despues)}
                    </td>

                    <td className="px-4 py-3">
                      <span className={`mb-1 inline-flex rounded-full px-3 py-1 text-xs font-black ring-1 ${badgeTipoReceta(registro.tipo_receta)}`}>
                        {registro.tipo_receta || 'N/A'}
                      </span>
                      <p className="text-sm font-bold text-slate-700">
                        {registro.numero_receta || 'Sin número'}
                      </p>
                    </td>

                    <td className="px-4 py-3">
                      <span className={`mb-1 inline-flex rounded-full px-3 py-1 text-xs font-black ring-1 ${badgeTipoSurtido(registro.tipo_surtido)}`}>
                        {registro.tipo_surtido || 'N/A'}
                      </span>
                      <p className="text-xs text-slate-500">
                        Rec: {formatoNumero(registro.cantidad_recetada)} · Sur: {formatoNumero(registro.cantidad_surtida)} · Pend: {formatoNumero(registro.cantidad_pendiente)}
                      </p>
                    </td>

                    <td className="px-4 py-3">
                      <p className="max-w-[190px] truncate text-sm font-black text-slate-900">
                        {registro.paciente_nombre || 'N/A'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {registro.paciente_telefono || 'Sin teléfono'}
                      </p>
                    </td>

                    <td className="px-4 py-3">
                      <p className="max-w-[190px] truncate text-sm font-black text-slate-900">
                        {registro.medico_nombre || 'N/A'}
                      </p>
                      <p className="text-xs text-slate-500">
                        Céd. {registro.medico_cedula || 'N/A'}
                      </p>
                    </td>

                    <td className="px-4 py-3">
                      <p className="max-w-[170px] truncate text-sm font-bold text-slate-700">
                        {registro.sucursal || 'N/A'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {registro.usuario_registro || 'Usuario'}
                      </p>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setDetalleSeleccionado(registro)}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-xs font-black text-white transition hover:bg-slate-800"
                      >
                        <Eye size={16} />
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      {detalleSeleccionado && (
        <ModalDetalleControlSanitario
          registro={detalleSeleccionado}
          onClose={() => setDetalleSeleccionado(null)}
        />
      )}
    </div>
  );
}

function ResumenCard({ titulo, valor, subtitulo, icono: Icono, className = '' }) {
  return (
    <div className={`rounded-3xl border p-4 shadow-sm ${className}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm font-black">{titulo}</p>
        <Icono size={22} />
      </div>
      <p className="text-3xl font-black">{valor}</p>
      <p className="mt-1 text-xs font-bold opacity-70">{subtitulo}</p>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-black uppercase text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-black text-slate-900">
        {value || 'N/A'}
      </p>
    </div>
  );
}

function ModalDetalleControlSanitario({ registro, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-orange-50 px-6 py-5">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-orange-700">
              Detalle de control sanitario
            </p>
            <h2 className="mt-1 text-2xl font-black text-slate-900">
              {registro.producto || 'Producto'}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Movimiento #{registro.id_movimiento} · {formatearFecha(registro.fecha_registro)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-white p-2 text-slate-500 shadow-sm transition hover:bg-slate-100 hover:text-slate-800"
          >
            <X size={22} />
          </button>
        </div>

        <div className="max-h-[calc(92vh-110px)] overflow-y-auto p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <InfoItem label="Folio venta" value={registro.folio_venta} />
            <InfoItem label="Movimiento" value={registro.tipo_movimiento} />
            <InfoItem label="Estatus" value={registro.estatus} />

            <InfoItem label="Sucursal" value={registro.sucursal} />
            <InfoItem label="Usuario registro" value={registro.usuario_registro} />
            <InfoItem label="Fecha venta" value={formatearFecha(registro.fecha_venta)} />
          </div>

          <SeccionDetalle titulo="Producto y lote" icono={Package}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <InfoItem label="Producto" value={registro.producto} />
              <InfoItem label="Código de barras" value={registro.codigo_barras} />
              <InfoItem label="Laboratorio" value={registro.laboratorio} />
              <InfoItem label="Presentación" value={registro.presentacion} />
              <InfoItem label="Lote" value={registro.lote} />
              <InfoItem label="Caducidad" value={formatearFechaCorta(registro.fecha_caducidad)} />
            </div>
          </SeccionDetalle>

          <SeccionDetalle titulo="Cantidades" icono={ClipboardList}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <InfoItem label="Entrada" value={formatoNumero(registro.cantidad_entrada)} />
              <InfoItem label="Salida" value={formatoNumero(registro.cantidad_salida)} />
              <InfoItem label="Existencia después" value={formatoNumero(registro.existencia_despues)} />
              <InfoItem label="Total venta" value={formatoMoneda(registro.total_venta || 0)} />
            </div>
          </SeccionDetalle>

          <SeccionDetalle titulo="Receta y surtimiento" icono={ReceiptText}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <InfoItem label="Tipo receta" value={registro.tipo_receta} />
              <InfoItem label="Número receta" value={registro.numero_receta} />
              <InfoItem label="Fecha receta" value={formatearFechaCorta(registro.fecha_receta)} />
              <InfoItem label="Tipo surtimiento" value={registro.tipo_surtido} />

              <InfoItem label="Cantidad recetada" value={formatoNumero(registro.cantidad_recetada)} />
              <InfoItem label="Cantidad surtida" value={formatoNumero(registro.cantidad_surtida)} />
              <InfoItem label="Cantidad pendiente" value={formatoNumero(registro.cantidad_pendiente)} />
              <InfoItem label="Método pago" value={registro.metodo_pago} />
            </div>
          </SeccionDetalle>

          <SeccionDetalle titulo="Paciente" icono={User}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <InfoItem label="Paciente" value={registro.paciente_nombre} />
              <InfoItem label="Teléfono" value={registro.paciente_telefono} />
            </div>
          </SeccionDetalle>

          <SeccionDetalle titulo="Médico" icono={Stethoscope}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <InfoItem label="Médico" value={registro.medico_nombre} />
              <InfoItem label="Cédula profesional" value={registro.medico_cedula} />
            </div>
          </SeccionDetalle>

          <SeccionDetalle titulo="Observaciones" icono={FileText}>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="whitespace-pre-wrap text-sm font-semibold text-slate-700">
                {normalizarTexto(registro.observaciones) || 'Sin observaciones'}
              </p>
            </div>
          </SeccionDetalle>
        </div>
      </div>
    </div>
  );
}

function SeccionDetalle({ titulo, icono: Icono, children }) {
  return (
    <section className="mt-6">
      <div className="mb-3 flex items-center gap-2">
        <Icono size={20} className="text-orange-600" />
        <h3 className="text-lg font-black text-slate-900">{titulo}</h3>
      </div>
      {children}
    </section>
  );
}
