import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import {
  FlaskConical,
  RefreshCw,
  Search,
  Printer,
  Eye,
  X,
  Loader2,
  Trash2,
  Calendar,
  User,
  ClipboardList,
  Clock,
  FileText,
} from 'lucide-react';

import api from '../../api/axios';

const ESTATUS_CLASES = {
  GENERADA: 'bg-emerald-100 text-emerald-700',
  CANCELADA: 'bg-red-100 text-red-700',
};

const ESTATUS_TEXTO = {
  GENERADA: 'Generada',
  CANCELADA: 'Cancelada',
};

export default function HistorialSolicitudesLaboratorio() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(false);

  const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false);
  const [solicitudDetalle, setSolicitudDetalle] = useState(null);
  const [detalles, setDetalles] = useState([]);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';

    const valor = new Date(fecha);

    if (Number.isNaN(valor.getTime())) return 'N/A';

    return valor.toLocaleString('es-MX', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const formatearHora = (hora) => {
    if (!hora) return '';

    return String(hora).slice(0, 5);
  };

  const escapeHtml = (valor = '') => {
    return String(valor)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  };

  const solicitudesFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    if (!texto) return solicitudes;

    return solicitudes.filter((item) => {
      const valores = [
        item.folio,
        item.nombre_paciente,
        item.diagnostico,
        item.estatus,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return valores.includes(texto);
    });
  }, [busqueda, solicitudes]);

  const cargarSolicitudes = async () => {
    try {
      setCargando(true);

      const { data } = await api.get(
        '/laboratorio/solicitudes/mis-solicitudes'
      );

      if (data.ok) {
        setSolicitudes(data.solicitudes || []);
      }
    } catch (error) {
      console.error('Error al cargar solicitudes de laboratorio:', error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudieron cargar las solicitudes de laboratorio.',
      });
    } finally {
      setCargando(false);
    }
  };

  const verDetalleSolicitud = async (solicitud) => {
    try {
      setCargandoDetalle(true);
      setModalDetalleAbierto(true);
      setSolicitudDetalle(solicitud);
      setDetalles([]);

      const { data } = await api.get(
        `/laboratorio/solicitudes/${solicitud.id_solicitud}`
      );

      if (data.ok) {
        setSolicitudDetalle(data.solicitud || solicitud);
        setDetalles(data.detalles || []);
      }
    } catch (error) {
      console.error('Error al obtener detalle de solicitud:', error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudo cargar el detalle de la solicitud.',
      });

      setModalDetalleAbierto(false);
    } finally {
      setCargandoDetalle(false);
    }
  };

  const cerrarDetalle = () => {
    setModalDetalleAbierto(false);
    setSolicitudDetalle(null);
    setDetalles([]);
  };

  const cancelarSolicitud = async (solicitud) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: '¿Cancelar solicitud?',
      html: `
        <p>Se cancelará la solicitud:</p>
        <p><strong>${solicitud.folio}</strong></p>
      `,
      showCancelButton: true,
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'No',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
    });

    if (!result.isConfirmed) return;

    try {
      const { data } = await api.delete(
        `/laboratorio/solicitudes/${solicitud.id_solicitud}`
      );

      if (data.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Solicitud cancelada',
          timer: 1500,
          showConfirmButton: false,
        });

        await cargarSolicitudes();
      }
    } catch (error) {
      console.error('Error al cancelar solicitud:', error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudo cancelar la solicitud de laboratorio.',
      });
    }
  };

  const imprimirSolicitud = (solicitud, estudios = []) => {
    const estudiosFinales =
      estudios.length > 0 ? estudios : solicitud.estudios || [];

    const estudiosHtml = estudiosFinales
      .map((item) => {
        const nombre = item.nombre || item.nombre_estudio || 'Estudio';
        const observacion = item.observaciones_estudio
          ? `
            <div class="observacion-estudio">
              <strong>Observaciones:</strong> ${escapeHtml(item.observaciones_estudio)}
            </div>
          `
          : '';

        return `
          <div class="estudio-item">
            <div class="estudio-nombre">• ${escapeHtml(nombre)}</div>
            ${observacion}
          </div>
        `;
      })
      .join('');

    const horaObtencionImpresa =
      formatearHora(solicitud.hora_obtencion_muestra) ||
      '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';

    const horaRecepcionImpresa =
      formatearHora(solicitud.hora_recepcion_muestra) ||
      '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';

    const fechaSolicitud = solicitud.fecha_solicitud
      ? new Date(solicitud.fecha_solicitud).toLocaleDateString('es-MX', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        })
      : new Date().toLocaleDateString('es-MX', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        });

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>Solicitud de Laboratorio</title>
          <style>
            * {
              box-sizing: border-box;
            }

            body {
              font-family: Arial, sans-serif;
              color: #111827;
              margin: 0;
              padding: 24px;
              background: #ffffff;
            }

            .hoja {
              width: 100%;
              max-width: 760px;
              margin: 0 auto;
              border: 2px solid #111827;
              padding: 24px;
              min-height: 980px;
            }

            .header {
              text-align: center;
              border-bottom: 2px solid #111827;
              padding-bottom: 14px;
              margin-bottom: 18px;
            }

            .header h1 {
              margin: 0;
              font-size: 22px;
              text-transform: uppercase;
            }

            .header p {
              margin: 4px 0;
              font-size: 13px;
            }

            .titulo {
              text-align: center;
              font-size: 24px;
              font-weight: bold;
              margin: 22px 0;
            }

            .folio {
              color: #b91c1c;
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 16px;
            }

            .grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px 18px;
              margin-bottom: 18px;
            }

            .campo {
              border-bottom: 1px solid #111827;
              min-height: 28px;
              font-size: 14px;
              padding-bottom: 4px;
            }

            .campo strong {
              display: inline-block;
              margin-right: 5px;
            }

            .seccion {
              margin-top: 18px;
            }

            .seccion h3 {
              font-size: 15px;
              margin-bottom: 8px;
              text-transform: uppercase;
            }

            .bloque {
              border: 1px solid #111827;
              min-height: 55px;
              padding: 10px;
              font-size: 14px;
              white-space: pre-wrap;
            }

            .bloque-estudios {
              border: 1px solid #111827;
              min-height: 120px;
              padding: 14px 16px;
              font-size: 14px;
            }

            .estudio-item {
              margin-bottom: 12px;
              font-size: 15px;
            }

            .estudio-nombre {
              font-weight: bold;
            }

            .observacion-estudio {
              margin-top: 4px;
              margin-left: 18px;
              font-size: 13px;
              color: #334155;
              line-height: 1.35;
            }

            .firma {
              margin-top: 90px;
              text-align: center;
            }

            .linea-firma {
              border-top: 1px solid #111827;
              width: 320px;
              margin: 0 auto 8px auto;
            }

            .footer {
              margin-top: 40px;
              font-size: 11px;
              text-align: right;
              color: #475569;
            }

            @media print {
              body {
                padding: 0;
              }

              .hoja {
                border: 2px solid #111827;
                min-height: 100vh;
              }
            }
          </style>
        </head>

        <body>
          <div class="hoja">
            <div class="header">
              <h1>Clínica / Farmacia Shaddai</h1>
              <p>Solicitud de estudios de laboratorio</p>
              <p>Documento generado desde el sistema POS</p>
            </div>

            <div class="folio">Nº ${escapeHtml(solicitud.folio)}</div>

            <div class="titulo">Solicitud de Laboratorio</div>

            <div class="grid">
              <div class="campo">
                <strong>Fecha:</strong> ${escapeHtml(fechaSolicitud)}
              </div>

              <div class="campo">
                <strong>Nombre del paciente:</strong> ${escapeHtml(solicitud.nombre_paciente)}
              </div>

              <div class="campo">
                <strong>Edad:</strong> ${escapeHtml(solicitud.edad || '---')}
              </div>

              <div class="campo">
                <strong>Sexo:</strong> ${escapeHtml(solicitud.sexo || '---')}
              </div>

              <div class="campo">
                <strong>Médico:</strong> ${escapeHtml(solicitud.medico_nombre || solicitud.nombre_medico || 'Doctor Shaddai')}
              </div>

              <div class="campo">
                <strong>Hr. obtención de la muestra:</strong> ${horaObtencionImpresa}
              </div>

              <div class="campo">
                <strong>Hr. recepción de la muestra:</strong> ${horaRecepcionImpresa}
              </div>
            </div>

            <div class="seccion">
              <h3>Diagnóstico</h3>
              <div class="bloque">${escapeHtml(solicitud.diagnostico || '')}</div>
            </div>

            <div class="seccion">
              <h3>Estudios solicitados</h3>
              <div class="bloque-estudios">
                ${estudiosHtml || 'Sin estudios registrados'}
              </div>
            </div>

            <div class="seccion">
              <h3>Observaciones generales</h3>
              <div class="bloque">
                ${
                  solicitud.observaciones
                    ? escapeHtml(solicitud.observaciones)
                    : 'Sin observaciones'
                }
              </div>
            </div>

            <div class="firma">
              <div class="linea-firma"></div>
              <strong>${escapeHtml(solicitud.medico_nombre || 'Doctor Shaddai')}</strong><br />
              Cédula: ${escapeHtml(solicitud.medico_cedula || 'N/A')}<br />
              Especialidad: ${escapeHtml(solicitud.medico_especialidad || 'N/A')}
            </div>

            <div class="footer">
              FSL-LAB-001-26
            </div>
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    const ventana = window.open('', '_blank', 'width=900,height=1100');

    if (!ventana) {
      Swal.fire({
        icon: 'error',
        title: 'No se pudo abrir la impresión',
        text: 'Permite ventanas emergentes para este sitio.',
      });
      return;
    }

    ventana.document.open();
    ventana.document.write(html);
    ventana.document.close();
  };

  const reimprimirSolicitud = async (solicitud) => {
    try {
      const { data } = await api.get(
        `/laboratorio/solicitudes/${solicitud.id_solicitud}`
      );

      if (data.ok) {
        imprimirSolicitud(data.solicitud, data.detalles || []);
      }
    } catch (error) {
      console.error('Error al reimprimir solicitud:', error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudo reimprimir la solicitud.',
      });
    }
  };

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-700 via-cyan-600 to-teal-500 p-7 text-white shadow-lg shadow-sky-900/20">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-20 left-8 h-52 w-52 rounded-full bg-white/10 blur-3xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
              <FlaskConical size={31} />
            </div>

            <div>
              <h1 className="text-2xl font-bold md:text-3xl">
                Solicitudes de laboratorio
              </h1>
              <p className="mt-1 text-sky-100">
                Historial, control y reimpresión de solicitudes generadas.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={cargarSolicitudes}
            disabled={cargando}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/15 px-5 py-3 text-sm font-bold text-white ring-1 ring-white/25 transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={19} className={cargando ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
            <ClipboardList size={22} />
          </div>
          <p className="text-sm text-slate-500">Total solicitudes</p>
          <p className="text-3xl font-black text-slate-800">
            {solicitudes.length}
          </p>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
            <FileText size={22} />
          </div>
          <p className="text-sm text-slate-500">Generadas</p>
          <p className="text-3xl font-black text-slate-800">
            {
              solicitudes.filter(
                (item) => String(item.estatus).toUpperCase() === 'GENERADA'
              ).length
            }
          </p>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-red-100 text-red-700">
            <Trash2 size={22} />
          </div>
          <p className="text-sm text-slate-500">Canceladas</p>
          <p className="text-3xl font-black text-slate-800">
            {
              solicitudes.filter(
                (item) => String(item.estatus).toUpperCase() === 'CANCELADA'
              ).length
            }
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                Historial de solicitudes
              </h2>
              <p className="text-sm text-slate-500">
                Consulta, reimprime o cancela solicitudes de laboratorio.
              </p>
            </div>

            <div className="relative w-full lg:max-w-sm">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 py-3 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="Buscar por folio, paciente o diagnóstico..."
              />
            </div>
          </div>
        </div>

        <div className="p-5">
          {cargando ? (
            <div className="flex items-center justify-center gap-2 rounded-2xl bg-slate-50 p-8 text-sm font-bold text-slate-600">
              <Loader2 size={22} className="animate-spin" />
              Cargando solicitudes...
            </div>
          ) : solicitudesFiltradas.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-slate-500">
              <FlaskConical size={44} className="mx-auto mb-3 text-slate-300" />
              <p className="font-bold text-slate-700">
                No hay solicitudes para mostrar
              </p>
              <p className="mt-1 text-sm">
                Cuando generes solicitudes de laboratorio aparecerán aquí.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="w-full min-w-[980px]">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500">
                      Folio
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500">
                      Paciente
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500">
                      Diagnóstico
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-black uppercase tracking-wide text-slate-500">
                      Estudios
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-black uppercase tracking-wide text-slate-500">
                      Fecha
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-black uppercase tracking-wide text-slate-500">
                      Estatus
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-black uppercase tracking-wide text-slate-500">
                      Acciones
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {solicitudesFiltradas.map((solicitud) => {
                    const estatus = String(
                      solicitud.estatus || ''
                    ).toUpperCase();

                    return (
                      <tr
                        key={solicitud.id_solicitud}
                        className="hover:bg-slate-50"
                      >
                        <td className="px-4 py-4">
                          <p className="font-black text-slate-800">
                            {solicitud.folio}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            ID #{solicitud.id_solicitud}
                          </p>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex items-start gap-2">
                            <User
                              size={17}
                              className="mt-0.5 shrink-0 text-sky-600"
                            />
                            <div>
                              <p className="font-bold text-slate-800">
                                {solicitud.nombre_paciente}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                Edad: {solicitud.edad || 'N/A'} · Sexo:{' '}
                                {solicitud.sexo || 'N/A'}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <p className="line-clamp-2 max-w-xs text-sm text-slate-600">
                            {solicitud.diagnostico || 'Sin diagnóstico'}
                          </p>
                        </td>

                        <td className="px-4 py-4 text-center">
                          <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-black text-sky-700">
                            {(solicitud.estudios || []).length}
                          </span>
                        </td>

                        <td className="px-4 py-4 text-center">
                          <div className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600">
                            <Calendar size={14} />
                            {formatearFecha(
                              solicitud.fecha_solicitud ||
                                solicitud.fecha_creacion
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-4 text-center">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${
                              ESTATUS_CLASES[estatus] ||
                              'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {ESTATUS_TEXTO[estatus] || estatus || 'Sin estatus'}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => verDetalleSolicitud(solicitud)}
                              className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
                              title="Ver detalle"
                            >
                              <Eye size={18} />
                            </button>

                            <button
                              type="button"
                              onClick={() => reimprimirSolicitud(solicitud)}
                              className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700 hover:bg-sky-200"
                              title="Reimprimir"
                            >
                              <Printer size={18} />
                            </button>

                            {estatus !== 'CANCELADA' && (
                              <button
                                type="button"
                                onClick={() => cancelarSolicitud(solicitud)}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-700 hover:bg-red-200"
                                title="Cancelar"
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {modalDetalleAbierto && solicitudDetalle && (
        <ModalDetalleSolicitudLaboratorio
          solicitud={solicitudDetalle}
          detalles={detalles}
          cargando={cargandoDetalle}
          onClose={cerrarDetalle}
          onReimprimir={() => imprimirSolicitud(solicitudDetalle, detalles)}
          formatearFecha={formatearFecha}
          formatearHora={formatearHora}
        />
      )}
    </div>
  );
}

function ModalDetalleSolicitudLaboratorio({
  solicitud,
  detalles,
  cargando,
  onClose,
  onReimprimir,
  formatearFecha,
  formatearHora,
}) {
  const estatus = String(solicitud.estatus || '').toUpperCase();

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              Detalle de solicitud
            </h2>
            <p className="text-sm text-slate-500">
              Folio: <strong>{solicitud.folio}</strong>
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
          <div className="mb-5 grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                Folio
              </p>
              <p className="mt-1 font-black text-slate-800">
                {solicitud.folio}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                Paciente
              </p>
              <p className="mt-1 font-black text-slate-800">
                {solicitud.nombre_paciente}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                Fecha
              </p>
              <p className="mt-1 font-black text-slate-800">
                {formatearFecha(
                  solicitud.fecha_solicitud || solicitud.fecha_creacion
                )}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                Estatus
              </p>
              <span
                className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-black ${
                  ESTATUS_CLASES[estatus] || 'bg-slate-100 text-slate-600'
                }`}
              >
                {ESTATUS_TEXTO[estatus] || estatus || 'Sin estatus'}
              </span>
            </div>
          </div>

          <div className="mb-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 bg-white p-4">
              <h3 className="mb-3 flex items-center gap-2 font-black text-slate-800">
                <User size={18} className="text-sky-700" />
                Datos del paciente
              </h3>

              <div className="space-y-1 text-sm text-slate-600">
                <p>
                  <strong>Nombre:</strong> {solicitud.nombre_paciente}
                </p>
                <p>
                  <strong>Edad:</strong> {solicitud.edad || 'N/A'}
                </p>
                <p>
                  <strong>Sexo:</strong> {solicitud.sexo || 'N/A'}
                </p>
                <p>
                  <strong>Teléfono:</strong> {solicitud.telefono || 'N/A'}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-4">
              <h3 className="mb-3 flex items-center gap-2 font-black text-slate-800">
                <Clock size={18} className="text-sky-700" />
                Datos de muestra
              </h3>

              <div className="space-y-1 text-sm text-slate-600">
                <p>
                  <strong>Hr. obtención:</strong>{' '}
                  {formatearHora(solicitud.hora_obtencion_muestra) || 'N/A'}
                </p>
                <p>
                  <strong>Hr. recepción:</strong>{' '}
                  {formatearHora(solicitud.hora_recepcion_muestra) || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <div className="mb-5 rounded-2xl border border-slate-100 bg-white p-4">
            <h3 className="mb-2 font-black text-slate-800">Diagnóstico</h3>
            <p className="whitespace-pre-wrap text-sm text-slate-600">
              {solicitud.diagnostico || 'Sin diagnóstico'}
            </p>
          </div>

          <div className="mb-5 rounded-2xl border border-slate-100 bg-white p-4">
            <h3 className="mb-3 font-black text-slate-800">
              Estudios solicitados
            </h3>

            {cargando ? (
              <div className="flex items-center gap-2 rounded-2xl bg-slate-50 p-5 text-sm font-bold text-slate-600">
                <Loader2 size={18} className="animate-spin" />
                Cargando estudios...
              </div>
            ) : detalles.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">
                No hay estudios registrados.
              </div>
            ) : (
              <div className="space-y-3">
                {detalles.map((item) => (
                  <div
                    key={item.id_detalle || item.id_estudio}
                    className="rounded-2xl border border-sky-100 bg-sky-50 p-4"
                  >
                    <p className="font-black text-sky-800">
                      {item.nombre_estudio || item.nombre}
                    </p>

                    {item.observaciones_estudio ? (
                      <p className="mt-2 text-sm text-slate-600">
                        <strong>Observaciones:</strong>{' '}
                        {item.observaciones_estudio}
                      </p>
                    ) : (
                      <p className="mt-2 text-sm text-slate-400">
                        Sin observaciones específicas.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mb-5 rounded-2xl border border-slate-100 bg-white p-4">
            <h3 className="mb-2 font-black text-slate-800">
              Observaciones generales
            </h3>
            <p className="whitespace-pre-wrap text-sm text-slate-600">
              {solicitud.observaciones || 'Sin observaciones'}
            </p>
          </div>

          <div className="flex flex-col justify-end gap-3 border-t border-slate-100 pt-5 sm:flex-row">
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
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-700 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-sky-900/20 hover:bg-sky-800"
            >
              <Printer size={18} />
              Reimprimir solicitud
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}