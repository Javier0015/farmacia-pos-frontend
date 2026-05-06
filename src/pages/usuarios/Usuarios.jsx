import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import {
  Users,
  Plus,
  Search,
  RefreshCw,
  Pencil,
  Trash2,
  X,
  Save,
  User,
  Mail,
  Lock,
  Shield,
  Store,
  Eye,
  EyeOff,
} from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const formInicial = {
  nombre: '',
  usuario: '',
  correo: '',
  password: '',
  id_rol: '',
  sucursales: [],
  activo: true,
};

export default function Usuarios() {
  const { usuario: usuarioSesion } = useAuth();

  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [sucursales, setSucursales] = useState([]);

  const [buscar, setBuscar] = useState('');
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [form, setForm] = useState(formInicial);

  const totalActivos = useMemo(() => {
    return usuarios.filter((u) => u.activo).length;
  }, [usuarios]);

  const totalInactivos = useMemo(() => {
    return usuarios.filter((u) => !u.activo).length;
  }, [usuarios]);

  const cargarUsuarios = async () => {
    try {
      setCargando(true);

      const params = new URLSearchParams();

      if (buscar.trim()) {
        params.append('buscar', buscar.trim());
      }

      const { data } = await api.get(`/usuarios?${params.toString()}`);

      if (data.ok) {
        setUsuarios(data.usuarios || []);
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudieron cargar los usuarios.',
      });
    } finally {
      setCargando(false);
    }
  };

  const cargarRoles = async () => {
    try {
      const { data } = await api.get('/usuarios/roles');

      if (data.ok) {
        setRoles(data.roles || []);
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar los roles.',
      });
    }
  };

  const cargarSucursales = async () => {
    try {
      const { data } = await api.get('/sucursales');

      if (data.ok) {
        setSucursales((data.sucursales || []).filter((s) => s.activo));
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

  useEffect(() => {
    cargarUsuarios();
    cargarRoles();
    cargarSucursales();
  }, []);

  const abrirNuevo = () => {
    const rolCajero = roles.find((r) => r.nombre === 'CAJERO');

    setForm({
      ...formInicial,
      id_rol: rolCajero?.id_rol || roles[0]?.id_rol || '',
      sucursales: usuarioSesion?.sucursales?.[0]?.id_sucursal
        ? [usuarioSesion.sucursales[0].id_sucursal]
        : [],
    });

    setModoEdicion(false);
    setUsuarioEditando(null);
    setMostrarPassword(false);
    setModalAbierto(true);
  };

  const abrirEditar = (usuario) => {
    setUsuarioEditando(usuario);
    setModoEdicion(true);
    setMostrarPassword(false);

    setForm({
      nombre: usuario.nombre || '',
      usuario: usuario.usuario || '',
      correo: usuario.correo || '',
      password: '',
      id_rol: usuario.id_rol || '',
      sucursales: (usuario.sucursales || []).map((s) => Number(s.id_sucursal)),
      activo: Boolean(usuario.activo),
    });

    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setModoEdicion(false);
    setUsuarioEditando(null);
    setMostrarPassword(false);
    setForm(formInicial);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const toggleSucursal = (idSucursal) => {
    const idNum = Number(idSucursal);

    setForm((prev) => {
      const existe = prev.sucursales.includes(idNum);

      return {
        ...prev,
        sucursales: existe
          ? prev.sucursales.filter((id) => id !== idNum)
          : [...prev.sucursales, idNum],
      };
    });
  };

  const validarForm = () => {
    if (!form.nombre.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Nombre obligatorio',
        text: 'Ingresa el nombre completo del usuario.',
      });
      return false;
    }

    if (!form.usuario.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Usuario obligatorio',
        text: 'Ingresa el nombre de acceso.',
      });
      return false;
    }

    if (!modoEdicion && (!form.password || form.password.length < 6)) {
      Swal.fire({
        icon: 'warning',
        title: 'Contraseña inválida',
        text: 'La contraseña debe tener al menos 6 caracteres.',
      });
      return false;
    }

    if (modoEdicion && form.password && form.password.length < 6) {
      Swal.fire({
        icon: 'warning',
        title: 'Contraseña inválida',
        text: 'La nueva contraseña debe tener al menos 6 caracteres.',
      });
      return false;
    }

    if (!form.id_rol) {
      Swal.fire({
        icon: 'warning',
        title: 'Rol obligatorio',
        text: 'Selecciona un rol para el usuario.',
      });
      return false;
    }

    if (!Array.isArray(form.sucursales) || form.sucursales.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Sucursal obligatoria',
        text: 'Asigna al menos una sucursal al usuario.',
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

  const guardarUsuario = async (e) => {
    e.preventDefault();

    if (!validarForm()) return;

    try {
      setGuardando(true);

      const payload = {
        nombre: form.nombre.trim(),
        usuario: form.usuario.trim(),
        correo: form.correo.trim() || null,
        id_rol: Number(form.id_rol),
        sucursales: form.sucursales.map((id) => Number(id)),
        activo: form.activo,
      };

      if (form.password.trim()) {
        payload.password = form.password.trim();
      }

      let respuesta;

      if (modoEdicion) {
        respuesta = await api.put(
          `/usuarios/${usuarioEditando.id_usuario}`,
          payload
        );
      } else {
        respuesta = await api.post('/usuarios', payload);
      }

      if (respuesta.data.ok) {
        Swal.fire({
          icon: 'success',
          title: modoEdicion ? 'Usuario actualizado' : 'Usuario creado',
          text: respuesta.data.mensaje,
          timer: 1500,
          showConfirmButton: false,
        });

        cerrarModal();
        cargarUsuarios();
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudo guardar el usuario.',
      });
    } finally {
      setGuardando(false);
    }
  };

  const desactivarUsuario = async (usuario) => {
    if (Number(usuario.id_usuario) === Number(usuarioSesion?.id_usuario)) {
      Swal.fire({
        icon: 'warning',
        title: 'Acción no permitida',
        text: 'No puedes desactivar tu propio usuario.',
      });
      return;
    }

    const confirmacion = await Swal.fire({
      icon: 'warning',
      title: '¿Desactivar usuario?',
      text: `Se desactivará: ${usuario.nombre}`,
      showCancelButton: true,
      confirmButtonText: 'Sí, desactivar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
    });

    if (!confirmacion.isConfirmed) return;

    try {
      const { data } = await api.delete(`/usuarios/${usuario.id_usuario}`);

      if (data.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Usuario desactivado',
          text: data.mensaje,
          timer: 1400,
          showConfirmButton: false,
        });

        cargarUsuarios();
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudo desactivar el usuario.',
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

  const getRolStyle = (rol) => {
    if (rol === 'SUPER_ADMIN') return 'bg-red-100 text-red-700';
    if (rol === 'ADMIN_SUCURSAL') return 'bg-blue-100 text-blue-700';
    if (rol === 'CAJERO') return 'bg-sky-100 text-sky-700';
    if (rol === 'ALMACEN') return 'bg-amber-100 text-amber-700';
    if (rol === 'COMPRAS') return 'bg-violet-100 text-violet-700';
    return 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center">
              <Users size={25} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                Usuarios y roles
              </h1>
              <p className="text-slate-500">
                Administra usuarios, roles y sucursales asignadas.
              </p>
            </div>
          </div>

          <button
            onClick={abrirNuevo}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-sky-700 hover:bg-sky-800 text-white font-bold shadow-lg shadow-sky-900/20 transition"
          >
            <Plus size={20} />
            Nuevo usuario
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
                if (e.key === 'Enter') cargarUsuarios();
              }}
              className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="Buscar por nombre, usuario, correo o rol..."
            />
          </div>

          <button
            onClick={cargarUsuarios}
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
            <Users size={24} />
          </div>
          <p className="text-sm text-slate-500 mt-5">Total usuarios</p>
          <h3 className="text-3xl font-bold text-slate-800 mt-1">
            {usuarios.length}
          </h3>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <User size={24} />
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
                  Usuario
                </th>
                <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                  Correo
                </th>
                <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                  Rol
                </th>
                <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                  Sucursales
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
                  <td colSpan="7" className="px-5 py-10 text-center text-slate-500">
                    Cargando usuarios...
                  </td>
                </tr>
              ) : usuarios.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-5 py-10 text-center text-slate-500">
                    No hay usuarios registrados.
                  </td>
                </tr>
              ) : (
                usuarios.map((item) => (
                  <tr key={item.id_usuario} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center">
                          <User size={20} />
                        </div>

                        <div>
                          <p className="font-bold text-slate-800">
                            {item.nombre}
                          </p>
                          <p className="text-xs text-slate-500">
                            @{item.usuario}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <Mail size={16} className="text-slate-400" />
                        {item.correo || '—'}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full ${getRolStyle(
                          item.rol
                        )}`}
                      >
                        {item.rol}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        {(item.sucursales || []).length === 0 ? (
                          <span className="text-sm text-slate-400">Sin sucursal</span>
                        ) : (
                          item.sucursales.map((sucursal) => (
                            <span
                              key={`${item.id_usuario}-${sucursal.id_sucursal}`}
                              className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700"
                            >
                              <Store size={13} />
                              {sucursal.nombre}
                            </span>
                          ))
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-center">
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full ${
                          item.activo
                            ? 'bg-sky-100 text-sky-700'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {item.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {formatoFecha(item.fecha_creacion)}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => abrirEditar(item)}
                          className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center justify-center transition"
                          title="Editar"
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          onClick={() => desactivarUsuario(item)}
                          disabled={Number(item.id_usuario) === Number(usuarioSesion?.id_usuario)}
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
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  {modoEdicion ? 'Editar usuario' : 'Nuevo usuario'}
                </h2>
                <p className="text-sm text-slate-500">
                  Asigna rol, contraseña y sucursales del usuario.
                </p>
              </div>

              <button
                onClick={cerrarModal}
                className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={guardarUsuario} className="p-6 overflow-y-auto max-h-[78vh]">
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Nombre completo *
                  </label>
                  <div className="relative">
                    <User
                      className="absolute left-4 top-3.5 text-slate-400"
                      size={20}
                    />
                    <input
                      name="nombre"
                      value={form.nombre}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      placeholder="Ej. Cajero Principal"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Usuario de acceso *
                  </label>
                  <div className="relative">
                    <User
                      className="absolute left-4 top-3.5 text-slate-400"
                      size={20}
                    />
                    <input
                      name="usuario"
                      value={form.usuario}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      placeholder="cajero1"
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
                      placeholder="correo@farmacia.local"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Contraseña {modoEdicion ? '(opcional)' : '*'}
                  </label>
                  <div className="relative">
                    <Lock
                      className="absolute left-4 top-3.5 text-slate-400"
                      size={20}
                    />
                    <input
                      type={mostrarPassword ? 'text' : 'password'}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      className="w-full pl-12 pr-12 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      placeholder={modoEdicion ? 'Dejar vacío para no cambiar' : 'Mínimo 6 caracteres'}
                    />

                    <button
                      type="button"
                      onClick={() => setMostrarPassword(!mostrarPassword)}
                      className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-700"
                    >
                      {mostrarPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Rol *
                  </label>
                  <div className="relative">
                    <Shield
                      className="absolute left-4 top-3.5 text-slate-400"
                      size={20}
                    />
                    <select
                      name="id_rol"
                      value={form.id_rol}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="">Selecciona rol</option>
                      {roles.map((rol) => (
                        <option key={rol.id_rol} value={rol.id_rol}>
                          {rol.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {modoEdicion && (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Estado
                    </label>
                    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="activo"
                        checked={form.activo}
                        onChange={handleChange}
                        className="w-5 h-5 accent-sky-700"
                      />
                      <span className="font-semibold text-slate-700">
                        Usuario activo
                      </span>
                    </label>
                  </div>
                )}

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Sucursales asignadas *
                  </label>

                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {sucursales.map((sucursal) => {
                      const checked = form.sucursales.includes(
                        Number(sucursal.id_sucursal)
                      );

                      return (
                        <label
                          key={sucursal.id_sucursal}
                          className={`flex items-center gap-3 rounded-2xl border p-4 cursor-pointer transition ${
                            checked
                              ? 'border-sky-500 bg-sky-50'
                              : 'border-slate-200 bg-white hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleSucursal(sucursal.id_sucursal)}
                            className="w-5 h-5 accent-sky-700"
                          />

                          <div>
                            <p className="font-bold text-slate-800">
                              {sucursal.nombre}
                            </p>
                            <p className="text-xs text-slate-500">
                              {sucursal.clave}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
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
                  {guardando
                    ? 'Guardando...'
                    : modoEdicion
                    ? 'Actualizar usuario'
                    : 'Guardar usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}