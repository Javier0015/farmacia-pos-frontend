import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';

import {
  Search,
  FileText,
  ClipboardList,
  Loader2,
  X,
  Eye,
  Ban,
  RefreshCcw,
  BadgeCheck,
  AlertTriangle,
  Pill,
  Hash,
  Printer,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  Stethoscope,
  UserRound,
} from 'lucide-react';

import api from '../../api/axios';
import logoFarmacia from '../../assets/logoShaddai.png';

const ESTATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'PENDIENTE_CAJERO', label: 'Pendiente cajero' },
  { value: 'SURTIDA_PARCIAL', label: 'Surtida parcial' },
  { value: 'SURTIDA', label: 'Surtida completa' },
  { value: 'CANCELADA', label: 'Cancelada' },
];

const PAGE_SIZE_OPTIONS = [5, 10, 15, 25, 50];

const getBadgeEstatus = (estatus) => {
  switch (estatus) {
    case 'PENDIENTE_CAJERO':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'SURTIDA_PARCIAL':
      return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'SURTIDA':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'CANCELADA':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'ATENDIDA':
      return 'bg-sky-100 text-sky-700 border-sky-200';
    case 'RECHAZADA':
      return 'bg-red-100 text-red-700 border-red-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

const formatearEstatus = (estatus) => {
  switch (estatus) {
    case 'PENDIENTE_CAJERO':
      return 'Pendiente cajero';
    case 'SURTIDA_PARCIAL':
      return 'Surtida parcial';
    case 'SURTIDA':
      return 'Surtida completa';
    case 'CANCELADA':
      return 'Cancelada';
    case 'ATENDIDA':
      return 'Atendida';
    case 'RECHAZADA':
      return 'Rechazada';
    default:
      return estatus || 'Sin estatus';
  }
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
    month: 'long',
    day: '2-digit',
  });
};

const obtenerFechaActual = () => {
  return new Date().toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: '2-digit',
  });
};

