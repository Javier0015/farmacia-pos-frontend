import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import {
  Boxes,
  Search,
  RefreshCw,
  Plus,
  ArrowDownCircle,
  ArrowUpCircle,
  AlertTriangle,
  History,
  X,
  Save,
  Package,
  Warehouse,
} from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import {
  esSuperAdmin,
  obtenerSucursalInicial,
  filtrarSucursalesPorRol,
} from '../../utils/sucursalPermisos';

const formAsignarInicial = {
  id_sucursal: '',
  id_producto: '',
  id_proveedor: '',
  stock_inicial: '',
  stock_minimo: '',
  ubicacion: '',
  lote: '',
  fecha_caducidad: '',
  precio_compra: '',
  observaciones: '',
};

const formMovimientoInicial = {
  id_sucursal: '',
  id_producto: '',
  id_proveedor: '',
  id_lote: '',
  tipo_movimiento: 'ENTRADA',
  cantidad: '',
  stock_minimo: '',
  ubicacion: '',
  lote: '',
  fecha_caducidad: '',
  precio_compra: '',
  referencia: '',
  observaciones: '',
};

const tiposMovimiento = [
  { value: 'ENTRADA', label: 'Entrada', tipo: 'entrada' },
  { value: 'SALIDA', label: 'Salida', tipo: 'salida' },
  { value: 'AJUSTE_POSITIVO', label: 'Ajuste positivo', tipo: 'entrada' },
  { value: 'AJUSTE_NEGATIVO', label: 'Ajuste negativo', tipo: 'salida' },
  { value: 'MERMA', label: 'Merma', tipo: 'salida' },
  { value: 'CADUCIDAD', label: 'Caducidad', tipo: 'salida' },
  { value: 'DEVOLUCION_PROVEEDOR', label: 'Devolución proveedor', tipo: 'salida' },
];

const movimientosEntrada = tiposMovimiento
  .filter((tipo) => tipo.tipo === 'entrada')
  .map((tipo) => tipo.value);

const movimientosSalida = tiposMovimiento
  .filter((tipo) => tipo.tipo === 'salida')
  .map((tipo) => tipo.value);

const movimientosConLoteExistente = [
  'SALIDA',
  'AJUSTE_NEGATIVO',
  'MERMA',
  'CADUCIDAD',
  'DEVOLUCION_PROVEEDOR',
  'DEVOLUCION_CLIENTE',
];

const movimientosBajaTotalLote = ['CADUCIDAD'];

const movimientosPermitenNuevoLote = [
  'ENTRADA',
  'AJUSTE_POSITIVO',
];

