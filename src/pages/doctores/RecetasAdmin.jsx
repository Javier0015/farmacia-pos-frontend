import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import {
  FileText,
  RefreshCw,
  Search,
  ExternalLink,
  Calendar,
  Award,
  UserRound,
  BadgeCheck,
  CheckCircle,
  XCircle,
  Clock,
  File as FileIcon,
  Stethoscope,
  Filter,
} from 'lucide-react';

import api from '../../api/axios';

export default function RecetasAdmin() {
  const [recetas, setRecetas] = useState([]);
  const [cargando, setCargando] = useState(false);

  const [buscar, setBuscar] = useState('');
  const [estatus, setEstatus] = useState('TODOS');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  const BASE_URL = API_URL.replace('/api', '');

  const formatoNumero = (valor) => {
    return Number(valor || 0).toLocaleString('es-MX', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  const formatoFecha = (fecha) => {
    if (!fecha) return 'Sin fecha';

    return new Date(fecha).toLocaleString('es-MX', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const esImagen = (tipo = '') => {
    return String(tipo).startsWith('image/');
  };

  const urlArchivo = (ruta) => {
    if (!ruta) return '#';

    if (ruta.startsWith('http')) return ruta;

    return `${BASE_URL}${ruta}`;
  };

  const claseEstatus = (estatusReceta) => {
    const valor = String(estatusReceta || '').toUpperCase();

    if (valor === 'PENDIENTE') {
      return 'bg-amber-100 text-amber-700';
    }

    if (valor === 'ATENDIDA') {
      return 'bg-emerald-100 text-emerald-700';
    }

    if (valor === 'RECHAZADA') {
      return 'bg-red-100 text-red-700';
    }

    if (valor === 'CANCELADA') {
      return 'bg-slate-200 text-slate-700';
    }

    return 'bg-slate-100 text-slate-600';
  };

  const iconoEstatus = (estatusReceta) => {
    const valor = String(estatusReceta || '').toUpperCase();

    if (valor === 'PENDIENTE') return <Clock size={15} />;
    if (valor === 'ATENDIDA') return <CheckCircle size={15} />;
    if (valor === 'RECHAZADA') return <XCircle size={15} />;

    return <FileText size={15} />;
  };

  const cargarRecetas = async () => {
    try {
      setCargando(true);

      const params = new URLSearchParams();

      if (buscar.trim()) {
        params.append('buscar', buscar.trim());
      }

      if (estatus && estatus !== 'TODOS') {
        params.append('estatus', estatus);
      }

      const { data } = await api.get(
        `/recetas-doctor/admin?${params.toString()}`
      );

      if (data.ok) {
        setRecetas(data.recetas || []);
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudieron cargar las recetas recibidas.',
      });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarRecetas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estatus]);

  const resumen = useMemo(() => {
    return recetas.reduce(
      (acc, receta) => {
        acc.total += 1;

        const estado = String(receta.estatus || '').toUpperCase();

        if (estado === 'PENDIENTE') acc.pendientes += 1;
        if (estado === 'ATENDIDA') acc.atendidas += 1;
        if (estado === 'RECHAZADA') acc.rechazadas += 1;

        acc.puntosGenerados += Number(receta.puntos_generados || 0);

        return acc;
      },
      {
        total: 0,
        pendientes: 0,
        atendidas: 0,
        rechazadas: 0,
        puntosGenerados: 0,
      }
    );
  }, [recetas]);

  const cambiarEstatusReceta = async (receta, nuevoEstatus) => {
    const esAtendida = nuevoEstatus === 'ATENDIDA';
    const esRechazada = nuevoEstatus === 'RECHAZADA';

    const resultado = await Swal.fire({
      icon: esAtendida ? 'question' : 'warning',
      title: esAtendida ? '¿Marcar receta como atendida?' : '¿Rechazar receta?',
      html: `
        <div style="text-align:left">
          <p><b>Doctor:</b> ${
            receta.doctor_nombre_completo || receta.usuario_doctor || 'Sin doctor'
          }</p>
          <p><b>Cédula:</b> ${
            receta.doctor_cedula_profesional || 'Sin cédula'
          }</p>
          <p><b>Receta:</b> ${receta.titulo || 'Receta médica'}</p>
          ${
            esAtendida
              ? '<p style="margin-top:8px">Al marcarla como atendida se generará 1 punto al doctor.</p>'
              : '<p style="margin-top:8px">Al rechazarla no se generarán puntos.</p>'
          }
        </div>
      `,
      input: 'textarea',
      inputLabel: 'Observaciones',
      inputPlaceholder: esAtendida
        ? 'Ej. Receta validada y atendida correctamente...'
        : 'Ej. Archivo ilegible, datos incompletos...',
      inputAttributes: {
        maxlength: 500,
      },
      showCancelButton: true,
      confirmButtonText: esAtendida ? 'Sí, atender' : 'Sí, rechazar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: esAtendida ? '#059669' : '#dc2626',
      cancelButtonColor: '#64748b',
      inputValidator: (value) => {
        if (esRechazada && !value.trim()) {
          return 'Para rechazar la receta debes escribir una observación.';
        }

        return null;
      },
    });

    if (!resultado.isConfirmed) return;

    try {
      const { data } = await api.put(
        `/recetas-doctor/admin/${receta.id_receta}/estatus`,
        {
          estatus: nuevoEstatus,
          observaciones: resultado.value || '',
        }
      );

      if (data.ok) {
        Swal.fire({
          icon: 'success',
          title: esAtendida ? 'Receta atendida' : 'Receta rechazada',
          text: data.mensaje || 'Estatus actualizado correctamente.',
          timer: 1800,
          showConfirmButton: false,
        });

        await cargarRecetas();
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudo actualizar el estatus de la receta.',
      });
    }
  };

  return (
    <div className="w-full max-w-full overflow-hidden space-y-5 sm:space-y-6 pb-8">
      <section className="bg-gradient-to-r from-slate-900 to-sky-700 rounded-2xl sm:rounded-3xl p-5 sm:p-7 text-white shadow-lg shadow-slate-900/20 overflow-hidden">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-4 min-w-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
              <FileText size={28} />
            </div>

            <div className="min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold break-words">
                Recetas recibidas
              </h1>
              <p className="text-sm sm:text-base text-sky-100 mt-1 leading-relaxed">
                Valida recetas de doctores y genera puntos solo cuando sean atendidas.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={cargarRecetas}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-bold transition"
          >
            <RefreshCw size={19} className={cargando ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 shadow-sm border border-slate-100 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center mb-4">
            <FileText size={22} />
          </div>
          <p className="text-sm text-slate-500">Total recetas</p>
          <p className="text-3xl font-bold text-slate-800 break-words">
            {formatoNumero(resumen.total)}
          </p>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 shadow-sm border border-slate-100 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
            <Clock size={22} />
          </div>
          <p className="text-sm text-slate-500">Pendientes</p>
          <p className="text-3xl font-bold text-slate-800 break-words">
            {formatoNumero(resumen.pendientes)}
          </p>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 shadow-sm border border-slate-100 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
            <CheckCircle size={22} />
          </div>
          <p className="text-sm text-slate-500">Atendidas</p>
          <p className="text-3xl font-bold text-slate-800 break-words">
            {formatoNumero(resumen.atendidas)}
          </p>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 shadow-sm border border-slate-100 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mb-4">
            <Award size={22} />
          </div>
          <p className="text-sm text-slate-500">Puntos generados</p>
          <p className="text-3xl font-bold text-slate-800 break-words">
            {formatoNumero(resumen.puntosGenerados)}
          </p>
        </div>
      </section>

      <section className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-100">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_260px_auto] gap-3">
          <div className="relative min-w-0">
            <Search
              className="absolute left-4 top-3.5 text-slate-400"
              size={20}
            />
            <input
              value={buscar}
              onChange={(e) => setBuscar(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') cargarRecetas();
              }}
              className="w-full min-w-0 pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="Buscar doctor, cédula, especialidad, título..."
            />
          </div>

          <div className="relative min-w-0">
            <Filter
              className="absolute left-4 top-3.5 text-slate-400"
              size={20}
            />
            <select
              value={estatus}
              onChange={(e) => setEstatus(e.target.value)}
              className="w-full min-w-0 pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
            >
              <option value="TODOS">Todos los estatus</option>
              <option value="PENDIENTE">Pendientes</option>
              <option value="ATENDIDA">Atendidas</option>
              <option value="RECHAZADA">Rechazadas</option>
              <option value="CANCELADA">Canceladas</option>
            </select>
          </div>

          <button
            type="button"
            onClick={cargarRecetas}
            className="w-full lg:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-sky-700 hover:bg-sky-800 text-white font-bold transition"
          >
            <Search size={19} />
            Buscar
          </button>
        </div>
      </section>

      <section className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-4 sm:px-6 py-5 border-b border-slate-100">
          <h2 className="text-lg sm:text-xl font-bold text-slate-800">
            Listado de recetas
          </h2>
          <p className="text-sm text-slate-500">
            Las recetas pendientes pueden ser atendidas o rechazadas.
          </p>
        </div>

        <div className="p-4 sm:p-5 space-y-4">
          {cargando ? (
            <div className="py-14 text-center text-slate-500">
              <RefreshCw className="animate-spin mx-auto mb-3" size={34} />
              Cargando recetas...
            </div>
          ) : recetas.length === 0 ? (
            <div className="py-14 text-center text-slate-500">
              <FileText size={42} className="mx-auto mb-3 text-slate-300" />
              <p className="font-bold text-slate-600">
                Sin recetas
              </p>
              <p className="text-sm mt-1">
                No hay recetas con los filtros seleccionados.
              </p>
            </div>
          ) : (
            recetas.map((receta) => {
              const estaPendiente =
                String(receta.estatus || '').toUpperCase() === 'PENDIENTE';

              return (
                <article
                  key={receta.id_receta}
                  className="rounded-2xl sm:rounded-3xl border border-slate-100 p-4 sm:p-5 hover:bg-slate-50 transition min-w-0"
                >
                  <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-5">
                    <div className="flex flex-col sm:flex-row items-start gap-4 flex-1 min-w-0">
                      <a
                        href={urlArchivo(receta.archivo_ruta)}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full sm:w-20 h-48 sm:h-20 rounded-2xl sm:rounded-3xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0"
                        title="Abrir receta"
                      >
                        {esImagen(receta.archivo_tipo) ? (
                          <img
                            src={urlArchivo(receta.archivo_ruta)}
                            alt={receta.titulo || 'Receta'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <FileIcon size={34} className="text-slate-500" />
                        )}
                      </a>

                      <div className="flex-1 min-w-0 w-full">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-base sm:text-lg text-slate-800 break-words">
                            {receta.titulo || 'Receta médica'}
                          </h3>

                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${claseEstatus(
                              receta.estatus
                            )}`}
                          >
                            {iconoEstatus(receta.estatus)}
                            {receta.estatus || 'PENDIENTE'}
                          </span>

                          {Number(receta.puntos_generados || 0) > 0 && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
                              <Award size={14} />
                              +{formatoNumero(receta.puntos_generados)} pts
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-slate-500 mt-1 break-words">
                          {receta.descripcion || 'Sin descripción'}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3 mt-4">
                          <div className="rounded-2xl bg-slate-50 p-3 min-w-0">
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                              <UserRound size={14} className="shrink-0" />
                              Doctor
                            </p>
                            <p className="font-bold text-slate-800 mt-1 break-words">
                              {receta.doctor_nombre_completo ||
                                receta.usuario_doctor ||
                                'Sin nombre'}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-slate-50 p-3 min-w-0">
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                              <BadgeCheck size={14} className="shrink-0" />
                              Cédula
                            </p>
                            <p className="font-bold text-slate-800 mt-1 break-words">
                              {receta.doctor_cedula_profesional || 'Sin cédula'}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-slate-50 p-3 min-w-0">
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                              <Stethoscope size={14} className="shrink-0" />
                              Especialidad
                            </p>
                            <p className="font-bold text-slate-800 mt-1 break-words">
                              {receta.doctor_especialidad || 'Sin especialidad'}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3 mt-4 text-xs text-slate-500">
                          <span className="inline-flex items-start sm:items-center gap-1">
                            <Calendar size={14} className="shrink-0 mt-0.5 sm:mt-0" />
                            <span className="break-words">
                              Subida: {formatoFecha(receta.fecha_creacion)}
                            </span>
                          </span>

                          {receta.fecha_validacion && (
                            <span className="inline-flex items-start sm:items-center gap-1">
                              <CheckCircle size={14} className="shrink-0 mt-0.5 sm:mt-0" />
                              <span className="break-words">
                                Validación: {formatoFecha(receta.fecha_validacion)}
                              </span>
                            </span>
                          )}

                          {receta.usuario_validador && (
                            <span className="break-words">
                              Validó: <b>{receta.usuario_validador}</b>
                            </span>
                          )}
                        </div>

                        {receta.observaciones_validacion && (
                          <div className="mt-4 rounded-2xl bg-slate-50 border border-slate-100 p-3">
                            <p className="text-xs text-slate-500">
                              Observaciones
                            </p>
                            <p className="text-sm text-slate-700 mt-1 break-words">
                              {receta.observaciones_validacion}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-1 gap-2 xl:w-44 shrink-0">
                      <a
                        href={urlArchivo(receta.archivo_ruta)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
                      >
                        <ExternalLink size={18} />
                        Ver receta
                      </a>

                      {estaPendiente && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              cambiarEstatusReceta(receta, 'ATENDIDA')
                            }
                            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold transition"
                          >
                            <CheckCircle size={18} />
                            Atender
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              cambiarEstatusReceta(receta, 'RECHAZADA')
                            }
                            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-red-100 hover:bg-red-200 text-red-800 font-bold transition"
                          >
                            <XCircle size={18} />
                            Rechazar
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}