const normalizarTexto = (valor) => {
  return String(valor || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
};

const normalizarNumero = (valor, fallback = 0) => {
  const numero = Number(valor);
  return Number.isNaN(numero) ? fallback : numero;
};

const obtenerValorOrden = (receta, key) => {
  switch (key) {
    case 'folio':
      return normalizarTexto(receta.folio_receta || receta.id_receta);
    case 'paciente':
      return normalizarTexto(receta.nombre_paciente);
    case 'doctor':
      return normalizarTexto(
        receta.nombre_doctor_shaddai || receta.nombre_doctor || receta.nombre_doctor_usuario
      );
    case 'estatus':
      return normalizarTexto(receta.estatus);
    case 'fecha':
      return receta.fecha_creacion ? new Date(receta.fecha_creacion).getTime() : 0;
    case 'productos':
      return Number(receta.total_productos || 0);
    default:
      return '';
  }
};

export default function HistorialRecetas() {
  const [recetas, setRecetas] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [busqueda, setBusqueda] = useState('');
  const [estatus, setEstatus] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [paginaActual, setPaginaActual] = useState(1);
  const [orden, setOrden] = useState({ key: 'fecha', direction: 'desc' });

  const [modalSeguimientoAbierto, setModalSeguimientoAbierto] = useState(false);
  const [modalReimpresionAbierto, setModalReimpresionAbierto] = useState(false);
  const [detalleReceta, setDetalleReceta] = useState(null);
  const [detalleProductos, setDetalleProductos] = useState([]);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  const [cancelandoId, setCancelandoId] = useState(null);

  const cargarRecetas = async () => {
    try {
      setCargando(true);

      const { data } = await api.get('/doctor-shaddai/recetas');

      setRecetas(data.recetas || []);
      setPaginaActual(1);
    } catch (error) {
      console.error('Error al cargar recetas:', error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudo cargar el historial de recetas.',
      });
    } finally {
      setCargando(false);
    }
  };

  const cargarDetalleReceta = async (idReceta) => {
    const { data } = await api.get(`/doctor-shaddai/recetas/${idReceta}`);

    return {
      receta: data.receta || null,
      detalles: data.detalles || [],
    };
  };

  const verSeguimientoReceta = async (receta) => {
    if (!receta?.id_receta) return;

    try {
      setCargandoDetalle(true);
      setModalSeguimientoAbierto(true);
      setDetalleReceta(receta);
      setDetalleProductos([]);

      const data = await cargarDetalleReceta(receta.id_receta);

      setDetalleReceta(data.receta || receta);
      setDetalleProductos(data.detalles || []);
    } catch (error) {
      console.error('Error al obtener seguimiento de receta:', error);
      setModalSeguimientoAbierto(false);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudo obtener el seguimiento de la receta.',
      });
    } finally {
      setCargandoDetalle(false);
    }
  };

  const abrirReimpresionReceta = async (receta) => {
    if (!receta?.id_receta) return;

    try {
      setCargandoDetalle(true);
      setModalReimpresionAbierto(true);
      setDetalleReceta(receta);
      setDetalleProductos([]);

      const data = await cargarDetalleReceta(receta.id_receta);

      setDetalleReceta(data.receta || receta);
      setDetalleProductos(data.detalles || []);
    } catch (error) {
      console.error('Error al obtener receta para reimpresión:', error);
      setModalReimpresionAbierto(false);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudo obtener la receta para reimprimir.',
      });
    } finally {
      setCargandoDetalle(false);
    }
  };

  const cancelarReceta = async (receta) => {
    if (!receta?.id_receta) return;

    if (receta.estatus === 'CANCELADA') {
      Swal.fire({
        icon: 'info',
        title: 'Receta ya cancelada',
        text: 'Esta receta ya se encuentra cancelada.',
      });
      return;
    }

    if (receta.estatus === 'SURTIDA' || receta.estatus === 'SURTIDA_PARCIAL') {
      const continuar = await Swal.fire({
        icon: 'warning',
        title: 'La receta ya tiene surtido registrado',
        html: `
          <p>Esta receta tiene productos surtidos desde caja.</p>
          <p>Si la cancelas, solo cambiará el estatus de la receta; no revertirá ventas ni inventario.</p>
        `,
        showCancelButton: true,
        confirmButtonText: 'Continuar y cancelar',
        cancelButtonText: 'Regresar',
        confirmButtonColor: '#dc2626',
      });

      if (!continuar.isConfirmed) return;
    }

    const result = await Swal.fire({
      icon: 'warning',
      title: '¿Cancelar receta?',
      html: `
        <p>Esta acción marcará la receta como <strong>CANCELADA</strong>.</p>
        <p><strong>Folio:</strong> ${receta.folio_receta || receta.id_receta}</p>
        <p><strong>Paciente:</strong> ${receta.nombre_paciente || 'N/A'}</p>
      `,
      showCancelButton: true,
      confirmButtonText: 'Sí, cancelar receta',
      cancelButtonText: 'No cancelar',
      confirmButtonColor: '#dc2626',
    });

    if (!result.isConfirmed) return;

    try {
      setCancelandoId(receta.id_receta);

      const { data } = await api.put(
        `/doctor-shaddai/recetas/${receta.id_receta}/cancelar`
      );

      if (data.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Receta cancelada',
          text: 'La receta fue cancelada correctamente.',
          timer: 1500,
          showConfirmButton: false,
        });

        await cargarRecetas();

        if (detalleReceta?.id_receta === receta.id_receta) {
          setDetalleReceta((prev) => ({
            ...prev,
            estatus: 'CANCELADA',
          }));
        }
      }
    } catch (error) {
      console.error('Error al cancelar receta:', error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.mensaje || 'No se pudo cancelar la receta.',
      });
    } finally {
      setCancelandoId(null);
    }
  };

  const cerrarSeguimiento = () => {
    setModalSeguimientoAbierto(false);
    setDetalleReceta(null);
    setDetalleProductos([]);
  };

  const cerrarReimpresion = () => {
    setModalReimpresionAbierto(false);
    setDetalleReceta(null);
    setDetalleProductos([]);
  };

  const imprimirReceta = () => {
    window.print();
  };

  useEffect(() => {
    cargarRecetas();
  }, []);

  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, estatus, pageSize]);

  const recetasFiltradas = useMemo(() => {
    const texto = normalizarTexto(busqueda);

    return recetas.filter((receta) => {
      const coincideEstatus = estatus ? receta.estatus === estatus : true;

      if (!coincideEstatus) return false;

      if (!texto) return true;

      const textoReceta = normalizarTexto(
        [
          receta.id_receta,
          receta.folio_receta,
          receta.nombre_paciente,
          receta.telefono_paciente,
          receta.diagnostico,
          receta.observaciones,
          receta.estatus,
          receta.nombre_doctor,
          receta.nombre_doctor_shaddai,
          receta.especialidad,
        ].join(' ')
      );

      return textoReceta.includes(texto);
    });
  }, [recetas, busqueda, estatus]);

  const recetasOrdenadas = useMemo(() => {
    const lista = [...recetasFiltradas];

    lista.sort((a, b) => {
      const valorA = obtenerValorOrden(a, orden.key);
      const valorB = obtenerValorOrden(b, orden.key);

      if (valorA < valorB) return orden.direction === 'asc' ? -1 : 1;
      if (valorA > valorB) return orden.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return lista;
  }, [recetasFiltradas, orden]);

  const totalPaginas = Math.max(1, Math.ceil(recetasOrdenadas.length / pageSize));

  const paginaSegura = Math.min(paginaActual, totalPaginas);

  const recetasPagina = useMemo(() => {
    const inicio = (paginaSegura - 1) * pageSize;
    return recetasOrdenadas.slice(inicio, inicio + pageSize);
  }, [recetasOrdenadas, paginaSegura, pageSize]);

  const desde = recetasOrdenadas.length === 0 ? 0 : (paginaSegura - 1) * pageSize + 1;
  const hasta = Math.min(paginaSegura * pageSize, recetasOrdenadas.length);

  const ordenarPor = (key) => {
    setOrden((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === 'asc' ? 'desc' : 'asc',
        };
      }

      return {
        key,
        direction: key === 'fecha' ? 'desc' : 'asc',
      };
    });
  };

  const totalRecetas = recetas.length;

  const totalPendientes = useMemo(() => {
    return recetas.filter((r) => r.estatus === 'PENDIENTE_CAJERO').length;
  }, [recetas]);

  const totalParciales = useMemo(() => {
    return recetas.filter((r) => r.estatus === 'SURTIDA_PARCIAL').length;
  }, [recetas]);

  const totalSurtidas = useMemo(() => {
    return recetas.filter((r) => r.estatus === 'SURTIDA').length;
  }, [recetas]);

  const totalCanceladas = useMemo(() => {
    return recetas.filter((r) => r.estatus === 'CANCELADA').length;
  }, [recetas]);

  const recetaGeneradaParaReimpresion = useMemo(() => {
    if (!detalleReceta) return null;

    return {
      receta: detalleReceta,
      doctor: detalleReceta,
      paciente: {
        nombre_paciente: detalleReceta.nombre_paciente,
        telefono: detalleReceta.telefono_paciente,
        edad: detalleReceta.edad_paciente,
        sexo: detalleReceta.sexo_paciente,
        diagnostico: detalleReceta.diagnostico,
        observaciones: detalleReceta.observaciones,
      },
      productos: (detalleProductos || []).map((item) => ({
        id_producto: item.id_producto,
        nombre: item.nombre_producto || item.nombre || item.producto,
        nombre_generico: item.nombre_generico || item.generico || '',
        forma_farmaceutica: item.forma_farmaceutica || item.forma || '',
        presentacion: item.presentacion || '',
        codigo_barras: item.codigo_barras || '',
        cantidad: item.cantidad_recetada ?? item.cantidad ?? 1,
        dosis: item.dosis || '',
        frecuencia: item.frecuencia || '',
        duracion: item.duracion || '',
        indicaciones: item.indicaciones || '',
      })),
      expediente: detalleReceta.expediente || null,
    };
  }, [detalleReceta, detalleProductos]);

  return (
    <>
      <style>
        {`
          @media print {
            body * {
              visibility: hidden !important;
            }

            #receta-imprimible,
            #receta-imprimible * {
              visibility: visible !important;
            }

            #receta-imprimible {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              height: 50vh !important;
              max-height: 50vh !important;
              padding: 0 !important;
              margin: 0 !important;
              background: white !important;
              overflow: hidden !important;
              z-index: 9999 !important;
            }

            .no-print {
              display: none !important;
            }

            @page {
              size: letter portrait;
              margin: 8mm;
            }
          }
        `}
      </style>

      <div className="space-y-6">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-sky-800 to-cyan-700 p-7 text-white shadow-lg shadow-slate-900/20">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-20 left-8 h-52 w-52 rounded-full bg-white/10 blur-3xl" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
                <ClipboardList size={31} />
              </div>

              <div>
                <h1 className="text-2xl font-bold md:text-3xl">
                  Historial de recetas
                </h1>
                <p className="mt-1 text-sky-100">
                  Consulta el seguimiento de surtido y reimprime recetas sin modificar el diseño original.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={cargarRecetas}
              disabled={cargando}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-sky-800 shadow-lg transition hover:bg-sky-50 disabled:opacity-60"
            >
              {cargando ? <Loader2 size={18} className="animate-spin" /> : <RefreshCcw size={18} />}
              Actualizar
            </button>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <CardResumen
            titulo="Total recetas"
            valor={totalRecetas}
            icono={<FileText size={25} />}
            color="bg-sky-100 text-sky-700"
          />

          <CardResumen
            titulo="Pendientes cajero"
            valor={totalPendientes}
            icono={<BadgeCheck size={25} />}
            color="bg-amber-100 text-amber-700"
          />

          <CardResumen
            titulo="Surtidas parcial"
            valor={totalParciales}
            icono={<AlertTriangle size={25} />}
            color="bg-orange-100 text-orange-700"
          />

          <CardResumen
            titulo="Surtidas completas"
            valor={totalSurtidas}
            icono={<Pill size={25} />}
            color="bg-emerald-100 text-emerald-700"
          />

          <CardResumen
            titulo="Canceladas"
            valor={totalCanceladas}
            icono={<Ban size={25} />}
            color="bg-red-100 text-red-700"
          />
        </section>

        <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                Recetas generadas
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Tabla con búsqueda, filtro por estatus, ordenamiento y paginación.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-[1fr_220px] xl:w-[680px]">
              <div className="relative">
                <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />

                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 py-3 pl-12 pr-4 text-sm outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Buscar por folio, paciente, teléfono, diagnóstico..."
                />
              </div>

              <select
                value={estatus}
                onChange={(e) => setEstatus(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-sky-500"
              >
                {ESTATUS_OPTIONS.map((opcion) => (
                  <option key={opcion.value} value={opcion.value}>
                    {opcion.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span>Mostrar</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-sky-500"
              >
                {PAGE_SIZE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <span>registros</span>
            </div>

            <p className="text-sm font-semibold text-slate-500">
              Mostrando {desde} a {hasta} de {recetasOrdenadas.length} registro(s)
            </p>
          </div>

          {cargando ? (
            <div className="flex min-h-[320px] items-center justify-center rounded-3xl bg-slate-50">
              <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
                <Loader2 className="animate-spin" size={22} />
                Cargando historial...
              </div>
            </div>
          ) : recetasOrdenadas.length === 0 ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-sky-100 text-sky-700">
                <FileText size={34} />
              </div>

              <h3 className="text-lg font-bold text-slate-800">
                Sin recetas encontradas
              </h3>

              <p className="mt-2 max-w-sm text-sm text-slate-500">
                No hay recetas que coincidan con los filtros seleccionados.
              </p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-hidden rounded-3xl border border-slate-100 md:block">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <ThOrdenable label="Folio" sortKey="folio" orden={orden} onSort={ordenarPor} />
                      <ThOrdenable label="Paciente" sortKey="paciente" orden={orden} onSort={ordenarPor} />
                      <ThOrdenable label="Doctor" sortKey="doctor" orden={orden} onSort={ordenarPor} />
                      <ThOrdenable label="Productos" sortKey="productos" orden={orden} onSort={ordenarPor} />
                      <ThOrdenable label="Estatus" sortKey="estatus" orden={orden} onSort={ordenarPor} />
                      <ThOrdenable label="Fecha" sortKey="fecha" orden={orden} onSort={ordenarPor} />
                      <th className="px-4 py-4 text-right">Acciones</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {recetasPagina.map((receta) => (
                      <tr key={receta.id_receta} className="hover:bg-slate-50/80">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2 font-black text-slate-800">
                            <Hash size={15} className="text-slate-400" />
                            {receta.folio_receta || receta.id_receta}
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <p className="font-bold text-slate-800">
                            {receta.nombre_paciente || 'N/A'}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {receta.telefono_paciente || 'Sin teléfono'}
                          </p>
                        </td>

                        <td className="px-4 py-4">
                          <p className="font-semibold text-slate-700">
                            {receta.nombre_doctor_shaddai || receta.nombre_doctor || 'N/A'}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {receta.especialidad || ''}
                          </p>
                        </td>

                        <td className="px-4 py-4">
                          <p className="font-bold text-slate-700">
                            {receta.total_productos || 0} producto(s)
                          </p>
                          <p className="text-xs text-slate-500">
                            {receta.total_piezas || 0} pieza(s)
                          </p>
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${getBadgeEstatus(
                              receta.estatus
                            )}`}
                          >
                            {formatearEstatus(receta.estatus)}
                          </span>
                        </td>

                        <td className="px-4 py-4 text-xs font-semibold text-slate-500">
                          {formatearFecha(receta.fecha_creacion)}
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => verSeguimientoReceta(receta)}
                              className="inline-flex items-center gap-2 rounded-xl bg-sky-100 px-3 py-2 text-xs font-bold text-sky-700 transition hover:bg-sky-200"
                            >
                              <Eye size={15} />
                              Seguimiento
                            </button>

                            <button
                              type="button"
                              onClick={() => abrirReimpresionReceta(receta)}
                              className="inline-flex items-center gap-2 rounded-xl bg-emerald-100 px-3 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-200"
                            >
                              <Printer size={15} />
                              Reimprimir
                            </button>

                            <button
                              type="button"
                              onClick={() => cancelarReceta(receta)}
                              disabled={receta.estatus === 'CANCELADA' || cancelandoId === receta.id_receta}
                              className="inline-flex items-center gap-2 rounded-xl bg-red-100 px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {cancelandoId === receta.id_receta ? (
                                <Loader2 size={15} className="animate-spin" />
                              ) : (
                                <Ban size={15} />
                              )}
                              Cancelar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-4 md:hidden">
                {recetasPagina.map((receta) => (
                  <div
                    key={receta.id_receta}
                    className="rounded-3xl border border-slate-100 bg-slate-50 p-4"
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase text-slate-500">Folio</p>
                        <p className="font-black text-slate-900">
                          {receta.folio_receta || receta.id_receta}
                        </p>
                      </div>

                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${getBadgeEstatus(
                          receta.estatus
                        )}`}
                      >
                        {formatearEstatus(receta.estatus)}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm">
                      <p>
                        <strong>Paciente:</strong> {receta.nombre_paciente || 'N/A'}
                      </p>
                      <p>
                        <strong>Teléfono:</strong> {receta.telefono_paciente || 'Sin teléfono'}
                      </p>
                      <p>
                        <strong>Productos:</strong> {receta.total_productos || 0} producto(s),{' '}
                        {receta.total_piezas || 0} pieza(s)
                      </p>
                      <p>
                        <strong>Fecha:</strong> {formatearFecha(receta.fecha_creacion)}
                      </p>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                      <button
                        type="button"
                        onClick={() => verSeguimientoReceta(receta)}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-100 px-4 py-2 text-sm font-bold text-sky-700"
                      >
                        <Eye size={16} />
                        Seguimiento
                      </button>

                      <button
                        type="button"
                        onClick={() => abrirReimpresionReceta(receta)}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-700"
                      >
                        <Printer size={16} />
                        Reimprimir
                      </button>

                      <button
                        type="button"
                        onClick={() => cancelarReceta(receta)}
                        disabled={receta.estatus === 'CANCELADA' || cancelandoId === receta.id_receta}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-100 px-4 py-2 text-sm font-bold text-red-700 disabled:opacity-50"
                      >
                        {cancelandoId === receta.id_receta ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Ban size={16} />
                        )}
                        Cancelar
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <Paginacion
                paginaActual={paginaSegura}
                totalPaginas={totalPaginas}
                onPageChange={setPaginaActual}
              />
            </>
          )}
        </section>
      </div>

      {modalSeguimientoAbierto && (
        <ModalSeguimientoReceta
          receta={detalleReceta}
          detalles={detalleProductos}
          cargando={cargandoDetalle}
          onClose={cerrarSeguimiento}
          onReimprimir={() => {
            setModalSeguimientoAbierto(false);
            setModalReimpresionAbierto(true);
          }}
          onCancelar={() => cancelarReceta(detalleReceta)}
          cancelandoId={cancelandoId}
        />
      )}

      {modalReimpresionAbierto && (
        <ModalReimpresionReceta
          cargando={cargandoDetalle}
          recetaGenerada={recetaGeneradaParaReimpresion}
          onClose={cerrarReimpresion}
          onPrint={imprimirReceta}
        />
      )}
    </>
  );
}

function CardResumen({ titulo, valor, icono, color }) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-slate-500">{titulo}</p>
          <h2 className="mt-1 text-3xl font-black text-slate-900">{valor}</h2>
        </div>

        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${color}`}>
          {icono}
        </div>
      </div>
    </div>
  );
}

function ThOrdenable({ label, sortKey, orden, onSort }) {
  const activo = orden.key === sortKey;

  return (
    <th className="px-4 py-4">
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`inline-flex items-center gap-1 font-black uppercase tracking-wide ${
          activo ? 'text-sky-700' : 'text-slate-500'
        }`}
      >
        {label}
        <ArrowUpDown size={13} />
      </button>
    </th>
  );
}

function Paginacion({ paginaActual, totalPaginas, onPageChange }) {
  const puedeAnterior = paginaActual > 1;
  const puedeSiguiente = paginaActual < totalPaginas;

  const irA = (pagina) => {
    const paginaSegura = Math.max(1, Math.min(totalPaginas, pagina));
    onPageChange(paginaSegura);
  };

  const paginas = Array.from({ length: totalPaginas }, (_, index) => index + 1).filter((pagina) => {
    return (
      pagina === 1 ||
      pagina === totalPaginas ||
      Math.abs(pagina - paginaActual) <= 1
    );
  });

  return (
    <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <p className="text-sm font-semibold text-slate-500">
        Página {paginaActual} de {totalPaginas}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => irA(1)}
          disabled={!puedeAnterior}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-40"
        >
          <ChevronsLeft size={17} />
        </button>

        <button
          type="button"
          onClick={() => irA(paginaActual - 1)}
          disabled={!puedeAnterior}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-40"
        >
          <ChevronLeft size={17} />
        </button>

        {paginas.map((pagina, index) => {
          const previa = paginas[index - 1];
          const mostrarSeparador = previa && pagina - previa > 1;

          return (
            <span key={pagina} className="inline-flex items-center gap-2">
              {mostrarSeparador && <span className="text-slate-400">...</span>}
              <button
                type="button"
                onClick={() => irA(pagina)}
                className={`inline-flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-sm font-black ${
                  paginaActual === pagina
                    ? 'bg-sky-700 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {pagina}
              </button>
            </span>
          );
        })}

        <button
          type="button"
          onClick={() => irA(paginaActual + 1)}
          disabled={!puedeSiguiente}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-40"
        >
          <ChevronRight size={17} />
        </button>

        <button
          type="button"
          onClick={() => irA(totalPaginas)}
          disabled={!puedeSiguiente}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-40"
        >
          <ChevronsRight size={17} />
        </button>
      </div>
    </div>
  );
}

function ModalSeguimientoReceta({ receta, detalles, cargando, onClose, onReimprimir, onCancelar, cancelandoId }) {
  const estatus = String(receta?.estatus || '').toUpperCase();

  const detallesNormalizados = (detalles || []).map((item) => {
    const cantidadRecetada = normalizarNumero(
      item.cantidad_recetada ?? item.cantidad ?? item.cantidad_solicitada,
      1
    );

    const cantidadSurtida = normalizarNumero(
      item.cantidad_surtida ?? item.surtido ?? item.total_surtido,
      0
    );

    const cantidadPendiente = normalizarNumero(
      item.cantidad_pendiente ?? Math.max(cantidadRecetada - cantidadSurtida, 0),
      0
    );

    return {
      ...item,
      cantidadRecetada,
      cantidadSurtida,
      cantidadPendiente,
      surtidoCompleto: cantidadRecetada > 0 && cantidadSurtida >= cantidadRecetada && cantidadPendiente <= 0,
      surtidoParcial: cantidadSurtida > 0 && cantidadPendiente > 0,
    };
  });

  const totalRecetado = detallesNormalizados.reduce(
    (acc, item) => acc + Number(item.cantidadRecetada || 0),
    0
  );

  const totalSurtido = detallesNormalizados.reduce(
    (acc, item) => acc + Number(item.cantidadSurtida || 0),
    0
  );

  const totalPendiente = detallesNormalizados.reduce(
    (acc, item) => acc + Number(item.cantidadPendiente || 0),
    0
  );

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm no-print">
      <div className="max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Seguimiento de receta</h2>
            <p className="mt-1 text-sm text-slate-500">
              Control interno de surtido. La receta médica se conserva sin cambios para reimpresión.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
          >
            <X size={20} />
          </button>
        </div>

        <div className="max-h-[calc(92vh-80px)] overflow-y-auto p-6">
          {cargando ? (
            <div className="flex min-h-[360px] items-center justify-center rounded-3xl bg-slate-50">
              <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
                <Loader2 className="animate-spin" size={22} />
                Cargando seguimiento...
              </div>
            </div>
          ) : receta ? (
            <>
              <div className="mb-5 grid gap-4 md:grid-cols-4">
                <InfoCard titulo="Folio" valor={receta.folio_receta || `RX-${receta.id_receta}`} />
                <InfoCard titulo="Paciente" valor={receta.nombre_paciente || 'N/A'} />
                <InfoCard titulo="Fecha" valor={formatearFecha(receta.fecha_creacion)} />
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-500">Estatus</p>
                  <span className={`mt-1 inline-flex rounded-full border px-3 py-1 text-xs font-black ${getBadgeEstatus(estatus)}`}>
                    {formatearEstatus(estatus)}
                  </span>
                </div>
              </div>

              {estatus === 'SURTIDA_PARCIAL' && (
                <div className="mb-5 rounded-2xl border border-orange-100 bg-orange-50 p-4 text-orange-800">
                  <p className="font-black">Receta surtida parcialmente</p>
                  <p className="mt-1 text-sm">
                    Algunos medicamentos ya fueron surtidos y otros siguen pendientes.
                  </p>
                </div>
              )}

              <div className="mb-5 grid gap-4 md:grid-cols-3">
                <ResumenSurtido titulo="Recetado" valor={totalRecetado} className="border-slate-100 bg-slate-50 text-slate-800" />
                <ResumenSurtido titulo="Surtido" valor={totalSurtido} className="border-emerald-100 bg-emerald-50 text-emerald-800" />
                <ResumenSurtido titulo="Pendiente" valor={totalPendiente} className="border-orange-100 bg-orange-50 text-orange-800" />
              </div>

              {detallesNormalizados.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">
                  No hay medicamentos registrados en esta receta.
                </div>
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  {detallesNormalizados.map((item, index) => {
                    const cardClass = item.surtidoCompleto
                      ? 'border-emerald-200 bg-emerald-50'
                      : item.surtidoParcial
                        ? 'border-orange-200 bg-orange-50'
                        : 'border-slate-200 bg-slate-50';

                    const etiqueta = item.surtidoCompleto
                      ? 'Surtido'
                      : item.surtidoParcial
                        ? 'Parcial'
                        : 'Pendiente';

                    const etiquetaClass = item.surtidoCompleto
                      ? 'bg-emerald-100 text-emerald-700'
                      : item.surtidoParcial
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-slate-100 text-slate-600';

                    return (
                      <div key={item.id_detalle || item.id_producto || index} className={`rounded-3xl border p-4 ${cardClass}`}>
                        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                              Medicamento #{index + 1}
                            </p>
                            <h3 className="mt-1 text-base font-black text-slate-900">
                              {item.nombre_producto || item.nombre || item.producto || 'Medicamento'}
                            </h3>
                            {item.codigo_barras && (
                              <p className="mt-1 text-xs text-slate-500">Código: {item.codigo_barras}</p>
                            )}
                          </div>

                          <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black ${etiquetaClass}`}>
                            {item.surtidoCompleto ? <CheckCircle size={14} /> : item.surtidoParcial ? <AlertTriangle size={14} /> : <ClipboardList size={14} />}
                            {etiqueta}
                          </span>
                        </div>

                        <div className="mb-3 grid grid-cols-3 gap-2 text-center text-xs">
                          <MiniCantidad label="Recetado" valor={item.cantidadRecetada} className="bg-white text-slate-700" />
                          <MiniCantidad label="Surtido" valor={item.cantidadSurtida} className="bg-emerald-100 text-emerald-700" />
                          <MiniCantidad
                            label="Pendiente"
                            valor={item.cantidadPendiente}
                            className={item.cantidadPendiente > 0 ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}
                          />
                        </div>

                        <div className="rounded-2xl bg-white/80 p-3 text-sm text-slate-700">
                          <p><strong>Dosis:</strong> {item.dosis || '-'}</p>
                          <p><strong>Frecuencia:</strong> {item.frecuencia || '-'}</p>
                          <p><strong>Duración:</strong> {item.duracion || '-'}</p>
                          {item.indicaciones && <p className="mt-1"><strong>Indicaciones:</strong> {item.indicaciones}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200"
                >
                  Cerrar
                </button>

                <button
                  type="button"
                  onClick={onReimprimir}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-100 px-5 py-3 text-sm font-bold text-emerald-700 hover:bg-emerald-200"
                >
                  <Printer size={18} />
                  Reimprimir receta
                </button>

                <button
                  type="button"
                  onClick={onCancelar}
                  disabled={receta.estatus === 'CANCELADA' || cancelandoId === receta.id_receta}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {cancelandoId === receta.id_receta ? <Loader2 size={18} className="animate-spin" /> : <Ban size={18} />}
                  Cancelar receta
                </button>
              </div>
            </>
          ) : (
            <div className="flex min-h-[360px] items-center justify-center p-8 text-center">
              <div>
                <AlertTriangle size={42} className="mx-auto mb-3 text-amber-500" />
                <p className="font-bold text-slate-800">No se pudo cargar la receta.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoCard({ titulo, valor }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-wide text-slate-500">{titulo}</p>
      <p className="mt-1 font-black text-slate-800">{valor}</p>
    </div>
  );
}

function ResumenSurtido({ titulo, valor, className }) {
  return (
    <div className={`rounded-2xl border p-4 text-center ${className}`}>
      <p className="text-xs font-black uppercase tracking-wide">{titulo}</p>
      <p className="mt-1 text-2xl font-black">{valor}</p>
    </div>
  );
}

function MiniCantidad({ label, valor, className }) {
  return (
    <div className={`rounded-2xl px-3 py-2 font-black ${className}`}>
      <p className="text-[10px] uppercase tracking-wide opacity-70">{label}</p>
      <p className="text-base">{valor}</p>
    </div>
  );
}

function ModalReimpresionReceta({ cargando, recetaGenerada, onClose, onPrint }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm no-print print:static print:bg-white print:p-0 print:backdrop-blur-none">
      <div className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-3xl bg-white shadow-2xl print:max-h-none print:overflow-visible print:rounded-none print:shadow-none">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4 no-print">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Reimprimir receta</h2>
            <p className="text-sm text-slate-500">Se conserva el diseño original de la receta médica.</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
          >
            <X size={20} />
          </button>
        </div>

        {cargando ? (
          <div className="flex min-h-[360px] items-center justify-center">
            <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
              <Loader2 className="animate-spin" size={22} />
              Cargando receta...
            </div>
          </div>
        ) : recetaGenerada ? (
          <div className="p-6 print:p-0">
            <RecetaImprimible
              recetaGenerada={recetaGenerada}
              fechaActual={obtenerFechaActual()}
              perfilDoctor={recetaGenerada.doctor}
            />

            <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end no-print">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200"
              >
                Cerrar
              </button>

              <button
                type="button"
                onClick={onPrint}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-700 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-sky-900/20 hover:bg-sky-800"
              >
                <Printer size={18} />
                Imprimir receta
              </button>
            </div>
          </div>
        ) : (
          <div className="flex min-h-[360px] items-center justify-center p-8 text-center">
            <div>
              <AlertTriangle size={42} className="mx-auto mb-3 text-amber-500" />
              <p className="font-bold text-slate-800">No se pudo cargar la receta.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RecetaImprimible({ recetaGenerada, fechaActual, perfilDoctor }) {
  const paciente = recetaGenerada.paciente || {};
  const productos = recetaGenerada.productos || [];
  const receta = recetaGenerada.receta || {};
  const expediente = recetaGenerada.expediente || null;

  const folio = receta.folio_receta || (receta.id_receta ? `RX-${receta.id_receta}` : 'Vista previa');

  return (
    <div id="receta-imprimible" className="mx-auto w-full max-w-5xl bg-white text-slate-900 print:max-w-none">
      <div className="relative mx-auto h-[5.25in] max-h-[5.25in] w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-300 bg-white shadow-sm print:h-[5.15in] print:max-h-[5.15in] print:rounded-none print:border-0 print:shadow-none">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-sky-100/60 blur-2xl print:hidden" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-cyan-100/60 blur-2xl print:hidden" />

        <div className="relative grid grid-cols-[88px_1fr_170px] items-center gap-4 border-b border-slate-200 bg-gradient-to-r from-sky-50 via-white to-cyan-50 px-6 py-4 print:grid-cols-[76px_1fr_155px] print:px-4 print:py-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-white p-2 shadow-sm print:h-14 print:w-14">
            <img src={logoFarmacia} alt="Farmacias Shaddai" className="h-full w-full object-contain" />
          </div>

          <div className="text-center">
            <h1 className="text-2xl font-black uppercase tracking-wide text-slate-950 print:text-xl">
              Farmacias Shaddai
            </h1>

            <p className="mt-0.5 text-sm font-bold uppercase tracking-[0.18em] text-sky-700 print:text-xs">
              Receta Médica
            </p>

            <p className="mt-1 text-[11px] font-medium text-slate-500 print:text-[10px]">
              Doctor Shaddai · Bienestar al alcance de todos
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-3 text-center shadow-sm print:p-2">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Folio</p>

            <p className="mt-1 break-words text-sm font-black text-slate-950 print:text-xs">
              {folio}
            </p>

            <p className="mt-1 text-[10px] font-semibold text-slate-500">{fechaActual}</p>
          </div>
        </div>

        <div className="relative px-6 py-4 print:px-4 print:py-3">
          <div className="grid gap-3 text-[11px] md:grid-cols-[0.92fr_1.08fr] print:grid-cols-[0.92fr_1.08fr]">
            <div className="space-y-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 print:bg-white">
                <div className="mb-2 flex items-center justify-between gap-2 border-b border-slate-200 pb-1.5">
                  <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-800">Médico</h3>
                  <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[9px] font-bold text-sky-700 print:border print:border-slate-200 print:bg-white">
                    Doctor Shaddai
                  </span>
                </div>

                <div className="space-y-0.5 leading-tight">
                  <p>
                    <strong>Nombre:</strong>{' '}
                    {perfilDoctor?.nombre_completo || perfilDoctor?.nombre_doctor || perfilDoctor?.nombre_doctor_usuario || 'Doctor Shaddai'}
                  </p>
                  <p><strong>Institución:</strong> Farmacias Shaddai</p>
                  <p><strong>Especialidad:</strong> {perfilDoctor?.especialidad || 'N/A'}</p>
                  <p><strong>Cédula:</strong> {perfilDoctor?.cedula_profesional || 'N/A'}</p>
                  <p className="line-clamp-2"><strong>Domicilio:</strong> {perfilDoctor?.direccion_consultorio || 'N/A'}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-3">
                <div className="mb-2 flex items-center justify-between gap-2 border-b border-slate-200 pb-1.5">
                  <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-800">Paciente</h3>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-700 print:border print:border-slate-200 print:bg-white">
                    {expediente ? `Exp. #${expediente.id_expediente}` : 'Sin expediente'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 leading-tight">
                  <p className="col-span-2"><strong>Paciente:</strong> {paciente.nombre_paciente || 'N/A'}</p>
                  <p><strong>Tel:</strong> {paciente.telefono || 'N/A'}</p>
                  <p><strong>Edad:</strong> {paciente.edad || 'N/A'}</p>
                  <p><strong>Sexo:</strong> {paciente.sexo || 'N/A'}</p>
                  <p><strong>Fecha:</strong> {fechaActual}</p>
                </div>
              </div>

              {expediente && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3 text-[10px] print:bg-white">
                  <h3 className="mb-1.5 text-[10px] font-black uppercase tracking-wider text-amber-800 print:text-slate-800">
                    Antecedentes relevantes
                  </h3>

                  <div className="space-y-0.5 leading-tight">
                    <p className="line-clamp-1"><strong>Condiciones:</strong> {expediente.enfermedades_condiciones || 'Sin registro'}</p>
                    <p className="line-clamp-1"><strong>Alergias:</strong> {expediente.alergias || 'Sin registro'}</p>
                    <p className="line-clamp-1"><strong>Medicamentos actuales:</strong> {expediente.medicamentos_actuales || 'Sin registro'}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-3">
                <h3 className="mb-1.5 text-[11px] font-black uppercase tracking-wider text-slate-800">Diagnóstico</h3>
                <div className="min-h-9 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-[11px] leading-tight print:bg-white">
                  {paciente.diagnostico || 'Sin diagnóstico registrado'}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-3">
                <div className="mb-2 flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-800">Prescripción</h3>
                  <span className="text-[9px] font-bold text-slate-400">{productos.length} producto(s)</span>
                </div>

                <div className="space-y-2">
                  {productos.slice(0, 4).map((item, index) => (
                    <div key={`${item.id_producto || index}`} className="rounded-xl border border-slate-200 bg-slate-50 p-2 print:bg-white">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[11px] font-black leading-tight text-slate-900">
                            {index + 1}. {item.nombre}
                          </p>
                          <p className="mt-0.5 text-[9px] leading-tight text-slate-500">
                            <strong>Genérica:</strong> {item.nombre_generico || '-'} · <strong>Presentación:</strong> {item.presentacion || '-'} · <strong>Forma:</strong> {item.forma_farmaceutica || '-'}
                          </p>
                        </div>

                        <div className="rounded-lg bg-sky-100 px-2 py-1 text-center text-[10px] font-black text-sky-800 print:border print:border-slate-200 print:bg-white print:text-slate-900">
                          x{item.cantidad}
                        </div>
                      </div>

                      <div className="mt-1 grid grid-cols-3 gap-1 text-[9.5px] leading-tight text-slate-700">
                        <p><strong>Dosis:</strong> {item.dosis || '-'}</p>
                        <p><strong>Frecuencia:</strong> {item.frecuencia || '-'}</p>
                        <p><strong>Duración:</strong> {item.duracion || '-'}</p>
                      </div>

                      {item.indicaciones && (
                        <p className="mt-1 text-[9.5px] leading-tight text-slate-600">
                          <strong>Tratamiento:</strong> {item.indicaciones}
                        </p>
                      )}
                    </div>
                  ))}

                  {productos.length > 4 && (
                    <p className="text-[9px] font-bold text-slate-500">
                      + {productos.length - 4} producto(s) adicional(es) registrado(s) en el sistema.
                    </p>
                  )}
                </div>
              </div>

              {paciente.observaciones && (
                <div className="rounded-2xl border border-slate-200 bg-white p-3">
                  <h3 className="mb-1 text-[10px] font-black uppercase tracking-wider text-slate-800">Observaciones</h3>
                  <p className="line-clamp-2 text-[10px] leading-tight text-slate-700">{paciente.observaciones}</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-8 text-center text-[10px]">
            <div>
              <div className="mx-auto mb-1.5 h-px w-48 bg-slate-500" />
              <p className="font-black">Firma del médico</p>
              <p className="text-slate-500">{perfilDoctor?.nombre_completo || perfilDoctor?.nombre_doctor || perfilDoctor?.nombre_doctor_usuario || ''}</p>
            </div>

            <div>
              <div className="mx-auto mb-1.5 h-px w-48 bg-slate-500" />
              <p className="font-black">Cédula profesional</p>
              <p className="text-slate-500">{perfilDoctor?.cedula_profesional || ''}</p>
            </div>
          </div>

          <p className="mt-3 text-center text-[9px] text-slate-400">Documento generado desde el módulo Doctor Shaddai.</p>
        </div>
      </div>
    </div>
  );
}
