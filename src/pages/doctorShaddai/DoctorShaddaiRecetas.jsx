import { useEffect, useMemo, useState } from 'react';
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


const pacienteInicial = {
  nombre_paciente: '',
  telefono: '',
  edad: '',
  sexo: '',
  diagnostico: '',
  observaciones: '',
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
    descripcion: 'Primero documenta la consulta mediante una nota médica. Después puedes generar receta o solicitud de laboratorio si aplica.',
    siguientePaso: 'Crear nota médica de la consulta',
    badgeClass: 'bg-sky-100 text-sky-700 border-sky-200',
    panelClass: 'border-sky-200 bg-sky-50 text-sky-800',
  },
  SERVICIO_RAPIDO: {
    value: 'SERVICIO_RAPIDO',
    label: 'Servicio clínico rápido',
    titulo: 'Servicio clínico rápido',
    descripcion: 'Registra el procedimiento realizado, como inyección, curación, toma de presión o glucosa.',
    siguientePaso: 'Registrar servicio realizado',
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

  const [receta, setReceta] = useState([]);
  const [enviando, setEnviando] = useState(false);

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

  const recetaHabilitadaPorTipo =
    !mostrarFlujoAtencion ||
    tipoAtencionActual.value === 'SOLO_RECETA' ||
    (tipoAtencionActual.value === 'CONSULTA_MEDICA' && notaMedicaGuardada);

  const laboratorioHabilitadoPorTipo =
    !mostrarFlujoAtencion ||
    tipoAtencionActual.value === 'LABORATORIO' ||
    (tipoAtencionActual.value === 'CONSULTA_MEDICA' && notaMedicaGuardada);

  const [modalImprimirNotaAbierto, setModalImprimirNotaAbierto] = useState(false);
  const [notaParaImprimir, setNotaParaImprimir] = useState(null);

  const [modalReferenciaAbierto, setModalReferenciaAbierto] = useState(false);


  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';

    const valor = new Date(fecha);

    if (Number.isNaN(valor.getTime())) return 'N/A';

    return valor.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: '2-digit',
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
        nombre_paciente: expediente.nombre_paciente || '',
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

    if (mostrarFlujoAtencion && !laboratorioHabilitadoPorTipo) {
      Swal.fire({
        icon: 'info',
        title: 'Laboratorio no es el flujo principal',
        text: `Esta atención está marcada como ${tipoAtencionActual.label}. Si necesitas laboratorio, cambia el tipo de atención o registra la atención correspondiente primero.`,
      });

      return;
    }

    if (requiereNotaMedica && !notaMedicaGuardada) {
      Swal.fire({
        icon: 'warning',
        title: 'Nota médica requerida',
        text:
          'Esta atención está marcada como consulta médica. Primero debes guardar la nota médica antes de generar solicitud de laboratorio.',
        confirmButtonColor: '#0284c7',
      });

      return;
    }

    setModalLaboratorioAbierto(true);
  };

  const guardarSolicitudLaboratorio = async (solicitud) => {
    try {

      const payload = {
        id_paciente_expediente:
          expedienteSeleccionado?.id_expediente ||
          Number(idExpedienteUrl) ||
          null,

        id_fila: idFilaUrl ? Number(idFilaUrl) : null,

        id_sucursal:
          expedienteSeleccionado?.id_sucursal ||
          null,

        tipo_atencion: tipoAtencionActual.value,
        
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
    const timer = setTimeout(() => {
      if (busqueda.trim().length >= 2) {
        buscarProductos(busqueda.trim());
      } else {
        setProductos([]);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [busqueda]);

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
      nombre_paciente: expediente.nombre_paciente || '',
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

  const productoYaAgregado = (producto) => {
    return receta.some((item) => item.id_producto === producto.id_producto);
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

    if (stockTotal <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin disponibilidad',
        text: 'Este producto no tiene stock disponible.',
      });

      return;
    }

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
      id_producto: producto.id_producto,
      id_sucursal: null,
      nombre: producto.nombre,
      nombre_generico: producto.nombre_generico,
      forma_farmaceutica: producto.forma_farmaceutica,
      presentacion: producto.presentacion,
      codigo_barras: producto.codigo_barras,
      sucursal: null,
      stock: stockTotal,
      precio: producto.precio,
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
  };

  const actualizarItemReceta = (idProducto, campo, valor) => {
    setReceta((prev) =>
      prev.map((item) => {
        if (item.id_producto !== idProducto) {
          return item;
        }

        if (campo === 'cantidad') {
          const cantidad = Number(valor);

          if (!cantidad || cantidad < 1) {
            return {
              ...item,
              cantidad: 1,
            };
          }

          if (cantidad > item.stock) {
            Swal.fire({
              icon: 'warning',
              title: 'Stock insuficiente',
              text: `Solo hay ${item.stock} pieza(s) disponibles en total.`,
              timer: 1600,
              showConfirmButton: false,
            });

            return {
              ...item,
              cantidad: item.stock,
            };
          }

          return {
            ...item,
            cantidad,
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
    actualizarItemReceta(item.id_producto, 'cantidad', Number(item.cantidad) + 1);
  };

  const disminuirCantidad = (item) => {
    actualizarItemReceta(item.id_producto, 'cantidad', Number(item.cantidad) - 1);
  };

  const eliminarProductoReceta = (itemEliminar) => {
    setReceta((prev) => prev.filter((item) => item.id_producto !== itemEliminar.id_producto));
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

    if (requiereNotaMedica && !notaMedicaGuardada) {
      Swal.fire({
        icon: 'warning',
        title: 'Nota médica requerida',
        text:
          'Esta atención está marcada como consulta médica. Primero debes guardar la nota médica antes de generar receta.',
        confirmButtonColor: '#0284c7',
      });

      return false;
    }

    if (mostrarFlujoAtencion && !recetaHabilitadaPorTipo) {
      Swal.fire({
        icon: 'info',
        title: 'Receta no es el flujo principal',
        text: `Esta atención está marcada como ${tipoAtencionActual.label}. El siguiente paso recomendado es: ${tipoAtencionActual.siguientePaso}.`,
      });

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
        !item.dosis.trim() &&
        !item.frecuencia.trim() &&
        !item.duracion.trim() &&
        !item.indicaciones.trim()
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
      id_producto: item.id_producto,
      id_sucursal: null,
      nombre: item.nombre,
      nombre_generico: item.nombre_generico || null,
      forma_farmaceutica: item.forma_farmaceutica || null,
      presentacion: item.presentacion || null,
      codigo_barras: item.codigo_barras || null,
      sucursal: null,
      stock: Number(item.stock || 0),
      precio: Number(item.precio || 0),
      lote: null,
      fecha_caducidad: null,
      cantidad: Number(item.cantidad || 1),
      dosis: item.dosis.trim() || null,
      frecuencia: item.frecuencia.trim() || null,
      duracion: item.duracion.trim() || null,
      indicaciones: item.indicaciones.trim() || null,
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
          doctor: data.doctor || perfilDoctor,
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
    setNotaMedicaActual(nota);
    setNotaMedicaGuardada(true);
    setModalNotaMedicaAbierto(false);

    if (nota?.id_expediente) {
      cargarNotasExpediente(nota.id_expediente);
    }
  };

  const registrarServicioRapidoPendiente = () => {
    Swal.fire({
      icon: 'info',
      title: 'Registro de servicio pendiente',
      html: `
        <div style="text-align:left; font-size:14px; line-height:1.6;">
          <p>Este flujo requiere registrar el servicio clínico realizado.</p>
          <p>Ejemplos: aplicación de inyección, curación, toma de presión, toma de glucosa o nebulización.</p>
          <p>El siguiente paso será crear la tabla y módulo de servicios clínicos.</p>
        </div>
      `,
      confirmButtonColor: '#0284c7',
    });
  };

  const finalizarAtencionDesdeFila = async () => {
    if (!idFilaUrl) return;

    if (requiereNotaMedica && !notaMedicaGuardada) {
      Swal.fire({
        icon: 'warning',
        title: 'Nota médica pendiente',
        text: 'No puedes finalizar una consulta médica sin guardar primero la nota médica.',
        confirmButtonColor: '#0284c7',
      });

      return;
    }

    const result = await Swal.fire({
      icon: 'question',
      title: 'Finalizar atención',
      text: '¿Deseas marcar esta atención como finalizada?',
      showCancelButton: true,
      confirmButtonText: 'Sí, finalizar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#16a34a',
    });

    if (!result.isConfirmed) return;

    try {
      const { data } = await api.put(`/doctor-fila/${idFilaUrl}/finalizar`);

      if (!data.ok) {
        throw new Error(data.mensaje || 'No se pudo finalizar la atención.');
      }

await Swal.fire({
  icon: 'success',
  title: 'Atención finalizada',
  text: 'Regresando a la fila de espera...',
  timer: 1400,
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

            #receta-imprimible,
            #nota-medica-imprimible {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              padding: 0 !important;
              margin: 0 !important;
              background: white !important;
              overflow: visible !important;
            }

            #receta-imprimible {
              height: 50vh !important;
              max-height: 50vh !important;
              overflow: hidden !important;
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
                disabled={cargandoPerfil || !perfilDoctorCompleto || !laboratorioHabilitadoPorTipo || !expedienteSeleccionado?.id_expediente}
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

                {tipoAtencionActual.value === 'SERVICIO_RAPIDO' && (
                  <button
                    type="button"
                    onClick={registrarServicioRapidoPendiente}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-emerald-700 shadow-sm transition hover:bg-emerald-50"
                  >
                    <ClipboardList size={18} />
                    Registrar servicio
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

            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="mb-5">
                <h2 className="text-xl font-bold text-slate-800">Buscar producto</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Busca medicamentos o productos disponibles en inventario.
                </p>
              </div>

              <div className="relative">
                <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />

                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  disabled={!expedienteSeleccionado?.id_expediente}
                  className="w-full rounded-2xl border border-slate-200 py-3 pl-12 pr-4 text-sm outline-none focus:ring-2 focus:ring-sky-500 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                  placeholder={
                    expedienteSeleccionado?.id_expediente
                      ? 'Buscar por nombre, código o medicamento...'
                      : 'Selecciona un expediente antes de buscar productos'
                  }
                />
              </div>

              <div className="mt-4 max-h-[420px] space-y-3 overflow-y-auto pr-1">
                {!expedienteSeleccionado?.id_expediente ? (
                  <div className="rounded-2xl bg-amber-50 p-5 text-sm font-semibold text-amber-700">
                    Selecciona un expediente clínico antes de buscar productos.
                  </div>
                ) : cargandoProductos ? (
                  <div className="flex items-center justify-center gap-2 rounded-2xl bg-slate-50 p-5 text-sm font-bold text-slate-600">
                    <Loader2 size={20} className="animate-spin" />
                    Buscando productos...
                  </div>
                ) : busqueda.trim().length < 2 ? (
                  <div className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">
                    Escribe al menos 2 caracteres para buscar productos.
                  </div>
                ) : productos.length === 0 ? (
                  <div className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">
                    No se encontraron productos con esa búsqueda.
                  </div>
                ) : (
                  productos.map((producto) => {
                    const agregado = productoYaAgregado(producto);
                    const stockTotal = Number(producto.stock_total || producto.stock || 0);
                    const sinStock = stockTotal <= 0;

                    return (
                      <div
                        key={producto.id_producto || producto.codigo_barras || producto.nombre}
                        className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                      >
                        <div className="flex flex-col gap-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <h3 className="font-bold text-slate-800">{producto.nombre}</h3>

                              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                <span
                                  className={`rounded-full px-3 py-1 font-semibold ${stockTotal > 0
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-red-100 text-red-700'
                                    }`}
                                >
                                  Stock total: {stockTotal}
                                </span>

                                {producto.codigo_barras && (
                                  <span className="rounded-full bg-white px-3 py-1 font-semibold text-slate-600">
                                    Código: {producto.codigo_barras}
                                  </span>
                                )}

                                {producto.presentacion && (
                                  <span className="rounded-full bg-white px-3 py-1 font-semibold text-slate-600">
                                    {producto.presentacion}
                                  </span>
                                )}
                              </div>

                              {sinStock && (
                                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                                  <AlertTriangle size={14} />
                                  Sin disponibilidad
                                </div>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => agregarProducto(producto)}
                              disabled={agregado || sinStock}
                              className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-bold transition ${agregado
                                ? 'bg-slate-200 text-slate-500'
                                : sinStock
                                  ? 'bg-red-100 text-red-500'
                                  : 'bg-sky-700 text-white hover:bg-sky-800'
                                }`}
                            >
                              <Plus size={17} />
                              {agregado ? 'Agregado' : 'Agregar'}
                            </button>
                          </div>

                          <div className="rounded-2xl border border-slate-100 bg-white p-3">
                            <p className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500">
                              Disponibilidad por sucursal
                            </p>

                            <div className="grid gap-2 sm:grid-cols-2">
                              {(producto.sucursales || []).map((sucursal) => (
                                <div
                                  key={`${producto.id_producto}-${sucursal.id_sucursal}`}
                                  className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 text-xs"
                                >
                                  <span className="font-semibold text-slate-700">
                                    {sucursal.sucursal}
                                  </span>

                                  <span
                                    className={`rounded-full px-2 py-1 font-bold ${Number(sucursal.stock || 0) > 0
                                      ? 'bg-emerald-100 text-emerald-700'
                                      : 'bg-red-100 text-red-700'
                                      }`}
                                  >
                                    {Number(sucursal.stock || 0)} disp.
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
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
                  Busca productos del inventario y agrégalos a la receta para comenzar.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {receta.map((item) => (
                  <div key={item.id_producto} className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                    <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h3 className="font-bold text-slate-900">{item.nombre}</h3>

                        <p className="mt-1 text-xs text-slate-500">
                          Stock total disponible: {item.stock}
                        </p>

                        {item.presentacion && (
                          <p className="mt-1 text-xs text-slate-500">
                            Presentación: {item.presentacion}
                          </p>
                        )}

                        {item.disponibilidad_sucursales?.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {item.disponibilidad_sucursales.map((sucursal) => (
                              <span
                                key={`${item.id_producto}-${sucursal.id_sucursal}`}
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
                            max={item.stock}
                            value={item.cantidad}
                            onChange={(e) =>
                              actualizarItemReceta(item.id_producto, 'cantidad', e.target.value)
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
                        onChange={(value) => actualizarItemReceta(item.id_producto, 'dosis', value)}
                      />

                      <CampoTextoReceta
                        label="Frecuencia"
                        value={item.frecuencia}
                        placeholder="Ej. cada 8 horas"
                        onChange={(value) => actualizarItemReceta(item.id_producto, 'frecuencia', value)}
                      />

                      <CampoTextoReceta
                        label="Duración"
                        value={item.duracion}
                        placeholder="Ej. por 5 días"
                        onChange={(value) => actualizarItemReceta(item.id_producto, 'duracion', value)}
                      />

                      <div className="md:col-span-2">
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                          Indicaciones
                        </label>

                        <textarea
                          value={item.indicaciones}
                          onChange={(e) =>
                            actualizarItemReceta(item.id_producto, 'indicaciones', e.target.value)
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
                    disabled={enviando || cargandoPerfil || !perfilDoctorCompleto || !recetaHabilitadaPorTipo}
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
                          : requiereNotaMedica && !notaMedicaGuardada
                            ? 'Nota médica pendiente'
                            : 'Generar receta'}
                  </button>
                </div>
              </div>
            )}
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
          nombre_completo: perfilDoctor?.nombre_completo || 'Doctor Shaddai',
          cedula_profesional: perfilDoctor?.cedula_profesional || 'N/A',
          especialidad: perfilDoctor?.especialidad || 'N/A',
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
                  <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-800">
                    Médico
                  </h3>
                  <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[9px] font-bold text-sky-700 print:border print:border-slate-200 print:bg-white">
                    Doctor Shaddai
                  </span>
                </div>

                <div className="space-y-0.5 leading-tight">
                  <p>
                    <strong>Nombre:</strong> {perfilDoctor?.nombre_completo || 'Doctor Shaddai'}
                  </p>
                  <p>
                    <strong>Institución:</strong> Farmacias Shaddai
                  </p>
                  <p>
                    <strong>Especialidad:</strong> {perfilDoctor?.especialidad || 'N/A'}
                  </p>
                  <p>
                    <strong>Cédula:</strong> {perfilDoctor?.cedula_profesional || 'N/A'}
                  </p>
                  <p className="line-clamp-2">
                    <strong>Domicilio:</strong> {perfilDoctor?.direccion_consultorio || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-3">
                <div className="mb-2 flex items-center justify-between gap-2 border-b border-slate-200 pb-1.5">
                  <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-800">
                    Paciente
                  </h3>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-700 print:border print:border-slate-200 print:bg-white">
                    {expediente ? `Exp. #${expediente.id_expediente}` : 'Sin expediente'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 leading-tight">
                  <p className="col-span-2">
                    <strong>Paciente:</strong> {paciente.nombre_paciente || 'N/A'}
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
                      <strong>Alergias:</strong> {expediente.alergias || 'Sin registro'}
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
                  {paciente.diagnostico || 'Sin diagnóstico registrado'}
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
                    <div key={`${item.id_producto || index}`} className="rounded-xl border border-slate-200 bg-slate-50 p-2 print:bg-white">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[11px] font-black leading-tight text-slate-900">
                            {index + 1}. {item.nombre}
                          </p>
                          <p className="mt-0.5 text-[9px] leading-tight text-slate-500">
                            <strong>Genérica:</strong> {item.nombre_generico || '-'} ·{' '}
                            <strong>Presentación:</strong> {item.presentacion || '-'} ·{' '}
                            <strong>Forma:</strong> {item.forma_farmaceutica || '-'}
                          </p>
                        </div>

                        <div className="rounded-lg bg-sky-100 px-2 py-1 text-center text-[10px] font-black text-sky-800 print:border print:border-slate-200 print:bg-white print:text-slate-900">
                          x{item.cantidad}
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
                      + {productos.length - 4} producto(s) adicional(es) registrado(s) en el sistema.
                    </p>
                  )}
                </div>
              </div>

              {paciente.observaciones && (
                <div className="rounded-2xl border border-slate-200 bg-white p-3">
                  <h3 className="mb-1 text-[10px] font-black uppercase tracking-wider text-slate-800">
                    Observaciones
                  </h3>
                  <p className="line-clamp-2 text-[10px] leading-tight text-slate-700">
                    {paciente.observaciones}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-8 text-center text-[10px]">
            <div>
              <div className="mx-auto mb-1.5 h-px w-48 bg-slate-500" />
              <p className="font-black">Firma del médico</p>
              <p className="text-slate-500">{perfilDoctor?.nombre_completo || ''}</p>
            </div>

            <div>
              <div className="mx-auto mb-1.5 h-px w-48 bg-slate-500" />
              <p className="font-black">Cédula profesional</p>
              <p className="text-slate-500">{perfilDoctor?.cedula_profesional || ''}</p>
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
