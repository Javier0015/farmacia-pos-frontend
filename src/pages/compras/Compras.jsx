import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import {
  ClipboardList,
  Plus,
  Search,
  RefreshCw,
  Eye,
  X,
  Save,
  Trash2,
  Package,
  Truck,
  Store,
  Wallet,
  FileText,
  Calendar,
} from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import {
  esSuperAdmin,
  obtenerSucursalInicial,
  filtrarSucursalesPorRol,
} from '../../utils/sucursalPermisos';

const productoInicial = {
  id_producto: '',
  cantidad: '',
  precio_compra: '',
  descuento: '',
  lote: '',
  fecha_caducidad: '',
  observaciones: '',
};

const compraInicial = {
  id_sucursal: '',
  id_proveedor: '',
  id_sesion: '',
  metodo_pago: 'PENDIENTE',
  monto_pagado: '',
  impuesto: '',
  descuento: '',
  observaciones: '',
};

export default function Compras() {
  const { usuario } = useAuth();

  const puedeCambiarSucursal = esSuperAdmin(usuario);

  const [sucursales, setSucursales] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [productos, setProductos] = useState([]);
  const [cajas, setCajas] = useState([]);
  const [compras, setCompras] = useState([]);

  const [formCompra, setFormCompra] = useState(compraInicial);
  const [items, setItems] = useState([]);

  const [idSucursalFiltro, setIdSucursalFiltro] = useState('');
  const [idProveedorFiltro, setIdProveedorFiltro] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [modalCompra, setModalCompra] = useState(false);
  const [modalDetalle, setModalDetalle] = useState(false);

  const [detalleCompra, setDetalleCompra] = useState(null);
  const [detalleProductos, setDetalleProductos] = useState([]);
  const [detallePagos, setDetallePagos] = useState([]);

  const sucursalActual = useMemo(() => {
    return sucursales.find(
      (s) => Number(s.id_sucursal) === Number(formCompra.id_sucursal)
    );
  }, [sucursales, formCompra.id_sucursal]);

  const sucursalFiltroActual = useMemo(() => {
    return sucursales.find(
      (s) => Number(s.id_sucursal) === Number(idSucursalFiltro)
    );
  }, [sucursales, idSucursalFiltro]);

  const resumenCompra = useMemo(() => {
    const subtotal = items.reduce((acc, item) => {
      const cantidad = Number(item.cantidad || 0);
      const precio = Number(item.precio_compra || 0);
      const descuentoItem = Number(item.descuento || 0);

      return acc + Math.max(cantidad * precio - descuentoItem, 0);
    }, 0);

    const descuento = Number(formCompra.descuento || 0);
    const impuesto = Number(formCompra.impuesto || 0);
    const total = Math.max(subtotal - descuento + impuesto, 0);
    const montoPagado = Number(formCompra.monto_pagado || 0);
    const saldo = Math.max(total - montoPagado, 0);

    return {
      subtotal,
      descuento,
      impuesto,
      total,
      montoPagado,
      saldo,
    };
  }, [items, formCompra.descuento, formCompra.impuesto, formCompra.monto_pagado]);

  const resumenGeneral = useMemo(() => {
    const totalCompras = compras.length;

    const totalImporte = compras.reduce((acc, compra) => {
      return acc + Number(compra.total || 0);
    }, 0);

    const totalPagado = compras.reduce((acc, compra) => {
      return acc + Number(compra.monto_pagado || 0);
    }, 0);

    const totalSaldo = compras.reduce((acc, compra) => {
      return acc + Number(compra.saldo || 0);
    }, 0);

    const pendientes = compras.filter((c) => c.estado === 'PENDIENTE').length;

    return {
      totalCompras,
      totalImporte,
      totalPagado,
      totalSaldo,
      pendientes,
    };
  }, [compras]);

  const cargarSucursales = async () => {
    try {
      const { data } = await api.get('/sucursales');

      if (data.ok) {
        const activas = (data.sucursales || []).filter((s) => s.activo);
        const sucursalesPermitidas = filtrarSucursalesPorRol(usuario, activas);

        setSucursales(sucursalesPermitidas);

        if (!idSucursalFiltro) {
          setIdSucursalFiltro(
            obtenerSucursalInicial(usuario, sucursalesPermitidas)
          );
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

  const cargarProveedores = async () => {
    try {
      const { data } = await api.get('/proveedores?activos=true');

      if (data.ok) {
        setProveedores(data.proveedores || []);
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar los proveedores.',
      });
    }
  };

  const cargarProductos = async () => {
    try {
      const { data } = await api.get('/productos?activos=true');

      if (data.ok) {
        setProductos(data.productos || []);
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar los productos.',
      });
    }
  };

  const cargarCajasYSesion = async (idSucursal) => {
    if (!idSucursal) {
      setCajas([]);
      return;
    }

    try {
      const { data } = await api.get(`/caja/cajas?sucursal=${idSucursal}`);

      if (data.ok) {
        const cajasActivas = (data.cajas || []).filter((c) => c.activo);
        const cajasConSesion = [];

        for (const caja of cajasActivas) {
          const sesionResp = await api.get(
            `/caja/sesion-abierta?id_caja=${caja.id_caja}`
          );

          cajasConSesion.push({
            ...caja,
            sesion_abierta: sesionResp.data?.sesion_abierta || null,
          });
        }

        setCajas(cajasConSesion);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const cargarCompras = async () => {
    try {
      setCargando(true);

      const params = new URLSearchParams();

      if (idSucursalFiltro) {
        params.append('sucursal', idSucursalFiltro);
      }

      if (idProveedorFiltro) {
        params.append('proveedor', idProveedorFiltro);
      }

      if (estadoFiltro) {
        params.append('estado', estadoFiltro);
      }

      if (fechaInicio) {
        params.append('fecha_inicio', `${fechaInicio} 00:00:00`);
      }

      if (fechaFin) {
        params.append('fecha_fin', `${fechaFin} 23:59:59`);
      }

      const { data } = await api.get(`/compras?${params.toString()}`);

      if (data.ok) {
        setCompras(data.compras || []);
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudieron cargar las compras.',
      });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (usuario) {
      cargarSucursales();
      cargarProveedores();
      cargarProductos();
    }
  }, [usuario]);

  useEffect(() => {
    if (idSucursalFiltro) {
      cargarCompras();
    }
  }, [idSucursalFiltro]);

  const abrirNuevaCompra = async () => {
    const sucursalInicial = obtenerSucursalInicial(usuario, sucursales);

    setFormCompra({
      ...compraInicial,
      id_sucursal: sucursalInicial,
    });

    setItems([
      {
        ...productoInicial,
      },
    ]);

    await cargarCajasYSesion(sucursalInicial);
    setModalCompra(true);
  };

  const cerrarModalCompra = () => {
    setModalCompra(false);
    setFormCompra(compraInicial);
    setItems([]);
  };

  const handleCompraChange = async (e) => {
    const { name, value } = e.target;

    const nuevoForm = {
      ...formCompra,
      [name]: value,
    };

    if (name === 'id_sucursal') {
      nuevoForm.id_sesion = '';
      await cargarCajasYSesion(value);
    }

    if (name === 'metodo_pago') {
      if (value === 'PENDIENTE') {
        nuevoForm.monto_pagado = '';
        nuevoForm.id_sesion = '';
      }

      if (value !== 'EFECTIVO') {
        nuevoForm.id_sesion = '';
      }
    }

    setFormCompra(nuevoForm);
  };

  const agregarProducto = () => {
    setItems([
      ...items,
      {
        ...productoInicial,
      },
    ]);
  };

  const quitarProducto = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const actualizarItem = (index, campo, valor) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;

        const actualizado = {
          ...item,
          [campo]: valor,
        };

        if (campo === 'id_producto') {
          const producto = productos.find(
            (p) => Number(p.id_producto) === Number(valor)
          );

          if (producto) {
            actualizado.precio_compra =
              producto.precio_compra && Number(producto.precio_compra) > 0
                ? producto.precio_compra
                : actualizado.precio_compra;
          }
        }

        return actualizado;
      })
    );
  };

  const validarCompra = () => {
    if (!formCompra.id_sucursal) {
      Swal.fire({
        icon: 'warning',
        title: 'Sucursal obligatoria',
        text: 'Selecciona la sucursal donde entrará el inventario.',
      });
      return false;
    }

    if (!formCompra.id_proveedor) {
      Swal.fire({
        icon: 'warning',
        title: 'Proveedor obligatorio',
        text: 'Selecciona un proveedor.',
      });
      return false;
    }

    if (items.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin productos',
        text: 'Agrega al menos un producto a la compra.',
      });
      return false;
    }

    for (const [index, item] of items.entries()) {
      if (!item.id_producto) {
        Swal.fire({
          icon: 'warning',
          title: 'Producto obligatorio',
          text: `Selecciona el producto en la fila ${index + 1}.`,
        });
        return false;
      }

      if (!item.cantidad || Number(item.cantidad) <= 0) {
        Swal.fire({
          icon: 'warning',
          title: 'Cantidad inválida',
          text: `La cantidad de la fila ${index + 1} debe ser mayor a cero.`,
        });
        return false;
      }

      if (item.precio_compra === '' || Number(item.precio_compra) < 0) {
        Swal.fire({
          icon: 'warning',
          title: 'Precio inválido',
          text: `El precio de compra de la fila ${index + 1} no es válido.`,
        });
        return false;
      }
    }

    if (Number(formCompra.monto_pagado || 0) > resumenCompra.total) {
      Swal.fire({
        icon: 'warning',
        title: 'Monto pagado inválido',
        text: 'El monto pagado no puede ser mayor al total de la compra.',
      });
      return false;
    }

    if (
      formCompra.metodo_pago === 'EFECTIVO' &&
      Number(formCompra.monto_pagado || 0) > 0 &&
      !formCompra.id_sesion
    ) {
      Swal.fire({
        icon: 'warning',
        title: 'Caja requerida',
        text: 'Para pagar en efectivo necesitas seleccionar una sesión de caja abierta.',
      });
      return false;
    }

    return true;
  };

  const guardarCompra = async (e) => {
    e.preventDefault();

    if (!validarCompra()) return;

    try {
      setGuardando(true);

      const payload = {
        id_sucursal: Number(formCompra.id_sucursal),
        id_proveedor: Number(formCompra.id_proveedor),
        metodo_pago: formCompra.metodo_pago,
        monto_pagado: Number(formCompra.monto_pagado || 0),
        id_sesion: formCompra.id_sesion ? Number(formCompra.id_sesion) : null,
        impuesto: Number(formCompra.impuesto || 0),
        descuento: Number(formCompra.descuento || 0),
        observaciones: formCompra.observaciones || null,
        productos: items.map((item) => ({
          id_producto: Number(item.id_producto),
          cantidad: Number(item.cantidad),
          precio_compra: Number(item.precio_compra),
          descuento: Number(item.descuento || 0),
          lote: item.lote || null,
          fecha_caducidad: item.fecha_caducidad || null,
          observaciones: item.observaciones || null,
        })),
      };

      const { data } = await api.post('/compras', payload);

      if (data.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Compra registrada',
          text: data.mensaje,
          timer: 1600,
          showConfirmButton: false,
        });

        cerrarModalCompra();
        await cargarCompras();
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: 'error',
        title: 'Error al guardar compra',
        text:
          error.response?.data?.mensaje ||
          'No se pudo registrar la compra.',
      });
    } finally {
      setGuardando(false);
    }
  };

  const verDetalleCompra = async (idCompra) => {
    try {
      const { data } = await api.get(`/compras/${idCompra}`);

      if (data.ok) {
        setDetalleCompra(data.compra);
        setDetalleProductos(data.detalle || []);
        setDetallePagos(data.pagos || []);
        setModalDetalle(true);
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudo cargar el detalle de la compra.',
      });
    }
  };

  const cerrarDetalle = () => {
    setModalDetalle(false);
    setDetalleCompra(null);
    setDetalleProductos([]);
    setDetallePagos([]);
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

  const formatoFecha = (fecha) => {
    if (!fecha) return '—';

    return new Date(fecha).toLocaleString('es-MX', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <ClipboardList size={25} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                Compras
              </h1>
              <p className="text-slate-500">
                Registra compras a proveedores y alimenta inventario por lote.
              </p>
            </div>
          </div>

          <button
            onClick={abrirNuevaCompra}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-lg shadow-emerald-900/20 transition"
          >
            <Plus size={20} />
            Nueva compra
          </button>
        </div>

        <div className="mt-6 grid md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Sucursal
            </label>

            {puedeCambiarSucursal ? (
              <select
                value={idSucursalFiltro}
                onChange={(e) => setIdSucursalFiltro(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
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
                {sucursalFiltroActual?.nombre ||
                  sucursales[0]?.nombre ||
                  'Sucursal asignada'}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Proveedor
            </label>
            <select
              value={idProveedorFiltro}
              onChange={(e) => setIdProveedorFiltro(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Todos</option>
              {proveedores.map((proveedor) => (
                <option
                  key={proveedor.id_proveedor}
                  value={proveedor.id_proveedor}
                >
                  {proveedor.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Estado
            </label>
            <select
              value={estadoFiltro}
              onChange={(e) => setEstadoFiltro(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Todos</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="PARCIAL">Parcial</option>
              <option value="PAGADA">Pagada</option>
            </select>
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

          <div className="flex items-end">
            <button
              onClick={cargarCompras}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition"
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
            <ClipboardList size={24} />
          </div>
          <p className="text-sm text-slate-500 mt-5">Compras</p>
          <h3 className="text-3xl font-bold text-slate-800 mt-1">
            {resumenGeneral.totalCompras}
          </h3>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <Wallet size={24} />
          </div>
          <p className="text-sm text-slate-500 mt-5">Total compras</p>
          <h3 className="text-2xl font-bold text-slate-800 mt-1">
            {formatoMoneda(resumenGeneral.totalImporte)}
          </h3>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Wallet size={24} />
          </div>
          <p className="text-sm text-slate-500 mt-5">Pagado</p>
          <h3 className="text-2xl font-bold text-emerald-700 mt-1">
            {formatoMoneda(resumenGeneral.totalPagado)}
          </h3>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-700 flex items-center justify-center">
            <FileText size={24} />
          </div>
          <p className="text-sm text-slate-500 mt-5">Saldo</p>
          <h3 className="text-2xl font-bold text-red-700 mt-1">
            {formatoMoneda(resumenGeneral.totalSaldo)}
          </h3>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <Calendar size={24} />
          </div>
          <p className="text-sm text-slate-500 mt-5">Pendientes</p>
          <h3 className="text-3xl font-bold text-amber-700 mt-1">
            {resumenGeneral.pendientes}
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
                  Proveedor
                </th>
                <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                  Sucursal
                </th>
                <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                  Usuario
                </th>
                <th className="px-5 py-4 text-right text-xs font-bold text-slate-500 uppercase">
                  Total
                </th>
                <th className="px-5 py-4 text-right text-xs font-bold text-slate-500 uppercase">
                  Pagado
                </th>
                <th className="px-5 py-4 text-right text-xs font-bold text-slate-500 uppercase">
                  Saldo
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
                    Cargando compras...
                  </td>
                </tr>
              ) : compras.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-5 py-10 text-center text-slate-500">
                    No hay compras registradas.
                  </td>
                </tr>
              ) : (
                compras.map((compra) => (
                  <tr key={compra.id_compra} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-800">
                        {compra.folio}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        ID #{compra.id_compra}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {formatoFecha(compra.fecha_compra)}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-start gap-2">
                        <Truck size={17} className="text-slate-400 mt-0.5" />
                        <span className="font-semibold text-slate-800">
                          {compra.proveedor}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-start gap-2">
                        <Store size={17} className="text-slate-400 mt-0.5" />
                        <span className="text-slate-600">
                          {compra.sucursal}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {compra.usuario}
                    </td>

                    <td className="px-5 py-4 text-right font-bold text-slate-800">
                      {formatoMoneda(compra.total)}
                    </td>

                    <td className="px-5 py-4 text-right font-bold text-emerald-700">
                      {formatoMoneda(compra.monto_pagado)}
                    </td>

                    <td className="px-5 py-4 text-right font-bold text-red-700">
                      {formatoMoneda(compra.saldo)}
                    </td>

                    <td className="px-5 py-4 text-center">
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full ${
                          compra.estado === 'PAGADA'
                            ? 'bg-emerald-100 text-emerald-700'
                            : compra.estado === 'PARCIAL'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {compra.estado}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => verDetalleCompra(compra.id_compra)}
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

      {modalCompra && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-7xl max-h-[94vh] overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Nueva compra
                </h2>
                <p className="text-sm text-slate-500">
                  Captura productos, lote y caducidad para entrada automática a inventario.
                </p>
              </div>

              <button
                onClick={cerrarModalCompra}
                className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={guardarCompra} className="p-6 overflow-y-auto max-h-[82vh]">
              <section className="grid md:grid-cols-4 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Sucursal *
                  </label>

                  {puedeCambiarSucursal ? (
                    <select
                      name="id_sucursal"
                      value={formCompra.id_sucursal}
                      onChange={handleCompraChange}
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
                    Proveedor *
                  </label>
                  <select
                    name="id_proveedor"
                    value={formCompra.id_proveedor}
                    onChange={handleCompraChange}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Selecciona proveedor</option>
                    {proveedores.map((proveedor) => (
                      <option
                        key={proveedor.id_proveedor}
                        value={proveedor.id_proveedor}
                      >
                        {proveedor.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Método de pago
                  </label>
                  <select
                    name="metodo_pago"
                    value={formCompra.metodo_pago}
                    onChange={handleCompraChange}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="PENDIENTE">Pendiente</option>
                    <option value="EFECTIVO">Efectivo</option>
                    <option value="TARJETA">Tarjeta</option>
                    <option value="TRANSFERENCIA">Transferencia</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Monto pagado
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="monto_pagado"
                    value={formCompra.monto_pagado}
                    onChange={handleCompraChange}
                    disabled={formCompra.metodo_pago === 'PENDIENTE'}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100"
                    placeholder="0.00"
                  />
                </div>

                {formCompra.metodo_pago === 'EFECTIVO' &&
                  Number(formCompra.monto_pagado || 0) > 0 && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-slate-700 mb-2">
                        Caja abierta para pago *
                      </label>
                      <select
                        name="id_sesion"
                        value={formCompra.id_sesion}
                        onChange={handleCompraChange}
                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">Selecciona sesión de caja</option>
                        {cajas
                          .filter((c) => c.sesion_abierta)
                          .map((caja) => (
                            <option
                              key={caja.sesion_abierta.id_sesion}
                              value={caja.sesion_abierta.id_sesion}
                            >
                              {caja.nombre} · Sesión #{caja.sesion_abierta.id_sesion}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Descuento general
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="descuento"
                    value={formCompra.descuento}
                    onChange={handleCompraChange}
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
                    name="impuesto"
                    value={formCompra.impuesto}
                    onChange={handleCompraChange}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="0.00"
                  />
                </div>

                <div className="md:col-span-4">
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Observaciones
                  </label>
                  <textarea
                    name="observaciones"
                    value={formCompra.observaciones}
                    onChange={handleCompraChange}
                    rows="2"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                    placeholder="Observaciones generales de la compra"
                  />
                </div>
              </section>

              <section className="mt-7">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">
                      Productos de la compra
                    </h3>
                    <p className="text-sm text-slate-500">
                      Cada producto puede tener lote y fecha de caducidad.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={agregarProducto}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-100 text-emerald-800 hover:bg-emerald-200 font-bold transition"
                  >
                    <Plus size={17} />
                    Producto
                  </button>
                </div>

                <div className="space-y-4">
                  {items.map((item, index) => {
                    const subtotalItem = Math.max(
                      Number(item.cantidad || 0) *
                        Number(item.precio_compra || 0) -
                        Number(item.descuento || 0),
                      0
                    );

                    return (
                      <div
                        key={index}
                        className="rounded-3xl border border-slate-100 bg-slate-50 p-5"
                      >
                        <div className="grid md:grid-cols-12 gap-4">
                          <div className="md:col-span-4">
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                              Producto *
                            </label>
                            <select
                              value={item.id_producto}
                              onChange={(e) =>
                                actualizarItem(index, 'id_producto', e.target.value)
                              }
                              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                            >
                              <option value="">Selecciona producto</option>
                              {productos.map((producto) => (
                                <option
                                  key={producto.id_producto}
                                  value={producto.id_producto}
                                >
                                  {producto.nombre}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                              Cantidad *
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={item.cantidad}
                              onChange={(e) =>
                                actualizarItem(index, 'cantidad', e.target.value)
                              }
                              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                              placeholder="0"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                              Precio compra *
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={item.precio_compra}
                              onChange={(e) =>
                                actualizarItem(index, 'precio_compra', e.target.value)
                              }
                              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                              placeholder="0.00"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                              Desc.
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={item.descuento}
                              onChange={(e) =>
                                actualizarItem(index, 'descuento', e.target.value)
                              }
                              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                              placeholder="0.00"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                              Subtotal
                            </label>
                            <div className="px-4 py-3 rounded-2xl bg-white border border-slate-200 font-bold text-emerald-700 text-right">
                              {formatoMoneda(subtotalItem)}
                            </div>
                          </div>

                          <div className="md:col-span-3">
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                              Lote
                            </label>
                            <input
                              value={item.lote}
                              onChange={(e) =>
                                actualizarItem(index, 'lote', e.target.value)
                              }
                              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white uppercase"
                              placeholder="Ej. PAR-2027-A"
                            />
                          </div>

                          <div className="md:col-span-3">
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                              Fecha caducidad
                            </label>
                            <input
                              type="date"
                              value={item.fecha_caducidad}
                              onChange={(e) =>
                                actualizarItem(
                                  index,
                                  'fecha_caducidad',
                                  e.target.value
                                )
                              }
                              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                            />
                          </div>

                          <div className="md:col-span-5">
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                              Observaciones
                            </label>
                            <input
                              value={item.observaciones}
                              onChange={(e) =>
                                actualizarItem(
                                  index,
                                  'observaciones',
                                  e.target.value
                                )
                              }
                              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                              placeholder="Opcional"
                            />
                          </div>

                          <div className="md:col-span-1 flex items-end">
                            <button
                              type="button"
                              onClick={() => quitarProducto(index)}
                              disabled={items.length === 1}
                              className="w-full h-12 rounded-2xl bg-red-50 text-red-700 hover:bg-red-100 flex items-center justify-center transition disabled:opacity-40"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="mt-7 grid md:grid-cols-4 gap-4">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Subtotal</p>
                  <p className="text-xl font-bold text-slate-800">
                    {formatoMoneda(resumenCompra.subtotal)}
                  </p>
                </div>

                <div className="rounded-2xl bg-red-50 p-4">
                  <p className="text-sm text-red-600">Descuento</p>
                  <p className="text-xl font-bold text-red-700">
                    -{formatoMoneda(resumenCompra.descuento)}
                  </p>
                </div>

                <div className="rounded-2xl bg-blue-50 p-4">
                  <p className="text-sm text-blue-600">Impuesto</p>
                  <p className="text-xl font-bold text-blue-700">
                    {formatoMoneda(resumenCompra.impuesto)}
                  </p>
                </div>

                <div className="rounded-2xl bg-emerald-50 p-4">
                  <p className="text-sm text-emerald-600">Total</p>
                  <p className="text-2xl font-bold text-emerald-700">
                    {formatoMoneda(resumenCompra.total)}
                  </p>
                </div>
              </section>

              <section className="mt-7 flex justify-end gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={cerrarModalCompra}
                  className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={guardando}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold transition disabled:opacity-60"
                >
                  <Save size={19} />
                  {guardando ? 'Guardando...' : 'Guardar compra'}
                </button>
              </section>
            </form>
          </div>
        </div>
      )}

      {modalDetalle && detalleCompra && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[92vh] overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Detalle de compra
                </h2>
                <p className="text-sm text-slate-500">
                  {detalleCompra.folio}
                </p>
              </div>

              <button
                onClick={cerrarDetalle}
                className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[80vh] space-y-6">
              <section className="grid md:grid-cols-4 gap-4">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Proveedor</p>
                  <p className="font-bold text-slate-800 mt-1">
                    {detalleCompra.proveedor}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Sucursal</p>
                  <p className="font-bold text-slate-800 mt-1">
                    {detalleCompra.sucursal}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Fecha</p>
                  <p className="font-bold text-slate-800 mt-1">
                    {formatoFecha(detalleCompra.fecha_compra)}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Estado</p>
                  <p className="font-bold text-slate-800 mt-1">
                    {detalleCompra.estado}
                  </p>
                </div>
              </section>

              <section className="grid md:grid-cols-4 gap-4">
                <div className="rounded-2xl bg-emerald-50 p-4">
                  <p className="text-sm text-emerald-600">Total</p>
                  <p className="text-2xl font-bold text-emerald-700">
                    {formatoMoneda(detalleCompra.total)}
                  </p>
                </div>

                <div className="rounded-2xl bg-blue-50 p-4">
                  <p className="text-sm text-blue-600">Pagado</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {formatoMoneda(detalleCompra.monto_pagado)}
                  </p>
                </div>

                <div className="rounded-2xl bg-red-50 p-4">
                  <p className="text-sm text-red-600">Saldo</p>
                  <p className="text-2xl font-bold text-red-700">
                    {formatoMoneda(detalleCompra.saldo)}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Método</p>
                  <p className="font-bold text-slate-800">
                    {detalleCompra.metodo_pago}
                  </p>
                </div>
              </section>

              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Package className="text-emerald-700" size={22} />
                  <h3 className="text-lg font-bold text-slate-800">
                    Productos comprados
                  </h3>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-100">
                  <table className="w-full min-w-[950px]">
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
                          Precio
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase">
                          Desc.
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
                            {item.lote || '—'}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {item.fecha_caducidad
                              ? new Date(item.fecha_caducidad).toLocaleDateString('es-MX')
                              : 'Sin fecha'}
                          </td>
                          <td className="px-4 py-3 text-right font-bold">
                            {formatoNumero(item.cantidad)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {formatoMoneda(item.precio_compra)}
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
                  <Wallet className="text-blue-700" size={22} />
                  <h3 className="text-lg font-bold text-slate-800">
                    Pagos registrados
                  </h3>
                </div>

                {detallePagos.length === 0 ? (
                  <div className="rounded-2xl bg-slate-50 p-5 text-center text-slate-500">
                    Esta compra no tiene pagos registrados.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-100">
                    <table className="w-full min-w-[700px]">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                            Fecha
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                            Método
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase">
                            Monto
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                            Usuario
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                            Referencia
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {detallePagos.map((pago) => (
                          <tr key={pago.id_pago}>
                            <td className="px-4 py-3 text-slate-600">
                              {formatoFecha(pago.fecha_pago)}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {pago.metodo_pago}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-blue-700">
                              {formatoMoneda(pago.monto)}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {pago.usuario}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {pago.referencia || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}