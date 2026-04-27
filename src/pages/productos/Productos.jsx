import { useEffect, useState } from 'react';
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
  Coins,
} from 'lucide-react';
import api from '../../api/axios';

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
  puntos_por_unidad: '',
  activo: true,
};

export default function Productos() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [buscar, setBuscar] = useState('');
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [productoEditando, setProductoEditando] = useState(null);
  const [form, setForm] = useState(formInicial);

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

  const cargarProductos = async () => {
    try {
      setCargando(true);

      const params = new URLSearchParams();

      if (buscar.trim()) {
        params.append('buscar', buscar.trim());
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
        text: 'No se pudieron cargar los productos.',
      });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarCategorias();
    cargarProductos();
  }, []);

  const abrirNuevo = () => {
    setForm(formInicial);
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
      puntos_por_unidad: producto.puntos_por_unidad || '',
      activo: Boolean(producto.activo),
    });

    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setModoEdicion(false);
    setProductoEditando(null);
    setForm(formInicial);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value,
    });
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

    if (form.puntos_por_unidad !== '' && Number(form.puntos_por_unidad) < 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Puntos inválidos',
        text: 'Los puntos por unidad no pueden ser negativos.',
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
        puntos_por_unidad: form.puntos_por_unidad
          ? Number(form.puntos_por_unidad)
          : 0,
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

  const formatoNumero = (valor) => {
    const numero = Number(valor || 0);

    return numero.toLocaleString('es-MX', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
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
            onClick={abrirNuevo}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-lg shadow-emerald-900/20 transition"
          >
            <Plus size={20} />
            Nuevo producto
          </button>
        </div>

        <div className="mt-6 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              className="absolute left-4 top-3.5 text-slate-400"
              size={20}
            />
            <input
              value={buscar}
              onChange={(e) => setBuscar(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') cargarProductos();
              }}
              className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Buscar por nombre, código, laboratorio o presentación..."
            />
          </div>

          <button
            onClick={cargarProductos}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition"
          >
            <RefreshCw size={19} className={cargando ? 'animate-spin' : ''} />
            Buscar
          </button>
        </div>
      </section>

      <section className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px]">
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
                <th className="px-5 py-4 text-right text-xs font-bold text-slate-500 uppercase">
                  Puntos
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
                  <td colSpan="10" className="px-5 py-10 text-center text-slate-500">
                    Cargando productos...
                  </td>
                </tr>
              ) : productos.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-5 py-10 text-center text-slate-500">
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

                    <td className="px-5 py-4 text-right font-bold text-emerald-700">
                      {formatoMoneda(producto.precio_venta)}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <span className="inline-flex items-center justify-end gap-1 text-sm font-bold text-amber-700">
                        <Coins size={16} />
                        {formatoNumero(producto.puntos_por_unidad)} pts
                      </span>
                    </td>

                    <td className="px-5 py-4 text-center">
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full ${
                          producto.activo
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {producto.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => abrirEditar(producto)}
                          className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center justify-center transition"
                          title="Editar"
                        >
                          <Pencil size={17} />
                        </button>

                        <button
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
                onClick={cerrarModal}
                className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={guardarProducto} className="p-6 overflow-y-auto max-h-[75vh]">
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Nombre *
                  </label>
                  <input
                    name="nombre"
                    value={form.nombre}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Ej. Paracetamol 500mg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Código de barras
                  </label>
                  <input
                    name="codigo_barras"
                    value={form.codigo_barras}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="750..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Categoría
                  </label>
                  <select
                    name="id_categoria"
                    value={form.id_categoria}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Sin categoría</option>
                    {categorias.map((cat) => (
                      <option key={cat.id_categoria} value={cat.id_categoria}>
                        {cat.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Laboratorio
                  </label>
                  <input
                    name="laboratorio"
                    value={form.laboratorio}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Puntos por unidad
                  </label>
                  <div className="relative">
                    <Coins
                      className="absolute left-4 top-3.5 text-slate-400"
                      size={20}
                    />
                    <input
                      type="number"
                      step="0.01"
                      name="puntos_por_unidad"
                      value={form.puntos_por_unidad}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Ej. 1, 3, 5"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Puntos que gana el cliente por cada unidad vendida.
                  </p>
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
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
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
                      className="w-5 h-5 accent-emerald-700"
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
                        className="w-5 h-5 accent-emerald-700"
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
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold transition disabled:opacity-60"
                >
                  <Save size={19} />
                  {guardando ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}