import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
  UserRound,
  Save,
  Loader2,
  BadgeCheck,
  Stethoscope,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  Search,
} from 'lucide-react';

import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function DoctorPerfil() {
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [form, setForm] = useState({
    nombre_completo: '',
    cedula_profesional: '',
    especialidad: '',
    telefono: '',
    correo: '',
    direccion_consultorio: '',
  });

  const [perfilCompleto, setPerfilCompleto] = useState(false);

  const cargarPerfil = async () => {
    try {
      setCargando(true);

      const { data } = await api.get('/doctores/mi-perfil');

      if (data.ok) {
        const perfil = data.perfil;

        setForm({
          nombre_completo: perfil.nombre_completo || usuario?.nombre || '',
          cedula_profesional: perfil.cedula_profesional || '',
          especialidad: perfil.especialidad || '',
          telefono: perfil.telefono || '',
          correo: perfil.correo || perfil.correo_usuario || usuario?.correo || '',
          direccion_consultorio: perfil.direccion_consultorio || '',
        });

        setPerfilCompleto(perfil.perfil_completo === true);
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudo cargar el perfil médico.',
      });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarPerfil();
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const validarFormulario = () => {
    if (!form.nombre_completo.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Nombre requerido',
        text: 'Ingresa tu nombre completo.',
      });
      return false;
    }

    if (!form.cedula_profesional.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Cédula requerida',
        text: 'Ingresa tu cédula profesional.',
      });
      return false;
    }

    if (!form.especialidad.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Especialidad requerida',
        text: 'Ingresa tu especialidad médica.',
      });
      return false;
    }

    return true;
  };

  const guardarPerfil = async (e) => {
    e.preventDefault();

    if (!validarFormulario()) return;

    try {
      setGuardando(true);

      const { data } = await api.put('/doctores/mi-perfil', {
        nombre_completo: form.nombre_completo.trim(),
        cedula_profesional: form.cedula_profesional.trim(),
        especialidad: form.especialidad.trim(),
        telefono: form.telefono.trim() || null,
        correo: form.correo.trim() || null,
        direccion_consultorio: form.direccion_consultorio.trim() || null,
      });

      if (data.ok) {
        setPerfilCompleto(true);

        const usuarioActual = JSON.parse(localStorage.getItem('usuario') || '{}');

        const usuarioActualizado = {
          ...usuarioActual,
          requiere_completar_perfil_doctor: false,
          doctor: {
            ...(usuarioActual.doctor || {}),
            ...data.perfil,
            perfil_completo: true,
          },
        };

        localStorage.setItem('usuario', JSON.stringify(usuarioActualizado));

        Swal.fire({
          icon: 'success',
          title: 'Perfil actualizado',
          text: 'Tus datos médicos fueron guardados correctamente.',
          timer: 1600,
          showConfirmButton: false,
        });

        setTimeout(() => {
          navigate('/app/stock-sucursales', { replace: true });
        }, 900);
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudo guardar el perfil médico.',
      });
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-sky-700" size={34} />
          <p className="font-bold text-slate-700">
            Cargando perfil médico...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="bg-gradient-to-r from-sky-700 to-cyan-500 rounded-3xl p-7 text-white shadow-lg shadow-sky-900/20">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center">
              <UserRound size={30} />
            </div>

            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                Mi perfil médico
              </h1>
              <p className="text-sky-100 mt-1">
                Completa tus datos profesionales para poder gestionar recetas.
              </p>
            </div>
          </div>

          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl font-bold text-sm ${
              perfilCompleto
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-amber-100 text-amber-700'
            }`}
          >
            <ShieldCheck size={18} />
            {perfilCompleto ? 'Perfil completo' : 'Perfil pendiente'}
          </div>
        </div>
      </section>

      {!perfilCompleto && (
        <section className="bg-amber-50 border border-amber-100 rounded-3xl p-5 text-amber-800">
          <div className="flex items-start gap-3">
            <BadgeCheck size={24} className="mt-0.5" />
            <div>
              <p className="font-bold">
                Completa tu perfil para continuar
              </p>
              <p className="text-sm mt-1">
                Necesitamos tu nombre completo y cédula profesional para validar las recetas que subas al sistema.
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="grid xl:grid-cols-[1fr_0.7fr] gap-6">
        <form
          onSubmit={guardarPerfil}
          className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-5"
        >
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              Datos profesionales
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Esta información se usará para identificar tus recetas médicas.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Nombre completo *
              </label>

              <div className="relative">
                <UserRound
                  className="absolute left-4 top-3.5 text-slate-400"
                  size={20}
                />

                <input
                  type="text"
                  name="nombre_completo"
                  value={form.nombre_completo}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Ej. Dr. Juan Pérez López"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Cédula profesional *
              </label>

              <div className="relative">
                <BadgeCheck
                  className="absolute left-4 top-3.5 text-slate-400"
                  size={20}
                />

                <input
                  type="text"
                  name="cedula_profesional"
                  value={form.cedula_profesional}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Ej. 12345678"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Especialidad *
              </label>

              <div className="relative">
                <Stethoscope
                  className="absolute left-4 top-3.5 text-slate-400"
                  size={20}
                />

                <input
                  type="text"
                  name="especialidad"
                  value={form.especialidad}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Ej. Medicina General"
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
                  type="text"
                  name="telefono"
                  value={form.telefono}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Ej. 7711234567"
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
                  type="email"
                  name="correo"
                  value={form.correo}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="correo@ejemplo.com"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Dirección del consultorio
              </label>

              <div className="relative">
                <MapPin
                  className="absolute left-4 top-3.5 text-slate-400"
                  size={20}
                />

                <textarea
                  name="direccion_consultorio"
                  value={form.direccion_consultorio}
                  onChange={handleChange}
                  rows="3"
                  className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                  placeholder="Dirección o referencia del consultorio..."
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-3">
            <button
              type="submit"
              disabled={guardando}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-sky-700 hover:bg-sky-800 text-white font-bold shadow-lg shadow-sky-900/20 transition disabled:opacity-60"
            >
              {guardando ? (
                <Loader2 size={19} className="animate-spin" />
              ) : (
                <Save size={19} />
              )}
              {guardando ? 'Guardando...' : 'Guardar perfil'}
            </button>

            {perfilCompleto && (
              <button
                type="button"
                onClick={() => navigate('/app/stock-sucursales')}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
              >
                <Search size={19} />
                Ir a consultar stock
              </button>
            )}
          </div>
        </form>

        <aside className="space-y-5">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center mb-4">
              <Stethoscope size={24} />
            </div>

            <h3 className="text-lg font-bold text-slate-800">
              Acceso para doctores
            </h3>

            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              Una vez completo tu perfil, podrás consultar la existencia de medicamentos y registrar recetas médicas para productos controlados.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
              <ShieldCheck size={24} />
            </div>

            <h3 className="text-lg font-bold text-slate-800">
              Datos requeridos
            </h3>

            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>• Nombre completo del médico.</li>
              <li>• Cédula profesional vigente.</li>
              <li>• Especialidad médica.</li>
              <li>• Datos de contacto opcionales.</li>
            </ul>
          </div>
        </aside>
      </section>
    </div>
  );
}