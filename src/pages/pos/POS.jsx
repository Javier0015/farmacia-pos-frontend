import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import {
  ShoppingCart,
  Search,
  RefreshCw,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  ReceiptText,
  Package,
  Wallet,
  X,
  Barcode,
  UserCheck,
  Coins,
  BadgePercent,
  ClipboardList,
  FileText,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Mail,
} from 'lucide-react';

import BarcodeScannerModal from '../../components/BarcodeScannerModal';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import {
  esSuperAdmin,
  obtenerSucursalInicial,
  filtrarSucursalesPorRol,
} from '../../utils/sucursalPermisos';

const ESTATUS_RECETA = {
  PENDIENTE_CAJERO: 'Pendiente cajero',
  SURTIDA: 'Surtida',
  SURTIDA_PARCIAL: 'Surtida parcial',
  FINALIZADA_SIN_SURTIR: 'Finalizada sin surtir',
  FINALIZADA_PARCIAL: 'Finalizada parcial',
  CANCELADA: 'Cancelada',
};

const PAGOS_MIXTOS_INICIALES = {
  EFECTIVO: '',
  TARJETA: '',
  TRANSFERENCIA: '',
  PUNTOS: '',
};

const METODOS_PAGO_POS = [
  { id: 'EFECTIVO', label: 'Efectivo', icono: Banknote },
  { id: 'TARJETA', label: 'Tarjeta', icono: CreditCard },
  { id: 'TRANSFERENCIA', label: 'Transferencia', icono: Wallet },
  { id: 'PUNTOS', label: 'Puntos', icono: Coins },
];


const DIAS_ALERTA_CADUCIDAD_POS = 30;

const esCorreoValido = (correo = '') => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(correo).trim());
};

const escaparHtmlSeguro = (valor = '') => {
  return String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const normalizarFechaLocal = (fecha) => {
  if (!fecha) return null;

  const valor = new Date(fecha);
  if (Number.isNaN(valor.getTime())) return null;

  valor.setHours(0, 0, 0, 0);
  return valor;
};

const obtenerEstadoCaducidadLote = (fechaCaducidad) => {
  const fecha = normalizarFechaLocal(fechaCaducidad);

  if (!fecha) {
    return {
      estado: 'SIN_CADUCIDAD',
      caducado: false,
      proximoCaducar: false,
      diasRestantes: null,
      label: 'Sin caducidad',
      cardClass: 'border-slate-200 bg-white',
      badgeClass: 'bg-slate-100 text-slate-600',
    };
  }

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const diffMs = fecha.getTime() - hoy.getTime();
  const diasRestantes = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diasRestantes < 0) {
    return {
      estado: 'CADUCADO',
      caducado: true,
      proximoCaducar: false,
      diasRestantes,
      label: 'Caducado',
      cardClass: 'border-red-300 bg-red-50',
      badgeClass: 'bg-red-100 text-red-700',
    };
  }

  if (diasRestantes <= DIAS_ALERTA_CADUCIDAD_POS) {
    return {
      estado: 'PROXIMO_CADUCAR',
      caducado: false,
      proximoCaducar: true,
      diasRestantes,
      label: `Por caducar en ${diasRestantes} día(s)`,
      cardClass: 'border-amber-300 bg-amber-50',
      badgeClass: 'bg-amber-100 text-amber-800',
    };
  }

  return {
    estado: 'VIGENTE',
    caducado: false,
    proximoCaducar: false,
    diasRestantes,
    label: 'Vigente',
    cardClass: 'border-emerald-200 bg-white',
    badgeClass: 'bg-emerald-100 text-emerald-700',
  };
};

const obtenerTipoProductoReceta = (detalle) => {
  if (detalle?.producto_libre === true || detalle?.producto_libre === 'true') {
    return 'LIBRE';
  }

  const tipo = String(detalle?.tipo_producto_receta || 'INVENTARIO')
    .trim()
    .toUpperCase();

  return tipo === 'LIBRE' ? 'LIBRE' : 'INVENTARIO';
};

const esMedicamentoLibreReceta = (detalle) => {
  return (
    obtenerTipoProductoReceta(detalle) === 'LIBRE' ||
    Number(detalle?.id_producto || 0) <= 0
  );
};

const esDetalleSurtibleDesdeInventario = (detalle) => {
  return !esMedicamentoLibreReceta(detalle);
};

const obtenerDisponibilidadDetalleRecetaPOS = (detalle, inventario = []) => {
  if (!esDetalleSurtibleDesdeInventario(detalle)) {
    return {
      surtible: false,
      disponible: false,
      productoInventario: null,
      stockDisponible: 0,
      motivo: 'MEDICAMENTO_LIBRE',
      mensaje: 'Medicamento externo / no surtible desde inventario.',
    };
  }

  const idProducto = Number(detalle?.id_producto || 0);
  const productoInventario = (Array.isArray(inventario) ? inventario : []).find(
    (item) => Number(item.id_producto) === idProducto
  );

  const stockDisponible = Number(
    productoInventario?.stock_actual ??
    productoInventario?.stock ??
    0
  );

  if (!productoInventario || stockDisponible <= 0) {
    return {
      surtible: true,
      disponible: false,
      productoInventario: null,
      stockDisponible: 0,
      motivo: 'SIN_EXISTENCIA',
      mensaje: 'Sin existencias en la sucursal actual.',
    };
  }

  return {
    surtible: true,
    disponible: true,
    productoInventario,
    stockDisponible,
    motivo: null,
    mensaje: `Disponible: ${stockDisponible} pieza(s) en esta sucursal.`,
  };
};

