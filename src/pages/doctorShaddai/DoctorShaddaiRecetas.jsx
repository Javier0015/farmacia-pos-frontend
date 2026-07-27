import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Swal from 'sweetalert2';


import {
  Search,
  Plus,
  Trash2,
  FileText,
  UserRound,
  Phone,
  ClipboardList,
  Send,
  Loader2,
  Minus,
  PlusCircle,
  AlertTriangle,
  Printer,
  X,
  ClipboardPlus,
  UserCheck,
  Eye,
  BadgeCheck,
  ShieldAlert,
  RefreshCw,
  FlaskConical,
} from 'lucide-react';

import api from '../../api/axios';
import logoFarmacia from '../../assets/logoShaddai.png';
import ModalSolicitudLaboratorio from '../../components/doctores/ModalSolicitudLaboratorio';
import ModalNotaMedica from '../../components/doctores/ModalNotaMedica';
import NotaMedicaImprimible from '../../components/doctores/NotaMedicaImprimible';
import { notasMedicasService } from '../../services/notasMedicasService';
import ModalConsentimientoInformado from '../../components/doctores/ModalConsentimientoInformado';
import ModalHojaViolenciaLesion from '../../components/doctores/ModalHojaViolenciaLesion';
import ModalReferenciaContrarreferencia from '../../components/doctores/ModalReferenciaContrarreferencia';
import ModalServicioClinico from '../../components/doctores/ModalServicioClinico';
import ModalCertificadoMedico from '../../components/doctores/ModalCertificadoMedico';

const pacienteInicial = {
  nombre_paciente: '',
  telefono: '',
  edad: '',
  sexo: '',
  diagnostico: '',
  observaciones: '',
};

const medicamentoLibreInicial = {
  nombre: '',
  nombre_generico: '',
  presentacion: '',
  forma_farmaceutica: '',
  cantidad: 1,
  dosis: '',
  frecuencia: '',
  duracion: '',
  indicaciones: '',
};

const ESTATUS_TEXTO = {
  PENDIENTE: 'Pendiente validación',
  ATENDIDA: 'Atendida',
  PENDIENTE_CAJERO: 'Pendiente cajero',
  SURTIDA_PARCIAL: 'Surtida parcialmente',
  SURTIDA: 'Surtida completa',
  RECHAZADA: 'Rechazada',
  CANCELADA: 'Cancelada',
  VISTA_PREVIA: 'Vista previa',
};

const ESTATUS_CLASES = {
  PENDIENTE: 'bg-amber-100 text-amber-700',
  ATENDIDA: 'bg-sky-100 text-sky-700',
  PENDIENTE_CAJERO: 'bg-amber-100 text-amber-700',
  SURTIDA_PARCIAL: 'bg-orange-100 text-orange-700',
  SURTIDA: 'bg-emerald-100 text-emerald-700',
  RECHAZADA: 'bg-red-100 text-red-700',
  CANCELADA: 'bg-slate-200 text-slate-600',
  VISTA_PREVIA: 'bg-slate-100 text-slate-600',
};

const TIPOS_ATENCION_INFO = {
  CONSULTA_MEDICA: {
    value: 'CONSULTA_MEDICA',
    label: 'Consulta médica',
    titulo: 'Atención médica',
    descripcion: 'Registra la consulta mediante una nota médica. Puedes continuar con receta, laboratorio y cierre de atención; si falta la nota quedará como pendiente.',
    siguientePaso: 'Crear nota médica de la consulta',
    badgeClass: 'bg-sky-100 text-sky-700 border-sky-200',
    panelClass: 'border-sky-200 bg-sky-50 text-sky-800',
  },
  SERVICIO_RAPIDO: {
    value: 'SERVICIO_RAPIDO',
    label: 'Servicio clínico rápido',
    titulo: 'Servicio clínico rápido',
    descripcion: 'Registra el procedimiento realizado, como inyección, curación, toma de presión o glucosa.',
    siguientePaso: 'Puedes agregar el producto o servicio en la receta.',
    badgeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    panelClass: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  },
  SOLO_RECETA: {
    value: 'SOLO_RECETA',
    label: 'Solo receta',
    titulo: 'Generar receta',
    descripcion: 'Captura un diagnóstico o indicación breve y genera la receta para que caja pueda surtirla.',
    siguientePaso: 'Generar receta',
    badgeClass: 'bg-purple-100 text-purple-700 border-purple-200',
    panelClass: 'border-purple-200 bg-purple-50 text-purple-800',
  },
  LABORATORIO: {
    value: 'LABORATORIO',
    label: 'Laboratorio',
    titulo: 'Solicitud de laboratorio',
    descripcion: 'Captura la indicación clínica y genera una solicitud de estudios de laboratorio.',
    siguientePaso: 'Generar solicitud de laboratorio',
    badgeClass: 'bg-orange-100 text-orange-700 border-orange-200',
    panelClass: 'border-orange-200 bg-orange-50 text-orange-800',
  },
};

const normalizarTipoAtencion = (tipoAtencion) => {
  const tipo = String(tipoAtencion || '').trim().toUpperCase();

  return TIPOS_ATENCION_INFO[tipo] ? tipo : 'SOLO_RECETA';
};

const obtenerInfoTipoAtencion = (tipoAtencion) => {
  return TIPOS_ATENCION_INFO[normalizarTipoAtencion(tipoAtencion)];
};


const TIPOS_NOTA_INFO = {
  NOTA_INICIAL: {
    value: 'NOTA_INICIAL',
    label: 'Nota médica inicial',
    descripcion: 'Primera nota registrada para este expediente.',
  },
  NOTA_EVOLUCION: {
    value: 'NOTA_EVOLUCION',
    label: 'Nota de evolución',
    descripcion: 'Nota de seguimiento para una visita posterior.',
  },
};

const normalizarTipoNota = (tipoNota) => {
  const tipo = String(tipoNota || '').trim().toUpperCase();

  return TIPOS_NOTA_INFO[tipo] ? tipo : 'NOTA_INICIAL';
};

const obtenerInfoTipoNota = (tipoNota) => {
  return TIPOS_NOTA_INFO[normalizarTipoNota(tipoNota)];
};

const obtenerUrlArchivo = (ruta) => {
  if (!ruta) return '';

  if (ruta.startsWith('http://') || ruta.startsWith('https://')) {
    return ruta;
  }

  const baseURL = api.defaults.baseURL || '';
  const baseSinApi = baseURL.replace(/\/api\/?$/, '');

  if (ruta.startsWith('/')) {
    return `${baseSinApi}${ruta}`;
  }

  return `${baseSinApi}/${ruta}`;
};

const obtenerNombreCompletoPaciente = (expediente = {}) => {
  return [
    expediente.nombre_paciente,
    expediente.primer_apellido,
    expediente.segundo_apellido,
  ]
    .map((parte) => String(parte || '').trim())
    .filter(Boolean)
    .join(' ');
};

