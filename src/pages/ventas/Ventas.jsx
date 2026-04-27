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
} from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import {
  esSuperAdmin,
  obtenerSucursalInicial,
  filtrarSucursalesPorRol,
} from '../../utils/sucursalPermisos';

export default function Ventas() {
  const { usuario } = useAuth();

  const puedeCambiarSucursal = esSuperAdmin(usuario);

  const [sucursales, setSucursales] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [detalleVenta, setDetalleVenta] = useState(null);
  const [detalleProductos, setDetalleProductos] = useState([]);
  const [detalleLotes, setDetalleLotes] = useState([]);

  const [idSucursal, setIdSucursal] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  const [cargando, setCargando] = useState(false);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [modalDetalle, setModalDetalle] = useState(false);
  const [modalTicket, setModalTicket] = useState(false);

  const sucursalActual = useMemo(() => {
    return sucursales.find((s) => Number(s.id_sucursal) === Number(idSucursal));
  }, [sucursales, idSucursal]);

  const resumen = useMemo(() => {
    const totalVentas = ventas.length;

    const totalImporte = ventas.reduce((acc, venta) => {
      return acc + Number(venta.total || 0);
    }, 0);

    const efectivo = ventas
      .filter((v) => v.metodo_pago === 'EFECTIVO')
      .reduce((acc, venta) => acc + Number(venta.total || 0), 0);

    const tarjeta = ventas
      .filter((v) => v.metodo_pago === 'TARJETA')
      .reduce((acc, venta) => acc + Number(venta.total || 0), 0);

    const transferencia = ventas
      .filter((v) => v.metodo_pago === 'TRANSFERENCIA')
      .reduce((acc, venta) => acc + Number(venta.total || 0), 0);

    return {
      totalVentas,
      totalImporte,
      efectivo,
      tarjeta,
      transferencia,
    };
  }, [ventas]);

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
  };

  const abrirTicket = () => {
    if (!detalleVenta) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin venta',
        text: 'Primero carga el detalle de una venta.',
      });
      return;
    }

    setModalTicket(true);
  };

  const imprimirTicket = () => {
    const contenido = document.getElementById('ticket-print-area');

    if (!contenido) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se encontró el contenido del ticket.',
      });
      return;
    }

    const ventana = window.open('', '_blank', 'width=420,height=650');

    ventana.document.write(`
      <html>
        <head>
          <title>Ticket ${detalleVenta?.folio || ''}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 12px;
              color: #111827;
            }

            .ticket {
              width: 280px;
              margin: 0 auto;
            }

            .center {
              text-align: center;
            }

            .title {
              font-size: 18px;
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

            @media print {
              body {
                margin: 0;
              }
            }
          </style>
        </head>
        <body>
          ${contenido.innerHTML}
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

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <ReceiptText size={25} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                Ventas
              </h1>
              <p className="text-slate-500">
                Historial de ventas, detalle de productos y lotes descontados.
              </p>
            </div>
          </div>

          <button
            onClick={cargarVentas}
            disabled={!idSucursal}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition disabled:opacity-50"
          >
            <RefreshCw size={19} className={cargando ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>

        <div className="mt-6 grid md:grid-cols-4 gap-4">
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
                  <option
                    key={sucursal.id_sucursal}
                    value={sucursal.id_sucursal}
                  >
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
              Fecha inicio
            </label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Fecha fin
            </label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={cargarVentas}
              disabled={!idSucursal}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold transition disabled:opacity-50"
            >
              <Search size={19} />
              Buscar
            </button>
          </div>
        </div>
      </section>

      <section className="grid sm:grid-cols-2 xl:grid-cols-5 gap-5">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <ReceiptText size={24} />
          </div>
          <p className="text-sm text-slate-500 mt-5">Ventas</p>
          <h3 className="text-3xl font-bold text-slate-800 mt-1">
            {resumen.totalVentas}
          </h3>
          <p className="text-sm text-slate-400 mt-2">
            {sucursalActual?.nombre || 'Sucursal asignada'}
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <Wallet size={24} />
          </div>
          <p className="text-sm text-slate-500 mt-5">Total vendido</p>
          <h3 className="text-3xl font-bold text-slate-800 mt-1">
            {formatoMoneda(resumen.totalImporte)}
          </h3>
          <p className="text-sm text-slate-400 mt-2">
            Importe acumulado
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Banknote size={24} />
          </div>
          <p className="text-sm text-slate-500 mt-5">Efectivo</p>
          <h3 className="text-2xl font-bold text-emerald-700 mt-1">
            {formatoMoneda(resumen.efectivo)}
          </h3>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-700 flex items-center justify-center">
            <CreditCard size={24} />
          </div>
          <p className="text-sm text-slate-500 mt-5">Tarjeta</p>
          <h3 className="text-2xl font-bold text-violet-700 mt-1">
            {formatoMoneda(resumen.tarjeta)}
          </h3>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <FileText size={24} />
          </div>
          <p className="text-sm text-slate-500 mt-5">Transferencia</p>
          <h3 className="text-2xl font-bold text-amber-700 mt-1">
            {formatoMoneda(resumen.transferencia)}
          </h3>
        </div>
      </section>

      <section className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
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
                <th className="px-5 py-4 text-center text-xs font-bold text-slate-500 uppercase">
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
                        <Store size={17} className="text-slate-400 mt-0.5" />
                        <div>
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

                    <td className="px-5 py-4 text-right font-bold text-emerald-700">
                      {formatoMoneda(venta.total)}
                    </td>

                    <td className="px-5 py-4 text-center">
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full ${
                          venta.estado === 'COMPLETADA'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {venta.estado}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => verDetalleVenta(venta.id_venta)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold transition"
                      >
                        <Eye size={17} />
                        Ver
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {modalDetalle && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[92vh] overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Detalle de venta
                </h2>
                <p className="text-sm text-slate-500">
                  {detalleVenta?.folio || 'Cargando...'}
                </p>
              </div>

              <button
                onClick={cerrarDetalle}
                className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[80vh]">
              {cargandoDetalle ? (
                <div className="text-center py-10 text-slate-500">
                  Cargando detalle...
                </div>
              ) : detalleVenta ? (
                <div className="space-y-6">
                  <section className="grid md:grid-cols-4 gap-4">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-sm text-slate-500">Fecha</p>
                      <p className="font-bold text-slate-800 mt-1">
                        {formatoFecha(detalleVenta.fecha_venta)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-sm text-slate-500">Sucursal</p>
                      <p className="font-bold text-slate-800 mt-1">
                        {detalleVenta.sucursal}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-sm text-slate-500">Caja</p>
                      <p className="font-bold text-slate-800 mt-1">
                        {detalleVenta.caja} · Sesión #{detalleVenta.id_sesion}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-sm text-slate-500">Cajero</p>
                      <p className="font-bold text-slate-800 mt-1">
                        {detalleVenta.usuario}
                      </p>
                    </div>
                  </section>

                  <section className="grid md:grid-cols-4 gap-4">
                    <div className="rounded-2xl bg-emerald-50 p-4">
                      <p className="text-sm text-emerald-700">Total</p>
                      <p className="text-2xl font-bold text-emerald-800 mt-1">
                        {formatoMoneda(detalleVenta.total)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-blue-50 p-4">
                      <p className="text-sm text-blue-700">Método</p>
                      <p className="font-bold text-blue-800 mt-1">
                        {detalleVenta.metodo_pago}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-sm text-slate-500">Recibido</p>
                      <p className="font-bold text-slate-800 mt-1">
                        {formatoMoneda(detalleVenta.monto_recibido)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-sm text-slate-500">Cambio</p>
                      <p className="font-bold text-slate-800 mt-1">
                        {formatoMoneda(detalleVenta.cambio)}
                      </p>
                    </div>
                  </section>

                  <section>
                    <div className="flex items-center gap-2 mb-4">
                      <Package className="text-emerald-700" size={22} />
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
                          {detalleProductos.map((item) => (
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
                              <td className="px-4 py-3 text-right font-bold text-emerald-700">
                                {formatoMoneda(item.subtotal)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>

                  <section>
                    <div className="flex items-center gap-2 mb-4">
                      <Boxes className="text-violet-700" size={22} />
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
                                    ? new Date(
                                        lote.fecha_caducidad
                                      ).toLocaleDateString('es-MX')
                                    : 'Sin fecha'}
                                </td>
                                <td className="px-4 py-3 text-right font-bold text-red-700">
                                  {formatoNumero(lote.cantidad)}
                                </td>
                                <td className="px-4 py-3 text-right text-slate-600">
                                  {formatoNumero(lote.stock_anterior)}
                                </td>
                                <td className="px-4 py-3 text-right text-emerald-700 font-bold">
                                  {formatoNumero(lote.stock_nuevo)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>

                  <section className="flex justify-end">
                    <button
                      onClick={abrirTicket}
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition"
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

      {modalTicket && detalleVenta && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Ticket de venta
                </h2>
                <p className="text-sm text-slate-500">
                  {detalleVenta.folio}
                </p>
              </div>

              <button
                onClick={() => setModalTicket(false)}
                className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[75vh] bg-slate-100">
              <div className="mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-5 max-w-sm">
                <div id="ticket-print-area">
                  <div className="ticket">
                    <div className="center">
                      <div className="title">
                        FARMACIA SHADDAI
                      </div>
                      <div className="small">
                        {detalleVenta.sucursal}
                      </div>
                      <div className="small">
                        Punto de venta multi-sucursal
                      </div>
                    </div>

                    <div className="line"></div>

                    <table>
                      <tbody>
                        <tr>
                          <td className="bold">Folio:</td>
                          <td className="right">{detalleVenta.folio}</td>
                        </tr>
                        <tr>
                          <td className="bold">Fecha:</td>
                          <td className="right">{formatoFecha(detalleVenta.fecha_venta)}</td>
                        </tr>
                        <tr>
                          <td className="bold">Caja:</td>
                          <td className="right">{detalleVenta.caja}</td>
                        </tr>
                        <tr>
                          <td className="bold">Cajero:</td>
                          <td className="right">{detalleVenta.usuario}</td>
                        </tr>
                      </tbody>
                    </table>

                    <div className="line"></div>

                    <table>
                      <thead>
                        <tr>
                          <th>Producto</th>
                          <th className="right">Cant.</th>
                          <th className="right">Importe</th>
                        </tr>
                      </thead>

                      <tbody>
                        {detalleProductos.map((item) => (
                          <tr key={item.id_detalle}>
                            <td>
                              <div className="bold">
                                {item.producto}
                              </div>
                              <div className="small">
                                {formatoNumero(item.cantidad)} x{' '}
                                {formatoMoneda(item.precio_unitario)}
                              </div>
                            </td>
                            <td className="right">
                              {formatoNumero(item.cantidad)}
                            </td>
                            <td className="right">
                              {formatoMoneda(item.subtotal)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className="line"></div>

                    <table>
                      <tbody>
                        <tr>
                          <td>Subtotal:</td>
                          <td className="right">{formatoMoneda(detalleVenta.subtotal)}</td>
                        </tr>
                        <tr>
                          <td>Descuento:</td>
                          <td className="right">-{formatoMoneda(detalleVenta.descuento)}</td>
                        </tr>
                        <tr>
                          <td>Impuesto:</td>
                          <td className="right">{formatoMoneda(detalleVenta.impuesto)}</td>
                        </tr>
                        <tr>
                          <td className="total">TOTAL:</td>
                          <td className="right total">{formatoMoneda(detalleVenta.total)}</td>
                        </tr>
                      </tbody>
                    </table>

                    <div className="line"></div>

                    <table>
                      <tbody>
                        <tr>
                          <td>Método:</td>
                          <td className="right">{detalleVenta.metodo_pago}</td>
                        </tr>
                        <tr>
                          <td>Recibido:</td>
                          <td className="right">{formatoMoneda(detalleVenta.monto_recibido)}</td>
                        </tr>
                        <tr>
                          <td>Cambio:</td>
                          <td className="right">{formatoMoneda(detalleVenta.cambio)}</td>
                        </tr>
                      </tbody>
                    </table>

                    <div className="line"></div>

                    {detalleLotes.length > 0 && (
                      <>
                        <div className="small bold">
                          Lotes descontados:
                        </div>

                        <table>
                          <tbody>
                            {detalleLotes.map((lote) => (
                              <tr key={lote.id_movimiento}>
                                <td className="small">
                                  {lote.lote || 'SIN LOTE'}
                                </td>
                                <td className="right small">
                                  {formatoNumero(lote.cantidad)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        <div className="line"></div>
                      </>
                    )}

                    <div className="center small">
                      Gracias por su compra
                    </div>
                    <div className="center small">
                      Este ticket no es comprobante fiscal
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-5 border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-3">
              <button
                onClick={() => setModalTicket(false)}
                className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
              >
                Cerrar
              </button>

              <button
                onClick={imprimirTicket}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold transition"
              >
                <ReceiptText size={19} />
                Imprimir ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}