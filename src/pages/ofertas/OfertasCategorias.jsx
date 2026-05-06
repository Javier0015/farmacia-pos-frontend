import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import {
  BadgePercent,
  Calendar,
  Edit,
  Plus,
  RefreshCw,
  Save,
  Search,
  Tags,
  ToggleLeft,
  ToggleRight,
  Trash2,
  X,
} from 'lucide-react';

import api from '../../api/axios';

const formInicial = {
  id_categoria: '',
  nombre: '',
  descripcion: '',
  porcentaje_descuento: '',
  fecha_inicio: '',
  fecha_fin: '',
  activo: true,
};

export default function OfertasCategorias() {
  const [ofertas, setOfertas] = useState([]);
  const [categorias, setCategorias] = useState([]);

  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState('TODAS');
  const [vigencia, setVigencia] = useState('TODAS');

  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(formInicial);

  const formatoNumero = (valor) => {
    return Number(valor || 0).toLocaleString('es-MX', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  const formatoFecha = (fecha) => {
    if (!fecha) return '—';

    return new Date(`${fecha}T00:00:00`).toLocaleDateString('es-MX', {
      dateStyle: 'medium',
    });
  };

  const cargarCategorias = async () => {
    const { data } = await api.get('/categorias');

    if (data.ok) {
      setCategorias(data.categorias || data.data || []);
    }
  };

  const cargarOfertas = async () => {
    try {
      setCargando(true);

      const params = new URLSearchParams();

      if (busqueda.trim()) {
        params.append('buscar', busqueda.trim());
      }

      if (estado !== 'TODAS') {
        params.append('estado', estado);
      }

      if (vigencia !== 'TODAS') {
        params.append('vigencia', vigencia);
      }

      const { data } = await api.get(
        `/ofertas-categorias?${params.toString()}`
      );

      if (data.ok) {
        setOfertas(data.ofertas || []);
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudieron cargar las ofertas.',
      });
    } finally {
      setCargando(false);
    }
  };

  const cargarDatos = async () => {
    try {
      setCargando(true);
      await Promise.all([cargarCategorias(), cargarOfertas()]);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    cargarOfertas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado, vigencia]);

  const resumen = useMemo(() => {
    return ofertas.reduce(
      (acc, oferta) => {
        acc.total += 1;

        if (oferta.activo) acc.activas += 1;
        if (oferta.vigente) acc.vigentes += 1;

        if (oferta.estatus_calculado === 'PROGRAMADA') acc.programadas += 1;
        if (oferta.estatus_calculado === 'VENCIDA') acc.vencidas += 1;

        return acc;
      },
      {
        total: 0,
        activas: 0,
        vigentes: 0,
        programadas: 0,
        vencidas: 0,
      }
    );
  }, [ofertas]);

  const abrirNuevo = () => {
    setEditando(null);
    setForm(formInicial);
    setModalAbierto(true);
  };

  const abrirEditar = (oferta) => {
    setEditando(oferta);

    setForm({
      id_categoria: oferta.id_categoria || '',
      nombre: oferta.nombre || '',
      descripcion: oferta.descripcion || '',
      porcentaje_descuento: oferta.porcentaje_descuento || '',
      fecha_inicio: oferta.fecha_inicio
        ? String(oferta.fecha_inicio).substring(0, 10)
        : '',
      fecha_fin: oferta.fecha_fin
        ? String(oferta.fecha_fin).substring(0, 10)
        : '',
      activo: oferta.activo === true || oferta.activo === 'true',
    });

    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setEditando(null);
    setForm(formInicial);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const validarFormulario = () => {
    if (!form.id_categoria) {
      Swal.fire({
        icon: 'warning',
        title: 'Categoría requerida',
        text: 'Selecciona una categoría para la oferta.',
      });
      return false;
    }

    if (!form.nombre.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Nombre requerido',
        text: 'Ingresa el nombre de la oferta.',
      });
      return false;
    }

    const porcentaje = Number(form.porcentaje_descuento);

    if (Number.isNaN(porcentaje) || porcentaje < 0 || porcentaje > 100) {
      Swal.fire({
        icon: 'warning',
        title: 'Porcentaje inválido',
        text: 'El descuento debe estar entre 0 y 100.',
      });
      return false;
    }

    if (!form.fecha_inicio || !form.fecha_fin) {
      Swal.fire({
        icon: 'warning',
        title: 'Fechas requeridas',
        text: 'Selecciona fecha de inicio y fecha final.',
      });
      return false;
    }

    if (form.fecha_fin < form.fecha_inicio) {
      Swal.fire({
        icon: 'warning',
        title: 'Rango inválido',
        text: 'La fecha final no puede ser menor que la fecha de inicio.',
      });
      return false;
    }

    return true;
  };

  const guardarOferta = async (e) => {
    e.preventDefault();

    if (!validarFormulario()) return;

    try {
      setGuardando(true);

      const payload = {
        id_categoria: Number(form.id_categoria),
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || null,
        porcentaje_descuento: Number(form.porcentaje_descuento),
        fecha_inicio: form.fecha_inicio,
        fecha_fin: form.fecha_fin,
        activo: form.activo,
      };

      const { data } = editando
        ? await api.put(`/ofertas-categorias/${editando.id_oferta}`, payload)
        : await api.post('/ofertas-categorias', payload);

      if (data.ok) {
        Swal.fire({
          icon: 'success',
          title: editando ? 'Oferta actualizada' : 'Oferta creada',
          text: data.mensaje || 'La oferta fue guardada correctamente.',
          timer: 1600,
          showConfirmButton: false,
        });

        cerrarModal();
        await cargarOfertas();
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudo guardar la oferta.',
      });
    } finally {
      setGuardando(false);
    }
  };

  const cambiarEstado = async (oferta) => {
    const nuevoEstado = !oferta.activo;

    const confirmacion = await Swal.fire({
      icon: 'question',
      title: nuevoEstado ? '¿Activar oferta?' : '¿Desactivar oferta?',
      text: nuevoEstado
        ? 'La oferta volverá a aplicar si está dentro de su rango de fechas.'
        : 'La oferta dejará de aplicarse en el punto de venta.',
      showCancelButton: true,
      confirmButtonText: nuevoEstado ? 'Sí, activar' : 'Sí, desactivar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: nuevoEstado ? '#0284c7' : '#dc2626',
      cancelButtonColor: '#64748b',
    });

    if (!confirmacion.isConfirmed) return;

    try {
      const { data } = await api.patch(
        `/ofertas-categorias/${oferta.id_oferta}/estado`,
        {
          activo: nuevoEstado,
        }
      );

      if (data.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Estado actualizado',
          text: data.mensaje || 'La oferta fue actualizada correctamente.',
          timer: 1400,
          showConfirmButton: false,
        });

        await cargarOfertas();
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudo cambiar el estado de la oferta.',
      });
    }
  };

  const eliminarOferta = async (oferta) => {
    const confirmacion = await Swal.fire({
      icon: 'warning',
      title: '¿Eliminar oferta?',
      html: `
        <div style="text-align:left">
          <p><b>Oferta:</b> ${oferta.nombre}</p>
          <p><b>Categoría:</b> ${oferta.categoria}</p>
          <p>Si la oferta ya fue usada en ventas, se desactivará en lugar de eliminarse.</p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
    });

    if (!confirmacion.isConfirmed) return;

    try {
      const { data } = await api.delete(
        `/ofertas-categorias/${oferta.id_oferta}`
      );

      if (data.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Oferta eliminada',
          text: data.mensaje || 'La oferta fue eliminada correctamente.',
          timer: 1600,
          showConfirmButton: false,
        });

        await cargarOfertas();
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudo eliminar la oferta.',
      });
    }
  };

  const claseEstatus = (estatus) => {
    if (estatus === 'VIGENTE') return 'bg-emerald-100 text-emerald-700';
    if (estatus === 'PROGRAMADA') return 'bg-sky-100 text-sky-700';
    if (estatus === 'VENCIDA') return 'bg-slate-200 text-slate-700';
    if (estatus === 'INACTIVA') return 'bg-red-100 text-red-700';

    return 'bg-slate-100 text-slate-600';
  };

  return (
    <div className="w-full max-w-full overflow-hidden space-y-5 sm:space-y-6 pb-8">
      <section className="bg-gradient-to-r from-sky-700 to-cyan-500 rounded-2xl sm:rounded-3xl p-5 sm:p-7 text-white shadow-lg shadow-sky-900/20 overflow-hidden">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-4 min-w-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
              <BadgePercent size={30} />
            </div>

            <div className="min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold break-words">
                Ofertas por categoría
              </h1>
              <p className="text-sm sm:text-base text-sky-100 mt-1 leading-relaxed">
                Configura descuentos automáticos para categorías de productos.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
            <button
              type="button"
              onClick={cargarOfertas}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-bold transition"
            >
              <RefreshCw size={19} className={cargando ? 'animate-spin' : ''} />
              Actualizar
            </button>

            <button
              type="button"
              onClick={abrirNuevo}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white text-sky-700 hover:bg-sky-50 font-bold transition"
            >
              <Plus size={19} />
              Nueva oferta
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 shadow-sm border border-slate-100 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center mb-4">
            <BadgePercent size={22} />
          </div>
          <p className="text-sm text-slate-500">Total ofertas</p>
          <p className="text-3xl font-bold text-slate-800 break-words">
            {formatoNumero(resumen.total)}
          </p>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 shadow-sm border border-slate-100 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
            <ToggleRight size={22} />
          </div>
          <p className="text-sm text-slate-500">Activas</p>
          <p className="text-3xl font-bold text-slate-800 break-words">
            {formatoNumero(resumen.activas)}
          </p>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 shadow-sm border border-slate-100 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
            <Calendar size={22} />
          </div>
          <p className="text-sm text-slate-500">Vigentes</p>
          <p className="text-3xl font-bold text-slate-800 break-words">
            {formatoNumero(resumen.vigentes)}
          </p>
        </div>
      </section>

      <section className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-100">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_200px_220px_auto] gap-3">
          <div className="relative min-w-0">
            <Search
              className="absolute left-4 top-3.5 text-slate-400"
              size={20}
            />

            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') cargarOfertas();
              }}
              className="w-full min-w-0 pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="Buscar oferta, descripción o categoría..."
            />
          </div>

          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            className="w-full min-w-0 px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
          >
            <option value="TODAS">Todas</option>
            <option value="ACTIVAS">Activas</option>
            <option value="INACTIVAS">Inactivas</option>
          </select>

          <select
            value={vigencia}
            onChange={(e) => setVigencia(e.target.value)}
            className="w-full min-w-0 px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
          >
            <option value="TODAS">Toda vigencia</option>
            <option value="VIGENTES">Vigentes</option>
            <option value="PROGRAMADAS">Programadas</option>
            <option value="VENCIDAS">Vencidas</option>
          </select>

          <button
            type="button"
            onClick={cargarOfertas}
            className="w-full lg:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-sky-700 hover:bg-sky-800 text-white font-bold transition"
          >
            <Search size={19} />
            Buscar
          </button>
        </div>
      </section>

      <section className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-4 sm:px-6 py-5 border-b border-slate-100">
          <h2 className="text-lg sm:text-xl font-bold text-slate-800">
            Listado de ofertas
          </h2>
          <p className="text-sm text-slate-500">
            Las ofertas vigentes se aplicarán automáticamente en el punto de venta.
          </p>
        </div>

        {/* Vista móvil */}
        <div className="md:hidden p-4 space-y-3">
          {cargando ? (
            <div className="rounded-2xl bg-slate-50 p-6 text-center text-slate-500 font-semibold">
              Cargando ofertas...
            </div>
          ) : ofertas.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 p-6 text-center text-slate-500 font-semibold">
              No hay ofertas registradas.
            </div>
          ) : (
            ofertas.map((oferta) => (
              <article
                key={oferta.id_oferta}
                className="rounded-2xl border border-slate-100 p-4 shadow-sm bg-white"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 break-words">
                      {oferta.nombre}
                    </p>
                    <p className="text-xs text-slate-500 mt-1 break-words">
                      {oferta.descripcion || 'Sin descripción'}
                    </p>
                  </div>

                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-xs font-bold shrink-0 ${claseEstatus(
                      oferta.estatus_calculado
                    )}`}
                  >
                    {oferta.estatus_calculado || '—'}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100 text-sky-700 text-xs font-bold">
                    <Tags size={14} />
                    {oferta.categoria}
                  </span>

                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                    <BadgePercent size={14} />
                    {formatoNumero(oferta.porcentaje_descuento)}%
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 text-sm">
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Calendar size={14} />
                      Vigencia
                    </p>
                    <p className="font-bold text-slate-800 mt-1">
                      {formatoFecha(String(oferta.fecha_inicio).substring(0, 10))}
                    </p>
                    <p className="text-xs text-slate-500">
                      al {formatoFecha(String(oferta.fecha_fin).substring(0, 10))}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-slate-500">Estado</p>
                      <p className="font-bold text-slate-800">
                        {oferta.activo ? 'Activa' : 'Inactiva'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => cambiarEstado(oferta)}
                      className={`inline-flex items-center gap-1 px-3 py-2 rounded-full text-xs font-bold transition shrink-0 ${
                        oferta.activo
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                    >
                      {oferta.activo ? (
                        <ToggleRight size={15} />
                      ) : (
                        <ToggleLeft size={15} />
                      )}
                      {oferta.activo ? 'Activa' : 'Inactiva'}
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => abrirEditar(oferta)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-sky-100 hover:bg-sky-200 text-sky-700 font-bold transition"
                  >
                    <Edit size={18} />
                    Editar
                  </button>

                  <button
                    type="button"
                    onClick={() => eliminarOferta(oferta)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-red-100 hover:bg-red-200 text-red-700 font-bold transition"
                  >
                    <Trash2 size={18} />
                    Eliminar
                  </button>
                </div>
              </article>
            ))
          )}
        </div>

        {/* Vista tablet/escritorio */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                  Oferta
                </th>
                <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                  Categoría
                </th>
                <th className="px-5 py-4 text-right text-xs font-bold text-slate-500 uppercase">
                  Descuento
                </th>
                <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                  Vigencia
                </th>
                <th className="px-5 py-4 text-center text-xs font-bold text-slate-500 uppercase">
                  Estatus
                </th>
                <th className="px-5 py-4 text-center text-xs font-bold text-slate-500 uppercase">
                  Activa
                </th>
                <th className="px-5 py-4 text-center text-xs font-bold text-slate-500 uppercase sticky right-0 bg-slate-50 shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.45)] z-10">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {cargando ? (
                <tr>
                  <td colSpan="7" className="px-5 py-10 text-center text-slate-500">
                    Cargando ofertas...
                  </td>
                </tr>
              ) : ofertas.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-5 py-10 text-center text-slate-500">
                    No hay ofertas registradas.
                  </td>
                </tr>
              ) : (
                ofertas.map((oferta) => (
                  <tr key={oferta.id_oferta} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-800">
                        {oferta.nombre}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {oferta.descripcion || 'Sin descripción'}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100 text-sky-700 text-xs font-bold">
                        <Tags size={14} />
                        {oferta.categoria}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right font-bold text-emerald-700">
                      {formatoNumero(oferta.porcentaje_descuento)}%
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      <p>{formatoFecha(String(oferta.fecha_inicio).substring(0, 10))}</p>
                      <p className="text-xs text-slate-400">
                        al {formatoFecha(String(oferta.fecha_fin).substring(0, 10))}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-center">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${claseEstatus(
                          oferta.estatus_calculado
                        )}`}
                      >
                        {oferta.estatus_calculado || '—'}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => cambiarEstado(oferta)}
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition ${
                          oferta.activo
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                      >
                        {oferta.activo ? (
                          <ToggleRight size={15} />
                        ) : (
                          <ToggleLeft size={15} />
                        )}
                        {oferta.activo ? 'Activa' : 'Inactiva'}
                      </button>
                    </td>

                    <td className="px-5 py-4 sticky right-0 bg-white shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.45)]">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => abrirEditar(oferta)}
                          className="w-10 h-10 rounded-xl bg-sky-100 hover:bg-sky-200 text-sky-700 flex items-center justify-center transition"
                          title="Editar"
                        >
                          <Edit size={18} />
                        </button>

                        <button
                          type="button"
                          onClick={() => eliminarOferta(oferta)}
                          className="w-10 h-10 rounded-xl bg-red-100 hover:bg-red-200 text-red-700 flex items-center justify-center transition"
                          title="Eliminar"
                        >
                          <Trash2 size={18} />
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

          <form
            onSubmit={guardarOferta}
            className="relative bg-white w-full max-w-3xl rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-auto"
          >
            <div className="px-4 sm:px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-slate-800 break-words">
                  {editando ? 'Editar oferta' : 'Nueva oferta'}
                </h2>
                <p className="text-sm text-slate-500">
                  Configura el descuento que aplicará a una categoría.
                </p>
              </div>

              <button
                type="button"
                onClick={cerrarModal}
                className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-5 max-h-[70vh] overflow-y-auto">
              <div className="md:col-span-2 min-w-0">
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Categoría *
                </label>

                <select
                  name="id_categoria"
                  value={form.id_categoria}
                  onChange={handleChange}
                  className="w-full min-w-0 px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                >
                  <option value="">Selecciona una categoría</option>

                  {categorias.map((categoria) => (
                    <option
                      key={categoria.id_categoria}
                      value={categoria.id_categoria}
                    >
                      {categoria.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2 min-w-0">
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Nombre de la oferta *
                </label>

                <input
                  type="text"
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  className="w-full min-w-0 px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Ej. Semana de analgésicos"
                />
              </div>

              <div className="min-w-0">
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Porcentaje de descuento *
                </label>

                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    name="porcentaje_descuento"
                    value={form.porcentaje_descuento}
                    onChange={handleChange}
                    className="w-full min-w-0 px-4 py-3 pr-10 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="10.00"
                  />
                  <span className="absolute right-4 top-3.5 text-slate-500 font-bold">
                    %
                  </span>
                </div>
              </div>

              <div className="flex items-end min-w-0">
                <label className="w-full rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3 flex items-center justify-between gap-3 cursor-pointer">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-700 text-sm">
                      Oferta activa
                    </p>
                    <p className="text-xs text-slate-500">
                      Si está activa y vigente, aplicará en POS.
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    name="activo"
                    checked={form.activo}
                    onChange={handleChange}
                    className="w-5 h-5 accent-sky-600 shrink-0"
                  />
                </label>
              </div>

              <div className="min-w-0">
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Fecha de inicio *
                </label>

                <input
                  type="date"
                  name="fecha_inicio"
                  value={form.fecha_inicio}
                  onChange={handleChange}
                  className="w-full min-w-0 px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="min-w-0">
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Fecha final *
                </label>

                <input
                  type="date"
                  name="fecha_fin"
                  value={form.fecha_fin}
                  onChange={handleChange}
                  className="w-full min-w-0 px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="md:col-span-2 min-w-0">
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Descripción
                </label>

                <textarea
                  name="descripcion"
                  value={form.descripcion}
                  onChange={handleChange}
                  rows="3"
                  className="w-full min-w-0 px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                  placeholder="Descripción opcional..."
                />
              </div>
            </div>

            <div className="px-4 sm:px-6 py-5 border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-3">
              <button
                type="button"
                onClick={cerrarModal}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
              >
                <X size={18} />
                Cancelar
              </button>

              <button
                type="submit"
                disabled={guardando}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-sky-700 hover:bg-sky-800 text-white font-bold transition disabled:opacity-60"
              >
                <Save size={18} />
                {guardando ? 'Guardando...' : 'Guardar oferta'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}