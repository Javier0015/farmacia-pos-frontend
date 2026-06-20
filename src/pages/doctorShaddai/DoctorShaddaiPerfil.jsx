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
  ClipboardPlus,
  HeartPulse,
  FileText,
  Search,
  UploadCloud,
  ImagePlus,
} from 'lucide-react';

import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function DoctorShaddaiPerfil() {
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [perfilCompleto, setPerfilCompleto] = useState(false);

  const [logoUniversidadUrl, setLogoUniversidadUrl] = useState('');
  const [logoUniversidadPreview, setLogoUniversidadPreview] = useState('');
  const [logoUniversidadFile, setLogoUniversidadFile] = useState(null);
  const [subiendoLogoUniversidad, setSubiendoLogoUniversidad] = useState(false);


  const [form, setForm] = useState({
    nombre_completo: '',
    cedula_profesional: '',
    especialidad: '',
    telefono: '',
    correo: '',
    direccion_consultorio: '',
    observaciones: '',
  });

  const obtenerUrlArchivo = (ruta) => {
    if (!ruta) return '';

    if (ruta.startsWith('http://') || ruta.startsWith('https://')) {
      return ruta;
    }

    const baseURL = api.defaults.baseURL || '';

    if (baseURL.includes('/api')) {
      return `${baseURL.replace(/\/api\/?$/, '')}${ruta}`;
    }

    return ruta;
  };

  const handleLogoUniversidadChange = (e) => {
    const archivo = e.target.files?.[0];

    if (!archivo) return;

    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];

    if (!tiposPermitidos.includes(archivo.type)) {
      Swal.fire({
        icon: 'warning',
        title: 'Formato no permitido',
        text: 'Solo se permiten imágenes JPG, PNG o WEBP.',
      });

      e.target.value = '';
      return;
    }

    const limiteMB = 2;
    const limiteBytes = limiteMB * 1024 * 1024;

    if (archivo.size > limiteBytes) {
      Swal.fire({
        icon: 'warning',
        title: 'Imagen demasiado pesada',
        text: `El logo no debe pesar más de ${limiteMB} MB.`,
      });

      e.target.value = '';
      return;
    }

    const previewTemporal = URL.createObjectURL(archivo);

    if (logoUniversidadPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(logoUniversidadPreview);
    }

    setLogoUniversidadFile(archivo);
    setLogoUniversidadPreview(previewTemporal);
  };

  const subirLogoUniversidad = async () => {
    if (!logoUniversidadFile) {
      Swal.fire({
        icon: 'info',
        title: 'Selecciona un logo',
        text: 'Primero selecciona la imagen del logo de la universidad.',
      });

      return;
    }

    try {
      setSubiendoLogoUniversidad(true);

      const formData = new FormData();
      formData.append('logo_universidad', logoUniversidadFile);

      const { data } = await api.post(
        '/doctor-shaddai/mi-perfil/logo-universidad',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (!data.ok) {
        throw new Error(data.mensaje || 'No se pudo subir el logo.');
      }

      const nuevaRuta =
        data.logo_universidad_url ||
        data.perfil?.logo_universidad_url ||
        '';

      setLogoUniversidadUrl(nuevaRuta);
      setLogoUniversidadPreview(obtenerUrlArchivo(nuevaRuta));
      setLogoUniversidadFile(null);

      const usuarioActual = JSON.parse(localStorage.getItem('usuario') || '{}');

      const usuarioActualizado = {
        ...usuarioActual,
        doctor_shaddai: {
          ...(usuarioActual.doctor_shaddai || {}),
          ...(data.perfil || {}),
          logo_universidad_url: nuevaRuta,
        },
      };

      localStorage.setItem('usuario', JSON.stringify(usuarioActualizado));

      Swal.fire({
        icon: 'success',
        title: 'Logo actualizado',
        text: 'El logo de la universidad fue guardado correctamente.',
        timer: 1600,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error('Error al subir logo de universidad:', error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          error.message ||
          'No se pudo subir el logo de la universidad.',
      });
    } finally {
      setSubiendoLogoUniversidad(false);
    }
  };

  const cargarPerfil = async () => {
    try {
      setCargando(true);

      const { data } = await api.get('/doctor-shaddai/mi-perfil');

      if (data.ok) {
        const perfil = data.perfil || {};

        setForm({
          nombre_completo: perfil.nombre_completo || usuario?.nombre || '',
          cedula_profesional: perfil.cedula_profesional || '',
          especialidad: perfil.especialidad || '',
          telefono: perfil.telefono || '',
          correo: perfil.correo || usuario?.correo || '',
          direccion_consultorio: perfil.direccion_consultorio || '',
          observaciones: perfil.observaciones || '',
        });

        setLogoUniversidadUrl(perfil.logo_universidad_url || '');
        setLogoUniversidadPreview(
          perfil.logo_universidad_url
            ? obtenerUrlArchivo(perfil.logo_universidad_url)
            : ''
        );
        setLogoUniversidadFile(null);

        setPerfilCompleto(perfil.perfil_completo === true);
      }
    } catch (error) {
      console.error('Error al cargar perfil Doctor Shaddai:', error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudo cargar el perfil de Doctor Shaddai.',
      });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarPerfil();
  }, []);

  useEffect(() => {
    return () => {
      if (logoUniversidadPreview?.startsWith('blob:')) {
        URL.revokeObjectURL(logoUniversidadPreview);
      }
    };
  }, [logoUniversidadPreview]);

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
        text: 'Ingresa el nombre completo del doctor.',
      });

      return false;
    }

    if (!form.cedula_profesional.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Cédula requerida',
        text: 'Ingresa la cédula profesional.',
      });

      return false;
    }

    if (!form.especialidad.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Especialidad requerida',
        text: 'Ingresa la especialidad médica.',
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

      const { data } = await api.put('/doctor-shaddai/mi-perfil', {
        nombre_completo: form.nombre_completo.trim(),
        cedula_profesional: form.cedula_profesional.trim(),
        especialidad: form.especialidad.trim(),
        telefono: form.telefono.trim() || null,
        correo: form.correo.trim() || null,
        direccion_consultorio: form.direccion_consultorio.trim() || null,
        observaciones: form.observaciones.trim() || null,
      });

      if (data.ok) {
        setPerfilCompleto(true);

        const usuarioActual = JSON.parse(localStorage.getItem('usuario') || '{}');

        const usuarioActualizado = {
          ...usuarioActual,
          requiere_completar_perfil_doctor_shaddai: false,
          doctor_shaddai: {
            ...(usuarioActual.doctor_shaddai || {}),
            ...data.perfil,
            perfil_completo: true,
          },
        };

        localStorage.setItem('usuario', JSON.stringify(usuarioActualizado));

        Swal.fire({
          icon: 'success',
          title: 'Perfil actualizado',
          text: 'El perfil de Doctor Shaddai fue guardado correctamente.',
          timer: 1600,
          showConfirmButton: false,
        });

        setTimeout(() => {
          navigate('/app/doctor-shaddai/expedientes', { replace: true });
        }, 900);
      }
    } catch (error) {
      console.error('Error al guardar perfil Doctor Shaddai:', error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudo guardar el perfil de Doctor Shaddai.',
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
            Cargando perfil de Doctor Shaddai...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="bg-gradient-to-r from-sky-700 via-cyan-600 to-teal-500 rounded-3xl p-7 text-white shadow-lg shadow-sky-900/20">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center">
              <HeartPulse size={31} />
            </div>

            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                Perfil Doctor Shaddai
              </h1>
              <p className="text-sky-100 mt-1">
                Completa los datos profesionales para gestionar expedientes clínicos.
              </p>
            </div>
          </div>

          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl font-bold text-sm ${perfilCompleto
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
              <p className="font-bold">Completa tu perfil para continuar</p>
              <p className="text-sm mt-1">
                Necesitamos el nombre completo, cédula profesional y especialidad
                para identificar correctamente los expedientes clínicos registrados.
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
              Esta información se usará para asociar expedientes clínicos al doctor.
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

            <div className="md:col-span-2 rounded-3xl border border-dashed border-sky-200 bg-sky-50/60 p-5">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-sky-700 shadow-sm ring-1 ring-sky-100">
                    <ImagePlus size={28} />
                  </div>

                  <div>
                    <h3 className="text-base font-black text-slate-800">
                      Logo de universidad
                    </h3>

                    <p className="mt-1 text-sm leading-relaxed text-slate-500">
                      Sube el logo de la universidad asociada al doctor. Posteriormente se
                      podrá mostrar en recetas, referencias o documentos clínicos.
                    </p>

                    <p className="mt-2 text-xs font-semibold text-slate-400">
                      Formatos permitidos: JPG, PNG o WEBP. Tamaño máximo: 2 MB.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-3">
                  <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    {logoUniversidadPreview ? (
                      <img
                        src={logoUniversidadPreview}
                        alt="Logo de universidad"
                        className="h-full w-full object-contain p-2"
                      />
                    ) : (
                      <ImagePlus className="text-slate-300" size={34} />
                    )}
                  </div>

                  {logoUniversidadUrl && !logoUniversidadFile && (
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">
                      Logo guardado
                    </span>
                  )}

                  {logoUniversidadFile && (
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">
                      Pendiente de subir
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50">
                  <ImagePlus size={18} />
                  Seleccionar imagen

                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleLogoUniversidadChange}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={subirLogoUniversidad}
                  disabled={!logoUniversidadFile || subiendoLogoUniversidad}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-700 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-sky-900/20 transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {subiendoLogoUniversidad ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <UploadCloud size={18} />
                  )}

                  {subiendoLogoUniversidad ? 'Subiendo...' : 'Subir logo'}
                </button>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Observaciones
              </label>

              <div className="relative">
                <FileText
                  className="absolute left-4 top-3.5 text-slate-400"
                  size={20}
                />

                <textarea
                  name="observaciones"
                  value={form.observaciones}
                  onChange={handleChange}
                  rows="3"
                  className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                  placeholder="Notas internas sobre el perfil del doctor..."
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
                onClick={() => navigate('/app/doctor-shaddai/expedientes')}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
              >
                <ClipboardPlus size={19} />
                Ir a expedientes
              </button>
            )}
          </div>
        </form>

        <aside className="space-y-5">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center mb-4">
              <ClipboardPlus size={24} />
            </div>

            <h3 className="text-lg font-bold text-slate-800">
              Expedientes clínicos
            </h3>

            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              Desde Doctor Shaddai podrás registrar pacientes, datos de contacto,
              sexo, edad, condiciones médicas, alergias, medicamentos actuales y
              observaciones generales.
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
              <li>• Dirección del consultorio opcional.</li>
            </ul>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-cyan-100 text-cyan-700 flex items-center justify-center mb-4">
              <Search size={24} />
            </div>

            <h3 className="text-lg font-bold text-slate-800">
              Consulta rápida
            </h3>

            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              Una vez completo el perfil, el doctor podrá consultar y administrar
              expedientes clínicos desde el módulo Doctor Shaddai.
            </p>
          </div>
        </aside>
      </section>
    </div>
  );
}