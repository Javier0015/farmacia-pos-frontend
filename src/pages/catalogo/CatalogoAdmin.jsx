import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import {
  Plus,
  Search,
  RefreshCw,
  ImagePlus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Star,
  StarOff,
  Package,
  X,
  Save,
  Pill,
  AlertTriangle,
  Share2,
  Globe2,
  MessageCircle,
  MapPin,
  ExternalLink,
  CheckCircle2,
  Loader2,
  Phone,
} from 'lucide-react';
import api from '../../api/axios';

const formatearPrecio = (valor) => {
  const numero = Number(valor || 0);

  return numero.toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
  });
};

const estadoInicialFormulario = {
  id_catalogo: null,
  id_producto: '',
  titulo_catalogo: '',
  descripcion_catalogo: '',
  advertencias: '',
  indicaciones: '',
  modo_uso: '',
  activo: true,
  destacado: false,
  mostrar_stock: true,
  orden: 0,
  imagen: null,
  imagen_preview: '',
  imagen_url_actual: '',
};


const configuracionRedes = {
  FACEBOOK: {
    abreviatura: 'f',
    claseIcono: 'bg-blue-50 text-blue-700 border-blue-100',
    placeholder: 'https://www.facebook.com/tu-pagina',
  },
  INSTAGRAM: {
    abreviatura: 'IG',
    claseIcono: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100',
    placeholder: 'https://www.instagram.com/tu-cuenta',
  },
  WHATSAPP: {
    abreviatura: 'WA',
    claseIcono: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    placeholder: 'https://wa.me/5215555555555',
  },
  TIKTOK: {
    abreviatura: 'TT',
    claseIcono: 'bg-slate-100 text-slate-800 border-slate-200',
    placeholder: 'https://www.tiktok.com/@tu-cuenta',
  },
  X: {
    abreviatura: 'X',
    claseIcono: 'bg-slate-100 text-slate-900 border-slate-200',
    placeholder: 'https://x.com/tu-cuenta',
  },
  YOUTUBE: {
    abreviatura: 'YT',
    claseIcono: 'bg-red-50 text-red-700 border-red-100',
    placeholder: 'https://www.youtube.com/@tu-canal',
  },
};

const obtenerConfiguracionRed = (clave) => {
  return (
    configuracionRedes[clave] || {
      abreviatura: 'WEB',
      claseIcono: 'bg-slate-100 text-slate-700 border-slate-200',
      placeholder: 'https://ejemplo.com',
    }
  );
};

const IconoRedSocial = ({ clave, size = 20 }) => {
  if (clave === 'WHATSAPP') return <MessageCircle size={size} />;
  if (clave === 'GOOGLE_MAPS') return <MapPin size={size} />;
  if (clave === 'FACEBOOK' || clave === 'INSTAGRAM') return <Globe2 size={size} />;
  return <Share2 size={size} />;
};