export default function Inventario() {
  const { usuario } = useAuth();

  const puedeCambiarSucursal = esSuperAdmin(usuario);

  const [sucursales, setSucursales] = useState([]);
  const [productos, setProductos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [inventario, setInventario] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [bajoStock, setBajoStock] = useState([]);

  const [lotes, setLotes] = useState([]);
  const [caducidadProxima, setCaducidadProxima] = useState([]);
  const [productoLotes, setProductoLotes] = useState(null);

  const [idSucursal, setIdSucursal] = useState('');
  const [buscar, setBuscar] = useState('');

  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  const [cargando, setCargando] = useState(false);
  const [cargandoMovimientos, setCargandoMovimientos] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [modalAsignar, setModalAsignar] = useState(false);
  const [modalMovimiento, setModalMovimiento] = useState(false);
  const [modalMovimientos, setModalMovimientos] = useState(false);
  const [modalBajoStock, setModalBajoStock] = useState(false);

  const [modalLotes, setModalLotes] = useState(false);
  const [modalCaducidad, setModalCaducidad] = useState(false);

  const [formAsignar, setFormAsignar] = useState(formAsignarInicial);
  const [formMovimiento, setFormMovimiento] = useState(formMovimientoInicial);

  const sucursalActual = useMemo(() => {
    return sucursales.find((s) => Number(s.id_sucursal) === Number(idSucursal));
  }, [sucursales, idSucursal]);

  const productosSinInventario = useMemo(() => {
    const productosInventario = new Set(
      inventario.map((item) => Number(item.id_producto))
    );

    return productos.filter(
      (producto) =>
        producto.activo &&
        !productosInventario.has(Number(producto.id_producto))
    );
  }, [productos, inventario]);

  const resumen = useMemo(() => {
    const totalProductos = inventario.length;

    const productosBajoStock = inventario.filter(
      (item) => item.bajo_stock
    ).length;

    const valorInventario = inventario.reduce((acc, item) => {
      return acc + Number(item.stock_actual || 0) * Number(item.precio_compra || 0);
    }, 0);

    const valorVentaEstimado = inventario.reduce((acc, item) => {
      return acc + Number(item.stock_actual || 0) * Number(item.precio_venta || 0);
    }, 0);

    return {
      totalProductos,
      productosBajoStock,
      valorInventario,
      valorVentaEstimado,
    };
  }, [inventario]);

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
      dateStyle: 'short',
      timeStyle: 'short',
    });
  };

  const getProductoNombre = (idProducto) => {
    const producto = productos.find(
      (p) => Number(p.id_producto) === Number(idProducto)
    );

    return producto?.nombre || '';
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
        setInventario(data.inventario || []);
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudo cargar el inventario.',
      });
    } finally {
      setCargando(false);
    }
  };

  const buscarInventarioYMovimientos = async () => {
    await cargarInventario();

    if (modalMovimientos) {
      await cargarMovimientos();
    }
  };

  const cargarBajoStock = async () => {
    if (!idSucursal) return;

    try {
      const { data } = await api.get(
        `/inventario/bajo-stock?sucursal=${idSucursal}`
      );

      if (data.ok) {
        setBajoStock(data.productos_bajo_stock || []);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
  if (modalMovimientos) {
    cargarMovimientos();
  }
}, [fechaInicio, fechaFin]);

  const cargarMovimientos = async () => {
    if (!idSucursal) return;

    try {
      setCargandoMovimientos(true);

      const params = new URLSearchParams();
      params.append('sucursal', idSucursal);

      if (fechaInicio) {
        params.append('fecha_inicio', fechaInicio);
      }

      if (fechaFin) {
        params.append('fecha_fin', fechaFin);
      }

      const { data } = await api.get(
        `/inventario/movimientos?${params.toString()}`
      );

      if (data.ok) {
        setMovimientos(data.movimientos || []);
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar los movimientos de inventario.',
      });
    } finally {
      setCargandoMovimientos(false);
    }
  };

  const limpiarFiltros = async () => {
    setBuscar('');
    setFechaInicio('');
    setFechaFin('');

    if (!idSucursal) return;

    try {
      setCargando(true);

      const paramsInventario = new URLSearchParams();
      paramsInventario.append('sucursal', idSucursal);

      const { data } = await api.get(
        `/inventario?${paramsInventario.toString()}`
      );

      if (data.ok) {
        setInventario(data.inventario || []);
      }

      if (modalMovimientos) {
        setCargandoMovimientos(true);

        const paramsMovimientos = new URLSearchParams();
        paramsMovimientos.append('sucursal', idSucursal);

        const movimientosResponse = await api.get(
          `/inventario/movimientos?${paramsMovimientos.toString()}`
        );

        if (movimientosResponse.data.ok) {
          setMovimientos(movimientosResponse.data.movimientos || []);
        }
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudieron limpiar los filtros.',
      });
    } finally {
      setCargando(false);
      setCargandoMovimientos(false);
    }
  };

  const cargarLotesProducto = async (idProducto = null) => {
    if (!idSucursal) return [];

    try {
      const params = new URLSearchParams();
      params.append('sucursal', idSucursal);

      if (idProducto) {
        params.append('producto', idProducto);
      }

      const { data } = await api.get(`/inventario/lotes?${params.toString()}`);

      if (data.ok) {
        setLotes(data.lotes || []);
        return data.lotes || [];
      }

      return [];
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar los lotes.',
      });

      return [];
    }
  };

  const cargarCaducidadProxima = async () => {
    if (!idSucursal) return;

    try {
      const { data } = await api.get(
        `/inventario/caducidad-proxima?sucursal=${idSucursal}&dias=90`
      );

      if (data.ok) {
        setCaducidadProxima(data.productos_caducidad || []);
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo cargar la caducidad próxima.',
      });
    }
  };

  useEffect(() => {
    if (usuario) {
      cargarSucursales();
      cargarProductos();
      cargarProveedores();
    }
  }, [usuario]);

  useEffect(() => {
    if (idSucursal) {
      cargarInventario();
      cargarBajoStock();
    }
  }, [idSucursal]);

  useEffect(() => {
    const cargarLotesParaMovimiento = async () => {
      if (
        modalMovimiento &&
        formMovimiento.id_producto &&
        movimientosConLoteExistente.includes(formMovimiento.tipo_movimiento)
      ) {
        await cargarLotesProducto(formMovimiento.id_producto);
      }
    };

    cargarLotesParaMovimiento();
  }, [modalMovimiento, formMovimiento.id_producto, formMovimiento.tipo_movimiento]);

  const abrirAsignar = () => {
    if (!idSucursal) {
      Swal.fire({
        icon: 'warning',
        title: 'Selecciona una sucursal',
        text: 'Primero selecciona la sucursal donde asignarás inventario.',
      });
      return;
    }

    setFormAsignar({
      ...formAsignarInicial,
      id_sucursal: idSucursal,
    });

    setModalAsignar(true);
  };

  const abrirMovimiento = async (item = null, tipo = 'ENTRADA') => {
    if (!idSucursal) {
      Swal.fire({
        icon: 'warning',
        title: 'Selecciona una sucursal',
        text: 'Primero selecciona una sucursal.',
      });
      return;
    }

    const nuevoForm = {
      ...formMovimientoInicial,
      id_sucursal: idSucursal,
      id_producto: item?.id_producto || '',
      tipo_movimiento: tipo,
      stock_minimo: item?.stock_minimo || '',
      ubicacion: item?.ubicacion || '',
    };

    setFormMovimiento(nuevoForm);

    if (item?.id_producto && movimientosConLoteExistente.includes(tipo)) {
      await cargarLotesProducto(item.id_producto);
    } else {
      setLotes([]);
    }

    setModalMovimiento(true);
  };

  const abrirBajaLote = async (loteItem, tipo = 'CADUCIDAD') => {
    if (!idSucursal) return;

    const productoInventario = inventario.find(
      (item) => Number(item.id_producto) === Number(loteItem.id_producto)
    );

    const nuevoForm = {
      ...formMovimientoInicial,
      id_sucursal: idSucursal,
      id_producto: loteItem.id_producto || productoInventario?.id_producto || '',
      id_lote: loteItem.id_lote || '',
      id_proveedor: loteItem.id_proveedor || '',
      tipo_movimiento: tipo,
      cantidad: loteItem.stock_actual || '',
      stock_minimo: productoInventario?.stock_minimo || '',
      ubicacion: productoInventario?.ubicacion || '',
      lote: loteItem.lote || '',
      fecha_caducidad: loteItem.fecha_caducidad
        ? String(loteItem.fecha_caducidad).slice(0, 10)
        : '',
      precio_compra: loteItem.precio_compra || '',
      referencia: tipo === 'CADUCIDAD' ? `BAJA-CADUCIDAD-${loteItem.lote || ''}` : '',
      observaciones:
        tipo === 'CADUCIDAD'
          ? 'Baja de lote por caducidad'
          : '',
    };

    setFormMovimiento(nuevoForm);
    await cargarLotesProducto(loteItem.id_producto);

    setModalCaducidad(false);
    setModalLotes(false);
    setModalMovimiento(true);
  };

  const abrirLotes = async (item) => {
    setProductoLotes(item);
    await cargarLotesProducto(item.id_producto);
    setModalLotes(true);
  };

  const abrirCaducidad = async () => {
    await cargarCaducidadProxima();
    setModalCaducidad(true);
  };

  const abrirBajoStock = async () => {
    await cargarBajoStock();
    setModalBajoStock(true);
  };

  const abrirMovimientos = async () => {
    await cargarMovimientos();
    setModalMovimientos(true);
  };

  const cerrarModalAsignar = () => {
    setModalAsignar(false);
    setFormAsignar(formAsignarInicial);
  };

  const cerrarModalMovimiento = () => {
    setModalMovimiento(false);
    setFormMovimiento(formMovimientoInicial);
    setLotes([]);
  };

  const handleAsignarChange = (e) => {
    const { name, value } = e.target;

    setFormAsignar({
      ...formAsignar,
      [name]: value,
    });
  };

  const handleMovimientoChange = (e) => {
    const { name, value } = e.target;

    setFormMovimiento((prev) => {
      const cambios = {
        ...prev,
        [name]: value,
      };

      if (name === 'id_producto') {
        cambios.id_lote = '';
        cambios.id_proveedor = '';
        cambios.cantidad = '';
        cambios.lote = '';
        cambios.fecha_caducidad = '';
        cambios.precio_compra = '';
      }

      if (name === 'tipo_movimiento') {
        cambios.id_lote = '';
        cambios.id_proveedor = '';
        cambios.cantidad = '';
        cambios.lote = '';
        cambios.fecha_caducidad = '';
        cambios.precio_compra = '';
      }

      if (name === 'id_lote') {
        const loteSeleccionado = lotes.find(
          (lote) => Number(lote.id_lote) === Number(value)
        );

        if (loteSeleccionado) {
          cambios.id_proveedor = loteSeleccionado.id_proveedor || '';
          cambios.lote = loteSeleccionado.lote || '';
          cambios.fecha_caducidad = loteSeleccionado.fecha_caducidad
            ? String(loteSeleccionado.fecha_caducidad).slice(0, 10)
            : '';
          cambios.precio_compra = loteSeleccionado.precio_compra || '';

          if (movimientosBajaTotalLote.includes(prev.tipo_movimiento)) {
            cambios.cantidad = loteSeleccionado.stock_actual || '';
          }
        } else {
          cambios.id_proveedor = '';
          cambios.lote = '';
          cambios.fecha_caducidad = '';
          cambios.precio_compra = '';
        }
      }

      return cambios;
    });
  };

  const asignarInventario = async (e) => {
    e.preventDefault();

    if (!formAsignar.id_producto) {
      Swal.fire({
        icon: 'warning',
        title: 'Producto obligatorio',
        text: 'Selecciona un producto.',
      });
      return;
    }

    if (
      formAsignar.stock_inicial === '' ||
      Number(formAsignar.stock_inicial) < 0
    ) {
      Swal.fire({
        icon: 'warning',
        title: 'Stock inválido',
        text: 'El stock inicial no puede ser negativo.',
      });
      return;
    }

    try {
      setGuardando(true);

      const payload = {
        id_sucursal: Number(formAsignar.id_sucursal),
        id_producto: Number(formAsignar.id_producto),
        id_proveedor: formAsignar.id_proveedor
          ? Number(formAsignar.id_proveedor)
          : null,
        stock_inicial: Number(formAsignar.stock_inicial || 0),
        stock_minimo: Number(formAsignar.stock_minimo || 0),
        ubicacion: formAsignar.ubicacion || null,
        lote: formAsignar.lote || null,
        fecha_caducidad: formAsignar.fecha_caducidad || null,
        precio_compra: formAsignar.precio_compra
          ? Number(formAsignar.precio_compra)
          : 0,
        observaciones: formAsignar.observaciones || null,
      };

      const { data } = await api.post('/inventario/asignar', payload);

      if (data.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Inventario asignado',
          text: data.mensaje,
          timer: 1400,
          showConfirmButton: false,
        });

        cerrarModalAsignar();
        cargarInventario();
        cargarBajoStock();
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudo asignar el inventario.',
      });
    } finally {
      setGuardando(false);
    }
  };

  const guardarMovimiento = async (e) => {
    e.preventDefault();

    if (!formMovimiento.id_producto) {
      Swal.fire({
        icon: 'warning',
        title: 'Producto obligatorio',
        text: 'Selecciona un producto.',
      });
      return;
    }

    if (
      formMovimiento.cantidad === '' ||
      Number(formMovimiento.cantidad) <= 0
    ) {
      Swal.fire({
        icon: 'warning',
        title: 'Cantidad inválida',
        text: 'La cantidad debe ser mayor a cero.',
      });
      return;
    }

    if (
      formMovimiento.tipo_movimiento === 'DEVOLUCION_CLIENTE' &&
      !formMovimiento.id_lote
    ) {
      Swal.fire({
        icon: 'warning',
        title: 'Lote obligatorio',
        text: 'Para devolución de cliente selecciona el lote al que regresará el producto.',
      });
      return;
    }

    try {
      setGuardando(true);

      const payload = {
        id_sucursal: Number(formMovimiento.id_sucursal),
        id_producto: Number(formMovimiento.id_producto),
        id_proveedor: formMovimiento.id_proveedor
          ? Number(formMovimiento.id_proveedor)
          : null,
        id_lote: formMovimiento.id_lote
          ? Number(formMovimiento.id_lote)
          : undefined,
        tipo_movimiento: formMovimiento.tipo_movimiento,
        cantidad: Number(formMovimiento.cantidad),
        stock_minimo:
          formMovimiento.stock_minimo === ''
            ? undefined
            : Number(formMovimiento.stock_minimo),
        ubicacion: formMovimiento.ubicacion || undefined,
        lote: formMovimiento.lote || null,
        fecha_caducidad: formMovimiento.fecha_caducidad || null,
        precio_compra: formMovimiento.precio_compra
          ? Number(formMovimiento.precio_compra)
          : undefined,
        referencia: formMovimiento.referencia || null,
        observaciones: formMovimiento.observaciones || null,
      };

      const { data } = await api.post('/inventario/ajustar', payload);

      if (data.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Inventario actualizado',
          text: data.mensaje,
          timer: 1400,
          showConfirmButton: false,
        });

        cerrarModalMovimiento();
        cargarInventario();
        cargarBajoStock();
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudo actualizar el inventario.',
      });
    } finally {
      setGuardando(false);
    }
  };

  const darBajaCaducidad = async (item) => {
    const confirmacion = await Swal.fire({
      icon: 'warning',
      title: '¿Dar de baja este lote?',
      html: `
        <div style="text-align:left">
          <p><b>Producto:</b> ${item.producto}</p>
          <p><b>Lote:</b> ${item.lote}</p>
          <p><b>Caducidad:</b> ${item.fecha_caducidad
          ? new Date(item.fecha_caducidad).toLocaleDateString('es-MX')
          : 'Sin fecha'
        }</p>
          <p><b>Stock a dar de baja:</b> ${formatoNumero(item.stock_actual)}</p>
        </div>
      `,
      input: 'textarea',
      inputLabel: 'Observaciones',
      inputPlaceholder: 'Ej. Producto caducado retirado del anaquel',
      showCancelButton: true,
      confirmButtonText: 'Sí, dar de baja',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
    });

    if (!confirmacion.isConfirmed) return;

    try {
      const { data } = await api.post('/inventario/baja-caducidad', {
        id_sucursal: Number(item.id_sucursal),
        id_producto: Number(item.id_producto),
        id_lote: Number(item.id_lote),
        observaciones:
          confirmacion.value ||
          'Baja por caducidad desde módulo de inventario',
      });

      if (data.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Lote dado de baja',
          text: data.mensaje,
          timer: 1500,
          showConfirmButton: false,
        });

        await cargarInventario();
        await cargarBajoStock();
        await cargarCaducidadProxima();
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudo dar de baja el lote.',
      });
    }
  };

  const requiereProveedorMovimiento = movimientosPermitenNuevoLote.includes(
    formMovimiento.tipo_movimiento
  );

  return (
    <div className="w-full max-w-full overflow-hidden space-y-5 sm:space-y-6 pb-8">
      <section className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
              <Boxes size={25} />
            </div>

            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800 break-words">
                Inventario
              </h1>
              <p className="text-sm sm:text-base text-slate-500 leading-relaxed">
                Control de stock por sucursal, entradas, salidas y ajustes.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:flex gap-3 w-full xl:w-auto">
            <button
              onClick={abrirBajoStock}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold transition"
            >
              <AlertTriangle size={19} />
              Bajo stock
            </button>

            <button
              onClick={abrirCaducidad}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-red-100 hover:bg-red-200 text-red-800 font-bold transition"
            >
              <AlertTriangle size={19} />
              Caducidad
            </button>

            <button
              onClick={abrirMovimientos}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold transition"
            >
              <History size={19} />
              Movimientos
            </button>

            <button
              onClick={abrirAsignar}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-sky-700 hover:bg-sky-800 text-white font-bold shadow-lg shadow-sky-900/20 transition"
            >
              <Plus size={20} />
              Asignar stock
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-4">
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
              className="w-full min-w-0 px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
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
              className="w-full min-w-0 px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
            />
          </div>

          <div className="md:col-span-2 min-w-0">
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Buscar
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 min-w-0">
                <Search
                  className="absolute left-4 top-3.5 text-slate-400"
                  size={20}
                />
                <input
                  value={buscar}
                  onChange={(e) => setBuscar(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') buscarInventarioYMovimientos();
                  }}
                  className="w-full min-w-0 pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Buscar por producto, código, laboratorio o presentación..."
                />
              </div>

              <button
                 onClick={buscarInventarioYMovimientos}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition"
              >
                <RefreshCw size={19} className={cargando ? 'animate-spin' : ''} />
                Buscar
              </button>

              <button
                type="button"
                onClick={limpiarFiltros}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
              >
                Limpiar
              </button>

            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-4 sm:gap-5">
        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-100 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center">
            <Package size={24} />
          </div>
          <p className="text-sm text-slate-500 mt-5">
            Productos en inventario
          </p>
          <h3 className="text-3xl font-bold text-slate-800 mt-1 break-words">
            {resumen.totalProductos}
          </h3>
          <p className="text-sm text-slate-400 mt-2 truncate">
            {sucursalActual?.nombre || 'Sin sucursal'}
          </p>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-100 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <AlertTriangle size={24} />
          </div>
          <p className="text-sm text-slate-500 mt-5">Bajo stock</p>
          <h3 className="text-3xl font-bold text-slate-800 mt-1 break-words">
            {resumen.productosBajoStock}
          </h3>
          <p className="text-sm text-slate-400 mt-2">
            Requieren revisión
          </p>
        </div>

       
      </section>

      <section className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-4 sm:px-6 py-5 border-b border-slate-100">
          <h2 className="text-lg sm:text-xl font-bold text-slate-800">
            Productos en inventario
          </h2>
          <p className="text-sm text-slate-500">
            Existencias, ubicación, caducidad y acciones por producto.
          </p>
        </div>

        <div className="md:hidden p-4 space-y-3">
          {cargando ? (
            <div className="rounded-2xl bg-slate-50 p-6 text-center text-slate-500 font-semibold">
              Cargando inventario...
            </div>
          ) : inventario.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 p-6 text-center text-slate-500 font-semibold">
              No hay productos con inventario asignado en esta sucursal.
            </div>
          ) : (
            inventario.map((item) => (
              <article
                key={item.id_inventario}
                className={`rounded-2xl border p-4 shadow-sm ${item.bajo_stock
                  ? 'bg-amber-50/60 border-amber-100'
                  : 'bg-white border-slate-100'
                  }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 break-words">
                      {item.producto}
                    </p>
                    <p className="text-xs text-slate-500 mt-1 break-words">
                      {item.laboratorio || 'Sin laboratorio'} ·{' '}
                      {item.presentacion || 'Sin presentación'}
                    </p>
                  </div>

                  {item.bajo_stock ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-800 shrink-0">
                      <AlertTriangle size={13} />
                      Bajo
                    </span>
                  ) : (
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-sky-100 text-sky-700 shrink-0">
                      Correcto
                    </span>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Código</p>
                    <p className="font-bold text-slate-700 truncate">
                      {item.codigo_barras || '—'}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Categoría</p>
                    <p className="font-bold text-slate-700 truncate">
                      {item.categoria || 'Sin categoría'}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Stock</p>
                    <p className="font-bold text-slate-800">
                      {formatoNumero(item.stock_actual)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Mínimo</p>
                    <p className="font-bold text-slate-700">
                      {formatoNumero(item.stock_minimo)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Ubicación</p>
                    <p className="font-bold text-slate-700 truncate">
                      {item.ubicacion || '—'}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Precio venta</p>
                    <p className="font-bold text-sky-700">
                      {formatoMoneda(item.precio_venta)}
                    </p>
                  </div>
                </div>

                <div className="mt-3 rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Próxima caducidad</p>
                  {item.proxima_caducidad ? (
                    <p
                      className={`font-bold ${item.caducidad_proxima ? 'text-red-700' : 'text-slate-700'
                        }`}
                    >
                      {new Date(item.proxima_caducidad).toLocaleDateString('es-MX')}
                    </p>
                  ) : (
                    <p className="font-bold text-slate-400">—</p>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-4 gap-2">
                  <button
                    onClick={() => abrirMovimiento(item, 'ENTRADA')}
                    className="h-11 rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-100 flex items-center justify-center transition"
                    title="Entrada"
                  >
                    <ArrowDownCircle size={19} />
                  </button>

                  <button
                    onClick={() => abrirMovimiento(item, 'SALIDA')}
                    className="h-11 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 flex items-center justify-center transition"
                    title="Salida"
                  >
                    <ArrowUpCircle size={19} />
                  </button>

                  <button
                    onClick={() => abrirMovimiento(item, 'AJUSTE_POSITIVO')}
                    className="h-11 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center justify-center transition"
                    title="Ajuste"
                  >
                    <RefreshCw size={18} />
                  </button>

                  <button
                    onClick={() => abrirLotes(item)}
                    className="h-11 rounded-xl bg-violet-50 text-violet-700 hover:bg-violet-100 flex items-center justify-center transition"
                    title="Ver lotes"
                  >
                    <Package size={18} />
                  </button>
                </div>
              </article>
            ))
          )}
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[1250px]">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                  Producto
                </th>
                <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                  Código
                </th>
                <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                  Categoría
                </th>
                <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                  Ubicación
                </th>
                <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                  Próxima caducidad
                </th>
                <th className="px-5 py-4 text-right text-xs font-bold text-slate-500 uppercase">
                  Stock
                </th>
                <th className="px-5 py-4 text-right text-xs font-bold text-slate-500 uppercase">
                  Mínimo
                </th>
                <th className="px-5 py-4 text-right text-xs font-bold text-slate-500 uppercase">
                  Precio venta
                </th>
                <th className="px-5 py-4 text-center text-xs font-bold text-slate-500 uppercase">
                  Estado
                </th>
                <th className="px-5 py-4 text-center text-xs font-bold text-slate-500 uppercase sticky right-0 bg-slate-50 shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.45)] z-10">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {cargando ? (
                <tr>
                  <td colSpan="10" className="px-5 py-10 text-center text-slate-500">
                    Cargando inventario...
                  </td>
                </tr>
              ) : inventario.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-5 py-10 text-center text-slate-500">
                    No hay productos con inventario asignado en esta sucursal.
                  </td>
                </tr>
              ) : (
                inventario.map((item) => (
                  <tr
                    key={item.id_inventario}
                    className={
                      item.bajo_stock
                        ? 'bg-amber-50/50 hover:bg-amber-50'
                        : 'hover:bg-slate-50'
                    }
                  >
                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-800">
                        {item.producto}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {item.laboratorio || 'Sin laboratorio'} ·{' '}
                        {item.presentacion || 'Sin presentación'}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {item.codigo_barras || '—'}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {item.categoria || 'Sin categoría'}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {item.ubicacion || '—'}
                    </td>

                    <td className="px-5 py-4 text-sm">
                      {item.proxima_caducidad ? (
                        <span
                          className={`font-bold ${item.caducidad_proxima
                            ? 'text-red-700'
                            : 'text-slate-700'
                            }`}
                        >
                          {new Date(item.proxima_caducidad).toLocaleDateString(
                            'es-MX'
                          )}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <span className="text-lg font-bold text-slate-800">
                        {formatoNumero(item.stock_actual)}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right font-semibold text-slate-600">
                      {formatoNumero(item.stock_minimo)}
                    </td>

                    <td className="px-5 py-4 text-right font-bold text-sky-700">
                      {formatoMoneda(item.precio_venta)}
                    </td>

                    <td className="px-5 py-4 text-center">
                      {item.bajo_stock ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-800">
                          <AlertTriangle size={13} />
                          Bajo stock
                        </span>
                      ) : (
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-sky-100 text-sky-700">
                          Correcto
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4 sticky right-0 bg-white shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.45)]">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => abrirMovimiento(item, 'ENTRADA')}
                          className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-100 flex items-center justify-center transition"
                          title="Entrada"
                        >
                          <ArrowDownCircle size={18} />
                        </button>

                        <button
                          onClick={() => abrirMovimiento(item, 'SALIDA')}
                          className="w-9 h-9 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 flex items-center justify-center transition"
                          title="Salida"
                        >
                          <ArrowUpCircle size={18} />
                        </button>

                        <button
                          onClick={() => abrirMovimiento(item, 'AJUSTE_POSITIVO')}
                          className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center justify-center transition"
                          title="Ajuste"
                        >
                          <RefreshCw size={17} />
                        </button>

                        <button
                          onClick={() => abrirLotes(item)}
                          className="w-9 h-9 rounded-xl bg-violet-50 text-violet-700 hover:bg-violet-100 flex items-center justify-center transition"
                          title="Ver lotes"
                        >
                          <Package size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {modalAsignar && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center px-3 sm:px-4 py-4 sm:py-8 overflow-y-auto">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={cerrarModalAsignar}
          />

          <div className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden my-auto">
            <div className="px-4 sm:px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-slate-800">
                  Asignar stock inicial
                </h2>
                <p className="text-sm text-slate-500 break-words">
                  Sucursal: {sucursalActual?.nombre || 'Sin sucursal'}
                </p>
              </div>

              <button
                onClick={cerrarModalAsignar}
                className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={asignarInventario}>
              <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-5 max-h-[70vh] overflow-y-auto">
                <div className="md:col-span-2 min-w-0">
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Producto *
                  </label>
                  <select
                    name="id_producto"
                    value={formAsignar.id_producto}
                    onChange={handleAsignarChange}
                    className="w-full min-w-0 px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    <option value="">Selecciona producto</option>
                    {productosSinInventario.map((producto) => (
                      <option key={producto.id_producto} value={producto.id_producto}>
                        {producto.nombre}{' '}
                        {producto.codigo_barras ? `· ${producto.codigo_barras}` : ''}
                      </option>
                    ))}
                  </select>

                  {productosSinInventario.length === 0 && (
                    <p className="text-sm text-amber-700 mt-2">
                      Todos los productos activos ya tienen inventario asignado en
                      esta sucursal.
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Proveedor
                  </label>
                  <select
                    name="id_proveedor"
                    value={formAsignar.id_proveedor}
                    onChange={handleAsignarChange}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    <option value="">Sin proveedor / Inventario inicial</option>
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
                    Stock inicial *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="stock_inicial"
                    value={formAsignar.stock_inicial}
                    onChange={handleAsignarChange}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Stock mínimo
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="stock_minimo"
                    value={formAsignar.stock_minimo}
                    onChange={handleAsignarChange}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Ubicación
                  </label>
                  <input
                    name="ubicacion"
                    value={formAsignar.ubicacion}
                    onChange={handleAsignarChange}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="Anaquel A1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Lote
                  </label>
                  <input
                    name="lote"
                    value={formAsignar.lote}
                    onChange={handleAsignarChange}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="Ej. PAR-2026-A"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Fecha de caducidad
                  </label>
                  <input
                    type="date"
                    name="fecha_caducidad"
                    value={formAsignar.fecha_caducidad}
                    onChange={handleAsignarChange}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Precio compra lote
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="precio_compra"
                    value={formAsignar.precio_compra}
                    onChange={handleAsignarChange}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="0.00"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Observaciones
                  </label>
                  <input
                    name="observaciones"
                    value={formAsignar.observaciones}
                    onChange={handleAsignarChange}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="Carga inicial"
                  />
                </div>
              </div>

              <div className="px-4 sm:px-6 py-5 flex flex-col sm:flex-row justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={cerrarModalAsignar}
                  className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={guardando}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-sky-700 hover:bg-sky-800 text-white font-bold transition disabled:opacity-60"
                >
                  <Save size={19} />
                  {guardando ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalMovimiento && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center px-3 sm:px-4 py-4 sm:py-8 overflow-y-auto">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={cerrarModalMovimiento}
          />

          <div className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden my-auto">
            <div className="px-4 sm:px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-slate-800">
                  Movimiento de inventario
                </h2>
                <p className="text-sm text-slate-500 break-words">
                  {getProductoNombre(formMovimiento.id_producto) ||
                    'Selecciona un producto'}
                </p>
              </div>

              <button
                onClick={cerrarModalMovimiento}
                className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={guardarMovimiento}>
              <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-5 max-h-[70vh] overflow-y-auto">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Producto *
                  </label>
                  <select
                    name="id_producto"
                    value={formMovimiento.id_producto}
                    onChange={handleMovimientoChange}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    <option value="">Selecciona producto</option>
                    {inventario.map((item) => (
                      <option key={item.id_producto} value={item.id_producto}>
                        {item.producto} · Stock: {formatoNumero(item.stock_actual)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Tipo de movimiento *
                  </label>
                  <select
                    name="tipo_movimiento"
                    value={formMovimiento.tipo_movimiento}
                    onChange={handleMovimientoChange}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    {tiposMovimiento.map((tipo) => (
                      <option key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </option>
                    ))}
                  </select>
                </div>

                {requiereProveedorMovimiento && (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Proveedor
                    </label>
                    <select
                      name="id_proveedor"
                      value={formMovimiento.id_proveedor}
                      onChange={handleMovimientoChange}
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                    >
                      <option value="">Sin proveedor</option>
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
                )}

                {movimientosConLoteExistente.includes(formMovimiento.tipo_movimiento) && (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      {movimientosEntrada.includes(formMovimiento.tipo_movimiento)
                        ? 'Lote recibido'
                        : 'Lote de salida'}
                    </label>
                    <select
                      name="id_lote"
                      value={formMovimiento.id_lote}
                      onChange={handleMovimientoChange}
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                    >
                      <option value="">
                        {movimientosSalida.includes(formMovimiento.tipo_movimiento)
                          ? 'Automático FEFO'
                          : 'Selecciona lote'}
                      </option>
                      {lotes
                        .filter(
                          (l) =>
                            Number(l.id_producto) ===
                            Number(formMovimiento.id_producto)
                        )
                        .filter((l) => Number(l.stock_actual) > 0)
                        .map((loteItem) => (
                          <option key={loteItem.id_lote} value={loteItem.id_lote}>
                            {loteItem.lote} · Stock:{' '}
                            {formatoNumero(loteItem.stock_actual)} · Cad:{' '}
                            {loteItem.fecha_caducidad
                              ? new Date(loteItem.fecha_caducidad).toLocaleDateString(
                                'es-MX'
                              )
                              : 'Sin fecha'}
                          </option>
                        ))}
                    </select>
                    {movimientosSalida.includes(formMovimiento.tipo_movimiento) ? (
                      <p className="text-xs text-slate-500 mt-1">
                        Si no seleccionas lote, el sistema descontará primero el lote
                        que caduca antes.
                      </p>
                    ) : (
                      <p className="text-xs text-slate-500 mt-1">
                        Para devolución de cliente, selecciona el lote donde regresará
                        el medicamento. Al elegirlo se llenan caducidad y precio.
                      </p>
                    )}

                    {formMovimiento.id_lote && (
                      <div className="mt-3 rounded-2xl bg-slate-50 border border-slate-100 p-4 text-sm">
                        <p className="font-bold text-slate-700">
                          Lote seleccionado: {formMovimiento.lote || '—'}
                        </p>
                        <p className="text-slate-500 mt-1">
                          Proveedor:{' '}
                          <span className="font-semibold text-slate-700">
                            {proveedores.find((p) => Number(p.id_proveedor) === Number(formMovimiento.id_proveedor))?.nombre || 'Sin proveedor'}
                          </span>
                          <br />
                          Caducidad:{' '}
                          <span className="font-semibold text-slate-700">
                            {formMovimiento.fecha_caducidad
                              ? new Date(formMovimiento.fecha_caducidad).toLocaleDateString('es-MX')
                              : 'Sin fecha'}
                          </span>{' '}
                          · Precio compra:{' '}
                          <span className="font-semibold text-slate-700">
                            {formatoMoneda(formMovimiento.precio_compra)}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Cantidad *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="cantidad"
                    value={formMovimiento.cantidad}
                    onChange={handleMovimientoChange}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="0"
                  />
                </div>

                {movimientosPermitenNuevoLote.includes(formMovimiento.tipo_movimiento) && (
                  <>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">
                        Lote
                      </label>
                      <input
                        name="lote"
                        value={formMovimiento.lote}
                        onChange={handleMovimientoChange}
                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        placeholder="Ej. PAR-2026-B"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">
                        Fecha de caducidad
                      </label>
                      <input
                        type="date"
                        name="fecha_caducidad"
                        value={formMovimiento.fecha_caducidad}
                        onChange={handleMovimientoChange}
                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">
                        Precio compra lote
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        name="precio_compra"
                        value={formMovimiento.precio_compra}
                        onChange={handleMovimientoChange}
                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        placeholder="0.00"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Stock mínimo
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="stock_minimo"
                    value={formMovimiento.stock_minimo}
                    onChange={handleMovimientoChange}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="Opcional"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Ubicación
                  </label>
                  <input
                    name="ubicacion"
                    value={formMovimiento.ubicacion}
                    onChange={handleMovimientoChange}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="Anaquel A1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Referencia
                  </label>
                  <input
                    name="referencia"
                    value={formMovimiento.referencia}
                    onChange={handleMovimientoChange}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="COMPRA-001, AJUSTE-001..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Observaciones
                  </label>
                  <input
                    name="observaciones"
                    value={formMovimiento.observaciones}
                    onChange={handleMovimientoChange}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="Motivo del movimiento"
                  />
                </div>
              </div>

              <div className="px-4 sm:px-6 py-5 flex flex-col sm:flex-row justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={cerrarModalMovimiento}
                  className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={guardando}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-sky-700 hover:bg-sky-800 text-white font-bold transition disabled:opacity-60"
                >
                  <Save size={19} />
                  {guardando ? 'Guardando...' : 'Guardar movimiento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalLotes && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center px-3 sm:px-4 py-4 sm:py-8 overflow-y-auto">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setModalLotes(false)}
          />

          <div className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden my-auto">
            <div className="px-4 sm:px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-slate-800">
                  Lotes del producto
                </h2>
                <p className="text-sm text-slate-500 break-words">
                  {productoLotes?.producto || 'Producto'}
                </p>
              </div>

              <button
                onClick={() => setModalLotes(false)}
                className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto max-h-[75vh]">
              {lotes.length === 0 ? (
                <div className="text-center py-10 text-slate-500">
                  No hay lotes registrados para este producto.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1250px]">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                          Lote
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                          Caducidad
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase">
                          Stock
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase">
                          Precio compra
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                          Proveedor
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                          Compra
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase">
                          Estado
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                          Entrada
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase">
                          Acción
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {lotes.map((loteItem) => (
                        <tr key={loteItem.id_lote}>
                          <td className="px-4 py-3 font-bold text-slate-800">
                            {loteItem.lote}
                          </td>

                          <td className="px-4 py-3 text-slate-600">
                            {loteItem.fecha_caducidad
                              ? new Date(loteItem.fecha_caducidad).toLocaleDateString(
                                'es-MX'
                              )
                              : 'Sin fecha'}
                          </td>

                          <td className="px-4 py-3 text-right font-bold text-slate-800">
                            {formatoNumero(loteItem.stock_actual)}
                          </td>

                          <td className="px-4 py-3 text-right text-slate-600">
                            {formatoMoneda(loteItem.precio_compra)}
                          </td>

                          <td className="px-4 py-3 text-slate-600">
                            {loteItem.proveedor || 'Sin proveedor'}
                          </td>

                          <td className="px-4 py-3 text-slate-600">
                            {loteItem.folio_compra || '—'}
                          </td>

                          <td className="px-4 py-3 text-center">
                            {loteItem.caducado ? (
                              <span className="text-xs font-bold px-3 py-1 rounded-full bg-red-100 text-red-700">
                                Caducado
                              </span>
                            ) : loteItem.caducidad_proxima ? (
                              <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-700">
                                Por caducar
                              </span>
                            ) : (
                              <span className="text-xs font-bold px-3 py-1 rounded-full bg-sky-100 text-sky-700">
                                Vigente
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3 text-slate-600">
                            {formatoFecha(loteItem.fecha_entrada)}
                          </td>

                          <td className="px-4 py-3 text-center">
                            {Number(loteItem.stock_actual) > 0 ? (
                              <button
                                onClick={() => abrirBajaLote(loteItem, 'CADUCIDAD')}
                                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 font-bold transition"
                              >
                                Dar de baja
                              </button>
                            ) : (
                              <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-500">
                                Sin stock
                              </span>
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
      )}

      {modalCaducidad && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center px-3 sm:px-4 py-4 sm:py-8 overflow-y-auto">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setModalCaducidad(false)}
          />

          <div className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden my-auto">
            <div className="px-4 sm:px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-slate-800">
                  Caducidad próxima
                </h2>
                <p className="text-sm text-slate-500">
                  Productos caducados o próximos a caducar en 90 días.
                </p>
              </div>

              <button
                onClick={() => setModalCaducidad(false)}
                className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto max-h-[75vh]">
              {caducidadProxima.length === 0 ? (
                <div className="text-center py-10 text-slate-500">
                  No hay productos próximos a caducar.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1050px]">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                          Producto
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                          Lote
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                          Proveedor
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                          Caducidad
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase">
                          Stock
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase">
                          Estado
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase">
                          Acción
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {caducidadProxima.map((item) => (
                        <tr key={item.id_lote}>
                          <td className="px-4 py-3 font-bold text-slate-800">
                            {item.producto}
                          </td>

                          <td className="px-4 py-3 text-slate-600">
                            {item.lote}
                          </td>

                          <td className="px-4 py-3 text-slate-600">
                            {item.proveedor || 'Sin proveedor'}
                          </td>

                          <td className="px-4 py-3 font-bold text-red-700">
                            {item.fecha_caducidad
                              ? new Date(item.fecha_caducidad).toLocaleDateString(
                                'es-MX'
                              )
                              : 'Sin fecha'}
                          </td>

                          <td className="px-4 py-3 text-right font-bold text-slate-800">
                            {formatoNumero(item.stock_actual)}
                          </td>

                          <td className="px-4 py-3 text-center">
                            {item.estado_caducidad === 'CADUCADO' ? (
                              <span className="text-xs font-bold px-3 py-1 rounded-full bg-red-100 text-red-700">
                                Caducado
                              </span>
                            ) : (
                              <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-700">
                                Por caducar
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => abrirBajaLote(item, 'CADUCIDAD')}
                              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 font-bold transition"
                            >
                              Dar de baja
                            </button>
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
      )}

      {modalBajoStock && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center px-3 sm:px-4 py-4 sm:py-8 overflow-y-auto">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setModalBajoStock(false)}
          />

          <div className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden my-auto">
            <div className="px-4 sm:px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-slate-800">
                  Productos con bajo stock
                </h2>
                <p className="text-sm text-slate-500">
                  Productos cuyo stock actual es menor o igual al mínimo.
                </p>
              </div>

              <button
                onClick={() => setModalBajoStock(false)}
                className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto max-h-[75vh]">
              {bajoStock.length === 0 ? (
                <div className="text-center py-10 text-slate-500">
                  No hay productos con bajo stock.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                          Producto
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                          Categoría
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase">
                          Stock
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase">
                          Mínimo
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                          Ubicación
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {bajoStock.map((item) => (
                        <tr key={item.id_inventario}>
                          <td className="px-4 py-3 font-bold text-slate-800">
                            {item.producto}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {item.categoria || '—'}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-red-700">
                            {formatoNumero(item.stock_actual)}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600">
                            {formatoNumero(item.stock_minimo)}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {item.ubicacion || '—'}
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
      )}

      {modalMovimientos && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center px-3 sm:px-4 py-4 sm:py-8 overflow-y-auto">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setModalMovimientos(false)}
          />

          <div className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden my-auto">
            <div className="px-4 sm:px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-slate-800">
                  Movimientos de inventario
                </h2>
                <p className="text-sm text-slate-500">
                  Historial de entradas, salidas, ajustes y ventas.
                </p>
              </div>

              <button
                onClick={() => setModalMovimientos(false)}
                className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto max-h-[75vh]">
              {cargandoMovimientos ? (
                <div className="text-center py-10 text-slate-500">
                  Cargando movimientos...
                </div>
              ) : movimientos.length === 0 ? (
                <div className="text-center py-10 text-slate-500">
                  No hay movimientos registrados.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1150px]">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                          Fecha
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                          Producto
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                          Tipo
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase">
                          Cantidad
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase">
                          Anterior
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase">
                          Nuevo
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                          Referencia
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                          Proveedor
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                          Usuario
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {movimientos.map((mov) => (
                        <tr key={mov.id_movimiento}>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {formatoFecha(mov.fecha_movimiento)}
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-800">
                            {mov.producto}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                              {mov.tipo_movimiento}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-slate-800">
                            {formatoNumero(mov.cantidad)}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600">
                            {formatoNumero(mov.stock_anterior)}
                          </td>
                          <td className="px-4 py-3 text-right text-sky-700 font-bold">
                            {formatoNumero(mov.stock_nuevo)}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {mov.referencia || '—'}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {mov.proveedor || '—'}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {mov.usuario || '—'}
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
      )}
    </div>
  );
}