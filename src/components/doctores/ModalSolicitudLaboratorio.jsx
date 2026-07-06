import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import {
  X,
  Save,
  Printer,
  Plus,
  Search,
  FlaskConical,
  User,
  Stethoscope,
  CalendarDays,
  Trash2,
  Clock,
  Loader2,
} from 'lucide-react';

import api from '../../api/axios';
import logoFarmacia from '../../assets/logoShaddai.png';

const obtenerPrimerTexto = (...valores) => {
  const encontrado = valores.find((valor) => {
    return valor !== undefined && valor !== null && String(valor).trim() !== '';
  });

  return encontrado !== undefined && encontrado !== null
    ? String(encontrado).trim()
    : '';
};

export default function ModalSolicitudLaboratorio({
  abierto,
  onClose,
  paciente = null,
  medico = null,
  onGuardar = null,
}) {
  const [diagnostico, setDiagnostico] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [horaObtencionMuestra, setHoraObtencionMuestra] = useState('');
  const [horaRecepcionMuestra, setHoraRecepcionMuestra] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [nuevoEstudio, setNuevoEstudio] = useState('');
  const [estudiosSeleccionados, setEstudiosSeleccionados] = useState([]);

  const [catalogo, setCatalogo] = useState([]);
  const [cargandoCatalogo, setCargandoCatalogo] = useState(false);
  const [guardandoSolicitud, setGuardandoSolicitud] = useState(false);
  const [solicitudGuardada, setSolicitudGuardada] = useState(null);

  const fechaActual = useMemo(() => {
    return new Date().toLocaleDateString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }, []);

  const folioTemporal = useMemo(() => {
    return `LAB-${Date.now().toString().slice(-6)}`;
  }, []);

  const mostrarAlerta = (config) => {
    return Swal.fire({
      ...config,
      target: document.body,
      customClass: {
        container: 'swal-laboratorio-container',
        popup: 'swal-laboratorio-popup',
        ...(config.customClass || {}),
      },
    });
  };

  const cargarCatalogo = async () => {
    try {
      setCargandoCatalogo(true);

      const { data } = await api.get('/laboratorio/catalogo');

      if (!data.ok) {
        throw new Error(data.mensaje || 'No se pudo cargar el catálogo.');
      }

      setCatalogo(data.estudios || []);
    } catch (error) {
      console.error('Error al cargar catálogo de laboratorio:', error);

      mostrarAlerta({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          error.message ||
          'No se pudo cargar el catálogo de laboratorio.',
      });

      setCatalogo([]);
    } finally {
      setCargandoCatalogo(false);
    }
  };

  useEffect(() => {
    if (!abierto) return;

    cargarCatalogo();
    setSolicitudGuardada(null);
  }, [abierto]);

  const catalogoFiltrado = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    if (!texto) return catalogo;

    return catalogo.filter((item) =>
      String(item.nombre || '').toLowerCase().includes(texto)
    );
  }, [busqueda, catalogo]);

  const pacienteFinal = {
    nombre:
      obtenerPrimerTexto(
        paciente?.nombre,
        paciente?.nombre_paciente,
        paciente?.paciente_nombre
      ) || 'Paciente de prueba',

    edad: obtenerPrimerTexto(paciente?.edad) || '---',

    sexo: obtenerPrimerTexto(paciente?.sexo) || '---',

    expediente:
      obtenerPrimerTexto(
        paciente?.no_expediente,
        paciente?.id_expediente,
        paciente?.expediente
      ) || '---',
  };

  /*
   * Acepta las variantes que pueden venir del perfil, de una consulta
   * guardada o de endpoints antiguos. Así la impresión no depende de un
   * único nombre de columna.
   */
  const medicoFinal = {
    nombre:
      obtenerPrimerTexto(
        medico?.nombre_completo,
        medico?.medico_nombre,
        medico?.doctor_nombre_completo,
        medico?.nombre
      ) || 'Médico solicitante',

    cedula:
      obtenerPrimerTexto(
        medico?.cedula_profesional,
        medico?.medico_cedula,
        medico?.doctor_cedula_profesional,
        medico?.cedula
      ) || '---',

    especialidad:
      obtenerPrimerTexto(
        medico?.especialidad,
        medico?.medico_especialidad,
        medico?.doctor_especialidad
      ) || '---',

    telefono:
      obtenerPrimerTexto(
        medico?.telefono,
        medico?.telefono_contacto,
        medico?.telefono_consultorio,
        medico?.celular,
        medico?.medico_telefono,
        medico?.doctor_telefono,
        medico?.perfil?.telefono
      ) || '---',
  };

  const escapeHtml = (valor = '') => {
    return String(valor)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  };

  const seleccionarEstudio = (estudio) => {
    const yaExiste = estudiosSeleccionados.some(
      (item) => item.id_estudio === estudio.id_estudio
    );

    if (yaExiste) return;

    setEstudiosSeleccionados((prev) => [
      ...prev,
      {
        ...estudio,
        observaciones_estudio: '',
      },
    ]);
  };

  const quitarEstudio = (idEstudio) => {
    setEstudiosSeleccionados((prev) =>
      prev.filter((item) => item.id_estudio !== idEstudio)
    );
  };

  const actualizarObservacionEstudio = (idEstudio, valor) => {
    setEstudiosSeleccionados((prev) =>
      prev.map((item) =>
        item.id_estudio === idEstudio
          ? {
            ...item,
            observaciones_estudio: valor,
          }
          : item
      )
    );
  };

  const agregarEstudioCatalogo = async () => {
    const nombre = nuevoEstudio.trim();

    if (!nombre) {
      mostrarAlerta({
        icon: 'warning',
        title: 'Nombre requerido',
        text: 'Escribe el nombre del estudio de laboratorio.',
      });
      return;
    }

    const yaExiste = catalogo.some(
      (item) => item.nombre.toLowerCase() === nombre.toLowerCase()
    );

    if (yaExiste) {
      mostrarAlerta({
        icon: 'warning',
        title: 'Estudio duplicado',
        text: 'Ese estudio ya existe en el catálogo.',
      });
      return;
    }

    try {
      const { data } = await api.post('/laboratorio/catalogo', {
        nombre,
        descripcion: null,
      });

      if (!data.ok) {
        throw new Error(data.mensaje || 'No se pudo agregar el estudio.');
      }

      const nuevo = data.estudio;

      setCatalogo((prev) => [...prev, nuevo]);
      setEstudiosSeleccionados((prev) => [
        ...prev,
        {
          id_estudio: nuevo.id_estudio,
          nombre: nuevo.nombre,
          observaciones_estudio: '',
        },
      ]);

      setNuevoEstudio('');

      mostrarAlerta({
        icon: 'success',
        title: 'Estudio agregado',
        text: 'El estudio se agregó al catálogo correctamente.',
        timer: 1300,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error('Error al agregar estudio al catálogo:', error);

      mostrarAlerta({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          error.message ||
          'No se pudo agregar el estudio al catálogo.',
      });
    }
  };

  const limpiarFormulario = () => {
    setDiagnostico('');
    setObservaciones('');
    setHoraObtencionMuestra('');
    setHoraRecepcionMuestra('');
    setBusqueda('');
    setNuevoEstudio('');
    setEstudiosSeleccionados([]);
  };

  const cerrarModal = () => {
    onClose();
  };

  const validar = () => {
    if (!diagnostico.trim()) {
      mostrarAlerta({
        icon: 'warning',
        title: 'Diagnóstico requerido',
        text: 'Escribe el diagnóstico para la solicitud.',
      });
      return false;
    }

    if (estudiosSeleccionados.length === 0) {
      mostrarAlerta({
        icon: 'warning',
        title: 'Estudios requeridos',
        text: 'Selecciona al menos un estudio de laboratorio.',
      });
      return false;
    }

    return true;
  };

  const construirSolicitud = () => {
    return {
      folio: folioTemporal,
      fecha: fechaActual,
      paciente: pacienteFinal,
      medico: medicoFinal,
      diagnostico: diagnostico.trim(),
      observaciones: observaciones.trim(),
      hora_obtencion_muestra: horaObtencionMuestra || '',
      hora_recepcion_muestra: horaRecepcionMuestra || '',
      estudios: estudiosSeleccionados.map((item) => ({
        id_estudio: item.id_estudio,
        nombre: item.nombre,
        observaciones_estudio: item.observaciones_estudio || '',
      })),
    };
  };

  const guardarSolicitudEnBackend = async ({ mostrarMensaje = true } = {}) => {
    if (!validar()) return null;

    if (solicitudGuardada) {
      if (mostrarMensaje) {
        mostrarAlerta({
          icon: 'info',
          title: 'Solicitud ya guardada',
          text: 'Esta solicitud ya fue guardada. Puedes imprimirla o cerrar el modal.',
        });
      }

      return solicitudGuardada;
    }

    const solicitud = construirSolicitud();

    try {
      setGuardandoSolicitud(true);

      let respuesta = null;

      if (onGuardar) {
        respuesta = await onGuardar(solicitud);
      }

      const solicitudBackend = respuesta?.solicitud || null;

      const solicitudFinal = {
        ...solicitud,
        folio: solicitudBackend?.folio || solicitud.folio,
        id_solicitud: solicitudBackend?.id_solicitud || null,
        respuesta_backend: respuesta || null,
      };

      setSolicitudGuardada(solicitudFinal);

      if (mostrarMensaje) {
        mostrarAlerta({
          icon: 'success',
          title: 'Solicitud guardada',
          text: 'La solicitud de laboratorio se guardó correctamente.',
          timer: 1600,
          showConfirmButton: false,
        });
      }

      return solicitudFinal;
    } catch (error) {
      console.error('Error al guardar solicitud de laboratorio:', error);

      mostrarAlerta({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          error.message ||
          'No se pudo guardar la solicitud de laboratorio.',
      });

      return null;
    } finally {
      setGuardandoSolicitud(false);
    }
  };

  const guardarSolicitud = async () => {
    const solicitud = await guardarSolicitudEnBackend({ mostrarMensaje: true });

    if (!solicitud) return null;

    limpiarFormulario();
    onClose();

    return solicitud;
  };

  const generarHtmlImpresion = (solicitud) => {
    const logoUrl = logoFarmacia;

    const estudiosHtml = (solicitud.estudios || [])
      .map((item, index) => {
        const observacion = item.observaciones_estudio
          ? `
              <p class="estudio-observacion">
                <strong>Observaciones:</strong> ${escapeHtml(item.observaciones_estudio)}
              </p>
            `
          : '';

        return `
          <div class="estudio-card">
            <div class="estudio-numero">${index + 1}</div>

            <div class="estudio-contenido">
              <p class="estudio-nombre">${escapeHtml(item.nombre || 'Estudio')}</p>
              ${observacion}
            </div>
          </div>
        `;
      })
      .join('');

    const fechaImpresa = solicitud.fecha || new Date().toLocaleDateString('es-MX');

    const horaObtencionImpresa =
      solicitud.hora_obtencion_muestra ||
      '____________';

    const horaRecepcionImpresa =
      solicitud.hora_recepcion_muestra ||
      '____________';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title></title>

          <style>
            @page {
              size: letter portrait;
              margin: 6mm;
            }

            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            html,
            body {
              margin: 0;
              padding: 0;
              width: 100%;
              min-height: 0;
              background: #ffffff;
              color: #0f172a;
              font-family: Arial, Helvetica, sans-serif;
              font-size: 10px;
              overflow: visible;
            }

            body {
              margin: 0;
              padding: 0;
            }

            .hoja {
              position: relative;
              width: 100%;
              height: 266mm;
              max-height: 266mm;
              min-height: 0;
              overflow: hidden;
              border: 1px solid #cbd5e1;
              border-radius: 16px;
              background: #ffffff;
              box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
              display: flex;
              flex-direction: column;
              page-break-before: auto;
              page-break-after: auto;
              page-break-inside: auto;
              break-before: auto;
              break-after: auto;
              break-inside: auto;
            }

            .decoracion-uno,
            .decoracion-dos {
              position: absolute;
              border-radius: 999px;
              pointer-events: none;
              z-index: 0;
            }

            .decoracion-uno {
              top: -70px;
              right: -70px;
              width: 190px;
              height: 190px;
              background: rgba(207, 250, 254, 0.75);
              filter: blur(16px);
            }

            .decoracion-dos {
              bottom: -90px;
              left: -90px;
              width: 230px;
              height: 230px;
              background: rgba(224, 242, 254, 0.8);
              filter: blur(18px);
            }

            .contenido {
              position: relative;
              z-index: 1;
              flex: 1;
              min-height: 0;
              display: flex;
              flex-direction: column;
            }

            .encabezado {
              display: grid;
              grid-template-columns: 78px 1fr 175px;
              align-items: center;
              gap: 14px;
              padding: 12px 16px;
              border-bottom: 1px solid #e2e8f0;
              background: linear-gradient(90deg, #ecfeff 0%, #ffffff 50%, #f0f9ff 100%);
              flex: 0 0 auto;
            }

            .logo-box {
              width: 54px;
              height: 54px;
              display: flex;
              align-items: center;
              justify-content: center;
              border: 1px solid #e2e8f0;
              border-radius: 15px;
              background: #ffffff;
              box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
            }

            .logo {
              width: 46px;
              height: 46px;
              object-fit: contain;
            }

            .titulo-institucion {
              text-align: center;
              line-height: 1.12;
            }

            .titulo-institucion .nombre {
              font-size: 18px;
              font-weight: 900;
              letter-spacing: 1.2px;
              text-transform: uppercase;
              color: #020617;
            }

            .titulo-institucion .documento {
              margin-top: 3px;
              font-size: 10px;
              font-weight: 900;
              letter-spacing: 2.4px;
              text-transform: uppercase;
              color: #0e7490;
            }

            .titulo-institucion .subtitulo {
              margin-top: 4px;
              font-size: 8px;
              font-weight: 700;
              color: #64748b;
            }

            .folio-card {
              min-height: 54px;
              border: 1px solid #e2e8f0;
              border-radius: 16px;
              background: #ffffff;
              padding: 8px 10px;
              text-align: center;
              box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
            }

            .folio-card .label {
              font-size: 7px;
              font-weight: 900;
              letter-spacing: 2px;
              text-transform: uppercase;
              color: #64748b;
            }

            .folio-card .folio {
              margin-top: 4px;
              font-size: 10px;
              font-weight: 900;
              color: #0e7490;
              word-break: break-word;
            }

            .folio-card .fecha {
              margin-top: 4px;
              font-size: 8px;
              font-weight: 700;
              color: #64748b;
            }

            .cuerpo {
              flex: 1;
              min-height: 0;
              display: grid;
              grid-template-columns: 0.92fr 1.08fr;
              gap: 10px;
              padding: 11px 16px 7px;
              align-items: stretch;
            }

            .columna {
              display: flex;
              flex-direction: column;
              gap: 9px;
              min-height: 0;
            }

            .card {
              border: 1px solid #e2e8f0;
              border-radius: 15px;
              background: #ffffff;
              padding: 9px 10px;
              box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
              break-inside: auto;
              page-break-inside: auto;
            }

            .card.suave {
              background: rgba(248, 250, 252, 0.82);
            }

            .card.cyan {
              border-color: #bae6fd;
              background: rgba(236, 254, 255, 0.72);
            }

            .card-header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 8px;
              padding-bottom: 6px;
              margin-bottom: 7px;
              border-bottom: 1px solid #e2e8f0;
            }

            .card-title {
              margin: 0;
              font-size: 9px;
              font-weight: 900;
              letter-spacing: 1.4px;
              text-transform: uppercase;
              color: #1e293b;
            }

            .pill {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              border-radius: 999px;
              padding: 3px 8px;
              background: #cffafe;
              color: #0e7490;
              font-size: 7px;
              font-weight: 900;
              white-space: nowrap;
            }

            .pill.green {
              background: #d1fae5;
              color: #047857;
            }

            .texto {
              margin: 0;
              line-height: 1.32;
              color: #1e293b;
              font-size: 9px;
            }

            .texto strong {
              font-weight: 900;
              color: #0f172a;
            }

            .grid-datos {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 3px 10px;
            }

            .span-2 {
              grid-column: span 2;
            }

            .muestra-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 9px;
            }

            .muestra-box {
              border: 1px solid #bae6fd;
              border-radius: 12px;
              background: #ffffff;
              padding: 8px;
              min-height: 42px;
            }

            .muestra-box .label {
              display: block;
              margin-bottom: 4px;
              font-size: 7px;
              font-weight: 900;
              letter-spacing: 0.5px;
              text-transform: uppercase;
              color: #0e7490;
            }

            .muestra-box .valor {
              font-size: 9px;
              font-weight: 800;
              color: #0f172a;
            }

            .diagnostico-box {
              flex: 1;
              min-height: 0;
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              background: #f8fafc;
              padding: 9px 10px;
              white-space: pre-wrap;
              line-height: 1.35;
              font-size: 9px;
              color: #1e293b;
            }

            .estudios-lista {
              flex: 1;
              min-height: 0;
              display: flex;
              flex-direction: column;
              gap: 7px;
              overflow: hidden;
            }

            .estudio-card {
              display: grid;
              grid-template-columns: 22px 1fr;
              gap: 8px;
              align-items: start;
              border: 1px solid #e2e8f0;
              border-radius: 13px;
              background: #f8fafc;
              padding: 8px 9px;
              break-inside: avoid;
              page-break-inside: avoid;
            }

            .estudio-numero {
              width: 20px;
              height: 20px;
              display: flex;
              align-items: center;
              justify-content: center;
              border-radius: 999px;
              background: #cffafe;
              color: #0e7490;
              font-size: 9px;
              font-weight: 900;
            }

            .estudio-nombre {
              margin: 0;
              font-size: 9px;
              line-height: 1.25;
              font-weight: 900;
              color: #0f172a;
            }

            .estudio-observacion {
              margin: 3px 0 0;
              font-size: 8px;
              line-height: 1.25;
              color: #475569;
            }

            .sin-registros {
              border: 1px dashed #cbd5e1;
              border-radius: 13px;
              background: #f8fafc;
              padding: 14px;
              text-align: center;
              font-size: 9px;
              font-weight: 800;
              color: #64748b;
            }

            .observaciones-box {
              min-height: 74px;
              max-height: 92px;
              overflow: hidden;
              white-space: pre-wrap;
              line-height: 1.35;
              font-size: 9px;
              color: #334155;
            }

            .firma-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
              margin-top: auto;
            }

            .firma-card,
            .sello-card {
              min-height: 72px;
              border: 1px solid #e2e8f0;
              border-radius: 14px;
              background: #ffffff;
              padding: 9px;
              text-align: center;
            }

            .firma-linea {
              width: 80%;
              height: 1px;
              margin: 24px auto 6px;
              background: #475569;
            }

            .firma-titulo {
              margin: 0;
              font-size: 8px;
              font-weight: 900;
              color: #0f172a;
            }

            .firma-sub {
              margin: 2px 0 0;
              font-size: 7px;
              color: #64748b;
            }

            .sello-card {
              display: flex;
              align-items: center;
              justify-content: center;
              border-style: dashed;
              background: rgba(236, 254, 255, 0.5);
              color: #0e7490;
              font-size: 8px;
              font-weight: 900;
            }

            .columna:first-child .card:last-child {
              flex: 1;
              min-height: 0;
              display: flex;
              flex-direction: column;
            }

            .columna:last-child .card:first-child {
              flex: 1;
              min-height: 0;
              display: flex;
              flex-direction: column;
            }

            .footer {
              flex: 0 0 auto;
              padding: 4px 16px 8px;
              text-align: center;
              font-size: 7px;
              color: #94a3b8;
            }

            @media print {
              html,
              body {
                margin: 0 !important;
                padding: 0 !important;
                width: 100% !important;
                min-height: 0 !important;
                overflow: visible !important;
              }

              .hoja {
                height: 266mm !important;
                max-height: 266mm !important;
                min-height: 0 !important;
                overflow: hidden !important;
                border-radius: 0 !important;
                box-shadow: none !important;
                page-break-before: auto !important;
                page-break-after: auto !important;
                page-break-inside: auto !important;
                break-before: auto !important;
                break-after: auto !important;
                break-inside: auto !important;
              }

              .contenido {
                min-height: 0 !important;
                height: 100% !important;
                display: flex !important;
                flex-direction: column !important;
              }

              .cuerpo {
                flex: 1 !important;
                min-height: 0 !important;
                align-items: stretch !important;
              }

              .decoracion-uno,
              .decoracion-dos {
                display: none !important;
              }
            }
          </style>
        </head>

        <body>
          <div class="hoja">
            <div class="decoracion-uno"></div>
            <div class="decoracion-dos"></div>

            <div class="contenido">
              <div class="encabezado">
                <div class="logo-box">
                  <img
                    class="logo"
                    src="${logoUrl}"
                    alt="Logo"
                    onerror="this.style.display='none';"
                  />
                </div>

                <div class="titulo-institucion">
                  <div class="nombre">Farmacias Shaddai</div>
                  <div class="documento">Solicitud de laboratorio y gabinete</div>
                  <div class="subtitulo">Bienestar al alcance de todos</div>
                </div>

                <div class="folio-card">
                  <div class="label">Folio</div>
                  <div class="folio">${escapeHtml(solicitud.folio || 'LAB-SIN-FOLIO')}</div>
                  <div class="fecha">${escapeHtml(fechaImpresa)}</div>
                </div>
              </div>

              <div class="cuerpo">
                <div class="columna">
                  <section class="card suave">
                    <div class="card-header">
                      <h2 class="card-title">Médico solicitante</h2>
                      <span class="pill">Área médica</span>
                    </div>

                    <p class="texto"><strong>Nombre:</strong> ${escapeHtml(solicitud.medico?.nombre || 'Doctor Shaddai')}</p>
                    <p class="texto"><strong>Institución:</strong> Farmacias Shaddai</p>
                    <p class="texto"><strong>Especialidad:</strong> ${escapeHtml(solicitud.medico?.especialidad || 'N/A')}</p>
                    <p class="texto"><strong>Cédula:</strong> ${escapeHtml(solicitud.medico?.cedula || 'N/A')}</p>
                    <p class="texto"><strong>Teléfono:</strong> ${escapeHtml(solicitud.medico?.telefono || 'N/A')}</p>
                  </section>

                  <section class="card">
                    <div class="card-header">
                      <h2 class="card-title">Paciente</h2>
                      <span class="pill green">Exp. #${escapeHtml(solicitud.paciente?.expediente || 'N/A')}</span>
                    </div>

                    <div class="grid-datos">
                      <p class="texto span-2"><strong>Paciente:</strong> ${escapeHtml(solicitud.paciente?.nombre || 'N/A')}</p>
                      <p class="texto"><strong>Edad:</strong> ${escapeHtml(solicitud.paciente?.edad || 'N/A')}</p>
                      <p class="texto"><strong>Sexo:</strong> ${escapeHtml(solicitud.paciente?.sexo || 'N/A')}</p>
                      <p class="texto"><strong>Fecha:</strong> ${escapeHtml(fechaImpresa)}</p>
                      <p class="texto"><strong>Expediente:</strong> ${escapeHtml(solicitud.paciente?.expediente || 'N/A')}</p>
                    </div>
                  </section>

                  <section class="card cyan">
                    <div class="card-header">
                      <h2 class="card-title">Datos de muestra</h2>
                    </div>

                    <div class="muestra-grid">
                      <div class="muestra-box">
                        <span class="label">Hr. obtención</span>
                        <span class="valor">${escapeHtml(horaObtencionImpresa)}</span>
                      </div>

                      <div class="muestra-box">
                        <span class="label">Hr. recepción</span>
                        <span class="valor">${escapeHtml(horaRecepcionImpresa)}</span>
                      </div>
                    </div>
                  </section>

                  <section class="card">
                    <div class="card-header">
                      <h2 class="card-title">Diagnóstico / impresión diagnóstica</h2>
                    </div>

                    <div class="diagnostico-box">
                      ${escapeHtml(solicitud.diagnostico || 'N/A')}
                    </div>
                  </section>
                </div>

                <div class="columna">
                  <section class="card">
                    <div class="card-header">
                      <h2 class="card-title">Estudios solicitados</h2>
                      <span class="pill">${(solicitud.estudios || []).length} estudio(s)</span>
                    </div>

                    <div class="estudios-lista">
                      ${estudiosHtml ||
      '<div class="sin-registros">Sin estudios registrados.</div>'
      }
                    </div>
                  </section>

                  <section class="card">
                    <div class="card-header">
                      <h2 class="card-title">Observaciones generales</h2>
                    </div>

                    <div class="observaciones-box">
                      ${escapeHtml(solicitud.observaciones || 'Sin observaciones')}
                    </div>
                  </section>

                  <section class="firma-grid">
                    <div class="firma-card">
                      <div class="firma-linea"></div>
                      <p class="firma-titulo">Firma del médico</p>
                      <p class="firma-sub">${escapeHtml(solicitud.medico?.nombre || '')}</p>
                      <p class="firma-sub">Cédula: ${escapeHtml(solicitud.medico?.cedula || 'N/A')}</p>
                      <p class="firma-sub">Teléfono: ${escapeHtml(solicitud.medico?.telefono || 'N/A')}</p>
                    </div>

                    <div class="sello-card">
                     
                    </div>
                  </section>
                </div>
              </div>

              <div class="footer">
               
              </div>
            </div>
          </div>

          <script>
            window.onload = function() {
              document.title = '';
              setTimeout(function() {
                window.print();
              }, 300);
            };
          </script>
        </body>
      </html>
    `;
  };


  const imprimirSolicitud = async () => {
    if (!validar()) return;

    const result = await mostrarAlerta({
      icon: 'question',
      title: solicitudGuardada ? 'Imprimir solicitud' : 'Guardar antes de imprimir',
      text: solicitudGuardada
        ? 'La solicitud ya fue guardada. Se abrirá la ventana de impresión.'
        : 'Para imprimir esta solicitud primero debe guardarse en el expediente del paciente.',
      showCancelButton: !solicitudGuardada,
      confirmButtonText: solicitudGuardada ? 'Imprimir' : 'Guardar e imprimir',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#0284c7',
      cancelButtonColor: '#64748b',
    });

    if (!result.isConfirmed) return;

    const solicitud = solicitudGuardada || (await guardarSolicitudEnBackend({ mostrarMensaje: false }));

    if (!solicitud) return;

    const html = generarHtmlImpresion(solicitud);

    const ventana = window.open('', '_blank', 'width=900,height=1100');

    if (!ventana) {
      mostrarAlerta({
        icon: 'error',
        title: 'No se pudo abrir la impresión',
        text: 'Permite ventanas emergentes para este sitio.',
      });
      return;
    }

    ventana.document.open();
    ventana.document.write(html);
    ventana.document.close();

    limpiarFormulario();
    onClose();
  };

  if (!abierto) return null;

  return (
    <>
      <style>
        {`
        .swal-laboratorio-container {
          z-index: 30000 !important;
        }

        .swal-laboratorio-popup {
          z-index: 30001 !important;
        }
      `}
      </style>

      <div className="fixed inset-0 z-[9999] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">

        <div className="w-full max-w-6xl max-h-[95vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-sky-700 to-cyan-500 text-white flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center">
                <FlaskConical size={26} />
              </div>

              <div>
                <h2 className="text-xl md:text-2xl font-bold">
                  Nueva solicitud de laboratorio
                </h2>
                <p className="text-sm text-sky-100">
                  Captura estudios, diagnóstico y datos para impresión.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={cerrarModal}
              className="w-10 h-10 rounded-2xl bg-white/15 hover:bg-white/25 flex items-center justify-center transition"
            >
              <X size={22} />
            </button>
          </div>

          <div className="p-6 overflow-y-auto">
            <div className="grid xl:grid-cols-[1fr_0.9fr] gap-6">
              <section className="space-y-5">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <User size={20} className="text-sky-700" />
                      <h3 className="font-bold text-slate-800">
                        Datos del paciente
                      </h3>
                    </div>

                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="font-bold text-slate-600">
                          Nombre:
                        </span>{' '}
                        {pacienteFinal.nombre}
                      </p>

                      <p>
                        <span className="font-bold text-slate-600">
                          Edad:
                        </span>{' '}
                        {pacienteFinal.edad}
                      </p>

                      <p>
                        <span className="font-bold text-slate-600">
                          Sexo:
                        </span>{' '}
                        {pacienteFinal.sexo}
                      </p>

                      <p>
                        <span className="font-bold text-slate-600">
                          Expediente:
                        </span>{' '}
                        {pacienteFinal.expediente}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Stethoscope size={20} className="text-sky-700" />
                      <h3 className="font-bold text-slate-800">
                        Datos del médico
                      </h3>
                    </div>

                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="font-bold text-slate-600">
                          Nombre:
                        </span>{' '}
                        {medicoFinal.nombre}
                      </p>

                      <p>
                        <span className="font-bold text-slate-600">
                          Cédula:
                        </span>{' '}
                        {medicoFinal.cedula}
                      </p>

                      <p>
                        <span className="font-bold text-slate-600">
                          Especialidad:
                        </span>{' '}
                        {medicoFinal.especialidad}
                      </p>

                      <p>
                        <span className="font-bold text-slate-600">
                          Teléfono:
                        </span>{' '}
                        {medicoFinal.telefono}
                      </p>

                      <p className="inline-flex items-center gap-2">
                        <CalendarDays size={16} />
                        <span>{fechaActual}</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-100 bg-white p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock size={20} className="text-sky-700" />
                    <h3 className="font-bold text-slate-800">
                      Datos de muestra
                    </h3>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">
                        Hr. obtención de la muestra
                        <span className="ml-1 text-xs font-normal text-slate-400">
                          (opcional)
                        </span>
                      </label>

                      <input
                        type="time"
                        value={horaObtencionMuestra}
                        onChange={(e) =>
                          setHoraObtencionMuestra(e.target.value)
                        }
                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">
                        Hr. recepción de la muestra
                        <span className="ml-1 text-xs font-normal text-slate-400">
                          (opcional)
                        </span>
                      </label>

                      <input
                        type="time"
                        value={horaRecepcionMuestra}
                        onChange={(e) =>
                          setHoraRecepcionMuestra(e.target.value)
                        }
                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-slate-500">
                    Si no capturas las horas, el formato se imprimirá con esos campos en blanco.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Diagnóstico
                  </label>

                  <textarea
                    value={diagnostico}
                    onChange={(e) => setDiagnostico(e.target.value)}
                    rows="4"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                    placeholder="Ej. Dolor abdominal, fiebre, sospecha de infección..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Observaciones generales
                  </label>

                  <textarea
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    rows="3"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                    placeholder="Notas generales para laboratorio..."
                  />
                </div>

                <div className="rounded-3xl border border-slate-100 p-5">
                  <h3 className="font-bold text-slate-800 mb-4">
                    Agregar estudio al catálogo
                  </h3>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      value={nuevoEstudio}
                      onChange={(e) => setNuevoEstudio(e.target.value)}
                      className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      placeholder="Ej. Prueba rápida de influenza"
                    />

                    <button
                      type="button"
                      onClick={agregarEstudioCatalogo}
                      className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-sky-700 hover:bg-sky-800 text-white font-bold transition"
                    >
                      <Plus size={19} />
                      Agregar
                    </button>
                  </div>
                </div>
              </section>

              <section className="space-y-5">
                <div className="rounded-3xl border border-slate-100 overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100">
                    <h3 className="font-bold text-slate-800">
                      Catálogo de estudios
                    </h3>

                    <p className="text-sm text-slate-500">
                      Selecciona uno o varios estudios.
                    </p>

                    <div className="relative mt-4">
                      <Search
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        type="text"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        placeholder="Buscar estudio..."
                      />
                    </div>
                  </div>

                  <div className="p-4 max-h-72 overflow-y-auto space-y-2">
                    {cargandoCatalogo ? (
                      <p className="text-sm text-slate-500 text-center py-6">
                        Cargando catálogo...
                      </p>
                    ) : catalogoFiltrado.length === 0 ? (
                      <p className="text-sm text-slate-500 text-center py-6">
                        No se encontraron estudios.
                      </p>
                    ) : (
                      catalogoFiltrado.map((estudio) => {
                        const seleccionado = estudiosSeleccionados.some(
                          (item) => item.id_estudio === estudio.id_estudio
                        );

                        return (
                          <button
                            key={estudio.id_estudio}
                            type="button"
                            onClick={() => seleccionarEstudio(estudio)}
                            disabled={seleccionado}
                            className={`w-full text-left px-4 py-3 rounded-2xl border transition ${seleccionado
                              ? 'bg-sky-50 border-sky-200 text-sky-700 font-bold'
                              : 'bg-white border-slate-100 hover:bg-slate-50 text-slate-700'
                              }`}
                          >
                            {estudio.nombre}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-100 overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
                    <h3 className="font-bold text-slate-800">
                      Estudios seleccionados
                    </h3>

                    <p className="text-sm text-slate-500">
                      {estudiosSeleccionados.length} estudio(s) agregado(s).
                    </p>
                  </div>

                  <div className="p-4 space-y-3 min-h-36">
                    {estudiosSeleccionados.length === 0 ? (
                      <div className="py-8 text-center text-slate-500">
                        <FlaskConical
                          size={36}
                          className="mx-auto mb-2 text-slate-300"
                        />

                        <p className="text-sm">
                          Todavía no seleccionas estudios.
                        </p>
                      </div>
                    ) : (
                      estudiosSeleccionados.map((estudio) => (
                        <div
                          key={estudio.id_estudio}
                          className="rounded-2xl bg-sky-50 border border-sky-100 p-4 space-y-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-bold text-sky-800">
                                {estudio.nombre}
                              </p>

                              <p className="text-xs text-slate-500 mt-1">
                                Observación específica para este estudio.
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => quitarEstudio(estudio.id_estudio)}
                              className="w-9 h-9 rounded-xl bg-white text-red-600 hover:bg-red-50 flex items-center justify-center transition shrink-0"
                            >
                              <Trash2 size={17} />
                            </button>
                          </div>

                          <textarea
                            value={estudio.observaciones_estudio || ''}
                            onChange={(e) =>
                              actualizarObservacionEstudio(
                                estudio.id_estudio,
                                e.target.value
                              )
                            }
                            rows="2"
                            className="w-full resize-none rounded-xl border border-sky-100 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500"
                            placeholder="Ej. Ayuno de 8 horas, muestra urgente, tomar antes de medicamento..."
                          />
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </section>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-end gap-3">
            <button
              type="button"
              onClick={cerrarModal}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 transition"
            >
              <X size={19} />
              Cancelar
            </button>

            <button
              type="button"
              onClick={guardarSolicitud}
              disabled={guardandoSolicitud}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-700 hover:bg-slate-800 text-white font-bold transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              {guardandoSolicitud ? <Loader2 size={19} className="animate-spin" /> : <Save size={19} />}
              {guardandoSolicitud ? 'Guardando...' : 'Guardar'}
            </button>

            <button
              type="button"
              onClick={imprimirSolicitud}
              disabled={guardandoSolicitud}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-sky-700 hover:bg-sky-800 text-white font-bold shadow-lg shadow-sky-900/20 transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              {guardandoSolicitud ? <Loader2 size={19} className="animate-spin" /> : <Printer size={19} />}
              {guardandoSolicitud ? 'Guardando...' : 'Guardar e imprimir'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}