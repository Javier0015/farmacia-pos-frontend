import { useEffect, useMemo, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import {
  FileText,
  Upload,
  Camera,
  X,
  Loader2,
  RefreshCw,
  Award,
  Image as ImageIcon,
  File as FileIcon,
  ExternalLink,
  Calendar,
  Save,
} from 'lucide-react';

import api from '../../api/axios';

export default function RecetasDoctor() {
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [recetas, setRecetas] = useState([]);
  const [puntos, setPuntos] = useState({
    puntos_actuales: 0,
    puntos_acumulados: 0,
    puntos_canjeados: 0,
  });

  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [archivo, setArchivo] = useState(null);
  const [preview, setPreview] = useState(null);

  const [cargando, setCargando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);

  const [camaraActiva, setCamaraActiva] = useState(false);
  const [streamCamara, setStreamCamara] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  const BASE_URL = API_URL.replace('/api', '');

  const formatoNumero = (valor) => {
    return Number(valor || 0).toLocaleString('es-MX', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  const formatoFecha = (fecha) => {
    if (!fecha) return 'Sin fecha';

    return new Date(fecha).toLocaleString('es-MX', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const esImagen = (tipo = '') => {
    return String(tipo).startsWith('image/');
  };

  const urlArchivo = (ruta) => {
    if (!ruta) return '#';

    if (ruta.startsWith('http')) return ruta;

    return `${BASE_URL}${ruta}`;
  };

  const recetasOrdenadas = useMemo(() => {
    return [...recetas].sort((a, b) => {
      return new Date(b.fecha_creacion) - new Date(a.fecha_creacion);
    });
  }, [recetas]);

  const detenerCamara = () => {
    if (streamCamara) {
      streamCamara.getTracks().forEach((track) => track.stop());
    }

    setStreamCamara(null);
    setCamaraActiva(false);
  };

  const cargarRecetas = async () => {
    try {
      setCargando(true);

      const { data } = await api.get('/recetas-doctor/mis-recetas');

      if (data.ok) {
        setRecetas(data.recetas || []);
        setPuntos(
          data.puntos || {
            puntos_actuales: 0,
            puntos_acumulados: 0,
            puntos_canjeados: 0,
          }
        );
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudieron cargar las recetas.',
      });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarRecetas();

    return () => {
      detenerCamara();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const limpiarArchivo = () => {
    setArchivo(null);
    setPreview(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const limpiarFormulario = () => {
    setTitulo('');
    setDescripcion('');
    limpiarArchivo();
  };

  const seleccionarArchivo = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const tiposPermitidos = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
    ];

    if (!tiposPermitidos.includes(file.type)) {
      Swal.fire({
        icon: 'warning',
        title: 'Archivo no permitido',
        text: 'Solo puedes subir imágenes JPG, PNG, WEBP o archivos PDF.',
      });

      limpiarArchivo();
      return;
    }

    const maxMB = 8;
    const maxBytes = maxMB * 1024 * 1024;

    if (file.size > maxBytes) {
      Swal.fire({
        icon: 'warning',
        title: 'Archivo muy grande',
        text: `El archivo no debe superar ${maxMB} MB.`,
      });

      limpiarArchivo();
      return;
    }

    setArchivo(file);

    if (file.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(file));
    } else {
      setPreview(null);
    }
  };

  const abrirSelectorArchivo = () => {
    fileInputRef.current?.click();
  };

  const iniciarCamara = async () => {
    try {
      limpiarArchivo();

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        Swal.fire({
          icon: 'error',
          title: 'Cámara no disponible',
          text: 'Tu navegador no permite usar la cámara desde esta página.',
        });
        return;
      }

      let stream;

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
          },
          audio: false,
        });
      } catch (errorCamaraTrasera) {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      setStreamCamara(stream);
      setCamaraActiva(true);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 150);
    } catch (error) {
      console.error('Error al iniciar cámara:', error);

      Swal.fire({
        icon: 'error',
        title: 'No se pudo abrir la cámara',
        text:
          error.name === 'NotAllowedError'
            ? 'Debes permitir el acceso a la cámara en el navegador.'
            : 'Verifica que tu equipo tenga cámara disponible.',
      });
    }
  };

  const tomarFoto = async () => {
    if (!videoRef.current || !canvasRef.current) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo capturar la foto.',
          });
          return;
        }

        const fotoReceta = new window.File(
          [blob],
          `receta-doctor-${Date.now()}.jpg`,
          {
            type: 'image/jpeg',
          }
        );

        setArchivo(fotoReceta);
        setPreview(URL.createObjectURL(fotoReceta));
        detenerCamara();
      },
      'image/jpeg',
      0.9
    );
  };

  const validarFormulario = () => {
    if (!archivo) {
      Swal.fire({
        icon: 'warning',
        title: 'Receta requerida',
        text: 'Sube una imagen, PDF o toma una foto de la receta.',
      });
      return false;
    }

    return true;
  };

  const subirReceta = async (e) => {
    e.preventDefault();

    if (!validarFormulario()) return;

    try {
      setSubiendo(true);

      const formData = new FormData();
      formData.append('receta', archivo);
      formData.append('titulo', titulo.trim() || 'Receta médica');
      formData.append('descripcion', descripcion.trim() || '');

      const { data } = await api.post('/recetas-doctor/subir', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (data.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Receta subida',
          timer: 1700,
          showConfirmButton: false,
        });

        limpiarFormulario();
        await cargarRecetas();
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudo subir la receta.',
      });
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="bg-gradient-to-r from-sky-700 to-cyan-500 rounded-3xl p-7 text-white shadow-lg shadow-sky-900/20">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center">
              <FileText size={30} />
            </div>

            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                Recetas médicas
              </h1>
              <p className="text-sky-100 mt-1">
                Sube tus recetas y consulta los puntos generados.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={cargarRecetas}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-bold transition"
          >
            <RefreshCw size={19} className={cargando ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-4">
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
          <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
            <Award size={22} />
          </div>
          <p className="text-sm text-slate-500">Puntos actuales</p>
          <p className="text-3xl font-bold text-slate-800">
            {formatoNumero(puntos.puntos_actuales)}
          </p>
        </div>

        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
          <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
            <Award size={22} />
          </div>
          <p className="text-sm text-slate-500">Puntos acumulados</p>
          <p className="text-3xl font-bold text-slate-800">
            {formatoNumero(puntos.puntos_acumulados)}
          </p>
        </div>

        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
          <div className="w-11 h-11 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center mb-4">
            <FileText size={22} />
          </div>
          <p className="text-sm text-slate-500">Recetas subidas</p>
          <p className="text-3xl font-bold text-slate-800">
            {formatoNumero(recetas.length)}
          </p>
        </div>
      </section>

      <section className="grid xl:grid-cols-[0.9fr_1.1fr] gap-6">
        <form
          onSubmit={subirReceta}
          className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-5"
        >
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              Subir receta
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Puedes cargar una imagen/PDF o tomar una foto con la cámara.
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Título
            </label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="Ej. Receta de paciente"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Descripción
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows="3"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
              placeholder="Notas opcionales..."
            />
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={seleccionarArchivo}
            className="hidden"
          />

          {!camaraActiva && !archivo && (
            <div className="grid sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={abrirSelectorArchivo}
                className="inline-flex items-center justify-center gap-2 px-5 py-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
              >
                <Upload size={20} />
                Subir archivo
              </button>

              <button
                type="button"
                onClick={iniciarCamara}
                className="inline-flex items-center justify-center gap-2 px-5 py-4 rounded-2xl bg-sky-700 hover:bg-sky-800 text-white font-bold transition"
              >
                <Camera size={20} />
                Tomar foto
              </button>
            </div>
          )}

          {camaraActiva && (
            <div className="rounded-3xl border border-slate-200 overflow-hidden bg-slate-950">
              <video
                ref={videoRef}
                className="w-full max-h-[420px] object-cover bg-slate-950"
                autoPlay
                playsInline
                muted
              />

              <div className="p-4 bg-white flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={tomarFoto}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-sky-700 hover:bg-sky-800 text-white font-bold transition"
                >
                  <Camera size={19} />
                  Capturar
                </button>

                <button
                  type="button"
                  onClick={detenerCamara}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
                >
                  <X size={19} />
                  Cancelar
                </button>
              </div>
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />

          {archivo && (
            <div className="rounded-3xl border border-slate-200 overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-white text-sky-700 flex items-center justify-center">
                    {archivo.type.startsWith('image/') ? (
                      <ImageIcon size={22} />
                    ) : (
                      <FileIcon size={22} />
                    )}
                  </div>

                  <div>
                    <p className="font-bold text-slate-800">
                      {archivo.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {(archivo.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={limpiarArchivo}
                  className="w-9 h-9 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center transition"
                >
                  <X size={18} />
                </button>
              </div>

              {preview ? (
                <img
                  src={preview}
                  alt="Vista previa de receta"
                  className="w-full max-h-[420px] object-contain bg-slate-100"
                />
              ) : (
                <div className="p-8 text-center text-slate-500">
                  <FileIcon size={38} className="mx-auto mb-3 text-slate-400" />
                  Archivo PDF seleccionado.
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              disabled={subiendo}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-sky-700 hover:bg-sky-800 text-white font-bold shadow-lg shadow-sky-900/20 transition disabled:opacity-60"
            >
              {subiendo ? (
                <Loader2 size={19} className="animate-spin" />
              ) : (
                <Save size={19} />
              )}
              {subiendo ? 'Subiendo...' : 'Guardar receta'}
            </button>

            <button
              type="button"
              onClick={limpiarFormulario}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
            >
              <X size={19} />
              Limpiar
            </button>
          </div>
        </form>

        <section className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-800">
              Mis recetas
            </h2>
            <p className="text-sm text-slate-500">
              Historial de recetas cargadas por tu cuenta.
            </p>
          </div>

          <div className="p-5 space-y-4 max-h-[760px] overflow-y-auto">
            {cargando ? (
              <div className="py-14 text-center text-slate-500">
                <Loader2 className="animate-spin mx-auto mb-3" size={34} />
                Cargando recetas...
              </div>
            ) : recetasOrdenadas.length === 0 ? (
              <div className="py-14 text-center text-slate-500">
                <FileText size={42} className="mx-auto mb-3 text-slate-300" />
                <p className="font-bold text-slate-600">
                  Sin recetas
                </p>
                <p className="text-sm mt-1">
                  Sube tu primera receta para generar puntos.
                </p>
              </div>
            ) : (
              recetasOrdenadas.map((receta) => (
                <article
                  key={receta.id_receta}
                  className="rounded-3xl border border-slate-100 p-4 hover:bg-slate-50 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                        {esImagen(receta.archivo_tipo) ? (
                          <ImageIcon size={24} />
                        ) : (
                          <FileText size={24} />
                        )}
                      </div>

                      <div>
                        <h3 className="font-bold text-slate-800">
                          {receta.titulo || 'Receta médica'}
                        </h3>

                        <p className="text-sm text-slate-500 mt-1">
                          {receta.descripcion || 'Sin descripción'}
                        </p>

                        <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <Calendar size={14} />
                            {formatoFecha(receta.fecha_creacion)}
                          </span>

                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 text-amber-700 font-bold">
                            <Award size={14} />
                            +{formatoNumero(receta.puntos_generados)} pts
                          </span>
                        </div>
                      </div>
                    </div>

                    <a
                      href={urlArchivo(receta.archivo_ruta)}
                      target="_blank"
                      rel="noreferrer"
                      className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition shrink-0"
                      title="Abrir archivo"
                    >
                      <ExternalLink size={18} />
                    </a>
                  </div>

                  {esImagen(receta.archivo_tipo) && (
                    <a
                      href={urlArchivo(receta.archivo_ruta)}
                      target="_blank"
                      rel="noreferrer"
                      className="block mt-4 rounded-2xl overflow-hidden border border-slate-100 bg-slate-100"
                    >
                      <img
                        src={urlArchivo(receta.archivo_ruta)}
                        alt={receta.titulo || 'Receta médica'}
                        className="w-full max-h-56 object-cover"
                      />
                    </a>
                  )}
                </article>
              ))
            )}
          </div>
        </section>
      </section>
    </div>
  );
}