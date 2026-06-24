import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import {
  ReceiptText,
  Search,
  RefreshCw,
  Eye,
  X,
  Store,
  Wallet,
  Package,
  Boxes,
  CreditCard,
  Banknote,
  FileText,
  Undo2,
  Loader2,
} from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import {
  esSuperAdmin,
  obtenerSucursalInicial,
  filtrarSucursalesPorRol,
} from '../../utils/sucursalPermisos';

/*
 * Cambia modoPrueba a false únicamente cuando haya impresora física.
 * Una reimpresión siempre se envía con no_abrir_caja: true.
 */
const CONFIGURACION_IMPRESION_LOCAL = {
  url: 'http://localhost:3030',
  apiKey: 'shaddai-printer-2026',
  modoPrueba: false,
};

const API_IMPRESION_LOCAL = CONFIGURACION_IMPRESION_LOCAL.url;
const PRINTER_KEY = CONFIGURACION_IMPRESION_LOCAL.apiKey;
const MODO_PRUEBA_TICKET = CONFIGURACION_IMPRESION_LOCAL.modoPrueba;

export default function Ventas() {
  const { usuario } = useAuth();

  const puedeCambiarSucursal = esSuperAdmin(usuario);

  const [sucursales, setSucursales] = useState([]);
  const [ventas, setVentas] = useState([]);

  const [detalleVenta, setDetalleVenta] = useState(null);
  const [detalleProductos, setDetalleProductos] = useState([]);
  const [detalleLotes, setDetalleLotes] = useState([]);
  const [detallePagos, setDetallePagos] = useState([]);

  const [ticketPrevisualizado, setTicketPrevisualizado] = useState('');
  const [cargandoTicket, setCargandoTicket] = useState(false);
  const [reimprimiendoTicket, setReimprimiendoTicket] = useState(false);

  const [idSucursal, setIdSucursal] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  const [cargando, setCargando] = useState(false);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  const [modalDetalle, setModalDetalle] = useState(false);
  const [modalTicket, setModalTicket] = useState(false);

  const [modalDevolucion, setModalDevolucion] = useState(false);
  const [ventaDevolucion, setVentaDevolucion] = useState(null);
  const [devolucionProductos, setDevolucionProductos] = useState([]);
  const [motivoDevolucion, setMotivoDevolucion] = useState('');
  const [observacionesDevolucion, setObservacionesDevolucion] = useState('');
  const [guardandoDevolucion, setGuardandoDevolucion] = useState(false);

  const sucursalActual = useMemo(() => {
    return sucursales.find((s) => Number(s.id_sucursal) === Number(idSucursal));
  }, [sucursales, idSucursal]);

  const resumen = useMemo(() => {
    const ventasValidas = ventas.filter((venta) => venta.estado !== 'DEVUELTA');

    const totalVentas = ventasValidas.length;

    const totalImporte = ventasValidas.reduce((acc, venta) => {
      return acc + Number(venta.total || 0);
    }, 0);

    const efectivo = ventasValidas
      .filter((v) => v.metodo_pago === 'EFECTIVO')
      .reduce((acc, venta) => acc + Number(venta.total || 0), 0);

    const tarjeta = ventasValidas
      .filter((v) => v.metodo_pago === 'TARJETA')
      .reduce((acc, venta) => acc + Number(venta.total || 0), 0);

    const transferencia = ventasValidas
      .filter((v) => v.metodo_pago === 'TRANSFERENCIA')
      .reduce((acc, venta) => acc + Number(venta.total || 0), 0);

    const devoluciones = ventas
      .filter((venta) => venta.estado === 'DEVUELTA')
      .reduce((acc, venta) => acc + Number(venta.total || 0), 0);

    return {
      totalVentas,
      totalImporte,
      efectivo,
      tarjeta,
      transferencia,
      devoluciones,
    };
  }, [ventas]);

  const totalEstimadoDevolucion = useMemo(() => {
    if (!ventaDevolucion) return 0;

    const subtotalSeleccionado = devolucionProductos.reduce((acc, producto) => {
      const cantidad = Number(producto.cantidad_devolver || 0);
      const cantidadVendida = Number(producto.cantidad || 0);
      const subtotalProducto = Number(producto.subtotal || 0);

      if (cantidad <= 0 || cantidadVendida <= 0) return acc;

      const precioProporcional = subtotalProducto / cantidadVendida;
      return acc + precioProporcional * cantidad;
    }, 0);

    const subtotalVenta = Number(ventaDevolucion.subtotal || 0);
    const totalVenta = Number(ventaDevolucion.total || 0);
    const factorTotal = subtotalVenta > 0 ? totalVenta / subtotalVenta : 1;

    return Number((subtotalSeleccionado * factorTotal).toFixed(2));
  }, [devolucionProductos, ventaDevolucion]);

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

  const formatoFecha = (fecha) => {
    if (!fecha) return '—';

    return new Date(fecha).toLocaleString('es-MX', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const iconoMetodo = (metodo) => {
    if (metodo === 'EFECTIVO') return <Banknote size={17} />;
    if (metodo === 'TARJETA') return <CreditCard size={17} />;
    return <FileText size={17} />;
  };

  const badgeEstado = (estado) => {
    if (estado === 'COMPLETADA') {
      return 'bg-sky-100 text-sky-700';
    }

    if (estado === 'DEVUELTA') {
      return 'bg-red-100 text-red-700';
    }

    if (estado === 'DEVUELTA_PARCIAL') {
      return 'bg-amber-100 text-amber-700';
    }

    return 'bg-slate-100 text-slate-600';
  };

  const cargarSucursales = async () => {
    try {
      const { data } = await api.get('/sucursales');

      if (data.ok) {
        const activas = (data.sucursales || []).filter((s) => s.activo);
        const sucursalesPermitidas = filtrarSucursalesPorRol(usuario, activas);

        setSucursales(sucursalesPermitidas);

        if (!idSucursal) {
          setIdSucursal(obtenerSucursalInicial(usuario, sucursalesPermitidas));
        }
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar las sucursales.',
      });
    }
  };

  const cargarVentas = async () => {
    try {
      setCargando(true);

      const params = new URLSearchParams();

      if (idSucursal) {
        params.append('sucursal', idSucursal);
      }

      if (fechaInicio) {
        params.append('fecha_inicio', `${fechaInicio} 00:00:00`);
      }

      if (fechaFin) {
        params.append('fecha_fin', `${fechaFin} 23:59:59`);
      }

      const { data } = await api.get(`/ventas?${params.toString()}`);

      if (data.ok) {
        setVentas(data.ventas || []);
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudieron cargar las ventas.',
      });
    } finally {
      setCargando(false);
    }
  };

  const verDetalleVenta = async (idVenta) => {
    try {
      setCargandoDetalle(true);
      setModalDetalle(true);

      const { data } = await api.get(`/ventas/${idVenta}`);

      if (data.ok) {
        setDetalleVenta(data.venta);
        setDetalleProductos(data.detalle || []);
        setDetalleLotes(data.lotes || []);
        setDetallePagos(data.pagos || []);
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudo cargar el detalle de la venta.',
      });

      setModalDetalle(false);
    } finally {
      setCargandoDetalle(false);
    }
  };

  const cerrarDetalle = () => {
    setModalDetalle(false);
    setDetalleVenta(null);
    setDetalleProductos([]);
    setDetalleLotes([]);
    setDetallePagos([]);
    setTicketPrevisualizado('');
  };

  const abrirDevolucionVenta = async (idVenta) => {
    try {
      setCargandoDetalle(true);

      const { data } = await api.get(`/ventas/${idVenta}/devolucion-info`);

      if (data.ok) {
        setVentaDevolucion(data.venta);

        const productosPreparados = (data.productos || []).map((producto) => ({
          ...producto,
          cantidad_devolver: '',
        }));

        setDevolucionProductos(productosPreparados);
        setMotivoDevolucion('');
        setObservacionesDevolucion('');
        setModalDevolucion(true);
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: 'error',
        title: 'No se pudo abrir devolución',
        text:
          error.response?.data?.mensaje ||
          'No se pudo cargar la información de devolución.',
      });
    } finally {
      setCargandoDetalle(false);
    }
  };

  const cerrarModalDevolucion = () => {
    setModalDevolucion(false);
    setVentaDevolucion(null);
    setDevolucionProductos([]);
    setMotivoDevolucion('');
    setObservacionesDevolucion('');
  };

  const cambiarCantidadDevolucion = (idDetalle, valor) => {
    const cantidad = valor === '' ? '' : Math.max(Number(valor || 0), 0);

    setDevolucionProductos((prev) =>
      prev.map((producto) => {
        if (Number(producto.id_detalle) !== Number(idDetalle)) {
          return producto;
        }

        const disponible = Number(producto.cantidad_disponible_devolver || 0);
        const cantidadFinal =
          cantidad === '' ? '' : Math.min(Number(cantidad), disponible);

        return {
          ...producto,
          cantidad_devolver: cantidadFinal,
        };
      })
    );
  };

  const aplicarDevolucion = async () => {
    if (!ventaDevolucion) return;

    const productosSeleccionados = devolucionProductos
      .filter((producto) => Number(producto.cantidad_devolver || 0) > 0)
      .map((producto) => ({
        id_detalle: producto.id_detalle,
        cantidad: Number(producto.cantidad_devolver),
      }));

    if (productosSeleccionados.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin productos',
        text: 'Selecciona al menos un producto para devolver.',
      });
      return;
    }

    if (!motivoDevolucion.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Motivo obligatorio',
        text: 'Ingresa el motivo de la devolución.',
      });
      return;
    }

    const confirmacion = await Swal.fire({
      icon: 'warning',
      title: '¿Aplicar devolución?',
      html: `
        <div style="text-align:left">
          <p><b>Venta:</b> ${ventaDevolucion.folio}</p>
          <p><b>Método original:</b> ${ventaDevolucion.metodo_pago}</p>
          <p><b>Monto estimado:</b> ${formatoMoneda(totalEstimadoDevolucion)}</p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Sí, aplicar devolución',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d97706',
    });

    if (!confirmacion.isConfirmed) return;

    try {
      setGuardandoDevolucion(true);

      const { data } = await api.post(
        `/ventas/${ventaDevolucion.id_venta}/devolver`,
        {
          motivo: motivoDevolucion.trim(),
          observaciones: observacionesDevolucion.trim() || null,
          productos: productosSeleccionados,
        }
      );

      if (data.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Devolución aplicada',
          text: data.mensaje,
          timer: 1500,
          showConfirmButton: false,
        });

        cerrarModalDevolucion();
        await cargarVentas();
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudo aplicar la devolución.',
      });
    } finally {
      setGuardandoDevolucion(false);
    }
  };

  const obtenerConfiguracionTicketParaImpresion = async (idSucursalVenta) => {
    try {
      const { data } = await api.get('/configuracion-ticket', {
        params:
          Number(idSucursalVenta) > 0
            ? { id_sucursal: Number(idSucursalVenta) }
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
        'No se pudo cargar la configuración del ticket para la reimpresión:',
        error
      );

      return null;
    }
  };

  const construirDatosReimpresion = () => {
    if (!detalleVenta) return null;

    const idSucursalVenta = Number(
      detalleVenta.id_sucursal || idSucursal || 0
    );

    const sucursalVenta =
      sucursales.find(
        (sucursal) =>
          Number(sucursal.id_sucursal) === idSucursalVenta
      ) || sucursalActual;

    const productos = detalleProductos.map((item) => {
      const loteRelacionado =
        detalleLotes.find((lote) => {
          const mismoProducto =
            Number(lote.id_producto || 0) === Number(item.id_producto || 0);

          const mismoLote =
            !item.id_lote ||
            !lote.id_lote ||
            Number(lote.id_lote) === Number(item.id_lote);

          return mismoProducto && mismoLote;
        }) || null;

      return {
        id_producto: item.id_producto,
        id_lote: item.id_lote || loteRelacionado?.id_lote || null,
        nombre: item.producto || item.nombre || 'Producto',
        cantidad: Number(item.cantidad || 0),
        precio_unitario: Number(item.precio_unitario || 0),
        precio_venta: Number(item.precio_unitario || 0),
        descuento: Number(item.descuento || 0),
        subtotal: Number(item.subtotal || 0),
        lote: item.lote || loteRelacionado?.lote || null,
        fecha_caducidad:
          item.fecha_caducidad ||
          loteRelacionado?.fecha_caducidad ||
          null,
      };
    });

    const pagos = detallePagos.length > 0
      ? detallePagos.map((pago) => ({
          metodo_pago: pago.metodo_pago,
          monto: Number(pago.monto || 0),
          referencia: pago.referencia || null,
        }))
      : [
          {
            metodo_pago: detalleVenta.metodo_pago || 'EFECTIVO',
            monto: Number(detalleVenta.total || 0),
            referencia: null,
          },
        ];

    return {
      venta: {
        ...detalleVenta,
        id_sucursal: idSucursalVenta || detalleVenta.id_sucursal || null,

        sucursal:
          detalleVenta.sucursal ||
          sucursalVenta?.nombre ||
          sucursalVenta?.nombre_sucursal ||
          '',

        nombre_sucursal:
          detalleVenta.nombre_sucursal ||
          detalleVenta.sucursal ||
          sucursalVenta?.nombre ||
          sucursalVenta?.nombre_sucursal ||
          '',

        direccion_sucursal:
          detalleVenta.direccion_sucursal ||
          sucursalVenta?.direccion ||
          sucursalVenta?.domicilio ||
          '',

        telefono_sucursal:
          detalleVenta.telefono_sucursal ||
          sucursalVenta?.telefono ||
          sucursalVenta?.telefono_contacto ||
          '',

        productos,
        pagos,
      },

      resumen: {
        subtotal: Number(detalleVenta.subtotal || 0),
        subtotal_sin_descuento: Number(
          detalleVenta.subtotal_sin_descuento ||
          detalleVenta.subtotal ||
          0
        ),
        descuento_ofertas: Number(detalleVenta.descuento_ofertas || 0),
        descuento: Number(detalleVenta.descuento || 0),
        impuesto: Number(detalleVenta.impuesto || 0),
        total: Number(detalleVenta.total || 0),
        monto_recibido: Number(detalleVenta.monto_recibido || 0),
        cambio: Number(detalleVenta.cambio || 0),
        pagos,
      },

      /*
       * Esta bandera evita que una reimpresión abra la caja registradora.
       * Requiere el pequeño ajuste indicado en server.js.
       */
      no_abrir_caja: true,
      reimpresion: true,
    };
  };

  const prepararDatosReimpresion = async () => {
    const datosTicket = construirDatosReimpresion();

    if (!datosTicket?.venta) {
      throw new Error('No se encontraron datos suficientes para reimprimir.');
    }

    const configuracionTicket =
      await obtenerConfiguracionTicketParaImpresion(
        datosTicket.venta.id_sucursal
      );

    return {
      ...datosTicket,
      ...(configuracionTicket
        ? { configuracion_ticket: configuracionTicket }
        : {}),
    };
  };

  const llamarApiImpresionLocal = async (endpoint, datosTicket) => {
    const response = await fetch(`${API_IMPRESION_LOCAL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-printer-key': PRINTER_KEY,
      },
      body: JSON.stringify(datosTicket),
    });

    let data = {};

    try {
      data = await response.json();
    } catch (_) {
      data = {};
    }

    if (!response.ok || !data.ok) {
      throw new Error(
        data.message ||
        data.mensaje ||
        'No se pudo procesar la reimpresión del ticket.'
      );
    }

    return data;
  };

  const cargarVistaPreviaTicket = async () => {
    try {
      setCargandoTicket(true);

      const datosTicket = await prepararDatosReimpresion();

      const data = await llamarApiImpresionLocal(
        '/vista-previa-ticket',
        datosTicket
      );

      const ticket = String(data.ticket || '');

      if (!ticket.trim()) {
        throw new Error(
          'La API local no devolvió el contenido de la vista previa.'
        );
      }

      setTicketPrevisualizado(ticket);
      return true;
    } catch (error) {
      console.error('Error al generar vista previa de reimpresión:', error);

      Swal.fire({
        icon: 'error',
        title: 'No se pudo generar el ticket',
        text:
          error.message ||
          'Verifica que la API local de impresión esté abierta.',
      });

      return false;
    } finally {
      setCargandoTicket(false);
    }
  };

  const abrirTicket = async () => {
    if (!detalleVenta) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin venta',
        text: 'Primero carga el detalle de una venta.',
      });
      return;
    }

    setTicketPrevisualizado('');
    setModalTicket(true);

    await cargarVistaPreviaTicket();
  };

  const cerrarTicket = () => {
    if (cargandoTicket || reimprimiendoTicket) return;

    setModalTicket(false);
    setTicketPrevisualizado('');
  };

  const reimprimirTicket = async () => {
    try {
      setReimprimiendoTicket(true);

      /*
       * En modo de pruebas actualiza la misma vista previa.
       * Con modoPrueba: false, envía el ticket a la impresora local.
       */
      if (MODO_PRUEBA_TICKET) {
        await cargarVistaPreviaTicket();
        return;
      }

      const datosTicket = await prepararDatosReimpresion();

      await llamarApiImpresionLocal(
        '/imprimir-ticket',
        datosTicket
      );

      Swal.fire({
        icon: 'success',
        title: 'Ticket reimpreso',
        text: 'El ticket fue enviado a la impresora sin abrir la caja.',
        timer: 1600,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error('Error al reimprimir ticket:', error);

      Swal.fire({
        icon: 'error',
        title: 'Error de reimpresión',
        text:
          error.message ||
          'No se pudo reimprimir el ticket. Verifica que la API local esté abierta.',
      });
    } finally {
      setReimprimiendoTicket(false);
    }
  };

  useEffect(() => {
    if (usuario) {
      cargarSucursales();
    }
  }, [usuario]);

  useEffect(() => {
    if (idSucursal) {
      cargarVentas();
    }
  }, [idSucursal]);

  return (
    <div className="w-full max-w-full overflow-hidden space-y-5 sm:space-y-6 pb-8">
      <section className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
              <ReceiptText size={25} />
            </div>

            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800 break-words">
                Ventas
              </h1>
              <p className="text-sm sm:text-base text-slate-500 leading-relaxed">
                Historial de ventas, detalle de productos, lotes y devoluciones.
              </p>
            </div>
          </div>

          <button
            onClick={cargarVentas}
            disabled={!idSucursal}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition disabled:opacity-50"
          >
            <RefreshCw size={19} className={cargando ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="min-w-0">
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Sucursal
            </label>

            {puedeCambiarSucursal ? (
              <select
                value={idSucursal}
                onChange={(e) => setIdSucursal(e.target.value)}
                className="w-full min-w-0 px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
              >
                <option value="">Selecciona sucursal</option>
                {sucursales.map((sucursal) => (
                  <option
                    key={sucursal.id_sucursal}
                    value={sucursal.id_sucursal}
                  >
                    {sucursal.nombre}
                  </option>
                ))}
              </select>
            ) : (
              <div className="w-full min-w-0 px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 font-semibold truncate">
                {sucursalActual?.nombre ||
                  sucursales[0]?.nombre ||
                  'Sucursal asignada'}
              </div>
            )}
          </div>

          <div className="min-w-0">
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Fecha inicio
            </label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full min-w-0 px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="min-w-0">
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Fecha fin
            </label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="w-full min-w-0 px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={cargarVentas}
              disabled={!idSucursal}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-sky-700 hover:bg-sky-800 text-white font-bold transition disabled:opacity-50"
            >
              <Search size={19} />
              Buscar
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 sm:gap-5">
        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-100 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center">
            <ReceiptText size={24} />
          </div>
          <p className="text-sm text-slate-500 mt-5">Ventas</p>
          <h3 className="text-3xl font-bold text-slate-800 mt-1">
            {resumen.totalVentas}
          </h3>
          <p className="text-sm text-slate-400 mt-2 truncate">
            {sucursalActual?.nombre || 'Sucursal asignada'}
          </p>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-100 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <Wallet size={24} />
          </div>
          <p className="text-sm text-slate-500 mt-5">Total vendido</p>
          <h3 className="text-2xl sm:text-3xl font-bold text-slate-800 mt-1 break-words">
            {formatoMoneda(resumen.totalImporte)}
          </h3>
          <p className="text-sm text-slate-400 mt-2">Importe acumulado</p>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-100 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center">
            <Banknote size={24} />
          </div>
          <p className="text-sm text-slate-500 mt-5">Efectivo</p>
          <h3 className="text-2xl font-bold text-sky-700 mt-1 break-words">
            {formatoMoneda(resumen.efectivo)}
          </h3>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-100 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-700 flex items-center justify-center">
            <CreditCard size={24} />
          </div>
          <p className="text-sm text-slate-500 mt-5">Tarjeta</p>
          <h3 className="text-2xl font-bold text-violet-700 mt-1 break-words">
            {formatoMoneda(resumen.tarjeta)}
          </h3>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-100 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <FileText size={24} />
          </div>
          <p className="text-sm text-slate-500 mt-5">Transferencia</p>
          <h3 className="text-2xl font-bold text-amber-700 mt-1 break-words">
            {formatoMoneda(resumen.transferencia)}
          </h3>
        </div>
      </section>

      <section className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-4 sm:px-6 py-5 border-b border-slate-100">
          <h2 className="text-lg sm:text-xl font-bold text-slate-800">
            Listado de ventas
          </h2>
          <p className="text-sm text-slate-500">
            Consulta ventas, detalle de productos, pagos, lotes y devoluciones.
          </p>
        </div>

        <div className="md:hidden p-4 space-y-3">
          {cargando ? (
            <div className="rounded-2xl bg-slate-50 p-6 text-center text-slate-500 font-semibold">
              Cargando ventas...
            </div>
          ) : ventas.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 p-6 text-center text-slate-500 font-semibold">
              No hay ventas registradas.
            </div>
          ) : (
            ventas.map((venta) => (
              <article
                key={venta.id_venta}
                className="rounded-2xl border border-slate-100 p-4 shadow-sm bg-white"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 break-words">
                      {venta.folio}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      ID #{venta.id_venta}
                    </p>
                  </div>

                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full shrink-0 ${badgeEstado(
                      venta.estado
                    )}`}
                  >
                    {venta.estado}
                  </span>
                </div>

                <div className="mt-4 rounded-2xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Fecha</p>
                  <p className="font-semibold text-slate-700">
                    {formatoFecha(venta.fecha_venta)}
                  </p>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-3">
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Store size={15} />
                      Sucursal / Caja
                    </p>
                    <p className="font-bold text-slate-800 mt-1 break-words">
                      {venta.sucursal}
                    </p>
                    <p className="text-xs text-slate-500 break-words">
                      {venta.caja} · Sesión #{venta.id_sesion}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Usuario</p>
                    <p className="font-semibold text-slate-700 break-words">
                      {venta.usuario || '—'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                    {iconoMetodo(venta.metodo_pago)}
                    {venta.metodo_pago}
                  </span>

                  <span className="inline-flex text-xs font-bold px-3 py-1 rounded-full bg-sky-100 text-sky-700">
                    Total: {formatoMoneda(venta.total)}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Subtotal</p>
                    <p className="font-bold text-slate-700">
                      {formatoMoneda(venta.subtotal)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-red-50 p-3">
                    <p className="text-xs text-red-700">Descuento</p>
                    <p className="font-bold text-red-700">
                      -{formatoMoneda(venta.descuento)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-sky-50 p-3">
                    <p className="text-xs text-sky-700">Total</p>
                    <p className="font-bold text-sky-800">
                      {formatoMoneda(venta.total)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-2">
                  <button
                    onClick={() => verDetalleVenta(venta.id_venta)}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold transition"
                  >
                    <Eye size={18} />
                    Ver detalle
                  </button>

                  {['COMPLETADA', 'DEVUELTA_PARCIAL'].includes(venta.estado) && (
                    <button
                      onClick={() => abrirDevolucionVenta(venta.id_venta)}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-amber-50 text-amber-700 hover:bg-amber-100 font-bold transition"
                    >
                      <Undo2 size={18} />
                      Devolver
                    </button>
                  )}
                </div>
              </article>
            ))
          )}
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[1150px]">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                  Folio
                </th>
                <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                  Fecha
                </th>
                <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                  Sucursal / Caja
                </th>
                <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                  Usuario
                </th>
                <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                  Método
                </th>
                <th className="px-5 py-4 text-right text-xs font-bold text-slate-500 uppercase">
                  Subtotal
                </th>
                <th className="px-5 py-4 text-right text-xs font-bold text-slate-500 uppercase">
                  Descuento
                </th>
                <th className="px-5 py-4 text-right text-xs font-bold text-slate-500 uppercase">
                  Total
                </th>
                <th className="px-5 py-4 text-center text-xs font-bold text-slate-500 uppercase">
                  Estado
                </th>
                <th className="px-5 py-4 text-center text-xs font-bold text-slate-500 uppercase sticky right-0 bg-slate-50 shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.45)] z-10">
                  Acción
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {cargando ? (
                <tr>
                  <td colSpan="10" className="px-5 py-10 text-center text-slate-500">
                    Cargando ventas...
                  </td>
                </tr>
              ) : ventas.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-5 py-10 text-center text-slate-500">
                    No hay ventas registradas.
                  </td>
                </tr>
              ) : (
                ventas.map((venta) => (
                  <tr key={venta.id_venta} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-800">
                        {venta.folio}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        ID #{venta.id_venta}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {formatoFecha(venta.fecha_venta)}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-start gap-2">
                        <Store
                          size={17}
                          className="text-slate-400 mt-0.5 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800">
                            {venta.sucursal}
                          </p>
                          <p className="text-xs text-slate-500">
                            {venta.caja} · Sesión #{venta.id_sesion}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {venta.usuario}
                    </td>

                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                        {iconoMetodo(venta.metodo_pago)}
                        {venta.metodo_pago}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right font-semibold text-slate-600">
                      {formatoMoneda(venta.subtotal)}
                    </td>

                    <td className="px-5 py-4 text-right font-semibold text-red-600">
                      -{formatoMoneda(venta.descuento)}
                    </td>

                    <td className="px-5 py-4 text-right font-bold text-sky-700">
                      {formatoMoneda(venta.total)}
                    </td>

                    <td className="px-5 py-4 text-center">
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full ${badgeEstado(
                          venta.estado
                        )}`}
                      >
                        {venta.estado}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-center sticky right-0 bg-white shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.45)]">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => verDetalleVenta(venta.id_venta)}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold transition"
                        >
                          <Eye size={17} />
                          Ver
                        </button>

                        {['COMPLETADA', 'DEVUELTA_PARCIAL'].includes(venta.estado) && (
                          <button
                            onClick={() => abrirDevolucionVenta(venta.id_venta)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 font-bold transition"
                          >
                            <Undo2 size={17} />
                            Devolver
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {modalDetalle && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center px-3 sm:px-4 py-4 sm:py-8 overflow-y-auto">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={cerrarDetalle}
          />

          <div className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-6xl max-h-[92vh] overflow-hidden my-auto">
            <div className="px-4 sm:px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-slate-800">
                  Detalle de venta
                </h2>
                <p className="text-sm text-slate-500 break-words">
                  {detalleVenta?.folio || 'Cargando...'}
                </p>
              </div>

              <button
                onClick={cerrarDetalle}
                className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto max-h-[80vh]">
              {cargandoDetalle ? (
                <div className="text-center py-10 text-slate-500">
                  Cargando detalle...
                </div>
              ) : detalleVenta ? (
                <div className="space-y-6">
                  <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    <div className="rounded-2xl bg-slate-50 p-4 min-w-0">
                      <p className="text-sm text-slate-500">Fecha</p>
                      <p className="font-bold text-slate-800 mt-1 break-words">
                        {formatoFecha(detalleVenta.fecha_venta)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4 min-w-0">
                      <p className="text-sm text-slate-500">Sucursal</p>
                      <p className="font-bold text-slate-800 mt-1 break-words">
                        {detalleVenta.sucursal}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4 min-w-0">
                      <p className="text-sm text-slate-500">Caja</p>
                      <p className="font-bold text-slate-800 mt-1 break-words">
                        {detalleVenta.caja} · Sesión #{detalleVenta.id_sesion}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4 min-w-0">
                      <p className="text-sm text-slate-500">Cajero</p>
                      <p className="font-bold text-slate-800 mt-1 break-words">
                        {detalleVenta.usuario}
                      </p>
                    </div>
                  </section>

                  <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    <div className="rounded-2xl bg-sky-50 p-4 min-w-0">
                      <p className="text-sm text-sky-700">Total</p>
                      <p className="text-2xl font-bold text-sky-800 mt-1 break-words">
                        {formatoMoneda(detalleVenta.total)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-blue-50 p-4 min-w-0">
                      <p className="text-sm text-blue-700">Método</p>
                      <p className="font-bold text-blue-800 mt-1 break-words">
                        {detalleVenta.metodo_pago}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4 min-w-0">
                      <p className="text-sm text-slate-500">Recibido</p>
                      <p className="font-bold text-slate-800 mt-1 break-words">
                        {formatoMoneda(detalleVenta.monto_recibido)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4 min-w-0">
                      <p className="text-sm text-slate-500">Cambio</p>
                      <p className="font-bold text-slate-800 mt-1 break-words">
                        {formatoMoneda(detalleVenta.cambio)}
                      </p>
                    </div>
                  </section>

                  <section>
                    <div className="flex items-center gap-2 mb-4">
                      <Package className="text-sky-700 shrink-0" size={22} />
                      <h3 className="text-lg font-bold text-slate-800">
                        Productos vendidos
                      </h3>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-slate-100">
                      <table className="w-full min-w-[850px]">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                              Producto
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                              Código
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase">
                              Cantidad
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase">
                              Precio
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase">
                              Descuento
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase">
                              Subtotal
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                          {detalleProductos.length === 0 ? (
                            <tr>
                              <td
                                colSpan="6"
                                className="px-4 py-8 text-center text-slate-500"
                              >
                                No hay productos asociados.
                              </td>
                            </tr>
                          ) : (
                            detalleProductos.map((item) => (
                              <tr key={item.id_detalle}>
                                <td className="px-4 py-3 font-bold text-slate-800">
                                  {item.producto}
                                </td>
                                <td className="px-4 py-3 text-slate-600">
                                  {item.codigo_barras || '—'}
                                </td>
                                <td className="px-4 py-3 text-right font-bold">
                                  {formatoNumero(item.cantidad)}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  {formatoMoneda(item.precio_unitario)}
                                </td>
                                <td className="px-4 py-3 text-right text-red-600">
                                  -{formatoMoneda(item.descuento)}
                                </td>
                                <td className="px-4 py-3 text-right font-bold text-sky-700">
                                  {formatoMoneda(item.subtotal)}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </section>

                  <section>
                    <div className="flex items-center gap-2 mb-4">
                      <Boxes className="text-violet-700 shrink-0" size={22} />
                      <h3 className="text-lg font-bold text-slate-800">
                        Lotes descontados FEFO
                      </h3>
                    </div>

                    {detalleLotes.length === 0 ? (
                      <div className="rounded-2xl bg-slate-50 p-5 text-center text-slate-500">
                        No hay lotes asociados a esta venta.
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-2xl border border-slate-100">
                        <table className="w-full min-w-[900px]">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                                Producto
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                                Lote
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                                Caducidad
                              </th>
                              <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase">
                                Cantidad
                              </th>
                              <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase">
                                Stock anterior
                              </th>
                              <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase">
                                Stock nuevo
                              </th>
                            </tr>
                          </thead>

                          <tbody className="divide-y divide-slate-100">
                            {detalleLotes.map((lote) => (
                              <tr key={lote.id_movimiento}>
                                <td className="px-4 py-3 font-bold text-slate-800">
                                  {lote.producto}
                                </td>
                                <td className="px-4 py-3 text-slate-600">
                                  {lote.lote || '—'}
                                </td>
                                <td className="px-4 py-3 text-slate-600">
                                  {lote.fecha_caducidad
                                    ? new Date(lote.fecha_caducidad).toLocaleDateString('es-MX')
                                    : 'Sin fecha'}
                                </td>
                                <td className="px-4 py-3 text-right font-bold text-red-700">
                                  {formatoNumero(lote.cantidad)}
                                </td>
                                <td className="px-4 py-3 text-right text-slate-600">
                                  {formatoNumero(lote.stock_anterior)}
                                </td>
                                <td className="px-4 py-3 text-right text-sky-700 font-bold">
                                  {formatoNumero(lote.stock_nuevo)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>

                  <section className="flex flex-col sm:flex-row justify-end gap-3">
                    {['COMPLETADA', 'DEVUELTA_PARCIAL'].includes(
                      detalleVenta.estado
                    ) && (
                        <button
                          onClick={() => abrirDevolucionVenta(detalleVenta.id_venta)}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold transition"
                        >
                          <Undo2 size={19} />
                          Devolver
                        </button>
                      )}

                    <button
                      onClick={abrirTicket}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition"
                    >
                      <ReceiptText size={19} />
                      Ver ticket
                    </button>
                  </section>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {modalDevolucion && ventaDevolucion && (
        <div className="fixed inset-0 z-[70] flex items-start sm:items-center justify-center px-3 sm:px-4 py-4 sm:py-8 overflow-y-auto">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={cerrarModalDevolucion}
          />

          <div className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden my-auto">
            <div className="px-4 sm:px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-slate-800">
                  Devolución de venta
                </h2>
                <p className="text-sm text-slate-500 break-words">
                  {ventaDevolucion.folio} · {ventaDevolucion.metodo_pago}
                </p>
              </div>

              <button
                onClick={cerrarModalDevolucion}
                className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto max-h-[72vh] space-y-5">
              <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Total venta</p>
                  <p className="text-xl font-bold text-slate-800">
                    {formatoMoneda(ventaDevolucion.total)}
                  </p>
                </div>

                <div className="rounded-2xl bg-amber-50 p-4">
                  <p className="text-sm text-amber-700">Monto a devolver</p>
                  <p className="text-xl font-bold text-amber-800">
                    {formatoMoneda(totalEstimadoDevolucion)}
                  </p>
                </div>

                <div className="rounded-2xl bg-blue-50 p-4">
                  <p className="text-sm text-blue-700">Método original</p>
                  <p className="text-xl font-bold text-blue-800">
                    {ventaDevolucion.metodo_pago}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Ya devuelto</p>
                  <p className="text-xl font-bold text-slate-800">
                    {formatoMoneda(ventaDevolucion.monto_devuelto)}
                  </p>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-bold text-slate-800 mb-3">
                  Productos disponibles para devolución
                </h3>

                <div className="overflow-x-auto rounded-2xl border border-slate-100">
                  <table className="w-full min-w-[850px]">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                          Producto
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                          Lote
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase">
                          Vendido
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase">
                          Ya devuelto
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase">
                          Disponible
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase">
                          A devolver
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {devolucionProductos.length === 0 ? (
                        <tr>
                          <td
                            colSpan="6"
                            className="px-4 py-8 text-center text-slate-500"
                          >
                            No hay productos disponibles para devolución.
                          </td>
                        </tr>
                      ) : (
                        devolucionProductos.map((producto) => {
                          const disponible = Number(
                            producto.cantidad_disponible_devolver || 0
                          );

                          return (
                            <tr key={producto.id_detalle}>
                              <td className="px-4 py-3">
                                <p className="font-bold text-slate-800">
                                  {producto.producto}
                                </p>
                                <p className="text-xs text-slate-500">
                                  Código: {producto.codigo_barras || '—'}
                                </p>
                              </td>

                              <td className="px-4 py-3 text-slate-600">
                                {producto.lote || 'Sin lote'}
                              </td>

                              <td className="px-4 py-3 text-right font-semibold">
                                {formatoNumero(producto.cantidad)}
                              </td>

                              <td className="px-4 py-3 text-right font-semibold text-amber-700">
                                {formatoNumero(producto.cantidad_devuelta)}
                              </td>

                              <td className="px-4 py-3 text-right font-bold text-sky-700">
                                {formatoNumero(disponible)}
                              </td>

                              <td className="px-4 py-3 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  max={disponible}
                                  step="1"
                                  disabled={disponible <= 0}
                                  value={producto.cantidad_devolver}
                                  onChange={(e) =>
                                    cambiarCantidadDevolucion(
                                      producto.id_detalle,
                                      e.target.value
                                    )
                                  }
                                  className="w-28 px-3 py-2 text-center rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-slate-100"
                                  placeholder="0"
                                />
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Motivo *
                  </label>
                  <textarea
                    rows="3"
                    value={motivoDevolucion}
                    onChange={(e) => setMotivoDevolucion(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                    placeholder="Ej. Cliente devolvió el producto"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Observaciones
                  </label>
                  <textarea
                    rows="3"
                    value={observacionesDevolucion}
                    onChange={(e) => setObservacionesDevolucion(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                    placeholder="Opcional"
                  />
                </div>
              </section>

              {ventaDevolucion.metodo_pago !== 'EFECTIVO' && (
                <div className="rounded-2xl bg-blue-50 border border-blue-100 p-4 text-sm text-blue-800">
                  Esta devolución corresponde a un pago por{' '}
                  {ventaDevolucion.metodo_pago}. Se registrará para control, pero
                  no debe disminuir el efectivo físico de caja.
                </div>
              )}
            </div>

            <div className="px-4 sm:px-6 py-5 border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-3">
              <button
                type="button"
                onClick={cerrarModalDevolucion}
                className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={aplicarDevolucion}
                disabled={guardandoDevolucion || totalEstimadoDevolucion <= 0}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold transition disabled:opacity-60"
              >
                <Undo2 size={19} />
                {guardandoDevolucion ? 'Aplicando...' : 'Aplicar devolución'}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalTicket && detalleVenta && (
        <div className="fixed inset-0 z-[60] flex items-start sm:items-center justify-center px-3 sm:px-4 py-4 sm:py-8 overflow-y-auto">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={cerrarTicket}
          />

          <div className="relative flex h-[calc(100dvh-2rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:h-[92dvh] sm:rounded-3xl my-auto">
            <div className="shrink-0 px-4 py-5 border-b border-slate-100 flex items-start justify-between gap-4 sm:px-6">
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-slate-800">
                  {MODO_PRUEBA_TICKET
                    ? 'Vista previa de reimpresión'
                    : 'Reimpresión de ticket'}
                </h2>

                <p className="text-sm text-slate-500 break-words">
                  {detalleVenta.folio}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  {MODO_PRUEBA_TICKET
                    ? 'Generado por la API local. No se imprime ni abre caja.'
                    : 'Se enviará a la impresora local sin abrir la caja.'}
                </p>
              </div>

              <button
                onClick={cerrarTicket}
                disabled={cargandoTicket || reimprimiendoTicket}
                className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center shrink-0 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <X size={20} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto bg-slate-200 p-4 sm:p-6">
              {cargandoTicket ? (
                <div className="flex min-h-[360px] items-center justify-center">
                  <div className="flex items-center gap-3 rounded-2xl bg-white px-5 py-4 text-sm font-semibold text-slate-600 shadow-sm">
                    <Loader2 className="animate-spin text-sky-700" size={21} />
                    Generando ticket desde la API local...
                  </div>
                </div>
              ) : ticketPrevisualizado ? (
                <pre className="mx-auto w-fit min-w-[290px] max-w-full overflow-x-auto bg-white px-4 py-5 font-mono text-[12px] leading-[1.4] text-slate-900 shadow-lg whitespace-pre">
                  {ticketPrevisualizado}
                </pre>
              ) : (
                <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
                  No se pudo generar la vista previa del ticket.
                </div>
              )}
            </div>

            <div className="shrink-0 px-4 py-5 border-t border-slate-100 flex flex-col justify-end gap-3 sm:flex-row sm:px-6">
              <button
                onClick={cerrarTicket}
                disabled={cargandoTicket || reimprimiendoTicket}
                className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cerrar
              </button>

              <button
                onClick={reimprimirTicket}
                disabled={
                  cargandoTicket ||
                  reimprimiendoTicket ||
                  !ticketPrevisualizado
                }
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-sky-700 hover:bg-sky-800 text-white font-bold transition disabled:cursor-not-allowed disabled:opacity-60"
              >
                {reimprimiendoTicket ? (
                  <Loader2 className="animate-spin" size={19} />
                ) : MODO_PRUEBA_TICKET ? (
                  <RefreshCw size={19} />
                ) : (
                  <ReceiptText size={19} />
                )}

                {reimprimiendoTicket
                  ? MODO_PRUEBA_TICKET
                    ? 'Actualizando...'
                    : 'Reimprimiendo...'
                  : MODO_PRUEBA_TICKET
                    ? 'Actualizar vista previa'
                    : 'Reimprimir ticket'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}