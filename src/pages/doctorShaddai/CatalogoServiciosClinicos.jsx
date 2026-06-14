import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import {
  Search,
  RefreshCw,
  Plus,
  Pencil,
  Power,
  PowerOff,
  X,
  Loader2,
  Stethoscope,
  DollarSign,
  PackageCheck,
  BadgeCheck,
  ClipboardList,
} from 'lucide-react';

import api from '../../api/axios';

const formularioInicial = {
  id_servicio: null,
  nombre: '',
  descripcion: '',
  precio: '',
  requiere_producto: false,
  activo: true,
};

export default function CatalogoServiciosClinicos() {
  const [servicios, setServicios] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarInactivos, setMostrarInactivos] = useState(true);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [formulario, setFormulario] = useState(formularioInicial);
  const [modoEdicion, setModoEdicion] = useState(false);

  const formatoMoneda = (valor) => {
    return Number(valor || 0).toLocaleString('es-MX', {
      style: 'currency',
      currency: 'MXN',
    });
  };

  const cargarServicios = async () => {
    try {
      setCargando(true);

      const { data } = await api.get('/doctor-shaddai/servicios-clinicos/catalogo', {
        params: {
          busqueda: busqueda.trim() || undefined,
          incluir_inactivos: mostrarInactivos ? 'true' : 'false',
        },
      });

      if (!data.ok) {
        throw new Error(data.mensaje || 'No se pudo cargar el catálogo.');
      }

      setServicios(data.servicios || []);
    } catch (error) {
      console.error('Error al cargar catálogo de servicios clínicos:', error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          error.response?.data?.error ||
          error.message ||
          'No se pudo cargar el catálogo de servicios clínicos.',
      });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarServicios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mostrarInactivos]);

  const resumen = useMemo(() => {
    const activos = servicios.filter((servicio) => servicio.activo === true || servicio.activo === 'true');
    const inactivos = servicios.filter((servicio) => !(servicio.activo === true || servicio.activo === 'true'));
    const requierenProducto = servicios.filter((servicio) => servicio.requiere_producto === true || servicio.requiere_producto === 'true');

    return {
      total: servicios.length,
      activos: activos.length,
      inactivos: inactivos.length,
      requierenProducto: requierenProducto.length,
    };
  }, [servicios]);

  const abrirNuevo = () => {
    setFormulario(formularioInicial);
    setModoEdicion(false);
    setModalAbierto(true);
  };

  const abrirEditar = (servicio) => {
    setFormulario({
      id_servicio: servicio.id_servicio,
      nombre: servicio.nombre || '',
      descripcion: servicio.descripcion || '',
      precio: servicio.precio ?? '',
      requiere_producto:
        servicio.requiere_producto === true ||
        servicio.requiere_producto === 'true',
      activo:
        servicio.activo === true ||
        servicio.activo === 'true',
    });
    setModoEdicion(true);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    if (guardando) return;
    setFormulario(formularioInicial);
    setModoEdicion(false);
    setModalAbierto(false);
  };

  const actualizarCampo = (campo, valor) => {
    setFormulario((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  };

  const validarFormulario = () => {
    if (!String(formulario.nombre || '').trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Nombre requerido',
        text: 'Captura el nombre del servicio clínico.',
      });
      return false;
    }

    const precio = Number(formulario.precio || 0);

    if (Number.isNaN(precio) || precio < 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Precio inválido',
        text: 'El precio debe ser mayor o igual a cero.',
      });
      return false;
    }

    return true;
  };

  const guardarServicio = async () => {
    if (!validarFormulario()) return;

    try {
      setGuardando(true);

      const payload = {
        nombre: String(formulario.nombre || '').trim(),
        descripcion: String(formulario.descripcion || '').trim() || null,
        precio: Number(formulario.precio || 0),
        requiere_producto: Boolean(formulario.requiere_producto),
        activo: Boolean(formulario.activo),
      };

      const { data } = modoEdicion
        ? await api.put(`/doctor-shaddai/servicios-clinicos/catalogo/${formulario.id_servicio}`, payload)
        : await api.post('/doctor-shaddai/servicios-clinicos/catalogo', payload);

      if (!data.ok) {
        throw new Error(data.mensaje || 'No se pudo guardar el servicio clínico.');
      }

      Swal.fire({
        icon: 'success',
        title: modoEdicion ? 'Servicio actualizado' : 'Servicio creado',
        text: data.mensaje || 'El catálogo se actualizó correctamente.',
        timer: 1400,
        showConfirmButton: false,
      });

      cerrarModal();
      await cargarServicios();
    } catch (error) {
      console.error('Error al guardar servicio clínico:', error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          error.response?.data?.error ||
          error.message ||
          'No se pudo guardar el servicio clínico.',
      });
    } finally {
      setGuardando(false);
    }
  };

  const cambiarEstatus = async (servicio) => {
    const activoActual =
      servicio.activo === true ||
      servicio.activo === 'true';

    const accion = activoActual ? 'desactivar' : 'activar';

    const confirmacion = await Swal.fire({
      icon: activoActual ? 'warning' : 'question',
      title: `¿${accion} servicio?`,
      html: `
        <div style="text-align:left">
          <p><b>${servicio.nombre}</b></p>
          <p>El servicio ${activoActual ? 'dejará de aparecer para nuevas solicitudes.' : 'volverá a estar disponible para el doctor.'}</p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: `Sí, ${accion}`,
      cancelButtonText: 'Cancelar',
      confirmButtonColor: activoActual ? '#dc2626' : '#0284c7',
    });

    if (!confirmacion.isConfirmed) return;

    try {
      const { data } = await api.patch(
        `/doctor-shaddai/servicios-clinicos/catalogo/${servicio.id_servicio}/estatus`,
        {
          activo: !activoActual,
        }
      );

      if (!data.ok) {
        throw new Error(data.mensaje || 'No se pudo cambiar el estatus.');
      }

      Swal.fire({
        icon: 'success',
        title: activoActual ? 'Servicio desactivado' : 'Servicio activado',
        text: data.mensaje,
        timer: 1400,
        showConfirmButton: false,
      });

      await cargarServicios();
    } catch (error) {
      console.error('Error al cambiar estatus:', error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          error.response?.data?.error ||
          error.message ||
          'No se pudo cambiar el estatus del servicio.',
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-8">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="relative bg-gradient-to-r from-sky-700 via-cyan-600 to-teal-500 p-6 text-white sm:p-7">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-20 left-10 h-52 w-52 rounded-full bg-white/10 blur-3xl" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-white/15 shadow-lg">
                <Stethoscope size={30} />
              </div>

              <div>
                <p className="text-sm font-black uppercase tracking-wide text-sky-100">
                  Administración
                </p>
                <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
                  Catálogo de servicios clínicos
                </h1>
                <p className="mt-1 max-w-2xl text-sm text-sky-50 sm:text-base">
                  Agrega, edita o desactiva servicios como inyecciones, curaciones,
                  toma de presión, glucosa o nebulizaciones.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={cargarServicios}
                disabled={cargando}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/15 px-5 py-3 text-sm font-black text-white ring-1 ring-white/25 transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw size={18} className={cargando ? 'animate-spin' : ''} />
                Actualizar
              </button>

              <button
                type="button"
                onClick={abrirNuevo}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-sky-700 shadow-sm transition hover:bg-sky-50"
              >
                <Plus size={18} />
                Nuevo servicio
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 border-b border-slate-100 p-4 sm:p-5 lg:grid-cols-4">
          <ResumenCard
            icono={ClipboardList}
            titulo="Total"
            valor={resumen.total}
            detalle="Servicios registrados"
            clase="bg-sky-50 text-sky-700"
          />

          <ResumenCard
            icono={BadgeCheck}
            titulo="Activos"
            valor={resumen.activos}
            detalle="Disponibles para doctor"
            clase="bg-emerald-50 text-emerald-700"
          />

          <ResumenCard
            icono={PowerOff}
            titulo="Inactivos"
            valor={resumen.inactivos}
            detalle="Ocultos del flujo clínico"
            clase="bg-slate-100 text-slate-700"
          />

          <ResumenCard
            icono={PackageCheck}
            titulo="Con producto"
            valor={resumen.requierenProducto}
            detalle="Requieren insumo"
            clase="bg-amber-50 text-amber-700"
          />
        </div>

        <div className="grid gap-3 p-4 sm:p-5 lg:grid-cols-[1fr_auto_auto]">
          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">
              Buscar servicio
            </label>

            <div className="relative">
              <Search className="absolute left-4 top-3.5 text-slate-400" size={19} />
              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') cargarServicios();
                }}
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm font-semibold text-slate-700 outline-none transition focus:ring-2 focus:ring-sky-500"
                placeholder="Buscar por nombre o descripción..."
              />
            </div>
          </div>

          <div className="flex items-end">
            <label className="inline-flex h-[46px] items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700">
              <input
                type="checkbox"
                checked={mostrarInactivos}
                onChange={(e) => setMostrarInactivos(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              Mostrar inactivos
            </label>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={cargarServicios}
              disabled={cargando}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-700 px-5 py-3 text-sm font-black text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {cargando ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
              Buscar
            </button>
          </div>
        </div>
      </section>

      <section className="mt-5 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900">
                Servicios registrados
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Estos servicios aparecen al doctor al registrar un servicio clínico rápido.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-black text-slate-700">
              {servicios.length} resultado(s)
            </div>
          </div>
        </div>

        {cargando ? (
          <div className="flex min-h-[360px] items-center justify-center gap-3 text-sm font-black text-slate-600">
            <Loader2 size={22} className="animate-spin" />
            Cargando catálogo...
          </div>
        ) : servicios.length === 0 ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center p-8 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-500">
              <Stethoscope size={34} />
            </div>

            <h3 className="text-lg font-black text-slate-800">
              Sin servicios registrados
            </h3>

            <p className="mt-2 max-w-md text-sm text-slate-500">
              Crea el primer servicio clínico para que pueda ser solicitado desde Doctor Shaddai.
            </p>

            <button
              type="button"
              onClick={abrirNuevo}
              className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-700 px-5 py-3 text-sm font-black text-white transition hover:bg-sky-800"
            >
              <Plus size={18} />
              Crear servicio
            </button>
          </div>
        ) : (
          <div className="grid gap-4 p-4 sm:p-5 md:grid-cols-2 xl:grid-cols-3">
            {servicios.map((servicio) => {
              const activo = servicio.activo === true || servicio.activo === 'true';
              const requiereProducto =
                servicio.requiere_producto === true ||
                servicio.requiere_producto === 'true';

              return (
                <article
                  key={servicio.id_servicio}
                  className={`rounded-3xl border p-5 shadow-sm transition hover:shadow-md ${
                    activo
                      ? 'border-slate-100 bg-white'
                      : 'border-slate-200 bg-slate-50 opacity-80'
                  }`}
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${
                          activo
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {activo ? 'ACTIVO' : 'INACTIVO'}
                      </span>

                      {requiereProducto && (
                        <span className="ml-2 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">
                          REQUIERE PRODUCTO
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => abrirEditar(servicio)}
                        className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 text-sky-700 transition hover:bg-sky-100"
                        title="Editar"
                      >
                        <Pencil size={17} />
                      </button>

                      <button
                        type="button"
                        onClick={() => cambiarEstatus(servicio)}
                        className={`flex h-10 w-10 items-center justify-center rounded-2xl transition ${
                          activo
                            ? 'bg-red-50 text-red-700 hover:bg-red-100'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                        title={activo ? 'Desactivar' : 'Activar'}
                      >
                        {activo ? <PowerOff size={17} /> : <Power size={17} />}
                      </button>
                    </div>
                  </div>

                  <h3 className="text-lg font-black text-slate-900">
                    {servicio.nombre}
                  </h3>

                  <p className="mt-2 min-h-[42px] text-sm leading-relaxed text-slate-500">
                    {servicio.descripcion || 'Sin descripción.'}
                  </p>

                  <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                      Precio público
                    </p>
                    <p className="mt-1 text-2xl font-black text-slate-900">
                      {formatoMoneda(servicio.precio)}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {modalAbierto && (
        <ModalServicioCatalogo
          formulario={formulario}
          modoEdicion={modoEdicion}
          guardando={guardando}
          actualizarCampo={actualizarCampo}
          guardarServicio={guardarServicio}
          onClose={cerrarModal}
        />
      )}
    </div>
  );
}

function ResumenCard({ icono: Icono, titulo, valor, detalle, clase }) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${clase}`}>
          <Icono size={22} />
        </div>

        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-wide text-slate-500">
            {titulo}
          </p>
          <p className="mt-1 text-2xl font-black text-slate-900">
            {valor}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {detalle}
          </p>
        </div>
      </div>
    </div>
  );
}

function ModalServicioCatalogo({
  formulario,
  modoEdicion,
  guardando,
  actualizarCampo,
  guardarServicio,
  onClose,
}) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-6">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-sky-700">
              {modoEdicion ? 'Editar servicio' : 'Nuevo servicio'}
            </p>

            <h2 className="mt-1 text-2xl font-black text-slate-900">
              {modoEdicion ? 'Actualizar servicio clínico' : 'Crear servicio clínico'}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Define el nombre, precio y si requiere producto/insumo.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={guardando}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <X size={22} />
          </button>
        </div>

        <div className="max-h-[70vh] space-y-5 overflow-y-auto p-6">
          <div>
            <label className="mb-2 block text-sm font-black text-slate-700">
              Nombre del servicio *
            </label>
            <input
              value={formulario.nombre}
              onChange={(e) => actualizarCampo('nombre', e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:ring-2 focus:ring-sky-500"
              placeholder="Ej. Curación sencilla"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-black text-slate-700">
              Descripción
            </label>
            <textarea
              value={formulario.descripcion}
              onChange={(e) => actualizarCampo('descripcion', e.target.value)}
              rows={4}
              className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:ring-2 focus:ring-sky-500"
              placeholder="Describe cuándo o cómo se utiliza este servicio..."
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-black text-slate-700">
              Precio *
            </label>

            <div className="relative">
              <DollarSign className="absolute left-4 top-3.5 text-slate-400" size={19} />
              <input
                type="number"
                min="0"
                step="0.01"
                value={formulario.precio}
                onChange={(e) => actualizarCampo('precio', e.target.value)}
                className="w-full rounded-2xl border border-slate-200 py-3 pl-12 pr-4 text-sm font-semibold text-slate-700 outline-none transition focus:ring-2 focus:ring-sky-500"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
             

            <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <input
                type="checkbox"
                checked={Boolean(formulario.activo)}
                onChange={(e) => actualizarCampo('activo', e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />

              <span>
                <span className="block text-sm font-black text-slate-800">
                  Servicio activo
                </span>
                <span className="mt-1 block text-xs text-slate-500">
                  Disponible para nuevas solicitudes.
                </span>
              </span>
            </label>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 p-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={guardando}
            className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={guardarServicio}
            disabled={guardando}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-700 px-5 py-3 text-sm font-black text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {guardando && <Loader2 size={18} className="animate-spin" />}
            {modoEdicion ? 'Guardar cambios' : 'Crear servicio'}
          </button>
        </div>
      </div>
    </div>
  );
}