export default function CatalogoAdmin() {
  const [catalogo, setCatalogo] = useState([]);
  const [productosDisponibles, setProductosDisponibles] = useState([]);

  const [busqueda, setBusqueda] = useState('');
  const [busquedaProducto, setBusquedaProducto] = useState('');

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [formulario, setFormulario] = useState(estadoInicialFormulario);

  const [modalRedesAbierto, setModalRedesAbierto] = useState(false);
  const [redesSociales, setRedesSociales] = useState([]);
  const [cargandoRedes, setCargandoRedes] = useState(false);
  const [guardandoRedes, setGuardandoRedes] = useState(false);

  const [sucursalesWhatsapp, setSucursalesWhatsapp] = useState([]);
  const [cargandoSucursalesWhatsapp, setCargandoSucursalesWhatsapp] = useState(false);

  const cargarCatalogo = async () => {
    try {
      setCargando(true);

      const { data } = await api.get('/catalogo');

      if (data.ok) {
        setCatalogo(data.catalogo || []);
      }
    } catch (error) {
      console.error('Error al cargar catálogo:', error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.mensaje || 'No se pudo cargar el catálogo',
      });
    } finally {
      setCargando(false);
    }
  };

  const cargarProductosDisponibles = async () => {
    try {
      const { data } = await api.get('/catalogo/productos-disponibles');

      if (data.ok) {
        setProductosDisponibles(data.productos || []);
      }
    } catch (error) {
      console.error('Error al cargar productos disponibles:', error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudieron cargar los productos disponibles',
      });
    }
  };

  useEffect(() => {
    cargarCatalogo();
    cargarProductosDisponibles();
  }, []);


  const cargarRedesSociales = async () => {
    try {
      setCargandoRedes(true);

      const { data } = await api.get('/catalogo/redes-sociales');

      if (data.ok) {
        setRedesSociales(data.redes_sociales || []);
      }
    } catch (error) {
      console.error('Error al cargar redes sociales:', error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudieron cargar las redes sociales del catálogo.',
      });
    } finally {
      setCargandoRedes(false);
    }
  };

  const cargarSucursalesWhatsapp = async () => {
    try {
      setCargandoSucursalesWhatsapp(true);

      const { data } = await api.get('/catalogo/sucursales-whatsapp');

      if (data.ok) {
        setSucursalesWhatsapp(data.sucursales || []);
      } else {
        setSucursalesWhatsapp([]);
      }
    } catch (error) {
      console.error('Error al cargar sucursales de WhatsApp:', error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudieron cargar las sucursales para WhatsApp.',
      });
    } finally {
      setCargandoSucursalesWhatsapp(false);
    }
  };

  const abrirModalRedes = async () => {
    setModalRedesAbierto(true);
    await Promise.all([cargarRedesSociales(), cargarSucursalesWhatsapp()]);
  };

  const cerrarModalRedes = () => {
    if (guardandoRedes) return;

    setModalRedesAbierto(false);
    setRedesSociales([]);
    setSucursalesWhatsapp([]);
  };

  const actualizarRedSocialLocal = (idRedSocial, campo, valor) => {
    setRedesSociales((prev) =>
      prev.map((red) =>
        Number(red.id_red_social) === Number(idRedSocial)
          ? { ...red, [campo]: valor }
          : red
      )
    );
  };

  const actualizarSucursalWhatsappLocal = (idSucursal, valor) => {
    setSucursalesWhatsapp((prev) =>
      prev.map((sucursal) =>
        Number(sucursal.id_sucursal) === Number(idSucursal)
          ? { ...sucursal, mostrar_whatsapp_catalogo: valor }
          : sucursal
      )
    );
  };

  const guardarRedesSociales = async () => {
    const redesActivasSinUrl = redesSociales.filter(
      (red) =>
        red.clave !== 'WHATSAPP' &&
        red.activo &&
        !String(red.url || '').trim()
    );

    if (redesActivasSinUrl.length > 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Faltan enlaces',
        text: `Captura un enlace válido para: ${redesActivasSinUrl
          .map((red) => red.nombre)
          .join(', ')}.`,
      });
      return;
    }

    try {
      setGuardandoRedes(true);

      for (const red of redesSociales) {
        const { data } = await api.put(
          `/catalogo/redes-sociales/${red.id_red_social}`,
          {
            url:
              red.clave === 'WHATSAPP'
                ? null
                : String(red.url || '').trim() || null,
            activo: Boolean(red.activo),
            orden:
              red.orden === '' || red.orden === null || red.orden === undefined
                ? 0
                : Number(red.orden),
          }
        );

        if (!data?.ok) {
          throw new Error(
            data?.mensaje || `No se pudo guardar ${red.nombre}.`
          );
        }
      }

      for (const sucursal of sucursalesWhatsapp) {
        const { data } = await api.put(
          `/catalogo/sucursales-whatsapp/${sucursal.id_sucursal}`,
          {
            mostrar_whatsapp_catalogo: Boolean(
              sucursal.mostrar_whatsapp_catalogo
            ),
          }
        );

        if (!data?.ok) {
          throw new Error(
            data?.mensaje ||
            `No se pudo actualizar la sucursal ${sucursal.nombre}.`
          );
        }
      }

      await Promise.all([cargarRedesSociales(), cargarSucursalesWhatsapp()]);

      Swal.fire({
        icon: 'success',
        title: 'Redes sociales actualizadas',
        text: 'La configuración de redes y sucursales se guardó correctamente.',
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error('Error al guardar redes sociales:', error);

      Swal.fire({
        icon: 'error',
        title: 'No se pudo guardar',
        text:
          error.response?.data?.mensaje ||
          error.message ||
          'No se pudieron actualizar las redes sociales.',
      });
    } finally {
      setGuardandoRedes(false);
    }
  };

  const catalogoFiltrado = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    if (!texto) return catalogo;

    return catalogo.filter((item) => {
      return (
        item.titulo_catalogo?.toLowerCase().includes(texto) ||
        item.nombre_producto?.toLowerCase().includes(texto) ||
        item.codigo_barras?.toLowerCase().includes(texto) ||
        item.nombre_categoria?.toLowerCase().includes(texto) ||
        item.laboratorio?.toLowerCase().includes(texto)
      );
    });
  }, [catalogo, busqueda]);

  const productosFiltrados = useMemo(() => {
    const texto = busquedaProducto.trim().toLowerCase();

    if (!texto) return productosDisponibles;

    return productosDisponibles.filter((producto) => {
      return (
        producto.nombre?.toLowerCase().includes(texto) ||
        producto.codigo_barras?.toLowerCase().includes(texto) ||
        producto.nombre_categoria?.toLowerCase().includes(texto) ||
        producto.laboratorio?.toLowerCase().includes(texto) ||
        producto.presentacion?.toLowerCase().includes(texto)
      );
    });
  }, [productosDisponibles, busquedaProducto]);

  const abrirModalNuevo = () => {
    setModoEdicion(false);
    setFormulario(estadoInicialFormulario);
    setBusquedaProducto('');
    setModalAbierto(true);
  };

  const abrirModalEditar = (producto) => {
    setModoEdicion(true);

    setFormulario({
      id_catalogo: producto.id_catalogo,
      id_producto: producto.id_producto,
      titulo_catalogo: producto.titulo_catalogo || '',
      descripcion_catalogo: producto.descripcion_catalogo || '',
      advertencias: producto.advertencias || '',
      indicaciones: producto.indicaciones || '',
      modo_uso: producto.modo_uso || '',
      activo: producto.activo === true,
      destacado: producto.destacado === true,
      mostrar_stock: producto.mostrar_stock === true,
      orden: producto.orden || 0,
      imagen: null,
      imagen_preview: '',
      imagen_url_actual: producto.imagen_url || '',
    });

    setBusquedaProducto('');
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    if (guardando) return;

    setModalAbierto(false);
    setModoEdicion(false);
    setFormulario(estadoInicialFormulario);
  };

  const manejarCambio = (campo, valor) => {
    setFormulario((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  };

  const manejarImagen = (e) => {
    const archivo = e.target.files?.[0];

    if (!archivo) return;

    if (!archivo.type.startsWith('image/')) {
      Swal.fire({
        icon: 'warning',
        title: 'Archivo no válido',
        text: 'Selecciona una imagen válida.',
      });
      return;
    }

    setFormulario((prev) => ({
      ...prev,
      imagen: archivo,
      imagen_preview: URL.createObjectURL(archivo),
    }));
  };

  const seleccionarProducto = (producto) => {
    if (modoEdicion) return;

    if (producto.ya_en_catalogo) {
      Swal.fire({
        icon: 'info',
        title: 'Producto ya agregado',
        text: 'Este producto ya forma parte del catálogo.',
      });
      return;
    }

    setFormulario((prev) => ({
      ...prev,
      id_producto: producto.id_producto,
      titulo_catalogo: producto.nombre || '',
      descripcion_catalogo: producto.descripcion || '',
    }));
  };

  const productoSeleccionado = useMemo(() => {
    return productosDisponibles.find(
      (producto) => Number(producto.id_producto) === Number(formulario.id_producto)
    );
  }, [productosDisponibles, formulario.id_producto]);

  const guardarProductoCatalogo = async (e) => {
    e.preventDefault();

    if (!formulario.id_producto) {
      Swal.fire({
        icon: 'warning',
        title: 'Producto obligatorio',
        text: 'Selecciona un producto del inventario.',
      });
      return;
    }

    try {
      setGuardando(true);

      const formData = new FormData();

      formData.append('id_producto', formulario.id_producto);
      formData.append('titulo_catalogo', formulario.titulo_catalogo);
      formData.append('descripcion_catalogo', formulario.descripcion_catalogo);
      formData.append('advertencias', formulario.advertencias);
      formData.append('indicaciones', formulario.indicaciones);
      formData.append('modo_uso', formulario.modo_uso);
      formData.append('activo', formulario.activo);
      formData.append('destacado', formulario.destacado);
      formData.append('mostrar_stock', formulario.mostrar_stock);
      formData.append('orden', formulario.orden || 0);

      if (formulario.imagen) {
        formData.append('imagen', formulario.imagen);
      }

      if (modoEdicion) {
        await api.put(`/catalogo/${formulario.id_catalogo}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        Swal.fire({
          icon: 'success',
          title: 'Actualizado',
          text: 'Producto actualizado en el catálogo.',
          timer: 1600,
          showConfirmButton: false,
        });
      } else {
        await api.post('/catalogo', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        Swal.fire({
          icon: 'success',
          title: 'Agregado',
          text: 'Producto agregado al catálogo.',
          timer: 1600,
          showConfirmButton: false,
        });
      }

      cerrarModal();
      await cargarCatalogo();
      await cargarProductosDisponibles();
    } catch (error) {
      console.error('Error al guardar producto:', error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudo guardar el producto en el catálogo.',
      });
    } finally {
      setGuardando(false);
    }
  };

  const cambiarEstado = async (producto) => {
    try {
      const nuevoEstado = !producto.activo;

      await api.patch(`/catalogo/${producto.id_catalogo}/estado`, {
        activo: nuevoEstado,
      });

      await cargarCatalogo();

      Swal.fire({
        icon: 'success',
        title: nuevoEstado ? 'Producto activado' : 'Producto desactivado',
        timer: 1300,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error('Error al cambiar estado:', error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudo cambiar el estado del producto.',
      });
    }
  };

  const eliminarProducto = async (producto) => {
    const confirmacion = await Swal.fire({
      icon: 'warning',
      title: '¿Eliminar del catálogo?',
      text: `Se eliminará "${producto.titulo_catalogo || producto.nombre_producto}" del catálogo público.`,
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
    });

    if (!confirmacion.isConfirmed) return;

    try {
      await api.delete(`/catalogo/${producto.id_catalogo}`);

      await cargarCatalogo();
      await cargarProductosDisponibles();

      Swal.fire({
        icon: 'success',
        title: 'Eliminado',
        text: 'Producto eliminado del catálogo.',
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error('Error al eliminar producto:', error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudo eliminar el producto del catálogo.',
      });
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <style>
        {`
        .swal2-container {
          z-index: 10050 !important;
        }
      `}
      </style>

      {/* Header */}
      <section className="bg-gradient-to-br from-sky-700 via-sky-600 to-cyan-500 rounded-[2rem] p-6 lg:p-8 text-white shadow-sm overflow-hidden relative">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-20 w-80 h-80 bg-cyan-200/20 rounded-full blur-3xl" />

        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/15 border border-white/20 rounded-2xl px-4 py-2 text-sm font-bold">
              <Pill size={18} />
              Catálogo digital
            </div>

            <h1 className="mt-4 text-3xl lg:text-4xl font-black">
              Administración del catálogo
            </h1>

            <p className="mt-2 text-sky-50 max-w-2xl">
              Agrega productos desde tu inventario, sube imágenes, configura información pública y controla qué aparece en el catálogo digital.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <button
              type="button"
              onClick={abrirModalRedes}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-950/20 hover:bg-slate-950/30 border border-white/25 text-white font-black transition"
            >
              <Share2 size={20} />
              Redes y contacto
            </button>

            <button
              type="button"
              onClick={abrirModalNuevo}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white text-sky-700 hover:bg-sky-50 font-black shadow-lg transition"
            >
              <Plus size={20} />
              Agregar producto
            </button>
          </div>
        </div>
      </section>

      {/* KPIs */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
          <p className="text-sm font-bold text-slate-500">Productos en catálogo</p>
          <p className="mt-2 text-3xl font-black text-slate-900">
            {catalogo.length}
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
          <p className="text-sm font-bold text-slate-500">Activos</p>
          <p className="mt-2 text-3xl font-black text-emerald-600">
            {catalogo.filter((item) => item.activo).length}
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
          <p className="text-sm font-bold text-slate-500">Destacados</p>
          <p className="mt-2 text-3xl font-black text-amber-500">
            {catalogo.filter((item) => item.destacado).length}
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
          <p className="text-sm font-bold text-slate-500">Con oferta activa</p>
          <p className="mt-2 text-3xl font-black text-red-600">
            {catalogo.filter((item) => item.tiene_oferta).length}
          </p>
        </div>
      </section>

      {/* Filtros */}
      <section className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="relative flex-1">
            <Search
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por producto, categoría, código o laboratorio..."
              className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold text-slate-700"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              cargarCatalogo();
              cargarProductosDisponibles();
              if (modalRedesAbierto) {
                cargarRedesSociales();
                cargarSucursalesWhatsapp();
              }
            }}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black transition"
          >
            <RefreshCw size={19} />
            Actualizar
          </button>
        </div>
      </section>

      {/* Tabla */}
      <section className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-slate-900">
              Productos publicados
            </h2>
            <p className="text-sm text-slate-500 font-semibold">
              {catalogoFiltrado.length} resultado(s)
            </p>
          </div>
        </div>

        {cargando ? (
          <div className="py-16 flex flex-col items-center justify-center text-slate-500">
            <RefreshCw size={34} className="animate-spin text-sky-600" />
            <p className="mt-3 font-bold">Cargando catálogo...</p>
          </div>
        ) : catalogoFiltrado.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto w-20 h-20 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center">
              <Package size={42} />
            </div>
            <h3 className="mt-4 text-xl font-black text-slate-900">
              Sin productos en catálogo
            </h3>
            <p className="mt-1 text-slate-500">
              Agrega productos para que aparezcan en el catálogo público.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1050px] w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-5 py-4 font-black text-slate-600">
                    Producto
                  </th>
                  <th className="text-left px-5 py-4 font-black text-slate-600">
                    Categoría
                  </th>
                  <th className="text-left px-5 py-4 font-black text-slate-600">
                    Precio
                  </th>
                  <th className="text-left px-5 py-4 font-black text-slate-600">
                    Oferta
                  </th>
                  <th className="text-left px-5 py-4 font-black text-slate-600">
                    Estado
                  </th>
                  <th className="text-left px-5 py-4 font-black text-slate-600">
                    Opciones
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {catalogoFiltrado.map((producto) => {
                  const nombre =
                    producto.titulo_catalogo || producto.nombre_producto;

                  return (
                    <tr key={producto.id_catalogo} className="hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-2xl bg-sky-50 border border-slate-100 flex items-center justify-center overflow-hidden">
                            {producto.imagen_url ? (
                              <img
                                src={producto.imagen_url}
                                alt={nombre}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <Pill size={26} className="text-sky-600" />
                            )}
                          </div>

                          <div>
                            <p className="font-black text-slate-900">
                              {nombre}
                            </p>
                            <p className="text-xs text-slate-500 font-semibold">
                              {producto.codigo_barras || 'Sin código'}
                            </p>
                            <p className="text-xs text-slate-400">
                              {producto.presentacion || 'Sin presentación'}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex px-3 py-1 rounded-xl bg-sky-50 text-sky-700 border border-sky-100 text-xs font-black">
                          {producto.nombre_categoria || 'Sin categoría'}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        {producto.tiene_oferta ? (
                          <div>
                            <p className="text-xs text-slate-400 line-through font-bold">
                              {formatearPrecio(producto.precio_venta)}
                            </p>
                            <p className="font-black text-red-600">
                              {formatearPrecio(producto.precio_final)}
                            </p>
                          </div>
                        ) : (
                          <p className="font-black text-sky-700">
                            {formatearPrecio(producto.precio_venta)}
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {producto.tiene_oferta ? (
                          <span className="inline-flex px-3 py-1 rounded-xl bg-red-50 text-red-700 border border-red-100 text-xs font-black">
                            -{Number(producto.porcentaje_descuento || 0)}%
                          </span>
                        ) : (
                          <span className="text-slate-400 font-semibold">
                            Sin oferta
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          {producto.activo ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-black">
                              <Eye size={13} />
                              Visible
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-slate-100 text-slate-500 border border-slate-200 text-xs font-black">
                              <EyeOff size={13} />
                              Oculto
                            </span>
                          )}

                          {producto.destacado && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-amber-50 text-amber-700 border border-amber-100 text-xs font-black">
                              <Star size={13} />
                              Destacado
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => abrirModalEditar(producto)}
                            className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-100 flex items-center justify-center transition"
                            title="Editar"
                          >
                            <Pencil size={17} />
                          </button>

                          <button
                            type="button"
                            onClick={() => cambiarEstado(producto)}
                            className="w-9 h-9 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100 flex items-center justify-center transition"
                            title={producto.activo ? 'Ocultar' : 'Mostrar'}
                          >
                            {producto.activo ? (
                              <EyeOff size={17} />
                            ) : (
                              <Eye size={17} />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => eliminarProducto(producto)}
                            className="w-9 h-9 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 flex items-center justify-center transition"
                            title="Eliminar"
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modal redes sociales */}
      {modalRedesAbierto && (
        <div className="fixed inset-0 z-[9998] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-5xl max-h-[92vh] overflow-y-auto bg-white rounded-[2rem] shadow-2xl">
            <div className="sticky top-0 z-20 bg-white border-b border-slate-100 p-5 flex items-start justify-between gap-4 rounded-t-[2rem]">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 rounded-2xl bg-sky-50 border border-sky-100 px-3 py-2 text-sm font-black text-sky-700">
                  <Share2 size={18} />
                  Redes sociales y contacto
                </div>
                <h2 className="mt-3 text-2xl font-black text-slate-900">
                  Configuración pública del catálogo
                </h2>
                <p className="mt-1 text-sm text-slate-500 font-semibold">
                  Captura el enlace de cada red y activa únicamente los botones que deseas mostrar a tus clientes.
                </p>
              </div>

              <button
                type="button"
                onClick={cerrarModalRedes}
                disabled={guardandoRedes}
                className="w-11 h-11 rounded-2xl bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 flex items-center justify-center transition disabled:opacity-60 shrink-0"
                title="Cerrar"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-5 lg:p-6">
              <div className="mb-5 rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3 text-amber-800">
                <AlertTriangle size={21} className="mt-0.5 shrink-0" />
                <p className="text-sm font-semibold leading-relaxed">
                  Una red solo se mostrará en el catálogo público cuando tenga un enlace válido y esté marcada como visible.
                </p>
              </div>

              {cargandoRedes ? (
                <div className="py-16 flex flex-col items-center justify-center text-slate-500">
                  <Loader2 size={34} className="animate-spin text-sky-600" />
                  <p className="mt-3 font-bold">Cargando redes sociales...</p>
                </div>
              ) : redesSociales.length === 0 ? (
                <div className="rounded-3xl bg-slate-50 border border-slate-100 px-5 py-10 text-center">
                  <Share2 size={38} className="mx-auto text-slate-400" />
                  <p className="mt-3 font-black text-slate-700">
                    No hay redes sociales configuradas.
                  </p>

                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {redesSociales.map((red) => {
                    const configuracion = obtenerConfiguracionRed(red.clave);
                    const tieneUrl = Boolean(String(red.url || '').trim());
                    const esWhatsapp = red.clave === 'WHATSAPP';
                    const tieneSucursalWhatsappVisible = sucursalesWhatsapp.some(
                      (sucursal) =>
                        sucursal.activo &&
                        sucursal.telefono_valido &&
                        sucursal.mostrar_whatsapp_catalogo
                    );
                    const redListaParaMostrarse = esWhatsapp
                      ? tieneSucursalWhatsappVisible
                      : tieneUrl;

                    return (
                      <article
                        key={red.id_red_social}
                        className={`rounded-3xl border p-4 transition ${red.activo
                            ? 'border-sky-200 bg-sky-50/40'
                            : 'border-slate-200 bg-white'
                          }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-11 h-11 rounded-2xl border flex items-center justify-center font-black text-xs shrink-0 ${configuracion.claseIcono}`}
                            >
                              {red.clave === 'WHATSAPP' || red.clave === 'GOOGLE_MAPS' ? (
                                <IconoRedSocial clave={red.clave} size={21} />
                              ) : (
                                configuracion.abreviatura
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="font-black text-slate-900 truncate">
                                {red.nombre}
                              </p>
                              <p className="text-xs text-slate-500 font-semibold truncate">
                                {red.clave}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              actualizarRedSocialLocal(
                                red.id_red_social,
                                'activo',
                                !red.activo
                              )
                            }
                            disabled={guardandoRedes}
                            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-black transition disabled:opacity-60 ${red.activo
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                              }`}
                          >
                            {red.activo ? <CheckCircle2 size={16} /> : <EyeOff size={16} />}
                            {red.activo ? 'Visible' : 'Oculto'}
                          </button>
                        </div>

                        {red.clave === 'WHATSAPP' ? (
                          <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                            <p className="text-sm font-black text-emerald-800">
                              Enlace dinámico por sucursal
                            </p>
                            <p className="mt-1 text-xs font-semibold leading-relaxed text-emerald-700">
                              El catálogo generará los enlaces usando el teléfono de cada sucursal habilitada en la sección inferior.
                            </p>
                          </div>
                        ) : (
                          <label className="block mt-4">
                            <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                              Enlace público
                            </span>
                            <div className="relative mt-1.5">
                              <Globe2
                                size={18}
                                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                              />
                              <input
                                type="url"
                                value={red.url || ''}
                                onChange={(e) =>
                                  actualizarRedSocialLocal(
                                    red.id_red_social,
                                    'url',
                                    e.target.value
                                  )
                                }
                                disabled={guardandoRedes}
                                placeholder={configuracion.placeholder}
                                className="w-full pl-10 pr-11 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm font-semibold text-slate-700 disabled:bg-slate-100 disabled:cursor-not-allowed"
                              />

                              {tieneUrl && (
                                <a
                                  href={red.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-100 flex items-center justify-center transition"
                                  title="Abrir enlace"
                                >
                                  <ExternalLink size={16} />
                                </a>
                              )}
                            </div>
                          </label>
                        )}

                        <div className="mt-4 flex items-end justify-between gap-3">
                          <label className="block w-28">
                            <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                              Orden
                            </span>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={red.orden ?? 0}
                              onChange={(e) =>
                                actualizarRedSocialLocal(
                                  red.id_red_social,
                                  'orden',
                                  e.target.value
                                )
                              }
                              disabled={guardandoRedes}
                              className="mt-1.5 w-full px-3 py-2.5 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-black text-slate-700 disabled:bg-slate-100"
                            />
                          </label>

                          <div className="text-right">
                            <p className="text-xs font-black text-slate-500">Estado público</p>
                            <p className={`mt-1 text-sm font-black ${red.activo && redListaParaMostrarse ? 'text-emerald-700' : 'text-slate-400'}`}>
                              {red.activo && redListaParaMostrarse
                                ? 'Se mostrará'
                                : 'No se mostrará'}
                            </p>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}

              {redesSociales.some((red) => red.clave === 'WHATSAPP') && (
                <section className="mt-5 rounded-[1.75rem] border border-emerald-100 bg-emerald-50/40 p-4 lg:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
                        <MessageCircle size={21} />
                      </div>
                      <div>
                        <h3 className="font-black text-slate-900">
                          Sucursales disponibles para WhatsApp
                        </h3>
                        <p className="mt-1 text-sm font-semibold leading-relaxed text-slate-600">
                          Activa las sucursales que podrán elegir los clientes. El enlace se genera con el teléfono registrado en cada sucursal.
                        </p>
                      </div>
                    </div>

                    <span className="inline-flex w-fit items-center rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-black text-emerald-700">
                      {sucursalesWhatsapp.filter((sucursal) => sucursal.mostrar_whatsapp_catalogo).length} visible(s)
                    </span>
                  </div>

                  {cargandoSucursalesWhatsapp ? (
                    <div className="py-10 flex flex-col items-center justify-center text-slate-500">
                      <Loader2 size={30} className="animate-spin text-emerald-600" />
                      <p className="mt-3 text-sm font-bold">Cargando sucursales...</p>
                    </div>
                  ) : sucursalesWhatsapp.length === 0 ? (
                    <div className="mt-4 rounded-2xl border border-dashed border-emerald-200 bg-white/80 px-4 py-7 text-center text-sm font-semibold text-slate-500">
                      No hay sucursales registradas para configurar.
                    </div>
                  ) : (
                    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                      {sucursalesWhatsapp.map((sucursal) => {
                        const puedeMostrarse = Boolean(
                          sucursal.activo && sucursal.telefono_valido
                        );
                        const estaVisible = Boolean(
                          sucursal.mostrar_whatsapp_catalogo
                        );


                        return (
                          <article
                            key={sucursal.id_sucursal}
                            className={`rounded-2xl border p-4 transition ${estaVisible
                                ? 'border-emerald-200 bg-white shadow-sm'
                                : 'border-emerald-100 bg-white/70'
                              }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="font-black text-slate-900">
                                  {sucursal.nombre}
                                </p>
                                <p className="mt-0.5 text-xs font-bold text-slate-500">
                                  {sucursal.clave || 'Sin clave'}
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  actualizarSucursalWhatsappLocal(
                                    sucursal.id_sucursal,
                                    !estaVisible
                                  )
                                }
                                disabled={guardandoRedes || !puedeMostrarse}
                                className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-55 ${estaVisible
                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                    : 'border-slate-200 bg-slate-100 text-slate-500 hover:bg-slate-200'
                                  }`}
                              >
                                {estaVisible ? <CheckCircle2 size={16} /> : <EyeOff size={16} />}
                                {estaVisible ? 'Visible' : 'Oculto'}
                              </button>
                            </div>

                            <div className="mt-3 space-y-2 text-sm">
                              <div className="flex items-start gap-2 text-slate-600">
                                <MapPin size={16} className="mt-0.5 shrink-0 text-sky-600" />
                                <span className="whitespace-pre-line font-semibold">
                                  {sucursal.direccion || 'Sin dirección capturada'}
                                </span>
                              </div>

                              {sucursal.url_google_maps ? (
                                <a
                                  href={sucursal.url_google_maps}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="mt-3 inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-black text-sky-700 hover:bg-sky-100"
                                >
                                  <MapPin size={15} />
                                  Ver ubicación configurada
                                </a>
                              ) : (
                                <p className="mt-3 text-xs font-bold text-slate-400">
                                  Sin ubicación de Google Maps.
                                </p>
                              )}

                              <div className="flex items-center gap-2 text-slate-600">
                                <Phone size={16} className="shrink-0 text-emerald-600" />
                                <span className="font-semibold">
                                  {sucursal.telefono || 'Sin teléfono capturado'}
                                </span>
                              </div>
                            </div>

                            {!sucursal.activo ? (
                              <p className="mt-3 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-500">
                                Esta sucursal está inactiva y no puede mostrarse.
                              </p>
                            ) : !sucursal.telefono_valido ? (
                              <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700">
                                Captura un teléfono mexicano válido de 10 dígitos en la sucursal para poder habilitarla.
                              </p>
                            ) : (
                              <p className="mt-3 text-xs font-bold text-emerald-700">
                                El cliente verá esta sucursal en el selector de WhatsApp.
                              </p>
                            )}
                          </article>
                        );
                      })}
                    </div>
                  )}
                </section>
              )}

              <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3 border-t border-slate-100 pt-5">                <button
                type="button"
                onClick={cerrarModalRedes}
                disabled={guardandoRedes}
                className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black transition disabled:opacity-60"
              >
                Cerrar
              </button>

                <button
                  type="button"
                  onClick={guardarRedesSociales}
                  disabled={guardandoRedes || cargandoRedes || redesSociales.length === 0}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-black shadow-lg shadow-sky-900/20 transition disabled:opacity-60"
                >
                  {guardandoRedes ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save size={20} />
                      Guardar redes sociales
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {modalAbierto && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="catalogo-modal-scroll w-full max-w-6xl max-h-[92vh] overflow-y-auto bg-white rounded-[2rem] shadow-2xl">
            <div className="sticky top-0 z-20 bg-white border-b border-slate-100 p-5 flex items-center justify-between rounded-t-[2rem]">
              <div>
                <h2 className="text-2xl font-black text-slate-900">
                  {modoEdicion ? 'Editar producto del catálogo' : 'Agregar producto al catálogo'}
                </h2>
                <p className="text-sm text-slate-500 font-semibold">
                  Selecciona un producto del inventario y configura su información pública.
                </p>
              </div>

              <button
                type="button"
                onClick={cerrarModal}
                className="w-11 h-11 rounded-2xl bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 flex items-center justify-center transition"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={guardarProductoCatalogo} className="p-5 lg:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-6">
                {/* Selector de producto */}
                <section className="space-y-4">
                  <div className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                    <h3 className="font-black text-slate-900">
                      Producto del inventario
                    </h3>

                    {!modoEdicion && (
                      <div className="relative mt-4">
                        <Search
                          size={19}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                          type="text"
                          value={busquedaProducto}
                          onChange={(e) => setBusquedaProducto(e.target.value)}
                          placeholder="Buscar producto..."
                          className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold"
                        />
                      </div>
                    )}

                    <div className="mt-4 max-h-[430px] overflow-y-auto catalogo-modal-scroll space-y-2 pr-1">
                      {modoEdicion && productoSeleccionado ? (
                        <div className="rounded-2xl border-2 border-sky-300 bg-white p-4">
                          <p className="font-black text-slate-900">
                            {productoSeleccionado.nombre}
                          </p>
                          <p className="text-sm text-slate-500">
                            {productoSeleccionado.codigo_barras}
                          </p>
                          <p className="text-sm text-sky-700 font-black mt-1">
                            {formatearPrecio(productoSeleccionado.precio_venta)}
                          </p>
                        </div>
                      ) : (
                        productosFiltrados.map((producto) => {
                          const seleccionado =
                            Number(producto.id_producto) ===
                            Number(formulario.id_producto);

                          return (
                            <button
                              key={producto.id_producto}
                              type="button"
                              disabled={producto.ya_en_catalogo}
                              onClick={() => seleccionarProducto(producto)}
                              className={`w-full text-left rounded-2xl border p-4 transition ${seleccionado
                                  ? 'border-sky-400 bg-sky-50'
                                  : producto.ya_en_catalogo
                                    ? 'border-slate-200 bg-slate-100 opacity-60 cursor-not-allowed'
                                    : 'border-slate-200 bg-white hover:border-sky-300 hover:bg-sky-50'
                                }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-black text-slate-900">
                                    {producto.nombre}
                                  </p>
                                  <p className="text-xs text-slate-500 font-semibold">
                                    {producto.codigo_barras || 'Sin código'}
                                  </p>
                                  <p className="text-xs text-slate-400">
                                    {producto.nombre_categoria || 'Sin categoría'}
                                  </p>
                                </div>

                                <div className="text-right">
                                  <p className="font-black text-sky-700">
                                    {formatearPrecio(producto.precio_venta)}
                                  </p>

                                  {producto.ya_en_catalogo ? (
                                    <span className="mt-1 inline-flex text-[11px] px-2 py-1 rounded-lg bg-slate-200 text-slate-600 font-black">
                                      Ya agregado
                                    </span>
                                  ) : (
                                    <span className="mt-1 inline-flex text-[11px] px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-black">
                                      Disponible
                                    </span>
                                  )}
                                </div>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                </section>

                {/* Formulario */}
                <section className="space-y-4">
                  {productoSeleccionado && (
                    <div className="rounded-3xl bg-sky-50 border border-sky-100 p-4">
                      <p className="text-xs font-black uppercase tracking-wide text-sky-700">
                        Producto seleccionado
                      </p>
                      <h3 className="mt-1 text-xl font-black text-slate-900">
                        {productoSeleccionado.nombre}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {productoSeleccionado.presentacion || 'Sin presentación'} ·{' '}
                        {productoSeleccionado.nombre_categoria || 'Sin categoría'}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="space-y-1 md:col-span-2">
                      <span className="text-sm font-black text-slate-700">
                        Título público
                      </span>
                      <input
                        type="text"
                        value={formulario.titulo_catalogo}
                        onChange={(e) =>
                          manejarCambio('titulo_catalogo', e.target.value)
                        }
                        placeholder="Ej. Paracetamol 500mg, 20 tabletas"
                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold"
                      />
                    </label>

                    <label className="space-y-1 md:col-span-2">
                      <span className="text-sm font-black text-slate-700">
                        Descripción pública
                      </span>
                      <textarea
                        value={formulario.descripcion_catalogo}
                        onChange={(e) =>
                          manejarCambio('descripcion_catalogo', e.target.value)
                        }
                        rows={3}
                        placeholder="Descripción que verá el cliente en el catálogo."
                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold resize-none"
                      />
                    </label>

                    <label className="space-y-1">
                      <span className="text-sm font-black text-slate-700">
                        Orden
                      </span>
                      <input
                        type="number"
                        value={formulario.orden}
                        onChange={(e) => manejarCambio('orden', e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold"
                      />
                    </label>

                    <label className="space-y-1">
                      <span className="text-sm font-black text-slate-700">
                        Imagen
                      </span>
                      <label className="w-full px-4 py-3 rounded-2xl border border-dashed border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100 cursor-pointer font-black flex items-center justify-center gap-2">
                        <ImagePlus size={20} />
                        Seleccionar imagen
                        <input
                          type="file"
                          accept="image/*"
                          onChange={manejarImagen}
                          className="hidden"
                        />
                      </label>
                    </label>

                    <div className="md:col-span-2">
                      <div className="rounded-3xl bg-slate-50 border border-slate-100 p-4 flex items-center justify-center min-h-[180px]">
                        {formulario.imagen_preview ? (
                          <img
                            src={formulario.imagen_preview}
                            alt="Vista previa"
                            className="max-h-44 object-contain"
                          />
                        ) : formulario.imagen_url_actual ? (
                          <img
                            src={formulario.imagen_url_actual}
                            alt="Imagen actual"
                            className="max-h-44 object-contain"
                          />
                        ) : (
                          <div className="text-center text-slate-400">
                            <ImagePlus size={42} className="mx-auto" />
                            <p className="mt-2 font-bold">
                              Sin imagen seleccionada
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <label className="space-y-1 md:col-span-2">
                      <span className="text-sm font-black text-slate-700">
                        Indicaciones
                      </span>
                      <textarea
                        value={formulario.indicaciones}
                        onChange={(e) =>
                          manejarCambio('indicaciones', e.target.value)
                        }
                        rows={3}
                        placeholder="Ej. Auxiliar para aliviar síntomas..."
                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold resize-none"
                      />
                    </label>

                    <label className="space-y-1 md:col-span-2">
                      <span className="text-sm font-black text-slate-700">
                        Modo de uso
                      </span>
                      <textarea
                        value={formulario.modo_uso}
                        onChange={(e) => manejarCambio('modo_uso', e.target.value)}
                        rows={3}
                        placeholder="Ej. Vía oral. Consulte a su médico."
                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold resize-none"
                      />
                    </label>

                    <label className="space-y-1 md:col-span-2">
                      <span className="text-sm font-black text-slate-700">
                        Advertencias
                      </span>
                      <textarea
                        value={formulario.advertencias}
                        onChange={(e) =>
                          manejarCambio('advertencias', e.target.value)
                        }
                        rows={3}
                        placeholder="Ej. No se deje al alcance de los niños..."
                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold resize-none"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => manejarCambio('activo', !formulario.activo)}
                      className={`rounded-2xl border px-4 py-3 font-black flex items-center justify-center gap-2 transition ${formulario.activo
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                    >
                      {formulario.activo ? <Eye size={18} /> : <EyeOff size={18} />}
                      {formulario.activo ? 'Visible' : 'Oculto'}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        manejarCambio('destacado', !formulario.destacado)
                      }
                      className={`rounded-2xl border px-4 py-3 font-black flex items-center justify-center gap-2 transition ${formulario.destacado
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                    >
                      {formulario.destacado ? (
                        <Star size={18} />
                      ) : (
                        <StarOff size={18} />
                      )}
                      Destacado
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        manejarCambio('mostrar_stock', !formulario.mostrar_stock)
                      }
                      className={`rounded-2xl border px-4 py-3 font-black flex items-center justify-center gap-2 transition ${formulario.mostrar_stock
                          ? 'bg-sky-50 text-sky-700 border-sky-200'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                    >
                      <Package size={18} />
                      Disponibilidad
                    </button>
                  </div>

                  {productoSeleccionado?.es_controlado && (
                    <div className="rounded-3xl bg-red-50 border border-red-200 p-4 text-red-700 flex items-start gap-3">
                      <AlertTriangle size={22} />
                      <p className="text-sm font-bold">
                        Este producto está marcado como controlado en inventario.
                        En el catálogo se mostrará solo como información pública.
                      </p>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row justify-end gap-3 pt-3">
                    <button
                      type="button"
                      onClick={cerrarModal}
                      disabled={guardando}
                      className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black transition disabled:opacity-60"
                    >
                      Cancelar
                    </button>

                    <button
                      type="submit"
                      disabled={guardando}
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-black shadow-lg shadow-sky-900/20 transition disabled:opacity-60"
                    >
                      {guardando ? (
                        <>
                          <RefreshCw size={20} className="animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Save size={20} />
                          {modoEdicion ? 'Guardar cambios' : 'Agregar al catálogo'}
                        </>
                      )}
                    </button>
                  </div>
                </section>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}