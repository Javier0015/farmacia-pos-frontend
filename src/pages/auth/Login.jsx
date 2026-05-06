import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
  User,
  Lock,
  Loader2,
  Eye,
  EyeOff,
  ShieldCheck,
  Store,
  ClipboardList,
  ArrowRight,
  Sparkles,
  BadgeCheck,
  Stethoscope,
  Building2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

import logoFarmacia from '../../assets/logoShaddai.png';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    usuario: '',
    password: '',
  });

  const [cargando, setCargando] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);

  const obtenerRutaInicial = (usuarioLogin) => {
    const rol = String(usuarioLogin?.rol || '').toUpperCase();

    if (rol === 'DOCTOR') {
      if (usuarioLogin?.requiere_completar_perfil_doctor) {
        return '/app/recetas';
      }

      return '/app/recetas';
    }

    return '/app/dashboard';
  };

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

      const respuesta = await login(form.usuario.trim(), form.password);

      if (respuesta.ok) {
        const rutaInicial = obtenerRutaInicial(respuesta.usuario);

        Swal.fire({
          icon: 'success',
          title: 'Bienvenido',
          text: `Hola, ${respuesta.usuario.nombre}`,
          timer: 1000,
          showConfirmButton: false,
        });

        navigate(rutaInicial, { replace: true });
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
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-sky-50 via-white to-cyan-100 flex items-center justify-center px-4 py-8 sm:py-10">
      {/* Fondo decorativo */}
      <div className="absolute -top-40 -left-40 w-[30rem] h-[30rem] bg-sky-300/35 rounded-full blur-3xl animate-pulse" />
      <div className="absolute -bottom-44 -right-44 w-[32rem] h-[32rem] bg-cyan-300/40 rounded-full blur-3xl animate-pulse" />
      <div className="absolute top-1/3 left-1/2 w-96 h-96 bg-blue-200/25 rounded-full blur-3xl animate-[slowPulse_6s_ease-in-out_infinite]" />

      {/* Patrón */}
      <div className="absolute inset-0 opacity-[0.22] bg-[radial-gradient(circle_at_1px_1px,#0ea5e9_1px,transparent_0)] [background-size:30px_30px]" />

      <div className="relative w-full max-w-7xl grid lg:grid-cols-[1.08fr_0.92fr] bg-white/85 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-sky-900/10 border border-white overflow-hidden animate-[fadeUp_0.7s_ease-out]">
        {/* Panel izquierdo */}
        <section className="relative hidden lg:flex min-h-[690px] bg-gradient-to-br from-sky-500 via-cyan-500 to-sky-800 text-white p-12 flex-col justify-between overflow-hidden">
          {/* Brillos */}
          <div className="absolute -top-28 -right-28 w-96 h-96 bg-white/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-32 -left-32 w-[28rem] h-[28rem] bg-cyan-100/25 rounded-full blur-3xl animate-[slowPulse_7s_ease-in-out_infinite]" />
          <div className="absolute top-28 right-16 w-32 h-32 bg-white/10 rounded-full blur-2xl" />

          {/* Patrón interno */}
          <div className="absolute inset-0 opacity-[0.11] bg-[radial-gradient(circle_at_1px_1px,#ffffff_1px,transparent_0)] [background-size:26px_26px]" />

          {/* Figuras decorativas */}
          <div className="absolute right-10 top-10 w-28 h-28 rounded-[2rem] border border-white/20 rotate-12" />
          <div className="absolute right-28 bottom-40 w-20 h-20 rounded-full border border-white/20" />
          <div className="absolute left-10 bottom-36 w-24 h-24 rounded-[2rem] bg-white/10 -rotate-12 blur-[1px]" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 border border-white/25 px-4 py-2 text-sm font-black text-white shadow-sm backdrop-blur">
              <ShieldCheck size={18} />
              Acceso seguro
            </div>

            {/* Logo principal */}
            <div className="mt-9 flex items-center gap-5">
              <div className="relative">
                <div className="absolute inset-0 rounded-[2.3rem] bg-white/40 blur-xl animate-[softGlow_4s_ease-in-out_infinite]" />

                <div className="relative w-32 h-32 rounded-[2.3rem] bg-white/25 border border-white/35 flex items-center justify-center shadow-2xl shadow-sky-950/20 animate-[softFloat_4s_ease-in-out_infinite] overflow-hidden backdrop-blur-xl">
                  <div className="absolute inset-2 rounded-[1.9rem] bg-white/15 border border-white/20" />

                  <img
                    src={logoFarmacia}
                    alt="Logo Farmacias Shaddai"
                    className="relative w-24 h-24 object-contain drop-shadow-xl"
                  />
                </div>
              </div>

              <div>
                <p className="text-sm text-sky-50 font-semibold">
                  Sistema integral
                </p>
                <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-emerald-400/20 border border-emerald-200/30 px-3 py-1.5 text-xs font-bold text-white">
                  <BadgeCheck size={15} />
                  Farmacia activa
                </div>
              </div>
            </div>

            <h1 className="mt-10 text-6xl font-black leading-[1.02] tracking-tight">
              Farmacias
              <span className="block text-white/95">Shaddai</span>
            </h1>

            <p className="mt-6 text-xl text-sky-50 leading-relaxed max-w-xl font-medium">
              Administra ventas, caja, inventario, recetas, proveedores y
              sucursales desde un solo lugar.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/20 px-4 py-2 text-sm font-bold text-white backdrop-blur">
                <Stethoscope size={17} />
                Recetas médicas
              </span>

              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/20 px-4 py-2 text-sm font-bold text-white backdrop-blur">
                <Building2 size={17} />
                Multi-sucursal
              </span>
            </div>
          </div>


        </section>

        {/* Formulario */}
        <section className="relative p-7 sm:p-10 lg:p-14 flex flex-col justify-center">
          <div className="absolute top-0 right-0 w-44 h-44 bg-sky-100/70 rounded-bl-[5rem] -z-0" />

          {/* Logo móvil */}
          <div className="relative lg:hidden mb-8">
            <div className="w-24 h-24 rounded-[2rem] bg-sky-50 border border-sky-100 flex items-center justify-center shadow-sm overflow-hidden">
              <img
                src={logoFarmacia}
                alt="Logo Farmacias Shaddai"
                className="w-20 h-20 object-contain"
              />
            </div>

            <h1 className="text-3xl font-black text-slate-900 mt-4">
              Farmacias Shaddai
            </h1>

            <p className="text-slate-500 mt-1">
              Bienestar al alcance de todos.
            </p>
          </div>

          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full bg-sky-50 text-sky-700 px-4 py-2 text-sm font-black border border-sky-100">
              <Sparkles size={17} />
              Inicio de sesión
            </span>

            <h2 className="text-4xl sm:text-5xl font-black text-slate-950 mt-6 tracking-tight">
              Bienvenido
            </h2>

            <p className="text-slate-500 mt-4 leading-relaxed text-base sm:text-lg">
              Ingresa tu usuario y contraseña para acceder al sistema.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="relative space-y-5 mt-9">
            <div>
              <label className="block text-sm font-black text-slate-700 mb-2">
                Usuario
              </label>

              <div className="relative group">
                <User
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-600 transition"
                  size={21}
                />

                <input
                  type="text"
                  name="usuario"
                  value={form.usuario}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 bg-slate-50/80 focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-400 transition shadow-sm text-slate-800 placeholder:text-slate-400"
                  placeholder="Escribe tu usuario"
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-black text-slate-700 mb-2">
                Contraseña
              </label>

              <div className="relative group">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-600 transition"
                  size={21}
                />

                <input
                  type={mostrarPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className="w-full pl-12 pr-12 py-4 rounded-2xl border border-slate-200 bg-slate-50/80 focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-400 transition shadow-sm text-slate-800 placeholder:text-slate-400"
                  placeholder="Escribe tu contraseña"
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  onClick={() => setMostrarPassword((prev) => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-sky-600 transition"
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
                  {mostrarPassword ? <EyeOff size={21} /> : <Eye size={21} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="group relative overflow-hidden w-full py-4 rounded-2xl bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700 text-white font-black shadow-xl shadow-sky-900/20 transition disabled:opacity-60 flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <span className="absolute inset-0 bg-white/15 translate-x-[-120%] group-hover:translate-x-[120%] transition-transform duration-700 skew-x-12" />

              <span className="relative flex items-center justify-center gap-2">
                {cargando ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Entrando...
                  </>
                ) : (
                  <>
                    Entrar al sistema
                    <ArrowRight
                      size={20}
                      className="transition group-hover:translate-x-1"
                    />
                  </>
                )}
              </span>
            </button>
          </form>

          <div className="relative mt-9 rounded-[2rem] bg-gradient-to-br from-slate-50 to-sky-50/60 border border-slate-100 p-5 transition hover:border-sky-100 hover:shadow-lg hover:shadow-sky-900/5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white text-sky-700 flex items-center justify-center shrink-0 shadow-sm border border-sky-100">
                <ShieldCheck size={23} />
              </div>

              <div>
                <p className="font-black text-slate-800">
                  Acceso protegido
                </p>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                  Por seguridad, no compartas tu usuario ni contraseña.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <style>
        {`
          @keyframes fadeUp {
            from {
              opacity: 0;
              transform: translateY(18px) scale(0.98);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          @keyframes softFloat {
            0%, 100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-8px);
            }
          }

          @keyframes slowPulse {
            0%, 100% {
              opacity: 0.45;
              transform: scale(1);
            }
            50% {
              opacity: 0.85;
              transform: scale(1.08);
            }
          }

          @keyframes softGlow {
            0%, 100% {
              opacity: 0.45;
              transform: scale(1);
            }
            50% {
              opacity: 0.8;
              transform: scale(1.08);
            }
          }
        `}
      </style>
    </div>
  );
}