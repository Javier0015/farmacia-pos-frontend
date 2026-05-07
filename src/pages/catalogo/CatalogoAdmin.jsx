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

          <button
            type="button"
            onClick={abrirModalNuevo}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white text-sky-700 hover:bg-sky-50 font-black shadow-lg transition"
          >
            <Plus size={20} />
            Agregar producto
          </button>
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
                              className={`w-full text-left rounded-2xl border p-4 transition ${
                                seleccionado
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
                      className={`rounded-2xl border px-4 py-3 font-black flex items-center justify-center gap-2 transition ${
                        formulario.activo
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
                      className={`rounded-2xl border px-4 py-3 font-black flex items-center justify-center gap-2 transition ${
                        formulario.destacado
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
                      className={`rounded-2xl border px-4 py-3 font-black flex items-center justify-center gap-2 transition ${
                        formulario.mostrar_stock
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