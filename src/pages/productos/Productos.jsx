import { useEffect, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Package,
  RefreshCw,
  X,
  Save,
  Camera,
  Loader2,
} from 'lucide-react';

import api from '../../api/axios';
import BarcodeScannerModal from '../../components/BarcodeScannerModal';

const formInicial = {
  codigo_barras: '',
  nombre: '',
  descripcion: '',
  id_categoria: '',
  laboratorio: '',
  presentacion: '',
  requiere_receta: false,
  es_controlado: false,
  precio_compra: '',
  precio_venta: '',
  activo: true,
};

export default function Productos() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);

  const [buscar, setBuscar] = useState('');
  const [sugerenciasProductos, setSugerenciasProductos] = useState([]);
  const [cargandoSugerencias, setCargandoSugerencias] = useState(false);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [indiceSugerencia, setIndiceSugerencia] = useState(-1);
  const [idProductoSeleccionado, setIdProductoSeleccionado] = useState('');
  const solicitudSugerenciasRef = useRef(0);

  const [busquedaCategoria, setBusquedaCategoria] = useState('');
  const [mostrarCategorias, setMostrarCategorias] = useState(false);

  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [productoEditando, setProductoEditando] = useState(null);

  const [form, setForm] = useState(formInicial);

  const [escanerAbierto, setEscanerAbierto] = useState(false);

  const cargarCategorias = async () => {
    try {
      const { data } = await api.get('/categorias');

      if (data.ok) {
        setCategorias(data.categorias || []);
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar las categorías.',
      });
    }
  };

  const cargarProductos = async ({
    termino = buscar,
    idProducto = idProductoSeleccionado,
  } = {}) => {
    try {
      setCargando(true);

      const params = new URLSearchParams();
      const texto = String(termino || '').trim();
      const idProductoNumerico = Number(idProducto || 0);

      if (Number.isInteger(idProductoNumerico) && idProductoNumerico > 0) {
        params.append('id_producto', String(idProductoNumerico));
      } else if (texto) {
        params.append('buscar', texto);
      }

      const { data } = await api.get(`/productos?${params.toString()}`);

      if (data.ok) {
        setProductos(data.productos || []);
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudieron cargar los productos.',
      });
    } finally {
      setCargando(false);
    }
  };

  const buscarSugerenciasProductos = async (termino) => {
    const texto = String(termino || '').trim();

    if (texto.length < 2) {
      setCargandoSugerencias(false);
      setSugerenciasProductos([]);
      setMostrarSugerencias(false);
      setIndiceSugerencia(-1);
      return;
    }

    const solicitudActual = solicitudSugerenciasRef.current + 1;
    solicitudSugerenciasRef.current = solicitudActual;

    try {
      setCargandoSugerencias(true);
      setMostrarSugerencias(true);

      const params = new URLSearchParams();
      params.append('buscar', texto);
      params.append('autocomplete', '1');
      params.append('limit', '8');

      const { data } = await api.get(`/productos?${params.toString()}`);

      if (solicitudActual !== solicitudSugerenciasRef.current) return;

      if (data.ok) {
        setSugerenciasProductos(data.productos || []);
      } else {
        setSugerenciasProductos([]);
      }

      setIndiceSugerencia(-1);
    } catch (error) {
      if (solicitudActual !== solicitudSugerenciasRef.current) return;

      console.error('Error al buscar sugerencias de productos:', error);
      setSugerenciasProductos([]);
    } finally {
      if (solicitudActual === solicitudSugerenciasRef.current) {
        setCargandoSugerencias(false);
      }
    }
  };

  const seleccionarSugerenciaProducto = async (producto) => {
    const idProducto = Number(producto?.id_producto || 0);

    if (!Number.isInteger(idProducto) || idProducto <= 0) return;

    solicitudSugerenciasRef.current += 1;

    setBuscar(producto.nombre || '');
    setIdProductoSeleccionado(idProducto);
    setCargandoSugerencias(false);
    setSugerenciasProductos([]);
    setMostrarSugerencias(false);
    setIndiceSugerencia(-1);

    await cargarProductos({
      termino: producto.nombre || '',
      idProducto,
    });
  };

  const ejecutarBusquedaProductos = async () => {
    solicitudSugerenciasRef.current += 1;

    setIdProductoSeleccionado('');
    setCargandoSugerencias(false);
    setSugerenciasProductos([]);
    setMostrarSugerencias(false);
    setIndiceSugerencia(-1);

    await cargarProductos({
      termino: buscar,
      idProducto: null,
    });
  };

  const manejarCambioBusqueda = (valor) => {
    solicitudSugerenciasRef.current += 1;

    setBuscar(valor);
    setIdProductoSeleccionado('');
    setIndiceSugerencia(-1);

    if (String(valor || '').trim().length >= 2) {
      setCargandoSugerencias(true);
      setMostrarSugerencias(true);
    } else {
      setCargandoSugerencias(false);
      setSugerenciasProductos([]);
      setMostrarSugerencias(false);
    }
  };

  useEffect(() => {
    cargarCategorias();
    cargarProductos();
  }, []);

  useEffect(() => {
    const texto = String(buscar || '').trim();

    if (idProductoSeleccionado || texto.length < 2) {
      return undefined;
    }

    const temporizador = setTimeout(() => {
      buscarSugerenciasProductos(texto);
    }, 300);

    return () => clearTimeout(temporizador);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buscar, idProductoSeleccionado]);

  const abrirNuevo = () => {
    setForm(formInicial);
    setBusquedaCategoria('');
    setMostrarCategorias(false);
    setModoEdicion(false);
    setProductoEditando(null);
    setModalAbierto(true);
  };

  const abrirEditar = (producto) => {
    setProductoEditando(producto);
    setModoEdicion(true);

    setForm({
      codigo_barras: producto.codigo_barras || '',
      nombre: producto.nombre || '',
      descripcion: producto.descripcion || '',
      id_categoria: producto.id_categoria || '',
      laboratorio: producto.laboratorio || '',
      presentacion: producto.presentacion || '',
      requiere_receta: Boolean(producto.requiere_receta),
      es_controlado: Boolean(producto.es_controlado),
      precio_compra: producto.precio_compra || '',
      precio_venta: producto.precio_venta || '',
      activo: Boolean(producto.activo),
    });

    setBusquedaCategoria(producto.categoria || '');
    setMostrarCategorias(false);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setModoEdicion(false);
    setProductoEditando(null);
    setForm(formInicial);
    setBusquedaCategoria('');
    setMostrarCategorias(false);
    setEscanerAbierto(false);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const validarForm = () => {
    if (!form.nombre.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Nombre obligatorio',
        text: 'Ingresa el nombre del producto.',
      });

      return false;
    }

    if (form.precio_compra !== '' && Number(form.precio_compra) < 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Precio inválido',
        text: 'El precio de compra no puede ser negativo.',
      });

      return false;
    }

    if (form.precio_venta === '' || Number(form.precio_venta) < 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Precio inválido',
        text: 'Ingresa un precio de venta válido.',
      });

      return false;
    }

    return true;
  };

  const guardarProducto = async (e) => {
    e.preventDefault();

    if (!validarForm()) return;

    try {
      setGuardando(true);

      const payload = {
        codigo_barras: form.codigo_barras.trim() || null,
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || null,
        id_categoria: form.id_categoria ? Number(form.id_categoria) : null,
        laboratorio: form.laboratorio.trim() || null,
        presentacion: form.presentacion.trim() || null,
        requiere_receta: form.requiere_receta,
        es_controlado: form.es_controlado,
        precio_compra: form.precio_compra ? Number(form.precio_compra) : 0,
        precio_venta: Number(form.precio_venta),
        activo: form.activo,
      };

      let respuesta;

      if (modoEdicion) {
        respuesta = await api.put(
          `/productos/${productoEditando.id_producto}`,
          payload
        );
      } else {
        respuesta = await api.post('/productos', payload);
      }

      if (respuesta.data.ok) {
        Swal.fire({
          icon: 'success',
          title: modoEdicion ? 'Producto actualizado' : 'Producto creado',
          text: respuesta.data.mensaje,
          timer: 1400,
          showConfirmButton: false,
        });

        cerrarModal();
        cargarProductos();
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudo guardar el producto.',
      });
    } finally {
      setGuardando(false);
    }
  };

  const desactivarProducto = async (producto) => {
    const confirmacion = await Swal.fire({
      icon: 'warning',
      title: '¿Desactivar producto?',
      text: `Se desactivará: ${producto.nombre}`,
      showCancelButton: true,
      confirmButtonText: 'Sí, desactivar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
    });

    if (!confirmacion.isConfirmed) return;

    try {
      const { data } = await api.delete(`/productos/${producto.id_producto}`);

      if (data.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Producto desactivado',
          timer: 1200,
          showConfirmButton: false,
        });

        cargarProductos();
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudo desactivar el producto.',
      });
    }
  };

  const formatoMoneda = (valor) => {
    const numero = Number(valor || 0);

    return numero.toLocaleString('es-MX', {
      style: 'currency',
      currency: 'MXN',
    });
  };

  const totalActivos = productos.filter((producto) => producto.activo).length;
  const totalInactivos = productos.filter((producto) => !producto.activo).length;

  const categoriaSeleccionada = categorias.find(
    (cat) => Number(cat.id_categoria) === Number(form.id_categoria)
  );

  const categoriasFiltradas = categorias.filter((cat) =>
    cat.nombre
      ?.toLowerCase()
      .includes(busquedaCategoria.trim().toLowerCase())
  );

  const seleccionarCategoria = (cat) => {
    setForm((prev) => ({
      ...prev,
      id_categoria: cat ? cat.id_categoria : '',
    }));

    setBusquedaCategoria(cat ? cat.nombre : '');
    setMostrarCategorias(false);
  };

  const manejarCodigoDetectado = (codigo) => {
    setForm((prev) => ({
      ...prev,
      codigo_barras: codigo,
    }));

    setEscanerAbierto(false);

    Swal.fire({
      icon: 'success',
      title: 'Código escaneado',
      text: codigo,
      timer: 1300,
      showConfirmButton: false,
    });
  };

  return (
    <div className="space-y-6">
      <section className="relative z-30 overflow-visible bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center">
                <Package size={24} />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-slate-800">
                  Productos
                </h1>
                <p className="text-slate-500">
                  Catálogo general de medicamentos y productos.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={abrirNuevo}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-sky-700 hover:bg-sky-800 text-white font-bold shadow-lg shadow-sky-900/20 transition"
          >
            <Plus size={20} />
            Nuevo producto
          </button>
        </div>

        <div className="mt-6 flex flex-col md:flex-row gap-3">
          <div className="relative z-50 flex-1">
            <Search
              className="absolute left-4 top-3.5 text-slate-400"
              size={20}
            />

            <input
              value={buscar}
              onChange={(e) => manejarCambioBusqueda(e.target.value)}
              onFocus={() => {
                if (String(buscar || '').trim().length >= 2) {
                  setMostrarSugerencias(true);
                }
              }}
              onBlur={() => {
                window.setTimeout(() => {
                  setMostrarSugerencias(false);
                  setIndiceSugerencia(-1);
                }, 160);
              }}
              onKeyDown={(e) => {
                const totalSugerencias = sugerenciasProductos.length;

                if (
                  e.key === 'ArrowDown' &&
                  mostrarSugerencias &&
                  totalSugerencias > 0
                ) {
                  e.preventDefault();
                  setIndiceSugerencia((indice) =>
                    indice < totalSugerencias - 1 ? indice + 1 : 0
                  );
                  return;
                }

                if (
                  e.key === 'ArrowUp' &&
                  mostrarSugerencias &&
                  totalSugerencias > 0
                ) {
                  e.preventDefault();
                  setIndiceSugerencia((indice) =>
                    indice > 0 ? indice - 1 : totalSugerencias - 1
                  );
                  return;
                }

                if (e.key === 'Enter') {
                  e.preventDefault();

                  if (
                    mostrarSugerencias &&
                    indiceSugerencia >= 0 &&
                    sugerenciasProductos[indiceSugerencia]
                  ) {
                    seleccionarSugerenciaProducto(
                      sugerenciasProductos[indiceSugerencia]
                    );
                    return;
                  }

                  ejecutarBusquedaProductos();
                  return;
                }

                if (e.key === 'Escape') {
                  setMostrarSugerencias(false);
                  setIndiceSugerencia(-1);
                }
              }}
              className="w-full pl-12 pr-12 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="Buscar por nombre, código, laboratorio o presentación..."
              autoComplete="off"
            />

            {cargandoSugerencias && (
              <Loader2
                size={20}
                className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-sky-600"
              />
            )}

            {mostrarSugerencias && String(buscar || '').trim().length >= 2 && (
              <div className="absolute left-0 right-0 top-full z-[80] mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15">
                {cargandoSugerencias ? (
                  <div className="flex items-center gap-3 px-4 py-4 text-sm font-semibold text-slate-500">
                    <Loader2 size={19} className="animate-spin text-sky-600" />
                    Buscando productos...
                  </div>
                ) : sugerenciasProductos.length === 0 ? (
                  <div className="px-4 py-4 text-sm font-semibold text-slate-500">
                    No se encontraron productos.
                  </div>
                ) : (
                  <div className="max-h-80 overflow-y-auto py-2">
                    {sugerenciasProductos.map((producto, indice) => {
                      const seleccionado = indice === indiceSugerencia;
                      const detalle = [
                        producto.codigo_barras || 'Sin código',
                        producto.laboratorio,
                        producto.presentacion,
                      ]
                        .filter(Boolean)
                        .join(' · ');

                      return (
                        <button
                          key={producto.id_producto}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            seleccionarSugerenciaProducto(producto);
                          }}
                          className={`flex w-full items-start justify-between gap-4 px-4 py-3 text-left transition ${
                            seleccionado
                              ? 'bg-sky-50 text-sky-800'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-black">
                              {producto.nombre || 'Producto sin nombre'}
                            </p>
                            <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">
                              {detalle || 'Sin información adicional'}
                            </p>
                          </div>

                          <span
                            className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${
                              producto.activo
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {producto.activo ? 'Activo' : 'Inactivo'}
                          </span>
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
            onClick={ejecutarBusquedaProductos}
            disabled={cargando}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition disabled:opacity-60"
          >
            <RefreshCw size={19} className={cargando ? 'animate-spin' : ''} />
            {cargando ? 'Buscando...' : 'Buscar'}
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-3xl border border-sky-100 bg-sky-50 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-sky-700">
                  Productos activos
                </p>
                <p className="text-3xl font-black text-slate-800 mt-1">
                  {totalActivos}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Productos disponibles en el catálogo
                </p>
              </div>

              <div className="w-12 h-12 rounded-2xl bg-white text-sky-700 flex items-center justify-center shadow-sm">
                <Package size={24} />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-slate-600">
                  Productos inactivos
                </p>
                <p className="text-3xl font-black text-slate-800 mt-1">
                  {totalInactivos}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Productos desactivados u ocultos
                </p>
              </div>

              <div className="w-12 h-12 rounded-2xl bg-white text-slate-600 flex items-center justify-center shadow-sm">
                <Trash2 size={24} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-0 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px]">
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
                  Laboratorio
                </th>
                <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                  Presentación
                </th>
                <th className="px-5 py-4 text-right text-xs font-bold text-slate-500 uppercase">
                  Compra
                </th>
                <th className="px-5 py-4 text-right text-xs font-bold text-slate-500 uppercase">
                  Venta
                </th>
                <th className="px-5 py-4 text-center text-xs font-bold text-slate-500 uppercase">
                  Estado
                </th>
                <th className="px-5 py-4 text-center text-xs font-bold text-slate-500 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {cargando ? (
                <tr>
                  <td
                    colSpan="9"
                    className="px-5 py-10 text-center text-slate-500"
                  >
                    Cargando productos...
                  </td>
                </tr>
              ) : productos.length === 0 ? (
                <tr>
                  <td
                    colSpan="9"
                    className="px-5 py-10 text-center text-slate-500"
                  >
                    No hay productos registrados.
                  </td>
                </tr>
              ) : (
                productos.map((producto) => (
                  <tr key={producto.id_producto} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <div>
                        <p className="font-bold text-slate-800">
                          {producto.nombre}
                        </p>

                        <div className="flex gap-2 mt-1">
                          {producto.requiere_receta && (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                              Receta
                            </span>
                          )}

                          {producto.es_controlado && (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                              Controlado
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {producto.codigo_barras || '—'}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {producto.categoria || 'Sin categoría'}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {producto.laboratorio || '—'}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {producto.presentacion || '—'}
                    </td>

                    <td className="px-5 py-4 text-right font-semibold text-slate-600">
                      {formatoMoneda(producto.precio_compra)}
                    </td>

                    <td className="px-5 py-4 text-right font-bold text-sky-700">
                      {formatoMoneda(producto.precio_venta)}
                    </td>

                    <td className="px-5 py-4 text-center">
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full ${
                          producto.activo
                            ? 'bg-sky-100 text-sky-700'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {producto.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => abrirEditar(producto)}
                          className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center justify-center transition"
                          title="Editar"
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          type="button"
                          onClick={() => desactivarProducto(producto)}
                          disabled={!producto.activo}
                          className="w-9 h-9 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 flex items-center justify-center transition disabled:opacity-40"
                          title="Desactivar"
                        >
                          <Trash2 size={17} />
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

      {modalAbierto && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  {modoEdicion ? 'Editar producto' : 'Nuevo producto'}
                </h2>
                <p className="text-sm text-slate-500">
                  Completa la información del producto.
                </p>
              </div>

              <button
                type="button"
                onClick={cerrarModal}
                className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={guardarProducto}
              className="p-6 overflow-y-auto max-h-[75vh]"
            >
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Nombre *
                  </label>

                  <input
                    name="nombre"
                    value={form.nombre}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="Ej. Paracetamol 500mg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Código de barras
                  </label>

                  <div className="flex gap-2">
                    <input
                      name="codigo_barras"
                      value={form.codigo_barras}
                      onChange={handleChange}
                      className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      placeholder="750..."
                    />

                    <button
                      type="button"
                      onClick={() => setEscanerAbierto(true)}
                      className="px-4 py-3 rounded-2xl bg-sky-700 hover:bg-sky-800 text-white font-bold flex items-center justify-center gap-2 transition"
                      title="Escanear código de barras"
                    >
                      <Camera size={20} />
                      <span className="hidden sm:inline">Escanear</span>
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Categoría
                  </label>

                  <div className="relative">
                    <Search
                      size={18}
                      className="absolute left-4 top-3.5 text-slate-400"
                    />

                    <input
                      type="text"
                      value={
                        mostrarCategorias
                          ? busquedaCategoria
                          : categoriaSeleccionada?.nombre || busquedaCategoria
                      }
                      onChange={(e) => {
                        setBusquedaCategoria(e.target.value);
                        setMostrarCategorias(true);

                        if (e.target.value.trim() === '') {
                          setForm((prev) => ({
                            ...prev,
                            id_categoria: '',
                          }));
                        }
                      }}
                      onFocus={() => {
                        setBusquedaCategoria(
                          categoriaSeleccionada?.nombre || ''
                        );
                        setMostrarCategorias(true);
                      }}
                      placeholder="Buscar categoría..."
                      className="w-full pl-11 pr-10 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />

                    {form.id_categoria && (
                      <button
                        type="button"
                        onClick={() => seleccionarCategoria(null)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-red-500"
                        title="Quitar categoría"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>

                  {mostrarCategorias && (
                    <div className="absolute z-[9999] mt-2 w-full bg-white border border-slate-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto">
                      <button
                        type="button"
                        onClick={() => seleccionarCategoria(null)}
                        className="w-full text-left px-4 py-3 hover:bg-slate-50 font-semibold text-slate-600"
                      >
                        Sin categoría
                      </button>

                      {categoriasFiltradas.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-slate-500">
                          No se encontraron categorías.
                        </div>
                      ) : (
                        categoriasFiltradas.map((cat) => (
                          <button
                            key={cat.id_categoria}
                            type="button"
                            onClick={() => seleccionarCategoria(cat)}
                            className={`w-full text-left px-4 py-3 hover:bg-sky-50 transition ${
                              Number(form.id_categoria) ===
                              Number(cat.id_categoria)
                                ? 'bg-sky-100 text-sky-700 font-bold'
                                : 'text-slate-700'
                            }`}
                          >
                            {cat.nombre}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Laboratorio
                  </label>

                  <input
                    name="laboratorio"
                    value={form.laboratorio}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="Ej. Genérico"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Presentación
                  </label>

                  <input
                    name="presentacion"
                    value={form.presentacion}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="Caja 10 tabletas"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Precio compra
                  </label>

                  <input
                    type="number"
                    step="0.01"
                    name="precio_compra"
                    value={form.precio_compra}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Precio venta *
                  </label>

                  <input
                    type="number"
                    step="0.01"
                    name="precio_venta"
                    value={form.precio_venta}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="0.00"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Descripción
                  </label>

                  <textarea
                    name="descripcion"
                    value={form.descripcion}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                    placeholder="Descripción opcional del producto"
                  />
                </div>

                <div className="md:col-span-2 grid sm:grid-cols-3 gap-4">
                  <label className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 cursor-pointer">
                    <input
                      type="checkbox"
                      name="requiere_receta"
                      checked={form.requiere_receta}
                      onChange={handleChange}
                      className="w-5 h-5 accent-sky-700"
                    />

                    <span className="font-semibold text-slate-700">
                      Requiere receta
                    </span>
                  </label>

                  <label className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 cursor-pointer">
                    <input
                      type="checkbox"
                      name="es_controlado"
                      checked={form.es_controlado}
                      onChange={handleChange}
                      className="w-5 h-5 accent-red-600"
                    />

                    <span className="font-semibold text-slate-700">
                      Controlado
                    </span>
                  </label>

                  {modoEdicion && (
                    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 cursor-pointer">
                      <input
                        type="checkbox"
                        name="activo"
                        checked={form.activo}
                        onChange={handleChange}
                        className="w-5 h-5 accent-sky-700"
                      />

                      <span className="font-semibold text-slate-700">
                        Activo
                      </span>
                    </label>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={guardando}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-sky-700 hover:bg-sky-800 text-white font-bold transition disabled:opacity-60"
                >
                  <Save size={19} />
                  {guardando ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <BarcodeScannerModal
        abierto={escanerAbierto}
        titulo="Escanear código de barras"
        descripcion="Apunta la cámara al código de barras del producto."
        onClose={() => setEscanerAbierto(false)}
        onDetected={manejarCodigoDetectado}
      />
    </div>
  );
}