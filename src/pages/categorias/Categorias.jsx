import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import {
  Tags,
  Plus,
  Search,
  RefreshCw,
  Pencil,
  Trash2,
  X,
  Save,
  CheckCircle,
  FileText,
} from 'lucide-react';
import api from '../../api/axios';

const formInicial = {
  nombre: '',
  descripcion: '',
  activo: true,
};

export default function Categorias() {
  const [categorias, setCategorias] = useState([]);
  const [buscar, setBuscar] = useState('');

  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [categoriaEditando, setCategoriaEditando] = useState(null);
  const [form, setForm] = useState(formInicial);

  const categoriasFiltradas = useMemo(() => {
    const texto = buscar.trim().toLowerCase();

    if (!texto) return categorias;

    return categorias.filter((categoria) => {
      return (
        categoria.nombre?.toLowerCase().includes(texto) ||
        categoria.descripcion?.toLowerCase().includes(texto)
      );
    });
  }, [categorias, buscar]);

  const resumen = useMemo(() => {
    const total = categorias.length;
    const activas = categorias.filter((c) => c.activo).length;
    const inactivas = categorias.filter((c) => !c.activo).length;

    return {
      total,
      activas,
      inactivas,
    };
  }, [categorias]);

  const formatoFecha = (fecha) => {
    if (!fecha) return '—';

    return new Date(fecha).toLocaleString('es-MX', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const cargarCategorias = async () => {
    try {
      setCargando(true);

      const { data } = await api.get('/categorias');

      if (data.ok) {
        setCategorias(data.categorias || []);
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudieron cargar las categorías.',
      });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarCategorias();
  }, []);

  const abrirNuevo = () => {
    setForm(formInicial);
    setModoEdicion(false);
    setCategoriaEditando(null);
    setModalAbierto(true);
  };

  const abrirEditar = (categoria) => {
    setCategoriaEditando(categoria);
    setModoEdicion(true);

    setForm({
      nombre: categoria.nombre || '',
      descripcion: categoria.descripcion || '',
      activo: Boolean(categoria.activo),
    });

    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setModoEdicion(false);
    setCategoriaEditando(null);
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
        text: 'Ingresa el nombre de la categoría.',
      });
      return false;
    }

    return true;
  };

  const guardarCategoria = async (e) => {
    e.preventDefault();

    if (!validarForm()) return;

    try {
      setGuardando(true);

      const payload = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || null,
        activo: form.activo,
      };

      let respuesta;

      if (modoEdicion) {
        respuesta = await api.put(
          `/categorias/${categoriaEditando.id_categoria}`,
          payload
        );
      } else {
        respuesta = await api.post('/categorias', payload);
      }

      if (respuesta.data.ok) {
        Swal.fire({
          icon: 'success',
          title: modoEdicion ? 'Categoría actualizada' : 'Categoría creada',
          text: respuesta.data.mensaje,
          timer: 1400,
          showConfirmButton: false,
        });

        cerrarModal();
        cargarCategorias();
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudo guardar la categoría.',
      });
    } finally {
      setGuardando(false);
    }
  };

  const desactivarCategoria = async (categoria) => {
    const confirmacion = await Swal.fire({
      icon: 'warning',
      title: '¿Desactivar categoría?',
      html: `
        <div style="text-align:left">
          <p><b>Categoría:</b> ${categoria.nombre}</p>
          <p>La categoría quedará inactiva y no debería usarse para nuevos productos.</p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Sí, desactivar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
    });

    if (!confirmacion.isConfirmed) return;

    try {
      const { data } = await api.delete(
        `/categorias/${categoria.id_categoria}`
      );

      if (data.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Categoría desactivada',
          text: data.mensaje,
          timer: 1400,
          showConfirmButton: false,
        });

        cargarCategorias();
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudo desactivar la categoría.',
      });
    }
  };

  return (
    <div className="w-full max-w-full overflow-hidden space-y-5 sm:space-y-6 pb-8">
      <section className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
              <Tags size={25} />
            </div>

            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800 break-words">
                Categorías
              </h1>
              <p className="text-sm sm:text-base text-slate-500 leading-relaxed">
                Administra el catálogo global de categorías para productos.
              </p>
            </div>
          </div>

          <button
            onClick={abrirNuevo}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-sky-700 hover:bg-sky-800 text-white font-bold shadow-lg shadow-sky-900/20 transition"
          >
            <Plus size={20} />
            Nueva categoría
          </button>
        </div>

        <div className="mt-6 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1 min-w-0">
            <Search
              className="absolute left-4 top-3.5 text-slate-400"
              size={20}
            />
            <input
              value={buscar}
              onChange={(e) => setBuscar(e.target.value)}
              className="w-full min-w-0 pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="Buscar por nombre o descripción..."
            />
          </div>

          <button
            onClick={cargarCategorias}
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition"
          >
            <RefreshCw size={19} className={cargando ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-100 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center">
            <Tags size={24} />
          </div>
          <p className="text-sm text-slate-500 mt-5">Total categorías</p>
          <h3 className="text-3xl font-bold text-slate-800 mt-1">
            {resumen.total}
          </h3>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-100 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <CheckCircle size={24} />
          </div>
          <p className="text-sm text-slate-500 mt-5">Activas</p>
          <h3 className="text-3xl font-bold text-sky-700 mt-1">
            {resumen.activas}
          </h3>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-100 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <X size={24} />
          </div>
          <p className="text-sm text-slate-500 mt-5">Inactivas</p>
          <h3 className="text-3xl font-bold text-slate-800 mt-1">
            {resumen.inactivas}
          </h3>
        </div>
      </section>

      <section className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-4 sm:px-6 py-5 border-b border-slate-100">
          <h2 className="text-lg sm:text-xl font-bold text-slate-800">
            Listado de categorías
          </h2>
          <p className="text-sm text-slate-500">
            Consulta, edita o desactiva categorías del catálogo.
          </p>
        </div>

        <div className="md:hidden p-4 space-y-3">
          {cargando ? (
            <div className="rounded-2xl bg-slate-50 p-6 text-center text-slate-500 font-semibold">
              Cargando categorías...
            </div>
          ) : categoriasFiltradas.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 p-6 text-center text-slate-500 font-semibold">
              No hay categorías registradas.
            </div>
          ) : (
            categoriasFiltradas.map((categoria) => (
              <article
                key={categoria.id_categoria}
                className="rounded-2xl border border-slate-100 p-4 shadow-sm bg-white"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
                      <Tags size={19} />
                    </div>

                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 break-words">
                        {categoria.nombre}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        ID #{categoria.id_categoria}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full shrink-0 ${
                      categoria.activo
                        ? 'bg-sky-100 text-sky-700'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {categoria.activo ? 'Activa' : 'Inactiva'}
                  </span>
                </div>

                <div className="mt-4 rounded-2xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <FileText size={15} />
                    Descripción
                  </p>
                  <p className="font-semibold text-slate-700 mt-1 break-words">
                    {categoria.descripcion || '—'}
                  </p>
                </div>

                <div className="mt-3 rounded-2xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Alta</p>
                  <p className="font-semibold text-slate-700">
                    {formatoFecha(categoria.fecha_creacion)}
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => abrirEditar(categoria)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold transition"
                    title="Editar"
                  >
                    <Pencil size={18} />
                    Editar
                  </button>

                  <button
                    onClick={() => desactivarCategoria(categoria)}
                    disabled={!categoria.activo}
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-red-50 text-red-700 hover:bg-red-100 font-bold transition disabled:opacity-40"
                    title="Desactivar"
                  >
                    <Trash2 size={18} />
                    Desactivar
                  </button>
                </div>
              </article>
            ))
          )}
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                  Categoría
                </th>
                <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                  Descripción
                </th>
                <th className="px-5 py-4 text-center text-xs font-bold text-slate-500 uppercase">
                  Estado
                </th>
                <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                  Alta
                </th>
                <th className="px-5 py-4 text-center text-xs font-bold text-slate-500 uppercase sticky right-0 bg-slate-50 shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.45)] z-10">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {cargando ? (
                <tr>
                  <td colSpan="5" className="px-5 py-10 text-center text-slate-500">
                    Cargando categorías...
                  </td>
                </tr>
              ) : categoriasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-5 py-10 text-center text-slate-500">
                    No hay categorías registradas.
                  </td>
                </tr>
              ) : (
                categoriasFiltradas.map((categoria) => (
                  <tr key={categoria.id_categoria} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
                          <Tags size={19} />
                        </div>

                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 break-words">
                            {categoria.nombre}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            ID #{categoria.id_categoria}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600 max-w-xl">
                      <div className="flex items-start gap-2">
                        <FileText size={15} className="text-slate-400 mt-0.5 shrink-0" />
                        <span className="line-clamp-2 break-words">
                          {categoria.descripcion || '—'}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-center">
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full ${
                          categoria.activo
                            ? 'bg-sky-100 text-sky-700'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {categoria.activo ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {formatoFecha(categoria.fecha_creacion)}
                    </td>

                    <td className="px-5 py-4 sticky right-0 bg-white shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.45)]">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => abrirEditar(categoria)}
                          className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center justify-center transition"
                          title="Editar"
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          onClick={() => desactivarCategoria(categoria)}
                          disabled={!categoria.activo}
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
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center px-3 sm:px-4 py-4 sm:py-8 overflow-y-auto">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={cerrarModal}
          />

          <div className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden my-auto">
            <div className="px-4 sm:px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-slate-800">
                  {modoEdicion ? 'Editar categoría' : 'Nueva categoría'}
                </h2>
                <p className="text-sm text-slate-500">
                  Define el nombre y descripción de la categoría.
                </p>
              </div>

              <button
                onClick={cerrarModal}
                className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={guardarCategoria}>
              <div className="p-4 sm:p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Nombre *
                  </label>
                  <div className="relative">
                    <Tags
                      className="absolute left-4 top-3.5 text-slate-400"
                      size={20}
                    />
                    <input
                      name="nombre"
                      value={form.nombre}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      placeholder="Ej. Analgésicos"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Descripción
                  </label>
                  <textarea
                    name="descripcion"
                    value={form.descripcion}
                    onChange={handleChange}
                    rows="4"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                    placeholder="Descripción opcional de la categoría"
                  />
                </div>

                {modoEdicion && (
                  <label className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 cursor-pointer">
                    <input
                      type="checkbox"
                      name="activo"
                      checked={form.activo}
                      onChange={handleChange}
                      className="w-5 h-5 accent-sky-700 shrink-0"
                    />
                    <span className="font-semibold text-slate-700">
                      Categoría activa
                    </span>
                  </label>
                )}
              </div>

              <div className="px-4 sm:px-6 py-5 flex flex-col sm:flex-row justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={cerrarModal}
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
                  {guardando
                    ? 'Guardando...'
                    : modoEdicion
                      ? 'Actualizar categoría'
                      : 'Guardar categoría'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}