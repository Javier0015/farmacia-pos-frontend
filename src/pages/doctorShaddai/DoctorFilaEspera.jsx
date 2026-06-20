import React, { useEffect, useMemo, useState } from 'react';
import {
  Stethoscope,
  Clock,
  Search,
  RefreshCw,
  User,
  Phone,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  PlayCircle,
  ClipboardList,
  Timer,
  Store,
  FolderOpen,
  Plus,
  X,
  Link as LinkIcon,
  FilePlus2,
  Pill,
  FlaskConical,
  Files,
  Eye,
  Printer as PrinterIcon,
} from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../../api/axios';
import logoFarmacia from '../../assets/logoShaddai.png';
import { doctorFilaService } from '../../services/doctorFilaService';
import { listarExpedientesClinicos } from '../../services/doctorShaddaiService';
import ConsentimientoInformadoImprimible from '../../components/doctores/ConsentimientoInformadoImprimible';
import HojaReferenciaContrarreferenciaImprimible from '../../components/doctores/HojaReferenciaContrarreferenciaImprimible';
import HojaViolenciaLesionImprimible from '../../components/doctores/HojaViolenciaLesionImprimible';
import NotaMedicaImprimible from '../../components/doctores/NotaMedicaImprimible';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import CertificadoMedicoImprimible from '../../components/doctores/CertificadoMedicoImprimible';


