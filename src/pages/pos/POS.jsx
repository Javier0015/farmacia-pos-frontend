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

export default function POS() {
  const { usuario } = useAuth();
  const puedeCambiarSucursal = esSuperAdmin(usuario);

  const [sucursales, setSucursales] = useState([]);
  const [cajas, setCajas] = useState([]);
  const [inventario, setInventario] = useState([]);

  const [idSucursal, setIdSucursal] = useState('');
  const [idCaja, setIdCaja] = useState('');
  const [sesionAbierta, setSesionAbierta] = useState(null);

  const [buscar, setBuscar] = useState('');
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
  const [cobrarImpuesto, setCobrarImpuesto] = useState(true);

  const [cargando, setCargando] = useState(false);
  const [cobrando, setCobrando] = useState(false);
  const [ventaFinalizada, setVentaFinalizada] = useState(null);
  const [configuracionPuntos, setConfiguracionPuntos] = useState(null);

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

  const sucursalActual = useMemo(() => {
    return sucursales.find((s) => Number(s.id_sucursal) === Number(idSucursal));
  }, [sucursales, idSucursal]);

  const cajaActual = useMemo(() => {
    return cajas.find((c) => Number(c.id_caja) === Number(idCaja));
  }, [cajas, idCaja]);

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
      const { data } = await api.get(`/caja/cajas?sucursal=${idSucursal}`);
      if (data.ok) {
        const cajasActivas = (data.cajas || []).filter((c) => c.activo);
        setCajas(cajasActivas);
        if (!idCaja || !cajasActivas.some((c) => Number(c.id_caja) === Number(idCaja))) {
          setIdCaja(cajasActivas[0]?.id_caja || '');
        }
      }
    } catch (error) {
      console.error(error);
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudieron cargar las cajas.' });
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
        params: { estatus: 'PENDIENTE_CAJERO,SURTIDA_PARCIAL' },
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
      setTarjetaPuntos(null);
      setCodigoTarjeta('');
      setMetodoPago('EFECTIVO');
      setMontoRecibido('');
      setPagoMixtoActivo(false);
      setPagosMixtos(PAGOS_MIXTOS_INICIALES);
      cargarCajas();
      cargarInventario();
      cargarRecetasPendientes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idSucursal]);

  useEffect(() => {
    if (idCaja) cargarSesionAbierta();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idCaja]);

  const refrescarTodo = async () => {
    await cargarConfiguracionPuntos();
    await cargarCajas();
    await cargarSesionAbierta();
    await cargarInventario();
    await cargarRecetasPendientes();
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

  const abrirModalLotesParaProducto = async ({ producto, receta = null, detalle = null }) => {
    if (!sesionAbierta) {
      Swal.fire({ icon: 'warning', title: 'Caja no abierta', text: 'Primero abre una caja para poder vender.' });
      return;
    }

    const stockDisponible = Number(producto.stock_actual || detalle?.stock_disponible || 0);
    if (stockDisponible <= 0) {
      Swal.fire({ icon: 'warning', title: 'Sin stock', text: 'Este producto no tiene stock disponible.' });
      return;
    }

    if (!receta) {
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

    const productoInventario = inventario.find(
      (item) => Number(item.id_producto) === Number(detalle.id_producto)
    );

    if (!productoInventario) {
      Swal.fire({
        icon: 'warning',
        title: 'Producto no disponible en esta sucursal',
        text: 'El producto de la receta no se encontró en el inventario de esta sucursal.',
      });
      return;
    }

    const productoParaVenta = {
      ...productoInventario,
      cantidad_receta: Number(detalle.cantidad || 1),
      dosis_receta: detalle.dosis,
      frecuencia_receta: detalle.frecuencia,
      duracion_receta: detalle.duracion,
      indicaciones_receta: detalle.indicaciones,
    };

    await abrirModalLotesParaProducto({
      producto: productoParaVenta,
      receta: recetaSeleccionada,
      detalle,
    });
  };

  const aumentarCantidad = (keyCarrito) => {
    setCarrito((prev) =>
      prev.map((item) => {
        if (item.key_carrito !== keyCarrito) return item;

        if (Number(item.cantidad) >= Number(item.stock_actual)) {
          Swal.fire({
            icon: 'warning',
            title: 'Stock insuficiente',
            text: `Solo hay ${formatoNumero(item.stock_actual)} piezas disponibles en este lote.`,
          });
          return item;
        }

        return { ...item, cantidad: Number(item.cantidad) + 1 };
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

        if (cantidadNueva > Number(item.stock_actual)) {
          Swal.fire({
            icon: 'warning',
            title: 'Stock insuficiente',
            text: `Solo hay ${formatoNumero(item.stock_actual)} piezas disponibles en este lote.`,
          });
          return { ...item, cantidad: Number(item.stock_actual) };
        }

        return { ...item, cantidad: cantidadNueva };
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

    const detallesValidos = detalles.filter((detalle) => Number(detalle.id_producto || 0) > 0);

    if (detallesValidos.length === 0) {
      return 'SURTIDA_PARCIAL';
    }

    const todosLosDetallesSurtidos = detallesValidos.every((detalle) => {
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

    return todosLosDetallesSurtidos ? 'SURTIDA' : 'SURTIDA_PARCIAL';
  };

  const cobrarVenta = async () => {
    if (!sesionAbierta) {
      Swal.fire({ icon: 'warning', title: 'Caja no abierta', text: 'Primero debes abrir una caja.' });
      return;
    }

    if (carrito.length === 0) {
      Swal.fire({ icon: 'warning', title: 'Carrito vacío', text: 'Agrega al menos un producto a la venta.' });
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

    const confirmacion = await Swal.fire({
      icon: 'question',
      title: '¿Cobrar venta?',
      html: `
        <div style="text-align:left">
          ${recetaAntesDeCobrar ? `<p><b>Receta:</b> ${recetaAntesDeCobrar.folio}</p><p><b>Paciente:</b> ${recetaAntesDeCobrar.paciente || 'N/A'}</p><p><b>Estatus al cobrar:</b> ${estatusRecetaFinal === 'SURTIDA' ? 'Surtida completamente' : 'Surtida parcialmente'}</p><hr style="margin:10px 0" />` : ''}
          <p><b>Total:</b> ${formatoMoneda(resumen.total)}</p>
          ${resumen.descuentoOfertas > 0 ? `<p><b>Descuento por ofertas:</b> -${formatoMoneda(resumen.descuentoOfertas)}</p>` : ''}
          <p><b>IVA:</b> ${cobrarImpuesto ? `Aplicado (${formatoMoneda(resumen.impuesto)})` : 'No aplicado'}</p>
          ${detallePagosHtml}
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
        descuento: 0,
        descuento_ofertas: Number(resumen.descuentoOfertas || 0),
        subtotal_sin_descuento: Number(resumen.subtotalSinDescuento || 0),
        impuesto: Number(resumen.impuesto || 0),
        id_receta_shaddai: recetaAntesDeCobrar?.id_receta || null,
        productos: carritoAntesDeCobrar.map((item) => ({
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
            </div>
          `,
          showCancelButton: true,
          confirmButtonText: 'Imprimir ticket',
          cancelButtonText: 'Cerrar',
          confirmButtonColor: '#059669',
          cancelButtonColor: '#64748b',
        });

        if (resultadoAlerta.isConfirmed) imprimirTicketPOS(data);

        setCarrito([]);
        setDetallesRecetasCache({});
        setDetalleReceta([]);
        setRecetaSeleccionada(null);
        setMontoRecibido('');
        setPagoMixtoActivo(false);
        setPagosMixtos(PAGOS_MIXTOS_INICIALES);
        setCobrarImpuesto(true);
        setTarjetaPuntos(null);
        setCodigoTarjeta('');
        setMetodoPago('EFECTIVO');

        await cargarConfiguracionPuntos();
        await cargarInventario();
        await cargarSesionAbierta();
        await cargarRecetasPendientes();
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

  const imprimirTicketPOS = (ventaData = null) => {
    const datosTicket = ventaData || ventaFinalizada;
    if (!datosTicket?.venta) {
      Swal.fire({ icon: 'warning', title: 'Sin venta', text: 'No hay una venta reciente para imprimir.' });
      return;
    }

    const venta = datosTicket.venta;
    const resumenVenta = datosTicket.resumen;
    const productosVenta = venta.productos || [];

    const pagosTicket = Array.isArray(venta.pagos)
      ? venta.pagos
      : Array.isArray(datosTicket.pagos)
        ? datosTicket.pagos
        : [];

    const metodoPagoTicket = venta.metodo_pago === 'PUNTOS' ? 'PAGAR CON PUNTOS' : venta.metodo_pago || metodoPago || '—';
    const ventana = window.open('', '_blank', 'width=420,height=650');

    ventana.document.write(`
      <html>
        <head>
          <title>Ticket ${venta.folio}</title>
          <style>
            * { box-sizing: border-box; }
            body { margin: 0; padding: 12px; font-family: Arial, sans-serif; color: #111827; background: #ffffff; }
            .ticket { width: 280px; margin: 0 auto; }
            .center { text-align: center; }
            .title { font-size: 17px; font-weight: bold; margin-bottom: 4px; }
            .small { font-size: 11px; }
            .line { border-top: 1px dashed #111827; margin: 10px 0; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
            th, td { padding: 3px 0; vertical-align: top; }
            th { text-align: left; border-bottom: 1px dashed #111827; }
            .right { text-align: right; }
            .bold { font-weight: bold; }
            .total { font-size: 14px; font-weight: bold; }
            .muted { color: #4b5563; }
            .offer { color: #047857; font-weight: bold; }
            @page { margin: 4mm; }
            @media print { body { margin: 0; padding: 0; } }
          </style>
        </head>
        <body>
          <div class="ticket">
            <div class="center">
              <div class="title">FARMACIA SHADDAI</div>
              <div class="small">${venta.sucursal || sucursalActual?.nombre || 'Sucursal'}</div>
              <div class="small">Punto de venta</div>
            </div>
            <div class="line"></div>
            <table>
              <tbody>
                <tr><td class="bold">Folio:</td><td class="right">${venta.folio}</td></tr>
                <tr><td class="bold">Caja:</td><td class="right">${venta.caja || cajaActual?.nombre || idCaja || '—'}</td></tr>
                <tr><td class="bold">Cajero:</td><td class="right">${venta.usuario || usuario?.nombre || usuario?.usuario || '—'}</td></tr>
                <tr><td class="bold">Fecha:</td><td class="right">${new Date(venta.fecha_venta || Date.now()).toLocaleString('es-MX')}</td></tr>
              </tbody>
            </table>
            <div class="line"></div>
            <table>
              <thead><tr><th>Producto</th><th class="right">Cant.</th><th class="right">Importe</th></tr></thead>
              <tbody>
                ${productosVenta
        .map((item) => {
          const precioOriginal = Number(item.precio_original || item.precio_unitario || 0);
          const precioUnitario = Number(item.precio_unitario || 0);
          const porcentajeDescuento = Number(item.porcentaje_descuento || 0);
          const tieneOfertaTicket = porcentajeDescuento > 0;
          return `
                      <tr>
                        <td>
                          <div class="bold">${item.nombre || item.producto || 'Producto'}</div>
                          ${item.lote ? `<div class="small muted">Lote: ${item.lote}${item.fecha_caducidad ? ` · Cad: ${new Date(item.fecha_caducidad).toLocaleDateString('es-MX')}` : ''}</div>` : ''}
                          <div class="small muted">${Number(item.cantidad || 0).toLocaleString('es-MX')} x ${precioUnitario.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</div>
                          ${tieneOfertaTicket ? `<div class="small offer">Oferta -${porcentajeDescuento.toLocaleString('es-MX')}%</div><div class="small muted">Antes: ${precioOriginal.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</div>` : ''}
                        </td>
                        <td class="right">${Number(item.cantidad || 0).toLocaleString('es-MX')}</td>
                        <td class="right">${Number(item.subtotal || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</td>
                      </tr>
                    `;
        })
        .join('')}
              </tbody>
            </table>
            <div class="line"></div>
            <table>
              <tbody>
                <tr><td>Subtotal:</td><td class="right">${Number(resumenVenta?.subtotal || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</td></tr>
                <tr><td>Impuesto:</td><td class="right">${Number(resumenVenta?.impuesto || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</td></tr>
                <tr><td class="total">TOTAL:</td><td class="right total">${Number(resumenVenta?.total || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</td></tr>
              </tbody>
            </table>
            <div class="line"></div>
            <table>
              <tbody>
                <tr><td>Método:</td><td class="right">${metodoPagoTicket}</td></tr>
                ${pagosTicket.length > 0
                  ? pagosTicket.map((pago) => `<tr><td>${pago.metodo_pago}:</td><td class="right">${Number(pago.monto || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</td></tr>`).join('')
                  : ''
                }
                <tr><td>Recibido:</td><td class="right">${Number(resumenVenta?.monto_recibido || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</td></tr>
                <tr><td>Cambio:</td><td class="right">${Number(resumenVenta?.cambio || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</td></tr>
              </tbody>
            </table>
            <div class="line"></div>
            <div class="center small">Gracias por su compra</div>
            <div class="center small">Este ticket no es comprobante fiscal</div>
          </div>
          <script>
            window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; };
          </script>
        </body>
      </html>
    `);

    ventana.document.close();
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
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-black text-white">2</span>
              <p className="text-sm font-black text-slate-800">Caja</p>
            </div>
            <select
              value={idCaja}
              onChange={(e) => setIdCaja(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="">Selecciona caja</option>
              {cajas.map((caja) => (
                <option key={caja.id_caja} value={caja.id_caja}>
                  {caja.nombre}
                </option>
              ))}
            </select>
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
                  onChange={(e) => setBuscar(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') cargarInventario(); }}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm font-semibold text-slate-700 outline-none transition focus:bg-white focus:ring-2 focus:ring-sky-500"
                  placeholder="Ej. paracetamol, código, laboratorio..."
                />
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
                onClick={() => cargarInventario()}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-700 px-5 py-3 text-sm font-black text-white transition hover:bg-sky-800"
              >
                <Search size={18} />
                Buscar
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
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
            formatoFechaCorta={formatoFechaCorta}
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
          carrito={carrito}
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
  formatoFechaCorta,
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
                  formatoFechaCorta={formatoFechaCorta}
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
  formatoFechaCorta,
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

      <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="text-[11px] font-bold uppercase text-slate-400">Código</p>
          <p className="mt-1 truncate font-black text-slate-800">{item.codigo_barras || '—'}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3 text-center">
          <p className="text-[11px] font-bold uppercase text-slate-400">Stock</p>
          <p className="mt-1 font-black text-slate-900">{formatoNumero(item.stock_actual)}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3 text-right">
          <p className="text-[11px] font-bold uppercase text-slate-400">Caducidad</p>
          <p className={`mt-1 truncate font-black ${item.proxima_caducidad ? 'text-red-600' : 'text-slate-700'}`}>
            {item.proxima_caducidad ? formatoFechaCorta(item.proxima_caducidad) : '—'}
          </p>
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
}) {
  return (
    <aside className="min-w-0 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm xl:sticky xl:top-5 xl:max-h-[calc(100vh-2.5rem)] xl:overflow-y-auto">
      <div className="border-b border-slate-100 bg-slate-900 px-4 py-5 text-white sm:px-5">
        <p className="text-xs font-black uppercase tracking-wide text-sky-200">Paso 3</p>
        <div className="mt-1 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">Cobrar venta</h2>
            <p className="text-sm text-slate-300">{carrito.length} producto(s) en carrito</p>
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
            <p className="text-sm font-black text-slate-900">Productos agregados</p>
            <p className="text-xs font-semibold text-slate-500">Revisa cantidades y lotes antes de cobrar.</p>
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
            <p className="mt-1 text-sm text-slate-500">Agrega productos desde la lista de la izquierda.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {carrito.map((item) => (
              <div key={item.key_carrito} className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-words text-sm font-black text-slate-900">{item.nombre}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {item.lote ? `Lote ${item.lote}` : 'Sin lote'} · Cad. {formatoFechaCorta(item.fecha_caducidad)}
                    </p>
                    <p className="mt-1 text-xs font-bold text-sky-700">
                      {formatoMoneda(item.precio_venta)} c/u
                    </p>
                  </div>
                  <button
                    onClick={() => quitarDelCarrito(item.key_carrito)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 transition hover:bg-red-100"
                    title="Quitar producto"
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

                {(item.controlado || item.requiere_receta || item.tiene_oferta) && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
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
              >
                <X size={16} />
              </button>
            </div>
            {puntosClienteActivo && ((!pagoMixtoActivo && metodoPago !== 'PUNTOS') || (pagoMixtoActivo && resumenPagosMixtos.puntos <= 0)) && (
              <p className="mt-3 rounded-2xl bg-white px-3 py-2 text-xs font-bold text-emerald-700">
                Esta venta generaría {formatoNumero(resumen.puntosEstimados)} puntos ({formatoNumero(porcentajeClientePuntos)}%).
              </p>
            )}
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
                    className={`flex items-center justify-center gap-2 rounded-2xl px-3 py-3 text-xs font-black transition ${
                      activo
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
  const cantidadSugerida = Number(contextoReceta?.detalle?.cantidad || 1);
  const [cantidad, setCantidad] = useState(cantidadSugerida || 1);

  useEffect(() => {
    setCantidad(cantidadSugerida || 1);
  }, [cantidadSugerida]);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="relative z-[81] max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Seleccionar lote</h2>
            <p className="text-sm text-slate-500">
              {contextoReceta ? 'Producto tomado desde receta Doctor Shaddai.' : 'Elige el lote que deseas descontar.'}
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
            {contextoReceta?.receta && (
              <div className="mt-3 rounded-xl bg-sky-50 p-3 text-xs text-sky-800">
                <p><b>Receta:</b> {contextoReceta.receta.folio_receta || contextoReceta.receta.id_receta}</p>
                <p><b>Paciente:</b> {contextoReceta.receta.nombre_paciente || 'N/A'}</p>
                <p><b>Cantidad indicada:</b> {contextoReceta.detalle?.cantidad || 1}</p>
              </div>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">Cantidad a agregar</label>
            <input type="number" min="1" value={cantidad} onChange={(e) => setCantidad(e.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-sky-500" />
          </div>

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
                const cantidadNumerica = Math.max(Number(cantidad || 1), 1);
                const sinStock = stock < cantidadNumerica;

                return (
                  <div key={lote.id_lote || lote.lote} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-black text-slate-900">Lote: {lote.lote || 'Sin lote'}</p>
                        <p className="mt-1 text-sm text-slate-500">Caducidad: {formatoFechaCorta(lote.fecha_caducidad)}</p>
                        <p className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-bold ${sinStock ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          Stock disponible: {formatoNumero(stock)}
                        </p>
                      </div>

                      <button type="button" onClick={() => onAgregar(producto, lote, cantidadNumerica)} disabled={sinStock} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:bg-red-100 disabled:text-red-600">
                        <Plus size={18} />
                        {sinStock ? 'Stock insuficiente' : 'Agregar este lote'}
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

    const cantidadEnCarrito = obtenerCantidadEnCarrito(detalle);

    const cantidadTotalTomada = cantidadSurtidaBD + cantidadEnCarrito;

    const cantidadPendiente = Math.max(cantidadReceta - cantidadTotalTomada, 0);

    const vendidoCompleto = cantidadReceta > 0 && cantidadTotalTomada >= cantidadReceta;
    const vendidoParcial = cantidadTotalTomada > 0 && cantidadTotalTomada < cantidadReceta;
    const agregadoAlCarrito = cantidadEnCarrito > 0;

    return {
      cantidadReceta,
      cantidadSurtidaBD,
      cantidadEnCarrito,
      cantidadTotalTomada,
      cantidadPendiente,
      vendidoCompleto,
      vendidoParcial,
      agregadoAlCarrito,
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
                      <p className="text-sm text-slate-500">Cada botón abre la pantalla de selección de lotes del POS.</p>
                    </div>
                    <Package className="text-slate-400" />
                  </div>

                  {detalleReceta.length === 0 ? (
                    <div className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">La receta no tiene productos registrados.</div>
                  ) : (
                    <div className="space-y-3">
                      {detalleReceta.map((producto) => {
                        const estadoSurtido = obtenerEstadoSurtidoDetalle(producto);

                        const cardClass = estadoSurtido.vendidoCompleto
                          ? 'border-emerald-200 bg-emerald-50'
                          : estadoSurtido.vendidoParcial || estadoSurtido.agregadoAlCarrito
                            ? 'border-orange-200 bg-orange-50'
                            : 'border-slate-100 bg-slate-50';

                        const botonClass = estadoSurtido.vendidoCompleto
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
                                  Código: {producto.codigo_barras || '—'} · Cantidad receta: {estadoSurtido.cantidadReceta}
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

                                  <span
                                    className={`rounded-full px-3 py-1 font-bold ${estadoSurtido.cantidadPendiente > 0
                                      ? 'bg-orange-100 text-orange-700'
                                      : 'bg-emerald-100 text-emerald-700'
                                      }`}
                                  >
                                    Pendiente: {estadoSurtido.cantidadPendiente}
                                  </span>
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
                                disabled={estadoSurtido.vendidoCompleto}
                                className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold transition disabled:opacity-80 ${botonClass}`}
                              >
                                {estadoSurtido.vendidoCompleto ? (
                                  <CheckCircle size={18} />
                                ) : estadoSurtido.vendidoParcial || estadoSurtido.agregadoAlCarrito ? (
                                  <AlertTriangle size={18} />
                                ) : (
                                  <Plus size={18} />
                                )}

                                {estadoSurtido.vendidoCompleto
                                  ? 'Ya vendido'
                                  : estadoSurtido.vendidoParcial
                                    ? 'Completar pendiente'
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
                  <button type="button" onClick={onClose} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200">Cerrar</button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