export default function DoctorShaddaiRecetas() {
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();

  const idExpedienteUrl = searchParams.get('id_expediente');
  const idFilaUrl = searchParams.get('id_fila');
  const tipoAtencionUrl = normalizarTipoAtencion(searchParams.get('tipo_atencion'));

  const [paciente, setPaciente] = useState(pacienteInicial);

  const [perfilDoctor, setPerfilDoctor] = useState(null);
  const [perfilDoctorCompleto, setPerfilDoctorCompleto] = useState(false);
  const [cargandoPerfil, setCargandoPerfil] = useState(true);

  const [busquedaExpediente, setBusquedaExpediente] = useState('');
  const [expedientes, setExpedientes] = useState([]);
  const [cargandoExpedientes, setCargandoExpedientes] = useState(false);
  const [expedienteSeleccionado, setExpedienteSeleccionado] = useState(null);

  const [busqueda, setBusqueda] = useState('');
  const [productos, setProductos] = useState([]);
  const [cargandoProductos, setCargandoProductos] = useState(false);
  const [mostrarResultadosProductos, setMostrarResultadosProductos] = useState(false);
  const [productoStockAbierto, setProductoStockAbierto] = useState(null);
  const contenedorBusquedaProductosRef = useRef(null);

  const [receta, setReceta] = useState([]);
  const [enviando, setEnviando] = useState(false);

  const [mostrarFormularioMedicamentoLibre, setMostrarFormularioMedicamentoLibre] = useState(false);
  const [medicamentoLibre, setMedicamentoLibre] = useState(medicamentoLibreInicial);

  const [modalRecetaAbierto, setModalRecetaAbierto] = useState(false);
  const [recetaGenerada, setRecetaGenerada] = useState(null);

  const [modalLaboratorioAbierto, setModalLaboratorioAbierto] = useState(false);

  const [recetasDoctor, setRecetasDoctor] = useState([]);
  const [cargandoRecetasDoctor, setCargandoRecetasDoctor] = useState(false);

  const [modalSeguimientoAbierto, setModalSeguimientoAbierto] = useState(false);
  const [recetaSeguimiento, setRecetaSeguimiento] = useState(null);
  const [detalleSeguimiento, setDetalleSeguimiento] = useState([]);
  const [cargandoSeguimiento, setCargandoSeguimiento] = useState(false);


  const [notaMedicaGuardada, setNotaMedicaGuardada] = useState(false);
  const [notaMedicaActual, setNotaMedicaActual] = useState(null);
  const [modalNotaMedicaAbierto, setModalNotaMedicaAbierto] = useState(false);
  const [notasExpediente, setNotasExpediente] = useState([]);
  const [cargandoNotasExpediente, setCargandoNotasExpediente] = useState(false);
  const [modalHistorialNotasAbierto, setModalHistorialNotasAbierto] = useState(false);

  const [servicioRapidoGuardado, setServicioRapidoGuardado] = useState(false);
  const [modalServicioClinicoAbierto, setModalServicioClinicoAbierto] = useState(false);
  const [servicioClinicoActual, setServicioClinicoActual] = useState(null);

  const totalProductosReceta = receta.length;

  const [modalConsentimientoAbierto, setModalConsentimientoAbierto] = useState(false);
  const [modalViolenciaLesionAbierto, setModalViolenciaLesionAbierto] = useState(false);

  const totalPiezas = useMemo(() => {
    return receta.reduce((acc, item) => acc + Number(item.cantidad || 0), 0);
  }, [receta]);

  const esAtencionDesdeFila = Boolean(idExpedienteUrl && idFilaUrl);

  const tipoAtencionActual = useMemo(() => {
    return obtenerInfoTipoAtencion(tipoAtencionUrl);
  }, [tipoAtencionUrl]);

  const mostrarFlujoAtencion = esAtencionDesdeFila;

  const requiereNotaMedica =
    mostrarFlujoAtencion && tipoAtencionActual.value === 'CONSULTA_MEDICA';

  const requiereServicioRapido =
    mostrarFlujoAtencion && tipoAtencionActual.value === 'SERVICIO_RAPIDO';

  const notasPreviasDelExpediente = useMemo(() => {
    return notasExpediente.filter((nota) => Boolean(nota?.id_nota));
  }, [notasExpediente]);

  const tipoNotaSugerido = notasPreviasDelExpediente.length > 0 ? 'NOTA_EVOLUCION' : 'NOTA_INICIAL';
  const tipoNotaInfo = obtenerInfoTipoNota(tipoNotaSugerido);
  /*
   * La nota médica se recomienda para la consulta, pero no bloquea el resto
   * de la atención. Los servicios rápidos, recetas y laboratorio no requieren
   * nota médica para continuar.
   */
  const notaMedicaPendiente =
    requiereNotaMedica && !notaMedicaGuardada;

  const [modalImprimirNotaAbierto, setModalImprimirNotaAbierto] = useState(false);
  const [notaParaImprimir, setNotaParaImprimir] = useState(null);

  const [modalReferenciaAbierto, setModalReferenciaAbierto] = useState(false);

  const [modalCertificadoAbierto, setModalCertificadoAbierto] = useState(false);


  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';

    const texto = String(fecha).trim();
    const fechaSimple = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);

    let valor;

    if (fechaSimple) {
      const [, anio, mes, dia] = fechaSimple;

      valor = new Date(
        Date.UTC(
          Number(anio),
          Number(mes) - 1,
          Number(dia),
          12,
          0,
          0
        )
      );
    } else {
      valor = new Date(texto);
    }

    if (Number.isNaN(valor.getTime())) return 'N/A';

    return new Intl.DateTimeFormat('es-MX', {
      timeZone: 'America/Mexico_City',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(valor);
  };

  const obtenerFechaActual = () => {
    return new Date().toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: '2-digit',
    });
  };

  const cargarExpedientePorId = async (idExpediente) => {
    try {
      setCargandoExpedientes(true);

      const { data } = await api.get(`/doctor-shaddai/expedientes/${idExpediente}`);

      if (!data.ok || !data.expediente) {
        throw new Error(data.mensaje || 'No se encontró el expediente.');
      }

      const expediente = data.expediente;

      setExpedienteSeleccionado(expediente);
      setBusquedaExpediente(
        [expediente.nombre_paciente, expediente.primer_apellido, expediente.segundo_apellido]
          .filter(Boolean)
          .join(' ') || expediente.nombre_paciente || ''
      );

      setPaciente({
        nombre_paciente: obtenerNombreCompletoPaciente(expediente),
        primer_apellido: expediente.primer_apellido || '',
        segundo_apellido: expediente.segundo_apellido || '',
        telefono: expediente.telefono || '',
        edad: expediente.edad || '',
        sexo: expediente.sexo || '',
        diagnostico: '',
        observaciones: expediente.observaciones_generales || '',
      });

      cargarNotasExpediente(expediente.id_expediente);

      Swal.fire({
        icon: 'success',
        title: 'Expediente cargado',
        text: `Atención lista para ${expediente.nombre_paciente}.`,
        timer: 1600,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error('Error al cargar expediente por URL:', error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          error.message ||
          'No se pudo cargar el expediente vinculado.',
      });
    } finally {
      setCargandoExpedientes(false);
    }
  };

  const cargarPerfilDoctor = async () => {
    try {
      setCargandoPerfil(true);

      const { data } = await api.get('/doctor-shaddai/mi-perfil');

      const perfil = data.perfil || null;

      setPerfilDoctor(perfil);

      const completo =
        perfil?.perfil_completo === true &&
        perfil?.nombre_completo &&
        perfil?.cedula_profesional &&
        perfil?.especialidad;

      setPerfilDoctorCompleto(Boolean(completo));
    } catch (error) {
      console.error('Error al cargar perfil Doctor Shaddai:', error);
      setPerfilDoctor(null);
      setPerfilDoctorCompleto(false);
    } finally {
      setCargandoPerfil(false);
    }
  };

  const abrirSolicitudLaboratorio = () => {
    if (!perfilDoctorCompleto) {
      Swal.fire({
        icon: 'warning',
        title: 'Perfil médico incompleto',
        text: 'Debes completar tu perfil de Doctor Shaddai antes de generar solicitudes de laboratorio.',
        showCancelButton: true,
        confirmButtonText: 'Ir a mi perfil',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#0284c7',
      }).then((result) => {
        if (result.isConfirmed) {
          navigate('/app/doctor-shaddai/perfil');
        }
      });

      return;
    }
    if (!expedienteSeleccionado?.id_expediente) {
      Swal.fire({
        icon: 'warning',
        title: 'Expediente requerido',
        text: 'Selecciona un expediente clínico antes de crear una solicitud.',
      });

      return;
    }



    setModalLaboratorioAbierto(true);
  };


  const abrirCertificadoMedico = () => {
    if (!perfilDoctorCompleto) {
      Swal.fire({
        icon: 'warning',
        title: 'Perfil médico incompleto',
        text: 'Debes completar tu perfil de Doctor Shaddai antes de generar certificados médicos.',
        showCancelButton: true,
        confirmButtonText: 'Ir a mi perfil',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#0284c7',
      }).then((result) => {
        if (result.isConfirmed) {
          navigate('/app/doctor-shaddai/perfil');
        }
      });

      return;
    }

    if (!expedienteSeleccionado?.id_expediente) {
      Swal.fire({
        icon: 'warning',
        title: 'Expediente requerido',
        text: 'Selecciona un expediente clínico antes de generar el certificado.',
      });

      return;
    }

    setModalCertificadoAbierto(true);
  };

  const guardarSolicitudLaboratorio = async (solicitud) => {
    try {


      const payload = {
        id_paciente_expediente:
          expedienteSeleccionado?.id_expediente ||
          Number(idExpedienteUrl) ||
          null,

        id_fila: idFilaUrl ? Number(idFilaUrl) : null,

        id_sucursal: expedienteSeleccionado?.id_sucursal || null,

        tipo_atencion: tipoAtencionActual.value,

        medico: {
          nombre_completo:
            solicitud?.medico?.nombre ||
            perfilDoctor?.nombre_completo ||
            null,

          cedula_profesional:
            solicitud?.medico?.cedula ||
            perfilDoctor?.cedula_profesional ||
            null,

          especialidad:
            solicitud?.medico?.especialidad ||
            perfilDoctor?.especialidad ||
            null,

          telefono:
            solicitud?.medico?.telefono ||
            solicitud?.medico?.medico_telefono ||
            solicitud?.medico?.doctor_telefono ||
            perfilDoctor?.telefono ||
            perfilDoctor?.medico_telefono ||
            perfilDoctor?.doctor_telefono ||
            perfilDoctor?.telefono_doctor ||
            perfilDoctor?.telefono_contacto ||
            perfilDoctor?.telefono_consultorio ||
            perfilDoctor?.celular ||
            null,
        },

        paciente: {
          nombre_paciente:
            paciente.nombre_paciente ||
            solicitud?.paciente?.nombre ||
            '',
          telefono: paciente.telefono || null,
          edad: paciente.edad ? Number(paciente.edad) : null,
          sexo: paciente.sexo || null,
        },

        diagnostico: solicitud.diagnostico || paciente.diagnostico || '',
        observaciones: solicitud.observaciones || paciente.observaciones || null,

        hora_obtencion_muestra: solicitud.hora_obtencion_muestra || null,
        hora_recepcion_muestra: solicitud.hora_recepcion_muestra || null,

        estudios: (solicitud.estudios || []).map((item) => ({
          id_estudio: item.id_estudio || null,
          nombre: item.nombre || item.nombre_estudio,
          observaciones_estudio: item.observaciones_estudio || null,
        })),
      };

      const { data } = await api.post('/laboratorio/solicitudes', payload);

      if (data.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Solicitud guardada',
          html: `
            <p>La solicitud de laboratorio se guardó correctamente.</p>
            <p><strong>Folio:</strong> ${data.solicitud?.folio || 'N/A'}</p>
          `,
          timer: 1800,
          showConfirmButton: false,
        });

        return data;
      }

      throw new Error(data.mensaje || 'No se pudo guardar la solicitud.');
    } catch (error) {
      console.error('Error al guardar solicitud de laboratorio:', error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          error.message ||
          'No se pudo guardar la solicitud de laboratorio.',
      });

      throw error;
    }
  };

  const cargarRecetasDoctor = async () => {
    try {
      setCargandoRecetasDoctor(true);

      const { data } = await api.get('/doctor-shaddai/recetas', {
        params: { estatus: 'PENDIENTE_CAJERO' }
      });

      setRecetasDoctor(data.recetas || []);
    } catch (error) {
      console.error('Error al cargar recetas del doctor:', error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudieron cargar las recetas enviadas.',
      });
    } finally {
      setCargandoRecetasDoctor(false);
    }
  };

  const buscarExpedientes = async (texto = '') => {
    try {
      setCargandoExpedientes(true);

      const { data } = await api.get('/doctor-shaddai/expedientes', {
        params: {
          busqueda: texto,
        },
      });

      setExpedientes(data.expedientes || []);
    } catch (error) {
      console.error('Error al buscar expedientes:', error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudieron buscar los expedientes clínicos.',
      });
    } finally {
      setCargandoExpedientes(false);
    }
  };

  const buscarProductos = async (texto = '') => {
    try {
      setCargandoProductos(true);

      const { data } = await api.get('/inventario/stock-sucursales', {
        params: {
          nombre: texto,
        },
      });

      const lista =
        data.productos ||
        data.inventario ||
        data.stock ||
        data.resultados ||
        data.data ||
        data.items ||
        [];

      const normalizados = lista.map((item) => ({
        id_producto:
          item.id_producto ||
          item.id ||
          item.producto_id ||
          item.id_inventario ||
          item.id_producto_fk,

        id_sucursal: item.id_sucursal || item.sucursal_id || item.idSucursal || null,

        nombre:
          item.nombre_producto ||
          item.nombre ||
          item.producto ||
          item.descripcion_producto ||
          'Producto sin nombre',

        nombre_generico:
          item.nombre_generico || item.generico || item.denominacion_generica || '',

        forma_farmaceutica: item.forma_farmaceutica || item.forma || item.tipo_forma || '',

        presentacion: item.presentacion || item.descripcion || '',

        codigo_barras: item.codigo_barras || item.codigo || item.codigo_barra || item.clave || '',

        sucursal:
          item.nombre_sucursal ||
          item.sucursal ||
          item.nombreSucursal ||
          item.sucursal_nombre ||
          'Sucursal',

        stock: Number(
          item.stock_disponible ??
          item.stock ??
          item.cantidad ??
          item.existencia ??
          item.total_stock ??
          0
        ),

        precio: Number(
          item.precio_venta ??
          item.precio ??
          item.precio_publico ??
          item.precio_unitario ??
          0
        ),

        lote: item.lote || item.numero_lote || item.nombre_lote || '',

        fecha_caducidad:
          item.fecha_caducidad || item.caducidad || item.fecha_vencimiento || null,

        raw: item,
      }));

      const productosAgrupados = Object.values(
        normalizados.reduce((acc, item) => {
          const key = item.id_producto || `${item.codigo_barras}-${item.nombre}`;

          if (!acc[key]) {
            acc[key] = {
              id_producto: item.id_producto,
              nombre: item.nombre,
              nombre_generico: item.nombre_generico,
              forma_farmaceutica: item.forma_farmaceutica,
              presentacion: item.presentacion,
              codigo_barras: item.codigo_barras,
              precio: item.precio,
              stock_total: 0,
              stock: 0,
              sucursales: [],
              raw: item.raw,
            };
          }

          acc[key].stock_total += Number(item.stock || 0);
          acc[key].stock = acc[key].stock_total;

          acc[key].sucursales.push({
            id_sucursal: item.id_sucursal,
            sucursal: item.sucursal,
            stock: Number(item.stock || 0),
            lote: item.lote,
            fecha_caducidad: item.fecha_caducidad,
          });

          return acc;
        }, {})
      );

      setProductos(productosAgrupados);
    } catch (error) {
      console.error('Error al buscar productos:', error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudieron consultar los productos del inventario.',
      });
    } finally {
      setCargandoProductos(false);
    }
  };

  const verSeguimientoReceta = async (recetaItem) => {
    if (!recetaItem?.id_receta) return;

    try {
      setCargandoSeguimiento(true);
      setModalSeguimientoAbierto(true);
      setRecetaSeguimiento(recetaItem);
      setDetalleSeguimiento([]);

      const { data } = await api.get(`/doctor-shaddai/recetas/${recetaItem.id_receta}`);

      if (data.ok) {
        setRecetaSeguimiento(data.receta || recetaItem);
        setDetalleSeguimiento(data.detalles || []);
      }
    } catch (error) {
      console.error('Error al cargar seguimiento de receta:', error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudo cargar el detalle de seguimiento de la receta.',
      });

      setModalSeguimientoAbierto(false);
    } finally {
      setCargandoSeguimiento(false);
    }
  };

  const cerrarModalSeguimiento = () => {
    setModalSeguimientoAbierto(false);
    setRecetaSeguimiento(null);
    setDetalleSeguimiento([]);
  };

  const cargarNotasExpediente = async (idExpediente) => {
    if (!idExpediente) {
      setNotasExpediente([]);
      return;
    }

    try {
      setCargandoNotasExpediente(true);

      const data = await notasMedicasService.listarNotasPorExpediente(idExpediente);

      if (data.ok) {
        setNotasExpediente(data.notas || []);
      } else {
        setNotasExpediente([]);
      }
    } catch (error) {
      console.error('Error al cargar historial de notas médicas:', error);
      setNotasExpediente([]);
    } finally {
      setCargandoNotasExpediente(false);
    }
  };

  const cargarNotaMedicaPorFila = async () => {
    if (!idFilaUrl) return;

    try {
      const data = await notasMedicasService.obtenerNotaPorFila(idFilaUrl);

      if (data.ok && data.existe && data.nota) {
        setNotaMedicaActual(data.nota);
        setNotaMedicaGuardada(true);
      } else {
        setNotaMedicaActual(null);
        setNotaMedicaGuardada(false);
      }
    } catch (error) {
      console.error('Error al consultar nota médica de la atención:', error);
    }
  };

  useEffect(() => {
    if (!idExpedienteUrl) return;

    cargarExpedientePorId(idExpedienteUrl);
  }, [idExpedienteUrl]);

  useEffect(() => {
    if (!idFilaUrl) return;

    cargarNotaMedicaPorFila();
  }, [idFilaUrl]);

  useEffect(() => {
    if (!expedienteSeleccionado?.id_expediente) return;

    cargarNotasExpediente(expedienteSeleccionado.id_expediente);
  }, [expedienteSeleccionado?.id_expediente]);

  useEffect(() => {
    cargarPerfilDoctor();
    cargarRecetasDoctor();
  }, []);

  useEffect(() => {
    const texto = busqueda.trim();

    const timer = setTimeout(() => {
      if (texto.length >= 2) {
        setMostrarResultadosProductos(true);
        buscarProductos(texto);
      } else {
        setProductos([]);
        setMostrarResultadosProductos(false);
        setProductoStockAbierto(null);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [busqueda]);

  useEffect(() => {
    const manejarClickFuera = (event) => {
      if (
        contenedorBusquedaProductosRef.current &&
        !contenedorBusquedaProductosRef.current.contains(event.target)
      ) {
        setMostrarResultadosProductos(false);
        setProductoStockAbierto(null);
      }
    };

    const manejarEscape = (event) => {
      if (event.key === 'Escape') {
        setMostrarResultadosProductos(false);
        setProductoStockAbierto(null);
      }
    };

    document.addEventListener('mousedown', manejarClickFuera);
    document.addEventListener('keydown', manejarEscape);

    return () => {
      document.removeEventListener('mousedown', manejarClickFuera);
      document.removeEventListener('keydown', manejarEscape);
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (busquedaExpediente.trim().length >= 2) {
        buscarExpedientes(busquedaExpediente.trim());
      } else {
        setExpedientes([]);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [busquedaExpediente]);

  const seleccionarExpediente = (expediente) => {
    setExpedienteSeleccionado(expediente);
    setBusquedaExpediente(
      [expediente.nombre_paciente, expediente.primer_apellido, expediente.segundo_apellido]
        .filter(Boolean)
        .join(' ') || expediente.nombre_paciente || ''
    );

    setPaciente({
      nombre_paciente: obtenerNombreCompletoPaciente(expediente),
      primer_apellido: expediente.primer_apellido || '',
      segundo_apellido: expediente.segundo_apellido || '',
      telefono: expediente.telefono || '',
      edad: expediente.edad || '',
      sexo: expediente.sexo || '',
      diagnostico: '',
      observaciones: expediente.observaciones_generales || '',
    });

    cargarNotasExpediente(expediente.id_expediente);

    Swal.fire({
      icon: 'success',
      title: 'Expediente seleccionado',
      text: `Se cargaron los datos de ${expediente.nombre_paciente}.`,
      timer: 1500,
      showConfirmButton: false,
    });
  };

  const handlePacienteChange = (e) => {
    const { name, value } = e.target;

    setPaciente((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const generarIdItemReceta = (prefijo = 'ITEM') => {
    return `${prefijo}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  };

  const productoYaAgregado = (producto) => {
    return receta.some(
      (item) =>
        item.tipo_producto_receta === 'INVENTARIO' &&
        Number(item.id_producto) === Number(producto.id_producto)
    );
  };

  const agregarProducto = (producto) => {
    if (!producto.id_producto) {
      Swal.fire({
        icon: 'warning',
        title: 'Producto inválido',
        text: 'No se pudo identificar el producto seleccionado.',
      });

      return;
    }

    const stockTotal = Number(producto.stock_total || producto.stock || 0);

    if (productoYaAgregado(producto)) {
      Swal.fire({
        icon: 'info',
        title: 'Producto ya agregado',
        text: 'Este producto ya se encuentra en la receta.',
        timer: 1400,
        showConfirmButton: false,
      });

      return;
    }

    const nuevoItem = {
      id_item: `INV-${producto.id_producto}`,

      // La receta representa la prescripción médica; el stock se valida al surtir en caja.
      tipo_producto_receta: 'INVENTARIO',
      producto_libre: false,
      disponible_inventario: stockTotal > 0,

      id_producto: producto.id_producto,
      id_sucursal: null,
      nombre: producto.nombre,
      nombre_generico: producto.nombre_generico || '',
      forma_farmaceutica: producto.forma_farmaceutica || '',
      presentacion: producto.presentacion || '',
      codigo_barras: producto.codigo_barras || null,
      sucursal: null,
      stock: stockTotal,
      precio: Number(producto.precio || 0),
      lote: null,
      fecha_caducidad: null,
      cantidad: 1,
      dosis: '',
      frecuencia: '',
      duracion: '',
      indicaciones: '',
      disponibilidad_sucursales: producto.sucursales || [],
    };

    setReceta((prev) => [...prev, nuevoItem]);
    setBusqueda('');
    setProductos([]);
    setMostrarResultadosProductos(false);
    setProductoStockAbierto(null);
  };

  const manejarCambioMedicamentoLibre = (event) => {
    const { name, value } = event.target;

    setMedicamentoLibre((prev) => ({
      ...prev,
      [name]: name === 'cantidad' ? value.replace(/[^\d]/g, '') : value,
    }));
  };

  const cancelarMedicamentoLibre = () => {
    setMedicamentoLibre(medicamentoLibreInicial);
    setMostrarFormularioMedicamentoLibre(false);
  };

  const agregarMedicamentoLibre = () => {
    if (!expedienteSeleccionado?.id_expediente) {
      Swal.fire({
        icon: 'warning',
        title: 'Expediente requerido',
        text: 'Selecciona un expediente clínico antes de agregar un medicamento libre.',
      });

      return;
    }

    const nombre = medicamentoLibre.nombre.trim();
    const cantidad = Number(medicamentoLibre.cantidad || 0);

    if (!nombre) {
      Swal.fire({
        icon: 'warning',
        title: 'Medicamento requerido',
        text: 'Captura el nombre del medicamento.',
      });

      return;
    }

    if (!cantidad || cantidad < 1) {
      Swal.fire({
        icon: 'warning',
        title: 'Cantidad inválida',
        text: 'Indica una cantidad mayor o igual a 1.',
      });

      return;
    }

    const nuevoMedicamentoLibre = {
      id_item: generarIdItemReceta('LIBRE'),

      tipo_producto_receta: 'LIBRE',
      producto_libre: true,
      disponible_inventario: false,

      id_producto: null,
      id_sucursal: null,
      nombre,
      nombre_generico: medicamentoLibre.nombre_generico.trim(),
      forma_farmaceutica: medicamentoLibre.forma_farmaceutica.trim(),
      presentacion: medicamentoLibre.presentacion.trim(),
      codigo_barras: null,
      sucursal: null,
      stock: 0,
      precio: 0,
      lote: null,
      fecha_caducidad: null,
      cantidad,
      dosis: medicamentoLibre.dosis.trim(),
      frecuencia: medicamentoLibre.frecuencia.trim(),
      duracion: medicamentoLibre.duracion.trim(),
      indicaciones: medicamentoLibre.indicaciones.trim(),
      disponibilidad_sucursales: [],
    };

    setReceta((prev) => [...prev, nuevoMedicamentoLibre]);
    cancelarMedicamentoLibre();

    Swal.fire({
      icon: 'success',
      title: 'Medicamento libre agregado',
      text: 'Se agregará a la receta, pero no podrá cobrarse ni surtirse automáticamente desde inventario.',
      timer: 1700,
      showConfirmButton: false,
    });
  };

  const actualizarItemReceta = (idItem, campo, valor) => {
    setReceta((prev) =>
      prev.map((item) => {
        if (item.id_item !== idItem) {
          return item;
        }

        if (campo === 'cantidad') {
          const cantidad = Number(valor);

          return {
            ...item,
            cantidad: !cantidad || cantidad < 1 ? 1 : cantidad,
          };
        }

        return {
          ...item,
          [campo]: valor,
        };
      })
    );
  };

  const aumentarCantidad = (item) => {
    actualizarItemReceta(item.id_item, 'cantidad', Number(item.cantidad) + 1);
  };

  const disminuirCantidad = (item) => {
    actualizarItemReceta(item.id_item, 'cantidad', Number(item.cantidad) - 1);
  };

  const eliminarProductoReceta = (itemEliminar) => {
    setReceta((prev) =>
      prev.filter((item) => item.id_item !== itemEliminar.id_item)
    );
  };

  const limpiarReceta = async () => {
    if (receta.length === 0 && !paciente.nombre_paciente && !expedienteSeleccionado) {
      setPaciente(pacienteInicial);
      return;
    }

    const result = await Swal.fire({
      icon: 'warning',
      title: '¿Limpiar receta?',
      text: 'Se eliminarán los datos capturados en esta receta.',
      showCancelButton: true,
      confirmButtonText: 'Sí, limpiar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
    });

    if (!result.isConfirmed) return;

    setReceta([]);
    setBusqueda('');
    setProductos([]);
    setRecetaGenerada(null);
    setMedicamentoLibre(medicamentoLibreInicial);
    setMostrarFormularioMedicamentoLibre(false);
  };

  const validarPerfilDoctor = () => {
    if (cargandoPerfil) {
      Swal.fire({
        icon: 'info',
        title: 'Validando perfil',
        text: 'Espera un momento mientras validamos tu perfil médico.',
      });

      return false;
    }

    if (!perfilDoctorCompleto) {
      Swal.fire({
        icon: 'warning',
        title: 'Perfil médico incompleto',
        text: 'Debes completar tu perfil de Doctor Shaddai antes de generar recetas.',
        showCancelButton: true,
        confirmButtonText: 'Ir a mi perfil',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#0284c7',
      }).then((result) => {
        if (result.isConfirmed) {
          navigate('/app/doctor-shaddai/perfil');
        }
      });

      return false;
    }

    return true;
  };

  const validarReceta = ({ validarPerfil = true } = {}) => {
    if (validarPerfil && !validarPerfilDoctor()) {
      return false;
    }

    if (!expedienteSeleccionado?.id_expediente) {
      Swal.fire({
        icon: 'warning',
        title: 'Expediente requerido',
        text: 'Selecciona un expediente clínico antes de generar la receta.',
      });

      return false;
    }

    if (receta.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Receta vacía',
        text: 'Agrega al menos un producto a la receta.',
      });

      return false;
    }

    const productoSinIndicaciones = receta.find(
      (item) =>
        !String(item.dosis || '').trim() &&
        !String(item.frecuencia || '').trim() &&
        !String(item.duracion || '').trim() &&
        !String(item.indicaciones || '').trim()
    );

    if (productoSinIndicaciones) {
      Swal.fire({
        icon: 'warning',
        title: 'Indicaciones incompletas',
        text: `Agrega indicaciones para ${productoSinIndicaciones.nombre}.`,
      });

      return false;
    }

    return true;
  };

  const prepararPayload = () => {
    const diagnosticoFinal =
      paciente.diagnostico?.trim() ||
      notaMedicaActual?.diagnostico ||
      notaMedicaActual?.impresion_diagnostica ||
      null;

    const observacionesFinal =
      paciente.observaciones?.trim() ||
      notaMedicaActual?.observaciones ||
      notaMedicaActual?.plan_tratamiento ||
      null;

    return {
      id_paciente_expediente:
        expedienteSeleccionado?.id_expediente ||
        Number(idExpedienteUrl) ||
        null,

      // Lo dejamos por compatibilidad si tu backend antiguo lo usa
      id_fila_atencion: idFilaUrl ? Number(idFilaUrl) : null,

      // Este es el importante para documentos_clinicos
      id_fila: idFilaUrl ? Number(idFilaUrl) : null,

      id_sucursal:
        expedienteSeleccionado?.id_sucursal ||
        null,

      id_nota: notaMedicaActual?.id_nota || null,
      tipo_atencion: tipoAtencionActual.value,

      paciente: {
        nombre_paciente: paciente.nombre_paciente.trim(),
        telefono: paciente.telefono?.trim() || null,
        edad: paciente.edad ? Number(paciente.edad) : null,
        sexo: paciente.sexo || null,
        diagnostico: diagnosticoFinal,
        observaciones: observacionesFinal,
      },

      diagnostico: diagnosticoFinal,
      observaciones: observacionesFinal,

      productos: receta.map((item) => ({
        id_item: item.id_item,
        tipo_producto_receta: item.tipo_producto_receta || 'INVENTARIO',
        producto_libre: Boolean(item.producto_libre),
        disponible_inventario: Boolean(item.disponible_inventario),

        // Los medicamentos libres no se relacionan con el catálogo ni inventario.
        id_producto: item.producto_libre ? null : item.id_producto,
        id_sucursal: null,
        nombre: String(item.nombre || '').trim(),
        nombre_generico: String(item.nombre_generico || '').trim() || null,
        forma_farmaceutica: String(item.forma_farmaceutica || '').trim() || null,
        presentacion: String(item.presentacion || '').trim() || null,
        codigo_barras: item.producto_libre ? null : item.codigo_barras || null,
        sucursal: null,
        stock: Number(item.stock || 0),
        precio: item.producto_libre ? 0 : Number(item.precio || 0),
        lote: null,
        fecha_caducidad: null,
        cantidad: Number(item.cantidad || 1),
        dosis: String(item.dosis || '').trim() || null,
        frecuencia: String(item.frecuencia || '').trim() || null,
        duracion: String(item.duracion || '').trim() || null,
        indicaciones: String(item.indicaciones || '').trim() || null,
      })),
    };
  };

  const abrirVistaPrevia = () => {
    if (!validarReceta({ validarPerfil: false })) return;

    setRecetaGenerada({
      receta: {
        id_receta: null,
        folio_receta: null,
        estatus: 'VISTA_PREVIA',
        fecha_creacion: new Date().toISOString(),
      },
      detalles: [],
      doctor: perfilDoctor,
      paciente: {
        ...paciente,
      },
      productos: receta,
      expediente: expedienteSeleccionado,
    });

    setModalRecetaAbierto(true);
  };

  const enviarReceta = async () => {
    if (!validarReceta({ validarPerfil: true })) return;

    try {
      setEnviando(true);

      const payload = prepararPayload();

      const { data } = await api.post('/doctor-shaddai/recetas', payload);

      if (data.ok) {
        const recetaCompleta = {
          receta: data.receta,
          detalles: data.detalles || [],
          doctor: {
            ...(perfilDoctor || {}),
            ...(data.doctor || {}),
            logo_universidad_url:
              data.doctor?.logo_universidad_url ||
              perfilDoctor?.logo_universidad_url ||
              null,
          },
          paciente: {
            ...paciente,
          },
          productos: receta,
          expediente: expedienteSeleccionado,
        };

        setRecetaGenerada(recetaCompleta);
        setModalRecetaAbierto(true);

        Swal.fire({
          icon: 'success',
          title: 'Receta generada',
          html: `
            <p>La receta se guardó correctamente.</p>
            <p><strong>Folio:</strong> ${data.receta?.folio_receta || data.receta?.id_receta || 'N/A'
            }</p>
            <p>Quedó con estatus <strong>PENDIENTE_CAJERO</strong>.</p>
          `,
          timer: 1800,
          showConfirmButton: false,
        });

        await cargarRecetasDoctor();
      }
    } catch (error) {
      console.error('Error al generar receta:', error);

      if (error.response?.data?.codigo === 'PERFIL_DOCTOR_INCOMPLETO') {
        Swal.fire({
          icon: 'warning',
          title: 'Perfil médico incompleto',
          text:
            error.response?.data?.mensaje ||
            'Debes completar tu perfil de Doctor Shaddai antes de generar recetas.',
          showCancelButton: true,
          confirmButtonText: 'Ir a mi perfil',
          cancelButtonText: 'Cancelar',
          confirmButtonColor: '#0284c7',
        }).then((result) => {
          if (result.isConfirmed) {
            navigate('/app/doctor-shaddai/perfil');
          }
        });

        return;
      }

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.mensaje || 'No se pudo generar la receta.',
      });
    } finally {
      setEnviando(false);
    }
  };

  const abrirNotaMedicaPendiente = () => {
    if (!expedienteSeleccionado?.id_expediente) {
      Swal.fire({
        icon: 'warning',
        title: 'Expediente requerido',
        text: 'Primero debe cargarse o vincularse un expediente clínico.',
        confirmButtonColor: '#0284c7',
      });

      return;
    }

    if (notaMedicaGuardada) {
      abrirNotaParaImprimir(notaMedicaActual);
      return;
    }

    setModalNotaMedicaAbierto(true);
  };

  const manejarNotaMedicaGuardada = (nota) => {
    const notaConTipo = {
      ...(nota || {}),
      tipo_nota: normalizarTipoNota(nota?.tipo_nota),
    };

    setNotaMedicaActual(notaConTipo);
    setNotaMedicaGuardada(true);
    setModalNotaMedicaAbierto(false);

    if (notaConTipo?.id_expediente) {
      cargarNotasExpediente(notaConTipo.id_expediente);
    }
  };

  const registrarServicioRapidoPendiente = () => {
    if (!perfilDoctorCompleto) {
      Swal.fire({
        icon: 'warning',
        title: 'Perfil médico incompleto',
        text: 'Debes completar tu perfil de Doctor Shaddai antes de registrar servicios clínicos.',
        showCancelButton: true,
        confirmButtonText: 'Ir a mi perfil',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#0284c7',
      }).then((result) => {
        if (result.isConfirmed) {
          navigate('/app/doctor-shaddai/perfil');
        }
      });

      return;
    }

    if (!expedienteSeleccionado?.id_expediente) {
      Swal.fire({
        icon: 'warning',
        title: 'Expediente requerido',
        text: 'Selecciona o carga un expediente clínico antes de registrar el servicio.',
        confirmButtonColor: '#0284c7',
      });

      return;
    }

    setModalServicioClinicoAbierto(true);
  };

  const manejarServicioClinicoGuardado = async (data) => {
    setServicioClinicoActual(data?.solicitud || null);
    setServicioRapidoGuardado(true);
    setModalServicioClinicoAbierto(false);

    Swal.fire({
      icon: 'success',
      title: 'Servicio enviado a caja',
      html: `
        <p>El servicio clínico se registró correctamente.</p>
        <p><strong>Folio:</strong> ${data?.solicitud?.folio_servicio || 'N/A'}</p>
        <p>Quedó con estatus <strong>PENDIENTE_CAJERO</strong>.</p>
      `,
      timer: 1800,
      showConfirmButton: false,
    });
  };

  const finalizarAtencionDesdeFila = async () => {
    if (!idFilaUrl) return;

    const notaQuedaraPendiente = notaMedicaPendiente;

    const result = await Swal.fire({
      icon: notaQuedaraPendiente ? 'warning' : 'question',
      title: notaQuedaraPendiente
        ? 'Finalizar con nota médica pendiente'
        : 'Finalizar atención',
      html: notaQuedaraPendiente
        ? `
          <div style="text-align:left">
            <p>La consulta se puede finalizar, pero quedará marcada con una nota médica pendiente.</p>
            <p style="margin-top:8px">Podrás completarla después desde el expediente o desde el historial de notas.</p>
          </div>
        `
        : '¿Deseas marcar esta atención como finalizada?',
      showCancelButton: true,
      confirmButtonText: notaQuedaraPendiente
        ? 'Finalizar y dejar pendiente'
        : 'Sí, finalizar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: notaQuedaraPendiente ? '#d97706' : '#16a34a',
    });

    if (!result.isConfirmed) return;

    try {
      const { data } = await api.put(`/doctor-fila/${idFilaUrl}/finalizar`);

      if (!data.ok) {
        throw new Error(data.mensaje || 'No se pudo finalizar la atención.');
      }

      await Swal.fire({
        icon: 'success',
        title: notaQuedaraPendiente
          ? 'Atención finalizada con nota pendiente'
          : 'Atención finalizada',
        text: notaQuedaraPendiente
          ? 'La nota médica podrá completarse posteriormente desde el expediente.'
          : 'Regresando a la fila de espera...',
        timer: 1800,
        showConfirmButton: false,
      });

      navigate('/app/doctor-shaddai/fila-espera');
    } catch (error) {
      console.error('Error al finalizar atención:', error);

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

  const cerrarModalReceta = () => {
    setModalRecetaAbierto(false);
  };

  const limpiarDespuesDeGuardar = () => {
    setReceta([]);
    setBusqueda('');
    setProductos([]);
    setRecetaGenerada(null);
    setModalRecetaAbierto(false);
  };

  const imprimirReceta = () => {
    window.print();
  };

  const abrirNotaParaImprimir = (nota) => {
    if (!nota?.id_nota) {
      Swal.fire({
        icon: 'warning',
        title: 'Nota no disponible',
        text: 'No se pudo cargar la nota médica seleccionada.',
        confirmButtonColor: '#0284c7',
      });

      return;
    }

    setNotaParaImprimir(nota);
    setModalImprimirNotaAbierto(true);
  };

  const imprimirNotaMedica = () => {
    setTimeout(() => {
      const imprimible = document.getElementById('nota-medica-imprimible');

      if (!imprimible) {
        Swal.fire({
          icon: 'error',
          title: 'No se encontró la nota',
          text: 'No se pudo preparar la nota médica para impresión.',
        });

        return;
      }

      window.print();
    }, 250);
  };

  return (
    <>
      <style>
        {`
    @media print {
      body * {
        visibility: hidden !important;
      }

      #receta-imprimible,
      #receta-imprimible *,
      #nota-medica-imprimible,
      #nota-medica-imprimible * {
        visibility: visible !important;
      }

      #receta-imprimible {
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        height: auto !important;
        min-height: auto !important;
        max-height: none !important;
        padding: 0 !important;
        margin: 0 !important;
        background: white !important;
        overflow: hidden !important;
      }

      #receta-imprimible > div {
        min-height: auto !important;
        height: auto !important;
        max-height: none !important;
        overflow: hidden !important;
      }

      #nota-medica-imprimible {
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        height: auto !important;
        min-height: 100vh !important;
        max-height: none !important;
        padding: 0 !important;
        margin: 0 !important;
        background: white !important;
        overflow: visible !important;
      }

      .no-print {
        display: none !important;
      }

      @page {
        size: letter portrait;
        margin: 6mm;
      }
    }
  `}
      </style>

      <div className="space-y-6">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-700 via-cyan-600 to-teal-500 p-7 text-white shadow-lg shadow-sky-900/20">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-20 left-8 h-52 w-52 rounded-full bg-white/10 blur-3xl" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
                <FileText size={31} />
              </div>

              <div>
                <h1 className="text-2xl font-bold md:text-3xl">
                  {mostrarFlujoAtencion ? tipoAtencionActual.titulo : requiereNotaMedica && !notaMedicaGuardada
                    ? 'Nota médica pendiente'
                    : 'Generar receta'}
                </h1>
                <p className="mt-1 text-sky-100">
                  {mostrarFlujoAtencion
                    ? tipoAtencionActual.descripcion
                    : 'Selecciona productos disponibles del inventario y arma la receta médica.'}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">

              <button
                type="button"
                onClick={abrirSolicitudLaboratorio}
                disabled={
                  cargandoPerfil ||
                  !perfilDoctorCompleto ||
                  !expedienteSeleccionado?.id_expediente
                }
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/15 px-5 py-3 text-sm font-bold text-white ring-1 ring-white/25 transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FlaskConical size={19} />
                Solicitud laboratorio
              </button>

              <button
                type="button"
                onClick={() => setModalConsentimientoAbierto(true)}
                disabled={!expedienteSeleccionado?.id_expediente}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FileText size={18} />
                Consentimiento
              </button>

              <button
                type="button"
                onClick={() => setModalViolenciaLesionAbierto(true)}
                disabled={!expedienteSeleccionado?.id_expediente}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-red-700 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <ShieldAlert size={18} />
                Violencia / lesión
              </button>

              <button
                type="button"
                onClick={() => setModalReferenciaAbierto(true)}
                disabled={!expedienteSeleccionado?.id_expediente}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-sky-700 shadow-sm transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FileText size={18} />
                Referencia / contrarreferencia
              </button>

              <button
                type="button"
                onClick={abrirCertificadoMedico}
                disabled={
                  cargandoPerfil ||
                  !perfilDoctorCompleto ||
                  !expedienteSeleccionado?.id_expediente
                }
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-emerald-700 shadow-sm transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <BadgeCheck size={18} />
                Certificado médico
              </button>

            </div>
          </div>
        </section>



        {!cargandoPerfil && !perfilDoctorCompleto && (
          <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-800">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                <ShieldAlert size={26} className="mt-0.5 shrink-0" />
                <div>
                  <p className="font-black">Perfil médico incompleto</p>
                  <p className="mt-1 text-sm">
                    Para generar recetas debes completar nombre, cédula profesional y especialidad.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate('/app/doctor-shaddai/perfil')}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-600 px-5 py-3 text-sm font-bold text-white hover:bg-amber-700"
              >
                <BadgeCheck size={18} />
                Completar perfil
              </button>
            </div>

          </section>
        )}


        {mostrarFlujoAtencion && (
          <section className={`rounded-3xl border p-5 ${tipoAtencionActual.panelClass}`}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className={`rounded-full border px-3 py-1 text-xs font-black ${tipoAtencionActual.badgeClass}`}>
                    {tipoAtencionActual.label}
                  </span>
                  <span className="rounded-full border border-white/50 bg-white/60 px-3 py-1 text-xs font-black text-slate-700">
                    Expediente #{idExpedienteUrl}
                  </span>
                  <span className="rounded-full border border-white/50 bg-white/60 px-3 py-1 text-xs font-black text-slate-700">
                    Atención #{idFilaUrl}
                  </span>
                </div>

                <h2 className="text-xl font-black">Atención en curso</h2>
                <p className="mt-1 text-sm leading-relaxed">
                  {tipoAtencionActual.descripcion}
                </p>
                <p className="mt-2 text-sm font-black">
                  Siguiente paso: {tipoAtencionActual.value === 'CONSULTA_MEDICA' ? tipoNotaInfo.label : tipoAtencionActual.siguientePaso}
                </p>

                {tipoAtencionActual.value === 'CONSULTA_MEDICA' && (
                  <p className="mt-1 text-xs font-bold opacity-90">
                    Historial del expediente: {notasExpediente.length} nota(s). {tipoNotaInfo.descripcion}
                  </p>
                )}
              </div>



              <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
                {tipoAtencionActual.value === 'CONSULTA_MEDICA' && (
                  <button
                    type="button"
                    onClick={abrirNotaMedicaPendiente}
                    className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black shadow-sm transition ${notaMedicaGuardada
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-white text-sky-700 hover:bg-sky-50'
                      }`}
                  >
                    {notaMedicaGuardada ? <BadgeCheck size={18} /> : <ClipboardPlus size={18} />}
                    {notaMedicaGuardada ? 'Nota guardada' : 'Crear nota médica'}
                  </button>
                )}

                {tipoAtencionActual.value === 'CONSULTA_MEDICA' && notaMedicaGuardada && (
                  <button
                    type="button"
                    onClick={() => abrirNotaParaImprimir(notaMedicaActual)}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    <Printer size={18} />
                    Imprimir nota
                  </button>
                )}

                {tipoAtencionActual.value === 'CONSULTA_MEDICA' && notasExpediente.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setModalHistorialNotasAbierto(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    <ClipboardList size={18} />
                    Historial notas
                  </button>
                )}

                {(tipoAtencionActual.value === 'SERVICIO_RAPIDO' ||
                  tipoAtencionActual.value === 'CONSULTA_MEDICA') && (
                    <button
                      type="button"
                      onClick={registrarServicioRapidoPendiente}
                      className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black shadow-sm transition ${servicioRapidoGuardado
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-white text-emerald-700 hover:bg-emerald-50'
                        }`}
                    >
                      {servicioRapidoGuardado ? <BadgeCheck size={18} /> : <ClipboardList size={18} />}
                      {servicioRapidoGuardado
                        ? `Servicio enviado${servicioClinicoActual?.folio_servicio ? ` · ${servicioClinicoActual.folio_servicio}` : ''}`
                        : 'Registrar servicio'}
                    </button>
                  )}


                {tipoAtencionActual.value === 'LABORATORIO' && (
                  <button
                    type="button"
                    onClick={abrirSolicitudLaboratorio}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-orange-700 shadow-sm transition hover:bg-orange-50"
                  >
                    <FlaskConical size={18} />
                    Solicitud laboratorio
                  </button>
                )}

                <button
                  type="button"
                  onClick={finalizarAtencionDesdeFila}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-slate-800"
                >
                  <BadgeCheck size={18} />
                  Finalizar atención
                </button>
              </div>
            </div>
          </section>
        )}

        {notaMedicaPendiente && (
          <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <AlertTriangle size={24} className="mt-0.5 shrink-0 text-amber-600" />
                <div>
                  <p className="font-black">Nota médica pendiente</p>
                  <p className="mt-1 text-sm font-medium leading-relaxed">
                    Puedes continuar con receta, laboratorio y finalizar la atención.
                    Esta consulta quedará identificada para completar la nota médica posteriormente.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={abrirNotaMedicaPendiente}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-600 px-5 py-3 text-sm font-black text-white transition hover:bg-amber-700"
              >
                <ClipboardPlus size={18} />
                Crear nota ahora
              </button>
            </div>
          </section>
        )}

        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="mb-5">
                <h2 className="text-xl font-bold text-slate-800">Datos del paciente</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Selecciona un expediente clínico. La atención no podrá continuar sin expediente vinculado.
                </p>
              </div>

              <div className="mb-5 rounded-3xl border border-sky-100 bg-sky-50 p-5">
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Buscar expediente clínico
                </label>

                <div className="relative">
                  <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />

                  <input
                    type="text"
                    value={busquedaExpediente}
                    onChange={(e) => setBusquedaExpediente(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 py-3 pl-12 pr-4 text-sm outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="Buscar por nombre, teléfono o correo..."
                  />
                </div>

                {expedienteSeleccionado && (
                  <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                          <UserCheck size={14} />
                          Expediente seleccionado
                        </div>

                        <p className="font-bold text-slate-800">
                          {expedienteSeleccionado.nombre_paciente}
                        </p>

                        <p className="mt-1 text-xs text-slate-600">
                          Expediente #{expedienteSeleccionado.id_expediente}
                        </p>
                      </div>

                    </div>
                  </div>
                )}

                <div className="mt-4 max-h-72 space-y-3 overflow-y-auto pr-1">
                  {cargandoExpedientes ? (
                    <div className="flex items-center gap-2 rounded-2xl bg-white p-4 text-sm font-bold text-slate-600">
                      <Loader2 size={18} className="animate-spin" />
                      Buscando expedientes...
                    </div>
                  ) : busquedaExpediente.trim().length < 2 ? (
                    <p className="rounded-2xl bg-white p-4 text-sm text-slate-500">
                      Escribe al menos 2 caracteres para buscar expedientes.
                    </p>
                  ) : expedientes.length === 0 ? (
                    <p className="rounded-2xl bg-white p-4 text-sm text-slate-500">
                      No se encontraron expedientes.
                    </p>
                  ) : (
                    expedientes.map((expediente) => (
                      <button
                        key={expediente.id_expediente}
                        type="button"
                        onClick={() => seleccionarExpediente(expediente)}
                        className={`w-full rounded-2xl border p-4 text-left transition ${expedienteSeleccionado?.id_expediente === expediente.id_expediente
                          ? 'border-sky-400 bg-white shadow-sm'
                          : 'border-slate-200 bg-white hover:border-sky-300'
                          }`}
                      >
                        <p className="font-bold text-slate-800">
                          {expediente.nombre_paciente}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Teléfono: {expediente.telefono || 'Sin teléfono'} · Edad:{' '}
                          {expediente.edad || 'N/A'} · Sexo:{' '}
                          {expediente.sexo || 'No especificado'}
                        </p>

                        {(expediente.enfermedades_condiciones ||
                          expediente.alergias ||
                          expediente.medicamentos_actuales) && (
                            <div className="mt-2 space-y-1 text-xs text-amber-700">
                              {expediente.enfermedades_condiciones && (
                                <p>Condición: {expediente.enfermedades_condiciones}</p>
                              )}

                              {expediente.alergias && <p>Alergias: {expediente.alergias}</p>}

                              {expediente.medicamentos_actuales && (
                                <p>Medicamentos actuales: {expediente.medicamentos_actuales}</p>
                              )}
                            </div>
                          )}
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Nombre del paciente *
                  </label>

                  <div className="relative">
                    <UserRound className="absolute left-4 top-3.5 text-slate-400" size={20} />

                    <input
                      type="text"
                      name="nombre_paciente"
                      value={paciente.nombre_paciente}
                      readOnly
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm text-slate-700 outline-none"
                      placeholder="Se carga desde el expediente"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">Teléfono</label>

                  <div className="relative">
                    <Phone className="absolute left-4 top-3.5 text-slate-400" size={20} />

                    <input
                      type="text"
                      name="telefono"
                      value={paciente.telefono}
                      readOnly
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm text-slate-700 outline-none"
                      placeholder="Se carga desde el expediente"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">Edad</label>

                  <input
                    type="number"
                    name="edad"
                    value={paciente.edad}
                    readOnly
                    min="0"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
                    placeholder="Se carga desde el expediente"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">Sexo</label>

                  <select
                    name="sexo"
                    value={paciente.sexo}
                    disabled
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
                  >
                    <option value="">Seleccionar</option>
                    <option value="Femenino">Femenino</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Otro">Otro</option>
                    <option value="No especificado">Prefiere no decirlo</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Diagnóstico
                  </label>

                  <input
                    type="text"
                    name="diagnostico"
                    value={paciente.diagnostico}
                    onChange={handlePacienteChange}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="Escribe diagnóstico o indicación para la receta"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Observaciones generales
                  </label>

                  <textarea
                    name="observaciones"
                    value={paciente.observaciones}
                    onChange={handlePacienteChange}
                    rows="3"
                    className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="Escribe observaciones para la receta si aplica..."
                  />
                </div>
              </div>
            </div>


          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="mb-5">
                <h2 className="text-xl font-bold text-slate-800">Buscar producto de la farmacia.</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Busca medicamentos o productos disponibles en inventario.
                </p>
              </div>

              <div ref={contenedorBusquedaProductosRef} className="relative z-40">
                <Search
                  className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-slate-400"
                  size={20}
                />

                <input
                  type="text"
                  value={busqueda}
                  onChange={(event) => {
                    const valor = event.target.value;
                    setBusqueda(valor);
                    setMostrarResultadosProductos(valor.trim().length >= 2);
                    setProductoStockAbierto(null);
                  }}
                  onFocus={() => {
                    if (busqueda.trim().length >= 2) {
                      setMostrarResultadosProductos(true);
                    }
                  }}
                  disabled={!expedienteSeleccionado?.id_expediente}
                  autoComplete="off"
                  className="w-full rounded-2xl border border-slate-200 py-3 pl-12 pr-12 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                  placeholder={
                    expedienteSeleccionado?.id_expediente
                      ? 'Buscar por nombre, código o medicamento...'
                      : 'Selecciona un expediente antes de buscar productos'
                  }
                />

                {busqueda && expedienteSeleccionado?.id_expediente && (
                  <button
                    type="button"
                    onClick={() => {
                      setBusqueda('');
                      setProductos([]);
                      setMostrarResultadosProductos(false);
                      setProductoStockAbierto(null);
                    }}
                    className="absolute right-3 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    aria-label="Limpiar búsqueda"
                  >
                    <X size={18} />
                  </button>
                )}

                {mostrarResultadosProductos && busqueda.trim().length >= 2 && (
                  <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15">
                    <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-2.5">
                      <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                        Resultados del inventario
                      </p>

                      {!cargandoProductos && productos.length > 0 && (
                        <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-black text-sky-700">
                          {productos.length} resultado(s)
                        </span>
                      )}
                    </div>

                    <div className="max-h-[430px] overflow-y-auto overscroll-contain">
                      {cargandoProductos ? (
                        <div className="flex items-center justify-center gap-2 px-5 py-8 text-sm font-bold text-slate-600">
                          <Loader2 size={20} className="animate-spin text-sky-600" />
                          Buscando productos...
                        </div>
                      ) : productos.length === 0 ? (
                        <div className="px-5 py-8 text-center">
                          <p className="text-sm font-bold text-slate-700">
                            No se encontraron productos
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Puedes capturarlo mediante la opción de medicamento libre.
                          </p>
                        </div>
                      ) : (
                        productos.map((producto) => {
                          const agregado = productoYaAgregado(producto);
                          const stockTotal = Number(
                            producto.stock_total || producto.stock || 0
                          );
                          const sinStock = stockTotal <= 0;
                          const stockBajo = stockTotal > 0 && stockTotal <= 5;
                          const claveProducto = String(
                            producto.id_producto ||
                            producto.codigo_barras ||
                            producto.nombre
                          );
                          const stockVisible = productoStockAbierto === claveProducto;

                          return (
                            <div
                              key={claveProducto}
                              className="border-b border-slate-100 last:border-b-0"
                            >
                              <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0 flex-1">
                                  <p className="break-words text-sm font-black leading-snug text-slate-800">
                                    {producto.nombre}
                                  </p>

                                  <p className="mt-1 break-words text-xs font-semibold leading-relaxed text-slate-500">
                                    {[
                                      producto.codigo_barras,
                                      producto.nombre_generico,
                                      producto.forma_farmaceutica,
                                      producto.presentacion,
                                    ]
                                      .filter(Boolean)
                                      .join(' · ') || 'Producto de inventario'}
                                  </p>

                                  <div className="mt-2 flex flex-wrap items-center gap-2">
                                    <span
                                      className={`rounded-full px-2.5 py-1 text-xs font-black ${
                                        sinStock
                                          ? 'bg-red-100 text-red-700'
                                          : stockBajo
                                            ? 'bg-amber-100 text-amber-700'
                                            : 'bg-emerald-100 text-emerald-700'
                                      }`}
                                    >
                                      {sinStock
                                        ? 'Sin stock'
                                        : stockBajo
                                          ? `Stock bajo: ${stockTotal}`
                                          : `Disponible: ${stockTotal}`}
                                    </span>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        setProductoStockAbierto((actual) =>
                                          actual === claveProducto ? null : claveProducto
                                        )
                                      }
                                      className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-black text-sky-700 transition hover:bg-sky-100"
                                    >
                                      <Eye size={14} />
                                      {stockVisible ? 'Ocultar stock' : 'Ver stock'}
                                    </button>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => agregarProducto(producto)}
                                  disabled={agregado}
                                  className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-xs font-black transition ${
                                    agregado
                                      ? 'cursor-not-allowed bg-slate-200 text-slate-500'
                                      : sinStock
                                        ? 'bg-amber-500 text-white hover:bg-amber-600'
                                        : 'bg-sky-700 text-white hover:bg-sky-800'
                                  }`}
                                >
                                  <Plus size={16} />
                                  {agregado
                                    ? 'Agregado'
                                    : sinStock
                                      ? 'Recetar sin stock'
                                      : 'Agregar'}
                                </button>
                              </div>

                              {stockVisible && (
                                <div className="border-t border-slate-100 bg-slate-50 px-4 py-3">
                                  <p className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500">
                                    Disponibilidad por sucursal
                                  </p>

                                  {(producto.sucursales || []).length === 0 ? (
                                    <p className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-500">
                                      No se recibió detalle de sucursales para este producto.
                                    </p>
                                  ) : (
                                    <div className="grid gap-2 sm:grid-cols-2">
                                      {(producto.sucursales || []).map((sucursal, index) => {
                                        const stockSucursal = Number(sucursal.stock || 0);

                                        return (
                                          <div
                                            key={`${claveProducto}-${sucursal.id_sucursal || index}`}
                                            className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2"
                                          >
                                            <div className="min-w-0">
                                              <p className="truncate text-xs font-bold text-slate-700">
                                                {sucursal.sucursal || 'Sucursal'}
                                              </p>

                                              {sucursal.fecha_caducidad && (
                                                <p className="mt-0.5 text-[11px] text-slate-400">
                                                  Caducidad: {formatearFecha(sucursal.fecha_caducidad)}
                                                </p>
                                              )}
                                            </div>

                                            <span
                                              className={`shrink-0 rounded-full px-2 py-1 text-xs font-black ${
                                                stockSucursal > 0
                                                  ? 'bg-emerald-100 text-emerald-700'
                                                  : 'bg-red-100 text-red-700'
                                              }`}
                                            >
                                              {stockSucursal} disp.
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-5 rounded-2xl border border-dashed border-violet-300 bg-violet-50 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-black text-violet-900">
                      Medicamento libre
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-violet-700">
                      Úsalo cuando el medicamento no existe en el inventario de la farmacia.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setMostrarFormularioMedicamentoLibre((prev) => !prev)}
                    disabled={!expedienteSeleccionado?.id_expediente}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-violet-700 px-4 py-2.5 text-sm font-black text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <PlusCircle size={18} />
                    {mostrarFormularioMedicamentoLibre ? 'Cerrar' : 'Agregar medicamento libre'}
                  </button>
                </div>

                {mostrarFormularioMedicamentoLibre && (
                  <div className="mt-4 border-t border-violet-200 pt-4">
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="md:col-span-2">
                        <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-violet-800">
                          Nombre del medicamento *
                        </label>
                        <input
                          type="text"
                          name="nombre"
                          value={medicamentoLibre.nombre}
                          onChange={manejarCambioMedicamentoLibre}
                          className="w-full rounded-xl border border-violet-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-500"
                          placeholder="Ej. Amoxicilina con ácido clavulánico 875 mg / 125 mg"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-violet-800">
                          Nombre genérico
                        </label>
                        <input
                          type="text"
                          name="nombre_generico"
                          value={medicamentoLibre.nombre_generico}
                          onChange={manejarCambioMedicamentoLibre}
                          className="w-full rounded-xl border border-violet-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-500"
                          placeholder="Opcional"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-violet-800">
                          Presentación / concentración
                        </label>
                        <input
                          type="text"
                          name="presentacion"
                          value={medicamentoLibre.presentacion}
                          onChange={manejarCambioMedicamentoLibre}
                          className="w-full rounded-xl border border-violet-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-500"
                          placeholder="Ej. 500 mg, caja con 20 tabletas"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-violet-800">
                          Forma farmacéutica
                        </label>
                        <input
                          type="text"
                          name="forma_farmaceutica"
                          value={medicamentoLibre.forma_farmaceutica}
                          onChange={manejarCambioMedicamentoLibre}
                          className="w-full rounded-xl border border-violet-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-500"
                          placeholder="Ej. Tabletas, suspensión, crema"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-violet-800">
                          Cantidad *
                        </label>
                        <input
                          type="number"
                          min="1"
                          name="cantidad"
                          value={medicamentoLibre.cantidad}
                          onChange={manejarCambioMedicamentoLibre}
                          className="w-full rounded-xl border border-violet-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-500"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-violet-800">
                          Dosis
                        </label>
                        <input
                          type="text"
                          name="dosis"
                          value={medicamentoLibre.dosis}
                          onChange={manejarCambioMedicamentoLibre}
                          className="w-full rounded-xl border border-violet-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-500"
                          placeholder="Ej. 1 tableta"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-violet-800">
                          Frecuencia
                        </label>
                        <input
                          type="text"
                          name="frecuencia"
                          value={medicamentoLibre.frecuencia}
                          onChange={manejarCambioMedicamentoLibre}
                          className="w-full rounded-xl border border-violet-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-500"
                          placeholder="Ej. cada 8 horas"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-violet-800">
                          Duración
                        </label>
                        <input
                          type="text"
                          name="duracion"
                          value={medicamentoLibre.duracion}
                          onChange={manejarCambioMedicamentoLibre}
                          className="w-full rounded-xl border border-violet-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-500"
                          placeholder="Ej. por 7 días"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-violet-800">
                          Indicaciones
                        </label>
                        <textarea
                          name="indicaciones"
                          value={medicamentoLibre.indicaciones}
                          onChange={manejarCambioMedicamentoLibre}
                          rows="3"
                          className="w-full resize-none rounded-xl border border-violet-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-500"
                          placeholder="Ej. Tomar después de alimentos. No suspender tratamiento."
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
                      <button
                        type="button"
                        onClick={cancelarMedicamentoLibre}
                        className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-700 ring-1 ring-violet-200 transition hover:bg-violet-100"
                      >
                        Cancelar
                      </button>

                      <button
                        type="button"
                        onClick={agregarMedicamentoLibre}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-black text-white transition hover:bg-violet-800"
                      >
                        <Plus size={17} />
                        Agregar a la receta
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {!expedienteSeleccionado?.id_expediente ? (
                <div className="mt-4 rounded-2xl bg-amber-50 p-5 text-sm font-semibold text-amber-700">
                  Selecciona un expediente clínico antes de buscar productos.
                </div>
              ) : busqueda.trim().length < 2 ? (
                <div className="mt-4 rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">
                  Escribe al menos 2 caracteres para buscar productos.
                </div>
              ) : null}
            </div>

            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Tabla de receta</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Productos seleccionados e indicaciones médicas.
                  </p>
                  {receta.length > 0 && (
                    <p className="mt-2 text-xs font-bold text-sky-700">
                      {totalProductosReceta} producto(s) · {totalPiezas} pieza(s)
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={limpiarReceta}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-200"
                >
                  <Trash2 size={17} />
                  Limpiar
                </button>
              </div>

              {receta.length === 0 ? (
                <div className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-sky-100 text-sky-700">
                    <ClipboardList size={34} />
                  </div>

                  <h3 className="text-lg font-bold text-slate-800">Receta vacía</h3>

                  <p className="mt-2 max-w-sm text-sm text-slate-500">
                    Busca productos de la farmacia y agrégalos a la receta. También pueden incluirse aunque no haya existencias actuales.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {receta.map((item) => (
                    <div key={item.id_item || item.id_producto || item.nombre} className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-slate-900">{item.nombre}</h3>

                            {item.producto_libre ? (
                              <>
                                <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-black text-violet-800">
                                  MEDICAMENTO LIBRE
                                </span>
                                <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-black text-slate-700">
                                  NO REGISTRADO EN INVENTARIO
                                </span>
                              </>
                            ) : (
                              <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-black text-sky-800">
                                PRODUCTO DE FARMACIA
                              </span>
                            )}
                          </div>

                          {(item.nombre_generico || item.presentacion || item.forma_farmaceutica) && (
                            <p className="mt-1 text-xs text-slate-500">
                              {[item.nombre_generico, item.presentacion, item.forma_farmaceutica]
                                .filter(Boolean)
                                .join(' · ')}
                            </p>
                          )}

                          {item.producto_libre ? (
                            <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-800">
                              <AlertTriangle size={14} />
                              Se imprimirá en la receta; caja no podrá cobrarlo ni surtirlo automáticamente.
                            </div>
                          ) : (
                            <p className="mt-1 text-xs text-slate-500">
                              Stock total actual en farmacia: {item.stock}
                            </p>
                          )}

                          {!item.producto_libre && !item.disponible_inventario && (
                            <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                              <AlertTriangle size={14} />
                              Sin existencia actual: se conserva en la receta y caja decidirá el surtido.
                            </div>
                          )}

                          {!item.producto_libre && item.disponible_inventario && Number(item.cantidad || 0) > Number(item.stock || 0) && (
                            <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                              <AlertTriangle size={14} />
                              Cantidad recetada mayor al stock actual: caja podrá surtirla parcialmente.
                            </div>
                          )}

                          {!item.producto_libre && item.disponibilidad_sucursales?.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {item.disponibilidad_sucursales.map((sucursal) => (
                                <span
                                  key={`${item.id_item || item.id_producto || item.nombre}-${sucursal.id_sucursal}`}
                                  className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600"
                                >
                                  {sucursal.sucursal}: {sucursal.stock}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => eliminarProductoReceta(item)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-700 transition hover:bg-red-200"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                            Cantidad
                          </label>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => disminuirCantidad(item)}
                              className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-700 hover:bg-slate-100"
                            >
                              <Minus size={16} />
                            </button>

                            <input
                              type="number"
                              min="1"
                              value={item.cantidad}
                              onChange={(e) =>
                                actualizarItemReceta(item.id_item, 'cantidad', e.target.value)
                              }
                              className="h-10 w-20 rounded-xl border border-slate-200 text-center text-sm font-bold outline-none focus:ring-2 focus:ring-sky-500"
                            />

                            <button
                              type="button"
                              onClick={() => aumentarCantidad(item)}
                              className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-700 hover:bg-slate-100"
                            >
                              <PlusCircle size={16} />
                            </button>
                          </div>
                        </div>

                        <CampoTextoReceta
                          label="Dosis"
                          value={item.dosis}
                          placeholder="Ej. 1 tableta"
                          onChange={(value) => actualizarItemReceta(item.id_item, 'dosis', value)}
                        />

                        <CampoTextoReceta
                          label="Frecuencia"
                          value={item.frecuencia}
                          placeholder="Ej. cada 8 horas"
                          onChange={(value) => actualizarItemReceta(item.id_item, 'frecuencia', value)}
                        />

                        <CampoTextoReceta
                          label="Duración"
                          value={item.duracion}
                          placeholder="Ej. por 5 días"
                          onChange={(value) => actualizarItemReceta(item.id_item, 'duracion', value)}
                        />

                        <div className="md:col-span-2">
                          <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                            Indicaciones
                          </label>

                          <textarea
                            value={item.indicaciones}
                            onChange={(e) =>
                              actualizarItemReceta(item.id_item, 'indicaciones', e.target.value)
                            }
                            rows="3"
                            className="w-full resize-none rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-500"
                            placeholder="Ej. Tomar después de alimentos. No suspender tratamiento."
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={limpiarReceta}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-200"
                    >
                      <Trash2 size={18} />
                      Limpiar receta
                    </button>

                    <button
                      type="button"
                      onClick={abrirVistaPrevia}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
                    >
                      <Eye size={18} />
                      Vista previa
                    </button>

                    <button
                      type="button"
                      onClick={enviarReceta}
                      disabled={enviando || cargandoPerfil || !perfilDoctorCompleto}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-700 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-sky-900/20 transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {enviando || cargandoPerfil ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Send size={18} />
                      )}
                      {cargandoPerfil
                        ? 'Validando...'
                        : !perfilDoctorCompleto
                          ? 'Completa perfil'
                          : enviando
                            ? 'Generando...'
                            : notaMedicaPendiente
                              ? 'Generar receta · nota pendiente'
                              : 'Generar receta'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {modalSeguimientoAbierto && recetaSeguimiento && (
        <ModalSeguimientoReceta
          receta={recetaSeguimiento}
          detalles={detalleSeguimiento}
          cargando={cargandoSeguimiento}
          onClose={cerrarModalSeguimiento}
          formatearFecha={formatearFecha}
        />
      )}

      <ModalConsentimientoInformado
        abierto={modalConsentimientoAbierto}
        onClose={() => setModalConsentimientoAbierto(false)}
        expediente={expedienteSeleccionado}
        paciente={{
          ...paciente,
          id_expediente:
            expedienteSeleccionado?.id_expediente ||
            Number(idExpedienteUrl) ||
            null,
          id_fila: idFilaUrl ? Number(idFilaUrl) : null,
          id_sucursal: expedienteSeleccionado?.id_sucursal || null,
        }}
        perfilDoctor={perfilDoctor}
        idExpediente={
          expedienteSeleccionado?.id_expediente ||
          Number(idExpedienteUrl) ||
          null
        }
        idFila={idFilaUrl ? Number(idFilaUrl) : null}
        idSucursal={expedienteSeleccionado?.id_sucursal || null}
      />

      <ModalHojaViolenciaLesion
        abierto={modalViolenciaLesionAbierto}
        onClose={() => setModalViolenciaLesionAbierto(false)}
        expediente={expedienteSeleccionado}
        paciente={{
          ...paciente,
          id_expediente:
            expedienteSeleccionado?.id_expediente ||
            Number(idExpedienteUrl) ||
            null,
          id_fila: idFilaUrl ? Number(idFilaUrl) : null,
          id_sucursal: expedienteSeleccionado?.id_sucursal || null,
        }}
        perfilDoctor={perfilDoctor}
        idExpediente={
          expedienteSeleccionado?.id_expediente ||
          Number(idExpedienteUrl) ||
          null
        }
        idFila={idFilaUrl ? Number(idFilaUrl) : null}
        idSucursal={expedienteSeleccionado?.id_sucursal || null}
      />

      {modalRecetaAbierto && recetaGenerada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm no-print">
          <div className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Receta médica</h2>
                <p className="text-sm text-slate-500">Vista previa e impresión de receta.</p>
              </div>

              <button
                type="button"
                onClick={cerrarModalReceta}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <RecetaImprimible
                recetaGenerada={recetaGenerada}
                fechaActual={obtenerFechaActual()}
                perfilDoctor={recetaGenerada.doctor || perfilDoctor}
              />

              <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={cerrarModalReceta}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200"
                >
                  Cerrar
                </button>

                {recetaGenerada.receta?.id_receta && (
                  <button
                    type="button"
                    onClick={limpiarDespuesDeGuardar}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700"
                  >
                    Nueva receta
                  </button>
                )}

                <button
                  type="button"
                  onClick={imprimirReceta}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-700 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-sky-900/20 hover:bg-sky-800"
                >
                  <Printer size={18} />
                  Imprimir receta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalImprimirNotaAbierto && notaParaImprimir && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4 no-print">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Nota médica
                </h2>
                <p className="text-sm text-slate-500">
                  Vista previa e impresión de la nota.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setModalImprimirNotaAbierto(false);
                  setNotaParaImprimir(null);
                }}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <NotaMedicaImprimible
                nota={notaParaImprimir}
                expediente={expedienteSeleccionado}
                perfilDoctor={perfilDoctor}
              />

              <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end no-print">
                <button
                  type="button"
                  onClick={() => {
                    setModalImprimirNotaAbierto(false);
                    setNotaParaImprimir(null);
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200"
                >
                  Cerrar
                </button>

                <button
                  type="button"
                  onClick={imprimirNotaMedica}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-700 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-sky-900/20 hover:bg-sky-800"
                >
                  <Printer size={18} />
                  Imprimir nota
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {modalHistorialNotasAbierto && (
        <div className="fixed inset-0 z-[85] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm no-print">
          <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
              <div className="min-w-0">
                <h2 className="truncate text-xl font-bold text-slate-800">
                  Historial de notas médicas
                </h2>

                <p className="truncate text-sm text-slate-500">
                  Expediente #{expedienteSeleccionado?.id_expediente || idExpedienteUrl || 'N/A'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setModalHistorialNotasAbierto(false)}
                className="ml-4 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition hover:bg-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden p-6">
              {cargandoNotasExpediente ? (
                <div className="flex items-center justify-center gap-2 rounded-2xl bg-slate-50 p-6 text-sm font-bold text-slate-600">
                  <Loader2 size={18} className="animate-spin" />
                  Cargando notas médicas...
                </div>
              ) : notasExpediente.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 p-6 text-sm text-slate-500">
                  Este expediente aún no tiene notas médicas registradas.
                </div>
              ) : (
                <div className="space-y-3">
                  {notasExpediente.map((nota, index) => {
                    const tipoNota = obtenerInfoTipoNota(
                      nota.tipo_nota ||
                      (index === notasExpediente.length - 1
                        ? 'NOTA_INICIAL'
                        : 'NOTA_EVOLUCION')
                    );

                    const diagnosticoTexto =
                      nota.diagnostico || 'Sin diagnóstico';

                    const resumenTexto =
                      nota.antecedentes_padecimiento_actual ||
                      nota.observaciones ||
                      'Sin resumen.';

                    return (
                      <div
                        key={nota.id_nota}
                        className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex min-w-0 flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="mb-2 flex min-w-0 flex-wrap items-center gap-2">
                              <span className="max-w-full truncate rounded-full bg-sky-100 px-3 py-1 text-xs font-black text-sky-700">
                                {tipoNota.label}
                              </span>

                              {nota.id_fila && (
                                <span className="max-w-full truncate rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600">
                                  Atención #{nota.id_fila}
                                </span>
                              )}
                            </div>

                            <p className="truncate font-black text-slate-800">
                              Nota #{nota.id_nota} ·{' '}
                              {formatearFecha(nota.fecha_nota || nota.fecha_creacion)}
                            </p>

                            <p
                              className="mt-1 max-w-full truncate text-sm text-slate-600"
                              title={`Diagnóstico: ${diagnosticoTexto}`}
                            >
                              <span className="font-bold">Diagnóstico:</span>{' '}
                              {diagnosticoTexto}
                            </p>

                            <p
                              className="mt-1 max-w-full overflow-hidden break-words text-sm leading-snug text-slate-500"
                              title={resumenTexto}
                              style={{
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                              }}
                            >
                              {resumenTexto}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => abrirNotaParaImprimir(nota)}
                            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
                          >
                            <Printer size={18} />
                            Ver / imprimir
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 bg-white px-6 py-4">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setModalHistorialNotasAbierto(false)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-200"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ModalServicioClinico
        abierto={modalServicioClinicoAbierto}
        onClose={() => setModalServicioClinicoAbierto(false)}
        expediente={expedienteSeleccionado}
        paciente={{
          ...paciente,
          id_expediente:
            expedienteSeleccionado?.id_expediente ||
            Number(idExpedienteUrl) ||
            null,
          id_fila: idFilaUrl ? Number(idFilaUrl) : null,
          id_sucursal: expedienteSeleccionado?.id_sucursal || null,
        }}
        perfilDoctor={perfilDoctor}
        idExpediente={
          expedienteSeleccionado?.id_expediente ||
          Number(idExpedienteUrl) ||
          null
        }
        idFila={idFilaUrl ? Number(idFilaUrl) : null}
        idSucursal={expedienteSeleccionado?.id_sucursal || null}
        tipoAtencion={tipoAtencionActual.value}
        onGuardado={manejarServicioClinicoGuardado}
      />

      <ModalNotaMedica
        abierto={modalNotaMedicaAbierto}
        onClose={() => setModalNotaMedicaAbierto(false)}
        expediente={expedienteSeleccionado}
        paciente={paciente}
        idFila={idFilaUrl ? Number(idFilaUrl) : null}
        idSucursal={expedienteSeleccionado?.id_sucursal || null}
        tipoNota={tipoNotaSugerido}
        tipoNotaLabel={tipoNotaInfo.label}
        notasPrevias={notasPreviasDelExpediente}
        onGuardada={manejarNotaMedicaGuardada}
      />

      <ModalSolicitudLaboratorio
        abierto={modalLaboratorioAbierto}
        onClose={() => setModalLaboratorioAbierto(false)}
        paciente={{
          nombre: paciente.nombre_paciente,
          nombre_paciente: paciente.nombre_paciente,
          telefono: paciente.telefono,
          edad: paciente.edad,
          sexo: paciente.sexo,
          no_expediente: expedienteSeleccionado?.id_expediente
            ? `EXP-${expedienteSeleccionado.id_expediente}`
            : 'Sin expediente',
          id_expediente: expedienteSeleccionado?.id_expediente || null,
          id_fila_atencion: idFilaUrl ? Number(idFilaUrl) : null,
          tipo_atencion: tipoAtencionActual.value,
        }}
        medico={{
          ...(perfilDoctor || {}),
          nombre_completo: perfilDoctor?.nombre_completo || 'Doctor Shaddai',
          cedula_profesional: perfilDoctor?.cedula_profesional || 'N/A',
          especialidad: perfilDoctor?.especialidad || 'N/A',
          telefono:
            perfilDoctor?.telefono ||
            perfilDoctor?.medico_telefono ||
            perfilDoctor?.doctor_telefono ||
            perfilDoctor?.telefono_doctor ||
            perfilDoctor?.telefono_contacto ||
            perfilDoctor?.telefono_consultorio ||
            perfilDoctor?.celular ||
            '',
        }}
        onGuardar={guardarSolicitudLaboratorio}
      />
      <ModalReferenciaContrarreferencia
        abierto={modalReferenciaAbierto}
        onClose={() => setModalReferenciaAbierto(false)}
        expediente={expedienteSeleccionado}
        paciente={{
          ...paciente,
          id_expediente: expedienteSeleccionado?.id_expediente || Number(idExpedienteUrl) || null,
          id_fila: idFilaUrl ? Number(idFilaUrl) : null,
          id_sucursal: expedienteSeleccionado?.id_sucursal || null,
        }}
        perfilDoctor={perfilDoctor}
        idExpediente={expedienteSeleccionado?.id_expediente || Number(idExpedienteUrl) || null}
        idFila={idFilaUrl ? Number(idFilaUrl) : null}
        idSucursal={expedienteSeleccionado?.id_sucursal || null}
      />

      {modalCertificadoAbierto && (
        <ModalCertificadoMedico
          abierto={modalCertificadoAbierto}
          onClose={() => setModalCertificadoAbierto(false)}
          expediente={expedienteSeleccionado}
          paciente={paciente}
          perfilDoctor={perfilDoctor}
          idFila={idFilaUrl ? Number(idFilaUrl) : null}
          tipoAtencion={tipoAtencionActual.value}
        />
      )}

      {modalRecetaAbierto && recetaGenerada && (
        <div className="hidden print:block">
          <RecetaImprimible
            recetaGenerada={recetaGenerada}
            fechaActual={obtenerFechaActual()}
            perfilDoctor={recetaGenerada.doctor || perfilDoctor}
          />
        </div>
      )}

    </>
  );
}

function CampoTextoReceta({ label, value, placeholder, onChange }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </label>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-500"
        placeholder={placeholder}
      />
    </div>
  );
}

function ModalSeguimientoReceta({ receta, detalles, cargando, onClose, formatearFecha }) {
  const estatus = String(receta?.estatus || '').toUpperCase();

  const detallesNormalizados = (detalles || []).map((item) => {
    const cantidadRecetada = Number(item.cantidad_recetada ?? item.cantidad ?? item.cantidad_solicitada ?? 1);
    const cantidadSurtida = Number(item.cantidad_surtida ?? item.surtido ?? item.total_surtido ?? 0);
    const cantidadPendiente = Number(
      item.cantidad_pendiente ?? Math.max(cantidadRecetada - cantidadSurtida, 0)
    );

    return {
      ...item,
      cantidadRecetada,
      cantidadSurtida,
      cantidadPendiente,
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
      <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Seguimiento de receta</h2>
            <p className="mt-1 text-sm text-slate-500">
              Revisa qué productos fueron surtidos y cuáles siguen pendientes.
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
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">Folio</p>
              <p className="mt-1 font-black text-slate-800">
                {receta.folio_receta || `RX-${receta.id_receta}`}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">Paciente</p>
              <p className="mt-1 font-black text-slate-800">
                {receta.nombre_paciente || receta.paciente || 'N/A'}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">Fecha</p>
              <p className="mt-1 font-black text-slate-800">
                {formatearFecha(receta.fecha_creacion || receta.fecha_receta)}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">Estatus</p>
              <span
                className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-black ${ESTATUS_CLASES[estatus] || 'bg-slate-100 text-slate-600'
                  }`}
              >
                {ESTATUS_TEXTO[estatus] || estatus || 'Sin estatus'}
              </span>
            </div>
          </div>

          {estatus === 'SURTIDA_PARCIAL' && (
            <div className="mb-5 rounded-2xl border border-orange-100 bg-orange-50 p-4 text-orange-800">
              <p className="font-black">Receta surtida parcialmente</p>
              <p className="mt-1 text-sm">
                El cajero surtió parte de la receta. Los productos pendientes pueden surtirse después desde caja.
              </p>
            </div>
          )}

          <div className="mb-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-center">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">Recetado</p>
              <p className="mt-1 text-2xl font-black text-slate-800">{totalRecetado}</p>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-center">
              <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Surtido</p>
              <p className="mt-1 text-2xl font-black text-emerald-800">{totalSurtido}</p>
            </div>

            <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4 text-center">
              <p className="text-xs font-black uppercase tracking-wide text-orange-700">Pendiente</p>
              <p className="mt-1 text-2xl font-black text-orange-800">{totalPendiente}</p>
            </div>
          </div>

          {cargando ? (
            <div className="flex items-center gap-2 rounded-2xl bg-slate-50 p-5 text-sm font-bold text-slate-600">
              <Loader2 size={18} className="animate-spin" />
              Cargando detalle...
            </div>
          ) : detallesNormalizados.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">
              No hay detalle disponible para esta receta.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="w-full min-w-[850px]">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500">
                      Producto
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-black uppercase tracking-wide text-slate-500">
                      Recetado
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-black uppercase tracking-wide text-slate-500">
                      Surtido
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-black uppercase tracking-wide text-slate-500">
                      Pendiente
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500">
                      Indicaciones
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {detallesNormalizados.map((item, index) => (
                    <tr key={item.id_detalle || item.id_producto || index} className="hover:bg-slate-50">
                      <td className="px-4 py-4">
                        <p className="font-black text-slate-800">
                          {item.nombre || item.producto || item.nombre_producto || 'Producto'}
                        </p>
                        {item.presentacion && (
                          <p className="mt-1 text-xs text-slate-500">{item.presentacion}</p>
                        )}
                      </td>

                      <td className="px-4 py-4 text-center font-black text-slate-700">
                        {item.cantidadRecetada}
                      </td>

                      <td className="px-4 py-4 text-center">
                        <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">
                          {item.cantidadSurtida}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-center">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${item.cantidadPendiente > 0
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-emerald-100 text-emerald-700'
                            }`}
                        >
                          {item.cantidadPendiente}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-sm text-slate-600">
                        <p>
                          <strong>Dosis:</strong> {item.dosis || '-'}
                        </p>
                        <p>
                          <strong>Frecuencia:</strong> {item.frecuencia || '-'}
                        </p>
                        <p>
                          <strong>Duración:</strong> {item.duracion || '-'}
                        </p>
                        {item.indicaciones && (
                          <p className="mt-1">
                            <strong>Indicaciones:</strong> {item.indicaciones}
                          </p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



function RecetaImprimible({ recetaGenerada, fechaActual, perfilDoctor }) {
  const paciente = recetaGenerada?.paciente || {};
  const productos = recetaGenerada?.productos || [];
  const detalles = recetaGenerada?.detalles || [];
  const receta = recetaGenerada?.receta || {};
  const expediente = recetaGenerada?.expediente || null;
  const doctor = {
    ...(recetaGenerada?.doctor || {}),
    ...(perfilDoctor || {}),
  };

  const telefonoDoctor =
    doctor.telefono ||
    doctor.doctor_telefono ||
    recetaGenerada?.doctor?.telefono ||
    recetaGenerada?.doctor?.doctor_telefono ||
    '';
  const logoUniversidadUrl = obtenerUrlArchivo(
    doctor.logo_universidad_url ||
    recetaGenerada?.doctor?.logo_universidad_url ||
    ''
  );

  const folio =
    receta.folio_receta ||
    (receta.id_receta ? `RX-${receta.id_receta}` : 'Vista previa');

  const fechaReceta = receta.fecha_creacion
    ? new Date(receta.fecha_creacion).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: '2-digit',
    })
    : fechaActual;

  const textoSeguro = (valor, fallback = 'N/A') => {
    const texto = String(valor ?? '').trim();
    return texto || fallback;
  };

  const nombrePaciente =
    paciente.nombre_paciente ||
    receta.nombre_paciente ||
    expediente?.nombre_paciente ||
    'Paciente no especificado';

  const telefonoPaciente =
    paciente.telefono ||
    receta.telefono_paciente ||
    expediente?.telefono ||
    'N/A';

  const edadPaciente =
    paciente.edad ||
    receta.edad_paciente ||
    expediente?.edad ||
    'N/A';

  const sexoPaciente =
    paciente.sexo ||
    receta.sexo_paciente ||
    expediente?.sexo ||
    'N/A';

  const diagnostico =
    paciente.diagnostico ||
    receta.diagnostico ||
    recetaGenerada?.diagnostico ||
    'Sin diagnóstico registrado';

  const observaciones =
    paciente.observaciones ||
    receta.observaciones ||
    recetaGenerada?.observaciones ||
    '';

  const productosReceta =
    productos.length > 0
      ? productos
      : detalles.map((item, index) => ({
        id_item: item.id_item || `DET-${item.id_detalle || item.id_producto || index}`,
        id_producto: item.id_producto || null,
        tipo_producto_receta:
          item.tipo_producto_receta || (item.id_producto ? 'INVENTARIO' : 'LIBRE'),
        producto_libre:
          item.producto_libre === true ||
          item.producto_libre === 'true' ||
          !item.id_producto,
        nombre:
          item.nombre ||
          item.nombre_producto ||
          item.producto ||
          'Producto',
        nombre_generico: item.nombre_generico || item.generico || '',
        presentacion: item.presentacion || '',
        forma_farmaceutica: item.forma_farmaceutica || '',
        cantidad: item.cantidad || item.cantidad_recetada || 1,
        dosis: item.dosis || '',
        frecuencia: item.frecuencia || '',
        duracion: item.duracion || '',
        indicaciones: item.indicaciones || '',
      }));

  const totalPiezas = productosReceta.reduce(
    (acc, item) => acc + Number(item.cantidad || 0),
    0
  );

  /*
    Modo automático:
    - Receta corta: 2 copias en la misma hoja carta.
    - Receta larga: 1 copia por hoja para evitar que medicamentos o indicaciones se corten.
  */
  const totalCaracteresReceta = [
    diagnostico,
    observaciones,
    ...productosReceta.flatMap((item) => [
      item.nombre,
      item.nombre_generico,
      item.presentacion,
      item.forma_farmaceutica,
      item.dosis,
      item.frecuencia,
      item.duracion,
      item.indicaciones,
    ]),
  ]
    .filter(Boolean)
    .join(' ')
    .length;

  const recetaEsLarga =
    productosReceta.length > 3 ||
    totalCaracteresReceta > 850 ||
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

      return textoIndicaciones.length > 210;
    });

  const RecetaCopia = ({ tipoCopia }) => (
    <section className="rx-copy">
      <div className="rx-header">
        <div className="rx-logos">
          <div className="rx-logo-box">
            <img src={logoFarmacia} alt="Farmacias Shaddai" />
          </div>

          {logoUniversidadUrl && (
            <div className="rx-logo-box">
              <img src={logoUniversidadUrl} alt="Logo universidad" />
            </div>
          )}
        </div>

        <div className="rx-title">
          <h1>FARMACIAS SHADDAI</h1>
          <p>RECETA MÉDICA</p>
          <span>Bienestar al alcance de todos</span>
        </div>

        <div className="rx-folio">
          <span>{tipoCopia}</span>
          <strong>{folio}</strong>
          <small>{fechaReceta}</small>
        </div>
      </div>

      <div className="rx-info-grid">
        <div className="rx-card">
          <div className="rx-card-title">Médico</div>

          <p>
            <b>Nombre:</b> {textoSeguro(doctor.nombre_completo, 'Doctor Shaddai')}
          </p>
          <p>
            <b>Especialidad:</b>{' '}
            {textoSeguro(doctor.especialidad, 'Medicina general')}
          </p>
          <p>
            <b>Cédula:</b> {textoSeguro(doctor.cedula_profesional)}
          </p>
          <p>
            <b>Teléfono:</b>{' '}
            {telefonoDoctor ? telefonoDoctor : 'No registrado'}
          </p>
          <p>
            <b>Consultorio:</b>{' '}
            {textoSeguro(doctor.direccion_consultorio, 'Farmacias Shaddai')}
          </p>
        </div>

        <div className="rx-card">
          <div className="rx-card-title">Paciente</div>

          <p>
            <b>Paciente:</b> {textoSeguro(nombrePaciente)}
          </p>
          <p>
            <b>Expediente:</b>{' '}
            {expediente?.id_expediente ? `EXP-${expediente.id_expediente}` : 'N/A'}
          </p>
          <p>
            <b>Teléfono:</b> {textoSeguro(telefonoPaciente)}
          </p>
          <p>
            <b>Edad:</b> {textoSeguro(edadPaciente)} &nbsp; <b>Sexo:</b>{' '}
            {textoSeguro(sexoPaciente)}
          </p>
        </div>
      </div>

      <div className="rx-diagnostico">
        <b>Diagnóstico:</b> {textoSeguro(diagnostico, 'Sin diagnóstico registrado')}
      </div>

      <div className="rx-prescripcion">
        <div className="rx-section-title">
          <span>Prescripción</span>
          <small>
            {productosReceta.length} producto(s) · {totalPiezas} pieza(s)
          </small>
        </div>

        {productosReceta.length === 0 ? (
          <div className="rx-empty">No hay productos registrados.</div>
        ) : (
          <div className="rx-productos">
            {productosReceta.map((item, index) => (
              <div
                key={`${item.id_item || item.id_producto || index}-${item.nombre}`}
                className="rx-producto"
              >
                <div className="rx-producto-main">
                  <div>
                    <p className="rx-producto-nombre">
                      {index + 1}. {textoSeguro(item.nombre, 'Producto')}
                    </p>

                    {(item.nombre_generico || item.presentacion || item.forma_farmaceutica) && (
                      <p className="rx-producto-meta">
                        {[item.nombre_generico, item.presentacion, item.forma_farmaceutica]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    )}
                  </div>

                  <div className="rx-cantidad">x{Number(item.cantidad || 1)}</div>
                </div>

                <div className="rx-indicaciones-grid">
                  <span>
                    <b>Dosis:</b> {textoSeguro(item.dosis, '-')}
                  </span>
                  <span>
                    <b>Frecuencia:</b> {textoSeguro(item.frecuencia, '-')}
                  </span>
                  <span>
                    <b>Duración:</b> {textoSeguro(item.duracion, '-')}
                  </span>
                </div>

                {item.indicaciones && (
                  <p className="rx-tratamiento">
                    <b>Indicaciones:</b> {item.indicaciones}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rx-footer">
        <div className="rx-observaciones">
          <b>Observaciones:</b> {observaciones || 'Sin observaciones.'}
        </div>

        <div className="rx-firma">
          <div />
          <p>Firma del médico</p>
          <strong>{textoSeguro(doctor.nombre_completo, 'Doctor Shaddai')}</strong>
          <span>Cédula: {textoSeguro(doctor.cedula_profesional)}</span>
        </div>
      </div>
    </section>
  );

  return (
    <div
      id="receta-imprimible"
      className={`rx-print-wrapper ${recetaEsLarga ? 'rx-print-large' : 'rx-print-double'}`}
    >
      <style>
        {`
          #receta-imprimible,
          #receta-imprimible * {
            box-sizing: border-box;
          }

          .rx-print-wrapper {
            width: 100%;
            max-width: 8.5in;
            margin: 0 auto;
            background: white;
            color: #0f172a;
            font-family: Arial, Helvetica, sans-serif;
          }

          .rx-long-alert {
            margin: 0 0 10px;
            border: 1px solid #fde68a;
            border-radius: 16px;
            background: #fffbeb;
            padding: 10px 12px;
            color: #92400e;
            font-size: 12px;
            font-weight: 800;
            line-height: 1.35;
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
            max-height: none;
            display: block;
            overflow: visible;
            page-break-after: always;
            break-after: page;
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
            padding: 12px 14px;
            gap: 9px;
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

          .rx-print-large .rx-header {
            grid-template-columns: 120px 1fr 160px;
            padding-bottom: 9px;
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

          .rx-print-large .rx-logo-box {
            width: 52px;
            height: 52px;
            border-radius: 12px;
            padding: 4px;
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

          .rx-print-large .rx-title h1 {
            font-size: 19px;
          }

          .rx-title p {
            margin: 2px 0 0;
            font-size: 9px;
            font-weight: 900;
            letter-spacing: 0.28em;
            color: #0369a1;
          }

          .rx-print-large .rx-title p {
            font-size: 11px;
          }

          .rx-title span {
            display: block;
            margin-top: 2px;
            font-size: 8px;
            font-weight: 700;
            color: #64748b;
          }

          .rx-print-large .rx-title span {
            font-size: 9px;
          }

          .rx-folio {
            border: 1px solid #cbd5e1;
            border-radius: 10px;
            padding: 5px 6px;
            text-align: center;
            line-height: 1.15;
          }

          .rx-print-large .rx-folio {
            padding: 8px;
          }

          .rx-folio span {
            display: block;
            font-size: 8px;
            font-weight: 900;
            color: #0369a1;
            text-transform: uppercase;
            letter-spacing: 0.08em;
          }

          .rx-print-large .rx-folio span {
            font-size: 9px;
          }

          .rx-folio strong {
            display: block;
            margin-top: 2px;
            font-size: 10px;
            font-weight: 900;
            color: #0f172a;
          }

          .rx-print-large .rx-folio strong {
            font-size: 12px;
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

          .rx-print-large .rx-card {
            padding: 8px 10px;
            font-size: 10px;
            line-height: 1.35;
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

          .rx-print-large .rx-card-title {
            margin-bottom: 5px;
            font-size: 9px;
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

          .rx-print-large .rx-diagnostico {
            min-height: 46px;
            padding: 9px 10px;
            font-size: 10px;
            line-height: 1.35;
          }

          .rx-prescripcion {
            border: 1px solid #cbd5e1;
            border-radius: 10px;
            padding: 6px 8px;
            flex: 1;
            min-height: 0;
          }

          .rx-print-double .rx-prescripcion {
            overflow: hidden;
          }

          .rx-print-large .rx-prescripcion {
            overflow: visible;
            flex: initial;
            min-height: 0;
            padding: 9px 10px;
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

          .rx-print-large .rx-section-title span {
            font-size: 9px;
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
            gap: 7px;
            overflow: visible;
          }

          .rx-producto {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 5px 6px;
            background: white;
          }

          .rx-print-large .rx-producto {
            padding: 8px 9px;
            border-radius: 10px;
            page-break-inside: avoid;
            break-inside: avoid;
          }

          .rx-producto-main {
            display: grid;
            grid-template-columns: 1fr 34px;
            gap: 6px;
            align-items: start;
          }

          .rx-print-large .rx-producto-main {
            grid-template-columns: 1fr 44px;
          }

          .rx-producto-nombre {
            margin: 0;
            font-size: 8.8px;
            font-weight: 900;
            line-height: 1.15;
            color: #0f172a;
          }

          .rx-print-large .rx-producto-nombre {
            font-size: 10px;
            line-height: 1.25;
          }

          .rx-producto-meta {
            margin: 2px 0 0;
            font-size: 7.4px;
            line-height: 1.15;
            color: #475569;
          }

          .rx-print-large .rx-producto-meta {
            margin-top: 3px;
            font-size: 8.5px;
            line-height: 1.25;
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

          .rx-print-large .rx-cantidad {
            font-size: 12px;
            padding: 6px 2px;
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

          .rx-print-large .rx-indicaciones-grid {
            margin-top: 5px;
            font-size: 8.8px;
            line-height: 1.25;
          }

          .rx-tratamiento {
            margin: 3px 0 0;
            font-size: 7.8px;
            line-height: 1.15;
            color: #334155;
          }

          .rx-print-large .rx-tratamiento {
            margin-top: 5px;
            font-size: 8.8px;
            line-height: 1.3;
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

          .rx-print-large .rx-footer {
            grid-template-columns: 1fr 210px;
            gap: 12px;
            margin-top: auto;
          }

          .rx-observaciones {
            border: 1px solid #cbd5e1;
            border-radius: 10px;
            padding: 6px 8px;
            min-height: 37px;
            font-size: 8px;
            line-height: 1.2;
          }

          .rx-print-large .rx-observaciones {
            min-height: 58px;
            padding: 9px 10px;
            font-size: 9.5px;
            line-height: 1.35;
          }

          .rx-firma {
            text-align: center;
            font-size: 7.5px;
            color: #475569;
          }

          .rx-print-large .rx-firma {
            font-size: 8.5px;
          }

          .rx-firma div {
            height: 24px;
            border-bottom: 1px solid #0f172a;
            margin-bottom: 3px;
          }

          .rx-print-large .rx-firma div {
            height: 44px;
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

          .rx-print-large .rx-firma strong {
            font-size: 9.5px;
          }

          .rx-firma span {
            display: block;
            font-size: 7px;
          }

          .rx-print-large .rx-firma span {
            font-size: 8px;
          }

          @media print {
            #receta-imprimible.rx-print-double {
              overflow: hidden !important;
            }

            #receta-imprimible.rx-print-large {
              overflow: visible !important;
            }

            #receta-imprimible.rx-print-large > div {
              overflow: visible !important;
            }

            .rx-print-wrapper {
              width: 100% !important;
              max-width: none !important;
              margin: 0 !important;
              padding: 0 !important;
            }

            .rx-print-double .rx-page {
              width: 100% !important;
              height: calc(279.4mm - 12mm) !important;
              max-height: calc(279.4mm - 12mm) !important;
              min-height: 0 !important;
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
              width: 100% !important;
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
              border-radius: 0 !important;
              box-shadow: none !important;
              overflow: visible !important;
              page-break-inside: auto !important;
              break-inside: auto !important;
            }

            .rx-print-large .rx-prescripcion,
            .rx-print-large .rx-productos {
              overflow: visible !important;
            }

            .rx-print-large .rx-producto {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }

            .rx-separator {
              height: 5mm !important;
            }

            .no-print {
              display: none !important;
            }

            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        `}
      </style>



      {recetaEsLarga && (
        <div className="rx-long-alert no-print">
          Esta receta contiene varios medicamentos o indicaciones largas. Para evitar cortes,
          se imprimirá en dos hojas: una copia para el paciente y otra para el consultorio.
        </div>
      )}


      {recetaEsLarga ? (
        <>
          <div className="rx-page">
            <RecetaCopia tipoCopia="Copia paciente" />
          </div>

          <div className="rx-page">
            <RecetaCopia tipoCopia="Copia consultorio" />
          </div>
        </>
      ) : (
        <div className="rx-page">
          <RecetaCopia tipoCopia="Copia paciente" />

          <div className="rx-separator">
            Corte aquí
          </div>

          <RecetaCopia tipoCopia="Copia consultorio" />
        </div>
      )}


    </div>
  );
}