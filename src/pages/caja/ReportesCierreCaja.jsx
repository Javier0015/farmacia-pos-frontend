import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import {
  FileText,
  RefreshCw,
  Download,
  Trash2,
  Search,
  CalendarDays,
  CheckSquare,
  Square,
  Eye,
  X,
  AlertTriangle,
} from 'lucide-react';

import api from '../../api/axios';

export default function ReportesCierreCaja() {
  const [reportes, setReportes] = useState([]);
  const [seleccionados, setSeleccionados] = useState([]);
  const [cargando, setCargando] = useState(false);

  const [modalVista, setModalVista] = useState(false);
  const [urlVistaPdf, setUrlVistaPdf] = useState('');
  const [reporteVista, setReporteVista] = useState(null);

  const [filtros, setFiltros] = useState({
    busqueda: '',
    fecha_inicio: '',
    fecha_fin: '',
  });

  const formatoFecha = (fecha) => {
    if (!fecha) return '—';

    return new Date(fecha).toLocaleString('es-MX', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const formatoFechaCorta = (fecha) => {
    if (!fecha) return '—';

    return new Date(fecha).toLocaleDateString('es-MX', {
      dateStyle: 'medium',
    });
  };

  const cargarReportes = async () => {
    try {
      setCargando(true);

      const params = new URLSearchParams();

      if (filtros.fecha_inicio) {
        params.append('fecha_inicio', filtros.fecha_inicio);
      }

      if (filtros.fecha_fin) {
        params.append('fecha_fin', filtros.fecha_fin);
      }

      const queryString = params.toString();
      const url = queryString
        ? `/caja/reportes-cierre?${queryString}`
        : '/caja/reportes-cierre';

      const { data } = await api.get(url);

      if (data.ok) {
        setReportes(data.reportes || []);
        setSeleccionados([]);
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudieron cargar los reportes de cierre de caja.',
      });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarReportes();

    return () => {
      if (urlVistaPdf) {
        window.URL.revokeObjectURL(urlVistaPdf);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reportesFiltrados = useMemo(() => {
    const texto = filtros.busqueda.trim().toLowerCase();

    if (!texto) return reportes;

    return reportes.filter((reporte) => {
      return (
        String(reporte.id_reporte || '').includes(texto) ||
        String(reporte.id_sesion || '').includes(texto) ||
        String(reporte.id_caja || '').includes(texto) ||
        String(reporte.id_sucursal || '').includes(texto) ||
        String(reporte.sucursal || '').toLowerCase().includes(texto) ||
        String(reporte.caja || '').toLowerCase().includes(texto) ||
        String(reporte.nombre_archivo || '').toLowerCase().includes(texto) ||
        String(reporte.usuario_generador || '').toLowerCase().includes(texto) ||
        String(reporte.generado_por_nombre || '').toLowerCase().includes(texto)
      );
    });
  }, [reportes, filtros.busqueda]);

  const todosSeleccionados =
    reportesFiltrados.length > 0 &&
    reportesFiltrados.every((reporte) =>
      seleccionados.includes(Number(reporte.id_reporte))
    );

  const alternarSeleccion = (idReporte) => {
    const id = Number(idReporte);

    setSeleccionados((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }

      return [...prev, id];
    });
  };

  const alternarTodos = () => {
    if (todosSeleccionados) {
      setSeleccionados([]);
      return;
    }

    setSeleccionados(reportesFiltrados.map((reporte) => Number(reporte.id_reporte)));
  };

  const descargarBlob = (blob, nombreArchivo) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.setAttribute('download', nombreArchivo || 'reporte-cierre-caja.pdf');

    document.body.appendChild(link);
    link.click();

    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const descargarReporte = async (reporte) => {
    try {
      const response = await api.get(
        `/caja/reportes-cierre/${reporte.id_reporte}/descargar`,
        {
          responseType: 'blob',
        }
      );

      descargarBlob(
        response.data,
        reporte.nombre_archivo || `reporte-cierre-caja-${reporte.id_reporte}.pdf`
      );
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudo descargar el reporte seleccionado.',
      });
    }
  };

  const verReporte = async (reporte) => {
    try {
      setCargando(true);

      const response = await api.get(
        `/caja/reportes-cierre/${reporte.id_reporte}/descargar`,
        {
          responseType: 'blob',
        }
      );

      if (urlVistaPdf) {
        window.URL.revokeObjectURL(urlVistaPdf);
      }

      const blob = new Blob([response.data], {
        type: 'application/pdf',
      });

      const url = window.URL.createObjectURL(blob);

      setUrlVistaPdf(url);
      setReporteVista(reporte);
      setModalVista(true);
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudo abrir la vista previa del reporte.',
      });
    } finally {
      setCargando(false);
    }
  };

  const cerrarVistaPdf = () => {
    setModalVista(false);
    setReporteVista(null);

    if (urlVistaPdf) {
      window.URL.revokeObjectURL(urlVistaPdf);
      setUrlVistaPdf('');
    }
  };

  const eliminarSeleccionados = async () => {
    if (seleccionados.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin selección',
        text: 'Selecciona al menos un reporte para eliminar.',
      });
      return;
    }

    const confirmacion = await Swal.fire({
      icon: 'warning',
      title: '¿Eliminar reportes?',
      html: `
        <div style="text-align:left">
          <p>Se eliminarán <b>${seleccionados.length}</b> reporte(s).</p>
          <p>Esta acción eliminará el PDF del servidor y lo ocultará del historial.</p>
          <p style="color:#dc2626"><b>No se eliminará la sesión de caja ni las ventas registradas.</b></p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
    });

    if (!confirmacion.isConfirmed) return;

    try {
      setCargando(true);

      const { data } = await api.delete('/caja/reportes-cierre', {
        data: {
          ids_reportes: seleccionados,
        },
      });

      if (data.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Reportes eliminados',
          text: data.mensaje || 'Los reportes fueron eliminados correctamente.',
          timer: 1600,
          showConfirmButton: false,
        });

        await cargarReportes();
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudieron eliminar los reportes seleccionados.',
      });
    } finally {
      setCargando(false);
    }
  };

  const limpiarFiltros = () => {
    setFiltros({
      busqueda: '',
      fecha_inicio: '',
      fecha_fin: '',
    });
  };

  const totalReportes = reportesFiltrados.length;

  return (
    <div className="w-full max-w-full overflow-hidden space-y-5 sm:space-y-6 pb-8">
      <section className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
              <FileText size={25} />
            </div>

            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800 break-words">
                Reportes de cierre de caja
              </h1>

              <p className="text-sm sm:text-base text-slate-500 leading-relaxed">
                Consulta, descarga y elimina los reportes PDF generados al cerrar caja.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full xl:w-auto">
            <button
              onClick={cargarReportes}
              disabled={cargando}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition disabled:opacity-60"
            >
              <RefreshCw size={19} className={cargando ? 'animate-spin' : ''} />
              Actualizar
            </button>

            <button
              onClick={eliminarSeleccionados}
              disabled={seleccionados.length === 0 || cargando}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold transition disabled:opacity-50"
            >
              <Trash2 size={19} />
              Eliminar seleccionados
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-100">
          <p className="text-sm text-slate-500">Reportes visibles</p>
          <h3 className="text-3xl font-black text-slate-800 mt-1">
            {totalReportes}
          </h3>
          <p className="text-xs text-slate-400 mt-2">
            Según filtros aplicados
          </p>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm border border-sky-100">
          <p className="text-sm text-slate-500">Seleccionados</p>
          <h3 className="text-3xl font-black text-sky-700 mt-1">
            {seleccionados.length}
          </h3>
          <p className="text-xs text-slate-400 mt-2">
            Para eliminación masiva
          </p>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm border border-amber-100">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <AlertTriangle size={21} />
            </div>

            <div>
              <p className="text-sm font-bold text-slate-700">
                Limpieza de espacio
              </p>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Eliminar reportes borra el archivo PDF guardado, pero conserva las ventas y sesiones de caja.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-100">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Buscar
            </label>

            <div className="relative">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={filtros.busqueda}
                onChange={(e) =>
                  setFiltros((prev) => ({
                    ...prev,
                    busqueda: e.target.value,
                  }))
                }
                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="Buscar por sesión, sucursal, caja, archivo o usuario..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Fecha inicio
            </label>

            <div className="relative">
              <CalendarDays
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="date"
                value={filtros.fecha_inicio}
                onChange={(e) =>
                  setFiltros((prev) => ({
                    ...prev,
                    fecha_inicio: e.target.value,
                  }))
                }
                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Fecha fin
            </label>

            <div className="relative">
              <CalendarDays
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="date"
                value={filtros.fecha_fin}
                onChange={(e) =>
                  setFiltros((prev) => ({
                    ...prev,
                    fecha_fin: e.target.value,
                  }))
                }
                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-sm text-slate-500">
            Mostrando <b>{reportesFiltrados.length}</b> reporte(s).
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={limpiarFiltros}
              disabled={cargando}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition disabled:opacity-60"
            >
              Limpiar
            </button>

            <button
              onClick={cargarReportes}
              disabled={cargando}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-sky-700 hover:bg-sky-800 text-white font-bold transition disabled:opacity-60"
            >
              <Search size={18} />
              Aplicar filtros
            </button>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="lg:hidden p-4 space-y-3">
          {cargando ? (
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-center text-slate-500">
              Cargando reportes...
            </div>
          ) : reportesFiltrados.length === 0 ? (
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-center text-slate-500">
              No hay reportes de cierre registrados.
            </div>
          ) : (
            reportesFiltrados.map((reporte) => {
              const seleccionado = seleccionados.includes(Number(reporte.id_reporte));

              return (
                <div
                  key={reporte.id_reporte}
                  className={`rounded-2xl border p-4 shadow-sm ${
                    seleccionado
                      ? 'border-sky-200 bg-sky-50'
                      : 'border-slate-100 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <button
                      onClick={() => alternarSeleccion(reporte.id_reporte)}
                      className="mt-1 text-slate-500 hover:text-sky-700"
                      title="Seleccionar"
                    >
                      {seleccionado ? (
                        <CheckSquare size={22} />
                      ) : (
                        <Square size={22} />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <p className="font-black text-slate-800 break-words">
                        Sesión #{reporte.id_sesion}
                      </p>

                      <p className="text-sm text-slate-500 mt-1 break-words">
                        {reporte.sucursal || 'Sucursal no disponible'} ·{' '}
                        {reporte.caja || 'Caja no disponible'}
                      </p>

                      <p className="text-xs text-slate-400 mt-2">
                        Generado: {formatoFecha(reporte.fecha_generacion)}
                      </p>

                      <p className="text-xs text-slate-400 mt-1 break-words">
                        Archivo: {reporte.nombre_archivo || '—'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => verReporte(reporte)}
                      disabled={cargando}
                      className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-sky-100 hover:bg-sky-200 text-sky-800 font-bold text-sm transition disabled:opacity-60"
                    >
                      <Eye size={17} />
                      Ver
                    </button>

                    <button
                      onClick={() => descargarReporte(reporte)}
                      disabled={cargando}
                      className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition disabled:opacity-60"
                    >
                      <Download size={17} />
                      Descargar
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={alternarTodos}
                    className="inline-flex items-center justify-center text-slate-600 hover:text-sky-700"
                    title="Seleccionar todos"
                  >
                    {todosSeleccionados ? (
                      <CheckSquare size={21} />
                    ) : (
                      <Square size={21} />
                    )}
                  </button>
                </th>

                <th className="px-4 py-3 text-left text-xs font-black text-slate-500 uppercase">
                  Reporte
                </th>

                <th className="px-4 py-3 text-left text-xs font-black text-slate-500 uppercase">
                  Sesión
                </th>

                <th className="px-4 py-3 text-left text-xs font-black text-slate-500 uppercase">
                  Sucursal / Caja
                </th>

                <th className="px-4 py-3 text-left text-xs font-black text-slate-500 uppercase">
                  Generado
                </th>

                <th className="px-4 py-3 text-left text-xs font-black text-slate-500 uppercase">
                  Usuario
                </th>

                <th className="px-4 py-3 text-right text-xs font-black text-slate-500 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {cargando ? (
                <tr>
                  <td colSpan="7" className="px-4 py-10 text-center text-slate-500">
                    Cargando reportes...
                  </td>
                </tr>
              ) : reportesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-10 text-center text-slate-500">
                    No hay reportes de cierre registrados.
                  </td>
                </tr>
              ) : (
                reportesFiltrados.map((reporte) => {
                  const seleccionado = seleccionados.includes(
                    Number(reporte.id_reporte)
                  );

                  return (
                    <tr
                      key={reporte.id_reporte}
                      className={seleccionado ? 'bg-sky-50' : 'hover:bg-slate-50'}
                    >
                      <td className="px-4 py-3">
                        <button
                          onClick={() => alternarSeleccion(reporte.id_reporte)}
                          className="inline-flex items-center justify-center text-slate-600 hover:text-sky-700"
                          title="Seleccionar"
                        >
                          {seleccionado ? (
                            <CheckSquare size={21} />
                          ) : (
                            <Square size={21} />
                          )}
                        </button>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
                            <FileText size={20} />
                          </div>

                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 truncate">
                              #{reporte.id_reporte}
                            </p>

                            <p className="text-xs text-slate-400 truncate max-w-[260px]">
                              {reporte.nombre_archivo || 'Archivo PDF'}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-700">
                          Sesión #{reporte.id_sesion}
                        </p>

                        {reporte.fecha_cierre && (
                          <p className="text-xs text-slate-400 mt-1">
                            Cierre: {formatoFechaCorta(reporte.fecha_cierre)}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-700">
                          {reporte.sucursal || '—'}
                        </p>

                        <p className="text-xs text-slate-400 mt-1">
                          {reporte.caja || '—'}
                        </p>
                      </td>

                      <td className="px-4 py-3 text-slate-600">
                        {formatoFecha(reporte.fecha_generacion)}
                      </td>

                      <td className="px-4 py-3 text-slate-600">
                        {reporte.usuario_generador ||
                          reporte.generado_por_nombre ||
                          '—'}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => verReporte(reporte)}
                            disabled={cargando}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-sky-100 hover:bg-sky-200 text-sky-800 font-bold text-sm transition disabled:opacity-60"
                            title="Ver reporte"
                          >
                            <Eye size={17} />
                            Ver
                          </button>

                          <button
                            onClick={() => descargarReporte(reporte)}
                            disabled={cargando}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition disabled:opacity-60"
                            title="Descargar reporte"
                          >
                            <Download size={17} />
                            Descargar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {modalVista && (
        <div className="fixed inset-0 z-50 flex items-start justify-center px-3 sm:px-4 py-4 sm:py-8 overflow-y-auto">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={cerrarVistaPdf}
          />

          <div className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-6xl overflow-hidden my-auto">
            <div className="px-4 sm:px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-slate-800">
                  Vista previa del reporte
                </h2>

                <p className="text-sm text-slate-500 break-words">
                  {reporteVista
                    ? `Reporte #${reporteVista.id_reporte} · Sesión #${reporteVista.id_sesion}`
                    : 'Reporte de cierre de caja'}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {reporteVista && (
                  <button
                    onClick={() => descargarReporte(reporteVista)}
                    className="hidden sm:inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition"
                  >
                    <Download size={18} />
                    Descargar
                  </button>
                )}

                <button
                  onClick={cerrarVistaPdf}
                  className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="bg-slate-100 p-3 sm:p-5 h-[75vh]">
              {urlVistaPdf ? (
                <iframe
                  src={urlVistaPdf}
                  title="Vista previa reporte cierre caja"
                  className="w-full h-full rounded-2xl bg-white border border-slate-200"
                />
              ) : (
                <div className="w-full h-full rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-500">
                  No se pudo cargar el PDF.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}