export default function POS() {
  const { usuario } = useAuth();
  const puedeCambiarSucursal = esSuperAdmin(usuario);

  const puedeCambiarCaja = esSuperAdmin(usuario);

  const [sucursales, setSucursales] = useState([]);
  const [cajas, setCajas] = useState([]);
  const [inventario, setInventario] = useState([]);

  const [idSucursal, setIdSucursal] = useState('');
  const [idCaja, setIdCaja] = useState('');
  const [sesionAbierta, setSesionAbierta] = useState(null);

  const [buscar, setBuscar] = useState('');
  const [sugerenciasProductos, setSugerenciasProductos] = useState([]);
  const [cargandoSugerenciasProductos, setCargandoSugerenciasProductos] = useState(false);
  const [mostrandoSugerenciasProductos, setMostrandoSugerenciasProductos] = useState(false);

  const [carrito, setCarrito] = useState([]);

  const [scannerAbierto, setScannerAbierto] = useState(false);
  const [scannerTipo, setScannerTipo] = useState(null);

  const [codigoTarjeta, setCodigoTarjeta] = useState('');
  const [tarjetaPuntos, setTarjetaPuntos] = useState(null);
  const [buscandoTarjeta, setBuscandoTarjeta] = useState(false);

  const [metodoPago, setMetodoPago] = useState('EFECTIVO');
  const [montoRecibido, setMontoRecibido] = useState('');
  const [pagoMixtoActivo, setPagoMixtoActivo] = useState(false);
  const [pagosMixtos, setPagosMixtos] = useState(PAGOS_MIXTOS_INICIALES);
  const [cobrarImpuesto, setCobrarImpuesto] = useState(false);

  const [cargando, setCargando] = useState(false);
  const [cobrando, setCobrando] = useState(false);
  const [ventaFinalizada, setVentaFinalizada] = useState(null);
  const [configuracionPuntos, setConfiguracionPuntos] = useState(null);

  /*
   * Ticket digital:
   * La configuración SMTP se consulta por sucursal. El POS solo envía la
   * decisión del cajero; el backend conserva y usa las credenciales SMTP.
   */
  const [configuracionCorreoSmtp, setConfiguracionCorreoSmtp] = useState(null);
  const [cargandoConfiguracionCorreo, setCargandoConfiguracionCorreo] = useState(false);
  const [enviarTicketDigital, setEnviarTicketDigital] = useState(false);

  const [modalLotesProducto, setModalLotesProducto] = useState(false);
  const [productoSeleccionadoLotes, setProductoSeleccionadoLotes] = useState(null);
  const [lotesProducto, setLotesProducto] = useState([]);
  const [cargandoLotes, setCargandoLotes] = useState(false);
  const [contextoLoteReceta, setContextoLoteReceta] = useState(null);

  const [modalRecetasAbierto, setModalRecetasAbierto] = useState(false);
  const [recetasPendientes, setRecetasPendientes] = useState([]);
  const [cargandoRecetas, setCargandoRecetas] = useState(false);
  const [recetaSeleccionada, setRecetaSeleccionada] = useState(null);
  const [detalleReceta, setDetalleReceta] = useState([]);
  const [detallesRecetasCache, setDetallesRecetasCache] = useState({});
  const [cargandoDetalleReceta, setCargandoDetalleReceta] = useState(false);
  const [finalizandoReceta, setFinalizandoReceta] = useState(false);

  const [modalControladoAbierto, setModalControladoAbierto] = useState(false);
  const [productoControladoPendiente, setProductoControladoPendiente] = useState(null);
  const [datosControlProducto, setDatosControlProducto] = useState({
    numero_receta: '',
    fecha_receta: '',
    medico_nombre: '',
    medico_cedula: '',
    paciente_nombre: '',
    paciente_telefono: '',
    cantidad_recetada: '',
    cantidad_surtida: '1',
    tipo_surtido: 'COMPLETO',
    cantidad_pendiente: 0,
    observaciones: '',
  });

  const [modalServiciosAbierto, setModalServiciosAbierto] = useState(false);
  const [serviciosPendientes, setServiciosPendientes] = useState([]);
  const [cargandoServicios, setCargandoServicios] = useState(false);
  const [servicioSeleccionado, setServicioSeleccionado] = useState(null);
  const [detalleServicio, setDetalleServicio] = useState([]);
  const [cargandoDetalleServicio, setCargandoDetalleServicio] = useState(false);

  const sucursalActual = useMemo(() => {
    return sucursales.find((s) => Number(s.id_sucursal) === Number(idSucursal));
  }, [sucursales, idSucursal]);

  const cajaActual = useMemo(() => {
    return cajas.find((c) => Number(c.id_caja) === Number(idCaja));
  }, [cajas, idCaja]);

  const correoTicketDigital = String(tarjetaPuntos?.correo || '')
    .trim()
    .toLowerCase();

  const tieneCorreoTicketDigital = esCorreoValido(correoTicketDigital);
  const servicioCorreoActivo = Boolean(configuracionCorreoSmtp?.activo);

  /*
   * Solo habilitamos el checkbox cuando existe correo válido en la tarjeta y
   * una configuración SMTP activa (global o de la sucursal).
   */
  const puedeEnviarTicketDigital =
    tieneCorreoTicketDigital && servicioCorreoActivo;

  const recetaEnCarrito = useMemo(() => {
    const item = carrito.find((p) => p.id_receta_shaddai);
    if (!item) return null;

    return {
      id_receta: item.id_receta_shaddai,
      folio: item.folio_receta_shaddai,
      paciente: item.paciente_receta_shaddai,
    };
  }, [carrito]);

  const esValorActivo = (valor) => {
    return valor === true || valor === 'true' || valor === 1 || valor === '1';
  };

  const esProductoControlado = (producto) => {
    return (
      esValorActivo(producto.controlado) ||
      esValorActivo(producto.es_controlado) ||
      esValorActivo(producto.producto_controlado)
    );
  };

  const productoRequiereReceta = (producto) => {
    return (
      esValorActivo(producto.requiere_receta) ||
      esValorActivo(producto.receta_requerida) ||
      esValorActivo(producto.requiereReceta)
    );
  };

  const tieneOfertaActiva = (producto) => {
    return (
      esValorActivo(producto.tiene_oferta) ||
      Number(producto.id_oferta || 0) > 0 ||
      Number(producto.porcentaje_descuento || 0) > 0
    );
  };

  const obtenerPrecioFinalProducto = (producto) => {
    if (tieneOfertaActiva(producto)) {
      return Number(producto.precio_con_descuento || producto.precio_venta || 0);
    }
    return Number(producto.precio_venta || 0);
  };

  const obtenerDescuentoUnitarioProducto = (producto) => {
    if (!tieneOfertaActiva(producto)) return 0;
    return Number(producto.descuento_unitario || 0);
  };

  const obtenerPorcentajeDescuentoProducto = (producto) => {
    if (!tieneOfertaActiva(producto)) return 0;
    return Number(producto.porcentaje_descuento || 0);
  };

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

  const formatoFechaCorta = (fecha) => {
    if (!fecha) return 'Sin caducidad';
    const valor = new Date(fecha);
    if (Number.isNaN(valor.getTime())) return 'Sin caducidad';
    return valor.toLocaleDateString('es-MX');
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

  const obtenerKeyCarrito = (idProducto, idLote) => {
    return `${Number(idProducto)}-${idLote ? Number(idLote) : 'FEFO'}`;
  };

  const obtenerCantidadRecetadaDetalle = (detalle) => {
    return Number(
      detalle?.cantidad_recetada ??
      detalle?.cantidad_solicitada ??
      detalle?.cantidad ??
      1
    );
  };

  const obtenerCantidadSurtidaDetalle = (detalle) => {
    return Number(
      detalle?.cantidad_surtida ??
      detalle?.total_surtido ??
      detalle?.surtido ??
      0
    );
  };

  const obtenerCantidadEnCarritoDetalle = (detalle, carritoBase = carrito) => {
    if (!detalle) return 0;

    const idDetalle = Number(
      detalle.id_detalle ||
      detalle.id_detalle_receta ||
      detalle.id_detalle_receta_shaddai ||
      0
    );

    return (Array.isArray(carritoBase) ? carritoBase : [])
      .filter((item) => {
        const idDetalleItem = Number(item.id_detalle_receta_shaddai || 0);
        return idDetalle > 0 && idDetalleItem === idDetalle;
      })
      .reduce((acc, item) => acc + Number(item.cantidad || 0), 0);
  };

  const obtenerEstadoSurtidoDetallePOS = (detalle, carritoBase = carrito) => {
    const cantidadRecetada = obtenerCantidadRecetadaDetalle(detalle);
    const cantidadSurtidaPrevia = obtenerCantidadSurtidaDetalle(detalle);
    const cantidadEnCarrito = obtenerCantidadEnCarritoDetalle(detalle, carritoBase);
    const cantidadTotalConsiderada = cantidadSurtidaPrevia + cantidadEnCarrito;
    const cantidadPendiente = Math.max(cantidadRecetada - cantidadTotalConsiderada, 0);

    return {
      cantidadRecetada,
      cantidadSurtidaPrevia,
      cantidadEnCarrito,
      cantidadTotalConsiderada,
      cantidadPendiente,
      vendidoCompleto: cantidadRecetada > 0 && cantidadTotalConsiderada >= cantidadRecetada,
      vendidoParcial: cantidadTotalConsiderada > 0 && cantidadTotalConsiderada < cantidadRecetada,
    };
  };



  const porcentajeClientePuntos = Number(configuracionPuntos?.porcentaje_cliente || 0);
  const puntosClienteActivo =
    configuracionPuntos?.puntos_cliente_activo === true ||
    configuracionPuntos?.puntos_cliente_activo === 'true';

  const resumen = useMemo(() => {
    const subtotalSinDescuento = carrito.reduce((acc, item) => {
      return acc + Number(item.cantidad) * Number(item.precio_original || item.precio_venta || 0);
    }, 0);

    const descuentoOfertas = carrito.reduce((acc, item) => {
      return acc + Number(item.cantidad) * Number(item.descuento_unitario || 0);
    }, 0);

    const subtotal = carrito.reduce((acc, item) => {
      return acc + Number(item.cantidad) * Number(item.precio_venta || 0);
    }, 0);

    const baseGravable = Math.max(subtotal, 0);
    const impuesto = cobrarImpuesto ? baseGravable * 0.16 : 0;
    const total = Math.max(baseGravable + impuesto, 0);

    const esPagoConPuntos = !pagoMixtoActivo && metodoPago === 'PUNTOS';
    const puntosEstimados =
      tarjetaPuntos && puntosClienteActivo && !esPagoConPuntos
        ? Number((total * (porcentajeClientePuntos / 100)).toFixed(2))
        : 0;

    const puntosDisponibles = Number(tarjetaPuntos?.puntos_actuales || 0);
    const puntosNecesarios = Number(total.toFixed(2));
    const puntosFaltantes = Math.max(puntosNecesarios - puntosDisponibles, 0);
    const puedePagarConPuntos =
      esPagoConPuntos && tarjetaPuntos && puntosDisponibles >= puntosNecesarios;

    const recibido = Number(montoRecibido || 0);
    const cambio = metodoPago === 'EFECTIVO' ? recibido - total : 0;

    return {
      subtotal,
      subtotalSinDescuento,
      descuentoOfertas,
      impuesto,
      total,
      recibido,
      cambio,
      puntosEstimados,
      puntosDisponibles,
      puntosNecesarios,
      puntosFaltantes,
      puedePagarConPuntos,
    };
  }, [
    carrito,
    cobrarImpuesto,
    montoRecibido,
    metodoPago,
    pagoMixtoActivo,
    tarjetaPuntos,
    puntosClienteActivo,
    porcentajeClientePuntos,
  ]);

  const resumenPagosMixtos = useMemo(() => {
    const efectivo = Number(pagosMixtos.EFECTIVO || 0);
    const tarjeta = Number(pagosMixtos.TARJETA || 0);
    const transferencia = Number(pagosMixtos.TRANSFERENCIA || 0);
    const puntos = Number(pagosMixtos.PUNTOS || 0);

    const totalNoEfectivo = tarjeta + transferencia + puntos;
    const totalPagado = efectivo + totalNoEfectivo;
    const pendiente = Math.max(Number((resumen.total - totalPagado).toFixed(2)), 0);
    const excedenteNoEfectivo = Math.max(Number((totalNoEfectivo - resumen.total).toFixed(2)), 0);
    const pendienteAntesDeEfectivo = Math.max(Number((resumen.total - totalNoEfectivo).toFixed(2)), 0);
    const cambio = Math.max(Number((efectivo - pendienteAntesDeEfectivo).toFixed(2)), 0);

    const pagos = [
      { metodo_pago: 'EFECTIVO', monto: efectivo },
      { metodo_pago: 'TARJETA', monto: tarjeta },
      { metodo_pago: 'TRANSFERENCIA', monto: transferencia },
      { metodo_pago: 'PUNTOS', monto: puntos },
    ].filter((pago) => Number(pago.monto || 0) > 0);

    return {
      efectivo,
      tarjeta,
      transferencia,
      puntos,
      totalNoEfectivo,
      totalPagado,
      pendiente,
      excedenteNoEfectivo,
      cambio,
      pagos,
    };
  }, [pagosMixtos, resumen.total]);

  const actualizarPagoMixto = (metodo, valor) => {
    const valorLimpio = Number(valor || 0) < 0 ? '0' : valor;

    if (metodo === 'PUNTOS' && valorLimpio && !tarjetaPuntos) {
      Swal.fire({
        icon: 'warning',
        title: 'Tarjeta requerida',
        text: 'Para usar puntos primero debes vincular una tarjeta de puntos.',
      });
      return;
    }

    setPagosMixtos((prev) => ({
      ...prev,
      [metodo]: valorLimpio,
    }));
  };

  const alternarPagoMixto = () => {
    setPagoMixtoActivo((activo) => {
      const nuevoEstado = !activo;

      if (nuevoEstado) {
        setMetodoPago('EFECTIVO');
        setMontoRecibido('');
        setPagosMixtos({
          ...PAGOS_MIXTOS_INICIALES,
          EFECTIVO: resumen.total > 0 ? String(Number(resumen.total.toFixed(2))) : '',
        });
      } else {
        setPagosMixtos(PAGOS_MIXTOS_INICIALES);
      }

      return nuevoEstado;
    });
  };

  const cargarConfiguracionPuntos = async () => {
    try {
      const { data } = await api.get('/configuracion-puntos');
      if (data.ok) setConfiguracionPuntos(data.configuracion);
    } catch (error) {
      console.error('Error al cargar configuración de puntos:', error);
    }
  };

  const cargarConfiguracionCorreoTicket = async () => {
    const idSucursalNumerico = Number(idSucursal);

    if (!Number.isInteger(idSucursalNumerico) || idSucursalNumerico <= 0) {
      setConfiguracionCorreoSmtp(null);
      setEnviarTicketDigital(false);
      return;
    }

    try {
      setCargandoConfiguracionCorreo(true);

      const { data } = await api.get('/configuracion-correo-smtp', {
        params: {
          id_sucursal: idSucursalNumerico,
        },
      });

      if (!data?.ok) {
        throw new Error(
          data?.mensaje ||
          'No se pudo cargar la configuración de correo para la sucursal.'
        );
      }

      setConfiguracionCorreoSmtp(data.configuracion || null);
    } catch (error) {
      /*
       * No bloqueamos el POS si el servicio de correo no está disponible.
       * Simplemente se deshabilita la opción de ticket digital.
       */
      console.warn(
        'No se pudo cargar la configuración de correo para ticket digital:',
        error
      );

      setConfiguracionCorreoSmtp(null);
      setEnviarTicketDigital(false);
    } finally {
      setCargandoConfiguracionCorreo(false);
    }
  };

  const cargarSucursales = async () => {
    try {
      const { data } = await api.get('/sucursales');
      if (data.ok) {
        const activas = (data.sucursales || []).filter((s) => s.activo);
        const sucursalesPermitidas = filtrarSucursalesPorRol(usuario, activas);
        setSucursales(sucursalesPermitidas);
        if (!idSucursal) setIdSucursal(obtenerSucursalInicial(usuario, sucursalesPermitidas));
      }
    } catch (error) {
      console.error(error);
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudieron cargar las sucursales.' });
    }
  };

  const cargarCajas = async () => {
    if (!idSucursal) return;

    try {
      const { data } = await api.get(
        `/caja/cajas?sucursal=${idSucursal}`
      );

      if (data.ok) {
        const cajasActivas = (data.cajas || []).filter(
          (caja) => caja.activo
        );

        setCajas(cajasActivas);

        // El administrador conserva su selección si sigue disponible.
        if (puedeCambiarCaja) {
          setIdCaja((cajaAnterior) => {
            const sigueDisponible = cajasActivas.some(
              (caja) =>
                Number(caja.id_caja) === Number(cajaAnterior)
            );

            return sigueDisponible
              ? cajaAnterior
              : String(cajasActivas[0]?.id_caja || '');
          });

          return;
        }

        /*
         * Para cajeros el backend devolverá solamente su caja asignada.
         * Se selecciona automáticamente y no podrán cambiarla.
         */
        setIdCaja(String(cajasActivas[0]?.id_caja || ''));
      }
    } catch (error) {
      console.error(error);

      setCajas([]);
      setIdCaja('');

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudieron cargar las cajas.',
      });
    }
  };

  const cargarSesionAbierta = async () => {
    if (!idCaja) {
      setSesionAbierta(null);
      return;
    }

    try {
      const { data } = await api.get(`/caja/sesion-abierta?id_caja=${idCaja}`);
      if (data.ok) setSesionAbierta(data.sesion_abierta);
    } catch (error) {
      console.error(error);
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo consultar la sesión de caja.' });
    }
  };

  const cargarInventario = async (busquedaManual = null) => {
    if (!idSucursal) return;

    try {
      setCargando(true);
      const params = new URLSearchParams();
      params.append('sucursal', idSucursal);
      const terminoBusqueda = String(busquedaManual ?? buscar ?? '').trim();
      if (terminoBusqueda) params.append('buscar', terminoBusqueda);

      const { data } = await api.get(`/inventario?${params.toString()}`);
      if (data.ok) {
        const productosConStock = (data.inventario || []).filter(
          (item) => Number(item.stock_actual) > 0
        );
        setInventario(productosConStock);
      }
    } catch (error) {
      console.error(error);
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo cargar el inventario.' });
    } finally {
      setCargando(false);
    }
  };

  const buscarSugerenciasProductos = async (termino) => {
    const texto = String(termino || '').trim();

    if (!idSucursal || texto.length < 2) {
      setSugerenciasProductos([]);
      setMostrandoSugerenciasProductos(false);
      return;
    }

    try {
      setCargandoSugerenciasProductos(true);

      const params = new URLSearchParams();
      params.append('sucursal', idSucursal);
      params.append('buscar', texto);
      params.append('limit', '8');
      params.append('autocomplete', '1');

      const { data } = await api.get(`/inventario?${params.toString()}`);

      if (data.ok) {
        const lista =
          data.inventario ||
          data.productos ||
          data.resultados ||
          [];

        const productosConStock = lista
          .filter((item) => Number(item.stock_actual || item.stock || 0) > 0)
          .slice(0, 8);

        setSugerenciasProductos(productosConStock);
        setMostrandoSugerenciasProductos(true);
      } else {
        setSugerenciasProductos([]);
      }
    } catch (error) {
      console.error('Error al buscar sugerencias de productos:', error);
      setSugerenciasProductos([]);
    } finally {
      setCargandoSugerenciasProductos(false);
    }
  };

  const cargarLotesProductoPOS = async (idProducto) => {
    if (!idSucursal || !idProducto) return [];

    try {
      setCargandoLotes(true);
      const params = new URLSearchParams();
      params.append('sucursal', idSucursal);
      params.append('producto', idProducto);

      const { data } = await api.get(`/inventario/lotes?${params.toString()}`);

      if (data.ok) {
        return (data.lotes || []).filter((lote) => Number(lote.stock_actual || 0) > 0);
      }
      return [];
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.mensaje || 'No se pudieron cargar los lotes del producto.',
      });
      return [];
    } finally {
      setCargandoLotes(false);
    }
  };

  const cargarRecetasPendientes = async () => {
    try {
      setCargandoRecetas(true);

      const { data } = await api.get('/doctor-shaddai/recetas', {
        params: {
          estatus: 'PENDIENTE_CAJERO,SURTIDA_PARCIAL',
          id_sucursal: Number(idSucursal),
        },
      });

      if (data.ok) setRecetasPendientes(data.recetas || []);
    } catch (error) {
      console.error('Error al cargar recetas pendientes:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.mensaje || 'No se pudieron cargar las recetas pendientes.',
      });
    } finally {
      setCargandoRecetas(false);
    }
  };

  const cargarServiciosPendientes = async () => {
    const idSucursalActiva = Number(idSucursal);

    if (!Number.isInteger(idSucursalActiva) || idSucursalActiva <= 0) {
      setServiciosPendientes([]);
      return;
    }

    try {
      setCargandoServicios(true);

      const { data } = await api.get('/doctor-shaddai/servicios-clinicos', {
        params: {
          estatus: 'PENDIENTE_CAJERO',
          id_sucursal: idSucursalActiva,
        },
      });

      if (data.ok) {
        setServiciosPendientes(data.servicios || []);
      }
    } catch (error) {
      console.error('Error al cargar servicios clínicos pendientes:', error);
      setServiciosPendientes([]);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudieron cargar los servicios clínicos pendientes.',
      });
    } finally {
      setCargandoServicios(false);
    }
  };

  useEffect(() => {
    if (usuario) {
      cargarSucursales();
      cargarConfiguracionPuntos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario]);

  useEffect(() => {
    if (idSucursal) {
      setIdCaja('');
      setSesionAbierta(null);
      setCarrito([]);
      setDetallesRecetasCache({});
      setServiciosPendientes([]);
      setServicioSeleccionado(null);
      setDetalleServicio([]);
      setTarjetaPuntos(null);
      setCodigoTarjeta('');
      setEnviarTicketDigital(false);
      setConfiguracionCorreoSmtp(null);
      setMetodoPago('EFECTIVO');
      setMontoRecibido('');
      setPagoMixtoActivo(false);
      setPagosMixtos(PAGOS_MIXTOS_INICIALES);
      cargarCajas();
      cargarInventario();
      cargarRecetasPendientes();
      cargarServiciosPendientes();
      cargarConfiguracionCorreoTicket();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idSucursal]);

  /*
   * Cuando la tarjeta tiene correo y la configuración de la sucursal indica
   * envío automático, el checkbox inicia seleccionado. El cajero aún puede
   * desactivarlo antes de cobrar.
   */
  useEffect(() => {
    if (!tarjetaPuntos || !tieneCorreoTicketDigital || !servicioCorreoActivo) {
      setEnviarTicketDigital(false);
      return;
    }

    if (configuracionCorreoSmtp?.enviar_ticket_automatico) {
      setEnviarTicketDigital(true);
    }
  }, [
    tarjetaPuntos?.id_tarjeta,
    tarjetaPuntos?.correo,
    tieneCorreoTicketDigital,
    servicioCorreoActivo,
    configuracionCorreoSmtp?.enviar_ticket_automatico,
  ]);

  useEffect(() => {
    if (idCaja) cargarSesionAbierta();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idCaja]);

  useEffect(() => {
    const texto = String(buscar || '').trim();

    if (!texto || texto.length < 2) {
      setSugerenciasProductos([]);
      setMostrandoSugerenciasProductos(false);
      return;
    }

    const temporizador = setTimeout(() => {
      buscarSugerenciasProductos(texto);
    }, 300);

    return () => clearTimeout(temporizador);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buscar, idSucursal]);

  const refrescarTodo = async () => {
    await cargarConfiguracionPuntos();
    await cargarConfiguracionCorreoTicket();
    await cargarCajas();
    await cargarSesionAbierta();
    await cargarInventario();
    await cargarRecetasPendientes();
    await cargarServiciosPendientes();
  };

  const abrirModalControlado = (producto) => {
    setProductoControladoPendiente(producto);
    setDatosControlProducto({
      numero_receta: '',
      fecha_receta: '',
      medico_nombre: '',
      medico_cedula: '',
      paciente_nombre: '',
      paciente_telefono: '',
      cantidad_recetada: '',
      cantidad_surtida: '1',
      tipo_surtido: 'COMPLETO',
      cantidad_pendiente: 0,
      observaciones: '',
    });
    setModalControladoAbierto(true);
  };

  const confirmarDatosControlado = async () => {
    if (!productoControladoPendiente) return;

    const esControlado = esProductoControlado(productoControladoPendiente);
    const requiereReceta = productoRequiereReceta(productoControladoPendiente);

    if ((esControlado || requiereReceta) && !datosControlProducto.numero_receta.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Número de receta requerido',
        text: 'Captura el número de receta antes de continuar.',
      });
      return;
    }

    if (!datosControlProducto.medico_nombre.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Médico requerido',
        text: 'Captura el nombre del médico.',
      });
      return;
    }

    if (!datosControlProducto.medico_cedula.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Cédula requerida',
        text: 'Captura la cédula profesional del médico.',
      });
      return;
    }

    if (!datosControlProducto.paciente_nombre.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Paciente requerido',
        text: 'Captura el nombre del paciente.',
      });
      return;
    }

    const cantidadRecetadaExterna = Number(datosControlProducto.cantidad_recetada || 0);
    const cantidadSurtidaExterna = Number(datosControlProducto.cantidad_surtida || 0);

    if (cantidadRecetadaExterna <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Cantidad indicada requerida',
        text: 'Captura cuántas piezas/cajas indica la receta externa.',
      });
      return;
    }

    if (cantidadSurtidaExterna <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Cantidad a surtir requerida',
        text: 'Captura cuántas piezas/cajas se van a surtir ahora.',
      });
      return;
    }

    if (cantidadSurtidaExterna > cantidadRecetadaExterna) {
      Swal.fire({
        icon: 'warning',
        title: 'Cantidad no válida',
        text: 'La cantidad a surtir no puede ser mayor que la cantidad indicada en la receta.',
      });
      return;
    }

    const cantidadPendienteExterna = Math.max(cantidadRecetadaExterna - cantidadSurtidaExterna, 0);
    const tipoSurtidoExterno = cantidadPendienteExterna === 0 ? 'COMPLETO' : 'PARCIAL';

    const productoConControl = {
      ...productoControladoPendiente,
      cantidad_control_sanitario_sugerida: cantidadSurtidaExterna,
      datos_control_sanitario: {
        ...datosControlProducto,
        tipo_receta: 'EXTERNA',
        cantidad_recetada: cantidadRecetadaExterna,
        cantidad_surtida: cantidadSurtidaExterna,
        cantidad_pendiente: cantidadPendienteExterna,
        tipo_surtido: tipoSurtidoExterno,
      },
    };

    setModalControladoAbierto(false);
    setProductoControladoPendiente(null);

    await abrirModalLotesParaProducto({
      producto: productoConControl,
      receta: null,
      detalle: null,
      omitirValidacionControlado: true,
    });
  };



  const validarProductoEspecial = async (producto) => {
    const esControlado = esProductoControlado(producto);
    const requiereReceta = productoRequiereReceta(producto);

    if (!esControlado && !requiereReceta) return true;

    const mensajes = [];
    if (esControlado) mensajes.push('Este producto está marcado como medicamento controlado.');
    if (requiereReceta) mensajes.push('Este producto requiere receta médica.');

    const confirmacion = await Swal.fire({
      icon: 'warning',
      title: 'Producto con restricción',
      html: `
        <div style="text-align:left">
          <p><b>${producto.producto || producto.nombre}</b></p>
          <ul style="margin-top:8px">${mensajes.map((m) => `<li>${m}</li>`).join('')}</ul>
          <p style="margin-top:10px">Verifica la receta o autorización antes de continuar con la venta.</p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Sí, agregar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#0369a1',
      cancelButtonColor: '#64748b',
    });

    return confirmacion.isConfirmed;
  };

  const abrirModalLotesParaProducto = async ({
    producto,
    receta = null,
    detalle = null,
    omitirValidacionControlado = false,
  }) => {
    if (!sesionAbierta) {
      Swal.fire({ icon: 'warning', title: 'Caja no abierta', text: 'Primero abre una caja para poder vender.' });
      return;
    }

    if (
      !receta &&
      !omitirValidacionControlado &&
      (esProductoControlado(producto) || productoRequiereReceta(producto))
    ) {
      abrirModalControlado(producto);
      return;
    }

    const stockDisponible = Number(producto.stock_actual || detalle?.stock_disponible || 0);
    if (stockDisponible <= 0) {
      Swal.fire({ icon: 'warning', title: 'Sin stock', text: 'Este producto no tiene stock disponible.' });
      return;
    }

    if (!receta && !omitirValidacionControlado) {
      const puedeAgregar = await validarProductoEspecial(producto);
      if (!puedeAgregar) return;
    }

    const lotesDisponibles = await cargarLotesProductoPOS(producto.id_producto);

    if (lotesDisponibles.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin lotes disponibles',
        text: 'Este producto tiene stock general, pero no hay lotes activos con existencia. Revisa inventario.',
      });
      return;
    }

    setProductoSeleccionadoLotes(producto);
    setLotesProducto(lotesDisponibles);
    setContextoLoteReceta(receta ? { receta, detalle } : null);
    setModalLotesProducto(true);
  };

  const agregarAlCarrito = async (producto) => {
    await abrirModalLotesParaProducto({ producto });
  };

  const agregarProductoConLote = (producto, loteItem, cantidadManual = 1) => {
    if (!producto || !loteItem) return;

    const estadoCaducidad = obtenerEstadoCaducidadLote(loteItem.fecha_caducidad);

    if (estadoCaducidad.caducado) {
      Swal.fire({
        icon: 'error',
        title: 'Lote caducado',
        text: `El lote ${loteItem.lote || 'seleccionado'} ya caducó y no puede agregarse al carrito.`,
      });
      return;
    }

    const idLote = loteItem?.id_lote ? Number(loteItem.id_lote) : null;
    const stockDisponible = Number(loteItem?.stock_actual || producto.stock_actual || 0);
    const cantidadAgregar = Math.max(Number(cantidadManual || 1), 1);
    const keyCarrito = obtenerKeyCarrito(producto.id_producto, idLote);

    if (stockDisponible <= 0) {
      Swal.fire({ icon: 'warning', title: 'Lote sin stock', text: 'El lote seleccionado no tiene stock disponible.' });
      return;
    }

    if (cantidadAgregar > stockDisponible) {
      Swal.fire({
        icon: 'warning',
        title: 'Stock insuficiente',
        text: `Solo hay ${formatoNumero(stockDisponible)} piezas disponibles en el lote ${loteItem.lote}.`,
      });
      return;
    }

    const precioOriginal = Number(producto.precio_venta || 0);
    const precioFinal = obtenerPrecioFinalProducto(producto);
    const descuentoUnitario = obtenerDescuentoUnitarioProducto(producto);
    const porcentajeDescuento = obtenerPorcentajeDescuentoProducto(producto);
    const tieneOferta = tieneOfertaActiva(producto);

    const receta = contextoLoteReceta?.receta || null;
    const detalle = contextoLoteReceta?.detalle || null;
    const datosControlSanitarioBase = producto.datos_control_sanitario || null;

    const esProductoDeReceta = !!(receta?.id_receta && detalle);
    const cantidadRecetada = esProductoDeReceta
      ? obtenerCantidadRecetadaDetalle(detalle)
      : null;
    const cantidadSurtidaPrevia = esProductoDeReceta
      ? obtenerCantidadSurtidaDetalle(detalle)
      : null;
    const cantidadEnCarritoPrevia = esProductoDeReceta
      ? obtenerCantidadEnCarritoDetalle(detalle)
      : 0;
    const cantidadPendienteAntes = esProductoDeReceta
      ? Math.max(cantidadRecetada - cantidadSurtidaPrevia - cantidadEnCarritoPrevia, 0)
      : null;

    if (esProductoDeReceta && cantidadPendienteAntes <= 0) {
      Swal.fire({
        icon: 'info',
        title: 'Sin pendiente por surtir',
        text: 'Este producto de la receta ya fue surtido por completo.',
      });
      return;
    }

    if (esProductoDeReceta && cantidadAgregar > cantidadPendienteAntes) {
      Swal.fire({
        icon: 'warning',
        title: 'Cantidad mayor a la pendiente',
        text: `Solo quedan ${formatoNumero(cantidadPendienteAntes)} pieza(s) pendientes de esta receta.`,
      });
      return;
    }

    const cantidadPendienteDespues = esProductoDeReceta
      ? Math.max(cantidadPendienteAntes - cantidadAgregar, 0)
      : null;
    const tipoSurtidoReceta = esProductoDeReceta
      ? cantidadPendienteDespues === 0
        ? 'COMPLETA'
        : 'PARCIAL'
      : null;
    const estatusDetalleReceta = esProductoDeReceta
      ? cantidadPendienteDespues === 0
        ? 'SURTIDO'
        : 'SURTIDO_PARCIAL'
      : null;

    const datosControlSanitarioActualizado = datosControlSanitarioBase
      ? (() => {
        const cantidadRecetadaExterna = Number(datosControlSanitarioBase.cantidad_recetada || 0);
        const cantidadSurtidaExterna = cantidadAgregar;
        const cantidadPendienteExterna = cantidadRecetadaExterna > 0
          ? Math.max(cantidadRecetadaExterna - cantidadSurtidaExterna, 0)
          : null;
        const tipoSurtidoExterno = cantidadRecetadaExterna > 0
          ? cantidadPendienteExterna === 0
            ? 'COMPLETO'
            : 'PARCIAL'
          : datosControlSanitarioBase.tipo_surtido || null;

        return {
          ...datosControlSanitarioBase,
          tipo_receta: datosControlSanitarioBase.tipo_receta || 'EXTERNA',
          cantidad_recetada: cantidadRecetadaExterna || datosControlSanitarioBase.cantidad_recetada || null,
          cantidad_surtida: cantidadSurtidaExterna,
          cantidad_pendiente: cantidadPendienteExterna,
          tipo_surtido: tipoSurtidoExterno,
        };
      })()
      : null;

    setCarrito((prev) => {
      const existe = prev.find((item) => item.key_carrito === keyCarrito);

      if (existe) {
        const nuevaCantidad = Number(existe.cantidad || 0) + cantidadAgregar;

        if (nuevaCantidad > stockDisponible) {
          Swal.fire({
            icon: 'warning',
            title: 'Stock insuficiente',
            text: `Solo hay ${formatoNumero(stockDisponible)} piezas disponibles en el lote ${loteItem.lote}.`,
          });
          return prev;
        }

        return prev.map((item) =>
          item.key_carrito === keyCarrito
            ? {
              ...item,
              cantidad: nuevaCantidad,
              id_receta_shaddai: receta?.id_receta || item.id_receta_shaddai || null,
              folio_receta_shaddai:
                receta?.folio_receta || receta?.id_receta || item.folio_receta_shaddai || null,
              paciente_receta_shaddai: receta?.nombre_paciente || item.paciente_receta_shaddai || null,
              id_detalle_receta_shaddai: detalle?.id_detalle || item.id_detalle_receta_shaddai || null,
              datos_control_sanitario:
                datosControlSanitarioActualizado || item.datos_control_sanitario || null,
              cantidad_recetada_shaddai: cantidadRecetada ?? item.cantidad_recetada_shaddai ?? null,
              cantidad_surtida_previa_shaddai:
                cantidadSurtidaPrevia ?? item.cantidad_surtida_previa_shaddai ?? null,
              cantidad_en_carrito_previa_shaddai:
                cantidadEnCarritoPrevia ?? item.cantidad_en_carrito_previa_shaddai ?? null,
              cantidad_pendiente_previa_shaddai:
                cantidadPendienteAntes ?? item.cantidad_pendiente_previa_shaddai ?? null,
              cantidad_surtida_actual_shaddai:
                Number(item.cantidad_surtida_actual_shaddai || 0) + cantidadAgregar,
              cantidad_pendiente_despues_shaddai: cantidadPendienteDespues ?? item.cantidad_pendiente_despues_shaddai ?? null,
              tipo_surtido_receta_shaddai: tipoSurtidoReceta || item.tipo_surtido_receta_shaddai || null,
              estatus_detalle_receta_shaddai:
                estatusDetalleReceta || item.estatus_detalle_receta_shaddai || null,
            }
            : item
        );
      }

      return [
        ...prev,
        {
          key_carrito: keyCarrito,
          id_producto: producto.id_producto,
          id_lote: idLote,
          lote: loteItem?.lote || null,
          fecha_caducidad: loteItem?.fecha_caducidad || null,
          stock_lote: stockDisponible,

          nombre: producto.producto || producto.nombre,
          codigo_barras: producto.codigo_barras,
          categoria: producto.categoria,
          laboratorio: producto.laboratorio,
          presentacion: producto.presentacion,

          precio_original: precioOriginal,
          precio_venta: precioFinal,

          tiene_oferta: tieneOferta,
          id_oferta: producto.id_oferta || null,
          oferta_nombre: producto.oferta_nombre || producto.nombre_oferta || null,
          porcentaje_descuento: porcentajeDescuento,
          descuento_unitario: descuentoUnitario,

          stock_actual: stockDisponible,
          cantidad: cantidadAgregar,
          controlado: esProductoControlado(producto),
          requiere_receta: productoRequiereReceta(producto),
          datos_control_sanitario: datosControlSanitarioActualizado,
          cantidad_recetada_shaddai: cantidadRecetada,
          cantidad_surtida_previa_shaddai: cantidadSurtidaPrevia,
          cantidad_en_carrito_previa_shaddai: cantidadEnCarritoPrevia,
          cantidad_pendiente_previa_shaddai: cantidadPendienteAntes,
          cantidad_surtida_actual_shaddai: esProductoDeReceta ? cantidadAgregar : null,
          cantidad_pendiente_despues_shaddai: cantidadPendienteDespues,
          tipo_surtido_receta_shaddai: tipoSurtidoReceta,
          estatus_detalle_receta_shaddai: estatusDetalleReceta,

          id_receta_shaddai: receta?.id_receta || null,
          folio_receta_shaddai: receta?.folio_receta || receta?.id_receta || null,
          paciente_receta_shaddai: receta?.nombre_paciente || null,
          id_detalle_receta_shaddai: detalle?.id_detalle || null,
        },
      ];
    });

    setModalLotesProducto(false);
    setProductoSeleccionadoLotes(null);
    setLotesProducto([]);
    setContextoLoteReceta(null);

    // Limpia el buscador únicamente después de agregar correctamente.
    setBuscar('');
    setSugerenciasProductos([]);
    setMostrandoSugerenciasProductos(false);

    Swal.fire({
      icon: 'success',
      title: receta ? 'Producto de receta agregado' : 'Producto agregado',
      text: 'El producto se agregó al carrito con el lote seleccionado.',
      timer: 1100,
      showConfirmButton: false,
    });
  };

  const cerrarModalLotesProducto = () => {
    setModalLotesProducto(false);
    setProductoSeleccionadoLotes(null);
    setLotesProducto([]);
    setContextoLoteReceta(null);
  };

  const abrirModalRecetas = async () => {
    if (!sesionAbierta) {
      Swal.fire({ icon: 'warning', title: 'Caja no abierta', text: 'Primero abre una caja para surtir recetas.' });
      return;
    }

    setModalRecetasAbierto(true);
    setRecetaSeleccionada(null);
    setDetalleReceta([]);
    await cargarRecetasPendientes();
  };

  const cerrarModalRecetas = () => {
    setModalRecetasAbierto(false);
    setRecetaSeleccionada(null);
    setDetalleReceta([]);
  };

  const abrirModalServicios = async () => {
    if (!sesionAbierta) {
      Swal.fire({
        icon: 'warning',
        title: 'Caja no abierta',
        text: 'Primero abre una caja para cobrar servicios clínicos.',
      });
      return;
    }

    setModalServiciosAbierto(true);
    setServicioSeleccionado(null);
    setDetalleServicio([]);
    await cargarServiciosPendientes();
  };

  const cerrarModalServicios = () => {
    setModalServiciosAbierto(false);
    setServicioSeleccionado(null);
    setDetalleServicio([]);
  };

  const verDetalleServicioPOS = async (servicio) => {
    const idSolicitud = Number(servicio?.id_solicitud_servicio || 0);
    const idSucursalActiva = Number(idSucursal);
    const idSucursalServicio = Number(servicio?.id_sucursal || 0);

    if (!idSolicitud) {
      Swal.fire({
        icon: 'warning',
        title: 'Servicio inválido',
        text: 'No se pudo identificar la solicitud del servicio clínico.',
      });
      return;
    }

    if (!Number.isInteger(idSucursalActiva) || idSucursalActiva <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Sucursal requerida',
        text: 'Selecciona una sucursal antes de consultar el servicio clínico.',
      });
      return;
    }

    if (idSucursalServicio > 0 && idSucursalServicio !== idSucursalActiva) {
      Swal.fire({
        icon: 'warning',
        title: 'Servicio de otra sucursal',
        text: 'Este servicio no pertenece a la sucursal actualmente seleccionada.',
      });
      return;
    }

    try {
      setCargandoDetalleServicio(true);
      setServicioSeleccionado(servicio);
      setDetalleServicio([]);

      const { data } = await api.get(
        `/doctor-shaddai/servicios-clinicos/${idSolicitud}`,
        {
          params: {
            id_sucursal: idSucursalActiva,
          },
        }
      );

      if (data.ok) {
        setServicioSeleccionado(data.solicitud || data.servicio || servicio);
        setDetalleServicio(data.detalles || data.detalle || []);
      }
    } catch (error) {
      console.error('Error al cargar detalle del servicio clínico:', error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          error.response?.data?.error ||
          'No se pudo cargar el detalle del servicio clínico.',
      });
    } finally {
      setCargandoDetalleServicio(false);
    }
  };

  const agregarDetalleServicioAlCarrito = (detalle) => {
    if (!servicioSeleccionado || !detalle) return;

    const idSucursalActiva = Number(idSucursal);
    const idSucursalServicio = Number(servicioSeleccionado.id_sucursal || 0);

    if (!Number.isInteger(idSucursalActiva) || idSucursalActiva <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Sucursal requerida',
        text: 'Selecciona una sucursal antes de agregar el servicio al carrito.',
      });
      return;
    }

    if (!idSucursalServicio || idSucursalServicio !== idSucursalActiva) {
      Swal.fire({
        icon: 'warning',
        title: 'Servicio de otra sucursal',
        text: 'Solo puedes cobrar servicios clínicos de la sucursal actualmente seleccionada.',
      });
      return;
    }

    const idSolicitud = Number(
      servicioSeleccionado.id_solicitud_servicio ||
      servicioSeleccionado.id_solicitud ||
      detalle.id_solicitud_servicio ||
      0
    );

    const idDetalleServicio = Number(
      detalle.id_detalle_servicio ||
      detalle.id_detalle ||
      detalle.id_servicio_detalle ||
      0
    );

    const idServicio = detalle.id_servicio ? Number(detalle.id_servicio) : null;

    if (!idSolicitud || !idDetalleServicio) {
      Swal.fire({
        icon: 'warning',
        title: 'Servicio inválido',
        text: 'No se pudo identificar la solicitud o el detalle del servicio.',
      });
      return;
    }

    const keyCarrito = `SERV-${idSolicitud}-${idDetalleServicio}`;
    const cantidad = Number(detalle.cantidad || 1);
    const precioUnitario = Number(detalle.precio_unitario || detalle.precio || 0);

    if (cantidad <= 0 || precioUnitario < 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Servicio inválido',
        text: 'La cantidad o precio del servicio no es válido.',
      });
      return;
    }

    setCarrito((prev) => {
      const existe = prev.some((item) => item.key_carrito === keyCarrito);

      if (existe) {
        Swal.fire({
          icon: 'info',
          title: 'Servicio ya agregado',
          text: 'Este servicio clínico ya se encuentra en el carrito.',
          timer: 1300,
          showConfirmButton: false,
        });
        return prev;
      }

      return [
        ...prev,
        {
          key_carrito: keyCarrito,
          tipo_item: 'SERVICIO',
          id_solicitud_servicio: idSolicitud,
          id_detalle_servicio: idDetalleServicio,
          id_servicio: idServicio,
          id_sucursal_servicio: idSucursalServicio,
          nombre: detalle.nombre_servicio || detalle.nombre || 'Servicio clínico',
          folio_servicio:
            servicioSeleccionado.folio_servicio ||
            detalle.folio_servicio ||
            `SERV-${idSolicitud}`,
          paciente_servicio:
            servicioSeleccionado.nombre_paciente ||
            detalle.nombre_paciente ||
            'Paciente',
          cantidad,
          precio_original: precioUnitario,
          precio_venta: precioUnitario,
          descuento_unitario: 0,
          porcentaje_descuento: 0,
          id_oferta: null,
          stock_actual: 999999,
          indicaciones_servicio: detalle.indicaciones || null,
          observaciones_servicio: detalle.observaciones || null,
        },
      ];
    });

    Swal.fire({
      icon: 'success',
      title: 'Servicio agregado',
      text: 'El servicio clínico se agregó al carrito.',
      timer: 1200,
      showConfirmButton: false,
    });
  };

  const verDetalleRecetaPOS = async (receta) => {
    try {
      setCargandoDetalleReceta(true);
      setRecetaSeleccionada(receta);
      setDetalleReceta([]);

      const { data } = await api.get(`/doctor-shaddai/recetas/${receta.id_receta}`);

      if (data.ok) {
        const recetaCompleta = data.receta || receta;
        const detalles = data.detalles || [];

        setRecetaSeleccionada(recetaCompleta);
        setDetalleReceta(detalles);
        setDetallesRecetasCache((prev) => ({
          ...prev,
          [Number(recetaCompleta.id_receta || receta.id_receta)]: detalles,
        }));
      }
    } catch (error) {
      console.error('Error al cargar detalle de receta:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.mensaje || 'No se pudo cargar el detalle de la receta.',
      });
    } finally {
      setCargandoDetalleReceta(false);
    }
  };

  const agregarDetalleRecetaConLote = async (detalle) => {
    if (!recetaSeleccionada || !detalle) return;

    const disponibilidad = obtenerDisponibilidadDetalleRecetaPOS(detalle, inventario);

    if (!disponibilidad.surtible) {
      Swal.fire({
        icon: 'info',
        title: 'Medicamento libre',
        text: 'Este medicamento fue indicado por el médico, pero no está registrado en el inventario de la farmacia y no puede agregarse al carrito.',
      });
      return;
    }

    if (!disponibilidad.disponible) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin existencias',
        text: 'El producto de la receta no tiene existencias disponibles en la sucursal actual.',
      });
      return;
    }

    const estadoDetalle = obtenerEstadoSurtidoDetallePOS(detalle);

    if (estadoDetalle.cantidadPendiente <= 0) {
      Swal.fire({
        icon: 'info',
        title: 'Receta ya surtida',
        text: 'Este producto ya no tiene cantidad pendiente por surtir.',
      });
      return;
    }

    const productoInventario = disponibilidad.productoInventario;

    const productoParaVenta = {
      ...productoInventario,
      cantidad_receta: estadoDetalle.cantidadRecetada,
      cantidad_surtida_previa_receta: estadoDetalle.cantidadSurtidaPrevia,
      cantidad_en_carrito_receta: estadoDetalle.cantidadEnCarrito,
      cantidad_pendiente_receta: estadoDetalle.cantidadPendiente,
      dosis_receta: detalle.dosis,
      frecuencia_receta: detalle.frecuencia,
      duracion_receta: detalle.duracion,
      indicaciones_receta: detalle.indicaciones,
    };

    await abrirModalLotesParaProducto({
      producto: productoParaVenta,
      receta: recetaSeleccionada,
      detalle: {
        ...detalle,
        cantidad_recetada: estadoDetalle.cantidadRecetada,
        cantidad_surtida_previa_receta: estadoDetalle.cantidadSurtidaPrevia,
        cantidad_en_carrito_receta: estadoDetalle.cantidadEnCarrito,
        cantidad_pendiente_receta: estadoDetalle.cantidadPendiente,
      },
    });
  };

  const aumentarCantidad = (keyCarrito) => {
    setCarrito((prev) =>
      prev.map((item) => {
        if (item.key_carrito !== keyCarrito) return item;

        if (item.tipo_item === 'SERVICIO') {
          return { ...item, cantidad: Number(item.cantidad) + 1 };
        }

        const stockMaximo = Number(item.stock_actual || 0);
        const pendienteReceta = item.cantidad_pendiente_previa_shaddai ?? null;
        const limiteReceta =
          pendienteReceta !== null && pendienteReceta !== undefined
            ? Number(pendienteReceta)
            : null;
        const limiteCantidad =
          limiteReceta !== null && !Number.isNaN(limiteReceta)
            ? Math.min(stockMaximo, limiteReceta)
            : stockMaximo;

        if (Number(item.cantidad) >= limiteCantidad) {
          Swal.fire({
            icon: 'warning',
            title: limiteReceta !== null ? 'Cantidad máxima de la receta' : 'Stock insuficiente',
            text:
              limiteReceta !== null
                ? `Solo quedan ${formatoNumero(limiteReceta)} pieza(s) pendientes de esta receta.`
                : `Solo hay ${formatoNumero(item.stock_actual)} piezas disponibles en este lote.`,
          });
          return item;
        }

        const nuevaCantidad = Number(item.cantidad) + 1;
        const cantidadPendienteDespues =
          limiteReceta !== null ? Math.max(limiteReceta - nuevaCantidad, 0) : item.cantidad_pendiente_despues_shaddai ?? null;

        return {
          ...item,
          cantidad: nuevaCantidad,
          cantidad_surtida_actual_shaddai: item.id_detalle_receta_shaddai ? nuevaCantidad : item.cantidad_surtida_actual_shaddai ?? null,
          cantidad_pendiente_despues_shaddai: item.id_detalle_receta_shaddai ? cantidadPendienteDespues : item.cantidad_pendiente_despues_shaddai ?? null,
          tipo_surtido_receta_shaddai: item.id_detalle_receta_shaddai
            ? cantidadPendienteDespues === 0
              ? 'COMPLETA'
              : 'PARCIAL'
            : item.tipo_surtido_receta_shaddai || null,
          estatus_detalle_receta_shaddai: item.id_detalle_receta_shaddai
            ? cantidadPendienteDespues === 0
              ? 'SURTIDO'
              : 'SURTIDO_PARCIAL'
            : item.estatus_detalle_receta_shaddai || null,
        };
      })
    );
  };

  const disminuirCantidad = (keyCarrito) => {
    setCarrito((prev) =>
      prev
        .map((item) => (item.key_carrito === keyCarrito ? { ...item, cantidad: Number(item.cantidad) - 1 } : item))
        .filter((item) => Number(item.cantidad) > 0)
    );
  };

  const cambiarCantidadManual = (keyCarrito, valor) => {
    const cantidadNueva = Number(valor);
    if (cantidadNueva < 0) return;

    setCarrito((prev) =>
      prev.map((item) => {
        if (item.key_carrito !== keyCarrito) return item;

        if (item.tipo_item === 'SERVICIO') {
          return { ...item, cantidad: cantidadNueva };
        }

        const stockMaximo = Number(item.stock_actual || 0);
        const pendienteReceta = item.cantidad_pendiente_previa_shaddai ?? null;
        const limiteReceta =
          pendienteReceta !== null && pendienteReceta !== undefined
            ? Number(pendienteReceta)
            : null;
        const limiteCantidad =
          limiteReceta !== null && !Number.isNaN(limiteReceta)
            ? Math.min(stockMaximo, limiteReceta)
            : stockMaximo;

        const cantidadFinal = cantidadNueva > limiteCantidad ? limiteCantidad : cantidadNueva;

        if (cantidadNueva > limiteCantidad) {
          Swal.fire({
            icon: 'warning',
            title: limiteReceta !== null ? 'Cantidad máxima de la receta' : 'Stock insuficiente',
            text:
              limiteReceta !== null
                ? `Solo quedan ${formatoNumero(limiteReceta)} pieza(s) pendientes de esta receta.`
                : `Solo hay ${formatoNumero(item.stock_actual)} piezas disponibles en este lote.`,
          });
        }

        const cantidadPendienteDespues =
          limiteReceta !== null ? Math.max(limiteReceta - cantidadFinal, 0) : item.cantidad_pendiente_despues_shaddai ?? null;

        return {
          ...item,
          cantidad: cantidadFinal,
          cantidad_surtida_actual_shaddai: item.id_detalle_receta_shaddai ? cantidadFinal : item.cantidad_surtida_actual_shaddai ?? null,
          cantidad_pendiente_despues_shaddai: item.id_detalle_receta_shaddai ? cantidadPendienteDespues : item.cantidad_pendiente_despues_shaddai ?? null,
          tipo_surtido_receta_shaddai: item.id_detalle_receta_shaddai
            ? cantidadPendienteDespues === 0
              ? 'COMPLETA'
              : 'PARCIAL'
            : item.tipo_surtido_receta_shaddai || null,
          estatus_detalle_receta_shaddai: item.id_detalle_receta_shaddai
            ? cantidadPendienteDespues === 0
              ? 'SURTIDO'
              : 'SURTIDO_PARCIAL'
            : item.estatus_detalle_receta_shaddai || null,
        };
      })
    );
  };

  const quitarDelCarrito = (keyCarrito) => {
    setCarrito((prev) => prev.filter((item) => item.key_carrito !== keyCarrito));
  };

  const limpiarVenta = () => {
    setCarrito([]);
    setDetallesRecetasCache({});
    setMetodoPago('EFECTIVO');
    setMontoRecibido('');
    setPagoMixtoActivo(false);
    setPagosMixtos(PAGOS_MIXTOS_INICIALES);
    setCobrarImpuesto(true);
    setVentaFinalizada(null);
    setTarjetaPuntos(null);
    setCodigoTarjeta('');
    setEnviarTicketDigital(false);
  };

  const seleccionarMetodoPago = (metodo) => {
    if (pagoMixtoActivo) return;

    if (metodo === 'PUNTOS' && !tarjetaPuntos) {
      Swal.fire({
        icon: 'warning',
        title: 'Tarjeta requerida',
        text: 'Para pagar con puntos primero debes vincular una tarjeta de puntos.',
      });
      return;
    }
    setMetodoPago(metodo);
    if (metodo !== 'EFECTIVO') setMontoRecibido('');
  };

  const buscarTarjetaPuntos = async (codigoManual = null) => {
    const codigo = String(codigoManual || codigoTarjeta || '').trim();

    if (!codigo) {
      Swal.fire({ icon: 'warning', title: 'Código requerido', text: 'Escanea la tarjeta o escribe el teléfono del cliente.' });
      return;
    }

    try {
      setBuscandoTarjeta(true);
      const { data } = await api.get(`/tarjetas-puntos/codigo/${encodeURIComponent(codigo)}`);

      if (data.ok) {
        if (!data.tarjeta.activo) {
          Swal.fire({ icon: 'warning', title: 'Tarjeta inactiva', text: 'Esta tarjeta no puede acumular ni usar puntos.' });
          return;
        }

        setTarjetaPuntos(data.tarjeta);
        setCodigoTarjeta(data.tarjeta.codigo_barras);
        setEnviarTicketDigital(false);

        Swal.fire({
          icon: 'success',
          title: 'Tarjeta vinculada',
          text: `${data.tarjeta.nombre_cliente} · ${formatoNumero(data.tarjeta.puntos_actuales)} puntos actuales`,
          timer: 1500,
          showConfirmButton: false,
        });
      }
    } catch (error) {
      console.error(error);
      setTarjetaPuntos(null);
      setEnviarTicketDigital(false);
      Swal.fire({
        icon: 'error',
        title: 'Tarjeta no encontrada',
        text: error.response?.data?.mensaje || 'No se encontró una tarjeta con ese código o teléfono.',
      });
    } finally {
      setBuscandoTarjeta(false);
    }
  };

  const quitarTarjetaPuntos = () => {
    setTarjetaPuntos(null);
    setCodigoTarjeta('');
    setEnviarTicketDigital(false);
    setPagosMixtos((prev) => ({ ...prev, PUNTOS: '' }));
    if (metodoPago === 'PUNTOS') setMetodoPago('EFECTIVO');
  };

  const marcarRecetaSurtida = async (idReceta, estatus = 'SURTIDA') => {
    if (!idReceta) return;

    try {
      await api.put(`/doctor-shaddai/recetas/${idReceta}/surtir`, { estatus });
    } catch (error) {
      console.error('Error al marcar receta como surtida:', error);
      Swal.fire({
        icon: 'warning',
        title: 'Venta registrada, pero receta no actualizada',
        text: error.response?.data?.mensaje || 'La venta se registró, pero no se pudo marcar la receta como surtida.',
      });
    }
  };

  const finalizarRecetaDesdeCaja = async (receta) => {
    const idReceta = Number(receta?.id_receta || 0);

    if (!idReceta) {
      Swal.fire({
        icon: 'warning',
        title: 'Receta inválida',
        text: 'No se pudo identificar la receta seleccionada.',
      });
      return;
    }

    const tieneProductosDeEstaRecetaEnCarrito = carrito.some(
      (item) => Number(item.id_receta_shaddai || 0) === idReceta
    );

    if (tieneProductosDeEstaRecetaEnCarrito) {
      Swal.fire({
        icon: 'warning',
        title: 'Hay productos en el carrito',
        text: 'Primero cobra o elimina del carrito los productos asociados a esta receta antes de finalizarla.',
      });
      return;
    }

    const confirmacion = await Swal.fire({
      icon: 'warning',
      title: '¿Finalizar receta?',
      html: `
        <div style="text-align:left">
          <p>La receta dejará de aparecer como pendiente en caja.</p>
          <p style="margin-top:8px">No se generará venta, no se descontará inventario y no se cobrará ningún producto.</p>
          <p style="margin-top:8px"><b>Paciente:</b> ${receta.nombre_paciente || 'N/A'}</p>
          <p><b>Folio:</b> ${receta.folio_receta || idReceta}</p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Sí, finalizar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#64748b',
      cancelButtonColor: '#0f172a',
    });

    if (!confirmacion.isConfirmed) return;

    try {
      setFinalizandoReceta(true);

      const { data } = await api.put(
        `/doctor-shaddai/recetas/${idReceta}/finalizar`,
        {}
      );

      if (!data.ok) {
        throw new Error(data.mensaje || 'No se pudo finalizar la receta.');
      }

      const estatusFinal = data.receta?.estatus || 'FINALIZADA_SIN_SURTIR';

      await Swal.fire({
        icon: 'success',
        title: 'Receta finalizada',
        text:
          estatusFinal === 'FINALIZADA_PARCIAL'
            ? 'La receta se cerró con surtido parcial.'
            : estatusFinal === 'SURTIDA'
              ? 'La receta ya estaba surtida por completo.'
              : 'La receta se cerró sin surtirse desde la farmacia.',
        timer: 1700,
        showConfirmButton: false,
      });

      setRecetaSeleccionada(null);
      setDetalleReceta([]);
      setDetallesRecetasCache((prev) => {
        const siguiente = { ...prev };
        delete siguiente[idReceta];
        return siguiente;
      });

      await cargarRecetasPendientes();
    } catch (error) {
      console.error('Error al finalizar receta desde caja:', error);

      Swal.fire({
        icon: 'error',
        title: 'No se pudo finalizar',
        text:
          error.response?.data?.mensaje ||
          error.message ||
          'No se pudo finalizar la receta.',
      });
    } finally {
      setFinalizandoReceta(false);
    }
  };

  const calcularEstatusRecetaDespuesVenta = ({
    recetaActual,
    detallesActuales,
    carritoActual,
  }) => {
    if (!recetaActual?.id_receta) {
      return null;
    }

    const idRecetaActual = Number(recetaActual.id_receta);
    const detalles = Array.isArray(detallesActuales) ? detallesActuales : [];
    const productosVendidos = Array.isArray(carritoActual) ? carritoActual : [];

    /**
     * Si no tenemos el detalle completo de la receta, NO la marcamos como surtida.
     * Esto evita cerrar por error una receta que pudo haberse surtido solo parcialmente.
     */
    if (detalles.length === 0) {
      return 'SURTIDA_PARCIAL';
    }

    const detallesSurtibles = detalles.filter((detalle) =>
      esDetalleSurtibleDesdeInventario(detalle)
    );

    const hayDetallesNoSurtibles = detalles.some((detalle) =>
      !esDetalleSurtibleDesdeInventario(detalle)
    );

    if (detallesSurtibles.length === 0) {
      return 'SURTIDA_PARCIAL';
    }

    const todosLosDetallesSurtidos = detallesSurtibles.every((detalle) => {
      const idDetalle = Number(
        detalle.id_detalle ||
        detalle.id_detalle_receta ||
        detalle.id_detalle_receta_shaddai ||
        0
      );

      const idProducto = Number(detalle.id_producto);

      const cantidadRecetada = Number(
        detalle.cantidad_recetada ??
        detalle.cantidad_solicitada ??
        detalle.cantidad ??
        1
      );

      /**
       * Para recetas ya parciales, el backend puede devolver lo surtido previamente.
       * Así, si hoy se surte lo pendiente, la receta puede pasar a SURTIDA.
       */
      const cantidadSurtidaPrevia = Number(
        detalle.cantidad_surtida ??
        detalle.total_surtido ??
        detalle.surtido ??
        0
      );

      const cantidadVendidaActual = productosVendidos
        .filter((item) => {
          const mismoDetalle =
            idDetalle > 0 &&
            item.id_detalle_receta_shaddai &&
            Number(item.id_detalle_receta_shaddai) === idDetalle;

          const mismoProductoMismaReceta =
            Number(item.id_producto) === idProducto &&
            Number(item.id_receta_shaddai) === idRecetaActual;

          return mismoDetalle || mismoProductoMismaReceta;
        })
        .reduce((acc, item) => acc + Number(item.cantidad || 0), 0);

      return cantidadSurtidaPrevia + cantidadVendidaActual >= cantidadRecetada;
    });

    return todosLosDetallesSurtidos && !hayDetallesNoSurtibles ? 'SURTIDA' : 'SURTIDA_PARCIAL';
  };

  const cobrarVenta = async () => {
    if (!sesionAbierta) {
      Swal.fire({ icon: 'warning', title: 'Caja no abierta', text: 'Primero debes abrir una caja.' });
      return;
    }

    if (carrito.length === 0) {
      Swal.fire({ icon: 'warning', title: 'Carrito vacío', text: 'Agrega al menos un producto o servicio a la venta.' });
      return;
    }

    if (resumen.total <= 0) {
      Swal.fire({ icon: 'warning', title: 'Total inválido', text: 'El total de la venta debe ser mayor a cero.' });
      return;
    }

    const pagosParaEnviar = pagoMixtoActivo ? resumenPagosMixtos.pagos : [];
    const totalPagadoMixto = Number(resumenPagosMixtos.totalPagado.toFixed(2));
    const cambioMixto = Number(resumenPagosMixtos.cambio.toFixed(2));
    const totalAPagar = Number(resumen.total.toFixed(2));

    /*
     * El backend valida nuevamente tarjeta, correo y SMTP. Esto solo expresa
     * la decisión capturada por el cajero para esta venta.
     */
    const ticketDigitalSolicitado = Boolean(
      enviarTicketDigital && puedeEnviarTicketDigital
    );

    if (pagoMixtoActivo) {
      if (pagosParaEnviar.length === 0) {
        Swal.fire({
          icon: 'warning',
          title: 'Pagos requeridos',
          text: 'Captura al menos un método de pago para cobrar la venta.',
        });
        return;
      }

      if (resumenPagosMixtos.excedenteNoEfectivo > 0) {
        Swal.fire({
          icon: 'warning',
          title: 'Monto no válido',
          text: 'Tarjeta, transferencia y puntos no pueden exceder el total de la venta. El excedente solo puede ser en efectivo para calcular cambio.',
        });
        return;
      }

      if (totalPagadoMixto < totalAPagar) {
        Swal.fire({
          icon: 'warning',
          title: 'Pago incompleto',
          text: `Faltan ${formatoMoneda(resumenPagosMixtos.pendiente)} para cubrir el total.`,
        });
        return;
      }

      if (resumenPagosMixtos.puntos > 0 && !tarjetaPuntos) {
        Swal.fire({
          icon: 'warning',
          title: 'Tarjeta requerida',
          text: 'Para usar puntos primero debes vincular una tarjeta.',
        });
        return;
      }

      if (
        resumenPagosMixtos.puntos > 0 &&
        Number(tarjetaPuntos?.puntos_actuales || 0) < resumenPagosMixtos.puntos
      ) {
        Swal.fire({
          icon: 'warning',
          title: 'Puntos insuficientes',
          html: `
            <div style="text-align:left">
              <p><b>Cliente:</b> ${tarjetaPuntos?.nombre_cliente || '—'}</p>
              <p><b>Puntos disponibles:</b> ${formatoNumero(tarjetaPuntos?.puntos_actuales || 0)}</p>
              <p><b>Puntos a usar:</b> ${formatoNumero(resumenPagosMixtos.puntos)}</p>
            </div>
          `,
        });
        return;
      }
    } else {
      if (metodoPago === 'EFECTIVO' && resumen.recibido < resumen.total) {
        Swal.fire({ icon: 'warning', title: 'Monto insuficiente', text: 'El monto recibido no cubre el total de la venta.' });
        return;
      }

      if (metodoPago === 'PUNTOS' && !tarjetaPuntos) {
        Swal.fire({ icon: 'warning', title: 'Tarjeta requerida', text: 'Para pagar con puntos primero debes vincular una tarjeta.' });
        return;
      }

      if (metodoPago === 'PUNTOS' && Number(tarjetaPuntos?.puntos_actuales || 0) < Number(resumen.total || 0)) {
        Swal.fire({
          icon: 'warning',
          title: 'Puntos insuficientes',
          html: `
            <div style="text-align:left">
              <p><b>Cliente:</b> ${tarjetaPuntos?.nombre_cliente || '—'}</p>
              <p><b>Puntos disponibles:</b> ${formatoNumero(tarjetaPuntos?.puntos_actuales || 0)}</p>
              <p><b>Puntos requeridos:</b> ${formatoNumero(resumen.total)}</p>
              <p><b>Faltan:</b> ${formatoNumero(resumen.puntosFaltantes)} puntos</p>
            </div>
          `,
        });
        return;
      }
    }

    const recetaAntesDeCobrar = recetaEnCarrito;
    const carritoAntesDeCobrar = [...carrito];
    const productosAntesDeCobrar = carritoAntesDeCobrar.filter(
      (item) => item.tipo_item !== 'SERVICIO'
    );
    const serviciosAntesDeCobrar = carritoAntesDeCobrar.filter(
      (item) => item.tipo_item === 'SERVICIO'
    );
    const detalleRecetaAntesDeCobrar = recetaAntesDeCobrar?.id_receta
      ? detallesRecetasCache[Number(recetaAntesDeCobrar.id_receta)] ||
      (recetaSeleccionada?.id_receta &&
        Number(recetaSeleccionada.id_receta) === Number(recetaAntesDeCobrar.id_receta)
        ? [...detalleReceta]
        : [])
      : [];

    const estatusRecetaFinal = recetaAntesDeCobrar?.id_receta
      ? calcularEstatusRecetaDespuesVenta({
        recetaActual: recetaAntesDeCobrar,
        detallesActuales: detalleRecetaAntesDeCobrar,
        carritoActual: carritoAntesDeCobrar,
      })
      : null;

    const detalleServiciosHtml = serviciosAntesDeCobrar.length > 0
      ? `
        <hr style="margin:10px 0" />
        <p><b>Servicios clínicos:</b></p>
        ${serviciosAntesDeCobrar
        .map(
          (servicio) =>
            `<p>${servicio.folio_servicio || 'Servicio'} · ${servicio.nombre} · ${formatoMoneda(
              Number(servicio.cantidad || 0) * Number(servicio.precio_venta || 0)
            )}</p>`
        )
        .join('')}
      `
      : '';

    const detallePagosHtml = pagoMixtoActivo
      ? `
        <hr style="margin:10px 0" />
        <p><b>Pago mixto:</b></p>
        ${pagosParaEnviar.map((pago) => `<p>${pago.metodo_pago}: <b>${formatoMoneda(pago.monto)}</b></p>`).join('')}
        <p><b>Total pagado:</b> ${formatoMoneda(totalPagadoMixto)}</p>
        <p><b>Cambio:</b> ${formatoMoneda(cambioMixto)}</p>
      `
      : `
        <p><b>Método:</b> ${metodoPago === 'PUNTOS' ? 'Pagar con puntos' : metodoPago}</p>
        ${metodoPago === 'EFECTIVO' ? `<p><b>Recibido:</b> ${formatoMoneda(resumen.recibido)}</p><p><b>Cambio:</b> ${formatoMoneda(resumen.cambio)}</p>` : ''}
      `;

    const detalleTicketDigitalHtml = ticketDigitalSolicitado
      ? `
        <hr style="margin:10px 0" />
        <p><b>Ticket digital:</b> se enviará a ${escaparHtmlSeguro(correoTicketDigital)}</p>
      `
      : '';

    const confirmacion = await Swal.fire({
      icon: 'question',
      title: '¿Cobrar venta?',
      html: `
        <div style="text-align:left">
          ${recetaAntesDeCobrar ? `<p><b>Receta:</b> ${recetaAntesDeCobrar.folio}</p><p><b>Paciente:</b> ${recetaAntesDeCobrar.paciente || 'N/A'}</p><p><b>Estatus al cobrar:</b> ${estatusRecetaFinal === 'SURTIDA' ? 'Surtida completamente' : 'Surtida parcialmente'}</p><hr style="margin:10px 0" />` : ''}
          ${detalleServiciosHtml}
          <p><b>Total:</b> ${formatoMoneda(resumen.total)}</p>
          ${resumen.descuentoOfertas > 0 ? `<p><b>Descuento por ofertas:</b> -${formatoMoneda(resumen.descuentoOfertas)}</p>` : ''}
          <p><b>IVA:</b> ${cobrarImpuesto ? `Aplicado (${formatoMoneda(resumen.impuesto)})` : 'No aplicado'}</p>
          ${detallePagosHtml}
          ${detalleTicketDigitalHtml}
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Sí, cobrar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#059669',
    });

    if (!confirmacion.isConfirmed) return;

    try {
      setCobrando(true);

      const metodoPagoFinal = pagoMixtoActivo ? 'MIXTO' : metodoPago;
      const montoRecibidoFinal = pagoMixtoActivo
        ? totalPagadoMixto
        : metodoPago === 'EFECTIVO'
          ? Number(montoRecibido || 0)
          : resumen.total;

      const payload = {
        id_sucursal: Number(idSucursal),
        id_caja: Number(idCaja),
        id_sesion: Number(sesionAbierta.id_sesion),
        id_tarjeta_puntos: tarjetaPuntos ? Number(tarjetaPuntos.id_tarjeta) : null,
        metodo_pago: metodoPagoFinal,
        monto_recibido: montoRecibidoFinal,
        pagos: pagoMixtoActivo ? pagosParaEnviar : undefined,
        enviar_ticket_digital: ticketDigitalSolicitado,
        descuento: 0,
        descuento_ofertas: Number(resumen.descuentoOfertas || 0),
        subtotal_sin_descuento: Number(resumen.subtotalSinDescuento || 0),
        impuesto: Number(resumen.impuesto || 0),
        id_receta_shaddai: recetaAntesDeCobrar?.id_receta || null,
        productos: productosAntesDeCobrar.map((item) => ({
          id_producto: Number(item.id_producto),
          id_lote: item.id_lote ? Number(item.id_lote) : null,
          cantidad: Number(item.cantidad),
          precio_unitario: Number(item.precio_venta),
          precio_original: Number(item.precio_original || item.precio_venta || 0),
          porcentaje_descuento: Number(item.porcentaje_descuento || 0),
          descuento_unitario: Number(item.descuento_unitario || 0),
          id_oferta: item.id_oferta ? Number(item.id_oferta) : null,
          id_receta_shaddai: item.id_receta_shaddai || null,
          id_detalle_receta_shaddai: item.id_detalle_receta_shaddai || null,
          controlado: item.controlado || false,
          requiere_receta: item.requiere_receta || false,
          datos_control_sanitario: item.datos_control_sanitario || null,
          cantidad_recetada_shaddai: item.cantidad_recetada_shaddai ?? null,
          cantidad_surtida_previa_shaddai: item.cantidad_surtida_previa_shaddai ?? null,
          cantidad_en_carrito_previa_shaddai: item.cantidad_en_carrito_previa_shaddai ?? null,
          cantidad_pendiente_previa_shaddai: item.cantidad_pendiente_previa_shaddai ?? null,
          cantidad_surtida_actual_shaddai: item.cantidad_surtida_actual_shaddai ?? null,
          cantidad_pendiente_despues_shaddai: item.cantidad_pendiente_despues_shaddai ?? null,
          tipo_surtido_receta_shaddai: item.tipo_surtido_receta_shaddai || null,
          estatus_detalle_receta_shaddai: item.estatus_detalle_receta_shaddai || null,
        })),
        servicios: serviciosAntesDeCobrar.map((item) => ({
          id_solicitud_servicio: Number(item.id_solicitud_servicio),
          id_detalle_servicio: Number(item.id_detalle_servicio),
          id_servicio: item.id_servicio ? Number(item.id_servicio) : null,
          id_sucursal: Number(item.id_sucursal_servicio || idSucursal),
          nombre_servicio: item.nombre,
          cantidad: Number(item.cantidad || 1),
          precio_unitario: Number(item.precio_venta || 0),
          folio_servicio: item.folio_servicio || null,
          nombre_paciente: item.paciente_servicio || null,
        })),
      };

      const { data } = await api.post('/ventas', payload);

      if (data.ok) {
        if (recetaAntesDeCobrar?.id_receta) {
          await marcarRecetaSurtida(
            recetaAntesDeCobrar.id_receta,
            estatusRecetaFinal || 'SURTIDA_PARCIAL'
          );
        }

        setVentaFinalizada(data);

        const ticketDigitalResultado =
          data?.venta?.ticket_digital ||
          data?.resumen?.ticket_digital ||
          null;

        const detalleTicketDigitalResultadoHtml =
          ticketDigitalResultado?.solicitado
            ? ticketDigitalResultado.enviado
              ? `
                <hr style="margin:10px 0" />
                <p><b>Ticket digital:</b> enviado correctamente a ${escaparHtmlSeguro(ticketDigitalResultado.correo_destino || correoTicketDigital)}.</p>
              `
              : `
                <hr style="margin:10px 0" />
                <p><b>Ticket digital:</b> la venta se registró, pero no se pudo enviar.</p>
                <p style="font-size:12px;color:#92400e">${escaparHtmlSeguro(ticketDigitalResultado.mensaje || 'Revisa la configuración de correo e inténtalo de nuevo más tarde.')}</p>
              `
            : '';

        const resultadoAlerta = await Swal.fire({
          icon: 'success',
          title: 'Venta registrada',
          html: `
            <div style="text-align:left">
              <p><b>Folio:</b> ${data.venta.folio}</p>
              ${recetaAntesDeCobrar
              ? `<p><b>Receta:</b> ${recetaAntesDeCobrar.folio}</p>
                     <p><b>Estatus receta:</b> ${estatusRecetaFinal === 'SURTIDA'
                ? 'Surtida completamente'
                : 'Surtida parcialmente'
              }</p>`
              : ''
            }
              <p><b>Total:</b> ${formatoMoneda(data.resumen?.total || 0)}</p>
              <p><b>Método:</b> ${pagoMixtoActivo ? 'MIXTO' : metodoPago === 'PUNTOS' ? 'Pagar con puntos' : metodoPago}</p>
              ${pagoMixtoActivo
              ? `<p><b>Pagado:</b> ${formatoMoneda(totalPagadoMixto)}</p><p><b>Cambio:</b> ${formatoMoneda(cambioMixto)}</p>`
              : metodoPago !== 'PUNTOS'
                ? `<p><b>Cambio:</b> ${formatoMoneda(data.resumen?.cambio || 0)}</p>`
                : ''
            }
              ${detalleTicketDigitalResultadoHtml}
            </div>
          `,
          showCancelButton: true,
          confirmButtonText: 'Imprimir ticket',
          cancelButtonText: 'Cerrar',
          confirmButtonColor: '#059669',
          cancelButtonColor: '#64748b',
        });

        if (resultadoAlerta.isConfirmed) await imprimirTicketPOS(data);

        setCarrito([]);
        setDetallesRecetasCache({});
        setDetalleReceta([]);
        setRecetaSeleccionada(null);
        setMontoRecibido('');
        setPagoMixtoActivo(false);
        setPagosMixtos(PAGOS_MIXTOS_INICIALES);
        setCobrarImpuesto(false);
        setTarjetaPuntos(null);
        setCodigoTarjeta('');
        setEnviarTicketDigital(false);
        setMetodoPago('EFECTIVO');

        await cargarConfiguracionPuntos();
        await cargarInventario();
        await cargarSesionAbierta();
        await cargarRecetasPendientes();
        await cargarServiciosPendientes();
      }
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: 'error',
        title: 'Error al vender',
        text: error.response?.data?.mensaje || 'No se pudo registrar la venta.',
      });
    } finally {
      setCobrando(false);
    }
  };

  const CONFIGURACION_IMPRESION_LOCAL = {
    url: 'http://localhost:3030',
    apiKey: 'shaddai-printer-2026',

    /*
     * true  = solo genera y muestra la vista previa del ticket.
     * false = envía el ticket a la impresora local y abre caja si corresponde.
     */
    modoPrueba: false,
  };

  const API_IMPRESION_LOCAL = CONFIGURACION_IMPRESION_LOCAL.url;
  const PRINTER_KEY = CONFIGURACION_IMPRESION_LOCAL.apiKey;
  const MODO_PRUEBA_TICKET = CONFIGURACION_IMPRESION_LOCAL.modoPrueba;

  /*
   * Evita que los caracteres especiales del ticket se interpreten como HTML
   * al mostrar la vista previa dentro de SweetAlert.
   */
  const escaparHtmlTicket = (texto = '') =>
    String(texto)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  /*
   * Obtiene la configuración activa para la sucursal que realizó la venta.
   * Si la sucursal no tiene configuración propia, el backend devuelve la global.
   * Si ocurre un error, el ticket sigue usando la configuración local de respaldo
   * definida en el driver de impresión.
   */
  const obtenerConfiguracionTicketParaImpresion = async (datosTicket = {}) => {
    const idSucursalVenta = Number(
      datosTicket?.venta?.id_sucursal ||
      datosTicket?.venta?.idSucursal ||
      idSucursal ||
      0
    );

    try {
      const { data } = await api.get('/configuracion-ticket', {
        params: idSucursalVenta > 0
          ? { id_sucursal: idSucursalVenta }
          : {},
      });

      if (!data?.ok) {
        throw new Error(
          data?.mensaje || 'No se pudo obtener la configuración del ticket.'
        );
      }

      return data?.configuracion?.configuracion || null;
    } catch (error) {
      console.warn(
        'No se pudo cargar la configuración del ticket. Se usará la configuración local de respaldo:',
        error
      );

      return null;
    }
  };

  const imprimirTicketPOS = async (ventaData = null) => {
    const datosTicket = ventaData || ventaFinalizada;

    if (!datosTicket?.venta) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin venta',
        text: 'No hay una venta reciente para generar el ticket.',
      });
      return;
    }

    try {
      Swal.fire({
        title: MODO_PRUEBA_TICKET
          ? 'Generando vista previa...'
          : 'Imprimiendo ticket...',
        html: `
        <div style="text-align:center">
          <p>
            ${MODO_PRUEBA_TICKET
            ? 'Generando el ticket sin enviarlo a la impresora.'
            : 'Enviando ticket a la impresora local.'
          }
          </p>

          <p style="font-size:13px;color:#64748b;margin-top:6px">
            ${MODO_PRUEBA_TICKET
            ? 'Podrás revisar cómo quedaría el ticket final.'
            : 'No cierres esta ventana hasta que termine la impresión.'
          }
          </p>
        </div>
      `,
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const configuracionTicket =
        await obtenerConfiguracionTicketParaImpresion(datosTicket);

      const idSucursalVenta = Number(
        datosTicket?.venta?.id_sucursal ||
        datosTicket?.venta?.idSucursal ||
        idSucursal ||
        0
      );

      const nombreSucursalTicket =
        sucursalActual?.nombre ||
        sucursalActual?.nombre_sucursal ||
        sucursalActual?.razon_social ||
        sucursalActual?.sucursal ||
        '';

      const direccionSucursalTicket =
        sucursalActual?.direccion ||
        sucursalActual?.domicilio ||
        '';

      const telefonoSucursalTicket =
        sucursalActual?.telefono ||
        sucursalActual?.telefono_contacto ||
        '';

      const datosParaImprimir = {
        ...datosTicket,

        venta: {
          ...datosTicket.venta,

          ...(idSucursalVenta > 0
            ? { id_sucursal: idSucursalVenta }
            : {}),

          sucursal:
            datosTicket?.venta?.sucursal ||
            datosTicket?.venta?.nombre_sucursal ||
            nombreSucursalTicket,

          nombre_sucursal:
            datosTicket?.venta?.nombre_sucursal ||
            datosTicket?.venta?.sucursal ||
            nombreSucursalTicket,

          direccion_sucursal:
            datosTicket?.venta?.direccion_sucursal ||
            direccionSucursalTicket,

          telefono_sucursal:
            datosTicket?.venta?.telefono_sucursal ||
            telefonoSucursalTicket,
        },

        ...(configuracionTicket
          ? { configuracion_ticket: configuracionTicket }
          : {}),
      };

      const endpoint = MODO_PRUEBA_TICKET
        ? '/vista-previa-ticket'
        : '/imprimir-ticket';

      console.log(
        `Enviando ticket a API local (${MODO_PRUEBA_TICKET ? 'MODO PRUEBA' : 'IMPRESIÓN REAL'}):`,
        datosParaImprimir
      );

      const response = await fetch(
        `${API_IMPRESION_LOCAL}${endpoint}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-printer-key': PRINTER_KEY,
          },
          body: JSON.stringify(datosParaImprimir),
        }
      );

      let data = {};

      try {
        data = await response.json();
      } catch (_) {
        data = {};
      }

      console.log('Respuesta API local:', data);

      if (!response.ok || !data.ok) {
        throw new Error(
          data.message ||
          data.mensaje ||
          (
            MODO_PRUEBA_TICKET
              ? 'No se pudo generar la vista previa del ticket.'
              : 'No se pudo imprimir el ticket.'
          )
        );
      }

      if (MODO_PRUEBA_TICKET) {
        const ticketGenerado = data.ticket || '';

        if (!ticketGenerado.trim()) {
          throw new Error(
            'La API local no devolvió el contenido de la vista previa.'
          );
        }

        await Swal.fire({
          title: 'Vista previa del ticket',
          width: 560,
          confirmButtonText: 'Cerrar',
          confirmButtonColor: '#0369a1',
          html: `
          <div style="
            max-height:540px;
            overflow:auto;
            background:#e2e8f0;
            padding:18px;
            border-radius:12px;
          ">
            <pre style="
              margin:0 auto;
              width:max-content;
              min-width:290px;
              max-width:100%;
              overflow-x:auto;
              padding:18px 14px 28px;
              text-align:left;
              white-space:pre;
              background:#ffffff;
              color:#111827;
              font-family:'Courier New', Courier, monospace;
              font-size:12px;
              line-height:1.4;
              box-shadow:0 8px 20px rgba(15,23,42,.18);
            ">${escaparHtmlTicket(ticketGenerado)}</pre>
          </div>
        `,
        });

        return;
      }

      Swal.fire({
        icon: 'success',
        title: 'Ticket impreso',
        text: 'El ticket se imprimió correctamente.',
        timer: 1300,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error(
        MODO_PRUEBA_TICKET
          ? 'Error al generar vista previa del ticket:'
          : 'Error de impresión local:',
        error
      );

      Swal.fire({
        icon: 'error',
        title: MODO_PRUEBA_TICKET
          ? 'Error en vista previa'
          : 'Error de impresión',
        text:
          error.message ||
          (
            MODO_PRUEBA_TICKET
              ? 'No se pudo generar la vista previa. Verifica que la API local de impresión esté abierta.'
              : 'No se pudo imprimir el ticket. Verifica que la API local de impresión esté abierta.'
          ),
      });
    }
  };

  const abrirCajaPOS = async () => {
    try {
      const confirmacion = await Swal.fire({
        icon: 'question',
        title: '¿Abrir caja?',
        text: 'Se enviará el comando de apertura a la caja registradora.',
        showCancelButton: true,
        confirmButtonText: 'Sí, abrir caja',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#059669',
        cancelButtonColor: '#64748b',
      });

      if (!confirmacion.isConfirmed) return;

      Swal.fire({
        title: 'Abriendo caja...',
        html: `
        <div style="text-align:center">
          <p>Enviando comando a la caja registradora.</p>
        </div>
      `,
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const response = await fetch(`${API_IMPRESION_LOCAL}/abrir-caja`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-printer-key': PRINTER_KEY,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.message || 'No se pudo abrir la caja');
      }

      Swal.fire({
        icon: 'success',
        title: 'Caja abierta',
        text: 'La caja fue abierta correctamente.',
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error('Error al abrir caja:', error);

      Swal.fire({
        icon: 'error',
        title: 'No se pudo abrir la caja',
        text:
          error.message ||
          'Verifica que la app local de impresión esté abierta y que la caja esté conectada.',
      });
    }
  };

  const abrirEscanerProducto = () => {
    setScannerTipo('PRODUCTO');
    setScannerAbierto(true);
  };

  const abrirEscanerTarjeta = () => {
    setScannerTipo('TARJETA');
    setScannerAbierto(true);
  };

  const cerrarEscaner = () => {
    setScannerAbierto(false);
    setScannerTipo(null);
  };

  const alDetectarCodigo = (codigoDetectado) => {
    const codigo = String(codigoDetectado || '').trim();
    if (!codigo) {
      cerrarEscaner();
      return;
    }

    if (scannerTipo === 'PRODUCTO') {
      setBuscar(codigo);
      cerrarEscaner();
      setTimeout(() => cargarInventario(codigo), 150);
      return;
    }

    if (scannerTipo === 'TARJETA') {
      setCodigoTarjeta(codigo);
      cerrarEscaner();
      setTimeout(() => buscarTarjetaPuntos(codigo), 150);
      return;
    }

    cerrarEscaner();
  };


  const seleccionarSugerenciaProducto = async (producto) => {
    if (!producto) return;

    const nombreProducto =
      producto.producto ||
      producto.nombre ||
      producto.descripcion_producto ||
      '';

    setBuscar(nombreProducto);
    setMostrandoSugerenciasProductos(false);
    setSugerenciasProductos([]);

    // Esto deja visible solo el producto seleccionado en la lista principal.
    setInventario([producto]);

    // Esto abre el modal de lotes para agregarlo al carrito.
    await agregarAlCarrito(producto);
  };

  return (
    <div className="min-h-screen w-full max-w-full overflow-hidden bg-slate-50 pb-8">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-sky-600 text-white shadow-lg shadow-sky-600/20">
              <ShoppingCart size={28} />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                  Punto de venta
                </h1>
                <span className={`rounded-full px-3 py-1 text-xs font-black ${sesionAbierta ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {sesionAbierta ? 'Caja abierta' : 'Caja cerrada'}
                </span>
              </div>
              <p className="mt-1 max-w-2xl text-sm text-slate-500 sm:text-base">
                Flujo simple: configura caja, agrega productos o recetas y cobra la venta.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={abrirCajaPOS}
              disabled={!sesionAbierta}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Banknote size={18} />
              Abrir caja
            </button>

            <button
              type="button"
              onClick={abrirModalRecetas}
              disabled={!sesionAbierta}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-50 px-5 py-3 text-sm font-black text-sky-700 ring-1 ring-sky-100 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ClipboardList size={18} />
              Recetas pendientes
              {recetasPendientes.length > 0 && (
                <span className="rounded-full bg-sky-700 px-2 py-0.5 text-xs text-white">
                  {recetasPendientes.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={abrirModalServicios}
              disabled={!sesionAbierta}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-50 px-5 py-3 text-sm font-black text-emerald-700 ring-1 ring-emerald-100 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FileText size={18} />
              Servicios pendientes
              {serviciosPendientes.length > 0 && (
                <span className="rounded-full bg-emerald-700 px-2 py-0.5 text-xs text-white">
                  {serviciosPendientes.length}
                </span>
              )}
            </button>

            <button
              onClick={refrescarTodo}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
            >
              <RefreshCw size={18} className={cargando ? 'animate-spin' : ''} />
              Actualizar
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-black text-white">1</span>
              <p className="text-sm font-black text-slate-800">Sucursal</p>
            </div>
            {puedeCambiarSucursal ? (
              <select
                value={idSucursal}
                onChange={(e) => setIdSucursal(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="">Selecciona sucursal</option>
                {sucursales.map((sucursal) => (
                  <option key={sucursal.id_sucursal} value={sucursal.id_sucursal}>
                    {sucursal.nombre}
                  </option>
                ))}
              </select>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700">
                {sucursalActual?.nombre || sucursales[0]?.nombre || 'Sucursal asignada'}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-black text-white">
                2
              </span>
              <p className="text-sm font-black text-slate-800">Caja</p>
            </div>

            <select
              value={idCaja}
              onChange={(e) => setIdCaja(e.target.value)}
              disabled={!puedeCambiarCaja || cajas.length === 0}
              className={`w-full rounded-2xl border px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-sky-500 ${puedeCambiarCaja
                ? 'border-slate-200 bg-white text-slate-700'
                : 'border-slate-200 bg-slate-100 text-slate-600 cursor-not-allowed'
                }`}
            >
              <option value="">
                {cajas.length === 0
                  ? 'No tienes una caja asignada'
                  : 'Selecciona caja'}
              </option>

              {cajas.map((caja) => (
                <option key={caja.id_caja} value={caja.id_caja}>
                  {caja.nombre}
                </option>
              ))}
            </select>

            {!puedeCambiarCaja && (
              <p className="mt-2 text-xs font-medium text-slate-500">
                Esta caja está asignada a tu usuario.
              </p>
            )}
          </div>

          <div className={`rounded-3xl border p-4 ${sesionAbierta ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
            <div className="mb-3 flex items-center gap-2">
              <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black text-white ${sesionAbierta ? 'bg-emerald-600' : 'bg-red-600'}`}>3</span>
              <p className={`text-sm font-black ${sesionAbierta ? 'text-emerald-900' : 'text-red-900'}`}>Estado de operación</p>
            </div>
            <div className={`rounded-2xl bg-white px-4 py-3 text-sm font-black ${sesionAbierta ? 'text-emerald-700' : 'text-red-700'}`}>
              {sesionAbierta ? `Lista para vender · Sesión #${sesionAbierta.id_sesion}` : 'Debes abrir caja antes de vender'}
            </div>
          </div>
        </div>
      </section>

      {!sesionAbierta && (
        <section className="mt-5 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-amber-900 shadow-sm sm:p-5">
          <div className="flex items-start gap-3">
            <Wallet size={24} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-black">Caja no abierta</p>
              <p className="mt-1 text-sm">Abre una caja en el módulo Caja para habilitar agregar productos, recetas y cobrar.</p>
            </div>
          </div>
        </section>
      )}

      <section className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_430px]">
        <div className="min-w-0 space-y-5">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-sky-700">Paso 1</p>
                <h2 className="text-xl font-black text-slate-900">Buscar y agregar productos</h2>
                <p className="text-sm text-slate-500">Busca por nombre, código de barras, laboratorio o escanea el producto.</p>
              </div>
              {recetaEnCarrito && (
                <div className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-800">
                  <p className="font-black">Receta cargada</p>
                  <p className="text-xs">{recetaEnCarrito.folio} · {recetaEnCarrito.paciente || 'Paciente'}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto]">

              <div className="relative min-w-0">
                <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />

                <input
                  value={buscar}
                  onChange={(e) => {
                    const valor = e.target.value;
                    setBuscar(valor);
                    setMostrandoSugerenciasProductos(valor.trim().length >= 2);
                  }}
                  onFocus={() => {
                    if (buscar.trim().length >= 2 && sugerenciasProductos.length > 0) {
                      setMostrandoSugerenciasProductos(true);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      setMostrandoSugerenciasProductos(false);
                      cargarInventario(buscar);
                    }

                    if (e.key === 'Escape') {
                      setMostrandoSugerenciasProductos(false);
                    }
                  }}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm font-semibold text-slate-700 outline-none transition focus:bg-white focus:ring-2 focus:ring-sky-500"
                  placeholder="Ej. paracetamol, código, laboratorio."
                />

                {mostrandoSugerenciasProductos && buscar.trim().length >= 2 && (
                  <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15">
                    {cargandoSugerenciasProductos ? (
                      <div className="flex items-center gap-2 px-4 py-3 text-sm font-bold text-slate-500">
                        <Loader2 size={17} className="animate-spin" />
                        Buscando productos...
                      </div>
                    ) : sugerenciasProductos.length === 0 ? (
                      <div className="px-4 py-3 text-sm font-bold text-slate-500">
                        No se encontraron productos con “{buscar}”.
                      </div>
                    ) : (
                      <div className="max-h-80 overflow-y-auto py-2">
                        {sugerenciasProductos.map((producto) => {
                          const nombreProducto =
                            producto.producto ||
                            producto.nombre ||
                            producto.descripcion_producto ||
                            'Producto sin nombre';

                          const stockProducto = Number(
                            producto.stock_actual ||
                            producto.stock ||
                            0
                          );

                          const precioProducto = Number(producto.precio_venta || 0);

                          return (
                            <button
                              key={`${producto.id_producto}-${producto.id_lote || 'stock'}`}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                seleccionarSugerenciaProducto(producto);
                              }}
                              className="flex w-full items-start justify-between gap-4 px-4 py-3 text-left transition hover:bg-sky-50"
                            >
                              <div className="min-w-0">
                                <p className="truncate text-sm font-black text-slate-800">
                                  {nombreProducto}
                                </p>

                                <p className="mt-0.5 text-xs font-semibold text-slate-500">
                                  {producto.codigo_barras || 'Sin código'}
                                  {producto.laboratorio ? ` · ${producto.laboratorio}` : ''}
                                  {producto.presentacion ? ` · ${producto.presentacion}` : ''}
                                </p>

                                <p className="mt-1 text-xs font-bold text-sky-700">
                                  Stock: {formatoNumero(stockProducto)}
                                </p>
                              </div>

                              <div className="shrink-0 text-right">
                                <p className="text-sm font-black text-emerald-700">
                                  {formatoMoneda(precioProducto)}
                                </p>

                                {(esProductoControlado(producto) || productoRequiereReceta(producto)) && (
                                  <span className="mt-1 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-700">
                                    Receta
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={abrirEscanerProducto}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
              >
                <Barcode size={18} />
                Escanear
              </button>
              <button
                type="button"
                onClick={() => {
                  setMostrandoSugerenciasProductos(false);
                  cargarInventario(buscar);
                }}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-700 px-5 py-3 text-sm font-black text-white transition hover:bg-sky-800"
              >
                <Search size={18} />
                Buscar
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
              <button
                type="button"
                onClick={abrirModalRecetas}
                disabled={!sesionAbierta}
                className="flex items-center justify-between rounded-2xl border border-sky-100 bg-sky-50 p-4 text-left transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <div>
                  <p className="text-sm font-black text-sky-900">Surtir receta</p>
                  <p className="text-xs text-sky-700">{recetasPendientes.length} pendiente(s)</p>
                </div>
                <ClipboardList className="text-sky-700" size={22} />
              </button>

              <button
                type="button"
                onClick={abrirModalServicios}
                disabled={!sesionAbierta}
                className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-left transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <div>
                  <p className="text-sm font-black text-emerald-900">Cobrar servicio</p>
                  <p className="text-xs text-emerald-700">{serviciosPendientes.length} pendiente(s)</p>
                </div>
                <FileText className="text-emerald-700" size={22} />
              </button>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-black text-slate-800">Productos visibles</p>
                <p className="text-2xl font-black text-slate-900">{formatoNumero(inventario.length)}</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-black text-slate-800">En carrito</p>
                <p className="text-2xl font-black text-slate-900">{formatoNumero(carrito.length)}</p>
              </div>
            </div>
          </div>

          <ProductosDisponibles
            inventario={inventario}
            cargando={cargando}
            sucursalActual={sucursalActual}
            sesionAbierta={sesionAbierta}
            formatoMoneda={formatoMoneda}
            formatoNumero={formatoNumero}
            tieneOfertaActiva={tieneOfertaActiva}
            esProductoControlado={esProductoControlado}
            productoRequiereReceta={productoRequiereReceta}
            agregarAlCarrito={agregarAlCarrito}
          />
        </div>

        <CarritoPOS
          carrito={carrito}
          tarjetaPuntos={tarjetaPuntos}
          codigoTarjeta={codigoTarjeta}
          setCodigoTarjeta={setCodigoTarjeta}
          buscandoTarjeta={buscandoTarjeta}
          buscarTarjetaPuntos={buscarTarjetaPuntos}
          abrirEscanerTarjeta={() => { setScannerTipo('TARJETA'); setScannerAbierto(true); }}
          quitarTarjetaPuntos={quitarTarjetaPuntos}
          metodoPago={metodoPago}
          seleccionarMetodoPago={seleccionarMetodoPago}
          montoRecibido={montoRecibido}
          setMontoRecibido={setMontoRecibido}
          pagoMixtoActivo={pagoMixtoActivo}
          alternarPagoMixto={alternarPagoMixto}
          pagosMixtos={pagosMixtos}
          actualizarPagoMixto={actualizarPagoMixto}
          resumenPagosMixtos={resumenPagosMixtos}
          cobrarImpuesto={cobrarImpuesto}
          setCobrarImpuesto={setCobrarImpuesto}
          resumen={resumen}
          formatoMoneda={formatoMoneda}
          formatoNumero={formatoNumero}
          formatoFechaCorta={formatoFechaCorta}
          aumentarCantidad={aumentarCantidad}
          disminuirCantidad={disminuirCantidad}
          cambiarCantidadManual={cambiarCantidadManual}
          quitarDelCarrito={quitarDelCarrito}
          limpiarVenta={limpiarVenta}
          cobrarVenta={cobrarVenta}
          cobrando={cobrando}
          puntosClienteActivo={puntosClienteActivo}
          porcentajeClientePuntos={porcentajeClientePuntos}
          recetaEnCarrito={recetaEnCarrito}
          enviarTicketDigital={enviarTicketDigital}
          setEnviarTicketDigital={setEnviarTicketDigital}
          correoTicketDigital={correoTicketDigital}
          tieneCorreoTicketDigital={tieneCorreoTicketDigital}
          puedeEnviarTicketDigital={puedeEnviarTicketDigital}
          configuracionCorreoSmtp={configuracionCorreoSmtp}
          cargandoConfiguracionCorreo={cargandoConfiguracionCorreo}
        />
      </section>

      {ventaFinalizada && (
        <section className="mt-5 rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <CheckCircle size={28} className="mt-0.5 shrink-0 text-emerald-700" />
              <div>
                <p className="font-black">Última venta registrada</p>
                <p className="text-sm">Folio: <span className="font-black">{ventaFinalizada.venta?.folio}</span></p>
                <p className="text-sm">Total: <span className="font-black">{formatoMoneda(ventaFinalizada.resumen?.total)}</span></p>
              </div>
            </div>
            <button
              onClick={() => imprimirTicketPOS()}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
            >
              <ReceiptText size={18} />
              Imprimir ticket
            </button>
          </div>
        </section>
      )}

      {modalControladoAbierto && (
        <ModalDatosControlado
          producto={productoControladoPendiente}
          datos={datosControlProducto}
          setDatos={setDatosControlProducto}
          onClose={() => {
            setModalControladoAbierto(false);
            setProductoControladoPendiente(null);
          }}
          onConfirmar={confirmarDatosControlado}
        />
      )}

      {modalLotesProducto && (
        <ModalLotesProducto
          producto={productoSeleccionadoLotes}
          lotes={lotesProducto}
          cargando={cargandoLotes}
          contextoReceta={contextoLoteReceta}
          onClose={cerrarModalLotesProducto}
          onAgregar={agregarProductoConLote}
          formatoMoneda={formatoMoneda}
          formatoNumero={formatoNumero}
          formatoFechaCorta={formatoFechaCorta}
        />
      )}

      {modalRecetasAbierto && (
        <ModalRecetasPendientes
          recetasPendientes={recetasPendientes}
          cargandoRecetas={cargandoRecetas}
          recetaSeleccionada={recetaSeleccionada}
          detalleReceta={detalleReceta}
          cargandoDetalleReceta={cargandoDetalleReceta}
          onClose={cerrarModalRecetas}
          cargarRecetasPendientes={cargarRecetasPendientes}
          verDetalleRecetaPOS={verDetalleRecetaPOS}
          agregarDetalleRecetaConLote={agregarDetalleRecetaConLote}
          finalizarRecetaDesdeCaja={finalizarRecetaDesdeCaja}
          finalizandoReceta={finalizandoReceta}
          inventario={inventario}
          carrito={carrito}
          formatoNumero={formatoNumero}
          formatearFecha={formatearFecha}
        />
      )}

      {modalServiciosAbierto && (
        <ModalServiciosPendientes
          serviciosPendientes={serviciosPendientes}
          cargandoServicios={cargandoServicios}
          servicioSeleccionado={servicioSeleccionado}
          detalleServicio={detalleServicio}
          cargandoDetalleServicio={cargandoDetalleServicio}
          onClose={cerrarModalServicios}
          cargarServiciosPendientes={cargarServiciosPendientes}
          verDetalleServicioPOS={verDetalleServicioPOS}
          agregarDetalleServicioAlCarrito={agregarDetalleServicioAlCarrito}
          carrito={carrito}
          formatoMoneda={formatoMoneda}
          formatoNumero={formatoNumero}
          formatearFecha={formatearFecha}
        />
      )}

      <BarcodeScannerModal
        abierto={scannerAbierto}
        titulo={scannerTipo === 'TARJETA' ? 'Escanear tarjeta de puntos' : 'Escanear producto'}
        descripcion={scannerTipo === 'TARJETA' ? 'Apunta la cámara al código de la tarjeta del cliente.' : 'Apunta la cámara al código de barras del producto.'}
        onClose={cerrarEscaner}
        onDetected={alDetectarCodigo}
      />
    </div>
  );
}


function ProductosDisponibles({
  inventario,
  cargando,
  sucursalActual,
  sesionAbierta,
  formatoMoneda,
  formatoNumero,
  tieneOfertaActiva,
  esProductoControlado,
  productoRequiereReceta,
  agregarAlCarrito,
}) {
  const PRODUCTOS_POR_PAGINA = 8;
  const [paginaActual, setPaginaActual] = useState(1);

  const totalProductos = inventario.length;
  const totalPaginas = Math.max(Math.ceil(totalProductos / PRODUCTOS_POR_PAGINA), 1);
  const inicio = (paginaActual - 1) * PRODUCTOS_POR_PAGINA;
  const fin = inicio + PRODUCTOS_POR_PAGINA;
  const productosPagina = inventario.slice(inicio, fin);

  useEffect(() => {
    setPaginaActual(1);
  }, [inventario]);

  const irPaginaAnterior = () => {
    setPaginaActual((pagina) => Math.max(pagina - 1, 1));
  };

  const irPaginaSiguiente = () => {
    setPaginaActual((pagina) => Math.min(pagina + 1, totalPaginas));
  };

  return (
    <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-wide text-sky-700">Paso 2</p>
          <h2 className="text-xl font-black text-slate-900">Selecciona productos</h2>
          <p className="mt-1 text-sm text-slate-500">
            {sucursalActual?.nombre || 'Sin sucursal seleccionada'} · Se muestran máximo {PRODUCTOS_POR_PAGINA} productos por página.
          </p>
        </div>
        <div className="flex flex-col gap-1 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black text-slate-700 sm:items-end">
          <div className="flex items-center gap-2">
            <Package size={18} />
            {formatoNumero(totalProductos)} resultado(s)
          </div>
          {totalProductos > 0 && (
            <span className="text-xs font-bold text-slate-500">
              Mostrando {formatoNumero(inicio + 1)}-{formatoNumero(Math.min(fin, totalProductos))}
            </span>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-5">
        {cargando ? (
          <EstadoTabla icono={<Loader2 size={22} className="animate-spin" />} texto="Cargando productos..." />
        ) : totalProductos === 0 ? (
          <EstadoTabla icono={<Package size={22} />} texto="No hay productos con stock disponible." />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 2xl:grid-cols-2">
              {productosPagina.map((item) => (
                <ProductoCard
                  key={item.id_inventario || item.id_producto}
                  item={item}
                  sesionAbierta={sesionAbierta}
                  formatoMoneda={formatoMoneda}
                  formatoNumero={formatoNumero}
                  tieneOfertaActiva={tieneOfertaActiva}
                  esProductoControlado={esProductoControlado}
                  productoRequiereReceta={productoRequiereReceta}
                  agregarAlCarrito={agregarAlCarrito}
                />
              ))}
            </div>

            {totalProductos > PRODUCTOS_POR_PAGINA && (
              <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-bold text-slate-600">
                  Página <span className="text-slate-900">{paginaActual}</span> de <span className="text-slate-900">{totalPaginas}</span>
                </p>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={irPaginaAnterior}
                    disabled={paginaActual === 1}
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none"
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    onClick={irPaginaSiguiente}
                    disabled={paginaActual === totalPaginas}
                    className="flex-1 rounded-xl bg-sky-700 px-4 py-2 text-sm font-black text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ProductoCard({
  item,
  sesionAbierta,
  formatoMoneda,
  formatoNumero,
  tieneOfertaActiva,
  esProductoControlado,
  productoRequiereReceta,
  agregarAlCarrito,
}) {
  const oferta = tieneOfertaActiva(item);
  const precioFinal = oferta ? item.precio_con_descuento : item.precio_venta;

  return (
    <article className="group rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="break-words text-base font-black leading-snug text-slate-900">
            {item.producto || item.nombre}
          </h3>
          <p className="mt-1 break-words text-xs font-semibold text-slate-500">
            {item.laboratorio || 'Sin laboratorio'} · {item.presentacion || 'Sin presentación'}
          </p>
        </div>
        <div className="shrink-0 rounded-2xl bg-sky-50 px-3 py-2 text-right">
          {oferta && (
            <p className="text-[11px] font-bold text-slate-400 line-through">
              {formatoMoneda(item.precio_venta)}
            </p>
          )}
          <p className={`text-base font-black ${oferta ? 'text-emerald-700' : 'text-sky-700'}`}>
            {formatoMoneda(precioFinal)}
          </p>
        </div>
      </div>

      <EtiquetasProducto
        item={item}
        esProductoControlado={esProductoControlado}
        productoRequiereReceta={productoRequiereReceta}
        tieneOfertaActiva={tieneOfertaActiva}
        formatoNumero={formatoNumero}
      />

      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="text-[11px] font-bold uppercase text-slate-400">Código</p>
          <p className="mt-1 truncate font-black text-slate-800">{item.codigo_barras || '—'}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3 text-center">
          <p className="text-[11px] font-bold uppercase text-slate-400">Stock total</p>
          <p className="mt-1 font-black text-slate-900">{formatoNumero(item.stock_actual)}</p>
        </div>
      </div>

      {oferta && (
        <div className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
          Ahorro por pieza: {formatoMoneda(item.descuento_unitario)}
        </div>
      )}

      <button
        onClick={() => agregarAlCarrito(item)}
        disabled={!sesionAbierta}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-700 px-4 py-3 text-sm font-black text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
      >
        <Plus size={18} />
        Elegir lote y agregar
      </button>
    </article>
  );
}

function EtiquetasProducto({ item, esProductoControlado, productoRequiereReceta, tieneOfertaActiva, formatoNumero }) {
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {esProductoControlado(item) && (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-black text-red-700">
          <AlertTriangle size={12} />
          Controlado
        </span>
      )}
      {productoRequiereReceta(item) && (
        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-black text-amber-700">
          Requiere receta
        </span>
      )}
      {tieneOfertaActiva(item) && (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-black text-emerald-700">
          <BadgePercent size={12} />
          Oferta -{formatoNumero(item.porcentaje_descuento)}%
        </span>
      )}
    </div>
  );
}

function EstadoTabla({ texto, icono = null }) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-3xl bg-slate-50 p-8 text-center text-slate-500">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
        {icono || <Package size={22} />}
      </div>
      <p className="font-black">{texto}</p>
    </div>
  );
}

function CarritoPOS({
  carrito,
  tarjetaPuntos,
  codigoTarjeta,
  setCodigoTarjeta,
  buscandoTarjeta,
  buscarTarjetaPuntos,
  abrirEscanerTarjeta,
  quitarTarjetaPuntos,
  metodoPago,
  seleccionarMetodoPago,
  montoRecibido,
  setMontoRecibido,
  pagoMixtoActivo,
  alternarPagoMixto,
  pagosMixtos,
  actualizarPagoMixto,
  resumenPagosMixtos,
  cobrarImpuesto,
  setCobrarImpuesto,
  resumen,
  formatoMoneda,
  formatoNumero,
  formatoFechaCorta,
  aumentarCantidad,
  disminuirCantidad,
  cambiarCantidadManual,
  quitarDelCarrito,
  limpiarVenta,
  cobrarVenta,
  cobrando,
  puntosClienteActivo,
  porcentajeClientePuntos,
  recetaEnCarrito,
  enviarTicketDigital,
  setEnviarTicketDigital,
  correoTicketDigital,
  tieneCorreoTicketDigital,
  puedeEnviarTicketDigital,
  configuracionCorreoSmtp,
  cargandoConfiguracionCorreo,
}) {
  return (
    <aside className="min-w-0 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm xl:sticky xl:top-5 xl:max-h-[calc(100vh-2.5rem)] xl:overflow-y-auto">
      <div className="border-b border-slate-100 bg-slate-900 px-4 py-5 text-white sm:px-5">
        <p className="text-xs font-black uppercase tracking-wide text-sky-200">Paso 3</p>
        <div className="mt-1 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">Cobrar venta</h2>
            <p className="text-sm text-slate-300">{carrito.length} item(s) en carrito</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-3">
            <ReceiptText size={24} />
          </div>
        </div>
      </div>

      {recetaEnCarrito && (
        <div className="mx-4 mt-4 rounded-3xl border border-sky-100 bg-sky-50 p-4 text-sky-900 sm:mx-5">
          <p className="text-sm font-black">Venta desde receta</p>
          <p className="mt-1 text-xs">Folio: <span className="font-bold">{recetaEnCarrito.folio}</span></p>
          <p className="text-xs">Paciente: <span className="font-bold">{recetaEnCarrito.paciente || 'N/A'}</span></p>
        </div>
      )}

      <section className="border-b border-slate-100 p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black text-slate-900">Productos / servicios agregados</p>
            <p className="text-xs font-semibold text-slate-500">Revisa cantidades, lotes y servicios antes de cobrar.</p>
          </div>
          {carrito.length > 0 && (
            <button
              type="button"
              onClick={limpiarVenta}
              className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-red-100 hover:text-red-700"
            >
              Limpiar
            </button>
          )}
        </div>

        {carrito.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
            <ShoppingCart className="mx-auto text-slate-400" size={30} />
            <p className="mt-3 font-black text-slate-700">Carrito vacío</p>
            <p className="mt-1 text-sm text-slate-500">Agrega productos o servicios desde la lista de la izquierda.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {carrito.map((item) => (
              <div key={item.key_carrito} className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-words text-sm font-black text-slate-900">{item.nombre}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {item.tipo_item === 'SERVICIO'
                        ? `${item.folio_servicio || 'Servicio clínico'} · ${item.paciente_servicio || 'Paciente'}`
                        : `${item.lote ? `Lote ${item.lote}` : 'Sin lote'} · Cad. ${formatoFechaCorta(item.fecha_caducidad)}`}
                    </p>
                    <p className="mt-1 text-xs font-bold text-sky-700">
                      {formatoMoneda(item.precio_venta)} c/u
                    </p>
                  </div>
                  <button
                    onClick={() => quitarDelCarrito(item.key_carrito)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 transition hover:bg-red-100"
                    title="Quitar del carrito"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 p-1">
                    <button
                      type="button"
                      onClick={() => disminuirCantidad(item.key_carrito)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm hover:bg-slate-100"
                    >
                      <Minus size={16} />
                    </button>
                    <input
                      type="number"
                      min="0"
                      value={item.cantidad}
                      onChange={(e) => cambiarCantidadManual(item.key_carrito, e.target.value)}
                      className="h-9 w-16 bg-transparent text-center text-sm font-black text-slate-900 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => aumentarCantidad(item.key_carrito)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm hover:bg-slate-100"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-bold uppercase text-slate-400">Importe</p>
                    <p className="text-base font-black text-slate-900">
                      {formatoMoneda(Number(item.cantidad || 0) * Number(item.precio_venta || 0))}
                    </p>
                  </div>
                </div>

                {(item.tipo_item === 'SERVICIO' || item.controlado || item.requiere_receta || item.tiene_oferta) && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {item.tipo_item === 'SERVICIO' && <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-black text-emerald-700">Servicio clínico</span>}
                    {item.controlado && <span className="rounded-full bg-red-100 px-2 py-1 text-[10px] font-black text-red-700">Controlado</span>}
                    {item.requiere_receta && <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-black text-amber-700">Receta</span>}
                    {item.tiene_oferta && <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-black text-emerald-700">Oferta</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="border-b border-slate-100 p-4 sm:p-5">
        <div className="mb-3 flex items-center gap-2">
          <UserCheck size={18} className="text-sky-700" />
          <p className="text-sm font-black text-slate-900">Cliente / puntos</p>
        </div>

        {!tarjetaPuntos ? (
          <div className="space-y-3">
            <div className="relative">
              <Barcode className="absolute left-4 top-3.5 text-slate-400" size={18} />
              <input
                value={codigoTarjeta}
                onChange={(e) => setCodigoTarjeta(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') buscarTarjetaPuntos(); }}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-sky-500"
                placeholder="Tarjeta o teléfono del cliente"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => buscarTarjetaPuntos()}
                disabled={buscandoTarjeta}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-700 px-4 py-3 text-xs font-black text-white transition hover:bg-sky-800 disabled:opacity-60"
              >
                {buscandoTarjeta ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                Buscar
              </button>
              <button
                type="button"
                onClick={abrirEscanerTarjeta}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-xs font-black text-slate-700 transition hover:bg-slate-200"
              >
                <Barcode size={16} />
                Escanear
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-4 text-emerald-900">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-black">{tarjetaPuntos.nombre_cliente}</p>
                <p className="mt-1 text-xs font-semibold text-emerald-700">{tarjetaPuntos.codigo_barras}</p>
                <p className="mt-2 text-sm font-black">{formatoNumero(tarjetaPuntos.puntos_actuales)} puntos disponibles</p>
              </div>
              <button
                type="button"
                onClick={quitarTarjetaPuntos}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-800 shadow-sm hover:bg-emerald-100"
                title="Quitar tarjeta vinculada"
              >
                <X size={16} />
              </button>
            </div>

            {puntosClienteActivo && ((!pagoMixtoActivo && metodoPago !== 'PUNTOS') || (pagoMixtoActivo && resumenPagosMixtos.puntos <= 0)) && (
              <p className="mt-3 rounded-2xl bg-white px-3 py-2 text-xs font-bold text-emerald-700">
                Esta venta generaría {formatoNumero(resumen.puntosEstimados)} puntos ({formatoNumero(porcentajeClientePuntos)}%).
              </p>
            )}

            <div className={`mt-3 rounded-2xl border p-3 ${puedeEnviarTicketDigital
              ? 'border-sky-200 bg-sky-50 text-sky-950'
              : 'border-amber-200 bg-amber-50 text-amber-950'
              }`}>
              <div className="flex items-start gap-2.5">
                <div className={`mt-0.5 rounded-xl p-2 ${puedeEnviarTicketDigital
                  ? 'bg-white text-sky-700'
                  : 'bg-white text-amber-700'
                  }`}>
                  <Mail size={16} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black">
                    Ticket digital por correo
                  </p>

                  {tieneCorreoTicketDigital ? (
                    <p className="mt-0.5 break-all text-[11px] font-semibold opacity-80">
                      {correoTicketDigital}
                    </p>
                  ) : (
                    <p className="mt-0.5 text-[11px] font-semibold opacity-80">
                      Esta tarjeta no tiene un correo electrónico válido.
                    </p>
                  )}

                  {cargandoConfiguracionCorreo ? (
                    <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold">
                      <Loader2 size={13} className="animate-spin" />
                      Verificando servicio de correo...
                    </p>
                  ) : puedeEnviarTicketDigital ? (
                    <label className="mt-3 flex cursor-pointer items-start gap-2 rounded-xl bg-white/80 px-3 py-2.5 text-[11px] font-bold shadow-sm">
                      <input
                        type="checkbox"
                        checked={enviarTicketDigital}
                        onChange={(event) =>
                          setEnviarTicketDigital(event.target.checked)
                        }
                        className="mt-0.5 h-4 w-4 cursor-pointer rounded border-sky-300 text-sky-700 focus:ring-sky-600"
                      />

                      <span>
                        Enviar ticket digital al finalizar esta venta
                        {configuracionCorreoSmtp?.enviar_ticket_automatico
                          ? ' (seleccionado automáticamente)'
                          : ''}
                      </span>
                    </label>
                  ) : (
                    <p className="mt-2 text-[11px] font-bold">
                      {tieneCorreoTicketDigital
                        ? 'El servicio de ticket digital no está activo para esta sucursal.'
                        : 'Registra un correo en la tarjeta para habilitar esta opción.'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="border-b border-slate-100 p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3">
          <div>
            <p className="text-sm font-black text-slate-900">Pago mixto</p>
            <p className="text-xs font-semibold text-slate-500">
              Actívalo para combinar efectivo, tarjeta, transferencia y puntos.
            </p>
          </div>
          <button
            type="button"
            onClick={alternarPagoMixto}
            className={`relative h-8 w-14 shrink-0 rounded-full transition ${pagoMixtoActivo ? 'bg-sky-700' : 'bg-slate-300'}`}
            title={pagoMixtoActivo ? 'Desactivar pago mixto' : 'Activar pago mixto'}
          >
            <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition ${pagoMixtoActivo ? 'left-7' : 'left-1'}`} />
          </button>
        </div>

        {!pagoMixtoActivo ? (
          <>
            <p className="mb-3 text-sm font-black text-slate-900">Método de pago</p>
            <div className="grid grid-cols-2 gap-2">
              {METODOS_PAGO_POS.map((metodo) => {
                const Icono = metodo.icono;
                const activo = metodoPago === metodo.id;

                return (
                  <button
                    key={metodo.id}
                    type="button"
                    onClick={() => seleccionarMetodoPago(metodo.id)}
                    className={`flex items-center justify-center gap-2 rounded-2xl px-3 py-3 text-xs font-black transition ${activo
                      ? 'bg-sky-700 text-white shadow-lg shadow-sky-700/20'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                  >
                    <Icono size={16} />
                    {metodo.label}
                  </button>
                );
              })}
            </div>

            {metodoPago === 'EFECTIVO' && (
              <div className="mt-4">
                <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">
                  Monto recibido
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={montoRecibido}
                  onChange={(e) => setMontoRecibido(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-lg font-black text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-sky-500"
                  placeholder="0.00"
                />
                <div className={`mt-3 rounded-2xl px-4 py-3 text-sm font-black ${resumen.cambio >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                  Cambio: {formatoMoneda(resumen.cambio)}
                </div>
              </div>
            )}

            {metodoPago === 'PUNTOS' && (
              <div className={`mt-4 rounded-2xl px-4 py-3 text-sm font-black ${resumen.puedePagarConPuntos ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                {tarjetaPuntos
                  ? resumen.puedePagarConPuntos
                    ? `Puntos suficientes: ${formatoNumero(resumen.puntosDisponibles)}`
                    : `Faltan ${formatoNumero(resumen.puntosFaltantes)} puntos`
                  : 'Vincula una tarjeta para pagar con puntos'}
              </div>
            )}
          </>
        ) : (
          <div className="space-y-3">
            <div className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3">
              <p className="text-sm font-black text-sky-900">Distribuye el pago</p>
              <p className="mt-1 text-xs font-semibold text-sky-700">
                Captura solo los métodos que usará el cliente. El cambio se calcula únicamente con efectivo.
              </p>
            </div>

            {METODOS_PAGO_POS.map((metodo) => {
              const Icono = metodo.icono;
              const deshabilitado = metodo.id === 'PUNTOS' && !tarjetaPuntos;

              return (
                <div key={metodo.id} className={`rounded-2xl border p-3 ${deshabilitado ? 'border-slate-100 bg-slate-50 opacity-70' : 'border-slate-200 bg-white'}`}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${metodo.id === 'EFECTIVO' ? 'bg-emerald-50 text-emerald-700' : metodo.id === 'TARJETA' ? 'bg-sky-50 text-sky-700' : metodo.id === 'TRANSFERENCIA' ? 'bg-violet-50 text-violet-700' : 'bg-amber-50 text-amber-700'}`}>
                        <Icono size={17} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900">{metodo.label}</p>
                        {metodo.id === 'PUNTOS' && (
                          <p className="text-[11px] font-bold text-slate-500">
                            {tarjetaPuntos ? `${formatoNumero(tarjetaPuntos.puntos_actuales)} puntos disponibles` : 'Vincula una tarjeta'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    disabled={deshabilitado}
                    value={pagosMixtos[metodo.id] || ''}
                    onChange={(e) => actualizarPagoMixto(metodo.id, e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-black text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-sky-500 disabled:cursor-not-allowed disabled:bg-slate-100"
                    placeholder="0.00"
                  />
                </div>
              );
            })}

            <div className="space-y-2 rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <ResumenLinea label="Total pagado" valor={formatoMoneda(resumenPagosMixtos.totalPagado)} />
              <ResumenLinea label="Pendiente" valor={formatoMoneda(resumenPagosMixtos.pendiente)} destacado={resumenPagosMixtos.pendiente > 0 ? 'red' : null} />
              <ResumenLinea label="Cambio" valor={formatoMoneda(resumenPagosMixtos.cambio)} destacado="emerald" />
              {resumenPagosMixtos.excedenteNoEfectivo > 0 && (
                <div className="rounded-2xl bg-red-50 px-3 py-2 text-xs font-black text-red-700">
                  Tarjeta, transferencia y puntos exceden el total por {formatoMoneda(resumenPagosMixtos.excedenteNoEfectivo)}.
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      <section className="p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3">
          <div>
            <p className="text-sm font-black text-slate-900">Aplicar IVA 16%</p>
            <p className="text-xs font-semibold text-slate-500">Puedes desactivarlo si la venta no lo requiere.</p>
          </div>
          <button
            type="button"
            onClick={() => setCobrarImpuesto(!cobrarImpuesto)}
            className={`relative h-8 w-14 rounded-full transition ${cobrarImpuesto ? 'bg-sky-700' : 'bg-slate-300'}`}
          >
            <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition ${cobrarImpuesto ? 'left-7' : 'left-1'}`} />
          </button>
        </div>

        <div className="space-y-2 rounded-3xl border border-slate-200 bg-white p-4">
          <ResumenLinea label="Subtotal" valor={formatoMoneda(resumen.subtotal)} />
          {resumen.descuentoOfertas > 0 && (
            <ResumenLinea label="Descuento ofertas" valor={`-${formatoMoneda(resumen.descuentoOfertas)}`} destacado="emerald" />
          )}
          <ResumenLinea label="IVA" valor={formatoMoneda(resumen.impuesto)} />
          <div className="my-3 border-t border-dashed border-slate-200" />
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-black text-slate-500">Total a cobrar</p>
              <p className="text-xs font-semibold text-slate-400">MXN</p>
            </div>
            <p className="text-3xl font-black tracking-tight text-slate-900">
              {formatoMoneda(resumen.total)}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={cobrarVenta}
          disabled={cobrando || carrito.length === 0}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-3xl bg-emerald-600 px-5 py-4 text-base font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
        >
          {cobrando ? <Loader2 size={21} className="animate-spin" /> : <CheckCircle size={21} />}
          {cobrando ? 'Cobrando...' : 'Cobrar venta'}
        </button>
      </section>
    </aside>
  );
}

function ResumenLinea({ label, valor, destacado = null }) {
  const color =
    destacado === 'emerald'
      ? 'text-emerald-700'
      : destacado === 'red'
        ? 'text-red-700'
        : 'text-slate-900';

  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="font-bold text-slate-500">{label}</span>
      <span className={`font-black ${color}`}>{valor}</span>
    </div>
  );
}


function ModalDatosControlado({
  producto,
  datos,
  setDatos,
  onClose,
  onConfirmar,
}) {
  const actualizarCampo = (campo, valor) => {
    setDatos((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  };

  const cantidadRecetada = Number(datos.cantidad_recetada || 0);
  const cantidadSurtida = Number(datos.cantidad_surtida || 0);
  const cantidadPendiente = Math.max(cantidadRecetada - cantidadSurtida, 0);
  const surtimientoValido = cantidadRecetada > 0 && cantidadSurtida > 0 && cantidadSurtida <= cantidadRecetada;
  const tipoSurtidoCalculado = surtimientoValido
    ? cantidadPendiente === 0
      ? 'COMPLETO'
      : 'PARCIAL'
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <div className="w-full max-w-3xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
        <div className="border-b border-slate-100 bg-amber-50 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-amber-700">
                Control sanitario
              </p>
              <h2 className="mt-1 text-2xl font-black text-slate-900">
                Datos para medicamento controlado
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Producto:{' '}
                <span className="font-black">
                  {producto?.producto || producto?.nombre || 'Producto seleccionado'}
                </span>
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
        </div>

        <div className="grid max-h-[70vh] grid-cols-1 gap-4 overflow-y-auto p-6 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-black uppercase text-slate-500">
              Número de receta <span className="text-red-500">*</span>
            </label>
            <input
              value={datos.numero_receta}
              onChange={(e) => actualizarCampo('numero_receta', e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="Ej. RX-0001"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-black uppercase text-slate-500">
              Fecha de receta
            </label>
            <input
              type="date"
              value={datos.fecha_receta}
              onChange={(e) => actualizarCampo('fecha_receta', e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-black uppercase text-slate-500">
              Nombre del médico <span className="text-red-500">*</span>
            </label>
            <input
              value={datos.medico_nombre}
              onChange={(e) => actualizarCampo('medico_nombre', e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="Nombre completo"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-black uppercase text-slate-500">
              Cédula profesional <span className="text-red-500">*</span>
            </label>
            <input
              value={datos.medico_cedula}
              onChange={(e) => actualizarCampo('medico_cedula', e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="Cédula"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-black uppercase text-slate-500">
              Nombre del paciente <span className="text-red-500">*</span>
            </label>
            <input
              value={datos.paciente_nombre}
              onChange={(e) => actualizarCampo('paciente_nombre', e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="Nombre completo"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-black uppercase text-slate-500">
              Teléfono del paciente
            </label>
            <input
              value={datos.paciente_telefono}
              onChange={(e) => actualizarCampo('paciente_telefono', e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="Opcional"
            />
          </div>

          <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4 md:col-span-2">
            <p className="text-xs font-black uppercase tracking-wide text-sky-700">
              Surtimiento de receta externa
            </p>
            <p className="mt-1 text-sm text-sky-900">
              Usa estos campos cuando la receta viene de un médico externo y no existe dentro de Doctor Shaddai.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-black uppercase text-slate-500">
                  Cantidad indicada en receta <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={datos.cantidad_recetada}
                  onChange={(e) => actualizarCampo('cantidad_recetada', e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Ej. 3"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-black uppercase text-slate-500">
                  Cantidad a surtir ahora <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max={cantidadRecetada > 0 ? cantidadRecetada : undefined}
                  step="1"
                  value={datos.cantidad_surtida}
                  onChange={(e) => actualizarCampo('cantidad_surtida', e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Ej. 1"
                />
              </div>
            </div>

            <div className={`mt-4 rounded-2xl p-4 text-sm font-bold ${!surtimientoValido
              ? 'bg-slate-100 text-slate-600'
              : tipoSurtidoCalculado === 'COMPLETO'
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-orange-100 text-orange-800'
              }`}>
              {!surtimientoValido
                ? 'Captura cantidades válidas para calcular si la venta será completa o parcial.'
                : tipoSurtidoCalculado === 'COMPLETO'
                  ? 'Resultado: venta completa. Se surtirá toda la cantidad indicada en la receta.'
                  : `Resultado: venta parcial. Quedarán ${cantidadPendiente} pieza(s)/caja(s) pendientes.`}
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-black uppercase text-slate-500">
              Observaciones
            </label>
            <textarea
              value={datos.observaciones}
              onChange={(e) => actualizarCampo('observaciones', e.target.value)}
              rows={3}
              className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="Notas internas, receta retenida, autorización, etc."
            />
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 md:col-span-2">
            <p className="font-black">Importante</p>
            <p className="mt-1">
              Recuerda que hay casos donde es necesario guardar la receta físicamente.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50 px-6 py-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-100"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirmar}
            className="rounded-2xl bg-amber-600 px-5 py-3 text-sm font-black text-white transition hover:bg-amber-700"
          >
            Guardar y seleccionar lote
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalLotesProducto({
  producto,
  lotes,
  cargando,
  contextoReceta,
  onClose,
  onAgregar,
  formatoMoneda,
  formatoNumero,
  formatoFechaCorta,
}) {
  const esReceta = !!contextoReceta?.receta;
  const cantidadRecetada = Number(
    contextoReceta?.detalle?.cantidad_recetada ??
    contextoReceta?.detalle?.cantidad_solicitada ??
    contextoReceta?.detalle?.cantidad ??
    producto?.cantidad_receta ??
    1
  );
  const cantidadSurtidaPrevia = Number(
    contextoReceta?.detalle?.cantidad_surtida_previa_receta ??
    contextoReceta?.detalle?.cantidad_surtida ??
    contextoReceta?.detalle?.total_surtido ??
    contextoReceta?.detalle?.surtido ??
    producto?.cantidad_surtida_previa_receta ??
    0
  );
  const cantidadEnCarritoPrevia = Number(
    contextoReceta?.detalle?.cantidad_en_carrito_receta ??
    producto?.cantidad_en_carrito_receta ??
    0
  );
  const cantidadPendienteReceta = esReceta
    ? Math.max(cantidadRecetada - cantidadSurtidaPrevia - cantidadEnCarritoPrevia, 0)
    : null;

  const cantidadControlSanitarioSugerida = Number(producto?.cantidad_control_sanitario_sugerida || 0);
  const cantidadSugerida = esReceta
    ? Math.max(cantidadPendienteReceta, 1)
    : cantidadControlSanitarioSugerida > 0
      ? cantidadControlSanitarioSugerida
      : 1;
  const [modoSurtido, setModoSurtido] = useState(esReceta ? 'COMPLETA' : 'NORMAL');
  const [cantidad, setCantidad] = useState(cantidadSugerida || 1);

  useEffect(() => {
    const nuevaCantidad = esReceta
      ? Math.max(cantidadPendienteReceta, 1)
      : cantidadControlSanitarioSugerida > 0
        ? cantidadControlSanitarioSugerida
        : 1;
    setCantidad(nuevaCantidad);
    setModoSurtido(esReceta ? 'COMPLETA' : 'NORMAL');
  }, [esReceta, cantidadPendienteReceta, cantidadControlSanitarioSugerida]);

  const normalizarCantidad = (valor) => {
    const numero = Math.max(Number(valor || 1), 1);
    if (!esReceta) return numero;
    return Math.min(numero, Math.max(cantidadPendienteReceta, 1));
  };

  const actualizarCantidad = (valor) => {
    setCantidad(normalizarCantidad(valor));
    if (esReceta) setModoSurtido('PARCIAL');
  };

  const seleccionarModoCompleto = () => {
    if (!esReceta) return;
    setModoSurtido('COMPLETA');
    setCantidad(Math.max(cantidadPendienteReceta, 1));
  };

  const seleccionarModoParcial = () => {
    if (!esReceta) return;
    setModoSurtido('PARCIAL');
    setCantidad((prev) => Math.min(normalizarCantidad(prev), Math.max(cantidadPendienteReceta, 1)));
  };

  const cantidadNumericaActual = normalizarCantidad(cantidad);
  const cantidadPendienteDespues = esReceta
    ? Math.max(cantidadPendienteReceta - cantidadNumericaActual, 0)
    : null;
  const ventaCompletaReceta = esReceta && cantidadPendienteDespues === 0;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="relative z-[81] max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Seleccionar lote</h2>
            <p className="text-sm text-slate-500">
              {esReceta ? 'Producto tomado desde receta Doctor Shaddai.' : 'Elige el lote que deseas descontar.'}
            </p>
          </div>
          <button type="button" onClick={onClose} className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto p-5 space-y-4">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="font-black text-slate-900">{producto?.producto || producto?.nombre || 'Producto'}</p>
            <p className="mt-1 text-xs text-slate-500">Código: {producto?.codigo_barras || '—'} · Presentación: {producto?.presentacion || '—'}</p>
            <p className="mt-2 text-sm font-bold text-sky-700">{formatoMoneda(producto?.precio_con_descuento || producto?.precio_venta || 0)}</p>
            {esReceta && (
              <div className="mt-3 rounded-2xl border border-sky-100 bg-sky-50 p-4 text-xs text-sky-900">
                <div className="grid gap-2 md:grid-cols-2">
                  <p><b>Receta:</b> {contextoReceta.receta.folio_receta || contextoReceta.receta.id_receta}</p>
                  <p><b>Paciente:</b> {contextoReceta.receta.nombre_paciente || 'N/A'}</p>
                  <p><b>Recetado:</b> {formatoNumero(cantidadRecetada)}</p>
                  <p><b>Ya surtido:</b> {formatoNumero(cantidadSurtidaPrevia)}</p>
                  <p><b>En carrito:</b> {formatoNumero(cantidadEnCarritoPrevia)}</p>
                  <p><b>Pendiente:</b> {formatoNumero(cantidadPendienteReceta)}</p>
                </div>
              </div>
            )}
          </div>

          {esReceta && cantidadPendienteReceta <= 0 ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
              Este producto ya está completamente surtido en la receta.
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-100 bg-white p-4">
              {esReceta && (
                <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={seleccionarModoCompleto}
                    className={`rounded-2xl border px-4 py-3 text-left text-sm font-black transition ${modoSurtido === 'COMPLETA'
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                  >
                    Venta completa
                    <span className="mt-1 block text-xs font-bold opacity-80">
                      Agrega todo lo pendiente: {formatoNumero(cantidadPendienteReceta)}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={seleccionarModoParcial}
                    className={`rounded-2xl border px-4 py-3 text-left text-sm font-black transition ${modoSurtido === 'PARCIAL'
                      ? 'border-orange-300 bg-orange-50 text-orange-800'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                  >
                    Venta parcial
                    <span className="mt-1 block text-xs font-bold opacity-80">
                      Permite vender menos de lo pendiente
                    </span>
                  </button>
                </div>
              )}

              <label className="mb-2 block text-sm font-bold text-slate-700">
                {esReceta ? 'Cantidad a surtir de la receta' : 'Cantidad a agregar'}
              </label>
              <input
                type="number"
                min="1"
                max={esReceta ? cantidadPendienteReceta : undefined}
                value={cantidad}
                onChange={(e) => actualizarCantidad(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-sky-500"
              />

              {esReceta && (
                <div className={`mt-3 rounded-2xl p-3 text-sm font-bold ${ventaCompletaReceta ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-700'}`}>
                  {ventaCompletaReceta
                    ? 'Con esta cantidad, el producto quedará surtido completamente.'
                    : `Con esta cantidad, la receta quedará parcial. Pendiente después: ${formatoNumero(cantidadPendienteDespues)}.`}
                </div>
              )}
            </div>
          )}

          {cargando ? (
            <div className="flex items-center justify-center gap-2 rounded-2xl bg-slate-50 p-6 text-sm font-bold text-slate-600">
              <Loader2 size={20} className="animate-spin" />
              Cargando lotes...
            </div>
          ) : lotes.length === 0 ? (
            <div className="rounded-2xl bg-red-50 p-5 text-sm font-bold text-red-700">No hay lotes disponibles para este producto.</div>
          ) : (
            <div className="space-y-3">
              {lotes.map((lote) => {
                const stock = Number(lote.stock_actual || 0);
                const cantidadNumerica = cantidadNumericaActual;
                const excedePendiente = esReceta && cantidadNumerica > cantidadPendienteReceta;
                const sinStock = stock < cantidadNumerica;
                const estadoCaducidad = obtenerEstadoCaducidadLote(lote.fecha_caducidad);
                const loteBloqueado = sinStock || estadoCaducidad.caducado || excedePendiente || (esReceta && cantidadPendienteReceta <= 0);

                return (
                  <div
                    key={lote.id_lote || lote.lote}
                    className={`rounded-2xl border p-4 shadow-sm transition ${estadoCaducidad.cardClass}`}
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className={`font-black ${estadoCaducidad.caducado ? 'text-red-900' : 'text-slate-900'}`}>
                            Lote: {lote.lote || 'Sin lote'}
                          </p>

                          <span className={`rounded-full px-3 py-1 text-xs font-black ${estadoCaducidad.badgeClass}`}>
                            {estadoCaducidad.label}
                          </span>
                        </div>

                        <p className={`mt-1 text-sm font-bold ${estadoCaducidad.caducado ? 'text-red-700' : estadoCaducidad.proximoCaducar ? 'text-amber-700' : 'text-slate-500'}`}>
                          Caducidad: {formatoFechaCorta(lote.fecha_caducidad)}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <p className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${sinStock ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            Stock disponible: {formatoNumero(stock)}
                          </p>

                          {excedePendiente && (
                            <p className="inline-flex rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-700">
                              Excede pendiente de receta
                            </p>
                          )}

                          {estadoCaducidad.caducado && (
                            <p className="inline-flex rounded-full bg-red-600 px-3 py-1 text-xs font-black text-white">
                              No vendible
                            </p>
                          )}

                          {estadoCaducidad.proximoCaducar && (
                            <p className="inline-flex rounded-full bg-amber-500 px-3 py-1 text-xs font-black text-white">
                              Revisar antes de vender
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onAgregar(producto, lote, cantidadNumerica)}
                        disabled={loteBloqueado}
                        className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition ${loteBloqueado
                          ? 'cursor-not-allowed bg-slate-100 text-slate-400'
                          : estadoCaducidad.proximoCaducar
                            ? 'bg-amber-500 text-white hover:bg-amber-600'
                            : ventaCompletaReceta
                              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                              : esReceta
                                ? 'bg-orange-500 text-white hover:bg-orange-600'
                                : 'bg-sky-700 text-white hover:bg-sky-800'
                          }`}
                      >
                        <Plus size={18} />
                        {estadoCaducidad.caducado
                          ? 'Lote caducado'
                          : sinStock
                            ? 'Stock insuficiente'
                            : excedePendiente
                              ? 'Cantidad no válida'
                              : estadoCaducidad.proximoCaducar
                                ? 'Agregar con alerta'
                                : esReceta
                                  ? ventaCompletaReceta
                                    ? 'Surtir completo'
                                    : 'Surtir parcial'
                                  : 'Agregar este lote'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ModalServiciosPendientes({
  serviciosPendientes,
  cargandoServicios,
  servicioSeleccionado,
  detalleServicio,
  cargandoDetalleServicio,
  onClose,
  cargarServiciosPendientes,
  verDetalleServicioPOS,
  agregarDetalleServicioAlCarrito,
  carrito,
  formatoMoneda,
  formatoNumero,
  formatearFecha,
}) {
  const servicioYaAgregado = (detalle) => {
    const idSolicitud = Number(
      servicioSeleccionado?.id_solicitud_servicio ||
      detalle?.id_solicitud_servicio ||
      0
    );

    const idDetalle = Number(
      detalle?.id_detalle_servicio ||
      detalle?.id_detalle ||
      detalle?.id_servicio_detalle ||
      0
    );

    return carrito.some(
      (item) =>
        item.tipo_item === 'SERVICIO' &&
        Number(item.id_solicitud_servicio) === idSolicitud &&
        Number(item.id_detalle_servicio) === idDetalle
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Servicios clínicos pendientes</h2>
            <p className="text-sm text-slate-500">Selecciona una solicitud y agrega sus servicios al carrito.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[0.85fr_1.15fr]">
          <aside className="overflow-y-auto border-r border-slate-100 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-black uppercase tracking-wide text-slate-500">Pendientes</p>
              <button
                type="button"
                onClick={cargarServiciosPendientes}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200"
              >
                <RefreshCw size={14} />
                Actualizar
              </button>
            </div>

            {cargandoServicios ? (
              <div className="flex items-center gap-2 rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-600">
                <Loader2 size={18} className="animate-spin" />
                Cargando servicios...
              </div>
            ) : serviciosPendientes.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 p-5 text-center text-sm text-slate-500">
                No hay servicios clínicos pendientes.
              </div>
            ) : (
              <div className="space-y-3">
                {serviciosPendientes.map((servicio) => (
                  <button
                    key={servicio.id_solicitud_servicio || servicio.id_solicitud || servicio.folio_servicio}
                    type="button"
                    onClick={() => verDetalleServicioPOS(servicio)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${Number(servicioSeleccionado?.id_solicitud_servicio) === Number(servicio.id_solicitud_servicio)
                      ? 'border-emerald-300 bg-emerald-50'
                      : 'border-slate-100 bg-white hover:border-emerald-200 hover:bg-slate-50'
                      }`}
                  >
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <p className="font-black text-slate-900">{servicio.folio_servicio || servicio.id_solicitud_servicio}</p>
                      <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-black text-amber-700">
                        {servicio.estatus || 'PENDIENTE_CAJERO'}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-700">{servicio.nombre_paciente || 'Paciente sin nombre'}</p>
                    <p className="mt-1 text-xs text-slate-500">{formatearFecha(servicio.fecha_creacion)}</p>
                    <p className="mt-2 text-xs font-semibold text-slate-500">
                      Total: {formatoMoneda(servicio.total || servicio.total_servicios || 0)}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </aside>

          <section className="min-h-0 overflow-y-auto p-4 sm:p-6">
            {!servicioSeleccionado ? (
              <div className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                <FileText size={42} className="mb-3 text-slate-400" />
                <p className="font-black text-slate-800">Selecciona una solicitud</p>
                <p className="mt-1 text-sm text-slate-500">El detalle aparecerá aquí para agregarlo al carrito.</p>
              </div>
            ) : cargandoDetalleServicio ? (
              <div className="flex min-h-[420px] items-center justify-center rounded-3xl bg-slate-50">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                  <Loader2 size={20} className="animate-spin" />
                  Cargando detalle...
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="rounded-3xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Folio</p>
                      <h3 className="mt-1 text-2xl font-black text-slate-900">
                        {servicioSeleccionado.folio_servicio || servicioSeleccionado.id_solicitud_servicio}
                      </h3>
                      <p className="mt-2 text-sm text-slate-600">
                        Paciente: <span className="font-bold">{servicioSeleccionado.nombre_paciente || 'N/A'}</span>
                      </p>
                    </div>
                    <div className="text-sm text-slate-600 md:text-right">
                      <p className="font-bold">{formatearFecha(servicioSeleccionado.fecha_creacion)}</p>
                      <p>Total: <span className="font-black">{formatoMoneda(servicioSeleccionado.total || 0)}</span></p>
                    </div>
                  </div>
                </div>

                {(servicioSeleccionado.diagnostico || servicioSeleccionado.observaciones) && (
                  <div className="rounded-2xl border border-slate-100 bg-white p-4">
                    {servicioSeleccionado.diagnostico && (
                      <p className="text-sm text-slate-700"><b>Diagnóstico:</b> {servicioSeleccionado.diagnostico}</p>
                    )}
                    {servicioSeleccionado.observaciones && (
                      <p className="mt-1 text-sm text-slate-700"><b>Observaciones:</b> {servicioSeleccionado.observaciones}</p>
                    )}
                  </div>
                )}

                <div className="rounded-3xl border border-slate-100 bg-white p-5">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-black text-slate-900">Servicios de la solicitud</h3>
                      <p className="text-sm text-slate-500">Agrega los servicios al carrito para cobrarlos.</p>
                    </div>
                    <FileText className="text-slate-400" />
                  </div>

                  {detalleServicio.length === 0 ? (
                    <div className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">
                      La solicitud no tiene servicios registrados.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {detalleServicio.map((servicio) => {
                        const agregado = servicioYaAgregado(servicio);
                        const cantidad = Number(servicio.cantidad || 1);
                        const precio = Number(servicio.precio_unitario || servicio.precio || 0);
                        const subtotal = Number(servicio.subtotal || cantidad * precio || 0);

                        return (
                          <div
                            key={servicio.id_detalle_servicio || servicio.id_detalle || servicio.nombre_servicio}
                            className={`rounded-2xl border p-4 transition ${agregado ? 'border-emerald-200 bg-emerald-50' : 'border-slate-100 bg-slate-50'
                              }`}
                          >
                            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="font-black text-slate-900">
                                    {servicio.nombre_servicio || servicio.nombre || 'Servicio clínico'}
                                  </p>

                                  {agregado && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-black text-emerald-700">
                                      <CheckCircle size={13} />
                                      En carrito
                                    </span>
                                  )}
                                </div>

                                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                  <span className="rounded-full bg-white px-3 py-1 font-bold text-slate-600">
                                    Cantidad: {formatoNumero(cantidad)}
                                  </span>
                                  <span className="rounded-full bg-white px-3 py-1 font-bold text-slate-600">
                                    Precio: {formatoMoneda(precio)}
                                  </span>
                                  <span className="rounded-full bg-emerald-100 px-3 py-1 font-bold text-emerald-700">
                                    Subtotal: {formatoMoneda(subtotal)}
                                  </span>
                                </div>

                                {servicio.indicaciones && (
                                  <p className="mt-2 rounded-xl bg-white p-3 text-xs text-slate-700"><b>Indicaciones:</b> {servicio.indicaciones}</p>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => agregarDetalleServicioAlCarrito(servicio)}
                                disabled={agregado}
                                className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-80 ${agregado
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
                                  }`}
                              >
                                {agregado ? <CheckCircle size={18} /> : <Plus size={18} />}
                                {agregado ? 'Agregado' : 'Agregar al carrito'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function ModalRecetasPendientes({
  recetasPendientes,
  cargandoRecetas,
  recetaSeleccionada,
  detalleReceta,
  cargandoDetalleReceta,
  onClose,
  cargarRecetasPendientes,
  verDetalleRecetaPOS,
  agregarDetalleRecetaConLote,
  finalizarRecetaDesdeCaja,
  finalizandoReceta,
  inventario,
  carrito,
  formatoNumero,
  formatearFecha,
}) {
  const obtenerCantidadEnCarrito = (detalle) => {
    return carrito
      .filter(
        (item) =>
          Number(item.id_detalle_receta_shaddai) === Number(detalle.id_detalle)
      )
      .reduce((acc, item) => acc + Number(item.cantidad || 0), 0);
  };

  const obtenerEstadoSurtidoDetalle = (detalle) => {
    const cantidadReceta = Number(
      detalle.cantidad_recetada ??
      detalle.cantidad ??
      detalle.cantidad_solicitada ??
      1
    );

    const cantidadSurtidaBD = Number(
      detalle.cantidad_surtida ??
      detalle.total_surtido ??
      detalle.surtido ??
      0
    );

    const esNoSurtible = !esDetalleSurtibleDesdeInventario(detalle);
    const cantidadEnCarrito = obtenerCantidadEnCarrito(detalle);

    const cantidadTotalTomada = cantidadSurtidaBD + cantidadEnCarrito;

    const cantidadPendiente = esNoSurtible
      ? null
      : Math.max(cantidadReceta - cantidadTotalTomada, 0);

    const vendidoCompleto =
      !esNoSurtible &&
      cantidadReceta > 0 &&
      cantidadTotalTomada >= cantidadReceta;

    const vendidoParcial =
      !esNoSurtible &&
      cantidadTotalTomada > 0 &&
      cantidadTotalTomada < cantidadReceta;

    const agregadoAlCarrito = !esNoSurtible && cantidadEnCarrito > 0;

    return {
      cantidadReceta,
      cantidadSurtidaBD,
      cantidadEnCarrito,
      cantidadTotalTomada,
      cantidadPendiente,
      vendidoCompleto,
      vendidoParcial,
      agregadoAlCarrito,
      esNoSurtible,
    };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Recetas pendientes Doctor Shaddai</h2>
            <p className="text-sm text-slate-500">Selecciona una receta y atiendela.</p>
          </div>
          <button type="button" onClick={onClose} className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200">
            <X size={20} />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] overflow-hidden">
          <aside className="border-r border-slate-100 p-4 overflow-y-auto">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-black uppercase tracking-wide text-slate-500">Pendientes</p>
              <button type="button" onClick={cargarRecetasPendientes} className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200">
                <RefreshCw size={14} />
                Actualizar
              </button>
            </div>

            {cargandoRecetas ? (
              <div className="flex items-center gap-2 rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-600">
                <Loader2 size={18} className="animate-spin" />
                Cargando recetas...
              </div>
            ) : recetasPendientes.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 p-5 text-center text-sm text-slate-500">No hay recetas pendientes.</div>
            ) : (
              <div className="space-y-3">
                {recetasPendientes.map((receta) => (
                  <button key={receta.id_receta} type="button" onClick={() => verDetalleRecetaPOS(receta)} className={`w-full rounded-2xl border p-4 text-left transition ${recetaSeleccionada?.id_receta === receta.id_receta ? 'border-sky-300 bg-sky-50' : 'border-slate-100 bg-white hover:border-sky-200 hover:bg-slate-50'}`}>
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <p className="font-black text-slate-900">{receta.folio_receta || receta.id_receta}</p>
                      <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-black text-amber-700">{ESTATUS_RECETA[receta.estatus] || receta.estatus}</span>
                    </div>
                    <p className="text-sm font-bold text-slate-700">{receta.nombre_paciente || 'Paciente sin nombre'}</p>
                    <p className="mt-1 text-xs text-slate-500">{formatearFecha(receta.fecha_creacion)}</p>
                    <p className="mt-2 text-xs font-semibold text-slate-500">{receta.total_productos || 0} producto(s) · {receta.total_piezas || 0} pieza(s)</p>
                  </button>
                ))}
              </div>
            )}
          </aside>

          <section className="min-h-0 overflow-y-auto p-4 sm:p-6">
            {!recetaSeleccionada ? (
              <div className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                <ClipboardList size={42} className="mb-3 text-slate-400" />
                <p className="font-black text-slate-800">Selecciona una receta</p>
                <p className="mt-1 text-sm text-slate-500">El detalle aparecerá aquí para elegir productos y lotes.</p>
              </div>
            ) : cargandoDetalleReceta ? (
              <div className="flex min-h-[420px] items-center justify-center rounded-3xl bg-slate-50">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                  <Loader2 size={20} className="animate-spin" />
                  Cargando detalle...
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="rounded-3xl border border-slate-100 bg-gradient-to-r from-sky-50 to-cyan-50 p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Folio</p>
                      <h3 className="mt-1 text-2xl font-black text-slate-900">{recetaSeleccionada.folio_receta || recetaSeleccionada.id_receta}</h3>
                      <p className="mt-2 text-sm text-slate-600">Paciente: <span className="font-bold">{recetaSeleccionada.nombre_paciente || 'N/A'}</span></p>
                    </div>
                    <div className="text-sm text-slate-600 md:text-right">
                      <p className="font-bold">{formatearFecha(recetaSeleccionada.fecha_creacion)}</p>
                      <p>Doctor: {recetaSeleccionada.nombre_doctor || recetaSeleccionada.nombre_doctor_usuario || recetaSeleccionada.nombre_doctor_shaddai || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {recetaSeleccionada.diagnostico && (
                  <div className="rounded-2xl border border-slate-100 bg-white p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-slate-500">Diagnóstico</p>
                    <p className="mt-1 text-sm text-slate-700">{recetaSeleccionada.diagnostico}</p>
                  </div>
                )}

                <div className="rounded-3xl border border-slate-100 bg-white p-5">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-black text-slate-900">Productos de la receta</h3>
                      <p className="text-sm text-slate-500">Cada botón abre la selección de lote, donde puedes surtir completo o parcial.</p>
                    </div>
                    <Package className="text-slate-400" />
                  </div>

                  {detalleReceta.length === 0 ? (
                    <div className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">La receta no tiene productos registrados.</div>
                  ) : (
                    <div className="space-y-3">
                      {detalleReceta.map((producto) => {
                        const estadoSurtido = obtenerEstadoSurtidoDetalle(producto);
                        const disponibilidad = obtenerDisponibilidadDetalleRecetaPOS(
                          producto,
                          inventario
                        );
                        const esMedicamentoLibre = !disponibilidad.surtible;
                        const sinExistencia = disponibilidad.surtible && !disponibilidad.disponible;

                        const cardClass = esMedicamentoLibre
                          ? 'border-violet-200 bg-violet-50'
                          : sinExistencia
                            ? 'border-red-200 bg-red-50'
                            : estadoSurtido.vendidoCompleto
                              ? 'border-emerald-200 bg-emerald-50'
                              : estadoSurtido.vendidoParcial || estadoSurtido.agregadoAlCarrito
                                ? 'border-orange-200 bg-orange-50'
                                : 'border-slate-100 bg-slate-50';

                        const botonClass = esMedicamentoLibre
                          ? 'bg-violet-100 text-violet-700 cursor-not-allowed'
                          : sinExistencia
                            ? 'bg-red-100 text-red-700 cursor-not-allowed'
                            : estadoSurtido.vendidoCompleto
                              ? 'bg-emerald-100 text-emerald-700 cursor-not-allowed'
                              : estadoSurtido.vendidoParcial || estadoSurtido.agregadoAlCarrito
                                ? 'bg-orange-500 text-white hover:bg-orange-600'
                                : 'bg-sky-700 text-white hover:bg-sky-800';

                        return (
                          <div
                            key={producto.id_detalle}
                            className={`rounded-2xl border p-4 transition ${cardClass}`}
                          >
                            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="font-black text-slate-900">
                                    {producto.nombre_producto || producto.nombre || 'Producto'}
                                  </p>

                                  {esMedicamentoLibre && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-3 py-1 text-[11px] font-black text-violet-700">
                                      <FileText size={13} />
                                      Medicamento libre
                                    </span>
                                  )}

                                  {sinExistencia && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-[11px] font-black text-red-700">
                                      <AlertTriangle size={13} />
                                      Sin existencias
                                    </span>
                                  )}

                                  {estadoSurtido.vendidoCompleto && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-black text-emerald-700">
                                      <CheckCircle size={13} />
                                      Vendido
                                    </span>
                                  )}

                                  {estadoSurtido.vendidoParcial && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-[11px] font-black text-orange-700">
                                      <AlertTriangle size={13} />
                                      Parcial
                                    </span>
                                  )}

                                  {estadoSurtido.agregadoAlCarrito && !estadoSurtido.vendidoCompleto && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-3 py-1 text-[11px] font-black text-sky-700">
                                      En carrito
                                    </span>
                                  )}
                                </div>

                                <p className="mt-1 text-xs text-slate-500">
                                  {esMedicamentoLibre
                                    ? 'Medicamento indicado por el médico; no se encuentra registrado en el inventario.'
                                    : `Código: ${producto.codigo_barras || '—'} · Cantidad receta: ${estadoSurtido.cantidadReceta}`}
                                </p>

                                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                  <span className="rounded-full bg-white px-3 py-1 font-bold text-slate-600">
                                    Recetado: {estadoSurtido.cantidadReceta}
                                  </span>

                                  <span className="rounded-full bg-emerald-100 px-3 py-1 font-bold text-emerald-700">
                                    Vendido: {estadoSurtido.cantidadSurtidaBD}
                                  </span>

                                  {estadoSurtido.cantidadEnCarrito > 0 && (
                                    <span className="rounded-full bg-sky-100 px-3 py-1 font-bold text-sky-700">
                                      En carrito: {estadoSurtido.cantidadEnCarrito}
                                    </span>
                                  )}

                                  {!esMedicamentoLibre && (
                                    <span
                                      className={`rounded-full px-3 py-1 font-bold ${estadoSurtido.cantidadPendiente > 0
                                        ? 'bg-orange-100 text-orange-700'
                                        : 'bg-emerald-100 text-emerald-700'
                                        }`}
                                    >
                                      Pendiente: {estadoSurtido.cantidadPendiente}
                                    </span>
                                  )}
                                </div>
                                <div className={`mt-2 rounded-xl px-3 py-2 text-xs font-bold ${esMedicamentoLibre
                                  ? 'bg-violet-100 text-violet-700'
                                  : sinExistencia
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-emerald-100 text-emerald-700'
                                  }`}>
                                  {disponibilidad.mensaje}
                                </div>

                                <div className="mt-2 grid gap-2 text-xs text-slate-600 md:grid-cols-3">
                                  <p><b>Dosis:</b> {producto.dosis || '-'}</p>
                                  <p><b>Frecuencia:</b> {producto.frecuencia || '-'}</p>
                                  <p><b>Duración:</b> {producto.duracion || '-'}</p>
                                </div>
                                {producto.indicaciones && (
                                  <p className="mt-2 rounded-xl bg-white p-3 text-xs text-slate-700"><b>Indicaciones:</b> {producto.indicaciones}</p>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => agregarDetalleRecetaConLote(producto)}
                                disabled={
                                  esMedicamentoLibre ||
                                  sinExistencia ||
                                  estadoSurtido.vendidoCompleto
                                }
                                className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold transition disabled:opacity-80 ${botonClass}`}
                              >
                                {esMedicamentoLibre ? (
                                  <FileText size={18} />
                                ) : sinExistencia || estadoSurtido.vendidoParcial || estadoSurtido.agregadoAlCarrito ? (
                                  <AlertTriangle size={18} />
                                ) : estadoSurtido.vendidoCompleto ? (
                                  <CheckCircle size={18} />
                                ) : (
                                  <Plus size={18} />
                                )}

                                {esMedicamentoLibre
                                  ? 'No surtible'
                                  : sinExistencia
                                    ? 'Sin existencias'
                                    : estadoSurtido.vendidoCompleto
                                      ? 'Ya vendido'
                                      : estadoSurtido.vendidoParcial
                                        ? 'Surtir pendiente'
                                        : estadoSurtido.agregadoAlCarrito
                                          ? 'Agregar otro lote'
                                          : 'Elegir lote y agregar'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => finalizarRecetaDesdeCaja(recetaSeleccionada)}
                    disabled={finalizandoReceta}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {finalizandoReceta ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                    {finalizandoReceta ? 'Finalizando...' : 'Finalizar receta'}
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
