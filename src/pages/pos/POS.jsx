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
  CheckCircle,
  Barcode,
  UserCheck,
  Coins,
  Printer,
} from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import {
  esSuperAdmin,
  obtenerSucursalInicial,
  filtrarSucursalesPorRol,
} from '../../utils/sucursalPermisos';

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

  const [codigoTarjeta, setCodigoTarjeta] = useState('');
  const [tarjetaPuntos, setTarjetaPuntos] = useState(null);
  const [buscandoTarjeta, setBuscandoTarjeta] = useState(false);

  const [metodoPago, setMetodoPago] = useState('EFECTIVO');
  const [montoRecibido, setMontoRecibido] = useState('');
  const [descuentoVenta, setDescuentoVenta] = useState('');
  const [impuestoVenta, setImpuestoVenta] = useState('');

  const [cargando, setCargando] = useState(false);
  const [cobrando, setCobrando] = useState(false);
  const [ventaFinalizada, setVentaFinalizada] = useState(null);

  const sucursalActual = useMemo(() => {
    return sucursales.find((s) => Number(s.id_sucursal) === Number(idSucursal));
  }, [sucursales, idSucursal]);

  const cajaActual = useMemo(() => {
    return cajas.find((c) => Number(c.id_caja) === Number(idCaja));
  }, [cajas, idCaja]);

  const resumen = useMemo(() => {
    const subtotal = carrito.reduce((acc, item) => {
      return acc + Number(item.cantidad) * Number(item.precio_venta);
    }, 0);

    const puntosEstimados = tarjetaPuntos
      ? carrito.reduce((acc, item) => {
        return (
          acc +
          Number(item.cantidad || 0) *
          Number(item.puntos_por_unidad || 0)
        );
      }, 0)
      : 0;

    const descuento = Number(descuentoVenta || 0);
    const impuesto = Number(impuestoVenta || 0);
    const total = Math.max(subtotal - descuento + impuesto, 0);

    const recibido = Number(montoRecibido || 0);
    const cambio = metodoPago === 'EFECTIVO' ? recibido - total : 0;

    return {
      subtotal,
      descuento,
      impuesto,
      total,
      recibido,
      cambio,
      puntosEstimados,
    };
  }, [
    carrito,
    descuentoVenta,
    impuestoVenta,
    montoRecibido,
    metodoPago,
    tarjetaPuntos,
  ]);

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

  const cargarCajas = async () => {
    if (!idSucursal) return;

    try {
      const { data } = await api.get(`/caja/cajas?sucursal=${idSucursal}`);

      if (data.ok) {
        const cajasActivas = (data.cajas || []).filter((c) => c.activo);
        setCajas(cajasActivas);

        if (
          !idCaja ||
          !cajasActivas.some((c) => Number(c.id_caja) === Number(idCaja))
        ) {
          setIdCaja(cajasActivas[0]?.id_caja || '');
        }
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar las cajas.',
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

      if (data.ok) {
        setSesionAbierta(data.sesion_abierta);
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo consultar la sesión de caja.',
      });
    }
  };

  const cargarInventario = async () => {
    if (!idSucursal) return;

    try {
      setCargando(true);

      const params = new URLSearchParams();
      params.append('sucursal', idSucursal);

      if (buscar.trim()) {
        params.append('buscar', buscar.trim());
      }

      const { data } = await api.get(`/inventario?${params.toString()}`);

      if (data.ok) {
        const productosConStock = (data.inventario || []).filter(
          (item) => Number(item.stock_actual) > 0
        );

        setInventario(productosConStock);
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo cargar el inventario.',
      });
    } finally {
      setCargando(false);
    }
  };

  const buscarTarjetaPuntos = async () => {
    const codigo = codigoTarjeta.trim();

    if (!codigo) {
      Swal.fire({
        icon: 'warning',
        title: 'Código requerido',
        text: 'Escanea la tarjeta o escribe el teléfono del cliente.',
      });
      return;
    }

    try {
      setBuscandoTarjeta(true);

      const { data } = await api.get(
        `/tarjetas-puntos/codigo/${encodeURIComponent(codigo)}`
      );

      if (data.ok) {
        if (!data.tarjeta.activo) {
          Swal.fire({
            icon: 'warning',
            title: 'Tarjeta inactiva',
            text: 'Esta tarjeta no puede acumular puntos.',
          });
          return;
        }

        setTarjetaPuntos(data.tarjeta);
        setCodigoTarjeta(data.tarjeta.codigo_barras);

        Swal.fire({
          icon: 'success',
          title: 'Tarjeta vinculada',
          text: `${data.tarjeta.nombre_cliente} · ${formatoNumero(
            data.tarjeta.puntos_actuales
          )} puntos actuales`,
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
        text:
          error.response?.data?.mensaje ||
          'No se encontró una tarjeta con ese código o teléfono.',
      });
    } finally {
      setBuscandoTarjeta(false);
    }
  };

  const quitarTarjetaPuntos = () => {
    setTarjetaPuntos(null);
    setCodigoTarjeta('');
  };

  useEffect(() => {
    if (usuario) {
      cargarSucursales();
    }
  }, [usuario]);

  useEffect(() => {
    if (idSucursal) {
      setIdCaja('');
      setSesionAbierta(null);
      setCarrito([]);
      setTarjetaPuntos(null);
      setCodigoTarjeta('');
      cargarCajas();
      cargarInventario();
    }
  }, [idSucursal]);

  useEffect(() => {
    if (idCaja) {
      cargarSesionAbierta();
    }
  }, [idCaja]);

  const refrescarTodo = async () => {
    await cargarCajas();
    await cargarSesionAbierta();
    await cargarInventario();
  };

  const agregarAlCarrito = (producto) => {
    if (!sesionAbierta) {
      Swal.fire({
        icon: 'warning',
        title: 'Caja no abierta',
        text: 'Primero abre una caja para poder vender.',
      });
      return;
    }

    const stockDisponible = Number(producto.stock_actual || 0);

    if (stockDisponible <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin stock',
        text: 'Este producto no tiene stock disponible.',
      });
      return;
    }

    const existe = carrito.find(
      (item) => Number(item.id_producto) === Number(producto.id_producto)
    );

    if (existe) {
      aumentarCantidad(producto.id_producto);
      return;
    }

    setCarrito([
      ...carrito,
      {
        id_producto: producto.id_producto,
        nombre: producto.producto,
        codigo_barras: producto.codigo_barras,
        categoria: producto.categoria,
        laboratorio: producto.laboratorio,
        presentacion: producto.presentacion,
        precio_venta: Number(producto.precio_venta || 0),
        puntos_por_unidad: Number(producto.puntos_por_unidad || 0),
        stock_actual: stockDisponible,
        cantidad: 1,
      },
    ]);
  };

  const aumentarCantidad = (idProducto) => {
    setCarrito((prev) =>
      prev.map((item) => {
        if (Number(item.id_producto) !== Number(idProducto)) {
          return item;
        }

        if (Number(item.cantidad) >= Number(item.stock_actual)) {
          Swal.fire({
            icon: 'warning',
            title: 'Stock insuficiente',
            text: `Solo hay ${item.stock_actual} piezas disponibles.`,
          });

          return item;
        }

        return {
          ...item,
          cantidad: Number(item.cantidad) + 1,
        };
      })
    );
  };

  const disminuirCantidad = (idProducto) => {
    setCarrito((prev) =>
      prev
        .map((item) => {
          if (Number(item.id_producto) !== Number(idProducto)) {
            return item;
          }

          return {
            ...item,
            cantidad: Number(item.cantidad) - 1,
          };
        })
        .filter((item) => Number(item.cantidad) > 0)
    );
  };

  const cambiarCantidadManual = (idProducto, valor) => {
    const cantidadNueva = Number(valor);

    if (cantidadNueva < 0) return;

    setCarrito((prev) =>
      prev.map((item) => {
        if (Number(item.id_producto) !== Number(idProducto)) {
          return item;
        }

        if (cantidadNueva > Number(item.stock_actual)) {
          Swal.fire({
            icon: 'warning',
            title: 'Stock insuficiente',
            text: `Solo hay ${item.stock_actual} piezas disponibles.`,
          });

          return {
            ...item,
            cantidad: Number(item.stock_actual),
          };
        }

        return {
          ...item,
          cantidad: cantidadNueva,
        };
      })
    );
  };

  const quitarDelCarrito = (idProducto) => {
    setCarrito((prev) =>
      prev.filter((item) => Number(item.id_producto) !== Number(idProducto))
    );
  };

  const limpiarVenta = () => {
    setCarrito([]);
    setMetodoPago('EFECTIVO');
    setMontoRecibido('');
    setDescuentoVenta('');
    setImpuestoVenta('');
    setVentaFinalizada(null);
    setTarjetaPuntos(null);
    setCodigoTarjeta('');
  };

  const cobrarVenta = async () => {
    if (!sesionAbierta) {
      Swal.fire({
        icon: 'warning',
        title: 'Caja no abierta',
        text: 'Primero debes abrir una caja.',
      });
      return;
    }

    if (carrito.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Carrito vacío',
        text: 'Agrega al menos un producto a la venta.',
      });
      return;
    }

    if (resumen.total <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Total inválido',
        text: 'El total de la venta debe ser mayor a cero.',
      });
      return;
    }

    if (metodoPago === 'EFECTIVO' && resumen.recibido < resumen.total) {
      Swal.fire({
        icon: 'warning',
        title: 'Monto insuficiente',
        text: 'El monto recibido no cubre el total de la venta.',
      });
      return;
    }

    const confirmacion = await Swal.fire({
      icon: 'question',
      title: '¿Cobrar venta?',
      html: `
        <div style="text-align:left">
          <p><b>Total:</b> ${formatoMoneda(resumen.total)}</p>
          <p><b>Método:</b> ${metodoPago}</p>
          ${tarjetaPuntos
          ? `<p><b>Tarjeta:</b> ${tarjetaPuntos.nombre_cliente}</p>
                 <p><b>Puntos a ganar:</b> ${formatoNumero(
            resumen.puntosEstimados
          )}</p>`
          : `<p><b>Tarjeta:</b> Sin tarjeta de puntos</p>`
        }
          ${metodoPago === 'EFECTIVO'
          ? `<p><b>Recibido:</b> ${formatoMoneda(resumen.recibido)}</p>
                 <p><b>Cambio:</b> ${formatoMoneda(resumen.cambio)}</p>`
          : ''
        }
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

      const payload = {
        id_sucursal: Number(idSucursal),
        id_caja: Number(idCaja),
        id_sesion: Number(sesionAbierta.id_sesion),
        id_tarjeta_puntos: tarjetaPuntos
          ? Number(tarjetaPuntos.id_tarjeta)
          : null,
        metodo_pago: metodoPago,
        monto_recibido:
          metodoPago === 'EFECTIVO'
            ? Number(montoRecibido || 0)
            : resumen.total,
        descuento: Number(descuentoVenta || 0),
        impuesto: Number(impuestoVenta || 0),
        productos: carrito.map((item) => ({
          id_producto: Number(item.id_producto),
          cantidad: Number(item.cantidad),
          precio_unitario: Number(item.precio_venta),
        })),
      };

      const { data } = await api.post('/ventas', payload);

      if (data.ok) {
        setVentaFinalizada(data);

        const resultadoAlerta = await Swal.fire({
          icon: 'success',
          title: 'Venta registrada',
          html: `
      <div style="text-align:left">
      <p><b>Folio:</b> ${data.venta.folio}</p>
      <p><b>Total:</b> ${formatoMoneda(data.resumen?.total || 0)}</p>
      <p><b>Cambio:</b> ${formatoMoneda(data.resumen?.cambio || 0)}</p>
      ${data.resumen?.tarjeta_puntos
              ? `
            <hr style="margin:10px 0" />
            <p><b>Cliente:</b> ${data.resumen.tarjeta_puntos.nombre_cliente}</p>
            <p><b>Puntos ganados:</b> ${formatoNumero(data.resumen.puntos_ganados)}</p>
            <p><b>Nuevo saldo:</b> ${formatoNumero(data.resumen.tarjeta_puntos.puntos_actuales)}</p>
          `
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

        if (resultadoAlerta.isConfirmed) {
          imprimirTicketPOS(data);
        }
        setCarrito([]);
        setMontoRecibido('');
        setDescuentoVenta('');
        setImpuestoVenta('');
        setTarjetaPuntos(null);
        setCodigoTarjeta('');

        await cargarInventario();
        await cargarSesionAbierta();
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: 'error',
        title: 'Error al vender',
        text:
          error.response?.data?.mensaje ||
          'No se pudo registrar la venta.',
      });
    } finally {
      setCobrando(false);
    }
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

  const imprimirTicketPOS = (ventaData = null) => {
    const datosTicket = ventaData || ventaFinalizada;

    if (!datosTicket?.venta) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin venta',
        text: 'No hay una venta reciente para imprimir.',
      });
      return;
    }

    const venta = datosTicket.venta;
    const resumenVenta = datosTicket.resumen;
    const productosVenta = venta.productos || [];

    const metodoPagoTicket = venta.metodo_pago || metodoPago || '—';

    const ventana = window.open('', '_blank', 'width=420,height=650');

    ventana.document.write(`
    <html>
      <head>
        <title>Ticket ${venta.folio}</title>
        <style>
          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            padding: 12px;
            font-family: Arial, sans-serif;
            color: #111827;
            background: #ffffff;
          }

          .ticket {
            width: 280px;
            margin: 0 auto;
          }

          .center {
            text-align: center;
          }

          .title {
            font-size: 17px;
            font-weight: bold;
            margin-bottom: 4px;
          }

          .small {
            font-size: 11px;
          }

          .line {
            border-top: 1px dashed #111827;
            margin: 10px 0;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
          }

          th, td {
            padding: 3px 0;
            vertical-align: top;
          }

          th {
            text-align: left;
            border-bottom: 1px dashed #111827;
          }

          .right {
            text-align: right;
          }

          .bold {
            font-weight: bold;
          }

          .total {
            font-size: 14px;
            font-weight: bold;
          }

          .muted {
            color: #4b5563;
          }

          @page {
            margin: 4mm;
          }

          @media print {
            body {
              margin: 0;
              padding: 0;
            }
          }
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
              <tr>
                <td class="bold">Folio:</td>
                <td class="right">${venta.folio}</td>
              </tr>
              <tr>
                <td class="bold">Caja:</td>
                <td class="right">${venta.caja || cajaActual?.nombre || idCaja || '—'}</td>
              </tr>
              <tr>
                <td class="bold">Cajero:</td>
                <td class="right">${venta.usuario || usuario?.nombre || usuario?.usuario || '—'}</td>
              </tr>
              <tr>
                <td class="bold">Fecha:</td>
                <td class="right">${new Date(venta.fecha_venta || Date.now()).toLocaleString('es-MX')}</td>
              </tr>
            </tbody>
          </table>

          <div class="line"></div>

          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th class="right">Cant.</th>
                <th class="right">Importe</th>
              </tr>
            </thead>

            <tbody>
              ${productosVenta
        .map(
          (item) => `
                    <tr>
                      <td>
                        <div class="bold">${item.nombre || item.producto || 'Producto'}</div>
                        <div class="small muted">
                          ${Number(item.cantidad || 0).toLocaleString('es-MX')} x 
                          ${Number(item.precio_unitario || 0).toLocaleString('es-MX', {
            style: 'currency',
            currency: 'MXN',
          })}
                        </div>
                      </td>
                      <td class="right">${Number(item.cantidad || 0).toLocaleString('es-MX')}</td>
                      <td class="right">
                        ${Number(item.subtotal || 0).toLocaleString('es-MX', {
            style: 'currency',
            currency: 'MXN',
          })}
                      </td>
                    </tr>
                  `
        )
        .join('')}
            </tbody>
          </table>

          <div class="line"></div>

          <table>
            <tbody>
              <tr>
                <td>Subtotal:</td>
                <td class="right">
                  ${Number(resumenVenta?.subtotal || 0).toLocaleString('es-MX', {
          style: 'currency',
          currency: 'MXN',
        })}
                </td>
              </tr>
              <tr>
                <td>Descuento:</td>
                <td class="right">
                  -${Number(resumenVenta?.descuento || 0).toLocaleString('es-MX', {
          style: 'currency',
          currency: 'MXN',
        })}
                </td>
              </tr>
              <tr>
                <td>Impuesto:</td>
                <td class="right">
                  ${Number(resumenVenta?.impuesto || 0).toLocaleString('es-MX', {
          style: 'currency',
          currency: 'MXN',
        })}
                </td>
              </tr>
              <tr>
                <td class="total">TOTAL:</td>
                <td class="right total">
                  ${Number(resumenVenta?.total || 0).toLocaleString('es-MX', {
          style: 'currency',
          currency: 'MXN',
        })}
                </td>
              </tr>
            </tbody>
          </table>

          <div class="line"></div>

          <table>
            <tbody>
              <tr>
                <td>Método:</td>
                <td class="right">${metodoPagoTicket}</td>
              </tr>
              <tr>
                <td>Recibido:</td>
                <td class="right">
                  ${Number(resumenVenta?.monto_recibido || 0).toLocaleString('es-MX', {
          style: 'currency',
          currency: 'MXN',
        })}
                </td>
              </tr>
              <tr>
                <td>Cambio:</td>
                <td class="right">
                  ${Number(resumenVenta?.cambio || 0).toLocaleString('es-MX', {
          style: 'currency',
          currency: 'MXN',
        })}
                </td>
              </tr>
            </tbody>
          </table>

          ${resumenVenta?.tarjeta_puntos
        ? `
                <div class="line"></div>
                <table>
                  <tbody>
                    <tr>
                      <td class="bold">Cliente:</td>
                      <td class="right">${resumenVenta.tarjeta_puntos.nombre_cliente}</td>
                    </tr>
                    <tr>
                      <td>Puntos ganados:</td>
                      <td class="right">${Number(resumenVenta.puntos_ganados || 0).toLocaleString('es-MX')}</td>
                    </tr>
                    <tr>
                      <td>Saldo puntos:</td>
                      <td class="right">${Number(resumenVenta.tarjeta_puntos.puntos_actuales || 0).toLocaleString('es-MX')}</td>
                    </tr>
                  </tbody>
                </table>
              `
        : ''
      }

          <div class="line"></div>

          <div class="center small">
            Gracias por su compra
          </div>
          <div class="center small">
            Este ticket no es comprobante fiscal
          </div>
        </div>

        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          };
        </script>
      </body>
    </html>
  `);

    ventana.document.close();
  };

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <ShoppingCart size={25} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                Punto de venta
              </h1>
              <p className="text-slate-500">
                Busca productos, arma el carrito y registra ventas reales.
              </p>
            </div>
          </div>

          <button
            onClick={refrescarTodo}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition"
          >
            <RefreshCw size={19} className={cargando ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>

        <div className="mt-6 grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Sucursal
            </label>

            {puedeCambiarSucursal ? (
              <select
                value={idSucursal}
                onChange={(e) => setIdSucursal(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Selecciona sucursal</option>
                {sucursales.map((sucursal) => (
                  <option key={sucursal.id_sucursal} value={sucursal.id_sucursal}>
                    {sucursal.nombre}
                  </option>
                ))}
              </select>
            ) : (
              <div className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 font-semibold">
                {sucursalActual?.nombre ||
                  sucursales[0]?.nombre ||
                  'Sucursal asignada'}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Caja
            </label>
            <select
              value={idCaja}
              onChange={(e) => setIdCaja(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Selecciona caja</option>
              {cajas.map((caja) => (
                <option key={caja.id_caja} value={caja.id_caja}>
                  {caja.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Estado caja
            </label>
            <div
              className={`px-4 py-3 rounded-2xl border font-bold ${sesionAbierta
                ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                : 'bg-red-50 border-red-100 text-red-700'
                }`}
            >
              {sesionAbierta
                ? `ABIERTA · Sesión #${sesionAbierta.id_sesion}`
                : 'CERRADA'}
            </div>
          </div>
        </div>
      </section>

      {!sesionAbierta && (
        <section className="bg-amber-50 border border-amber-100 rounded-3xl p-5 text-amber-800 flex items-center gap-3">
          <Wallet size={24} />
          <div>
            <p className="font-bold">Caja no abierta</p>
            <p className="text-sm">
              Para vender, primero abre caja en el módulo Caja.
            </p>
          </div>
        </section>
      )}

      <section className="grid xl:grid-cols-[1.4fr_1fr] gap-6">
        <div className="space-y-5">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search
                  className="absolute left-4 top-3.5 text-slate-400"
                  size={20}
                />
                <input
                  value={buscar}
                  onChange={(e) => setBuscar(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') cargarInventario();
                  }}
                  className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Buscar producto, código, laboratorio..."
                />
              </div>

              <button
                onClick={cargarInventario}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold transition"
              >
                <Search size={19} />
                Buscar
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Productos disponibles
                </h2>
                <p className="text-sm text-slate-500">
                  {sucursalActual?.nombre || 'Sin sucursal seleccionada'}
                </p>
              </div>

              <Package className="text-slate-400" />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px]">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                      Producto
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                      Código
                    </th>
                    <th className="px-5 py-4 text-right text-xs font-bold text-slate-500 uppercase">
                      Stock
                    </th>
                    <th className="px-5 py-4 text-right text-xs font-bold text-slate-500 uppercase">
                      Precio
                    </th>
                    <th className="px-5 py-4 text-right text-xs font-bold text-slate-500 uppercase">
                      Puntos
                    </th>
                    <th className="px-5 py-4 text-center text-xs font-bold text-slate-500 uppercase">
                      Acción
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {cargando ? (
                    <tr>
                      <td colSpan="6" className="px-5 py-10 text-center text-slate-500">
                        Cargando productos...
                      </td>
                    </tr>
                  ) : inventario.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-5 py-10 text-center text-slate-500">
                        No hay productos con stock disponible.
                      </td>
                    </tr>
                  ) : (
                    inventario.map((item) => (
                      <tr key={item.id_inventario} className="hover:bg-slate-50">
                        <td className="px-5 py-4">
                          <p className="font-bold text-slate-800">
                            {item.producto}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {item.laboratorio || 'Sin laboratorio'} ·{' '}
                            {item.presentacion || 'Sin presentación'}
                          </p>
                          {item.proxima_caducidad && (
                            <p className="text-xs text-red-600 mt-1 font-semibold">
                              Cad. próxima:{' '}
                              {new Date(item.proxima_caducidad).toLocaleDateString(
                                'es-MX'
                              )}
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {item.codigo_barras || '—'}
                        </td>

                        <td className="px-5 py-4 text-right font-bold text-slate-800">
                          {formatoNumero(item.stock_actual)}
                        </td>

                        <td className="px-5 py-4 text-right font-bold text-emerald-700">
                          {formatoMoneda(item.precio_venta)}
                        </td>

                        <td className="px-5 py-4 text-right font-bold text-amber-700">
                          {formatoNumero(item.puntos_por_unidad)} pts
                        </td>

                        <td className="px-5 py-4 text-center">
                          <button
                            onClick={() => agregarAlCarrito(item)}
                            disabled={!sesionAbierta}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold transition disabled:opacity-50"
                          >
                            <Plus size={17} />
                            Agregar
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden h-fit sticky top-6">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                Carrito
              </h2>
              <p className="text-sm text-slate-500">
                {carrito.length} producto(s)
              </p>
            </div>

            <ShoppingCart className="text-slate-400" />
          </div>

          <div className="p-5 border-b border-slate-100 space-y-3">
            <label className="block text-sm font-bold text-slate-700">
              Tarjeta de puntos
            </label>

            {!tarjetaPuntos ? (
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Barcode
                    className="absolute left-4 top-3.5 text-slate-400"
                    size={19}
                  />
                  <input
                    value={codigoTarjeta}
                    onChange={(e) => setCodigoTarjeta(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') buscarTarjetaPuntos();
                    }}
                    className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Escanear tarjeta o teléfono..."
                  />
                </div>

                <button
                  onClick={buscarTarjetaPuntos}
                  disabled={buscandoTarjeta}
                  className="px-4 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold transition disabled:opacity-60"
                >
                  {buscandoTarjeta ? (
                    <RefreshCw size={19} className="animate-spin" />
                  ) : (
                    <Search size={19} />
                  )}
                </button>
              </div>
            ) : (
              <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-emerald-800 font-bold">
                      <UserCheck size={19} />
                      {tarjetaPuntos.nombre_cliente}
                    </div>

                    <p className="text-xs text-emerald-700 mt-1">
                      {tarjetaPuntos.codigo_barras}
                    </p>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <div className="rounded-xl bg-white/70 p-2">
                        <p className="text-emerald-700 text-xs">
                          Puntos actuales
                        </p>
                        <p className="font-bold text-emerald-900">
                          {formatoNumero(tarjetaPuntos.puntos_actuales)}
                        </p>
                      </div>

                      <div className="rounded-xl bg-white/70 p-2">
                        <p className="text-amber-700 text-xs">
                          Ganará en venta
                        </p>
                        <p className="font-bold text-amber-700">
                          {formatoNumero(resumen.puntosEstimados)} pts
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={quitarTarjetaPuntos}
                    className="w-9 h-9 rounded-xl bg-white text-red-600 hover:bg-red-50 flex items-center justify-center transition"
                    title="Quitar tarjeta"
                  >
                    <X size={17} />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="p-5 space-y-3 max-h-[360px] overflow-y-auto">
            {carrito.length === 0 ? (
              <div className="text-center py-10 text-slate-500">
                No hay productos en el carrito.
              </div>
            ) : (
              carrito.map((item) => (
                <div
                  key={item.id_producto}
                  className="rounded-2xl border border-slate-100 p-4"
                >
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="font-bold text-slate-800">
                        {item.nombre}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Stock disponible: {formatoNumero(item.stock_actual)}
                      </p>
                      <p className="text-sm font-bold text-emerald-700 mt-1">
                        {formatoMoneda(item.precio_venta)}
                      </p>
                      <p className="text-xs font-bold text-amber-700 mt-1">
                        {formatoNumero(item.puntos_por_unidad)} pts por unidad
                      </p>
                    </div>

                    <button
                      onClick={() => quitarDelCarrito(item.id_producto)}
                      className="w-9 h-9 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 flex items-center justify-center transition"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => disminuirCantidad(item.id_producto)}
                        className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center"
                      >
                        <Minus size={16} />
                      </button>

                      <input
                        type="number"
                        step="1"
                        value={item.cantidad}
                        onChange={(e) =>
                          cambiarCantidadManual(item.id_producto, e.target.value)
                        }
                        className="w-20 text-center px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />

                      <button
                        onClick={() => aumentarCantidad(item.id_producto)}
                        className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center"
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-slate-800">
                        {formatoMoneda(
                          Number(item.cantidad) * Number(item.precio_venta)
                        )}
                      </p>
                      {tarjetaPuntos && (
                        <p className="text-xs font-bold text-amber-700">
                          +{formatoNumero(
                            Number(item.cantidad) *
                            Number(item.puntos_por_unidad || 0)
                          )}{' '}
                          pts
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-5 border-t border-slate-100 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Descuento
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={descuentoVenta}
                  onChange={(e) => setDescuentoVenta(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Impuesto
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={impuestoVenta}
                  onChange={(e) => setImpuestoVenta(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Método de pago
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'EFECTIVO', label: 'Efectivo', icon: Banknote },
                  { value: 'TARJETA', label: 'Tarjeta', icon: CreditCard },
                  { value: 'TRANSFERENCIA', label: 'Transf.', icon: ReceiptText },
                ].map((metodo) => {
                  const Icon = metodo.icon;

                  return (
                    <button
                      key={metodo.value}
                      type="button"
                      onClick={() => {
                        setMetodoPago(metodo.value);
                        if (metodo.value !== 'EFECTIVO') {
                          setMontoRecibido('');
                        }
                      }}
                      className={`rounded-2xl px-3 py-3 font-bold text-sm flex flex-col items-center gap-1 border transition ${metodoPago === metodo.value
                        ? 'bg-emerald-700 text-white border-emerald-700'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                      <Icon size={18} />
                      {metodo.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {metodoPago === 'EFECTIVO' && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Monto recibido
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={montoRecibido}
                  onChange={(e) => setMontoRecibido(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="0.00"
                />
              </div>
            )}

            <div className="rounded-3xl bg-slate-50 p-5 space-y-3">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-bold">{formatoMoneda(resumen.subtotal)}</span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Descuento</span>
                <span className="font-bold">-{formatoMoneda(resumen.descuento)}</span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Impuesto</span>
                <span className="font-bold">{formatoMoneda(resumen.impuesto)}</span>
              </div>

              {tarjetaPuntos && (
                <div className="flex justify-between text-amber-700">
                  <span className="inline-flex items-center gap-1 font-bold">
                    <Coins size={16} />
                    Puntos
                  </span>
                  <span className="font-bold">
                    +{formatoNumero(resumen.puntosEstimados)} pts
                  </span>
                </div>
              )}

              <div className="border-t border-slate-200 pt-3 flex justify-between">
                <span className="text-lg font-bold text-slate-800">Total</span>
                <span className="text-2xl font-bold text-emerald-700">
                  {formatoMoneda(resumen.total)}
                </span>
              </div>

              {metodoPago === 'EFECTIVO' && (
                <div className="flex justify-between">
                  <span className="font-bold text-slate-700">Cambio</span>
                  <span
                    className={`text-xl font-bold ${resumen.cambio < 0 ? 'text-red-700' : 'text-blue-700'
                      }`}
                  >
                    {formatoMoneda(resumen.cambio)}
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={limpiarVenta}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
              >
                <X size={19} />
                Limpiar
              </button>

              <button
                onClick={cobrarVenta}
                disabled={!sesionAbierta || carrito.length === 0 || cobrando}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-lg shadow-emerald-900/20 transition disabled:opacity-50"
              >
                <CheckCircle size={19} />
                {cobrando ? 'Cobrando...' : 'Cobrar'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {ventaFinalizada && (
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-emerald-700">
                Venta registrada correctamente
              </h2>
              <p className="text-slate-500 mt-1">
                Folio:{' '}
                <span className="font-bold">
                  {ventaFinalizada.venta.folio}
                </span>
              </p>

              {ventaFinalizada.resumen?.tarjeta_puntos && (
                <div className="mt-3 rounded-2xl bg-amber-50 border border-amber-100 p-4 text-amber-800">
                  <p className="font-bold">
                    Tarjeta: {ventaFinalizada.resumen.tarjeta_puntos.nombre_cliente}
                  </p>
                  <p className="text-sm">
                    Puntos ganados:{' '}
                    <span className="font-bold">
                      {formatoNumero(ventaFinalizada.resumen.puntos_ganados)}
                    </span>
                  </p>
                  <p className="text-sm">
                    Nuevo saldo:{' '}
                    <span className="font-bold">
                      {formatoNumero(
                        ventaFinalizada.resumen.tarjeta_puntos.puntos_actuales
                      )}
                    </span>
                  </p>
                </div>
              )}
            </div>

            <div className="text-right space-y-3">
              <div>
                <p className="text-sm text-slate-500">Total</p>
                <p className="text-3xl font-bold text-slate-800">
                  {formatoMoneda(ventaFinalizada.resumen.total)}
                </p>
                <p className="text-sm text-slate-500">
                  Cambio: {formatoMoneda(ventaFinalizada.resumen.cambio)}
                </p>
              </div>

              <button
                onClick={imprimirTicketPOS}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition"
              >
                <Printer size={19} />
                Imprimir ticket
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}