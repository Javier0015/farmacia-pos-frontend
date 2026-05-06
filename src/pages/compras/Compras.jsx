import { useEffect, useMemo, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import {
  ClipboardList,
  Plus,
  Search,
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
  Camera,
  Upload,
  Image as ImageIcon,
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
  total_manual: '',
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

  const [ticketFile, setTicketFile] = useState(null);
  const [ticketPreview, setTicketPreview] = useState('');

  const [modalCamara, setModalCamara] = useState(false);
  const [camaraActiva, setCamaraActiva] = useState(false);
  const [errorCamara, setErrorCamara] = useState('');

  const videoRef = useRef(null);
  const streamRef = useRef(null);

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
    const totalManual = Number(formCompra.total_manual || 0);

    const total =
      items.length === 0
        ? Math.max(totalManual - descuento + impuesto, 0)
        : Math.max(subtotal - descuento + impuesto, 0);

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
  }, [
    items,
    formCompra.descuento,
    formCompra.impuesto,
    formCompra.monto_pagado,
    formCompra.total_manual,
  ]);

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

  const claseEstadoCompra = (estado) => {
    if (estado === 'PAGADA') return 'bg-sky-100 text-sky-700';
    if (estado === 'PARCIAL') return 'bg-blue-100 text-blue-700';
    return 'bg-amber-100 text-amber-700';
  };

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

  useEffect(() => {
    return () => {
      detenerCamara();
    };
  }, []);

  const detenerCamara = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCamaraActiva(false);
  };

  const cerrarCamara = (cerrarModal = true) => {
    detenerCamara();

    if (cerrarModal) {
      setModalCamara(false);
    }

    setErrorCamara('');
  };

  const abrirNuevaCompra = async () => {
    const sucursalInicial = obtenerSucursalInicial(usuario, sucursales);

    setFormCompra({
      ...compraInicial,
      id_sucursal: sucursalInicial,
    });

    setItems([]);
    setTicketFile(null);
    setTicketPreview('');
    cerrarCamara(false);

    await cargarCajasYSesion(sucursalInicial);
    setModalCompra(true);
  };

  const cerrarModalCompra = () => {
    cerrarCamara(false);

    setModalCompra(false);
    setFormCompra(compraInicial);
    setItems([]);
    setTicketFile(null);
    setTicketPreview('');
    setModalCamara(false);
    setCamaraActiva(false);
    setErrorCamara('');
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

  const seleccionarTicket = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      Swal.fire({
        icon: 'warning',
        title: 'Archivo no válido',
        text: 'Selecciona una imagen del ticket.',
      });
      return;
    }

    setTicketFile(file);
    setTicketPreview(URL.createObjectURL(file));
  };

  const abrirCamara = async () => {
    try {
      setErrorCamara('');
      setCamaraActiva(false);
      setModalCamara(true);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setErrorCamara('Este navegador no permite activar la cámara desde la página.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      setTimeout(async () => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;

          try {
            await videoRef.current.play();
          } catch (error) {
            console.error(error);
          }
        }

        setCamaraActiva(true);
      }, 100);
    } catch (error) {
      console.error(error);

      let mensaje =
        'No se pudo acceder a la cámara. Revisa permisos del navegador o que la cámara no esté siendo usada por otra aplicación.';

      if (error.name === 'NotAllowedError') {
        mensaje = 'Permiso de cámara denegado. Permite el acceso a la cámara en el navegador.';
      }

      if (error.name === 'NotFoundError') {
        mensaje = 'No se encontró una cámara disponible en este equipo.';
      }

      if (error.name === 'NotReadableError') {
        mensaje = 'La cámara está siendo usada por otra aplicación o no se puede iniciar.';
      }

      setErrorCamara(mensaje);
      setCamaraActiva(false);
    }
  };

  const capturarFoto = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;

    if (!video.videoWidth || !video.videoHeight) {
      Swal.fire({
        icon: 'warning',
        title: 'Cámara no lista',
        text: 'Espera un momento a que cargue la imagen de la cámara.',
      });
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo capturar la foto.',
          });
          return;
        }

        const file = new File([blob], `ticket-proveedor-${Date.now()}.jpg`, {
          type: 'image/jpeg',
        });

        setTicketFile(file);
        setTicketPreview(URL.createObjectURL(file));

        cerrarCamara(true);
      },
      'image/jpeg',
      0.9
    );
  };

  const quitarTicket = () => {
    setTicketFile(null);
    setTicketPreview('');
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

    for (const [index, item] of items.entries()) {
      const filaVacia =
        !item.id_producto &&
        !item.cantidad &&
        !item.precio_compra &&
        !item.descuento &&
        !item.lote &&
        !item.fecha_caducidad &&
        !item.observaciones;

      if (filaVacia) {
        continue;
      }

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

      const productosValidos = items.filter((item) => {
        return item.id_producto && Number(item.cantidad || 0) > 0;
      });

      const payload = {
        id_sucursal: Number(formCompra.id_sucursal),
        id_proveedor: Number(formCompra.id_proveedor),
        metodo_pago: formCompra.metodo_pago,
        monto_pagado: Number(formCompra.monto_pagado || 0),
        id_sesion: formCompra.id_sesion ? Number(formCompra.id_sesion) : null,
        impuesto: Number(formCompra.impuesto || 0),
        descuento: Number(formCompra.descuento || 0),
        observaciones: formCompra.observaciones || null,
        total_manual: Number(formCompra.total_manual || 0),
        productos: productosValidos.map((item) => ({
          id_producto: Number(item.id_producto),
          cantidad: Number(item.cantidad),
          precio_compra: Number(item.precio_compra || 0),
          descuento: Number(item.descuento || 0),
          lote: item.lote || null,
          fecha_caducidad: item.fecha_caducidad || null,
          observaciones: item.observaciones || null,
        })),
      };

      const formData = new FormData();

      formData.append('data', JSON.stringify(payload));

      if (ticketFile) {
        formData.append('ticket', ticketFile);
      }

      const { data } = await api.post('/compras', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

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

  return (
    <div className="w-full max-w-full overflow-hidden space-y-5 sm:space-y-6 pb-8">
      <section className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
              <ClipboardList size={25} />
            </div>

            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800 break-words">
                Compras
              </h1>
              <p className="text-sm sm:text-base text-slate-500 leading-relaxed">
                Registra compras a proveedores, evidencia del ticket y entradas opcionales a inventario.
              </p>
            </div>
          </div>

          <button
            onClick={abrirNuevaCompra}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-sky-700 hover:bg-sky-800 text-white font-bold shadow-lg shadow-sky-900/20 transition"
          >
            <Plus size={20} />
            Nueva compra
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
          <div className="min-w-0">
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Sucursal
            </label>

            {puedeCambiarSucursal ? (
              <select
                value={idSucursalFiltro}
                onChange={(e) => setIdSucursalFiltro(e.target.value)}
                className="w-full min-w-0 px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
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
              <div className="w-full min-w-0 px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 font-semibold truncate">
                {sucursalFiltroActual?.nombre ||
                  sucursales[0]?.nombre ||
                  'Sucursal asignada'}
              </div>
            )}
          </div>

          <div className="min-w-0">
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Proveedor
            </label>
            <select
              value={idProveedorFiltro}
              onChange={(e) => setIdProveedorFiltro(e.target.value)}
              className="w-full min-w-0 px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
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

          <div className="min-w-0">
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Estado
            </label>
            <select
              value={estadoFiltro}
              onChange={(e) => setEstadoFiltro(e.target.value)}
              className="w-full min-w-0 px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
            >
              <option value="">Todos</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="PARCIAL">Parcial</option>
              <option value="PAGADA">Pagada</option>
            </select>
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
              onClick={cargarCompras}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition"
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
            <ClipboardList size={24} />
          </div>
          <p className="text-sm text-slate-500 mt-5">Compras</p>
          <h3 className="text-3xl font-bold text-slate-800 mt-1">
            {resumenGeneral.totalCompras}
          </h3>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-100 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <Wallet size={24} />
          </div>
          <p className="text-sm text-slate-500 mt-5">Total compras</p>
          <h3 className="text-2xl font-bold text-slate-800 mt-1 break-words">
            {formatoMoneda(resumenGeneral.totalImporte)}
          </h3>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-100 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center">
            <Wallet size={24} />
          </div>
          <p className="text-sm text-slate-500 mt-5">Pagado</p>
          <h3 className="text-2xl font-bold text-sky-700 mt-1 break-words">
            {formatoMoneda(resumenGeneral.totalPagado)}
          </h3>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-100 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-700 flex items-center justify-center">
            <FileText size={24} />
          </div>
          <p className="text-sm text-slate-500 mt-5">Saldo</p>
          <h3 className="text-2xl font-bold text-red-700 mt-1 break-words">
            {formatoMoneda(resumenGeneral.totalSaldo)}
          </h3>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-100 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <Calendar size={24} />
          </div>
          <p className="text-sm text-slate-500 mt-5">Pendientes</p>
          <h3 className="text-3xl font-bold text-amber-700 mt-1">
            {resumenGeneral.pendientes}
          </h3>
        </div>
      </section>

      <section className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-4 sm:px-6 py-5 border-b border-slate-100">
          <h2 className="text-lg sm:text-xl font-bold text-slate-800">
            Listado de compras
          </h2>
          <p className="text-sm text-slate-500">
            Consulta compras, pagos, ticket y productos registrados.
          </p>
        </div>

        <div className="md:hidden p-4 space-y-3">
          {cargando ? (
            <div className="rounded-2xl bg-slate-50 p-6 text-center text-slate-500 font-semibold">
              Cargando compras...
            </div>
          ) : compras.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 p-6 text-center text-slate-500 font-semibold">
              No hay compras registradas.
            </div>
          ) : (
            compras.map((compra) => (
              <article
                key={compra.id_compra}
                className="rounded-2xl border border-slate-100 p-4 shadow-sm bg-white"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 break-words">
                      {compra.folio}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      ID #{compra.id_compra}
                    </p>
                  </div>

                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full shrink-0 ${claseEstadoCompra(
                      compra.estado
                    )}`}
                  >
                    {compra.estado}
                  </span>
                </div>

                <div className="mt-4 rounded-2xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Fecha</p>
                  <p className="font-semibold text-slate-700">
                    {formatoFecha(compra.fecha_compra)}
                  </p>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-3">
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Truck size={15} />
                      Proveedor
                    </p>
                    <p className="font-bold text-slate-800 mt-1 break-words">
                      {compra.proveedor}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Store size={15} />
                      Sucursal
                    </p>
                    <p className="font-semibold text-slate-700 break-words">
                      {compra.sucursal}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Usuario</p>
                    <p className="font-semibold text-slate-700 break-words">
                      {compra.usuario || '—'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Total</p>
                    <p className="font-bold text-slate-800">
                      {formatoMoneda(compra.total)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-sky-50 p-3">
                    <p className="text-xs text-sky-700">Pagado</p>
                    <p className="font-bold text-sky-800">
                      {formatoMoneda(compra.monto_pagado)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-red-50 p-3">
                    <p className="text-xs text-red-700">Saldo</p>
                    <p className="font-bold text-red-700">
                      {formatoMoneda(compra.saldo)}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => verDetalleCompra(compra.id_compra)}
                  className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold transition"
                >
                  <Eye size={18} />
                  Ver detalle
                </button>
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
                <th className="px-5 py-4 text-center text-xs font-bold text-slate-500 uppercase sticky right-0 bg-slate-50 shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.45)] z-10">
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
                        <Truck size={17} className="text-slate-400 mt-0.5 shrink-0" />
                        <span className="font-semibold text-slate-800">
                          {compra.proveedor}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-start gap-2">
                        <Store size={17} className="text-slate-400 mt-0.5 shrink-0" />
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

                    <td className="px-5 py-4 text-right font-bold text-sky-700">
                      {formatoMoneda(compra.monto_pagado)}
                    </td>

                    <td className="px-5 py-4 text-right font-bold text-red-700">
                      {formatoMoneda(compra.saldo)}
                    </td>

                    <td className="px-5 py-4 text-center">
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full ${claseEstadoCompra(
                          compra.estado
                        )}`}
                      >
                        {compra.estado}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-center sticky right-0 bg-white shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.45)]">
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
        <div className="fixed inset-0 z-50 flex items-start justify-center px-3 sm:px-4 py-4 sm:py-8 overflow-y-auto">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={cerrarModalCompra}
          />

          <div className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-7xl max-h-[94vh] overflow-hidden my-auto flex flex-col">
            <div className="px-4 sm:px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-4 shrink-0">
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-slate-800">
                  Nueva compra
                </h2>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Puedes registrar la compra con ticket y capturar productos solo si deseas alimentar inventario.
                </p>
              </div>

              <button
                type="button"
                onClick={cerrarModalCompra}
                className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={guardarCompra} className="flex flex-col flex-1 min-h-0">
              <div className="p-4 sm:p-6 overflow-y-auto space-y-7">
                <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                  <div className="min-w-0">
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Sucursal *
                    </label>

                    {puedeCambiarSucursal ? (
                      <select
                        name="id_sucursal"
                        value={formCompra.id_sucursal}
                        onChange={handleCompraChange}
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
                      Proveedor *
                    </label>
                    <select
                      name="id_proveedor"
                      value={formCompra.id_proveedor}
                      onChange={handleCompraChange}
                      className="w-full min-w-0 px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
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

                  <div className="min-w-0">
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Método de pago
                    </label>
                    <select
                      name="metodo_pago"
                      value={formCompra.metodo_pago}
                      onChange={handleCompraChange}
                      className="w-full min-w-0 px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                    >
                      <option value="PENDIENTE">Pendiente</option>
                      <option value="EFECTIVO">Efectivo</option>
                      <option value="TARJETA">Tarjeta</option>
                      <option value="TRANSFERENCIA">Transferencia</option>
                    </select>
                  </div>

                  <div className="min-w-0">
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
                      className="w-full min-w-0 px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-100"
                      placeholder="0.00"
                    />
                  </div>

                  <div className="min-w-0">
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Total del ticket
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="total_manual"
                      value={formCompra.total_manual}
                      onChange={handleCompraChange}
                      className="w-full min-w-0 px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      placeholder="0.00"
                    />
                  </div>

                  {formCompra.metodo_pago === 'EFECTIVO' &&
                    Number(formCompra.monto_pagado || 0) > 0 && (
                      <div className="md:col-span-2 min-w-0">
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                          Caja abierta para pago *
                        </label>
                        <select
                          name="id_sesion"
                          value={formCompra.id_sesion}
                          onChange={handleCompraChange}
                          className="w-full min-w-0 px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
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

                  <div className="min-w-0">
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Descuento general
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="descuento"
                      value={formCompra.descuento}
                      onChange={handleCompraChange}
                      className="w-full min-w-0 px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      placeholder="0.00"
                    />
                  </div>

                  <div className="min-w-0">
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Impuesto
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="impuesto"
                      value={formCompra.impuesto}
                      onChange={handleCompraChange}
                      className="w-full min-w-0 px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      placeholder="0.00"
                    />
                  </div>

                  <div className="md:col-span-2 xl:col-span-4 min-w-0">
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Observaciones
                    </label>
                    <textarea
                      name="observaciones"
                      value={formCompra.observaciones}
                      onChange={handleCompraChange}
                      rows="2"
                      className="w-full min-w-0 px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                      placeholder="Observaciones generales de la compra"
                    />
                  </div>
                </section>

                <section className="rounded-2xl sm:rounded-3xl border border-slate-100 bg-slate-50 p-4 sm:p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                        <ImageIcon size={22} />
                      </div>

                      <div className="min-w-0">
                        <h3 className="text-lg font-bold text-slate-800">
                          Ticket / comprobante de compra
                        </h3>
                        <p className="text-sm text-slate-500 leading-relaxed">
                          Puedes subir una foto del ticket o tomarla con la cámara de la computadora.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                      <label className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold cursor-pointer transition">
                        <Upload size={18} />
                        Subir imagen
                        <input
                          type="file"
                          accept="image/*"
                          onChange={seleccionarTicket}
                          className="hidden"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={abrirCamara}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-sky-700 text-white hover:bg-sky-800 font-bold cursor-pointer transition"
                      >
                        <Camera size={18} />
                        Tomar foto
                      </button>
                    </div>
                  </div>

                  {ticketPreview && (
                    <div className="mt-5 grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)] gap-4 items-start">
                      <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white">
                        <img
                          src={ticketPreview}
                          alt="Vista previa del ticket"
                          className="w-full h-56 object-cover"
                        />
                      </div>

                      <div className="rounded-2xl bg-white border border-slate-200 p-4 min-w-0">
                        <p className="text-sm text-slate-500">
                          Archivo seleccionado
                        </p>
                        <p className="font-bold text-slate-800 mt-1 break-words">
                          {ticketFile?.name}
                        </p>
                        <p className="text-sm text-slate-500 mt-1">
                          {ticketFile
                            ? `${(ticketFile.size / 1024 / 1024).toFixed(2)} MB`
                            : ''}
                        </p>

                        <button
                          type="button"
                          onClick={quitarTicket}
                          className="mt-4 w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 font-bold transition"
                        >
                          <Trash2 size={17} />
                          Quitar imagen
                        </button>
                      </div>
                    </div>
                  )}
                </section>

                <section>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold text-slate-800">
                        Productos de la compra
                      </h3>
                      <p className="text-sm text-slate-500 leading-relaxed">
                        Opcional. Si capturas productos, se alimentará el inventario automáticamente por lote.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={agregarProducto}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-sky-100 text-sky-800 hover:bg-sky-200 font-bold transition"
                    >
                      <Plus size={17} />
                      Producto
                    </button>
                  </div>

                  <div className="space-y-4">
                    {items.length === 0 && (
                      <div className="rounded-2xl sm:rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                        <Package size={30} className="mx-auto text-slate-400" />
                        <h4 className="font-bold text-slate-700 mt-3">
                          Sin productos capturados
                        </h4>
                        <p className="text-sm text-slate-500 mt-1">
                          Puedes guardar la compra solo con el ticket o agregar productos para actualizar inventario.
                        </p>
                      </div>
                    )}

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
                          className="rounded-2xl sm:rounded-3xl border border-slate-100 bg-slate-50 p-4 sm:p-5"
                        >
                          <div className="flex items-center justify-between gap-3 mb-4">
                            <h4 className="font-bold text-slate-800">
                              Producto #{index + 1}
                            </h4>

                            <button
                              type="button"
                              onClick={() => quitarProducto(index)}
                              className="w-10 h-10 rounded-2xl bg-red-50 text-red-700 hover:bg-red-100 flex items-center justify-center transition shrink-0"
                              title="Quitar producto"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                            <div className="md:col-span-4 min-w-0">
                              <label className="block text-sm font-bold text-slate-700 mb-2">
                                Producto *
                              </label>
                              <select
                                value={item.id_producto}
                                onChange={(e) =>
                                  actualizarItem(index, 'id_producto', e.target.value)
                                }
                                className="w-full min-w-0 px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
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

                            <div className="md:col-span-2 min-w-0">
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
                                className="w-full min-w-0 px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                                placeholder="0"
                              />
                            </div>

                            <div className="md:col-span-2 min-w-0">
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
                                className="w-full min-w-0 px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                                placeholder="0.00"
                              />
                            </div>

                            <div className="md:col-span-2 min-w-0">
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
                                className="w-full min-w-0 px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                                placeholder="0.00"
                              />
                            </div>

                            <div className="md:col-span-2 min-w-0">
                              <label className="block text-sm font-bold text-slate-700 mb-2">
                                Subtotal
                              </label>
                              <div className="px-4 py-3 rounded-2xl bg-white border border-slate-200 font-bold text-sky-700 text-left md:text-right break-words">
                                {formatoMoneda(subtotalItem)}
                              </div>
                            </div>

                            <div className="md:col-span-3 min-w-0">
                              <label className="block text-sm font-bold text-slate-700 mb-2">
                                Lote
                              </label>
                              <input
                                value={item.lote}
                                onChange={(e) =>
                                  actualizarItem(index, 'lote', e.target.value)
                                }
                                className="w-full min-w-0 px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white uppercase"
                                placeholder="Ej. PAR-2027-A"
                              />
                            </div>

                            <div className="md:col-span-3 min-w-0">
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
                                className="w-full min-w-0 px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                              />
                            </div>

                            <div className="md:col-span-6 min-w-0">
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
                                className="w-full min-w-0 px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                                placeholder="Opcional"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  <div className="rounded-2xl bg-slate-50 p-4 min-w-0">
                    <p className="text-sm text-slate-500">Subtotal</p>
                    <p className="text-xl font-bold text-slate-800 break-words">
                      {formatoMoneda(resumenCompra.subtotal)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-red-50 p-4 min-w-0">
                    <p className="text-sm text-red-600">Descuento</p>
                    <p className="text-xl font-bold text-red-700 break-words">
                      -{formatoMoneda(resumenCompra.descuento)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-blue-50 p-4 min-w-0">
                    <p className="text-sm text-blue-600">Impuesto</p>
                    <p className="text-xl font-bold text-blue-700 break-words">
                      {formatoMoneda(resumenCompra.impuesto)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-sky-50 p-4 min-w-0">
                    <p className="text-sm text-sky-600">Total</p>
                    <p className="text-2xl font-bold text-sky-700 break-words">
                      {formatoMoneda(resumenCompra.total)}
                    </p>
                  </div>
                </section>
              </div>

              <div className="px-4 sm:px-6 py-5 flex flex-col sm:flex-row justify-end gap-3 border-t border-slate-100 bg-white shrink-0">
                <button
                  type="button"
                  onClick={cerrarModalCompra}
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
                  {guardando ? 'Guardando...' : 'Guardar compra'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalCamara && (
        <div className="fixed inset-0 z-[60] flex items-start sm:items-center justify-center px-3 sm:px-4 py-4 sm:py-8 overflow-y-auto">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={() => cerrarCamara(true)}
          />

          <div className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden my-auto">
            <div className="px-4 sm:px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-slate-800">
                  Tomar foto del ticket
                </h2>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Alinea el ticket frente a la cámara y captura la imagen.
                </p>
              </div>

              <button
                type="button"
                onClick={() => cerrarCamara(true)}
                className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 sm:p-6">
              {errorCamara ? (
                <div className="rounded-2xl bg-red-50 border border-red-100 p-5 text-red-700 font-semibold">
                  {errorCamara}
                </div>
              ) : (
                <div className="rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-950 border border-slate-200">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full max-h-[62vh] object-contain bg-black"
                  />
                </div>
              )}

              <div className="mt-5 flex flex-col sm:flex-row justify-end gap-3">
                <button
                  type="button"
                  onClick={() => cerrarCamara(true)}
                  className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={capturarFoto}
                  disabled={!camaraActiva || !!errorCamara}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-sky-700 hover:bg-sky-800 text-white font-bold transition disabled:opacity-60"
                >
                  <Camera size={19} />
                  Capturar foto
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalDetalle && detalleCompra && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center px-3 sm:px-4 py-4 sm:py-8 overflow-y-auto">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={cerrarDetalle}
          />

          <div className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-6xl max-h-[92vh] overflow-hidden my-auto">
            <div className="px-4 sm:px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-slate-800">
                  Detalle de compra
                </h2>
                <p className="text-sm text-slate-500 break-words">
                  {detalleCompra.folio}
                </p>
              </div>

              <button
                type="button"
                onClick={cerrarDetalle}
                className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto max-h-[80vh] space-y-6">
              <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="rounded-2xl bg-slate-50 p-4 min-w-0">
                  <p className="text-sm text-slate-500">Proveedor</p>
                  <p className="font-bold text-slate-800 mt-1 break-words">
                    {detalleCompra.proveedor}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 min-w-0">
                  <p className="text-sm text-slate-500">Sucursal</p>
                  <p className="font-bold text-slate-800 mt-1 break-words">
                    {detalleCompra.sucursal}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 min-w-0">
                  <p className="text-sm text-slate-500">Fecha</p>
                  <p className="font-bold text-slate-800 mt-1 break-words">
                    {formatoFecha(detalleCompra.fecha_compra)}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 min-w-0">
                  <p className="text-sm text-slate-500">Estado</p>
                  <p className="font-bold text-slate-800 mt-1">
                    {detalleCompra.estado}
                  </p>
                </div>
              </section>

              <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="rounded-2xl bg-sky-50 p-4 min-w-0">
                  <p className="text-sm text-sky-600">Total</p>
                  <p className="text-2xl font-bold text-sky-700 break-words">
                    {formatoMoneda(detalleCompra.total)}
                  </p>
                </div>

                <div className="rounded-2xl bg-blue-50 p-4 min-w-0">
                  <p className="text-sm text-blue-600">Pagado</p>
                  <p className="text-2xl font-bold text-blue-700 break-words">
                    {formatoMoneda(detalleCompra.monto_pagado)}
                  </p>
                </div>

                <div className="rounded-2xl bg-red-50 p-4 min-w-0">
                  <p className="text-sm text-red-600">Saldo</p>
                  <p className="text-2xl font-bold text-red-700 break-words">
                    {formatoMoneda(detalleCompra.saldo)}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 min-w-0">
                  <p className="text-sm text-slate-500">Método</p>
                  <p className="font-bold text-slate-800 break-words">
                    {detalleCompra.metodo_pago}
                  </p>
                </div>
              </section>

              {detalleCompra.ticket_proveedor_url && (
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <ImageIcon className="text-sky-700 shrink-0" size={22} />
                    <h3 className="text-lg font-bold text-slate-800">
                      Ticket / comprobante
                    </h3>
                  </div>

                  <a
                    href={`${import.meta.env.VITE_API_URL?.replace('/api', '')}${detalleCompra.ticket_proveedor_url}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-sky-50 text-sky-700 hover:bg-sky-100 font-bold transition"
                  >
                    <Eye size={18} />
                    Ver ticket
                  </a>
                </section>
              )}

              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Package className="text-sky-700 shrink-0" size={22} />
                  <h3 className="text-lg font-bold text-slate-800">
                    Productos comprados
                  </h3>
                </div>

                {detalleProductos.length === 0 ? (
                  <div className="rounded-2xl bg-slate-50 p-5 text-center text-slate-500">
                    Esta compra no tiene productos capturados.
                  </div>
                ) : (
                  <>
                    <div className="md:hidden space-y-3">
                      {detalleProductos.map((item) => (
                        <div
                          key={item.id_detalle}
                          className="rounded-2xl border border-slate-100 p-4 bg-white"
                        >
                          <p className="font-bold text-slate-800 break-words">
                            {item.producto}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            Lote: {item.lote || '—'}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            Caducidad:{' '}
                            {item.fecha_caducidad
                              ? new Date(item.fecha_caducidad).toLocaleDateString('es-MX')
                              : 'Sin fecha'}
                          </p>

                          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                            <div className="rounded-xl bg-slate-50 p-3">
                              <p className="text-xs text-slate-500">Cantidad</p>
                              <p className="font-bold text-slate-800">
                                {formatoNumero(item.cantidad)}
                              </p>
                            </div>

                            <div className="rounded-xl bg-slate-50 p-3">
                              <p className="text-xs text-slate-500">Precio</p>
                              <p className="font-bold text-slate-800">
                                {formatoMoneda(item.precio_compra)}
                              </p>
                            </div>

                            <div className="rounded-xl bg-red-50 p-3">
                              <p className="text-xs text-red-700">Desc.</p>
                              <p className="font-bold text-red-700">
                                -{formatoMoneda(item.descuento)}
                              </p>
                            </div>

                            <div className="rounded-xl bg-sky-50 p-3">
                              <p className="text-xs text-sky-700">Subtotal</p>
                              <p className="font-bold text-sky-800">
                                {formatoMoneda(item.subtotal)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-100">
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
                              <td className="px-4 py-3 text-right font-bold text-sky-700">
                                {formatoMoneda(item.subtotal)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </section>

              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Wallet className="text-blue-700 shrink-0" size={22} />
                  <h3 className="text-lg font-bold text-slate-800">
                    Pagos registrados
                  </h3>
                </div>

                {detallePagos.length === 0 ? (
                  <div className="rounded-2xl bg-slate-50 p-5 text-center text-slate-500">
                    Esta compra no tiene pagos registrados.
                  </div>
                ) : (
                  <>
                    <div className="md:hidden space-y-3">
                      {detallePagos.map((pago) => (
                        <div
                          key={pago.id_pago}
                          className="rounded-2xl border border-slate-100 p-4 bg-white"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-bold text-slate-800">
                                {pago.metodo_pago}
                              </p>
                              <p className="text-xs text-slate-500 mt-1">
                                {formatoFecha(pago.fecha_pago)}
                              </p>
                            </div>

                            <p className="font-bold text-blue-700 text-right shrink-0">
                              {formatoMoneda(pago.monto)}
                            </p>
                          </div>

                          <div className="mt-4 grid grid-cols-1 gap-3">
                            <div className="rounded-xl bg-slate-50 p-3">
                              <p className="text-xs text-slate-500">Usuario</p>
                              <p className="font-semibold text-slate-700 break-words">
                                {pago.usuario || '—'}
                              </p>
                            </div>

                            <div className="rounded-xl bg-slate-50 p-3">
                              <p className="text-xs text-slate-500">Referencia</p>
                              <p className="font-semibold text-slate-700 break-words">
                                {pago.referencia || '—'}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-100">
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
                  </>
                )}
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}