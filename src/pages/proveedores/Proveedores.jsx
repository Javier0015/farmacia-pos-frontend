import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import {
  Truck,
  Plus,
  Search,
  RefreshCw,
  Pencil,
  Trash2,
  X,
  Save,
  Phone,
  Mail,
  MapPin,
  User,
  FileText,
} from 'lucide-react';
import api from '../../api/axios';

const formInicial = {
  nombre: '',
  rfc: '',
  telefono: '',
  correo: '',
  direccion: '',
  contacto: '',
  activo: true,
};

export default function Proveedores() {
  const [proveedores, setProveedores] = useState([]);
  const [buscar, setBuscar] = useState('');
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [proveedorEditando, setProveedorEditando] = useState(null);
  const [form, setForm] = useState(formInicial);

  const cargarProveedores = async () => {
    try {
      setCargando(true);

      const params = new URLSearchParams();

      if (buscar.trim()) {
        params.append('buscar', buscar.trim());
      }

      const { data } = await api.get(`/proveedores?${params.toString()}`);

      if (data.ok) {
        setProveedores(data.proveedores || []);
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudieron cargar los proveedores.',
      });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarProveedores();
  }, []);

  const abrirNuevo = () => {
    setForm(formInicial);
    setModoEdicion(false);
    setProveedorEditando(null);
    setModalAbierto(true);
  };

  const abrirEditar = (proveedor) => {
    setProveedorEditando(proveedor);
    setModoEdicion(true);

    setForm({
      nombre: proveedor.nombre || '',
      rfc: proveedor.rfc || '',
      telefono: proveedor.telefono || '',
      correo: proveedor.correo || '',
      direccion: proveedor.direccion || '',
      contacto: proveedor.contacto || '',
      activo: Boolean(proveedor.activo),
    });

    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setModoEdicion(false);
    setProveedorEditando(null);
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
        text: 'Ingresa el nombre del proveedor.',
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

  const guardarProveedor = async (e) => {
    e.preventDefault();

    if (!validarForm()) return;

    try {
      setGuardando(true);

      const payload = {
        nombre: form.nombre.trim(),
        rfc: form.rfc.trim() || null,
        telefono: form.telefono.trim() || null,
        correo: form.correo.trim() || null,
        direccion: form.direccion.trim() || null,
        contacto: form.contacto.trim() || null,
        activo: form.activo,
      };

      let respuesta;

      if (modoEdicion) {
        respuesta = await api.put(
          `/proveedores/${proveedorEditando.id_proveedor}`,
          payload
        );
      } else {
        respuesta = await api.post('/proveedores', payload);
      }

      if (respuesta.data.ok) {
        Swal.fire({
          icon: 'success',
          title: modoEdicion ? 'Proveedor actualizado' : 'Proveedor creado',
          text: respuesta.data.mensaje,
          timer: 1400,
          showConfirmButton: false,
        });

        cerrarModal();
        cargarProveedores();
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudo guardar el proveedor.',
      });
    } finally {
      setGuardando(false);
    }
  };

  const desactivarProveedor = async (proveedor) => {
    const confirmacion = await Swal.fire({
      icon: 'warning',
      title: '¿Desactivar proveedor?',
      text: `Se desactivará: ${proveedor.nombre}`,
      showCancelButton: true,
      confirmButtonText: 'Sí, desactivar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
    });

    if (!confirmacion.isConfirmed) return;

    try {
      const { data } = await api.delete(`/proveedores/${proveedor.id_proveedor}`);

      if (data.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Proveedor desactivado',
          text: data.mensaje,
          timer: 1400,
          showConfirmButton: false,
        });

        cargarProveedores();
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudo desactivar el proveedor.',
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

  const totalActivos = proveedores.filter((p) => p.activo).length;
  const totalInactivos = proveedores.filter((p) => !p.activo).length;

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center">
              <Truck size={25} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                Proveedores
              </h1>
              <p className="text-slate-500">
                Registro de proveedores para compras, pagos y entradas de inventario.
              </p>
            </div>
          </div>

          <button
            onClick={abrirNuevo}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-sky-700 hover:bg-sky-800 text-white font-bold shadow-lg shadow-sky-900/20 transition"
          >
            <Plus size={20} />
            Nuevo proveedor
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
                if (e.key === 'Enter') cargarProveedores();
              }}
              className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="Buscar por nombre, RFC, teléfono, correo o contacto..."
            />
          </div>

          <button
            onClick={cargarProveedores}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition"
          >
            <RefreshCw size={19} className={cargando ? 'animate-spin' : ''} />
            Buscar
          </button>
        </div>
      </section>

      <section className="grid sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center">
            <Truck size={24} />
          </div>
          <p className="text-sm text-slate-500 mt-5">Total proveedores</p>
          <h3 className="text-3xl font-bold text-slate-800 mt-1">
            {proveedores.length}
          </h3>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <CheckIcon />
          </div>
          <p className="text-sm text-slate-500 mt-5">Activos</p>
          <h3 className="text-3xl font-bold text-sky-700 mt-1">
            {totalActivos}
          </h3>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <X size={24} />
          </div>
          <p className="text-sm text-slate-500 mt-5">Inactivos</p>
          <h3 className="text-3xl font-bold text-slate-800 mt-1">
            {totalInactivos}
          </h3>
        </div>
      </section>

      <section className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1150px]">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                  Proveedor
                </th>
                <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                  RFC
                </th>
                <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                  Contacto
                </th>
                <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                  Teléfono
                </th>
                <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                  Correo
                </th>
                <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                  Dirección
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
                  <td colSpan="8" className="px-5 py-10 text-center text-slate-500">
                    Cargando proveedores...
                  </td>
                </tr>
              ) : proveedores.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-5 py-10 text-center text-slate-500">
                    No hay proveedores registrados.
                  </td>
                </tr>
              ) : (
                proveedores.map((proveedor) => (
                  <tr key={proveedor.id_proveedor} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-800">
                        {proveedor.nombre}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Registro: {formatoFecha(proveedor.fecha_creacion)}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {proveedor.rfc || '—'}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-slate-400" />
                        {proveedor.contacto || '—'}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <Phone size={16} className="text-slate-400" />
                        {proveedor.telefono || '—'}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <Mail size={16} className="text-slate-400" />
                        {proveedor.correo || '—'}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600 max-w-xs">
                      <div className="flex items-start gap-2">
                        <MapPin size={16} className="text-slate-400 mt-0.5" />
                        <span className="line-clamp-2">
                          {proveedor.direccion || '—'}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-center">
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full ${
                          proveedor.activo
                            ? 'bg-sky-100 text-sky-700'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {proveedor.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => abrirEditar(proveedor)}
                          className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center justify-center transition"
                          title="Editar"
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          onClick={() => desactivarProveedor(proveedor)}
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
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  {modoEdicion ? 'Editar proveedor' : 'Nuevo proveedor'}
                </h2>
                <p className="text-sm text-slate-500">
                  Registra la información fiscal y de contacto del proveedor.
                </p>
              </div>

              <button
                onClick={cerrarModal}
                className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={guardarProveedor} className="p-6 overflow-y-auto max-h-[75vh]">
              <div className="grid md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Nombre del proveedor *
                  </label>
                  <input
                    name="nombre"
                    value={form.nombre}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="Ej. Distribuidora Farmacéutica Hidalgo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    RFC
                  </label>
                  <div className="relative">
                    <FileText
                      className="absolute left-4 top-3.5 text-slate-400"
                      size={20}
                    />
                    <input
                      name="rfc"
                      value={form.rfc}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 uppercase"
                      placeholder="DFH010101ABC"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Persona de contacto
                  </label>
                  <div className="relative">
                    <User
                      className="absolute left-4 top-3.5 text-slate-400"
                      size={20}
                    />
                    <input
                      name="contacto"
                      value={form.contacto}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      placeholder="Juan Pérez"
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
                      className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      placeholder="7711234567"
                    />
                  </div>
                </div>

                <div>
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
                      className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      placeholder="ventas@proveedor.com"
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
                      className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                      placeholder="Dirección fiscal o domicilio del proveedor"
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
                        className="w-5 h-5 accent-sky-700"
                      />
                      <span className="font-semibold text-slate-700">
                        Proveedor activo
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
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-sky-700 hover:bg-sky-800 text-white font-bold transition disabled:opacity-60"
                >
                  <Save size={19} />
                  {guardando ? 'Guardando...' : 'Guardar proveedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}