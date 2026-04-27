import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import {
  Store,
  Plus,
  Search,
  RefreshCw,
  Pencil,
  Trash2,
  X,
  Save,
  MapPin,
  Phone,
  Mail,
  User,
  KeyRound,
  CheckCircle,
} from 'lucide-react';
import api from '../../api/axios';

const formInicial = {
  nombre: '',
  clave: '',
  direccion: '',
  telefono: '',
  correo: '',
  responsable: '',
  activo: true,
};

export default function Sucursales() {
  const [sucursales, setSucursales] = useState([]);
  const [buscar, setBuscar] = useState('');

  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [sucursalEditando, setSucursalEditando] = useState(null);
  const [form, setForm] = useState(formInicial);

  const sucursalesFiltradas = useMemo(() => {
    const texto = buscar.trim().toLowerCase();

    if (!texto) return sucursales;

    return sucursales.filter((sucursal) => {
      return (
        sucursal.nombre?.toLowerCase().includes(texto) ||
        sucursal.clave?.toLowerCase().includes(texto) ||
        sucursal.direccion?.toLowerCase().includes(texto) ||
        sucursal.telefono?.toLowerCase().includes(texto) ||
        sucursal.correo?.toLowerCase().includes(texto) ||
        sucursal.responsable?.toLowerCase().includes(texto)
      );
    });
  }, [sucursales, buscar]);

  const resumen = useMemo(() => {
    const total = sucursales.length;
    const activas = sucursales.filter((s) => s.activo).length;
    const inactivas = sucursales.filter((s) => !s.activo).length;

    return {
      total,
      activas,
      inactivas,
    };
  }, [sucursales]);

  const cargarSucursales = async () => {
    try {
      setCargando(true);

      const { data } = await api.get('/sucursales');

      if (data.ok) {
        setSucursales(data.sucursales || []);
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudieron cargar las sucursales.',
      });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarSucursales();
  }, []);

  const abrirNuevo = () => {
    setForm(formInicial);
    setModoEdicion(false);
    setSucursalEditando(null);
    setModalAbierto(true);
  };

  const abrirEditar = (sucursal) => {
    setSucursalEditando(sucursal);
    setModoEdicion(true);

    setForm({
      nombre: sucursal.nombre || '',
      clave: sucursal.clave || '',
      direccion: sucursal.direccion || '',
      telefono: sucursal.telefono || '',
      correo: sucursal.correo || '',
      responsable: sucursal.responsable || '',
      activo: Boolean(sucursal.activo),
    });

    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setModoEdicion(false);
    setSucursalEditando(null);
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
        text: 'Ingresa el nombre de la sucursal.',
      });
      return false;
    }

    if (!form.clave.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Clave obligatoria',
        text: 'Ingresa una clave para la sucursal.',
      });
      return false;
    }

    if (form.correo.trim()) {
      const correoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo);

      if (!correoValido) {
        Swal.fire({
          icon: 'warning',
          title: 'Correo inválido',
          text: 'Ingresa un correo electrónico válido.',
        });
        return false;
      }
    }

    return true;
  };

  const guardarSucursal = async (e) => {
    e.preventDefault();

    if (!validarForm()) return;

    try {
      setGuardando(true);

      const payload = {
        nombre: form.nombre.trim(),
        clave: form.clave.trim().toUpperCase(),
        direccion: form.direccion.trim() || null,
        telefono: form.telefono.trim() || null,
        correo: form.correo.trim() || null,
        responsable: form.responsable.trim() || null,
        activo: form.activo,
      };

      let respuesta;

      if (modoEdicion) {
        respuesta = await api.put(
          `/sucursales/${sucursalEditando.id_sucursal}`,
          payload
        );
      } else {
        respuesta = await api.post('/sucursales', payload);
      }

      if (respuesta.data.ok) {
        Swal.fire({
          icon: 'success',
          title: modoEdicion ? 'Sucursal actualizada' : 'Sucursal creada',
          text: respuesta.data.mensaje,
          timer: 1400,
          showConfirmButton: false,
        });

        cerrarModal();
        cargarSucursales();
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudo guardar la sucursal.',
      });
    } finally {
      setGuardando(false);
    }
  };

  const desactivarSucursal = async (sucursal) => {
    const confirmacion = await Swal.fire({
      icon: 'warning',
      title: '¿Desactivar sucursal?',
      html: `
        <div style="text-align:left">
          <p><b>Sucursal:</b> ${sucursal.nombre}</p>
          <p><b>Clave:</b> ${sucursal.clave}</p>
          <p>La sucursal quedará inactiva para nuevas operaciones.</p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Sí, desactivar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
    });

    if (!confirmacion.isConfirmed) return;

    try {
      const { data } = await api.delete(`/sucursales/${sucursal.id_sucursal}`);

      if (data.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Sucursal desactivada',
          text: data.mensaje,
          timer: 1400,
          showConfirmButton: false,
        });

        cargarSucursales();
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudo desactivar la sucursal.',
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
              <Store size={25} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                Sucursales
              </h1>
              <p className="text-slate-500">
                Administra las farmacias, claves, responsables y datos de contacto.
              </p>
            </div>
          </div>

          <button
            onClick={abrirNuevo}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-lg shadow-emerald-900/20 transition"
          >
            <Plus size={20} />
            Nueva sucursal
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
              className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Buscar por nombre, clave, dirección, teléfono, correo o responsable..."
            />
          </div>

          <button
            onClick={cargarSucursales}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition"
          >
            <RefreshCw size={19} className={cargando ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>
      </section>

      <section className="grid sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Store size={24} />
          </div>
          <p className="text-sm text-slate-500 mt-5">Total sucursales</p>
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
          <table className="w-full min-w-[1200px]">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                  Sucursal
                </th>
                <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                  Clave
                </th>
                <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                  Responsable
                </th>
                <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                  Contacto
                </th>
                <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                  Dirección
                </th>
                <th className="px-5 py-4 text-center text-xs font-bold text-slate-500 uppercase">
                  Estado
                </th>
                <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                  Alta
                </th>
                <th className="px-5 py-4 text-center text-xs font-bold text-slate-500 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {cargando ? (
                <tr>
                  <td colSpan="8" className="px-5 py-10 text-center text-slate-500">
                    Cargando sucursales...
                  </td>
                </tr>
              ) : sucursalesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-5 py-10 text-center text-slate-500">
                    No hay sucursales registradas.
                  </td>
                </tr>
              ) : (
                sucursalesFiltradas.map((sucursal) => (
                  <tr key={sucursal.id_sucursal} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                          <Store size={19} />
                        </div>

                        <div>
                          <p className="font-bold text-slate-800">
                            {sucursal.nombre}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            ID #{sucursal.id_sucursal}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                        <KeyRound size={13} />
                        {sucursal.clave}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <User size={15} className="text-slate-400" />
                        {sucursal.responsable || '—'}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Phone size={15} className="text-slate-400" />
                          {sucursal.telefono || '—'}
                        </div>

                        <div className="flex items-center gap-2">
                          <Mail size={15} className="text-slate-400" />
                          {sucursal.correo || '—'}
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600 max-w-xs">
                      <div className="flex items-start gap-2">
                        <MapPin size={15} className="text-slate-400 mt-0.5 shrink-0" />
                        <span className="line-clamp-2">
                          {sucursal.direccion || '—'}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-center">
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full ${
                          sucursal.activo
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {sucursal.activo ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {formatoFecha(sucursal.fecha_creacion)}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => abrirEditar(sucursal)}
                          className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center justify-center transition"
                          title="Editar"
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          onClick={() => desactivarSucursal(sucursal)}
                          disabled={!sucursal.activo}
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
                  {modoEdicion ? 'Editar sucursal' : 'Nueva sucursal'}
                </h2>
                <p className="text-sm text-slate-500">
                  Captura la información general de la farmacia.
                </p>
              </div>

              <button
                onClick={cerrarModal}
                className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={guardarSucursal} className="p-6 overflow-y-auto max-h-[75vh]">
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Nombre de sucursal *
                  </label>
                  <div className="relative">
                    <Store
                      className="absolute left-4 top-3.5 text-slate-400"
                      size={20}
                    />
                    <input
                      name="nombre"
                      value={form.nombre}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Ej. Farmacia Centro"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Clave *
                  </label>
                  <div className="relative">
                    <KeyRound
                      className="absolute left-4 top-3.5 text-slate-400"
                      size={20}
                    />
                    <input
                      name="clave"
                      value={form.clave}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          clave: e.target.value.toUpperCase(),
                        })
                      }
                      className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase"
                      placeholder="Ej. CENTRO"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Usa una clave corta y única, por ejemplo CENTRO, NORTE o PRINCIPAL.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Responsable
                  </label>
                  <div className="relative">
                    <User
                      className="absolute left-4 top-3.5 text-slate-400"
                      size={20}
                    />
                    <input
                      name="responsable"
                      value={form.responsable}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Nombre del encargado"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Teléfono
                  </label>
                  <div className="relative">
                    <Phone
                      className="absolute left-4 top-3.5 text-slate-400"
                      size={20}
                    />
                    <input
                      name="telefono"
                      value={form.telefono}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="7711234567"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Correo
                  </label>
                  <div className="relative">
                    <Mail
                      className="absolute left-4 top-3.5 text-slate-400"
                      size={20}
                    />
                    <input
                      name="correo"
                      value={form.correo}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="sucursal@farmacia.com"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Dirección
                  </label>
                  <div className="relative">
                    <MapPin
                      className="absolute left-4 top-3.5 text-slate-400"
                      size={20}
                    />
                    <textarea
                      name="direccion"
                      value={form.direccion}
                      onChange={handleChange}
                      rows="3"
                      className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                      placeholder="Calle, número, colonia, municipio..."
                    />
                  </div>
                </div>

                {modoEdicion && (
                  <div className="md:col-span-2">
                    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 cursor-pointer">
                      <input
                        type="checkbox"
                        name="activo"
                        checked={form.activo}
                        onChange={handleChange}
                        className="w-5 h-5 accent-emerald-700"
                      />
                      <span className="font-semibold text-slate-700">
                        Sucursal activa
                      </span>
                    </label>
                  </div>
                )}
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
                  {guardando
                    ? 'Guardando...'
                    : modoEdicion
                    ? 'Actualizar sucursal'
                    : 'Guardar sucursal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}