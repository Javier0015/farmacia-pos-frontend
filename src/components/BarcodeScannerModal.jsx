import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import Swal from 'sweetalert2';
import { Barcode, Camera, RefreshCw, X } from 'lucide-react';

export default function BarcodeScannerModal({
  abierto,
  titulo = 'Escanear código',
  descripcion = 'Apunta la cámara al código de barras.',
  onClose,
  onDetected,
}) {
  const videoRef = useRef(null);
  const controlsRef = useRef(null);
  const detectadoRef = useRef(false);

  const [iniciando, setIniciando] = useState(false);

  const detenerCamara = () => {
    try {
      if (controlsRef.current) {
        controlsRef.current.stop();
        controlsRef.current = null;
      }
    } catch (error) {
      console.error('Error al detener cámara:', error);
    }
  };

  useEffect(() => {
    if (!abierto) {
      detenerCamara();
      return;
    }

    let activo = true;
    detectadoRef.current = false;

    const iniciarEscaner = async () => {
      try {
        setIniciando(true);

        const codeReader = new BrowserMultiFormatReader();

        const constraints = {
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        };

        const controls = await codeReader.decodeFromConstraints(
          constraints,
          videoRef.current,
          (result) => {
            if (!activo || detectadoRef.current) return;

            if (result) {
              const codigo = result.getText();

              if (!codigo) return;

              detectadoRef.current = true;
              detenerCamara();
              onDetected?.(codigo);
            }
          }
        );

        controlsRef.current = controls;
      } catch (error) {
        console.error('Error al iniciar lector:', error);

        let mensaje = 'No se pudo abrir la cámara del dispositivo.';

        if (error?.name === 'NotAllowedError') {
          mensaje =
            'El navegador no tiene permiso para usar la cámara. Activa el permiso de cámara e intenta de nuevo.';
        }

        if (error?.name === 'NotFoundError') {
          mensaje = 'No se encontró una cámara disponible en este dispositivo.';
        }

        if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
          mensaje =
            'Para usar la cámara desde el teléfono, la aplicación debe abrirse con HTTPS.';
        }

        Swal.fire({
          icon: 'error',
          title: 'No se pudo abrir la cámara',
          text: mensaje,
          confirmButtonColor: '#0369a1',
        });

        onClose?.();
      } finally {
        if (activo) {
          setIniciando(false);
        }
      }
    };

    iniciarEscaner();

    return () => {
      activo = false;
      detenerCamara();
    };
  }, [abierto]);

  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
              <Barcode size={24} />
            </div>

            <div className="min-w-0">
              <h2 className="font-bold text-slate-800 text-lg truncate">
                {titulo}
              </h2>
              <p className="text-sm text-slate-500">
                {descripcion}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              detenerCamara();
              onClose?.();
            }}
            className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          <div className="relative rounded-3xl overflow-hidden bg-slate-950 border border-slate-200 aspect-[3/4] sm:aspect-video">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              muted
              playsInline
              autoPlay
            />

            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-32 border-2 border-sky-400 rounded-2xl shadow-[0_0_0_9999px_rgba(15,23,42,0.35)]" />

              <div className="absolute left-10 right-10 top-1/2 h-0.5 bg-sky-400 shadow-lg shadow-sky-400/60" />
            </div>

            {iniciando && (
              <div className="absolute inset-0 bg-slate-950/70 flex flex-col items-center justify-center text-white">
                <RefreshCw size={34} className="animate-spin mb-3" />
                <p className="font-bold">Iniciando cámara...</p>
              </div>
            )}
          </div>

          <div className="mt-4 rounded-2xl bg-sky-50 border border-sky-100 p-4 text-sky-800 flex items-start gap-3">
            <Camera size={22} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Consejo</p>
              <p className="text-sm">
                Mantén el código dentro del recuadro azul y evita reflejos o poca luz.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              detenerCamara();
              onClose?.();
            }}
            className="mt-4 w-full px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition"
          >
            Cancelar escaneo
          </button>
        </div>
      </div>
    </div>
  );
}