const estadoStyles = {
  EN_ESPERA: {
    label: 'En espera',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  EN_ATENCION: {
    label: 'En atención',
    className: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  ATENDIDO: {
    label: 'Atendido',
    className: 'bg-green-100 text-green-800 border-green-200',
  },
  CANCELADO: {
    label: 'Cancelado',
    className: 'bg-red-100 text-red-800 border-red-200',
  },
  NO_ASISTIO: {
    label: 'No asistió',
    className: 'bg-gray-100 text-gray-800 border-gray-200',
  },
};

const tipoAtencionStyles = {
  CONSULTA_MEDICA: {
    label: 'Consulta médica',
    className: 'bg-sky-100 text-sky-700 border-sky-200',
    accion: 'Nota médica obligatoria',
  },
  SERVICIO_RAPIDO: {
    label: 'Servicio rápido',
    className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    accion: 'Registrar servicio',
  },
  SOLO_RECETA: {
    label: 'Solo receta',
    className: 'bg-purple-100 text-purple-700 border-purple-200',
    accion: 'Generar receta',
  },
  LABORATORIO: {
    label: 'Laboratorio',
    className: 'bg-orange-100 text-orange-700 border-orange-200',
    accion: 'Solicitud de laboratorio',
  },
};

const tipoDocumentoStyles = {
  NOTA_MEDICA: {
    label: 'Nota médica',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  NOTA_EVOLUCION: {
    label: 'Nota de evolución',
    className: 'bg-teal-50 text-teal-700 border-teal-200',
  },
  SERVICIO_RAPIDO: {
    label: 'Servicio rápido',
    className: 'bg-lime-50 text-lime-700 border-lime-200',
  },
  SERVICIO_CLINICO: {
    label: 'Servicio clínico',
    className: 'bg-sky-50 text-sky-700 border-sky-200',
  },
  RECETA: {
    label: 'Receta médica',
    className: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  LABORATORIO: {
    label: 'Solicitud de laboratorio',
    className: 'bg-orange-50 text-orange-700 border-orange-200',
  },
  CONSENTIMIENTO: {
    label: 'Consentimiento informado',
    className: 'bg-sky-50 text-sky-700 border-sky-200',
  },
  REFERENCIA: {
    label: 'Referencia / contrarreferencia',
    className: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  VIOLENCIA_LESION: {
    label: 'Violencia / lesión',
    className: 'bg-red-50 text-red-700 border-red-200',
  },
  CERTIFICADO_MEDICO: {
    label: 'Certificado médico',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
};

const obtenerTipoAtencion = (paciente) => {
  return (
    tipoAtencionStyles[paciente?.tipo_atencion] || {
      label: 'Sin tipo',
      className: 'bg-slate-100 text-slate-600 border-slate-200',
      accion: 'Definir atención',
    }
  );
};

const formatearFechaHora = (fecha) => {
  if (!fecha) return 'Sin fecha';

  return new Date(fecha).toLocaleString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const calcularTiempoEspera = (fecha) => {
  if (!fecha) return 'Sin registro';

  const inicio = new Date(fecha).getTime();
  const ahora = Date.now();
  const diferencia = Math.max(0, ahora - inicio);

  const minutos = Math.floor(diferencia / 60000);
  const horas = Math.floor(minutos / 60);

  if (minutos < 1) return 'Hace unos segundos';
  if (minutos < 60) return `${minutos} min`;
  return `${horas} h ${minutos % 60} min`;
};

const calcularDuracionAtencion = (fechaInicio) => {
  if (!fechaInicio) return 'Sin iniciar';

  const inicio = new Date(fechaInicio).getTime();
  const ahora = Date.now();
  const diferencia = Math.max(0, ahora - inicio);

  const minutos = Math.floor(diferencia / 60000);
  const horas = Math.floor(minutos / 60);

  if (minutos < 1) return 'Menos de 1 min';
  if (minutos < 60) return `${minutos} min`;
  return `${horas} h ${minutos % 60} min`;
};

const obtenerIdsSucursalesUsuario = (usuario) => {
  if (!usuario) return [];

  const ids = [];

  if (usuario.id_sucursal) ids.push(usuario.id_sucursal);
  if (usuario.sucursal_id) ids.push(usuario.sucursal_id);
  if (usuario.sucursal?.id_sucursal) ids.push(usuario.sucursal.id_sucursal);
  if (usuario.sucursal?.id) ids.push(usuario.sucursal.id);

  const sucursalesAsignadas =
    usuario.sucursales_asignadas ||
    usuario.sucursalesAsignadas ||
    usuario.sucursales ||
    usuario.sucursales_ids ||
    [];

  if (Array.isArray(sucursalesAsignadas)) {
    sucursalesAsignadas.forEach((sucursal) => {
      if (typeof sucursal === 'number' || typeof sucursal === 'string') {
        ids.push(sucursal);
        return;
      }

      if (sucursal?.id_sucursal) ids.push(sucursal.id_sucursal);
      if (sucursal?.id) ids.push(sucursal.id);
      if (sucursal?.sucursal_id) ids.push(sucursal.sucursal_id);
    });
  }

  return [...new Set(ids.map((id) => Number(id)).filter(Boolean))];
};

const filtrarPorSucursalesDoctor = (
  lista,
  esSuperAdmin,
  idsSucursalesDoctor
) => {
  if (!Array.isArray(lista)) return [];

  if (esSuperAdmin) return lista;

  if (!idsSucursalesDoctor.length) return [];

  return lista.filter((item) => {
    const idSucursalItem =
      item.id_sucursal ||
      item.sucursal_id ||
      item.sucursal?.id_sucursal ||
      item.sucursal?.id;

    return idsSucursalesDoctor.includes(Number(idSucursalItem));
  });
};

const obtenerNombreExpediente = (expediente) => {
  const partes = [
    expediente?.nombre_paciente,
    expediente?.primer_apellido,
    expediente?.segundo_apellido,
  ].filter(Boolean);

  return partes.length ? partes.join(' ') : 'Paciente sin nombre';
};

const escapeHtml = (valor) => {
  if (valor === undefined || valor === null) return '';

  return String(valor)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
};

const normalizarMetadata = (metadata) => {
  if (!metadata) return {};

  if (typeof metadata === 'string') {
    try {
      return JSON.parse(metadata);
    } catch {
      return {};
    }
  }

  return metadata;
};

const valorDocumento = (...valores) => {
  const encontrado = valores.find((valor) => {
    if (valor === undefined || valor === null) return false;
    if (typeof valor === 'string' && valor.trim() === '') return false;
    return true;
  });

  return encontrado ?? 'N/A';
};

const primerTexto = (...valores) => {
  const encontrado = valores.find((valor) => {
    if (valor === undefined || valor === null) return false;
    return String(valor).trim() !== '';
  });

  return encontrado ? String(encontrado).trim() : '';
};

const formatearFechaCorta = (fecha) => {
  if (!fecha) return new Date().toLocaleDateString('es-MX');

  return new Date(fecha).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const DoctorFilaEspera = () => {
  const { usuario } = useAuth();
  const navigate = useNavigate();

  const [filaOriginal, setFilaOriginal] = useState([]);
  const [historicoOriginal, setHistoricoOriginal] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(false);
  const [tab, setTab] = useState('fila');

  const [modalExpedienteAbierto, setModalExpedienteAbierto] = useState(false);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null);
  const [busquedaExpediente, setBusquedaExpediente] = useState('');
  const [expedientes, setExpedientes] = useState([]);
  const [cargandoExpedientes, setCargandoExpedientes] = useState(false);
  const [vinculandoExpediente, setVinculandoExpediente] = useState(false);

  const [modalDocumentosAbierto, setModalDocumentosAbierto] = useState(false);
  const [pacienteDocumentos, setPacienteDocumentos] = useState(null);
  const [documentosAtencion, setDocumentosAtencion] = useState([]);
  const [cargandoDocumentos, setCargandoDocumentos] = useState(false);
  const [documentoSeleccionado, setDocumentoSeleccionado] = useState(null);

  const rolUsuario = usuario?.rol || usuario?.nombre_rol || '';
  const esSuperAdmin = rolUsuario === 'SUPER_ADMIN';

  const idsSucursalesDoctor = useMemo(() => {
    return obtenerIdsSucursalesUsuario(usuario);
  }, [usuario]);

  const fila = useMemo(() => {
    return filtrarPorSucursalesDoctor(
      filaOriginal,
      esSuperAdmin,
      idsSucursalesDoctor
    );
  }, [filaOriginal, esSuperAdmin, idsSucursalesDoctor]);

  const historico = useMemo(() => {
    return filtrarPorSucursalesDoctor(
      historicoOriginal,
      esSuperAdmin,
      idsSucursalesDoctor
    );
  }, [historicoOriginal, esSuperAdmin, idsSucursalesDoctor]);

  const cargarDatos = async () => {
    try {
      setCargando(true);

      const [filaResp, historicoResp] = await Promise.all([
        doctorFilaService.listarFilaEspera(),
        doctorFilaService.listarHistoricoFila(),
      ]);

      setFilaOriginal(filaResp.ok ? filaResp.fila || [] : []);
      setHistoricoOriginal(
        historicoResp.ok ? historicoResp.historico || [] : []
      );
    } catch (error) {
      console.error('Error al cargar datos de fila:', error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudo cargar la fila de espera.',
      });
    } finally {
      setCargando(false);
    }
  };

  const cargarExpedientes = async (textoBusqueda = '') => {
    try {
      setCargandoExpedientes(true);

      const data = await listarExpedientesClinicos(textoBusqueda);

      setExpedientes(data.expedientes || []);
    } catch (error) {
      console.error('Error al buscar expedientes:', error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudieron cargar los expedientes clínicos.',
      });
    } finally {
      setCargandoExpedientes(false);
    }
  };

  useEffect(() => {
    cargarDatos();

    const intervalo = setInterval(() => {
      cargarDatos();
    }, 10000);

    return () => clearInterval(intervalo);
  }, []);

  useEffect(() => {
    if (!modalExpedienteAbierto) return;

    const temporizador = setTimeout(() => {
      cargarExpedientes(busquedaExpediente.trim());
    }, 400);

    return () => clearTimeout(temporizador);
  }, [busquedaExpediente, modalExpedienteAbierto]);

  const abrirModalExpediente = (paciente) => {
    setPacienteSeleccionado(paciente);
    setBusquedaExpediente(paciente.nombre_paciente || '');
    setModalExpedienteAbierto(true);
    cargarExpedientes(paciente.nombre_paciente || '');
  };

  const cerrarModalExpediente = () => {
    if (vinculandoExpediente) return;

    setModalExpedienteAbierto(false);
    setPacienteSeleccionado(null);
    setBusquedaExpediente('');
    setExpedientes([]);
  };

  const obtenerRutaAtencion = ({
    idExpediente,
    idFila,
    tipoAtencion = 'CONSULTA_MEDICA',
  }) => {
    return `/app/doctor-shaddai/recetas?id_expediente=${idExpediente}&id_fila=${idFila}&tipo_atencion=${tipoAtencion}`;
  };

  const vincularExpediente = async (expediente) => {
    if (!pacienteSeleccionado) return;

    const tipoAtencion = pacienteSeleccionado.tipo_atencion || 'CONSULTA_MEDICA';
    const tipoInfo = obtenerTipoAtencion(pacienteSeleccionado);

    const result = await Swal.fire({
      icon: 'question',
      title: 'Vincular expediente',
      html: `
        <div style="text-align:left; font-size:14px; line-height:1.6;">
          <p>Se vinculará:</p>
          <p><strong>Paciente en fila:</strong> ${pacienteSeleccionado.nombre_paciente}</p>
          <p><strong>Tipo de atención:</strong> ${tipoInfo.label}</p>
          <p><strong>Acción sugerida:</strong> ${tipoInfo.accion}</p>
          <p><strong>Expediente:</strong> ${obtenerNombreExpediente(expediente)}</p>
          <p><strong>CURP:</strong> ${expediente.curp || 'Sin CURP'}</p>
          <hr style="margin:10px 0;" />
          <p>Después se abrirá la pantalla de atención con el expediente cargado.</p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Sí, vincular e iniciar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#0284c7',
    });

    if (!result.isConfirmed) return;

    try {
      setVinculandoExpediente(true);

      const data = await doctorFilaService.vincularExpediente(
        pacienteSeleccionado.id_fila,
        expediente.id_expediente
      );

      if (!data.ok) {
        throw new Error(data.mensaje || 'No se pudo vincular el expediente.');
      }

      await Swal.fire({
        icon: 'success',
        title: 'Expediente vinculado',
        text: 'Se abrirá la vista para iniciar la atención.',
        timer: 1300,
        showConfirmButton: false,
      });

      const idFila = pacienteSeleccionado.id_fila;
      const idExpediente = expediente.id_expediente;

      cerrarModalExpediente();

      navigate(
        obtenerRutaAtencion({
          idExpediente,
          idFila,
          tipoAtencion,
        })
      );
    } catch (error) {
      console.error('Error al vincular expediente:', error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          error.message ||
          'No se pudo vincular el expediente.',
      });
    } finally {
      setVinculandoExpediente(false);
    }
  };

  const atenderPaciente = async (paciente) => {
    const tipoInfo = obtenerTipoAtencion(paciente);

    const result = await Swal.fire({
      icon: 'question',
      title: 'Iniciar atención',
      html: `
        <div style="text-align:left; font-size:14px; line-height:1.6;">
          <p>¿Deseas iniciar la atención de:</p>
          <p><strong>${paciente.nombre_paciente}</strong></p>
          <p><strong>Tipo de atención:</strong> ${tipoInfo.label}</p>
          <p><strong>Acción sugerida:</strong> ${tipoInfo.accion}</p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Sí, atender',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#0284c7',
    });

    if (!result.isConfirmed) return;

    try {
      const data = await doctorFilaService.atenderPaciente(paciente.id_fila);

      if (!data.ok) {
        throw new Error(data.mensaje || 'No se pudo iniciar la atención.');
      }

      Swal.fire({
        icon: 'success',
        title: 'Atención iniciada',
        text: 'Ahora puedes buscar o crear el expediente del paciente.',
        timer: 1800,
        showConfirmButton: false,
      });

      const pacienteActualizado = data.fila || {
        ...paciente,
        estatus: 'EN_ATENCION',
        fecha_inicio_atencion: new Date().toISOString(),
      };

      await cargarDatos();
      abrirModalExpediente(pacienteActualizado);
    } catch (error) {
      console.error('Error al atender paciente:', error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          error.message ||
          'No se pudo iniciar la atención.',
      });
    }
  };

  const finalizarPaciente = async (paciente) => {
    if (!paciente.id_expediente) {
      const continuar = await Swal.fire({
        icon: 'warning',
        title: 'Paciente sin expediente vinculado',
        text:
          'Lo recomendable es vincular o crear expediente antes de finalizar la atención. ¿Deseas finalizar de todos modos?',
        showCancelButton: true,
        confirmButtonText: 'Finalizar de todos modos',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#16a34a',
      });

      if (!continuar.isConfirmed) return;
    }

    const result = await Swal.fire({
      icon: 'success',
      title: 'Finalizar atención',
      html: `
        <p style="margin-bottom:8px;">¿Deseas marcar como atendido a:</p>
        <strong>${paciente.nombre_paciente}</strong>
      `,
      showCancelButton: true,
      confirmButtonText: 'Sí, finalizar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#16a34a',
    });

    if (!result.isConfirmed) return;

    try {
      const data = await doctorFilaService.finalizarPaciente(paciente.id_fila);

      if (!data.ok) {
        throw new Error(data.mensaje || 'No se pudo finalizar la atención.');
      }

      Swal.fire({
        icon: 'success',
        title: 'Atención finalizada',
        timer: 1600,
        showConfirmButton: false,
      });

      cargarDatos();
    } catch (error) {
      console.error('Error al finalizar paciente:', error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          error.message ||
          'No se pudo finalizar la atención.',
      });
    }
  };

  const marcarNoAsistio = async (paciente) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Marcar como no asistió',
      html: `
        <p style="margin-bottom:8px;">¿Deseas marcar como no asistió a:</p>
        <strong>${paciente.nombre_paciente}</strong>
      `,
      showCancelButton: true,
      confirmButtonText: 'Sí, marcar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#6b7280',
    });

    if (!result.isConfirmed) return;

    try {
      const data = await doctorFilaService.marcarNoAsistio(paciente.id_fila);

      if (!data.ok) {
        throw new Error(data.mensaje || 'No se pudo actualizar el registro.');
      }

      Swal.fire({
        icon: 'success',
        title: 'Registro actualizado',
        timer: 1500,
        showConfirmButton: false,
      });

      cargarDatos();
    } catch (error) {
      console.error('Error al marcar no asistió:', error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          error.message ||
          'No se pudo marcar como no asistió.',
      });
    }
  };

  const cancelarPaciente = async (paciente) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Cancelar atención',
      html: `
        <p style="margin-bottom:8px;">¿Deseas cancelar el registro de:</p>
        <strong>${paciente.nombre_paciente}</strong>
      `,
      input: 'textarea',
      inputPlaceholder: 'Motivo de cancelación opcional...',
      showCancelButton: true,
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'No',
      confirmButtonColor: '#dc2626',
    });

    if (!result.isConfirmed) return;

    try {
      const data = await doctorFilaService.cancelarPaciente(
        paciente.id_fila,
        result.value || ''
      );

      if (!data.ok) {
        throw new Error(data.mensaje || 'No se pudo cancelar el registro.');
      }

      Swal.fire({
        icon: 'success',
        title: 'Registro cancelado',
        timer: 1500,
        showConfirmButton: false,
      });

      cargarDatos();
    } catch (error) {
      console.error('Error al cancelar paciente:', error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          error.message ||
          'No se pudo cancelar el registro.',
      });
    }
  };
  const crearNuevoExpediente = async (paciente) => {
    const result = await Swal.fire({
      icon: 'info',
      title: 'Crear expediente',
      html: `
      <div style="text-align:left; font-size:14px; line-height:1.6;">
        <p>Se abrirá el módulo de expedientes clínicos para crear el expediente del paciente.</p>
        <p><strong>Paciente:</strong> ${paciente.nombre_paciente}</p>
        <p><strong>Teléfono:</strong> ${paciente.telefono || 'Sin teléfono'}</p>
        <hr style="margin:10px 0;" />
        <p>Después de crear el expediente, regresa a esta pantalla y presiona <strong>Vincular expediente</strong>.</p>
      </div>
    `,
      showCancelButton: true,
      confirmButtonText: 'Ir a expedientes',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#0284c7',
      cancelButtonColor: '#64748b',
    });

    if (!result.isConfirmed) return;

    navigate('/app/doctor-shaddai/expedientes');
  };

  const crearNotaMedica = (paciente) => {
    if (!paciente.id_expediente) {
      Swal.fire({
        icon: 'warning',
        title: 'Primero vincula un expediente',
        text:
          'Para crear una nota médica, primero debes vincular o crear el expediente clínico del paciente.',
      });
      return;
    }

    navigate(
      obtenerRutaAtencion({
        idExpediente: paciente.id_expediente,
        idFila: paciente.id_fila,
        tipoAtencion: 'CONSULTA_MEDICA',
      })
    );
  };

  const registrarServicioRapido = (paciente) => {
    if (!paciente.id_expediente) {
      Swal.fire({
        icon: 'warning',
        title: 'Primero vincula un expediente',
        text:
          'Para registrar un servicio, primero debes vincular o crear el expediente clínico del paciente.',
      });
      return;
    }

    navigate(
      obtenerRutaAtencion({
        idExpediente: paciente.id_expediente,
        idFila: paciente.id_fila,
        tipoAtencion: 'SERVICIO_RAPIDO',
      })
    );
  };

  const generarReceta = (paciente) => {
    if (!paciente.id_expediente) {
      Swal.fire({
        icon: 'warning',
        title: 'Primero vincula un expediente',
        text:
          'Para generar receta desde la atención, primero debes vincular o crear el expediente clínico del paciente.',
      });
      return;
    }

    navigate(
      obtenerRutaAtencion({
        idExpediente: paciente.id_expediente,
        idFila: paciente.id_fila,
        tipoAtencion: paciente.tipo_atencion || 'SOLO_RECETA',
      })
    );
  };

  const generarLaboratorio = (paciente) => {
    if (!paciente.id_expediente) {
      Swal.fire({
        icon: 'warning',
        title: 'Primero vincula un expediente',
        text:
          'Para generar una solicitud de laboratorio, primero debes vincular o crear el expediente clínico del paciente.',
      });
      return;
    }

    navigate(
      obtenerRutaAtencion({
        idExpediente: paciente.id_expediente,
        idFila: paciente.id_fila,
        tipoAtencion: 'LABORATORIO',
      })
    );
  };


  const obtenerEtiquetaDocumento = (tipo) => {
    return tipoDocumentoStyles[tipo]?.label || tipo || 'Documento clínico';
  };

  const normalizarDocumentoClinico = (item = {}) => {
    const tipo = item.tipo_documento || item.tipo;

    return {
      tipo,
      titulo:
        item.titulo ||
        obtenerEtiquetaDocumento(tipo),
      fecha:
        item.fecha_documento ||
        item.fecha_creacion ||
        item.fecha_actualizacion,
      id:
        item.id_origen ||
        item.id_documento,
      id_documento: item.id_documento,
      id_origen: item.id_origen,
      folio: item.folio,
      estatus: item.estatus,
      tabla_origen: item.tabla_origen,
      ruta_frontend: item.ruta_frontend,
      metadata: normalizarMetadata(item.metadata),
      data: item,
    };
  };

  const cerrarModalDocumentos = () => {
    setModalDocumentosAbierto(false);
    setPacienteDocumentos(null);
    setDocumentosAtencion([]);
    setDocumentoSeleccionado(null);
  };

  const mapearConsentimientoParaImpresion = (doc = {}) => {
    const metadata = normalizarMetadata(doc.metadata);
    const data = doc.data || doc || {};

    return {
      fecha:
        data.fecha_consentimiento ||
        metadata.fecha_consentimiento ||
        data.fecha ||
        metadata.fecha ||
        data.fecha_documento ||
        metadata.fecha_documento ||
        data.fecha_creacion ||
        metadata.fecha_creacion ||
        doc.fecha ||
        '',

      hora:
        data.hora_consentimiento ||
        metadata.hora_consentimiento ||
        data.hora ||
        metadata.hora ||
        '',

      nombre_responsable:
        data.nombre_responsable ||
        metadata.nombre_responsable ||
        data.responsable_nombre ||
        metadata.responsable_nombre ||
        data.nombre_paciente ||
        metadata.nombre_paciente ||
        pacienteDocumentos?.nombre_paciente ||
        '',

      domicilio:
        data.domicilio_responsable ||
        metadata.domicilio_responsable ||
        data.domicilio ||
        metadata.domicilio ||
        data.direccion ||
        metadata.direccion ||
        pacienteDocumentos?.domicilio ||
        pacienteDocumentos?.direccion ||
        '',

      municipio:
        data.municipio ||
        metadata.municipio ||
        pacienteDocumentos?.municipio ||
        '',

      caracter:
        data.parentesco_responsable ||
        metadata.parentesco_responsable ||
        data.caracter ||
        metadata.caracter ||
        'Paciente',

      padecimiento:
        data.motivo_consentimiento ||
        metadata.motivo_consentimiento ||
        data.padecimiento ||
        metadata.padecimiento ||
        data.diagnostico ||
        metadata.diagnostico ||
        data.descripcion ||
        metadata.descripcion ||
        '',

      diagnostico:
        data.diagnostico ||
        metadata.diagnostico ||
        data.diagnosticos ||
        metadata.diagnosticos ||
        '',

      tratamiento:
        data.procedimiento_tratamiento ||
        metadata.procedimiento_tratamiento ||
        data.tratamiento ||
        metadata.tratamiento ||
        data.tratamientos ||
        metadata.tratamientos ||
        '',

      riesgos:
        data.riesgos_frecuentes ||
        metadata.riesgos_frecuentes ||
        data.riesgos ||
        metadata.riesgos ||
        'Alergia, reacción adversa, falta de respuesta al tratamiento, complicaciones propias del padecimiento o procedimiento.',

      beneficios:
        data.beneficios ||
        metadata.beneficios ||
        '',

      alternativas:
        data.alternativas ||
        metadata.alternativas ||
        '',

      observaciones:
        data.observaciones ||
        metadata.observaciones ||
        '',

      nombre_testigo:
        data.nombre_testigo ||
        metadata.nombre_testigo ||
        '',

      parentesco_testigo:
        data.parentesco_testigo ||
        metadata.parentesco_testigo ||
        '',

      id_consentimiento:
        data.id_consentimiento ||
        metadata.id_consentimiento ||
        doc.id_origen ||
        doc.id ||
        null,
    };
  };

  const normalizarJsonArray = (valor) => {
    if (Array.isArray(valor)) return valor;

    if (!valor) return [];

    if (typeof valor === 'string') {
      try {
        const parsed = JSON.parse(valor);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }

    return [];
  };

  const mapearViolenciaParaImpresion = (doc = {}) => {
    const metadata = normalizarMetadata(doc.metadata);
    const data = doc.data || {};

    const fuente = {
      ...data,
      ...metadata,
    };

    return {
      ...fuente,

      id_violencia_lesion:
        fuente.id_violencia_lesion ||
        doc.id_origen ||
        doc.id ||
        doc.id_documento,

      folio:
        fuente.folio ||
        doc.folio ||
        `VL-${doc.id_origen || doc.id || 'S/F'}`,

      id_expediente:
        fuente.id_expediente ||
        pacienteDocumentos?.id_expediente,

      fecha_atencion:
        fuente.fecha_atencion ||
        fuente.fecha_documento ||
        doc.fecha,

      hora_atencion:
        fuente.hora_atencion ||
        '',

      nombre_paciente:
        fuente.nombre_paciente ||
        pacienteDocumentos?.nombre_paciente ||
        '',

      primer_apellido:
        fuente.primer_apellido ||
        pacienteDocumentos?.primer_apellido ||
        '',

      segundo_apellido:
        fuente.segundo_apellido ||
        pacienteDocumentos?.segundo_apellido ||
        '',

      curp:
        fuente.curp ||
        pacienteDocumentos?.curp ||
        '',

      edad_anios:
        fuente.edad_anios ||
        fuente.edad ||
        pacienteDocumentos?.edad ||
        '',

      sexo:
        fuente.sexo ||
        pacienteDocumentos?.sexo ||
        '',

      fecha_nacimiento:
        fuente.fecha_nacimiento ||
        pacienteDocumentos?.fecha_nacimiento ||
        '',

      telefono:
        fuente.telefono ||
        pacienteDocumentos?.telefono ||
        '',

      domicilio:
        fuente.domicilio ||
        pacienteDocumentos?.direccion ||
        pacienteDocumentos?.domicilio ||
        '',

      entidad:
        fuente.entidad ||
        pacienteDocumentos?.entidad ||
        pacienteDocumentos?.entidad_nacimiento ||
        '',

      municipio:
        fuente.municipio ||
        pacienteDocumentos?.municipio ||
        '',

      localidad:
        fuente.localidad ||
        pacienteDocumentos?.localidad ||
        '',

      responsable_nombre:
        fuente.responsable_nombre ||
        fuente.medico_responsable ||
        pacienteDocumentos?.doctor_nombre ||
        'Doctor Shaddai',

      responsable_cedula:
        fuente.responsable_cedula ||
        fuente.cedula_profesional ||
        pacienteDocumentos?.cedula_profesional ||
        'N/A',

      agentes_lesion: normalizarJsonArray(fuente.agentes_lesion),
      areas_anatomicas: normalizarJsonArray(fuente.areas_anatomicas),
      consecuencias: normalizarJsonArray(fuente.consecuencias),
    };
  };

  const mapearNotaMedicaParaImpresion = (doc = {}) => {
    const metadata = normalizarMetadata(doc.metadata);
    const data = doc.data || {};

    const tipoNota =
      doc.tipo === 'NOTA_EVOLUCION'
        ? 'NOTA_EVOLUCION'
        : 'NOTA_INICIAL';

    return {
      id_nota: doc.id_origen || doc.id || doc.id_documento,
      id_expediente:
        data.id_expediente ||
        pacienteDocumentos?.id_expediente ||
        metadata.id_expediente,
      id_fila:
        data.id_fila ||
        pacienteDocumentos?.id_fila ||
        metadata.id_fila,
      tipo_nota: tipoNota,
      fecha_nota:
        data.fecha_nota ||
        data.fecha_creacion ||
        doc.fecha ||
        metadata.fecha_nota ||
        metadata.fecha_creacion,
      nombre_paciente:
        metadata.nombre_paciente ||
        data.nombre_paciente ||
        pacienteDocumentos?.nombre_paciente,
      primer_apellido:
        metadata.primer_apellido ||
        data.primer_apellido ||
        pacienteDocumentos?.primer_apellido,
      segundo_apellido:
        metadata.segundo_apellido ||
        data.segundo_apellido ||
        pacienteDocumentos?.segundo_apellido,
      curp:
        metadata.curp ||
        data.curp ||
        pacienteDocumentos?.curp,
      edad:
        metadata.edad ||
        metadata.edad_paciente ||
        data.edad ||
        pacienteDocumentos?.edad,
      sexo:
        metadata.sexo ||
        metadata.sexo_paciente ||
        data.sexo ||
        pacienteDocumentos?.sexo,
      telefono:
        metadata.telefono ||
        metadata.telefono_paciente ||
        data.telefono ||
        pacienteDocumentos?.telefono,
      fecha_nacimiento:
        metadata.fecha_nacimiento ||
        data.fecha_nacimiento ||
        pacienteDocumentos?.fecha_nacimiento,
      peso_kg: metadata.peso_kg || data.peso_kg,
      talla_cm: metadata.talla_cm || data.talla_cm,
      imc: metadata.imc || data.imc,
      presion_arterial:
        metadata.presion_arterial ||
        data.presion_arterial,
      frecuencia_cardiaca:
        metadata.frecuencia_cardiaca ||
        data.frecuencia_cardiaca,
      temperatura:
        metadata.temperatura ||
        data.temperatura,
      saturacion_oxigeno:
        metadata.saturacion_oxigeno ||
        data.saturacion_oxigeno,
      motivo_consulta:
        metadata.motivo_consulta ||
        data.motivo_consulta ||
        data.descripcion,
      diagnostico:
        metadata.diagnostico ||
        data.diagnostico,
      antecedentes_padecimiento_actual:
        metadata.antecedentes_padecimiento_actual ||
        metadata.padecimiento_actual ||
        data.antecedentes_padecimiento_actual ||
        data.padecimiento_actual,
      exploracion_fisica:
        metadata.exploracion_fisica ||
        data.exploracion_fisica,
      plan:
        metadata.plan ||
        metadata.plan_tratamiento ||
        data.plan ||
        data.plan_tratamiento,
      pronostico:
        metadata.pronostico ||
        data.pronostico,
      pasa_a:
        metadata.pasa_a ||
        data.pasa_a,
      observaciones:
        metadata.observaciones ||
        data.observaciones,
      doctor_nombre_completo:
        metadata.doctor_nombre_completo ||
        metadata.medico_responsable ||
        metadata.responsable_nombre ||
        data.doctor_nombre_completo ||
        pacienteDocumentos?.doctor_nombre,
      cedula_profesional:
        metadata.cedula_profesional ||
        metadata.responsable_cedula ||
        data.cedula_profesional ||
        pacienteDocumentos?.cedula_profesional,
      especialidad:
        metadata.especialidad ||
        data.especialidad ||
        pacienteDocumentos?.doctor_especialidad,
    };
  };


  const mapearRecetaParaImpresion = ({
    doc = {},
    receta = {},
    detalles = [],
  }) => {
    const metadata = normalizarMetadata(doc.metadata);

    const paciente = {
      nombre_paciente: valorDocumento(
        receta.nombre_paciente,
        receta.paciente_nombre,
        metadata.nombre_paciente,
        pacienteDocumentos?.nombre_paciente
      ),
      telefono: valorDocumento(
        receta.telefono_paciente,
        receta.telefono,
        metadata.telefono_paciente,
        pacienteDocumentos?.telefono
      ),
      edad: valorDocumento(
        receta.edad_paciente,
        receta.edad,
        metadata.edad_paciente,
        pacienteDocumentos?.edad
      ),
      sexo: valorDocumento(
        receta.sexo_paciente,
        receta.sexo,
        metadata.sexo_paciente,
        pacienteDocumentos?.sexo
      ),
      diagnostico: valorDocumento(
        receta.diagnostico,
        metadata.diagnostico,
        doc.data?.descripcion
      ),
      observaciones: valorDocumento(
        receta.observaciones,
        metadata.observaciones,
        ''
      ),
    };

    const productos = (detalles || []).map((item) => {
      console.log('Detalle receta reimpresión:', item);

      const nombre = primerTexto(
        item.nombre,
        item.producto,
        item.nombre_producto,
        item.descripcion_producto,
        item.nombre_comercial,
        item.medicamento,
        'Medicamento'
      );

      const presentacion = primerTexto(
        item.presentacion,
        item.presentacion_producto,
        item.presentacion_medicamento,
        item.descripcion_presentacion,
        item.descripcion,
        item.concentracion,
        item.contenido,
        item.unidad_medida,
        item.raw?.presentacion,
        item.raw?.descripcion
      );

      const formaFarmaceutica = primerTexto(
        item.forma_farmaceutica,
        item.forma,
        item.tipo_forma,
        item.forma_producto,
        item.raw?.forma_farmaceutica,
        item.raw?.forma
      );

      return {
        id_detalle: item.id_detalle,
        id_producto: item.id_producto,
        nombre,
        nombre_generico: primerTexto(
          item.nombre_generico,
          item.generico,
          item.denominacion_generica,
          item.raw?.nombre_generico
        ),
        presentacion,
        forma_farmaceutica: formaFarmaceutica,
        cantidad:
          item.cantidad ||
          item.cantidad_recetada ||
          item.cantidad_receta ||
          1,
        dosis: item.dosis || '',
        frecuencia: item.frecuencia || '',
        duracion: item.duracion || '',
        indicaciones: item.indicaciones || '',
      };
    });

    return {
      receta: {
        ...receta,
        id_receta: receta.id_receta || doc.id_origen || doc.id,
        folio_receta: receta.folio_receta || doc.folio,
        fecha_creacion: receta.fecha_creacion || doc.fecha,
        diagnostico: paciente.diagnostico,
        observaciones: paciente.observaciones,
      },
      detalles,
      doctor: {
        nombre_completo:
          receta.nombre_doctor ||
          receta.doctor_nombre_completo ||
          receta.medico_responsable ||
          metadata.medico_responsable ||
          metadata.doctor_nombre_completo ||
          pacienteDocumentos?.doctor_nombre ||
          'Doctor Shaddai',
        cedula_profesional:
          receta.cedula_profesional ||
          metadata.cedula_profesional ||
          pacienteDocumentos?.cedula_profesional ||
          'N/A',
        especialidad:
          receta.especialidad ||
          metadata.especialidad ||
          pacienteDocumentos?.doctor_especialidad ||
          'Medicina general',
        direccion_consultorio:
          receta.direccion_consultorio ||
          metadata.direccion_consultorio ||
          pacienteDocumentos?.direccion_consultorio ||
          '',
        logo_universidad_url:
          receta.logo_universidad_url ||
          receta.logo_universidad ||
          receta.doctor_logo_universidad_url ||
          metadata.logo_universidad_url ||
          metadata.logo_universidad ||
          metadata.doctor_logo_universidad_url ||
          pacienteDocumentos?.logo_universidad_url ||
          null,
      },
      paciente,
      productos,
      expediente: {
        id_expediente:
          receta.id_paciente_expediente ||
          receta.id_expediente ||
          pacienteDocumentos?.id_expediente ||
          metadata.id_expediente ||
          'N/A',
      },
    };
  };


  const mapearLaboratorioParaImpresion = (doc = {}) => {
    const metadata = normalizarMetadata(doc.metadata);
    const data = doc.data || {};

    const estudios = Array.isArray(metadata.estudios)
      ? metadata.estudios
      : Array.isArray(data.estudios)
        ? data.estudios
        : [];

    return {
      folio:
        data.folio ||
        metadata.folio ||
        doc.folio ||
        'LAB-SIN-FOLIO',

      fecha:
        data.fecha ||
        data.fecha_creacion ||
        data.fecha_documento ||
        doc.fecha ||
        metadata.fecha ||
        metadata.fecha_creacion,

      paciente: {
        nombre:
          metadata.nombre_paciente ||
          data.nombre_paciente ||
          pacienteDocumentos?.nombre_paciente ||
          'N/A',

        expediente:
          data.id_expediente ||
          metadata.id_expediente ||
          pacienteDocumentos?.id_expediente ||
          'N/A',

        edad:
          metadata.edad ||
          metadata.edad_paciente ||
          data.edad ||
          pacienteDocumentos?.edad ||
          'N/A',

        sexo:
          metadata.sexo ||
          metadata.sexo_paciente ||
          data.sexo ||
          pacienteDocumentos?.sexo ||
          'N/A',

        telefono:
          metadata.telefono ||
          metadata.telefono_paciente ||
          data.telefono ||
          pacienteDocumentos?.telefono ||
          'N/A',
      },

      medico: {
        nombre:
          metadata.medico_responsable ||
          metadata.doctor_nombre_completo ||
          data.medico_responsable ||
          data.nombre_doctor ||
          pacienteDocumentos?.doctor_nombre ||
          'Doctor Shaddai',

        cedula:
          metadata.cedula_profesional ||
          data.cedula_profesional ||
          pacienteDocumentos?.cedula_profesional ||
          'N/A',

        especialidad:
          metadata.especialidad ||
          data.especialidad ||
          pacienteDocumentos?.doctor_especialidad ||
          'Medicina general',

        logo_universidad_url:
          metadata.logo_universidad_url ||
          metadata.logo_universidad ||
          metadata.doctor_logo_universidad_url ||
          data.logo_universidad_url ||
          data.logo_universidad ||
          data.doctor_logo_universidad_url ||
          pacienteDocumentos?.logo_universidad_url ||
          '',
      },

      diagnostico:
        metadata.diagnostico ||
        data.diagnostico ||
        data.descripcion ||
        'N/A',

      observaciones:
        metadata.observaciones ||
        data.observaciones ||
        'Sin observaciones',

      hora_obtencion_muestra:
        metadata.hora_obtencion_muestra ||
        data.hora_obtencion_muestra ||
        '',

      hora_recepcion_muestra:
        metadata.hora_recepcion_muestra ||
        data.hora_recepcion_muestra ||
        '',

      estudios: estudios.map((item) => ({
        id_estudio: item.id_estudio,
        nombre:
          item.nombre_estudio ||
          item.nombre ||
          item.estudio ||
          'Estudio',
        observaciones_estudio:
          item.observaciones_estudio ||
          item.observaciones ||
          '',
      })),
    };
  };

  const mapearReferenciaParaImpresion = (doc = {}) => {
    const metadata = normalizarMetadata(doc.metadata);
    const data = doc.data || {};

    return {
      ...metadata,
      ...data,

      id_referencia:
        data.id_referencia ||
        metadata.id_referencia ||
        doc.id_origen ||
        doc.id,

      numero_control:
        data.numero_control ||
        metadata.numero_control ||
        doc.folio ||
        `REF-${doc.id_origen || doc.id || 'S/F'}`,

      folio_aceptacion:
        data.folio_aceptacion ||
        metadata.folio_aceptacion ||
        '',

      id_expediente:
        data.id_expediente ||
        metadata.id_expediente ||
        pacienteDocumentos?.id_expediente,

      expediente:
        data.expediente ||
        metadata.expediente ||
        pacienteDocumentos?.id_expediente,

      fecha_referencia:
        data.fecha_referencia ||
        metadata.fecha_referencia ||
        data.fecha_creacion ||
        doc.fecha,

      nombre_paciente:
        data.nombre_paciente ||
        metadata.nombre_paciente ||
        pacienteDocumentos?.nombre_paciente,

      primer_apellido:
        data.primer_apellido ||
        metadata.primer_apellido ||
        pacienteDocumentos?.primer_apellido,

      segundo_apellido:
        data.segundo_apellido ||
        metadata.segundo_apellido ||
        pacienteDocumentos?.segundo_apellido,

      sexo:
        data.sexo ||
        metadata.sexo ||
        pacienteDocumentos?.sexo,

      edad:
        data.edad ||
        metadata.edad ||
        pacienteDocumentos?.edad,

      fecha_nacimiento:
        data.fecha_nacimiento ||
        metadata.fecha_nacimiento ||
        pacienteDocumentos?.fecha_nacimiento,

      telefono:
        data.telefono ||
        metadata.telefono ||
        pacienteDocumentos?.telefono,

      domicilio:
        data.domicilio ||
        metadata.domicilio ||
        pacienteDocumentos?.direccion,

      medico_refiere:
        data.medico_refiere ||
        metadata.medico_refiere ||
        data.responsable_nombre ||
        metadata.responsable_nombre ||
        pacienteDocumentos?.doctor_nombre ||
        'Doctor Shaddai',

      cedula_profesional:
        data.cedula_profesional ||
        metadata.cedula_profesional ||
        data.responsable_cedula ||
        metadata.responsable_cedula ||
        pacienteDocumentos?.cedula_profesional ||
        'N/A',

      especialidad:
        data.especialidad ||
        metadata.especialidad ||
        pacienteDocumentos?.doctor_especialidad ||
        pacienteDocumentos?.especialidad ||
        'N/A',

      unidad_refiere:
        data.unidad_refiere ||
        metadata.unidad_refiere ||
        'Farmacias Shaddai',

      hospital_refiere:
        data.hospital_refiere ||
        metadata.hospital_refiere ||
        'Farmacias Shaddai',

      unidad_destino:
        data.unidad_destino ||
        metadata.unidad_destino ||
        '',

      servicio_destino:
        data.servicio_destino ||
        metadata.servicio_destino ||
        '',

      especialidad_destino:
        data.especialidad_destino ||
        metadata.especialidad_destino ||
        '',

      diagnostico_presuncional:
        data.diagnostico_presuncional ||
        metadata.diagnostico_presuncional ||
        data.diagnostico ||
        metadata.diagnostico ||
        '',

      resumen_clinico:
        data.resumen_clinico ||
        metadata.resumen_clinico ||
        data.descripcion ||
        metadata.descripcion ||
        '',

      tratamiento:
        data.tratamiento ||
        metadata.tratamiento ||
        '',

      motivos_referencia:
        data.motivos_referencia ||
        metadata.motivos_referencia ||
        data.motivo_referencia ||
        metadata.motivo_referencia ||
        [],
    };
  };

  const mapearCertificadoParaImpresion = (doc = {}) => {
    const metadata = normalizarMetadata(doc.metadata);
    const data = doc.data || {};

    const fuente = {
      ...metadata,
      ...data,
    };

    const datosPaciente = fuente.datos_paciente || metadata.datos_paciente || {};
    const datosDoctor = fuente.datos_doctor || metadata.datos_doctor || {};

    return {
      id_certificado:
        fuente.id_certificado ||
        doc.id_origen ||
        doc.id ||
        doc.id_documento,

      folio_certificado:
        fuente.folio_certificado ||
        fuente.folio ||
        doc.folio ||
        `CERT-${doc.id_origen || doc.id || 'S/F'}`,

      tipo_certificado:
        fuente.tipo_certificado ||
        metadata.tipo_certificado ||
        'PERSONALIZADO',

      lugar_expedicion:
        fuente.lugar_expedicion ||
        metadata.lugar_expedicion ||
        'Pachuca Hidalgo',

      fecha_expedicion:
        fuente.fecha_expedicion ||
        fuente.fecha_creacion ||
        doc.fecha ||
        metadata.fecha_expedicion ||
        metadata.fecha_creacion,

      destinatario:
        fuente.destinatario ||
        metadata.destinatario ||
        'A quien corresponda',

      finalidad:
        fuente.finalidad ||
        metadata.finalidad ||
        '',

      estado_salud:
        fuente.estado_salud ||
        metadata.estado_salud ||
        'BUEN ESTADO DE SALUD ACTUAL',

      antecedentes:
        fuente.antecedentes ||
        metadata.antecedentes ||
        '',

      exploracion_fisica:
        fuente.exploracion_fisica ||
        metadata.exploracion_fisica ||
        '',

      conclusion:
        fuente.conclusion ||
        metadata.conclusion ||
        '',

      observaciones:
        fuente.observaciones ||
        metadata.observaciones ||
        '',

      texto_libre:
        fuente.texto_libre ||
        metadata.texto_libre ||
        '',

      datos_paciente: {
        nombre_paciente:
          datosPaciente.nombre_paciente ||
          fuente.nombre_paciente ||
          metadata.nombre_paciente ||
          pacienteDocumentos?.nombre_paciente ||
          '',

        edad:
          datosPaciente.edad ||
          fuente.edad ||
          metadata.edad ||
          pacienteDocumentos?.edad ||
          '',

        sexo:
          datosPaciente.sexo ||
          fuente.sexo ||
          metadata.sexo ||
          pacienteDocumentos?.sexo ||
          '',

        fecha_nacimiento:
          datosPaciente.fecha_nacimiento ||
          fuente.fecha_nacimiento ||
          metadata.fecha_nacimiento ||
          pacienteDocumentos?.fecha_nacimiento ||
          '',

        telefono:
          datosPaciente.telefono ||
          fuente.telefono ||
          metadata.telefono ||
          pacienteDocumentos?.telefono ||
          '',

        id_expediente:
          datosPaciente.id_expediente ||
          fuente.id_expediente ||
          metadata.id_expediente ||
          pacienteDocumentos?.id_expediente ||
          '',
      },

      datos_doctor: {
        nombre_completo:
          datosDoctor.nombre_completo ||
          fuente.nombre_doctor ||
          fuente.doctor_nombre_completo ||
          metadata.doctor_nombre_completo ||
          metadata.medico_responsable ||
          pacienteDocumentos?.doctor_nombre ||
          'Doctor Shaddai',

        cedula_profesional:
          datosDoctor.cedula_profesional ||
          fuente.cedula_profesional ||
          metadata.cedula_profesional ||
          pacienteDocumentos?.cedula_profesional ||
          'N/A',

        especialidad:
          datosDoctor.especialidad ||
          fuente.especialidad ||
          metadata.especialidad ||
          pacienteDocumentos?.doctor_especialidad ||
          pacienteDocumentos?.especialidad ||
          'Medicina general',

        telefono:
          datosDoctor.telefono ||
          fuente.telefono_doctor ||
          metadata.telefono_doctor ||
          '',

        correo:
          datosDoctor.correo ||
          fuente.correo_doctor ||
          metadata.correo_doctor ||
          '',

        direccion_consultorio:
          datosDoctor.direccion_consultorio ||
          fuente.direccion_consultorio ||
          metadata.direccion_consultorio ||
          '',

        logo_universidad_url:
          datosDoctor.logo_universidad_url ||
          fuente.logo_universidad_url ||
          metadata.logo_universidad_url ||
          '',
      },
    };
  };

  const abrirDocumentosAtencion = async (paciente) => {
    if (!paciente.id_expediente) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin expediente',
        text: 'Esta atención no tiene expediente vinculado.',
      });

      return;
    }

    try {
      setPacienteDocumentos(paciente);
      setModalDocumentosAbierto(true);
      setCargandoDocumentos(true);
      setDocumentoSeleccionado(null);
      setDocumentosAtencion([]);

      /*
        Ahora la vista usa la tabla central documentos_clinicos.
        El endpoint recomendado es:
        GET /api/documentos-clinicos/atencion/:id_fila

        Debe regresar:
        {
          ok: true,
          documentos: [...]
        }
      */
      const { data } = await api.get(
        `/documentos-clinicos/atencion/${paciente.id_fila}`
      );

      if (!data.ok) {
        throw new Error(data.mensaje || 'No se pudieron consultar los documentos.');
      }

      const documentos = (data.documentos || [])
        .map(normalizarDocumentoClinico)
        .sort((a, b) => {
          return new Date(b.fecha || 0).getTime() - new Date(a.fecha || 0).getTime();
        });

      setDocumentosAtencion(documentos);
      setDocumentoSeleccionado(documentos[0] || null);
    } catch (error) {
      console.error('Error al consultar documentos de atención:', error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          error.message ||
          'No se pudieron consultar los documentos de esta atención.',
      });
    } finally {
      setCargandoDocumentos(false);
    }
  };

  const imprimirNodoEnIframe = async (elementId, titulo = 'Documento clínico') => {
    const imprimible = document.getElementById(elementId);

    if (!imprimible) {
      Swal.fire({
        icon: 'error',
        title: 'Documento no disponible',
        text: 'No se encontró la vista imprimible para reimprimir.',
      });

      return;
    }

    const iframe = document.createElement('iframe');

    /*
      IMPORTANTE:
      No usar width: 0, height: 0, opacity: 0 ni visibility: hidden.
      Chrome puede imprimir el iframe en blanco si no tiene área real de render.
    */
    iframe.style.position = 'fixed';
    iframe.style.left = '-10000px';
    iframe.style.top = '0';
    iframe.style.width = '216mm';
    iframe.style.height = '279mm';
    iframe.style.border = '0';
    iframe.style.background = '#ffffff';
    iframe.style.opacity = '1';
    iframe.style.visibility = 'visible';
    iframe.style.display = 'block';
    iframe.style.pointerEvents = 'none';

    document.body.appendChild(iframe);

    const iframeWindow = iframe.contentWindow;
    const iframeDoc = iframe.contentDocument || iframeWindow.document;

    const estilos = Array.from(
      document.querySelectorAll('style, link[rel="stylesheet"]')
    )
      .map((node) => node.outerHTML)
      .join('\n');

    iframeDoc.open();
    iframeDoc.write(`
    <!doctype html>
    <html lang="es">
      <head>
        <meta charset="utf-8" />
        <title>${titulo}</title>

        ${estilos}

        <style>
          @page {
            size: letter portrait;
            margin: 6mm;
          }

          * {
            box-sizing: border-box !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            width: 216mm !important;
            min-height: 279mm !important;
            background: #ffffff !important;
            overflow: visible !important;
          }

          /*
            En el iframe solo existe el documento a imprimir.
            Por eso anulamos cualquier regla tipo:
            body * { visibility: hidden }
          */
          body,
          body * {
            visibility: visible !important;
          }

          #receta-imprimible,
          #laboratorio-imprimible,
          #nota-medica-imprimible,
          #consentimiento-informado-imprimible,
          #hoja-referencia-contrarreferencia,
          #certificado-medico-imprimible,
          #hoja-violencia-lesion-imprimible {
            position: static !important;
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            transform: none !important;
            zoom: 1 !important;
            margin: 0 auto !important;
            padding: 0 !important;
            overflow: visible !important;
            background: #ffffff !important;
          }

          #hoja-referencia-contrarreferencia {
            width: 204mm !important;
            max-width: 204mm !important;
            min-width: 204mm !important;
          }

          #hoja-referencia-contrarreferencia .rr-sheet {
            position: relative !important;
            display: block !important;
            width: 204mm !important;
            max-width: 204mm !important;
            min-width: 204mm !important;
            min-height: 267mm !important;
            margin: 0 auto !important;
            padding: 0 !important;
            border: 0 !important;
            box-shadow: none !important;
            overflow: hidden !important;
            background: #ffffff !important;
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          #hoja-referencia-contrarreferencia .rr-sheet:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }

          #hoja-referencia-contrarreferencia .rr-page-break {
            page-break-before: always !important;
            break-before: page !important;
          }

          #laboratorio-imprimible {
            width: 204mm !important;
            max-width: 204mm !important;
            min-width: 204mm !important;
            margin: 0 auto !important;
            padding: 0 !important;
            overflow: visible !important;
          }

          #laboratorio-imprimible .lab-sheet {
            width: 100% !important;
            min-height: 267mm !important;
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            page-break-after: auto !important;
            break-after: auto !important;
          }

          #laboratorio-imprimible .lab-content {
            min-height: 267mm !important;
            height: auto !important;
          }

          .no-print {
            display: none !important;
          }
        </style>
      </head>

      <body>
        ${imprimible.outerHTML}
      </body>
    </html>
  `);
    iframeDoc.close();

    const esperarImagenes = () => {
      const imagenes = Array.from(iframeDoc.images || []);

      if (!imagenes.length) {
        return Promise.resolve();
      }

      return Promise.all(
        imagenes.map((img) => {
          if (img.complete) return Promise.resolve();

          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        })
      );
    };

    try {
      await new Promise((resolve) => {
        iframeWindow.requestAnimationFrame(() => {
          iframeWindow.requestAnimationFrame(() => {
            setTimeout(resolve, 400);
          });
        });
      });

      if (iframeDoc.fonts?.ready) {
        await iframeDoc.fonts.ready;
      }

      await esperarImagenes();

      iframeWindow.focus();
      iframeWindow.print();

      const limpiar = () => {
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1000);
      };

      iframeWindow.onafterprint = limpiar;
      setTimeout(limpiar, 5000);
    } catch (error) {
      console.error('Error al imprimir documento:', error);

      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }

      Swal.fire({
        icon: 'error',
        title: 'Error de impresión',
        text: 'No se pudo abrir la ventana de impresión.',
      });
    }
  };

  const abrirHtmlImpresion = (html, titulo = 'Documento clínico') => {
    const ventana = window.open('', '_blank', 'width=920,height=720');

    if (!ventana) {
      Swal.fire({
        icon: 'warning',
        title: 'Ventana bloqueada',
        text: 'Permite ventanas emergentes para poder reimprimir el documento.',
      });

      return;
    }

    ventana.document.open();
    ventana.document.write(html);
    ventana.document.close();
    ventana.document.title = '';
  };

  const generarHtmlDocumentoClinico = ({
    titulo = 'Documento clínico',
    subtitulo = 'Área médica',
    folio = 'N/A',
    fecha = null,
    color = '#0f172a',
    paciente = {},
    medico = {},
    bloques = [],
    tabla = null,
    codigo = 'DOC-CLINICO',
  }) => {
    const bloquesHtml = bloques
      .map((bloque) => `
        <div class="banda">${escapeHtml(bloque.titulo)}</div>
        <div class="bloque">${escapeHtml(bloque.contenido || 'N/A')}</div>
      `)
      .join('');

    const tablaHtml = tabla
      ? `
        <div class="banda">${escapeHtml(tabla.titulo)}</div>
        <table>
          <thead>
            <tr>
              ${(tabla.columnas || [])
        .map((columna) => `<th>${escapeHtml(columna)}</th>`)
        .join('')}
            </tr>
          </thead>
          <tbody>
            ${(tabla.filas || [])
        .map((fila) => `
                <tr>
                  ${fila.map((celda) => `<td>${escapeHtml(celda)}</td>`).join('')}
                </tr>
              `)
        .join('') || `<tr><td colspan="${tabla.columnas?.length || 1}" class="center">Sin registros</td></tr>`}
          </tbody>
        </table>
      `
      : '';

    return `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title></title>
          <style>
            @page {
              size: letter portrait;
              margin: 10mm;
            }

            * {
              box-sizing: border-box;
            }

            body {
              margin: 0;
              font-family: Arial, Helvetica, sans-serif;
              color: #0f172a;
              font-size: 11px;
            }

            .hoja {
              width: 100%;
              border: 1.5px solid #0f172a;
              padding: 16px 18px;
            }

            .header {
              display: grid;
              grid-template-columns: 1fr 155px;
              gap: 12px;
              border-bottom: 2px solid #0f172a;
              padding-bottom: 10px;
              margin-bottom: 12px;
            }

            .clinica {
              text-align: center;
            }

            .clinica h1 {
              margin: 0;
              font-size: 18px;
              text-transform: uppercase;
              letter-spacing: 0.4px;
            }

            .clinica p {
              margin: 2px 0;
              font-size: 10px;
              color: #334155;
            }

            .folio {
              text-align: right;
              font-size: 10px;
              line-height: 1.45;
            }

            .folio .valor {
              color: ${color};
              font-size: 12px;
              font-weight: 900;
            }

            .titulo {
              text-align: center;
              font-size: 16px;
              font-weight: 900;
              margin: 8px 0 12px;
              text-transform: uppercase;
            }

            .banda {
              background: #f1f5f9;
              border: 1px solid #0f172a;
              padding: 4px 6px;
              margin-top: 9px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 0.3px;
            }

            .grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              border-left: 1px solid #cbd5e1;
              border-top: 1px solid #cbd5e1;
            }

            .campo {
              min-height: 24px;
              padding: 6px;
              border-right: 1px solid #cbd5e1;
              border-bottom: 1px solid #cbd5e1;
            }

            .campo strong {
              font-weight: 900;
            }

            .bloque {
              border: 1px solid #0f172a;
              min-height: 44px;
              padding: 8px;
              line-height: 1.35;
              white-space: pre-wrap;
            }

            table {
              width: 100%;
              border-collapse: collapse;
            }

            th {
              background: #f8fafc;
              border: 1px solid #0f172a;
              padding: 6px;
              font-size: 10px;
              text-align: left;
            }

            td {
              border: 1px solid #cbd5e1;
              padding: 6px;
              vertical-align: top;
              line-height: 1.35;
            }

            .center {
              text-align: center;
            }

            .firma {
              margin-top: 50px;
              text-align: center;
              font-size: 10px;
            }

            .linea {
              border-top: 1px solid #0f172a;
              width: 280px;
              margin: 0 auto 5px;
            }

            .footer {
              margin-top: 14px;
              border-top: 1px solid #cbd5e1;
              padding-top: 6px;
              display: flex;
              justify-content: space-between;
              font-size: 8px;
              color: #64748b;
            }
          </style>
        </head>

        <body>
          <div class="hoja">
            <div class="header">
              <div class="clinica">
                <h1>Clínica / Farmacia Shaddai</h1>
                <p>${escapeHtml(subtitulo)}</p>
                <p>${escapeHtml(titulo)}</p>
              </div>

              <div class="folio">
                <div><strong>Folio:</strong></div>
                <div class="valor">${escapeHtml(folio || 'N/A')}</div>
                <div><strong>Fecha:</strong> ${escapeHtml(formatearFechaCorta(fecha))}</div>
              </div>
            </div>

            <div class="titulo">${escapeHtml(titulo)}</div>

            <div class="banda">Datos del paciente</div>
            <div class="grid">
              <div class="campo"><strong>Paciente:</strong> ${escapeHtml(paciente.nombre || 'N/A')}</div>
              <div class="campo"><strong>Expediente:</strong> ${escapeHtml(paciente.expediente || 'N/A')}</div>
              <div class="campo"><strong>Edad:</strong> ${escapeHtml(paciente.edad || 'N/A')}</div>
              <div class="campo"><strong>Sexo:</strong> ${escapeHtml(paciente.sexo || 'N/A')}</div>
            </div>

            ${tablaHtml}
            ${bloquesHtml}

            <div class="firma">
              <div class="linea"></div>
              <strong>${escapeHtml(medico.nombre || 'Médico responsable')}</strong><br />
              Cédula profesional: ${escapeHtml(medico.cedula || 'N/A')}<br />
              Especialidad: ${escapeHtml(medico.especialidad || 'N/A')}
            </div>

            <div class="footer">
              <span>Documento clínico interno</span>
              <span>${escapeHtml(codigo)}</span>
            </div>
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 250);
            };
          </script>
        </body>
      </html>
    `;
  };

  const obtenerPacienteBaseDocumento = (doc = {}) => {
    const metadata = normalizarMetadata(doc.metadata);

    return {
      nombre: valorDocumento(
        metadata.nombre_paciente,
        doc.data?.nombre_paciente,
        pacienteDocumentos?.nombre_paciente
      ),
      expediente: valorDocumento(
        doc.data?.id_expediente,
        pacienteDocumentos?.id_expediente
      ),
      edad: valorDocumento(
        metadata.edad_paciente,
        metadata.edad,
        metadata.edad_anios,
        pacienteDocumentos?.edad
      ),
      sexo: valorDocumento(
        metadata.sexo_paciente,
        metadata.sexo,
        pacienteDocumentos?.sexo
      ),
      telefono: valorDocumento(
        metadata.telefono_paciente,
        metadata.telefono,
        pacienteDocumentos?.telefono
      ),
    };
  };

  const obtenerMedicoBaseDocumento = (doc = {}) => {
    const metadata = normalizarMetadata(doc.metadata);

    return {
      nombre: valorDocumento(
        metadata.medico_responsable,
        metadata.responsable_nombre,
        metadata.medico_refiere,
        pacienteDocumentos?.doctor_nombre
      ),
      cedula: valorDocumento(
        metadata.cedula_profesional,
        metadata.responsable_cedula,
        pacienteDocumentos?.cedula_profesional
      ),
      especialidad: valorDocumento(
        metadata.especialidad,
        pacienteDocumentos?.doctor_especialidad
      ),
    };
  };

  const renderResumenDocumento = ({
    doc,
    colorClass = 'bg-slate-50',
    titulo = 'Documento clínico',
    campos = [],
    bloques = [],
    aviso = null,
  }) => {
    const docStyle =
      tipoDocumentoStyles[doc.tipo] ||
      tipoDocumentoStyles.CONSENTIMIENTO;

    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full border px-3 py-1 text-xs font-black ${docStyle.className}`}
          >
            {obtenerEtiquetaDocumento(doc.tipo)}
          </span>

          {doc.folio && (
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-600">
              {doc.folio}
            </span>
          )}
        </div>

        <h3 className="text-xl font-black text-slate-800">{titulo}</h3>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {campos.map((campo) => (
            <div key={campo.label} className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                {campo.label}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm font-bold text-slate-800">
                {campo.valor || 'N/A'}
              </p>
            </div>
          ))}
        </div>

        {bloques.map((bloque) => (
          <div key={bloque.label} className={`mt-4 rounded-2xl p-4 ${colorClass}`}>
            <p className="text-sm font-black text-slate-800">{bloque.label}</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
              {bloque.valor || 'N/A'}
            </p>
          </div>
        ))}

        {aviso && (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            {aviso}
          </div>
        )}
      </div>
    );
  };

  const renderRecetaMedica = (doc) => {
    const metadata = normalizarMetadata(doc.metadata);

    return renderResumenDocumento({
      doc,
      colorClass: 'bg-purple-50',
      titulo: 'Receta médica',
      campos: [
        { label: 'Paciente', valor: valorDocumento(metadata.nombre_paciente, pacienteDocumentos?.nombre_paciente) },
        { label: 'Folio', valor: doc.folio || 'N/A' },
        { label: 'Teléfono', valor: valorDocumento(metadata.telefono_paciente, pacienteDocumentos?.telefono) },
        { label: 'Edad / sexo', valor: `${valorDocumento(metadata.edad_paciente, pacienteDocumentos?.edad)} · ${valorDocumento(metadata.sexo_paciente, pacienteDocumentos?.sexo)}` },
        { label: 'Total productos', valor: metadata.total_productos ?? 0 },
        { label: 'Total piezas', valor: metadata.total_piezas ?? 0 },
      ],
      bloques: [
        { label: 'Diagnóstico', valor: valorDocumento(metadata.diagnostico, doc.data?.descripcion, 'Sin diagnóstico registrado') },
        { label: 'Observaciones', valor: valorDocumento(metadata.observaciones, 'Sin observaciones') },
      ],
      aviso:
        'Para ver los medicamentos e imprimir la receta completa, usa el botón Reimprimir. Se consultará la receta original y sus detalles.',
    });
  };

  const renderLaboratorio = (doc) => {
    const metadata = normalizarMetadata(doc.metadata);
    const estudios = Array.isArray(metadata.estudios) ? metadata.estudios : [];

    return renderResumenDocumento({
      doc,
      colorClass: 'bg-orange-50',
      titulo: 'Solicitud de laboratorio',
      campos: [
        { label: 'Paciente', valor: valorDocumento(metadata.nombre_paciente, pacienteDocumentos?.nombre_paciente) },
        { label: 'Folio', valor: doc.folio || 'N/A' },
        { label: 'Teléfono', valor: valorDocumento(metadata.telefono, pacienteDocumentos?.telefono) },
        { label: 'Edad / sexo', valor: `${valorDocumento(metadata.edad, pacienteDocumentos?.edad)} · ${valorDocumento(metadata.sexo, pacienteDocumentos?.sexo)}` },
        { label: 'Total estudios', valor: metadata.total_estudios ?? estudios.length },
        { label: 'Muestra', valor: `Obtención: ${metadata.hora_obtencion_muestra || 'N/A'} · Recepción: ${metadata.hora_recepcion_muestra || 'N/A'}` },
      ],
      bloques: [
        { label: 'Diagnóstico', valor: valorDocumento(metadata.diagnostico, doc.data?.descripcion) },
        {
          label: 'Estudios solicitados',
          valor:
            estudios
              .map((item, index) => {
                const obs = item.observaciones_estudio
                  ? ` (${item.observaciones_estudio})`
                  : '';
                return `${index + 1}. ${item.nombre_estudio || item.nombre || 'Estudio'}${obs}`;
              })
              .join('\\n') || 'Sin estudios registrados',
        },
        { label: 'Observaciones', valor: valorDocumento(metadata.observaciones, 'Sin observaciones') },
      ],
      aviso: 'Al reimprimir se generará la solicitud con el formato clínico del laboratorio.',
    });
  };

  const renderNotaMedica = (doc) => {
    const metadata = normalizarMetadata(doc.metadata);

    return renderResumenDocumento({
      doc,
      colorClass: 'bg-emerald-50',
      titulo: obtenerEtiquetaDocumento(doc.tipo),
      campos: [
        { label: 'Paciente', valor: valorDocumento(metadata.nombre_paciente, pacienteDocumentos?.nombre_paciente) },
        { label: 'Folio', valor: doc.folio || 'N/A' },
        { label: 'Peso / talla', valor: `${valorDocumento(metadata.peso_kg)} kg · ${valorDocumento(metadata.talla_cm)} cm` },
        { label: 'IMC', valor: valorDocumento(metadata.imc) },
        { label: 'Presión arterial', valor: valorDocumento(metadata.presion_arterial) },
        { label: 'Temperatura', valor: valorDocumento(metadata.temperatura) },
      ],
      bloques: [
        { label: 'Motivo de consulta', valor: valorDocumento(metadata.motivo_consulta, doc.data?.descripcion) },
        { label: 'Diagnóstico', valor: valorDocumento(metadata.diagnostico, 'Sin diagnóstico registrado') },
        { label: 'Pronóstico', valor: valorDocumento(metadata.pronostico) },
        { label: 'Plan / pasa a', valor: valorDocumento(metadata.pasa_a, metadata.plan_tratamiento) },
      ],
      aviso: 'Al reimprimir se generará una hoja resumida de la nota médica con la información almacenada.',
    });
  };

  const generarHtmlRecetaMedicaShaddai = ({
    recetaGenerada,
    fechaActual = formatearFechaCorta(new Date()),
  }) => {
    const paciente = recetaGenerada?.paciente || {};
    const productos = recetaGenerada?.productos || [];
    const detalles = recetaGenerada?.detalles || [];
    const receta = recetaGenerada?.receta || {};
    const expediente = recetaGenerada?.expediente || {};
    const doctor = recetaGenerada?.doctor || {};

    const folio =
      receta.folio_receta ||
      recetaGenerada?.folio ||
      (receta.id_receta ? `RX-${receta.id_receta}` : 'RX-SIN-FOLIO');

    const fechaReceta = receta.fecha_creacion
      ? new Date(receta.fecha_creacion).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: '2-digit',
      })
      : fechaActual;

    const texto = (valor, fallback = 'N/A') => {
      const limpio = String(valor ?? '').trim();
      return limpio || fallback;
    };

    const obtenerUrlLogo = (ruta) => {
      if (!ruta) return '';

      const valor = String(ruta).trim();

      if (!valor) return '';

      if (valor.startsWith('http://') || valor.startsWith('https://') || valor.startsWith('data:')) {
        return valor;
      }

      const baseURL = api.defaults.baseURL || '';
      const baseSinApi = baseURL.replace(/\/api\/?$/, '');

      if (valor.startsWith('/')) {
        return `${baseSinApi}${valor}`;
      }

      return `${baseSinApi}/${valor}`;
    };

    const logoUniversidadUrl = obtenerUrlLogo(
      doctor.logo_universidad_url ||
      receta.logo_universidad_url ||
      recetaGenerada?.logo_universidad_url ||
      ''
    );

    const nombrePaciente = texto(
      paciente.nombre_paciente ||
      receta.nombre_paciente ||
      receta.paciente_nombre ||
      expediente.nombre_paciente,
      'Paciente no especificado'
    );

    const telefonoPaciente = texto(
      paciente.telefono ||
      receta.telefono_paciente ||
      receta.telefono ||
      expediente.telefono
    );

    const edadPaciente = texto(
      paciente.edad ||
      receta.edad_paciente ||
      receta.edad ||
      expediente.edad
    );

    const sexoPaciente = texto(
      paciente.sexo ||
      receta.sexo_paciente ||
      receta.sexo ||
      expediente.sexo
    );

    const diagnostico = texto(
      paciente.diagnostico ||
      receta.diagnostico ||
      recetaGenerada?.diagnostico,
      'Sin diagnóstico registrado'
    );

    const observaciones = texto(
      paciente.observaciones ||
      receta.observaciones ||
      recetaGenerada?.observaciones,
      'Sin observaciones.'
    );

    const productosReceta =
      productos.length > 0
        ? productos
        : detalles.map((item) => ({
          id_producto: item.id_producto,
          nombre:
            item.nombre ||
            item.nombre_producto ||
            item.producto ||
            item.descripcion_producto ||
            'Medicamento',
          nombre_generico:
            item.nombre_generico ||
            item.generico ||
            item.denominacion_generica ||
            '',
          presentacion: primerTexto(
            item.presentacion,
            item.presentacion_producto,
            item.presentacion_medicamento,
            item.descripcion_presentacion,
            item.descripcion,
            item.concentracion,
            item.contenido,
            item.unidad_medida,
            item.raw?.presentacion,
            item.raw?.descripcion
          ),

          forma_farmaceutica: primerTexto(
            item.forma_farmaceutica,
            item.forma,
            item.tipo_forma,
            item.forma_producto,
            item.raw?.forma_farmaceutica,
            item.raw?.forma
          ),
          cantidad:
            item.cantidad ||
            item.cantidad_recetada ||
            item.cantidad_receta ||
            1,
          dosis: item.dosis || '',
          frecuencia: item.frecuencia || '',
          duracion: item.duracion || '',
          indicaciones: item.indicaciones || '',
        }));

    const totalPiezas = productosReceta.reduce(
      (acc, item) => acc + Number(item.cantidad || 0),
      0
    );

    const recetaEsLarga =
      productosReceta.length > 3 ||
      productosReceta.some((item) => {
        const textoIndicaciones = [
          item.nombre,
          item.nombre_generico,
          item.presentacion,
          item.forma_farmaceutica,
          item.dosis,
          item.frecuencia,
          item.duracion,
          item.indicaciones,
        ]
          .filter(Boolean)
          .join(' ');

        return textoIndicaciones.length > 180;
      });

    const filasProductos = productosReceta.length
      ? productosReceta
        .map(
          (item, index) => `
            <div class="rx-producto">
              <div class="rx-producto-main">
                <div>
                  <p class="rx-producto-nombre">
                    ${index + 1}. ${escapeHtml(texto(item.nombre, 'Medicamento'))}
                  </p>

                
                </div>

                <div class="rx-cantidad">x${escapeHtml(Number(item.cantidad || 1))}</div>
              </div>

              <div class="rx-indicaciones-grid">
                <span><strong>Dosis:</strong> ${escapeHtml(texto(item.dosis, '-'))}</span>
                <span><strong>Frecuencia:</strong> ${escapeHtml(texto(item.frecuencia, '-'))}</span>
                <span><strong>Duración:</strong> ${escapeHtml(texto(item.duracion, '-'))}</span>
              </div>

              ${item.indicaciones
              ? `<p class="rx-tratamiento"><strong>Indicaciones:</strong> ${escapeHtml(item.indicaciones)}</p>`
              : ''
            }
            </div>
          `
        )
        .join('')
      : `<div class="rx-empty">No hay productos registrados.</div>`;

    const copiaRecetaHtml = (tipoCopia) => `
      <section class="rx-copy">
        <div class="rx-header">
          <div class="rx-logos">
            <div class="rx-logo-box">
              <img src="${escapeHtml(logoFarmacia)}" alt="Farmacias Shaddai" />
            </div>

            ${logoUniversidadUrl
        ? `
                <div class="rx-logo-box">
                  <img src="${escapeHtml(logoUniversidadUrl)}" alt="Logo universidad" />
                </div>
              `
        : ''
      }
          </div>

          <div class="rx-title">
            <h1>FARMACIAS SHADDAI</h1>
            <p>RECETA MÉDICA</p>
            <span>Bienestar al alcance de todos</span>
          </div>

          <div class="rx-folio">
            <span>${escapeHtml(tipoCopia)}</span>
            <strong>${escapeHtml(folio)}</strong>
            <small>${escapeHtml(fechaReceta)}</small>
          </div>
        </div>

        <div class="rx-info-grid">
          <div class="rx-card">
            <div class="rx-card-title">Médico</div>

            <p><strong>Nombre:</strong> ${escapeHtml(texto(doctor.nombre_completo, 'Doctor Shaddai'))}</p>
            <p><strong>Especialidad:</strong> ${escapeHtml(texto(doctor.especialidad, 'Medicina general'))}</p>
            <p><strong>Cédula:</strong> ${escapeHtml(texto(doctor.cedula_profesional))}</p>
            <p><strong>Consultorio:</strong> ${escapeHtml(texto(doctor.direccion_consultorio, 'Farmacias Shaddai'))}</p>
          </div>

          <div class="rx-card">
            <div class="rx-card-title">Paciente</div>

            <p><strong>Paciente:</strong> ${escapeHtml(nombrePaciente)}</p>
            <p><strong>Expediente:</strong> ${escapeHtml(expediente?.id_expediente ? `EXP-${expediente.id_expediente}` : texto(expediente?.expediente, 'N/A'))}</p>
            <p><strong>Teléfono:</strong> ${escapeHtml(telefonoPaciente)}</p>
            <p><strong>Edad:</strong> ${escapeHtml(edadPaciente)} &nbsp; <strong>Sexo:</strong> ${escapeHtml(sexoPaciente)}</p>
          </div>
        </div>

        <div class="rx-diagnostico">
          <strong>Diagnóstico:</strong> ${escapeHtml(diagnostico)}
        </div>

        <div class="rx-prescripcion">
          <div class="rx-section-title">
            <span>Prescripción</span>
            <small>${escapeHtml(productosReceta.length)} producto(s) · ${escapeHtml(totalPiezas)} pieza(s)</small>
          </div>

          <div class="rx-productos">
            ${filasProductos}
          </div>
        </div>

        <div class="rx-footer">
          <div class="rx-observaciones">
            <strong>Observaciones:</strong> ${escapeHtml(observaciones)}
          </div>

          <div class="rx-firma">
            <div></div>
            <p>Firma del médico</p>
            <strong>${escapeHtml(texto(doctor.nombre_completo, 'Doctor Shaddai'))}</strong>
            <span>Cédula: ${escapeHtml(texto(doctor.cedula_profesional))}</span>
          </div>
        </div>
      </section>
    `;

    return `
      <!doctype html>
      <html lang="es">
        <head>
          <meta charset="utf-8" />
          <title>Receta médica ${escapeHtml(folio)}</title>

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
              background: white;
              color: #0f172a;
              font-family: Arial, Helvetica, sans-serif;
              font-size: 11px;
            }

            .rx-print-wrapper {
              width: 100%;
              max-width: 8.5in;
              margin: 0 auto;
              background: white;
              color: #0f172a;
            }

            .rx-page {
              width: 100%;
              background: white;
            }

            .rx-print-double .rx-page {
              height: calc(279.4mm - 12mm);
              max-height: calc(279.4mm - 12mm);
              display: grid;
              grid-template-rows: 1fr 5mm 1fr;
              gap: 0;
              overflow: hidden;
            }

            .rx-print-large .rx-page {
              min-height: calc(279.4mm - 12mm);
              height: auto;
              display: block;
              page-break-after: always;
              break-after: page;
              overflow: visible;
            }

            .rx-print-large .rx-page:last-child {
              page-break-after: auto;
              break-after: auto;
            }

            .rx-copy {
              border: 1px solid #cbd5e1;
              border-radius: 12px;
              padding: 7px 9px;
              background: white;
              display: flex;
              flex-direction: column;
              gap: 5px;
            }

            .rx-print-double .rx-copy {
              height: 100%;
              max-height: 100%;
              overflow: hidden;
            }

            .rx-print-large .rx-copy {
              min-height: calc(279.4mm - 12mm);
              height: auto;
              max-height: none;
              overflow: visible;
            }

            .rx-separator {
              height: 5mm;
              display: flex;
              align-items: center;
              gap: 8px;
              color: #94a3b8;
              font-size: 8px;
              font-weight: 900;
              letter-spacing: 0.18em;
              text-transform: uppercase;
            }

            .rx-separator::before,
            .rx-separator::after {
              content: '';
              flex: 1;
              border-top: 1px dashed #94a3b8;
            }

            .rx-header {
              display: grid;
              grid-template-columns: 88px 1fr 132px;
              align-items: center;
              gap: 10px;
              border-bottom: 2px solid #0369a1;
              padding-bottom: 6px;
            }

            .rx-logos {
              display: flex;
              align-items: center;
              gap: 5px;
            }

            .rx-logo-box {
              width: 40px;
              height: 40px;
              border: 1px solid #e2e8f0;
              border-radius: 10px;
              padding: 3px;
              display: flex;
              align-items: center;
              justify-content: center;
              background: white;
            }

            .rx-logo-box img {
              max-width: 100%;
              max-height: 100%;
              object-fit: contain;
            }

            .rx-title {
              text-align: center;
              line-height: 1.1;
            }

            .rx-title h1 {
              margin: 0;
              font-size: 15px;
              font-weight: 900;
              letter-spacing: 0.14em;
              color: #0f172a;
            }

            .rx-title p {
              margin: 2px 0 0;
              font-size: 9px;
              font-weight: 900;
              letter-spacing: 0.28em;
              color: #0369a1;
            }

            .rx-title span {
              display: block;
              margin-top: 2px;
              font-size: 8px;
              font-weight: 700;
              color: #64748b;
            }

            .rx-folio {
              border: 1px solid #cbd5e1;
              border-radius: 10px;
              padding: 5px 6px;
              text-align: center;
              line-height: 1.15;
            }

            .rx-folio span {
              display: block;
              font-size: 8px;
              font-weight: 900;
              color: #0369a1;
              text-transform: uppercase;
              letter-spacing: 0.08em;
            }

            .rx-folio strong {
              display: block;
              margin-top: 2px;
              font-size: 10px;
              font-weight: 900;
              color: #0f172a;
            }

            .rx-folio small {
              display: block;
              margin-top: 1px;
              font-size: 8px;
              font-weight: 700;
              color: #64748b;
            }

            .rx-info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 7px;
            }

            .rx-card {
              border: 1px solid #cbd5e1;
              border-radius: 10px;
              padding: 6px 8px;
              font-size: 8.5px;
              line-height: 1.25;
            }

            .rx-card p {
              margin: 1px 0;
            }

            .rx-card-title {
              margin-bottom: 3px;
              border-bottom: 1px solid #e2e8f0;
              padding-bottom: 2px;
              font-size: 8px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 0.12em;
              color: #0369a1;
            }

            .rx-diagnostico {
              border: 1px solid #cbd5e1;
              border-radius: 10px;
              padding: 6px 8px;
              min-height: 30px;
              font-size: 8.8px;
              line-height: 1.25;
              background: #f8fafc;
            }

            .rx-prescripcion {
              border: 1px solid #cbd5e1;
              border-radius: 10px;
              padding: 6px 8px;
              flex: 1;
              min-height: 0;
              overflow: hidden;
            }

            .rx-print-large .rx-prescripcion {
              overflow: visible;
            }

            .rx-section-title {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 1px solid #e2e8f0;
              padding-bottom: 3px;
              margin-bottom: 5px;
            }

            .rx-section-title span {
              font-size: 8px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 0.12em;
              color: #0369a1;
            }

            .rx-section-title small {
              font-size: 7.5px;
              font-weight: 900;
              color: #64748b;
            }

            .rx-productos {
              display: flex;
              flex-direction: column;
              gap: 4px;
            }

            .rx-print-large .rx-productos {
              overflow: visible;
            }

            .rx-producto {
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 5px 6px;
              background: white;
              page-break-inside: avoid;
              break-inside: avoid;
            }

            .rx-producto-main {
              display: grid;
              grid-template-columns: 1fr 34px;
              gap: 6px;
              align-items: start;
            }

            .rx-producto-nombre {
              margin: 0;
              font-size: 8.8px;
              font-weight: 900;
              line-height: 1.15;
              color: #0f172a;
            }

            .rx-producto-meta {
              margin: 2px 0 0;
              font-size: 7.4px;
              line-height: 1.15;
              color: #475569;
            }

            .rx-cantidad {
              border: 1px solid #bae6fd;
              border-radius: 8px;
              padding: 4px 2px;
              text-align: center;
              font-size: 10px;
              font-weight: 900;
              color: #0369a1;
              background: #f0f9ff;
            }

            .rx-indicaciones-grid {
              margin-top: 3px;
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 4px;
              font-size: 7.8px;
              line-height: 1.15;
              color: #334155;
            }

            .rx-tratamiento {
              margin: 3px 0 0;
              font-size: 7.8px;
              line-height: 1.15;
              color: #334155;
            }

            .rx-empty {
              padding: 14px;
              text-align: center;
              font-size: 8.5px;
              color: #64748b;
            }

            .rx-footer {
              display: grid;
              grid-template-columns: 1fr 160px;
              gap: 7px;
              align-items: end;
            }

            .rx-observaciones {
              border: 1px solid #cbd5e1;
              border-radius: 10px;
              padding: 6px 8px;
              min-height: 37px;
              font-size: 8px;
              line-height: 1.2;
            }

            .rx-firma {
              text-align: center;
              font-size: 7.5px;
              color: #475569;
            }

            .rx-firma div {
              height: 24px;
              border-bottom: 1px solid #0f172a;
              margin-bottom: 3px;
            }

            .rx-firma p {
              margin: 0;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 0.08em;
            }

            .rx-firma strong {
              display: block;
              margin-top: 1px;
              font-size: 8px;
              color: #0f172a;
            }

            .rx-firma span {
              display: block;
              font-size: 7px;
            }

            @media print {
              .rx-print-wrapper {
                width: 100% !important;
                max-width: none !important;
                margin: 0 !important;
                padding: 0 !important;
                overflow: hidden !important;
              }

              .rx-print-double .rx-page {
                height: calc(279.4mm - 12mm) !important;
                max-height: calc(279.4mm - 12mm) !important;
                display: grid !important;
                grid-template-rows: 1fr 5mm 1fr !important;
                overflow: hidden !important;
                page-break-after: avoid !important;
                break-after: avoid !important;
              }

              .rx-print-double .rx-copy {
                height: 100% !important;
                max-height: 100% !important;
                min-height: 0 !important;
                border-radius: 0 !important;
                box-shadow: none !important;
                overflow: hidden !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }

              .rx-print-large .rx-page {
                min-height: calc(279.4mm - 12mm) !important;
                height: auto !important;
                max-height: none !important;
                overflow: visible !important;
                page-break-after: always !important;
                break-after: page !important;
              }

              .rx-print-large .rx-page:last-child {
                page-break-after: auto !important;
                break-after: auto !important;
              }

              .rx-print-large .rx-copy {
                min-height: calc(279.4mm - 12mm) !important;
                height: auto !important;
                max-height: none !important;
                overflow: visible !important;
                border-radius: 0 !important;
              }

              .rx-separator {
                height: 5mm !important;
              }
            }
          </style>
        </head>

        <body>
          <div class="rx-print-wrapper ${recetaEsLarga ? 'rx-print-large' : 'rx-print-double'}">
            ${recetaEsLarga
        ? `
                <div class="rx-page">
                  ${copiaRecetaHtml('Copia paciente')}
                </div>

                <div class="rx-page">
                  ${copiaRecetaHtml('Copia consultorio')}
                </div>
              `
        : `
                <div class="rx-page">
                  ${copiaRecetaHtml('Copia paciente')}

                  <div class="rx-separator">
                    Corte aquí
                  </div>

                  ${copiaRecetaHtml('Copia consultorio')}
                </div>
              `
      }
          </div>

          <script>
            window.onload = function () {
              const imagenes = Array.from(document.images || []);

              Promise.all(
                imagenes.map(function (img) {
                  if (img.complete) return Promise.resolve();

                  return new Promise(function (resolve) {
                    img.onload = resolve;
                    img.onerror = resolve;
                  });
                })
              ).then(function () {
                setTimeout(function () {
                  window.focus();
                  window.print();
                }, 350);
              });
            };
          </script>
        </body>
      </html>
    `;
  };

  const reimprimirRecetaMedica = async (doc) => {
    const idReceta = doc?.id_origen || doc?.id;

    if (!idReceta) {
      Swal.fire({
        icon: 'error',
        title: 'Sin ID de receta',
        text: 'No se encontró el ID de origen para consultar la receta.',
      });

      return;
    }

    try {
      const { data } = await api.get(`/doctor-shaddai/recetas/${idReceta}`);

      if (!data.ok) {
        throw new Error(data.mensaje || 'No se pudo obtener la receta.');
      }

      const receta = data.receta || {};
      const detalles = data.detalles || [];

      const recetaGeneradaBase = mapearRecetaParaImpresion({
        doc,
        receta,
        detalles,
      });

      const doctorCompleto = {
        ...(recetaGeneradaBase.doctor || {}),
        ...(data.doctor || {}),
        logo_universidad_url:
          data.doctor?.logo_universidad_url ||
          receta.logo_universidad_url ||
          receta.doctor_logo_universidad_url ||
          recetaGeneradaBase.doctor?.logo_universidad_url ||
          null,
      };

      const recetaGenerada = {
        ...recetaGeneradaBase,
        doctor: doctorCompleto,
      };

      const docCompleto = {
        ...doc,
        data: {
          ...(doc.data || {}),
          ...receta,
        },
        metadata: {
          ...normalizarMetadata(doc.metadata),
          ...receta,
          recetaGenerada,
        },
      };

      setDocumentoSeleccionado(docCompleto);

      const html = generarHtmlRecetaMedicaShaddai({
        recetaGenerada,
        fechaActual: formatearFechaCorta(
          receta.fecha_creacion ||
          doc.fecha ||
          new Date()
        ),
      });

      abrirHtmlImpresion(html, `Receta médica ${receta.folio_receta || doc.folio || ''}`);
    } catch (error) {
      console.error('Error al reimprimir receta médica:', error);

      Swal.fire({
        icon: 'error',
        title: 'No se pudo reimprimir',
        text:
          error.response?.data?.mensaje ||
          error.message ||
          'No se pudo consultar la receta completa.',
      });
    }
  };

  const reimprimirLaboratorio = async (doc) => {
    try {
      const docCompleto = {
        ...doc,
        metadata: {
          ...normalizarMetadata(doc.metadata),
        },
        data: {
          ...(doc.data || {}),
        },
      };

      setDocumentoSeleccionado(docCompleto);

      await new Promise((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => setTimeout(resolve, 300));
        });
      });

      await imprimirNodoEnIframe('laboratorio-imprimible', 'Solicitud de laboratorio');
    } catch (error) {
      console.error('Error al reimprimir laboratorio:', error);

      Swal.fire({
        icon: 'error',
        title: 'No se pudo reimprimir',
        text:
          error.response?.data?.mensaje ||
          error.message ||
          'No se pudo preparar la solicitud de laboratorio.',
      });
    }
  };

  const reimprimirNotaMedica = async (doc) => {
    const idNota = doc?.id_origen || doc?.id;

    if (!idNota) {
      Swal.fire({
        icon: 'error',
        title: 'Sin ID de nota médica',
        text: 'No se encontró el ID de origen para consultar la nota médica.',
      });

      return;
    }

    try {
      const { data } = await api.get(`/doctor-shaddai/notas-medicas/${idNota}`);

      if (!data.ok) {
        throw new Error(data.mensaje || 'No se pudo obtener la nota médica.');
      }

      const notaCompleta = data.nota || data.nota_medica || data.registro || {};

      const docCompleto = {
        ...doc,
        data: {
          ...(doc.data || {}),
          ...notaCompleta,
        },
        metadata: {
          ...normalizarMetadata(doc.metadata),
          ...notaCompleta,
        },
      };

      setDocumentoSeleccionado(docCompleto);

      await new Promise((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => setTimeout(resolve, 300));
        });
      });

      imprimirNodoEnIframe('nota-medica-imprimible');
    } catch (error) {
      console.error('Error al reimprimir nota médica:', error);

      Swal.fire({
        icon: 'error',
        title: 'No se pudo reimprimir',
        text:
          error.response?.data?.mensaje ||
          error.message ||
          'No se pudo consultar la nota médica completa.',
      });
    }
  };

  const mapearServicioClinicoParaImpresion = ({
    doc = {},
    solicitud = {},
    detalles = [],
  }) => {
    const metadata = normalizarMetadata(doc.metadata);

    const servicioDetalles = Array.isArray(detalles) ? detalles : [];

    return {
      solicitud: {
        id_solicitud_servicio:
          solicitud.id_solicitud_servicio ||
          doc.id_origen ||
          doc.id,
        folio_servicio:
          solicitud.folio_servicio ||
          doc.folio ||
          metadata.folio_servicio ||
          'SERV-SIN-FOLIO',
        nombre_paciente:
          solicitud.nombre_paciente ||
          metadata.nombre_paciente ||
          pacienteDocumentos?.nombre_paciente ||
          'N/A',
        telefono_paciente:
          solicitud.telefono_paciente ||
          metadata.telefono_paciente ||
          pacienteDocumentos?.telefono ||
          'N/A',
        edad_paciente:
          solicitud.edad_paciente ||
          metadata.edad_paciente ||
          pacienteDocumentos?.edad ||
          'N/A',
        sexo_paciente:
          solicitud.sexo_paciente ||
          metadata.sexo_paciente ||
          pacienteDocumentos?.sexo ||
          'N/A',
        diagnostico:
          solicitud.diagnostico ||
          metadata.diagnostico ||
          doc.data?.descripcion ||
          'Sin diagnóstico registrado',
        observaciones:
          solicitud.observaciones ||
          metadata.observaciones ||
          doc.data?.descripcion ||
          'Sin observaciones',
        estatus:
          solicitud.estatus ||
          doc.estatus ||
          'N/A',
        total:
          solicitud.total ||
          metadata.total ||
          0,
        fecha_creacion:
          solicitud.fecha_creacion ||
          doc.fecha ||
          doc.data?.fecha_documento ||
          doc.data?.fecha_creacion,
        fecha_pago:
          solicitud.fecha_pago ||
          metadata.fecha_pago ||
          null,
        fecha_realizado:
          solicitud.fecha_realizado ||
          metadata.fecha_realizado ||
          null,
      },

      detalles: servicioDetalles.map((item) => ({
        id_detalle_servicio: item.id_detalle_servicio,
        id_servicio: item.id_servicio,
        nombre_servicio:
          item.nombre_servicio ||
          item.nombre ||
          item.servicio ||
          'Servicio clínico',
        descripcion:
          item.descripcion_catalogo ||
          item.descripcion ||
          '',
        cantidad:
          item.cantidad ||
          1,
        precio_unitario:
          item.precio_unitario ||
          item.precio ||
          0,
        subtotal:
          item.subtotal ||
          Number(item.cantidad || 1) * Number(item.precio_unitario || item.precio || 0),
        indicaciones:
          item.indicaciones ||
          '',
        observaciones:
          item.observaciones ||
          '',
        nombre_producto:
          item.nombre_producto ||
          '',
        codigo_barras:
          item.codigo_barras ||
          '',
      })),

      doctor: {
        nombre_completo:
          solicitud.nombre_doctor ||
          solicitud.nombre_doctor_shaddai ||
          solicitud.doctor_shaddai ||
          metadata.doctor_nombre_completo ||
          metadata.medico_responsable ||
          pacienteDocumentos?.doctor_nombre ||
          'Doctor Shaddai',
        cedula_profesional:
          solicitud.cedula_profesional ||
          metadata.cedula_profesional ||
          pacienteDocumentos?.cedula_profesional ||
          'N/A',
        especialidad:
          solicitud.especialidad ||
          metadata.especialidad ||
          pacienteDocumentos?.doctor_especialidad ||
          'Medicina general',
      },

      expediente: {
        id_expediente:
          solicitud.id_paciente_expediente ||
          metadata.id_expediente ||
          pacienteDocumentos?.id_expediente ||
          'N/A',
      },
    };
  };

  const generarHtmlServicioClinicoShaddai = ({ servicioGenerado }) => {
    const solicitud = servicioGenerado?.solicitud || {};
    const detalles = servicioGenerado?.detalles || [];
    const doctor = servicioGenerado?.doctor || {};
    const expediente = servicioGenerado?.expediente || {};

    const formatoMoneda = (valor) =>
      Number(valor || 0).toLocaleString('es-MX', {
        style: 'currency',
        currency: 'MXN',
      });

    const fechaServicio = solicitud.fecha_creacion
      ? new Date(solicitud.fecha_creacion).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: '2-digit',
      })
      : formatearFechaCorta(new Date());

    const filasServicios = detalles.length
      ? detalles
        .map(
          (item, index) => `
            <tr>
              <td class="center">${index + 1}</td>
              <td>
                <strong>${escapeHtml(item.nombre_servicio || 'Servicio clínico')}</strong>
                ${item.descripcion
              ? `<div class="muted">${escapeHtml(item.descripcion)}</div>`
              : ''
            }
                ${item.nombre_producto
              ? `<div class="muted"><strong>Producto/insumo:</strong> ${escapeHtml(item.nombre_producto)}</div>`
              : ''
            }
              </td>
              <td class="center">${escapeHtml(item.cantidad || 1)}</td>
              <td class="right">${escapeHtml(formatoMoneda(item.precio_unitario))}</td>
              <td class="right strong">${escapeHtml(formatoMoneda(item.subtotal))}</td>
            </tr>
            ${item.indicaciones || item.observaciones
              ? `
                  <tr>
                    <td></td>
                    <td colspan="4" class="nota">
                      ${item.indicaciones
                ? `<strong>Indicaciones:</strong> ${escapeHtml(item.indicaciones)}<br />`
                : ''
              }
                      ${item.observaciones
                ? `<strong>Observaciones:</strong> ${escapeHtml(item.observaciones)}`
                : ''
              }
                    </td>
                  </tr>
                `
              : ''
            }
          `
        )
        .join('')
      : `
      <tr>
        <td colspan="5" class="empty">No hay servicios registrados.</td>
      </tr>
    `;

    return `
    <!doctype html>
    <html lang="es">
      <head>
        <meta charset="utf-8" />
        <title>Servicio clínico ${escapeHtml(solicitud.folio_servicio || '')}</title>

        <style>
          @page {
            size: letter portrait;
            margin: 8mm;
          }

          * {
            box-sizing: border-box;
          }

          html,
          body {
            margin: 0;
            padding: 0;
            background: white;
            color: #0f172a;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 11px;
          }

          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .hoja {
            min-height: calc(279.4mm - 16mm);
            width: 100%;
            display: flex;
            flex-direction: column;
            border: 1px solid #dbe3ee;
            border-radius: 16px;
            overflow: hidden;
            background: white;
          }

          .header {
            border-bottom: 4px solid #0369a1;
            padding: 16px 20px 14px;
            display: grid;
            grid-template-columns: 82px 1fr 190px;
            gap: 16px;
            align-items: center;
            background: #ffffff;
          }

          .logo {
            width: 66px;
            height: 66px;
            border: 1px solid #e2e8f0;
            border-radius: 18px;
            padding: 7px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .logo img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
          }

          .marca {
            text-align: center;
          }

          .marca h1 {
            margin: 0;
            font-size: 24px;
            letter-spacing: 5px;
            font-weight: 900;
            color: #020617;
          }

          .marca .subtitulo {
            margin-top: 4px;
            font-size: 12px;
            letter-spacing: 4px;
            text-transform: uppercase;
            font-weight: 900;
            color: #0369a1;
          }

          .marca .slogan {
            margin-top: 5px;
            font-size: 10px;
            font-weight: 700;
            color: #334155;
          }

          .folio-box {
            border: 1px solid #dbe3ee;
            border-radius: 18px;
            padding: 12px;
            text-align: center;
          }

          .folio-box .label {
            font-size: 9px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            color: #64748b;
          }

          .folio-box .folio {
            margin-top: 5px;
            font-size: 13px;
            font-weight: 900;
            color: #020617;
          }

          .folio-box .fecha {
            margin-top: 4px;
            font-size: 10px;
            font-weight: 800;
            color: #475569;
          }

          .contenido {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 12px;
            padding: 14px 20px 12px;
          }

          .grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
          }

          .card {
            border: 1px solid #dbe3ee;
            border-radius: 16px;
            padding: 12px;
            background: white;
          }

          .card-title {
            margin: 0 0 8px;
            padding-bottom: 6px;
            border-bottom: 1px solid #e2e8f0;
            color: #075985;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            font-size: 10px;
            font-weight: 900;
          }

          .datos {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 5px 12px;
            line-height: 1.35;
          }

          .datos .full {
            grid-column: 1 / -1;
          }

          .badge {
            display: inline-block;
            padding: 4px 9px;
            border-radius: 999px;
            background: #e0f2fe;
            color: #075985;
            font-weight: 900;
            font-size: 9px;
          }

          .texto-box {
            min-height: 52px;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 10px;
            line-height: 1.35;
            background: #f8fafc;
          }

          table {
            width: 100%;
            border-collapse: collapse;
          }

          th {
            background: #f0f9ff;
            color: #075985;
            border: 1px solid #bae6fd;
            padding: 7px;
            text-align: left;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.8px;
          }

          td {
            border: 1px solid #dbe3ee;
            padding: 7px;
            vertical-align: top;
            line-height: 1.35;
          }

          .center {
            text-align: center;
          }

          .right {
            text-align: right;
          }

          .strong {
            font-weight: 900;
          }

          .muted {
            margin-top: 3px;
            color: #64748b;
            font-size: 9.5px;
          }

          .nota {
            background: #f8fafc;
            color: #334155;
            font-size: 10px;
          }

          .empty {
            text-align: center;
            color: #64748b;
            background: #f8fafc;
          }

          .total-box {
            margin-left: auto;
            width: 230px;
            border: 1px solid #0369a1;
            border-radius: 14px;
            overflow: hidden;
          }

          .total-box div {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            padding: 9px 12px;
          }

          .total-box .final {
            background: #0369a1;
            color: white;
            font-size: 13px;
            font-weight: 900;
          }

          .inferior {
            margin-top: auto;
            display: grid;
            grid-template-columns: 1fr 260px;
            gap: 12px;
          }

          .firma {
            text-align: center;
          }

          .firma-linea {
            height: 52px;
            border-bottom: 1px solid #334155;
            margin-bottom: 8px;
          }

          .firma .titulo {
            font-size: 10px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #334155;
          }

          .firma .doctor {
            margin-top: 4px;
            font-size: 11px;
            font-weight: 900;
            color: #020617;
          }

          .firma .cedula {
            margin-top: 2px;
            font-size: 9px;
            color: #64748b;
          }

          .footer {
            border-top: 1px solid #e2e8f0;
            padding-top: 7px;
            text-align: center;
            font-size: 8.5px;
            line-height: 1.3;
            color: #64748b;
          }
        </style>
      </head>

      <body>
        <main class="hoja">
          <header class="header">
            <div class="logo">
              <img src="${logoFarmacia}" alt="Farmacias Shaddai" />
            </div>

            <div class="marca">
              <h1>FARMACIAS SHADDAI</h1>
              <div class="subtitulo">Comprobante de servicio clínico</div>
              <div class="slogan">Doctor Shaddai · Bienestar al alcance de todos</div>
            </div>

            <div class="folio-box">
              <div class="label">Folio servicio</div>
              <div class="folio">${escapeHtml(solicitud.folio_servicio || 'N/A')}</div>
              <div class="fecha">${escapeHtml(fechaServicio)}</div>
            </div>
          </header>

          <section class="contenido">
            <div class="grid-2">
              <div class="card">
                <h2 class="card-title">Paciente</h2>

                <div class="datos">
                  <div class="full"><strong>Paciente:</strong> ${escapeHtml(solicitud.nombre_paciente || 'N/A')}</div>
                  <div><strong>Expediente:</strong> ${escapeHtml(expediente.id_expediente || 'N/A')}</div>
                  <div><strong>Tel:</strong> ${escapeHtml(solicitud.telefono_paciente || 'N/A')}</div>
                  <div><strong>Edad:</strong> ${escapeHtml(solicitud.edad_paciente || 'N/A')}</div>
                  <div><strong>Sexo:</strong> ${escapeHtml(solicitud.sexo_paciente || 'N/A')}</div>
                  <div><strong>Estatus:</strong> <span class="badge">${escapeHtml(solicitud.estatus || 'N/A')}</span></div>
                </div>
              </div>

              <div class="card">
                <h2 class="card-title">Médico responsable</h2>

                <div class="datos">
                  <div class="full"><strong>Nombre:</strong> ${escapeHtml(doctor.nombre_completo || 'Doctor Shaddai')}</div>
                  <div><strong>Especialidad:</strong> ${escapeHtml(doctor.especialidad || 'Medicina general')}</div>
                  <div><strong>Cédula:</strong> ${escapeHtml(doctor.cedula_profesional || 'N/A')}</div>
                  <div class="full"><strong>Fecha:</strong> ${escapeHtml(fechaServicio)}</div>
                </div>
              </div>
            </div>

            <div class="grid-2">
              <div class="card">
                <h2 class="card-title">Diagnóstico / motivo</h2>
                <div class="texto-box">${escapeHtml(solicitud.diagnostico || 'Sin diagnóstico registrado')}</div>
              </div>

              <div class="card">
                <h2 class="card-title">Observaciones</h2>
                <div class="texto-box">${escapeHtml(solicitud.observaciones || 'Sin observaciones')}</div>
              </div>
            </div>

            <div class="card">
              <h2 class="card-title">Servicios realizados / cobrados</h2>

              <table>
                <thead>
                  <tr>
                    <th class="center">#</th>
                    <th>Servicio</th>
                    <th class="center">Cant.</th>
                    <th class="right">Precio</th>
                    <th class="right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${filasServicios}
                </tbody>
              </table>

              <div class="total-box" style="margin-top:12px;">
                <div class="final">
                  <span>Total</span>
                  <span>${escapeHtml(formatoMoneda(solicitud.total))}</span>
                </div>
              </div>
            </div>

            <div class="inferior">
              <div class="card">
                <h2 class="card-title">Nota</h2>
                <div class="texto-box">
                  Este comprobante corresponde al registro clínico del servicio solicitado y enviado a caja para su cobro.
                </div>
              </div>

              <div class="card firma">
                <div class="firma-linea"></div>
                <div class="titulo">Firma / responsable</div>
                <div class="doctor">${escapeHtml(doctor.nombre_completo || 'Doctor Shaddai')}</div>
                <div class="cedula">Cédula: ${escapeHtml(doctor.cedula_profesional || 'N/A')}</div>
              </div>
            </div>

            <div class="footer">
              Documento generado digitalmente por Farmacias Shaddai. Uso interno para seguimiento clínico y administrativo del servicio.
            </div>
          </section>
        </main>

        <script>
          window.onload = function () {
            const imagenes = Array.from(document.images || []);

            Promise.all(
              imagenes.map(function (img) {
                if (img.complete) return Promise.resolve();

                return new Promise(function (resolve) {
                  img.onload = resolve;
                  img.onerror = resolve;
                });
              })
            ).then(function () {
              setTimeout(function () {
                window.focus();
                window.print();
              }, 350);
            });
          };
        </script>
      </body>
    </html>
  `;
  };

  const reimprimirServicioClinico = async (doc) => {
    const idSolicitud = doc?.id_origen || doc?.id;

    if (!idSolicitud) {
      Swal.fire({
        icon: 'error',
        title: 'Sin ID de servicio',
        text: 'No se encontró el ID de origen para consultar el servicio clínico.',
      });

      return;
    }

    try {
      const { data } = await api.get(`/doctor-shaddai/servicios-clinicos/${idSolicitud}`);

      if (!data.ok) {
        throw new Error(data.mensaje || 'No se pudo obtener el servicio clínico.');
      }

      const solicitud = data.solicitud || {};
      const detalles = data.detalles || [];

      const servicioGenerado = mapearServicioClinicoParaImpresion({
        doc,
        solicitud,
        detalles,
      });

      const docCompleto = {
        ...doc,
        data: {
          ...(doc.data || {}),
          ...solicitud,
        },
        metadata: {
          ...normalizarMetadata(doc.metadata),
          ...solicitud,
          servicioGenerado,
        },
      };

      setDocumentoSeleccionado(docCompleto);

      const html = generarHtmlServicioClinicoShaddai({
        servicioGenerado,
      });

      abrirHtmlImpresion(
        html,
        `Servicio clínico ${solicitud.folio_servicio || doc.folio || ''}`
      );
    } catch (error) {
      console.error('Error al reimprimir servicio clínico:', error);

      Swal.fire({
        icon: 'error',
        title: 'No se pudo reimprimir',
        text:
          error.response?.data?.mensaje ||
          error.message ||
          'No se pudo consultar el servicio clínico completo.',
      });
    }
  };

  const reimprimirCertificadoMedico = async (doc) => {
    const idCertificado = doc?.id_origen || doc?.id;

    if (!idCertificado) {
      Swal.fire({
        icon: 'error',
        title: 'Sin ID de certificado',
        text: 'No se encontró el ID de origen para consultar el certificado médico.',
      });

      return;
    }

    try {
      let certificado = null;

      try {
        const { data } = await api.get(`/doctor-shaddai/certificados/${idCertificado}`);

        if (data.ok) {
          certificado = data.certificado || data.data || null;
        }
      } catch (errorConsulta) {
        console.warn('No se pudo consultar certificado completo, se usará metadata:', errorConsulta);
      }

      const certificadoParaImprimir = mapearCertificadoParaImpresion({
        ...doc,
        data: {
          ...(doc.data || {}),
          ...(certificado || {}),
        },
        metadata: {
          ...normalizarMetadata(doc.metadata),
          ...(certificado || {}),
        },
      });

      const docCompleto = {
        ...doc,
        data: {
          ...(doc.data || {}),
          ...(certificado || {}),
        },
        metadata: {
          ...normalizarMetadata(doc.metadata),
          certificadoParaImprimir,
          ...(certificado || {}),
        },
      };

      setDocumentoSeleccionado(docCompleto);

      await new Promise((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => setTimeout(resolve, 350));
        });
      });

      await imprimirNodoEnIframe(
        'certificado-medico-imprimible',
        `Certificado médico ${certificadoParaImprimir.folio_certificado || doc.folio || ''}`
      );
    } catch (error) {
      console.error('Error al reimprimir certificado médico:', error);

      Swal.fire({
        icon: 'error',
        title: 'No se pudo reimprimir',
        text:
          error.response?.data?.mensaje ||
          error.message ||
          'No se pudo preparar el certificado médico.',
      });
    }
  };

  const reimprimirDocumento = async (doc) => {
    if (!doc) return;

    setDocumentoSeleccionado(doc);

    await new Promise((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setTimeout(resolve, 250));
      });
    });

    try {
      if (doc.tipo === 'RECETA') {
        await reimprimirRecetaMedica(doc);
        return;
      }

      if (doc.tipo === 'SERVICIO_CLINICO') {
        await reimprimirServicioClinico(doc);
        return;
      }

      if (doc.tipo === 'LABORATORIO') {
        await reimprimirLaboratorio(doc);
        return;
      }

      if (doc.tipo === 'CERTIFICADO_MEDICO') {
        await reimprimirCertificadoMedico(doc);
        return;
      }

      if (
        ['NOTA_MEDICA', 'NOTA_EVOLUCION', 'SERVICIO_RAPIDO'].includes(doc.tipo)
      ) {
        await reimprimirNotaMedica(doc);
        return;
      }

      const idsPorTipo = {
        CONSENTIMIENTO: 'consentimiento-informado-imprimible',
        REFERENCIA: 'hoja-referencia-contrarreferencia',
        VIOLENCIA_LESION: 'hoja-violencia-lesion-imprimible',
      };

      if (idsPorTipo[doc.tipo]) {
        await imprimirNodoEnIframe(
          idsPorTipo[doc.tipo],
          obtenerEtiquetaDocumento(doc.tipo)
        );
        return;
      }

      const metadata = normalizarMetadata(doc.metadata);
      const html = generarHtmlDocumentoClinico({
        titulo: doc.titulo || obtenerEtiquetaDocumento(doc.tipo),
        subtitulo: 'Área médica',
        folio: doc.folio,
        fecha: doc.fecha,
        paciente: obtenerPacienteBaseDocumento(doc),
        medico: obtenerMedicoBaseDocumento(doc),
        bloques: [
          {
            titulo: 'Descripción',
            contenido: doc.data?.descripcion || 'N/A',
          },
          {
            titulo: 'Información guardada',
            contenido: JSON.stringify(metadata, null, 2),
          },
        ],
        codigo: doc.tipo || 'DOC-CLINICO',
      });

      abrirHtmlImpresion(html, doc.titulo || 'Documento clínico');
    } catch (error) {
      console.error('Error al reimprimir documento:', error);

      Swal.fire({
        icon: 'error',
        title: 'No se pudo reimprimir',
        text:
          error.response?.data?.mensaje ||
          error.message ||
          'No se pudo preparar el documento para impresión.',
      });
    }
  };

  const renderDocumentoSeleccionado = () => {
    if (!documentoSeleccionado) {
      return (
        <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white text-slate-500">
          <FileText className="mb-3" size={34} />
          <p className="font-bold">Selecciona un documento</p>
          <p className="text-sm">
            Aquí se mostrará la vista previa para ver o reimprimir.
          </p>
        </div>
      );
    }

    if (documentoSeleccionado.tipo === 'RECETA') {
      const recetaGenerada =
        documentoSeleccionado.metadata?.recetaGenerada ||
        mapearRecetaParaImpresion({
          doc: documentoSeleccionado,
          receta: documentoSeleccionado.data || {},
          detalles: [],
        });

      return (
        <RecetaImprimible
          recetaGenerada={recetaGenerada}
          fechaActual={formatearFechaCorta(
            recetaGenerada?.receta?.fecha_creacion ||
            documentoSeleccionado.fecha
          )}
          perfilDoctor={recetaGenerada.doctor}
        />
      );
    }

    if (documentoSeleccionado.tipo === 'LABORATORIO') {
      const solicitudLaboratorio =
        documentoSeleccionado.metadata?.solicitudLaboratorio ||
        mapearLaboratorioParaImpresion(documentoSeleccionado);

      return <LaboratorioImprimible solicitud={solicitudLaboratorio} />;
    }

    if (documentoSeleccionado.tipo === 'CERTIFICADO_MEDICO') {
      const metadata = normalizarMetadata(documentoSeleccionado.metadata);

      const certificado =
        metadata?.certificadoParaImprimir ||
        mapearCertificadoParaImpresion(documentoSeleccionado);

      return (
        <CertificadoMedicoImprimible
          certificado={certificado}
          expediente={{
            ...pacienteDocumentos,
            id_expediente:
              pacienteDocumentos?.id_expediente ||
              certificado?.datos_paciente?.id_expediente ||
              documentoSeleccionado.data?.id_expediente ||
              metadata.id_expediente,
          }}
          paciente={pacienteDocumentos}
          perfilDoctor={certificado.datos_doctor}
        />
      );
    }

    if (documentoSeleccionado.tipo === 'SERVICIO_CLINICO') {
      const metadata = normalizarMetadata(documentoSeleccionado.metadata);

      const servicioGenerado =
        metadata?.servicioGenerado ||
        mapearServicioClinicoParaImpresion({
          doc: documentoSeleccionado,
          solicitud: documentoSeleccionado.data || metadata || {},
          detalles: documentoSeleccionado.data?.detalles || [],
        });

      const solicitud = servicioGenerado.solicitud || {};
      const detalles = servicioGenerado.detalles || [];

      const totalServicio = Number(solicitud.total || 0).toLocaleString('es-MX', {
        style: 'currency',
        currency: 'MXN',
      });

      return (
        <div className="rounded-3xl border border-sky-100 bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-black text-sky-700">
              SERVICIO_CLINICO
            </span>

            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-700">
              {solicitud.folio_servicio || documentoSeleccionado.folio || 'Sin folio'}
            </span>

            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
              {solicitud.estatus || documentoSeleccionado.estatus || 'N/A'}
            </span>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                Paciente
              </p>

              <p className="mt-1 text-lg font-black text-slate-900">
                {solicitud.nombre_paciente || 'N/A'}
              </p>

              <p className="mt-1 text-sm text-slate-600">
                Tel: {solicitud.telefono_paciente || 'N/A'} · Edad:{' '}
                {solicitud.edad_paciente || 'N/A'} · Sexo:{' '}
                {solicitud.sexo_paciente || 'N/A'}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                Total
              </p>

              <p className="mt-1 text-2xl font-black text-sky-700">
                {totalServicio}
              </p>

              <p className="mt-1 text-sm text-slate-600">
                Folio: {solicitud.folio_servicio || documentoSeleccionado.folio || 'N/A'}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 p-4">
              <p className="text-sm font-black text-slate-800">
                Diagnóstico / motivo
              </p>

              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
                {solicitud.diagnostico || 'Sin diagnóstico registrado'}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 p-4">
              <p className="text-sm font-black text-slate-800">
                Observaciones
              </p>

              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
                {solicitud.observaciones || 'Sin observaciones'}
              </p>
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-100">
            <div className="border-b border-slate-100 bg-sky-50 px-4 py-3">
              <p className="text-sm font-black text-sky-800">
                Servicios de la solicitud
              </p>
            </div>

            {detalles.length === 0 ? (
              <div className="p-4 text-sm text-slate-500">
                Para ver el detalle completo, presiona <strong>Reimprimir</strong>.
                Se consultará la solicitud original.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {detalles.map((item, index) => (
                  <div key={item.id_detalle_servicio || index} className="p-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="font-black text-slate-900">
                          {index + 1}. {item.nombre_servicio || 'Servicio clínico'}
                        </p>

                        {item.descripcion && (
                          <p className="mt-1 text-sm text-slate-500">
                            {item.descripcion}
                          </p>
                        )}

                        {item.indicaciones && (
                          <p className="mt-1 text-sm text-slate-600">
                            <strong>Indicaciones:</strong> {item.indicaciones}
                          </p>
                        )}

                        {item.observaciones && (
                          <p className="mt-1 text-sm text-slate-600">
                            <strong>Observaciones:</strong> {item.observaciones}
                          </p>
                        )}
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-sm font-bold text-slate-600">
                          Cantidad: {item.cantidad || 1}
                        </p>

                        <p className="text-sm font-black text-sky-700">
                          {Number(item.subtotal || 0).toLocaleString('es-MX', {
                            style: 'currency',
                            currency: 'MXN',
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-5 rounded-2xl border border-dashed border-sky-200 bg-sky-50 p-4 text-sm text-sky-800">
            Usa <strong>Reimprimir</strong> para generar el comprobante formal del
            servicio clínico con el diseño nuevo.
          </div>
        </div>
      );
    }

    if (
      ['NOTA_MEDICA', 'NOTA_EVOLUCION', 'SERVICIO_RAPIDO'].includes(
        documentoSeleccionado.tipo
      )
    ) {
      const notaImpresion = mapearNotaMedicaParaImpresion(
        documentoSeleccionado
      );

      return (
        <NotaMedicaImprimible
          nota={notaImpresion}
          expediente={pacienteDocumentos}
          perfilDoctor={{
            nombre_completo: notaImpresion.doctor_nombre_completo,
            cedula_profesional: notaImpresion.cedula_profesional,
            especialidad: notaImpresion.especialidad,
          }}
          farmaciaNombre="Farmacia Shaddai"
        />
      );
    }

    if (documentoSeleccionado.tipo === 'CONSENTIMIENTO') {
      const metadata = normalizarMetadata(documentoSeleccionado.metadata);
      const datosConsentimiento =
        mapearConsentimientoParaImpresion(documentoSeleccionado);

      return (
        <ConsentimientoInformadoImprimible
          expediente={{
            ...pacienteDocumentos,

            nombre_paciente:
              pacienteDocumentos?.nombre_paciente ||
              metadata.nombre_paciente ||
              documentoSeleccionado.data?.nombre_paciente,

            primer_apellido:
              pacienteDocumentos?.primer_apellido ||
              metadata.primer_apellido ||
              documentoSeleccionado.data?.primer_apellido,

            segundo_apellido:
              pacienteDocumentos?.segundo_apellido ||
              metadata.segundo_apellido ||
              documentoSeleccionado.data?.segundo_apellido,

            direccion:
              pacienteDocumentos?.direccion ||
              pacienteDocumentos?.domicilio ||
              metadata.domicilio_responsable ||
              metadata.domicilio ||
              metadata.direccion ||
              documentoSeleccionado.data?.domicilio_responsable ||
              documentoSeleccionado.data?.domicilio ||
              documentoSeleccionado.data?.direccion,

            municipio:
              pacienteDocumentos?.municipio ||
              metadata.municipio ||
              documentoSeleccionado.data?.municipio,
          }}
          paciente={pacienteDocumentos}
          perfilDoctor={{
            nombre_completo:
              metadata.medico_responsable ||
              metadata.doctor_nombre_completo ||
              metadata.responsable_nombre ||
              documentoSeleccionado.data?.medico_responsable ||
              documentoSeleccionado.data?.doctor_nombre_completo ||
              documentoSeleccionado.data?.responsable_nombre ||
              pacienteDocumentos?.doctor_nombre ||
              pacienteDocumentos?.medico_responsable ||
              'Doctor Shaddai',

            cedula_profesional:
              metadata.cedula_profesional ||
              metadata.responsable_cedula ||
              documentoSeleccionado.data?.cedula_profesional ||
              documentoSeleccionado.data?.responsable_cedula ||
              pacienteDocumentos?.cedula_profesional ||
              'N/A',

            especialidad:
              metadata.especialidad ||
              documentoSeleccionado.data?.especialidad ||
              pacienteDocumentos?.doctor_especialidad ||
              pacienteDocumentos?.especialidad ||
              'N/A',
          }}
          datos={datosConsentimiento}
        />
      );
    }

    if (documentoSeleccionado.tipo === 'REFERENCIA') {
      const datosReferencia = mapearReferenciaParaImpresion(documentoSeleccionado);

      return (
        <HojaReferenciaContrarreferenciaImprimible
          expediente={{
            ...pacienteDocumentos,
            id_expediente:
              pacienteDocumentos?.id_expediente ||
              datosReferencia.id_expediente ||
              documentoSeleccionado.data?.id_expediente ||
              documentoSeleccionado.metadata?.id_expediente,
          }}
          paciente={pacienteDocumentos}
          perfilDoctor={{
            nombre_completo:
              datosReferencia.medico_refiere ||
              pacienteDocumentos?.doctor_nombre ||
              pacienteDocumentos?.medico_responsable ||
              'Doctor Shaddai',
            cedula_profesional:
              datosReferencia.cedula_profesional ||
              pacienteDocumentos?.cedula_profesional ||
              'N/A',
            especialidad:
              datosReferencia.especialidad ||
              pacienteDocumentos?.doctor_especialidad ||
              pacienteDocumentos?.especialidad ||
              'N/A',
          }}
          datos={datosReferencia}
          tipo="ambas"
        />
      );
    }

    if (documentoSeleccionado.tipo === 'VIOLENCIA_LESION') {
      const datosViolencia = mapearViolenciaParaImpresion(documentoSeleccionado);

      return (
        <HojaViolenciaLesionImprimible
          expediente={{
            ...pacienteDocumentos,
            id_expediente:
              pacienteDocumentos?.id_expediente ||
              datosViolencia.id_expediente ||
              documentoSeleccionado.data?.id_expediente ||
              documentoSeleccionado.metadata?.id_expediente,
          }}
          paciente={pacienteDocumentos}
          perfilDoctor={{
            nombre_completo:
              datosViolencia.responsable_nombre ||
              pacienteDocumentos?.doctor_nombre ||
              pacienteDocumentos?.medico_responsable ||
              'Doctor Shaddai',
            cedula_profesional:
              datosViolencia.responsable_cedula ||
              pacienteDocumentos?.cedula_profesional ||
              'N/A',
            especialidad:
              pacienteDocumentos?.doctor_especialidad ||
              pacienteDocumentos?.especialidad ||
              'N/A',
          }}
          datos={datosViolencia}
        />
      );
    }

    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full border px-3 py-1 text-xs font-black ${tipoDocumentoStyles[documentoSeleccionado.tipo]?.className ||
              'border-slate-200 bg-slate-50 text-slate-700'
              }`}
          >
            {obtenerEtiquetaDocumento(documentoSeleccionado.tipo)}
          </span>

          {documentoSeleccionado.folio && (
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-600">
              {documentoSeleccionado.folio}
            </span>
          )}
        </div>

        <h3 className="text-lg font-black text-slate-800">
          {documentoSeleccionado.titulo ||
            obtenerEtiquetaDocumento(documentoSeleccionado.tipo)}
        </h3>

        <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-2">
          <p>
            <strong>ID documento:</strong>{' '}
            {documentoSeleccionado.id_documento || 'N/A'}
          </p>

          <p>
            <strong>ID origen:</strong>{' '}
            {documentoSeleccionado.id_origen || 'N/A'}
          </p>

          <p>
            <strong>Tipo:</strong>{' '}
            {documentoSeleccionado.tipo || 'N/A'}
          </p>

          <p>
            <strong>Estatus:</strong>{' '}
            {documentoSeleccionado.estatus || 'N/A'}
          </p>

          <p>
            <strong>Tabla origen:</strong>{' '}
            {documentoSeleccionado.tabla_origen || 'N/A'}
          </p>

          <p>
            <strong>Fecha:</strong>{' '}
            {formatearFechaHora(documentoSeleccionado.fecha)}
          </p>
        </div>

        {documentoSeleccionado.data?.descripcion && (
          <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
            <p className="font-bold text-slate-800">Descripción</p>
            <p className="mt-1 whitespace-pre-wrap">
              {documentoSeleccionado.data.descripcion}
            </p>
          </div>
        )}

        {documentoSeleccionado.metadata &&
          Object.keys(documentoSeleccionado.metadata).length > 0 && (
            <div className="mt-4 rounded-2xl bg-slate-50 p-4">
              <p className="mb-2 text-sm font-bold text-slate-800">
                Metadata
              </p>

              <pre className="max-h-80 overflow-auto whitespace-pre-wrap text-xs text-slate-600">
                {JSON.stringify(documentoSeleccionado.metadata, null, 2)}
              </pre>
            </div>
          )}
      </div>
    );
  };

  const verDetalle = (paciente) => {
    const estado = estadoStyles[paciente.estatus] || estadoStyles.EN_ESPERA;
    const tipoAtencion = obtenerTipoAtencion(paciente);

    Swal.fire({
      title: paciente.nombre_paciente,
      html: `
        <div style="text-align:left; font-size:14px; line-height:1.6;">
          <p><strong>Estatus:</strong> ${estado.label}</p>
          <p><strong>Tipo de atención:</strong> ${tipoAtencion.label}</p>
          <p><strong>Acción sugerida:</strong> ${tipoAtencion.accion}</p>
          <p><strong>Teléfono:</strong> ${paciente.telefono || 'No registrado'}</p>
          <p><strong>Motivo:</strong> ${paciente.motivo || 'Sin motivo'}</p>
          <p><strong>Observaciones:</strong> ${paciente.observaciones || 'Sin observaciones'}</p>
          <p><strong>ID expediente:</strong> ${paciente.id_expediente || 'Sin expediente vinculado'}</p>
          <hr style="margin:10px 0;" />
          <p><strong>Hora de registro:</strong> ${formatearFechaHora(paciente.fecha_registro)}</p>
          <p><strong>Inicio atención:</strong> ${formatearFechaHora(paciente.fecha_inicio_atencion)}</p>
          <p><strong>Fin atención:</strong> ${formatearFechaHora(paciente.fecha_fin_atencion)}</p>
          <p><strong>Registrado por:</strong> ${paciente.registrado_por || 'No disponible'}</p>
          <p><strong>Doctor:</strong> ${paciente.doctor_nombre || 'Sin asignar'}</p>
          <p><strong>Sucursal:</strong> ${paciente.sucursal_nombre || 'No asignada'}</p>
        </div>
      `,
      confirmButtonText: 'Cerrar',
    });
  };

  const datosActuales = tab === 'fila' ? fila : historico;

  const datosFiltrados = datosActuales.filter((item) => {
    const tipoAtencion = obtenerTipoAtencion(item);
    console.log("Presentación:", item.presentacion);

    const texto = `${item.nombre_paciente || ''} ${item.telefono || ''} ${item.motivo || ''
      } ${item.estatus || ''} ${item.doctor_nombre || ''} ${item.sucursal_nombre || ''
      } ${item.id_expediente || ''} ${tipoAtencion.label} ${tipoAtencion.accion
      }`.toLowerCase();

    return texto.includes(busqueda.toLowerCase());
  });

  const totalEnEspera = fila.filter(
    (item) => item.estatus === 'EN_ESPERA'
  ).length;

  const totalEnAtencion = fila.filter(
    (item) => item.estatus === 'EN_ATENCION'
  ).length;

  const totalHistorico = historico.length;

  const totalConsultas = fila.filter(
    (item) => item.tipo_atencion === 'CONSULTA_MEDICA'
  ).length;

  const doctorSinSucursales =
    !esSuperAdmin && idsSucursalesDoctor.length === 0;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
              <Stethoscope size={30} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                Fila de espera - Doctor Shaddai
              </h1>
              <p className="text-sm text-slate-500">
                Atiende pacientes enviados desde caja o administración.
              </p>
            </div>
          </div>

          <div className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 shadow-sm">
            <RefreshCw size={17} className={cargando ? 'animate-spin' : ''} />
            Actualización automática
          </div>
        </div>

        {doctorSinSucursales && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
            <div className="flex gap-3">
              <AlertCircle size={22} className="shrink-0" />
              <div>
                <p className="font-bold">No tienes sucursales asignadas</p>
                <p className="text-sm">
                  Para visualizar pacientes en fila, el administrador debe asignarte al menos una sucursal.
                </p>
              </div>
            </div>
          </div>
        )}

        {!doctorSinSucursales && (
          <>
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-yellow-700">
                      En espera
                    </p>
                    <p className="mt-2 text-3xl font-bold text-yellow-800">
                      {totalEnEspera}
                    </p>
                  </div>
                  <Clock className="text-yellow-700" size={32} />
                </div>
              </div>

              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700">
                      En atención
                    </p>
                    <p className="mt-2 text-3xl font-bold text-blue-800">
                      {totalEnAtencion}
                    </p>
                  </div>
                  <PlayCircle className="text-blue-700" size={32} />
                </div>
              </div>

              <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-sky-700">
                      Consultas
                    </p>
                    <p className="mt-2 text-3xl font-bold text-sky-800">
                      {totalConsultas}
                    </p>
                  </div>
                  <FilePlus2 className="text-sky-700" size={32} />
                </div>
              </div>

              <div className="rounded-2xl border border-green-200 bg-green-50 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-700">
                      Histórico
                    </p>
                    <p className="mt-2 text-3xl font-bold text-green-800">
                      {totalHistorico}
                    </p>
                  </div>
                  <ClipboardList className="text-green-700" size={32} />
                </div>
              </div>
            </div>

            <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex rounded-xl bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => setTab('fila')}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${tab === 'fila'
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                      }`}
                  >
                    Pacientes activos
                  </button>

                  <button
                    type="button"
                    onClick={() => setTab('historico')}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${tab === 'historico'
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                      }`}
                  >
                    Histórico
                  </button>
                </div>

                <div className="relative w-full lg:max-w-md">
                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar paciente, teléfono, tipo, motivo o sucursal..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              {cargando && datosActuales.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                  <RefreshCw className="mb-3 animate-spin" size={30} />
                  <p>Cargando pacientes...</p>
                </div>
              ) : datosFiltrados.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                  <AlertCircle className="mb-3" size={34} />
                  <p className="font-medium">
                    {tab === 'fila'
                      ? 'No hay pacientes activos para tus sucursales.'
                      : 'No hay registros en el histórico para tus sucursales.'}
                  </p>
                  <p className="text-sm">
                    {tab === 'fila'
                      ? 'Cuando caja agregue pacientes de tus sucursales, aparecerán aquí.'
                      : 'Las atenciones finalizadas aparecerán en esta sección.'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {datosFiltrados.map((paciente) => {
                    const estado =
                      estadoStyles[paciente.estatus] || estadoStyles.EN_ESPERA;

                    const tipoAtencion = obtenerTipoAtencion(paciente);

                    const enAtencion = paciente.estatus === 'EN_ATENCION';
                    const enEspera = paciente.estatus === 'EN_ESPERA';
                    const tieneExpediente = Boolean(paciente.id_expediente);

                    return (
                      <div
                        key={paciente.id_fila}
                        className={`p-4 transition hover:bg-slate-50 ${enAtencion ? 'bg-blue-50/40' : ''
                          }`}
                      >
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                          <div className="flex gap-4">
                            <div
                              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${enAtencion
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-slate-100 text-slate-600'
                                }`}
                            >
                              <User size={24} />
                            </div>

                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-bold text-slate-800">
                                  {paciente.nombre_paciente}
                                </h3>

                                <span
                                  className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${estado.className}`}
                                >
                                  {estado.label}
                                </span>

                                <span
                                  className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${tipoAtencion.className}`}
                                >
                                  {tipoAtencion.label}
                                </span>

                                {tieneExpediente ? (
                                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                    Expediente #{paciente.id_expediente}
                                  </span>
                                ) : (
                                  <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                                    Sin expediente
                                  </span>
                                )}
                              </div>

                              <div className="mt-2 grid gap-1 text-sm text-slate-500">
                                <p className="flex items-center gap-2">
                                  <Clock size={15} />
                                  Llegada:{' '}
                                  {formatearFechaHora(paciente.fecha_registro)}
                                  {enEspera && (
                                    <span className="font-semibold text-yellow-700">
                                      ({calcularTiempoEspera(paciente.fecha_registro)})
                                    </span>
                                  )}
                                </p>

                                {enAtencion && (
                                  <p className="flex items-center gap-2">
                                    <Timer size={15} />
                                    Tiempo en atención:{' '}
                                    <span className="font-semibold text-blue-700">
                                      {calcularDuracionAtencion(
                                        paciente.fecha_inicio_atencion
                                      )}
                                    </span>
                                  </p>
                                )}

                                {paciente.telefono && (
                                  <p className="flex items-center gap-2">
                                    <Phone size={15} />
                                    {paciente.telefono}
                                  </p>
                                )}

                                <p className="flex items-center gap-2">
                                  <FileText size={15} />
                                  {paciente.motivo || 'Sin motivo'}
                                </p>

                                <p className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                                  <ClipboardList size={14} />
                                  Acción sugerida: {tipoAtencion.accion}
                                </p>

                                {paciente.sucursal_nombre && (
                                  <p className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                                    <Store size={14} />
                                    Sucursal: {paciente.sucursal_nombre}
                                  </p>
                                )}

                                {paciente.registrado_por && (
                                  <p className="text-xs text-slate-400">
                                    Registrado por: {paciente.registrado_por}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 xl:justify-end">
                            <button
                              type="button"
                              onClick={() => verDetalle(paciente)}
                              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                            >
                              Ver detalle
                            </button>

                            {tab === 'historico' && tieneExpediente && (
                              <button
                                type="button"
                                onClick={() => abrirDocumentosAtencion(paciente)}
                                className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-100"
                              >
                                <Files size={16} />
                                Documentos
                              </button>
                            )}

                            {tab === 'fila' && enEspera && (
                              <button
                                type="button"
                                onClick={() => atenderPaciente(paciente)}
                                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                              >
                                <PlayCircle size={16} />
                                Atender
                              </button>
                            )}

                            {tab === 'fila' && enAtencion && !tieneExpediente && (
                              <button
                                type="button"
                                onClick={() => abrirModalExpediente(paciente)}
                                className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
                              >
                                <FolderOpen size={16} />
                                Vincular expediente
                              </button>
                            )}

                            {tab === 'fila' &&
                              enAtencion &&
                              tieneExpediente &&
                              paciente.tipo_atencion === 'CONSULTA_MEDICA' && (
                                <button
                                  type="button"
                                  onClick={() => crearNotaMedica(paciente)}
                                  className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
                                >
                                  <FilePlus2 size={16} />
                                  Nota médica
                                </button>
                              )}

                            {tab === 'fila' &&
                              enAtencion &&
                              tieneExpediente &&
                              paciente.tipo_atencion === 'SERVICIO_RAPIDO' && (
                                <button
                                  type="button"
                                  onClick={() => registrarServicioRapido(paciente)}
                                  className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                                >
                                  <ClipboardList size={16} />
                                  Registrar servicio
                                </button>
                              )}

                            {tab === 'fila' &&
                              enAtencion &&
                              tieneExpediente &&
                              ['SOLO_RECETA', 'CONSULTA_MEDICA'].includes(
                                paciente.tipo_atencion
                              ) && (
                                <button
                                  type="button"
                                  onClick={() => generarReceta(paciente)}
                                  className="inline-flex items-center gap-2 rounded-xl border border-purple-200 bg-purple-50 px-4 py-2 text-sm font-semibold text-purple-700 transition hover:bg-purple-100"
                                >
                                  <Pill size={16} />
                                  Receta
                                </button>
                              )}

                            {tab === 'fila' &&
                              enAtencion &&
                              tieneExpediente &&
                              paciente.tipo_atencion === 'LABORATORIO' && (
                                <button
                                  type="button"
                                  onClick={() => generarLaboratorio(paciente)}
                                  className="inline-flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700 transition hover:bg-orange-100"
                                >
                                  <FlaskConical size={16} />
                                  Laboratorio
                                </button>
                              )}

                            {tab === 'fila' && enAtencion && (
                              <button
                                type="button"
                                onClick={() => finalizarPaciente(paciente)}
                                className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
                              >
                                <CheckCircle2 size={16} />
                                Finalizar
                              </button>
                            )}

                            {tab === 'fila' && enEspera && (
                              <button
                                type="button"
                                onClick={() => marcarNoAsistio(paciente)}
                                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                              >
                                <XCircle size={16} />
                                No asistió
                              </button>
                            )}

                            {tab === 'fila' && (
                              <button
                                type="button"
                                onClick={() => cancelarPaciente(paciente)}
                                className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                              >
                                Cancelar
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>


      {modalDocumentosAbierto && pacienteDocumentos && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="max-h-[94vh] w-full max-w-7xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="text-xl font-black text-slate-800">
                  Documentos de la atención
                </h2>
                <p className="text-sm text-slate-500">
                  {pacienteDocumentos.nombre_paciente} · Expediente #{pacienteDocumentos.id_expediente}
                </p>
              </div>

              <button
                type="button"
                onClick={cerrarModalDocumentos}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid max-h-[calc(94vh-73px)] overflow-hidden lg:grid-cols-[420px_minmax(0,1fr)]">
              <div className="border-r border-slate-100 bg-white p-5">
                <div className="mb-4">
                  <p className="text-sm font-black text-slate-700">
                    Documentos guardados
                  </p>
                  <p className="text-xs text-slate-500">
                    Selecciona un documento para verlo o reimprimirlo.
                  </p>
                </div>

                <div className="max-h-[calc(94vh-150px)] overflow-y-auto pr-1">
                  {cargandoDocumentos ? (
                    <div className="flex flex-col items-center justify-center py-14 text-slate-500">
                      <RefreshCw className="mb-3 animate-spin" size={28} />
                      <p>Consultando documentos...</p>
                    </div>
                  ) : documentosAtencion.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 px-4 py-14 text-center text-slate-500">
                      <AlertCircle className="mb-3" size={34} />
                      <p className="font-bold">Sin documentos registrados</p>
                      <p className="text-sm">
                        No se encontraron documentos guardados para esta atención.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {documentosAtencion.map((doc) => {
                        const docStyle =
                          tipoDocumentoStyles[doc.tipo] ||
                          tipoDocumentoStyles.CONSENTIMIENTO;

                        const activo =
                          documentoSeleccionado?.tipo === doc.tipo &&
                          Number(documentoSeleccionado?.id_documento || documentoSeleccionado?.id) === Number(doc.id_documento || doc.id);

                        return (
                          <button
                            key={`${doc.tipo}-${doc.id_documento || doc.id}`}
                            type="button"
                            onClick={() => setDocumentoSeleccionado(doc)}
                            className={`w-full rounded-2xl border p-4 text-left transition ${activo
                              ? 'border-sky-300 bg-sky-50 shadow-sm'
                              : 'border-slate-200 bg-white hover:bg-slate-50'
                              }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-black text-slate-800">
                                  {doc.titulo}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                  Generado: {formatearFechaHora(doc.fecha)}
                                </p>
                              </div>

                              <span
                                className={`shrink-0 rounded-full border px-2 py-1 text-xs font-bold ${docStyle.className}`}
                              >
                                #{doc.folio || doc.id_documento || doc.id}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex min-h-0 flex-col bg-slate-100">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                  <div>
                    <p className="text-sm font-black text-slate-700">
                      Vista previa
                    </p>
                    <p className="text-xs text-slate-500">
                      Puedes revisar el documento y reimprimirlo.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={!documentoSeleccionado}
                      onClick={() => {
                        if (documentoSeleccionado) {
                          Swal.fire({
                            icon: 'info',
                            title: documentoSeleccionado.titulo,
                            html: `
                              <div style="text-align:left; font-size:14px; line-height:1.6;">
                                <p><strong>ID documento:</strong> ${documentoSeleccionado.id_documento || 'N/A'}</p><p><strong>ID origen:</strong> ${documentoSeleccionado.id_origen || documentoSeleccionado.id || 'N/A'}</p>
                                <p><strong>Tipo:</strong> ${documentoSeleccionado.tipo}</p>
                                <p><strong>Fecha:</strong> ${formatearFechaHora(documentoSeleccionado.fecha)}</p>
                                <p><strong>Paciente:</strong> ${pacienteDocumentos.nombre_paciente}</p>
                                <p><strong>Expediente:</strong> ${pacienteDocumentos.id_expediente}</p>
                              </div>
                            `,
                            confirmButtonText: 'Cerrar',
                          });
                        }
                      }}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Eye size={16} />
                      Ver datos
                    </button>

                    <button
                      type="button"
                      disabled={!documentoSeleccionado}
                      onClick={() => reimprimirDocumento(documentoSeleccionado)}
                      className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <PrinterIcon size={16} />
                      Reimprimir
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-5">
                  <div className="mx-auto w-full max-w-[880px] rounded-2xl bg-white p-4 shadow-sm">
                    {renderDocumentoSeleccionado()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalExpedienteAbierto && pacienteSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Vincular expediente
                </h2>
                <p className="text-sm text-slate-500">
                  Paciente en atención: {pacienteSeleccionado.nombre_paciente}
                </p>
                <p className="text-xs font-semibold text-slate-400">
                  Tipo de atención:{' '}
                  {obtenerTipoAtencion(pacienteSeleccionado).label}
                </p>
              </div>

              <button
                type="button"
                onClick={cerrarModalExpediente}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-600 transition hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="max-h-[calc(92vh-81px)] overflow-y-auto p-6">
              <div className="mb-4 grid gap-3 md:grid-cols-[1fr_auto]">
                <div className="relative">
                  <Search
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    value={busquedaExpediente}
                    onChange={(e) => setBusquedaExpediente(e.target.value)}
                    placeholder="Buscar por nombre, teléfono, correo o CURP..."
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => crearNuevoExpediente(pacienteSeleccionado)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  <Plus size={17} />
                  Crear expediente
                </button>
              </div>

              <div className="rounded-2xl border border-slate-200">
                {cargandoExpedientes ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                    <RefreshCw className="mb-3 animate-spin" size={26} />
                    <p>Buscando expedientes...</p>
                  </div>
                ) : expedientes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                    <AlertCircle className="mb-3" size={30} />
                    <p className="font-semibold">No se encontraron expedientes</p>
                    <p className="text-sm">
                      Puedes crear uno nuevo y después vincularlo a esta atención.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {expedientes.map((expediente) => (
                      <div
                        key={expediente.id_expediente}
                        className="flex flex-col gap-3 p-4 transition hover:bg-slate-50 md:flex-row md:items-center md:justify-between"
                      >
                        <div>
                          <p className="font-bold text-slate-900">
                            {obtenerNombreExpediente(expediente)}
                          </p>
                          <div className="mt-1 grid gap-1 text-sm text-slate-500">
                            <p>ID expediente: {expediente.id_expediente}</p>
                            <p>CURP: {expediente.curp || 'Sin CURP'}</p>
                            <p>Teléfono: {expediente.telefono || 'Sin teléfono'}</p>
                            <p>
                              Edad:{' '}
                              {expediente.edad
                                ? `${expediente.edad} años`
                                : 'No registrada'}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={vinculandoExpediente}
                          onClick={() => vincularExpediente(expediente)}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:opacity-60"
                        >
                          <LinkIcon size={16} />
                          Vincular
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <p className="font-bold">Nota:</p>
                <p>
                  Si el paciente es nuevo, primero crea su expediente clínico.
                  Luego vuelve a esta pantalla y vincula el expediente a la atención actual.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};



function LaboratorioImprimible({ solicitud }) {
  const estudios = solicitud?.estudios || [];

  const fechaTexto = solicitud?.fecha
    ? new Date(solicitud.fecha).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
    : new Date().toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

  const horaObtencionImpresa =
    solicitud?.hora_obtencion_muestra || '____________';

  const horaRecepcionImpresa =
    solicitud?.hora_recepcion_muestra || '____________';

  const textoSeguro = (valor, fallback = 'N/A') => {
    const texto = String(valor ?? '').trim();
    return texto || fallback;
  };

  const obtenerUrlLogo = (ruta) => {
    if (!ruta) return '';

    const valor = String(ruta).trim();

    if (!valor) return '';

    if (
      valor.startsWith('http://') ||
      valor.startsWith('https://') ||
      valor.startsWith('data:') ||
      valor.startsWith('blob:')
    ) {
      return valor;
    }

    const baseURL = api.defaults.baseURL || '';
    const baseSinApi = baseURL.replace(/\/api\/?$/, '');

    if (valor.startsWith('/')) {
      return `${baseSinApi}${valor}`;
    }

    return `${baseSinApi}/${valor}`;
  };

  const logoUniversidadUrl = obtenerUrlLogo(
    solicitud?.medico?.logo_universidad_url ||
    solicitud?.logo_universidad_url ||
    solicitud?.doctor_logo_universidad_url ||
    ''
  );

  return (
    <div id="laboratorio-imprimible" className="lab-print-wrapper">
      <style>
        {`
          #laboratorio-imprimible {
            width: 100%;
            max-width: 204mm;
            margin: 0 auto;
            background: #ffffff;
            color: #0f172a;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 10px;
          }

          #laboratorio-imprimible,
          #laboratorio-imprimible * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          #laboratorio-imprimible .lab-sheet {
            position: relative;
            width: 100%;
            min-height: 267mm;
            overflow: visible;
            border: 1px solid #cbd5e1;
            border-radius: 18px;
            background: #ffffff;
            box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
            display: flex;
            flex-direction: column;
          }

          #laboratorio-imprimible .lab-content {
            position: relative;
            z-index: 1;
            flex: 1;
            min-height: 267mm;
            display: flex;
            flex-direction: column;
          }

          #laboratorio-imprimible .lab-decor-one,
          #laboratorio-imprimible .lab-decor-two {
            position: absolute;
            border-radius: 999px;
            pointer-events: none;
            z-index: 0;
          }

          #laboratorio-imprimible .lab-decor-one {
            top: -70px;
            right: -70px;
            width: 190px;
            height: 190px;
            background: rgba(207, 250, 254, 0.75);
            filter: blur(16px);
          }

          #laboratorio-imprimible .lab-decor-two {
            bottom: -90px;
            left: -90px;
            width: 230px;
            height: 230px;
            background: rgba(224, 242, 254, 0.8);
            filter: blur(18px);
          }

          #laboratorio-imprimible .lab-header {
            display: grid;
            grid-template-columns: 116px 1fr 142px;
            align-items: center;
            gap: 12px;
            padding: 12px 15px;
            border-bottom: 1px solid #dbeafe;
            background: linear-gradient(90deg, #ecfeff 0%, #ffffff 50%, #f0f9ff 100%);
          }

          #laboratorio-imprimible .lab-logos {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          #laboratorio-imprimible .lab-logo-box {
            width: 46px;
            height: 46px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid #dbeafe;
            border-radius: 14px;
            background: #ffffff;
            box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
          }

          #laboratorio-imprimible .lab-logo-box img {
            width: 38px;
            height: 38px;
            object-fit: contain;
          }

          #laboratorio-imprimible .lab-title {
            text-align: center;
            line-height: 1.12;
          }

          #laboratorio-imprimible .lab-title .name {
            font-size: 17px;
            font-weight: 900;
            letter-spacing: 1.3px;
            text-transform: uppercase;
            color: #020617;
          }

          #laboratorio-imprimible .lab-title .doc {
            margin-top: 3px;
            font-size: 10px;
            font-weight: 900;
            letter-spacing: 2.4px;
            text-transform: uppercase;
            color: #0e7490;
          }

          #laboratorio-imprimible .lab-title .sub {
            margin-top: 4px;
            font-size: 8px;
            font-weight: 700;
            color: #64748b;
          }

          #laboratorio-imprimible .lab-folio {
            min-height: 50px;
            border: 1px solid #dbeafe;
            border-radius: 14px;
            background: #ffffff;
            padding: 7px 9px;
            text-align: center;
            box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
          }

          #laboratorio-imprimible .lab-folio .label {
            font-size: 7px;
            font-weight: 900;
            letter-spacing: 1.8px;
            text-transform: uppercase;
            color: #64748b;
          }

          #laboratorio-imprimible .lab-folio .folio {
            margin-top: 4px;
            font-size: 10px;
            font-weight: 900;
            color: #0e7490;
            word-break: break-word;
          }

          #laboratorio-imprimible .lab-folio .date {
            margin-top: 3px;
            font-size: 8px;
            font-weight: 700;
            color: #64748b;
          }

          #laboratorio-imprimible .lab-body {
            flex: 1;
            display: grid;
            grid-template-columns: 0.92fr 1.08fr;
            gap: 11px;
            padding: 12px 15px 8px;
            align-items: stretch;
            min-height: 0;
          }

          #laboratorio-imprimible .lab-column {
            display: flex;
            flex-direction: column;
            gap: 10px;
            min-height: 0;
          }

          #laboratorio-imprimible .lab-card {
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            background: #ffffff;
            padding: 10px 11px;
            box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
            break-inside: avoid;
          }

          #laboratorio-imprimible .lab-card.soft {
            background: rgba(248, 250, 252, 0.82);
          }

          #laboratorio-imprimible .lab-card.cyan {
            border-color: #bae6fd;
            background: rgba(236, 254, 255, 0.72);
          }

          #laboratorio-imprimible .lab-card-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            padding-bottom: 6px;
            margin-bottom: 7px;
            border-bottom: 1px solid #e2e8f0;
          }

          #laboratorio-imprimible .lab-card-title {
            margin: 0;
            font-size: 9.5px;
            font-weight: 900;
            letter-spacing: 1.3px;
            text-transform: uppercase;
            color: #1e293b;
          }

          #laboratorio-imprimible .lab-pill {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 999px;
            padding: 3px 8px;
            background: #cffafe;
            color: #0e7490;
            font-size: 7.5px;
            font-weight: 900;
            white-space: nowrap;
          }

          #laboratorio-imprimible .lab-pill.green {
            background: #d1fae5;
            color: #047857;
          }

          #laboratorio-imprimible .lab-text {
            margin: 0;
            line-height: 1.35;
            color: #1e293b;
            font-size: 9.5px;
          }

          #laboratorio-imprimible .lab-text strong {
            font-weight: 900;
            color: #0f172a;
          }

          #laboratorio-imprimible .lab-grid-data {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 3px 10px;
          }

          #laboratorio-imprimible .span-2 {
            grid-column: span 2;
          }

          #laboratorio-imprimible .lab-sample-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 9px;
          }

          #laboratorio-imprimible .lab-sample-box {
            border: 1px solid #bae6fd;
            border-radius: 12px;
            background: #ffffff;
            padding: 8px;
            min-height: 46px;
          }

          #laboratorio-imprimible .lab-sample-box .label {
            display: block;
            margin-bottom: 4px;
            font-size: 7.5px;
            font-weight: 900;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            color: #0e7490;
          }

          #laboratorio-imprimible .lab-sample-box .value {
            font-size: 10px;
            font-weight: 800;
            color: #0f172a;
          }

          #laboratorio-imprimible .lab-diagnosis-card {
            flex: 1;
            display: flex;
            flex-direction: column;
            min-height: 0;
          }

          #laboratorio-imprimible .lab-diagnosis-box {
            flex: 1;
            min-height: 185px;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            background: #f8fafc;
            padding: 9px 10px;
            white-space: pre-wrap;
            line-height: 1.35;
            font-size: 9.5px;
            color: #1e293b;
          }

          #laboratorio-imprimible .lab-studies-card {
            flex: 1;
            display: flex;
            flex-direction: column;
            min-height: 0;
          }

          #laboratorio-imprimible .lab-studies-list {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 7px;
          }

          #laboratorio-imprimible .lab-study-card {
            display: grid;
            grid-template-columns: 22px 1fr;
            gap: 8px;
            align-items: start;
            border: 1px solid #e2e8f0;
            border-radius: 13px;
            background: #f8fafc;
            padding: 8px 9px;
            break-inside: avoid;
          }

          #laboratorio-imprimible .lab-study-number {
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

          #laboratorio-imprimible .lab-study-name {
            margin: 0;
            font-size: 9.5px;
            line-height: 1.25;
            font-weight: 900;
            color: #0f172a;
          }

          #laboratorio-imprimible .lab-study-observation {
            margin: 3px 0 0;
            font-size: 8.5px;
            line-height: 1.25;
            color: #475569;
          }

          #laboratorio-imprimible .lab-empty {
            border: 1px dashed #cbd5e1;
            border-radius: 13px;
            background: #f8fafc;
            padding: 14px;
            text-align: center;
            font-size: 9.5px;
            font-weight: 800;
            color: #64748b;
          }

          #laboratorio-imprimible .lab-observations-box {
            min-height: 118px;
            white-space: pre-wrap;
            line-height: 1.35;
            font-size: 9.5px;
            color: #334155;
          }

          #laboratorio-imprimible .lab-signature-grid {
            margin-top: auto;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }

          #laboratorio-imprimible .lab-signature-card,
          #laboratorio-imprimible .lab-seal-card {
            min-height: 86px;
            border: 1px solid #e2e8f0;
            border-radius: 15px;
            background: #ffffff;
            padding: 10px;
            text-align: center;
          }

          #laboratorio-imprimible .lab-signature-line {
            width: 80%;
            height: 1px;
            margin: 30px auto 7px;
            background: #475569;
          }

          #laboratorio-imprimible .lab-signature-title {
            margin: 0;
            font-size: 8.5px;
            font-weight: 900;
            color: #0f172a;
          }

          #laboratorio-imprimible .lab-signature-sub {
            margin: 2px 0 0;
            font-size: 7.5px;
            color: #64748b;
          }

          #laboratorio-imprimible .lab-seal-card {
            display: flex;
            align-items: center;
            justify-content: center;
            border-style: dashed;
            background: rgba(236, 254, 255, 0.5);
            color: #0e7490;
            font-size: 8.5px;
            font-weight: 900;
          }

          #laboratorio-imprimible .lab-footer {
            margin-top: auto;
            padding: 6px 15px 10px;
            text-align: center;
            font-size: 7.5px;
            color: #94a3b8;
          }

          @media print {
            #laboratorio-imprimible {
              width: 204mm !important;
              max-width: 204mm !important;
              margin: 0 !important;
              padding: 0 !important;
              overflow: visible !important;
            }

            #laboratorio-imprimible .lab-sheet {
              min-height: 267mm !important;
              height: auto !important;
              max-height: none !important;
              overflow: visible !important;
              border-radius: 0 !important;
              box-shadow: none !important;
              page-break-after: auto !important;
              break-after: auto !important;
            }

            #laboratorio-imprimible .lab-content {
              min-height: 267mm !important;
              height: auto !important;
            }

            #laboratorio-imprimible .lab-body {
              flex: 1 !important;
              align-items: stretch !important;
            }

            #laboratorio-imprimible .lab-decor-one,
            #laboratorio-imprimible .lab-decor-two {
              display: none !important;
            }
          }
        `}
      </style>

      <div className="lab-sheet">
        <div className="lab-decor-one" />
        <div className="lab-decor-two" />

        <div className="lab-content">
          <header className="lab-header">
            <div className="lab-logos">
              <div className="lab-logo-box">
                <img src={logoFarmacia} alt="Farmacias Shaddai" />
              </div>

              {logoUniversidadUrl && (
                <div className="lab-logo-box">
                  <img src={logoUniversidadUrl} alt="Logo universidad" />
                </div>
              )}
            </div>

            <div className="lab-title">
              <div className="name">Farmacias Shaddai</div>
              <div className="doc">Solicitud de laboratorio</div>
              <div className="sub">Doctor Shaddai · Bienestar al alcance de todos</div>
            </div>

            <div className="lab-folio">
              <div className="label">Folio</div>
              <div className="folio">{textoSeguro(solicitud?.folio, 'LAB-SIN-FOLIO')}</div>
              <div className="date">{fechaTexto}</div>
            </div>
          </header>

          <main className="lab-body">
            <div className="lab-column">
              <section className="lab-card soft">
                <div className="lab-card-header">
                  <h2 className="lab-card-title">Médico solicitante</h2>
                  <span className="lab-pill">Área médica</span>
                </div>

                <p className="lab-text">
                  <strong>Nombre:</strong> {textoSeguro(solicitud?.medico?.nombre, 'Doctor Shaddai')}
                </p>
                <p className="lab-text">
                  <strong>Institución:</strong> Farmacias Shaddai
                </p>
                <p className="lab-text">
                  <strong>Especialidad:</strong> {textoSeguro(solicitud?.medico?.especialidad)}
                </p>
                <p className="lab-text">
                  <strong>Cédula:</strong> {textoSeguro(solicitud?.medico?.cedula)}
                </p>
              </section>

              <section className="lab-card">
                <div className="lab-card-header">
                  <h2 className="lab-card-title">Paciente</h2>
                  <span className="lab-pill green">
                    Exp. #{textoSeguro(solicitud?.paciente?.expediente, 'N/A')}
                  </span>
                </div>

                <div className="lab-grid-data">
                  <p className="lab-text span-2">
                    <strong>Paciente:</strong> {textoSeguro(solicitud?.paciente?.nombre)}
                  </p>
                  <p className="lab-text">
                    <strong>Edad:</strong> {textoSeguro(solicitud?.paciente?.edad)}
                  </p>
                  <p className="lab-text">
                    <strong>Sexo:</strong> {textoSeguro(solicitud?.paciente?.sexo)}
                  </p>
                  <p className="lab-text">
                    <strong>Fecha:</strong> {fechaTexto}
                  </p>
                  <p className="lab-text">
                    <strong>Expediente:</strong> {textoSeguro(solicitud?.paciente?.expediente)}
                  </p>
                </div>
              </section>

              <section className="lab-card cyan">
                <div className="lab-card-header">
                  <h2 className="lab-card-title">Datos de muestra</h2>
                </div>

                <div className="lab-sample-grid">
                  <div className="lab-sample-box">
                    <span className="label">Hr. obtención</span>
                    <span className="value">{horaObtencionImpresa}</span>
                  </div>

                  <div className="lab-sample-box">
                    <span className="label">Hr. recepción</span>
                    <span className="value">{horaRecepcionImpresa}</span>
                  </div>
                </div>
              </section>

              <section className="lab-card lab-diagnosis-card">
                <div className="lab-card-header">
                  <h2 className="lab-card-title">Diagnóstico / impresión diagnóstica</h2>
                </div>

                <div className="lab-diagnosis-box">
                  {textoSeguro(solicitud?.diagnostico)}
                </div>
              </section>
            </div>

            <div className="lab-column">
              <section className="lab-card lab-studies-card">
                <div className="lab-card-header">
                  <h2 className="lab-card-title">Estudios solicitados</h2>
                  <span className="lab-pill">{estudios.length} estudio(s)</span>
                </div>

                <div className="lab-studies-list">
                  {estudios.length === 0 ? (
                    <div className="lab-empty">Sin estudios registrados.</div>
                  ) : (
                    estudios.map((item, index) => (
                      <div key={item.id_estudio || index} className="lab-study-card">
                        <div className="lab-study-number">{index + 1}</div>

                        <div>
                          <p className="lab-study-name">
                            {textoSeguro(item.nombre || item.nombre_estudio || item.estudio, 'Estudio')}
                          </p>

                          {(item.observaciones_estudio || item.observaciones) && (
                            <p className="lab-study-observation">
                              <strong>Observaciones:</strong>{' '}
                              {item.observaciones_estudio || item.observaciones}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section className="lab-card">
                <div className="lab-card-header">
                  <h2 className="lab-card-title">Observaciones generales</h2>
                </div>

                <div className="lab-observations-box">
                  {textoSeguro(solicitud?.observaciones, 'Sin observaciones')}
                </div>
              </section>

              <section className="lab-signature-grid">
                <div className="lab-signature-card">
                  <div className="lab-signature-line" />
                  <p className="lab-signature-title">Firma del médico</p>
                  <p className="lab-signature-sub">
                    {textoSeguro(solicitud?.medico?.nombre, '')}
                  </p>
                  <p className="lab-signature-sub">
                    Cédula: {textoSeguro(solicitud?.medico?.cedula)}
                  </p>
                </div>

                <div className="lab-seal-card">Sello de la unidad</div>
              </section>
            </div>
          </main>

          <div className="lab-footer">
            Documento clínico interno · FSL-LAB-001-26
          </div>
        </div>
      </div>
    </div>
  );
}


function RecetaImprimible({ recetaGenerada, fechaActual, perfilDoctor }) {
  const paciente = recetaGenerada?.paciente || {};
  const productos = recetaGenerada?.productos || [];
  const receta = recetaGenerada?.receta || {};
  const expediente = recetaGenerada?.expediente || null;

  const folio =
    receta.folio_receta ||
    receta.folio ||
    (receta.id_receta ? `RX-${receta.id_receta}` : 'Vista previa');

  return (
    <div
      id="receta-imprimible"
      className="mx-auto w-full max-w-5xl bg-white text-slate-900 print:max-w-none"
    >
      <div className="relative mx-auto h-[5.25in] max-h-[5.25in] w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-300 bg-white shadow-sm print:h-[5.15in] print:max-h-[5.15in] print:rounded-none print:border-0 print:shadow-none">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-sky-100/60 blur-2xl print:hidden" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-cyan-100/60 blur-2xl print:hidden" />

        <div className="relative grid grid-cols-[88px_1fr_170px] items-center gap-4 border-b border-slate-200 bg-gradient-to-r from-sky-50 via-white to-cyan-50 px-6 py-4 print:grid-cols-[76px_1fr_155px] print:px-4 print:py-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-white p-2 shadow-sm print:h-14 print:w-14">
            <img
              src={logoFarmacia}
              alt="Farmacias Shaddai"
              className="h-full w-full object-contain"
            />
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
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
              Folio
            </p>

            <p className="mt-1 break-words text-sm font-black text-slate-950 print:text-xs">
              {folio}
            </p>

            <p className="mt-1 text-[10px] font-semibold text-slate-500">
              {fechaActual}
            </p>
          </div>
        </div>

        <div className="relative px-6 py-4 print:px-4 print:py-3">
          <div className="grid gap-3 text-[11px] md:grid-cols-[0.92fr_1.08fr] print:grid-cols-[0.92fr_1.08fr]">
            <div className="space-y-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 print:bg-white">
                <div className="mb-2 flex items-center justify-between gap-2 border-b border-slate-200 pb-1.5">
                  <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-800">
                    Médico
                  </h3>

                  <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[9px] font-bold text-sky-700 print:border print:border-slate-200 print:bg-white">
                    Doctor Shaddai
                  </span>
                </div>

                <div className="space-y-0.5 leading-tight">
                  <p>
                    <strong>Nombre:</strong>{' '}
                    {perfilDoctor?.nombre_completo || 'Doctor Shaddai'}
                  </p>

                  <p>
                    <strong>Institución:</strong> Farmacias Shaddai
                  </p>

                  <p>
                    <strong>Especialidad:</strong>{' '}
                    {perfilDoctor?.especialidad || 'N/A'}
                  </p>

                  <p>
                    <strong>Cédula:</strong>{' '}
                    {perfilDoctor?.cedula_profesional || 'N/A'}
                  </p>

                  <p className="line-clamp-2">
                    <strong>Domicilio:</strong>{' '}
                    {perfilDoctor?.direccion_consultorio || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-3">
                <div className="mb-2 flex items-center justify-between gap-2 border-b border-slate-200 pb-1.5">
                  <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-800">
                    Paciente
                  </h3>

                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-700 print:border print:border-slate-200 print:bg-white">
                    {expediente?.id_expediente
                      ? `Exp. #${expediente.id_expediente}`
                      : 'Sin expediente'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 leading-tight">
                  <p className="col-span-2">
                    <strong>Paciente:</strong>{' '}
                    {paciente.nombre_paciente || paciente.nombre || 'N/A'}
                  </p>

                  <p>
                    <strong>Tel:</strong> {paciente.telefono || 'N/A'}
                  </p>

                  <p>
                    <strong>Edad:</strong> {paciente.edad || 'N/A'}
                  </p>

                  <p>
                    <strong>Sexo:</strong> {paciente.sexo || 'N/A'}
                  </p>

                  <p>
                    <strong>Fecha:</strong> {fechaActual}
                  </p>
                </div>
              </div>

              {expediente && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3 text-[10px] print:bg-white">
                  <h3 className="mb-1.5 text-[10px] font-black uppercase tracking-wider text-amber-800 print:text-slate-800">
                    Antecedentes relevantes
                  </h3>

                  <div className="space-y-0.5 leading-tight">
                    <p className="line-clamp-1">
                      <strong>Condiciones:</strong>{' '}
                      {expediente.enfermedades_condiciones || 'Sin registro'}
                    </p>

                    <p className="line-clamp-1">
                      <strong>Alergias:</strong>{' '}
                      {expediente.alergias || 'Sin registro'}
                    </p>

                    <p className="line-clamp-1">
                      <strong>Medicamentos actuales:</strong>{' '}
                      {expediente.medicamentos_actuales || 'Sin registro'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-3">
                <h3 className="mb-1.5 text-[11px] font-black uppercase tracking-wider text-slate-800">
                  Diagnóstico
                </h3>

                <div className="min-h-9 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-[11px] leading-tight print:bg-white">
                  {paciente.diagnostico || receta.diagnostico || 'Sin diagnóstico registrado'}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-3">
                <div className="mb-2 flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-800">
                    Prescripción
                  </h3>

                  <span className="text-[9px] font-bold text-slate-400">
                    {productos.length} producto(s)
                  </span>
                </div>

                <div className="space-y-2">
                  {productos.slice(0, 4).map((item, index) => (
                    <div
                      key={`${item.id_producto || item.id_detalle || index}`}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-2 print:bg-white"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[11px] font-black leading-tight text-slate-900">
                            {index + 1}.{' '}
                            {item.nombre ||
                              item.nombre_producto ||
                              item.producto ||
                              'Medicamento'}
                          </p>


                        </div>

                        <div className="rounded-lg bg-sky-100 px-2 py-1 text-center text-[10px] font-black text-sky-800 print:border print:border-slate-200 print:bg-white print:text-slate-900">
                          x{item.cantidad || item.cantidad_recetada || 1}
                        </div>
                      </div>

                      <div className="mt-1 grid grid-cols-3 gap-1 text-[9.5px] leading-tight text-slate-700">
                        <p>
                          <strong>Dosis:</strong> {item.dosis || '-'}
                        </p>

                        <p>
                          <strong>Frecuencia:</strong> {item.frecuencia || '-'}
                        </p>

                        <p>
                          <strong>Duración:</strong> {item.duracion || '-'}
                        </p>
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
                      + {productos.length - 4} producto(s) adicional(es)
                      registrado(s) en el sistema.
                    </p>
                  )}
                </div>
              </div>

              {(paciente.observaciones || receta.observaciones) && (
                <div className="rounded-2xl border border-slate-200 bg-white p-3">
                  <h3 className="mb-1 text-[10px] font-black uppercase tracking-wider text-slate-800">
                    Observaciones
                  </h3>

                  <p className="line-clamp-2 text-[10px] leading-tight text-slate-700">
                    {paciente.observaciones || receta.observaciones}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-8 text-center text-[10px]">
            <div>
              <div className="mx-auto mb-1.5 h-px w-48 bg-slate-500" />
              <p className="font-black">Firma del médico</p>
              <p className="text-slate-500">
                {perfilDoctor?.nombre_completo || ''}
              </p>
            </div>

            <div>
              <div className="mx-auto mb-1.5 h-px w-48 bg-slate-500" />
              <p className="font-black">Cédula profesional</p>
              <p className="text-slate-500">
                {perfilDoctor?.cedula_profesional || ''}
              </p>
            </div>
          </div>

          <p className="mt-3 text-center text-[9px] text-slate-400">
            Documento generado desde el módulo Doctor Shaddai.
          </p>
        </div>
      </div>
    </div>
  );
}

export default DoctorFilaEspera;