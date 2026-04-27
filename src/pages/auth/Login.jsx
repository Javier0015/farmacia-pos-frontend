import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
  Pill,
  User,
  Lock,
  Loader2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    usuario: '',
    password: '',
  });

  const [cargando, setCargando] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.usuario || !form.password) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos obligatorios',
        text: 'Ingresa usuario y contraseña.',
      });
      return;
    }

    try {
      setCargando(true);

      const respuesta = await login(form.usuario, form.password);

      if (respuesta.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Bienvenido',
          text: `Hola, ${respuesta.usuario.nombre}`,
          timer: 1200,
          showConfirmButton: false,
        });

        navigate('/app/dashboard');
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Acceso denegado',
        text:
          error.response?.data?.mensaje ||
          'No se pudo iniciar sesión. Verifica tus datos.',
      });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-800 to-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-5xl grid md:grid-cols-2 bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20">
        <div className="hidden md:flex flex-col justify-between p-10 text-white bg-white/5">
          <div>
            <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center mb-6">
              <Pill size={34} />
            </div>

            <h1 className="text-4xl font-bold leading-tight">
              Farmacias Shaddai
            </h1>

            <p className="mt-4 text-emerald-100 text-lg">
              Bienestar al alcance de todos.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-10">
            <div className="rounded-2xl bg-white/10 p-4">
              <p className="text-sm text-emerald-100">Inventario</p>
              <p className="text-2xl font-bold">Multi-sucursal</p>
            </div>

            <div className="rounded-2xl bg-white/10 p-4">
              <p className="text-sm text-emerald-100">Caja</p>
              <p className="text-2xl font-bold">Cortes diarios</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 md:p-10">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-800">
              Iniciar sesión
            </h2>
            <p className="text-slate-500 mt-2">
              Ingresa tus credenciales para acceder al sistema.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Usuario
              </label>

              <div className="relative">
                <User
                  className="absolute left-3 top-3 text-slate-400"
                  size={20}
                />

                <input
                  type="text"
                  name="usuario"
                  value={form.usuario}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Escriba su usuario..."
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Contraseña
              </label>

              <div className="relative">
                <Lock
                  className="absolute left-3 top-3 text-slate-400"
                  size={20}
                />

                <input
                  type={mostrarPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className="w-full pl-11 pr-12 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Escriba su contraseña..."
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  onClick={() => setMostrarPassword((prev) => !prev)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-emerald-700 transition"
                  title={
                    mostrarPassword
                      ? 'Ocultar contraseña'
                      : 'Mostrar contraseña'
                  }
                  aria-label={
                    mostrarPassword
                      ? 'Ocultar contraseña'
                      : 'Mostrar contraseña'
                  }
                >
                  {mostrarPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-lg shadow-emerald-900/20 transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {cargando && <Loader2 className="animate-spin" size={20} />}
              {cargando ? 'Entrando...' : 'Entrar al sistema'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}