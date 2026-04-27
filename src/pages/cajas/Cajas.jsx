import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import {
  Wallet,
  Plus,
  Search,
  RefreshCw,
  Pencil,
  Trash2,
  X,
  Save,
  Store,
  CheckCircle,
} from 'lucide-react';
import api from '../../api/axios';

const formInicial = {
  id_sucursal: '',
  nombre: '',
  descripcion: '',
  activo: true,
};

export default function Cajas() {
  const [cajas, setCajas] = useState([]);
  const [sucursales, setSucursales] = useState([]);

  const [idSucursalFiltro, setIdSucursalFiltro] = useState('');
  const [buscar, setBuscar] = useState('');

  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [cajaEditando, setCajaEditando] = useState(null);
  const [form, setForm] = useState(formInicial);

  const resumen = useMemo(() => {
    const total = cajas.length;
    const activas = cajas.filter((caja) => caja.activo).length;
    const inactivas = cajas.filter((caja) => !caja.activo).length;

    return {
      total,
      activas,
      inactivas,
    };
  }, [cajas]);

  const cargarSucursales = async () => {
    try {
      const { data } = await api.get('/sucursales');

      if (data.ok) {
        const activas = (data.sucursales || []).filter((s) => s.activo);
        setSucursales(activas);

        if (!idSucursalFiltro && activas.length > 0) {
          setIdSucursalFiltro(activas[0].id_sucursal);
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

  const cargarCajas = async () => {
    try {
      setCargando(true);

      const params = new URLSearchParams();

      if (idSucursalFiltro) {
        params.append('sucursal', idSucursalFiltro);
      }

      if (buscar.trim()) {
        params.append('buscar', buscar.trim());
      }

      const { data } = await api.get(`/admin/cajas?${params.toString()}`);

      if (data.ok) {
        setCajas(data.cajas || []);
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudieron cargar las cajas.',
      });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarSucursales();
  }, []);

  useEffect(() => {
    if (idSucursalFiltro) {
      cargarCajas();
    }
  }, [idSucursalFiltro]);

  const abrirNuevo = () => {
    setForm({
      ...formInicial,
      id_sucursal: idSucursalFiltro || sucursales[0]?.id_sucursal || '',
    });

    setModoEdicion(false);
    setCajaEditando(null);
    setModalAbierto(true);
  };

  const abrirEditar = (caja) => {
    setCajaEditando(caja);
    setModoEdicion(true);

    setForm({
      id_sucursal: caja.id_sucursal || '',
      nombre: caja.nombre || '',
      descripcion: caja.descripcion || '',
      activo: Boolean(caja.activo),
    });

    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setModoEdicion(false);
    setCajaEditando(null);
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
    if (!form.id_sucursal) {
      Swal.fire({
        icon: 'warning',
        title: 'Sucursal obligatoria',
        text: 'Selecciona una sucursal para la caja.',
      });
      return false;
    }

    if (!form.nombre.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Nombre obligatorio',
        text: 'Ingresa el nombre de la caja.',
      });
      return false;
    }

    return true;
  };

  const guardarCaja = async (e) => {
    e.preventDefault();

    if (!validarForm()) return;

    try {
      setGuardando(true);

      const payload = {
        id_sucursal: Number(form.id_sucursal),
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || null,
        activo: form.activo,
      };

      let respuesta;

      if (modoEdicion) {
        respuesta = await api.put(`/admin/cajas/${cajaEditando.id_caja}`, payload);
      } else {
        respuesta = await api.post('/admin/cajas', payload);
      }

      if (respuesta.data.ok) {
        Swal.fire({
          icon: 'success',
          title: modoEdicion ? 'Caja actualizada' : 'Caja creada',
          text: respuesta.data.mensaje,
          timer: 1400,
          showConfirmButton: false,
        });

        cerrarModal();
        cargarCajas();
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudo guardar la caja.',
      });
    } finally {
      setGuardando(false);
    }
  };

  const desactivarCaja = async (caja) => {
    const confirmacion = await Swal.fire({
      icon: 'warning',
      title: '¿Desactivar caja?',
      text: `Se desactivará: ${caja.nombre}`,
      showCancelButton: true,
      confirmButtonText: 'Sí, desactivar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
    });

    if (!confirmacion.isConfirmed) return;

    try {
      const { data } = await api.delete(`/admin/cajas/${caja.id_caja}`);

      if (data.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Caja desactivada',
          text: data.mensaje,
          timer: 1400,
          showConfirmButton: false,
        });

        cargarCajas();
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudo desactivar la caja.',
      });
    }
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
              <Wallet size={25} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                Administración de cajas
              </h1>
              <p className="text-slate-500">
                Crea y administra las cajas disponibles por sucursal.
              </p>
            </div>
          </div>

          <button
            onClick={abrirNuevo}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-lg shadow-emerald-900/20 transition"
          >
            <Plus size={20} />
            Nueva caja
          </button>
        </div>

        <div className="mt-6 grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Sucursal
            </label>
            <select
              value={idSucursalFiltro}
              onChange={(e) => setIdSucursalFiltro(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {sucursales.map((sucursal) => (
                <option key={sucursal.id_sucursal} value={sucursal.id_sucursal}>
                  {sucursal.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Buscar
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search
                  className="absolute left-4 top-3.5 text-slate-400"
                  size={20}
                />
                <input
                  value={buscar}
                  onChange={(e) => setBuscar(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') cargarCajas();
                  }}
                  className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Buscar por caja, descripción o sucursal..."
                />
              </div>

              <button
                onClick={cargarCajas}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition"
              >
                <RefreshCw size={19} className={cargando ? 'animate-spin' : ''} />
                Buscar
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="grid sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Wallet size={24} />
          </div>
          <p className="text-sm text-slate-500 mt-5">Total cajas</p>
          <h3 className="text-3xl font-bold text-slate-800 mt-1">
            {resumen.total}
          </h3>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <CheckCircle size={24} />
          </div>
          <p className="text-sm text-slate-500 mt-5">Activas</p>
          <h3 className="text-3xl font-bold text-emerald-700 mt-1">
            {resumen.activas}
          </h3>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <X size={24} />
          </div>
          <p className="text-sm text-slate-500 mt-5">Inactivas</p>
          <h3 className="text-3xl font-bold text-slate-800 mt-1">
            {resumen.inactivas}
          </h3>
        </div>
      </section>

      <section className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                  Caja
                </th>
                <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                  Sucursal
                </th>
                <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                  Descripción
                </th>
                <th className="px-5 py-4 text-center text-xs font-bold text-slate-500 uppercase">
                  Estado
                </th>
                <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                  Fecha alta
                </th>
                <th className="px-5 py-4 text-center text-xs font-bold text-slate-500 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {cargando ? (
                <tr>
                  <td colSpan="6" className="px-5 py-10 text-center text-slate-500">
                    Cargando cajas...
                  </td>
                </tr>
              ) : cajas.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-5 py-10 text-center text-slate-500">
                    No hay cajas registradas para esta sucursal.
                  </td>
                </tr>
              ) : (
                cajas.map((caja) => (
                  <tr key={caja.id_caja} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-800">
                        {caja.nombre}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        ID #{caja.id_caja}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-start gap-2">
                        <Store size={17} className="text-slate-400 mt-0.5" />
                        <div>
                          <p className="font-semibold text-slate-800">
                            {caja.sucursal}
                          </p>
                          <p className="text-xs text-slate-500">
                            {caja.clave_sucursal}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {caja.descripcion || '—'}
                    </td>

                    <td className="px-5 py-4 text-center">
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full ${
                          caja.activo
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {caja.activo ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {formatoFecha(caja.fecha_creacion)}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => abrirEditar(caja)}
                          className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center justify-center transition"
                          title="Editar"
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          onClick={() => desactivarCaja(caja)}
                          className="w-9 h-9 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 flex items-center justify-center transition"
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
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  {modoEdicion ? 'Editar caja' : 'Nueva caja'}
                </h2>
                <p className="text-sm text-slate-500">
                  Define el nombre de la caja y su sucursal.
                </p>
              </div>

              <button
                onClick={cerrarModal}
                className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={guardarCaja} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Sucursal *
                </label>
                <select
                  name="id_sucursal"
                  value={form.id_sucursal}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Selecciona sucursal</option>
                  {sucursales.map((sucursal) => (
                    <option key={sucursal.id_sucursal} value={sucursal.id_sucursal}>
                      {sucursal.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Nombre de caja *
                </label>
                <input
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ej. Caja 1, Caja Mostrador, Caja Turno A"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Descripción
                </label>
                <textarea
                  name="descripcion"
                  value={form.descripcion}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  placeholder="Ej. Caja principal del mostrador"
                />
              </div>

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
                    Caja activa
                  </span>
                </label>
              )}

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
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
                  {guardando
                    ? 'Guardando...'
                    : modoEdicion
                    ? 'Actualizar caja'
                    : 'Guardar caja'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}