import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  RefreshCw,
  SlidersHorizontal,
  PackageSearch,
  Store,
  Sparkles,
  Tags,
  ShieldCheck,
  ShoppingBag,
  X,
  ArrowUpRight,
  Share2,
  MapPin,
  Music2,
  MessageCircle,
  Phone,
} from 'lucide-react';
import api from '../../api/axios';
import ProductoCatalogoCard from '../../components/catalogo/ProductoCatalogoCard';
import ProductoCatalogoModal from '../../components/catalogo/ProductoCatalogoModal';
import SucursalesDisponiblesModal from '../../components/catalogo/SucursalesDisponiblesModal';
import logoFarmacia from '../../assets/logoShaddai.png';
import logoFarmaciaCompleto from '../../assets/logoCompleto-sinFondo.png';
import ChatbotDisponibilidad from '../../components/catalogo/ChatbotDisponibilidad';


const CONFIGURACION_REDES_SOCIALES = {
  FACEBOOK: {
    clase: 'border-blue-100 bg-blue-50 text-blue-600',
    textoAccion: 'Visitar página oficial',
  },
  INSTAGRAM: {
    clase: 'border-fuchsia-100 bg-fuchsia-50 text-fuchsia-600',
    textoAccion: 'Visitar perfil oficial',
  },
  WHATSAPP: {
    clase: 'border-emerald-100 bg-emerald-50 text-emerald-600',
    textoAccion: 'Escríbenos por WhatsApp',
  },
  TIKTOK: {
    clase: 'border-slate-200 bg-slate-50 text-slate-900',
    textoAccion: 'Visitar perfil oficial',
  },
  X: {
    clase: 'border-slate-200 bg-slate-50 text-slate-900',
    textoAccion: 'Visitar perfil oficial',
  },
  YOUTUBE: {
    clase: 'border-red-100 bg-red-50 text-red-600',
    textoAccion: 'Visitar canal oficial',
  },
};

const obtenerConfiguracionRedSocial = (clave) => {
  return (
    CONFIGURACION_REDES_SOCIALES[String(clave || '').toUpperCase()] || {
      clase: 'border-sky-100 bg-sky-50 text-sky-700',
      textoAccion: 'Abrir enlace oficial',
    }
  );
};

function IconoRedSocial({ clave, size = 22 }) {
  const props = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  };

  switch (String(clave || '').toUpperCase()) {
    case 'FACEBOOK':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M13.8 21v-8h2.7l.4-3.2h-3.1V7.76c0-.93.26-1.56 1.59-1.56h1.7V3.34c-.3-.04-1.31-.13-2.5-.13-2.47 0-4.16 1.5-4.16 4.26V9.8H7.6V13h2.81v8h3.39Z" />
        </svg>
      );

    case 'INSTAGRAM':
      return (
        <svg {...props}>
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.3" cy="6.7" r="0.8" fill="currentColor" stroke="none" />
        </svg>
      );

    case 'WHATSAPP':
      return (
        <span className="relative flex h-full w-full items-center justify-center">
          <MessageCircle size={size + 1} strokeWidth={2.2} />
          <span className="absolute flex h-4 w-4 items-center justify-center"><Phone size={10} strokeWidth={2.8} /></span>
        </span>
      );

    case 'TIKTOK':
      return <Music2 size={size + 1} strokeWidth={2.3} />;

    case 'X':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M4.3 3h4.13l4.23 5.66L17.68 3H20l-6.28 7.23L20.3 21h-4.12l-4.57-6.12L6.3 21H4l6.55-7.54L4.3 3Zm2.2 1.66 10.57 14.68h1.16L7.67 4.66H6.5Z" />
        </svg>
      );

    case 'YOUTUBE':
      return (
        <svg
          width={size + 2}
          height={size + 2}
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M21.58 7.19a2.93 2.93 0 0 0-2.06-2.08C17.7 4.62 12 4.62 12 4.62s-5.7 0-7.52.49A2.93 2.93 0 0 0 2.42 7.2C1.93 9 1.93 12 1.93 12s0 3 .49 4.81a2.93 2.93 0 0 0 2.06 2.08c1.82.49 7.52.49 7.52.49s5.7 0 7.52-.49a2.93 2.93 0 0 0 2.06-2.08c.49-1.81.49-4.81.49-4.81s0-3-.49-4.81ZM10.1 15.02V8.98L15.4 12l-5.3 3.02Z" />
        </svg>
      );

    default:
      return <Share2 size={size} strokeWidth={2.2} />;
  }
}

export default function CatalogoPublico() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [redesSociales, setRedesSociales] = useState([]);
  const [modalWhatsappAbierto, setModalWhatsappAbierto] = useState(false);
  const [sucursalesWhatsapp, setSucursalesWhatsapp] = useState([]);
  const [cargandoSucursalesWhatsapp, setCargandoSucursalesWhatsapp] = useState(false);
  const [errorSucursalesWhatsapp, setErrorSucursalesWhatsapp] = useState('');

  const [busqueda, setBusqueda] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
  const [idCatalogoSeleccionado, setIdCatalogoSeleccionado] = useState('');

  const [sugerenciasProductos, setSugerenciasProductos] = useState([]);
  const [cargandoSugerencias, setCargandoSugerencias] = useState(false);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [indiceSugerencia, setIndiceSugerencia] = useState(-1);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [
    productoDisponibilidadSeleccionado,
    setProductoDisponibilidadSeleccionado,
  ] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  const cargarCategorias = async () => {
    try {
      const { data } = await api.get('/public/catalogo/categorias');

      if (data.ok) {
        setCategorias(data.categorias || []);
      }
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    }
  };

  const cargarRedesSociales = async () => {
    try {
      const { data } = await api.get('/public/catalogo/redes-sociales');

      if (data.ok) {
        setRedesSociales(data.redes_sociales || []);
      } else {
        setRedesSociales([]);
      }
    } catch (error) {
      /*
       * Las redes sociales no bloquean la consulta del catálogo. Si el
       * servicio no está disponible, simplemente no mostramos este bloque.
       */
      console.warn('No se pudieron cargar las redes sociales públicas:', error);
      setRedesSociales([]);
    }
  };

  const cargarSucursalesWhatsapp = async () => {
    try {
      setCargandoSucursalesWhatsapp(true);
      setErrorSucursalesWhatsapp('');

      const { data } = await api.get('/public/catalogo/sucursales-whatsapp');

      if (data.ok) {
        setSucursalesWhatsapp(data.sucursales || []);
      } else {
        setSucursalesWhatsapp([]);
        setErrorSucursalesWhatsapp(
          data.mensaje || 'No se pudieron cargar las sucursales.'
        );
      }
    } catch (error) {
      console.error('Error al cargar sucursales de WhatsApp:', error);
      setSucursalesWhatsapp([]);
      setErrorSucursalesWhatsapp(
        error.response?.data?.mensaje ||
        'No se pudieron cargar las sucursales para WhatsApp.'
      );
    } finally {
      setCargandoSucursalesWhatsapp(false);
    }
  };

  const abrirSelectorWhatsapp = async () => {
    setModalWhatsappAbierto(true);
    await cargarSucursalesWhatsapp();
  };

  const cargarCatalogo = async ({
    idCatalogo = idCatalogoSeleccionado,
    textoBusqueda = busqueda,
    categoria = categoriaSeleccionada,
  } = {}) => {
    try {
      setCargando(true);
      setError('');

      const params = {};

      if (idCatalogo) {
        params.id_catalogo = idCatalogo;
      } else if (String(textoBusqueda || '').trim()) {
        params.q = String(textoBusqueda).trim();
      }

      if (categoria) {
        params.categoria = categoria;
      }

      const { data } = await api.get('/public/catalogo', { params });

      if (!data.ok) {
        setError(data.mensaje || 'No se pudo cargar el catálogo');
        return;
      }

      setProductos(data.catalogo || []);
    } catch (error) {
      console.error('Error al cargar catálogo:', error);
      setError('Error al conectar con el catálogo');
    } finally {
      setCargando(false);
    }
  };

  const buscarSugerenciasProductos = async (termino, signal) => {
    const texto = String(termino || '').trim();

    if (texto.length < 2 || idCatalogoSeleccionado) {
      setSugerenciasProductos([]);
      setMostrarSugerencias(false);
      setIndiceSugerencia(-1);
      return;
    }

    try {
      setCargandoSugerencias(true);
      setMostrarSugerencias(true);

      const { data } = await api.get('/public/catalogo', {
        params: {
          autocomplete: 1,
          q: texto,
          categoria: categoriaSeleccionada || undefined,
          limit: 8,
        },
        signal,
      });

      if (data?.ok) {
        setSugerenciasProductos(data.productos || []);
        setIndiceSugerencia(-1);
      } else {
        setSugerenciasProductos([]);
      }
    } catch (error) {
      if (error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError') {
        return;
      }

      console.error('Error al consultar sugerencias del catálogo:', error);
      setSugerenciasProductos([]);
    } finally {
      if (!signal?.aborted) {
        setCargandoSugerencias(false);
      }
    }
  };

  const seleccionarSugerencia = (producto) => {
    const nombre =
      producto?.titulo_catalogo ||
      producto?.nombre_producto ||
      producto?.nombre ||
      '';

    setBusqueda(nombre);
    setIdCatalogoSeleccionado(producto?.id_catalogo || '');
    setSugerenciasProductos([]);
    setMostrarSugerencias(false);
    setIndiceSugerencia(-1);
  };

  const manejarTeclaBusqueda = (event) => {
    const hayOpciones = sugerenciasProductos.length > 0;

    if (event.key === 'ArrowDown' && hayOpciones) {
      event.preventDefault();
      setMostrarSugerencias(true);
      setIndiceSugerencia((actual) =>
        actual >= sugerenciasProductos.length - 1 ? 0 : actual + 1
      );
      return;
    }

    if (event.key === 'ArrowUp' && hayOpciones) {
      event.preventDefault();
      setIndiceSugerencia((actual) =>
        actual <= 0 ? sugerenciasProductos.length - 1 : actual - 1
      );
      return;
    }

    if (event.key === 'Enter' && indiceSugerencia >= 0 && hayOpciones) {
      event.preventDefault();
      seleccionarSugerencia(sugerenciasProductos[indiceSugerencia]);
      return;
    }

    if (event.key === 'Escape') {
      setMostrarSugerencias(false);
      setIndiceSugerencia(-1);
    }
  };

  const abrirDetalle = async (producto) => {
    try {
      setCargandoDetalle(true);

      const { data } = await api.get(`/public/catalogo/${producto.id_catalogo}`);

      if (data.ok) {
        setProductoSeleccionado(data.producto);
      } else {
        setProductoSeleccionado(producto);
      }
    } catch (error) {
      console.error('Error al cargar detalle:', error);
      setProductoSeleccionado(producto);
    } finally {
      setCargandoDetalle(false);
    }
  };

  const limpiarFiltros = () => {
    setBusqueda('');
    setCategoriaSeleccionada('');
    setIdCatalogoSeleccionado('');
    setSugerenciasProductos([]);
    setMostrarSugerencias(false);
    setIndiceSugerencia(-1);
  };

  useEffect(() => {
    cargarCategorias();
    cargarRedesSociales();
  }, []);

  useEffect(() => {
    if (idCatalogoSeleccionado) {
      cargarCatalogo();
      return undefined;
    }

    const timer = setTimeout(() => {
      cargarCatalogo();
    }, 350);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busqueda, categoriaSeleccionada, idCatalogoSeleccionado]);

  useEffect(() => {
    const texto = String(busqueda || '').trim();

    if (idCatalogoSeleccionado || texto.length < 2) {
      setSugerenciasProductos([]);
      setMostrarSugerencias(false);
      setIndiceSugerencia(-1);
      setCargandoSugerencias(false);
      return undefined;
    }

    const controlador = new AbortController();
    const timer = setTimeout(() => {
      buscarSugerenciasProductos(texto, controlador.signal);
    }, 280);

    return () => {
      clearTimeout(timer);
      controlador.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busqueda, categoriaSeleccionada, idCatalogoSeleccionado]);

  const totalProductos = productos.length;

  const productosConOferta = useMemo(() => {
    return productos.filter((p) => p.tiene_oferta).length;
  }, [productos]);

  const categoriaActual = useMemo(() => {
    if (!categoriaSeleccionada) return null;

    return categorias.find(
      (categoria) =>
        String(categoria.id_categoria) === String(categoriaSeleccionada)
    );
  }, [categoriaSeleccionada, categorias]);

  const redesVisibles = useMemo(() => {
    return (redesSociales || []).filter((red) => {
      const clave = String(red?.clave || '').toUpperCase();

      if (clave === 'WHATSAPP') return true;

      return Boolean(String(red?.url || '').trim());
    });
  }, [redesSociales]);

  const hayFiltros = busqueda.trim() || categoriaSeleccionada;

  return (
    <div className="min-h-screen bg-[#eef7ff] relative overflow-hidden">
      <style>
        {`
          @keyframes blobMoveOne {
            0%, 100% {
              transform: translate3d(0, 0, 0) scale(1);
            }
            50% {
              transform: translate3d(60px, 35px, 0) scale(1.08);
            }
          }

          @keyframes blobMoveTwo {
            0%, 100% {
              transform: translate3d(0, 0, 0) scale(1);
            }
            50% {
              transform: translate3d(-70px, 45px, 0) scale(1.1);
            }
          }

          @keyframes blobMoveThree {
            0%, 100% {
              transform: translate3d(0, 0, 0) scale(1);
            }
            50% {
              transform: translate3d(45px, -55px, 0) scale(1.06);
            }
          }

          @keyframes floatCard {
            0%, 100% {
              transform: translateY(0px) rotate(0deg);
            }
            50% {
              transform: translateY(-14px) rotate(.4deg);
            }
          }

          @keyframes floatShapeOne {
            0%, 100% {
              transform: translateY(0px) rotate(12deg);
            }
            50% {
              transform: translateY(-22px) rotate(20deg);
            }
          }

          @keyframes floatShapeTwo {
            0%, 100% {
              transform: translateY(0px) rotate(0deg);
            }
            50% {
              transform: translateY(18px) rotate(-10deg);
            }
          }

          @keyframes floatShapeThree {
            0%, 100% {
              transform: translateY(0px) rotate(-12deg);
            }
            50% {
              transform: translateY(-18px) rotate(-22deg);
            }
          }

          @keyframes glowLogo {
            0%, 100% {
              box-shadow: 0 20px 45px rgba(14, 116, 144, .20);
              transform: scale(1);
            }
            50% {
              box-shadow: 0 25px 70px rgba(34, 211, 238, .45);
              transform: scale(1.035);
            }
          }

          @keyframes shine {
            0% {
              transform: translateX(-140%) rotate(18deg);
            }
            55% {
              transform: translateX(170%) rotate(18deg);
            }
            100% {
              transform: translateX(170%) rotate(18deg);
            }
          }

          @keyframes fadeUp {
            from {
              opacity: 0;
              transform: translateY(18px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes softPulse {
            0%, 100% {
              opacity: .35;
              transform: scale(1);
            }
            50% {
              opacity: .75;
              transform: scale(1.08);
            }
          }

          .catalogo-blob-one {
            animation: blobMoveOne 11s ease-in-out infinite;
          }

          .catalogo-blob-two {
            animation: blobMoveTwo 13s ease-in-out infinite;
          }

          .catalogo-blob-three {
            animation: blobMoveThree 15s ease-in-out infinite;
          }

          .catalogo-float-card {
            animation: floatCard 5.5s ease-in-out infinite;
          }

          .catalogo-shape-one {
            animation: floatShapeOne 6.5s ease-in-out infinite;
          }

          .catalogo-shape-two {
            animation: floatShapeTwo 7.5s ease-in-out infinite;
          }

          .catalogo-shape-three {
            animation: floatShapeThree 8s ease-in-out infinite;
          }

          .catalogo-logo-glow {
            animation: glowLogo 4s ease-in-out infinite;
          }

          .catalogo-fade-up {
            animation: fadeUp .65s ease-out both;
          }

          .catalogo-soft-pulse {
            animation: softPulse 4s ease-in-out infinite;
          }

          .catalogo-shine {
            position: relative;
            overflow: hidden;
          }

          .catalogo-shine::before {
            content: '';
            position: absolute;
            top: -60%;
            left: 0;
            width: 90px;
            height: 220%;
            background: linear-gradient(
              90deg,
              transparent,
              rgba(255,255,255,.55),
              transparent
            );
            animation: shine 5s ease-in-out infinite;
            pointer-events: none;
          }
        `}
      </style>

      {/* Fondo decorativo general */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="catalogo-blob-one absolute -top-32 -left-32 w-96 h-96 rounded-full bg-sky-300/50 blur-3xl" />
        <div className="catalogo-blob-two absolute top-40 -right-32 w-[34rem] h-[34rem] rounded-full bg-cyan-200/60 blur-3xl" />
        <div className="catalogo-blob-three absolute bottom-0 left-1/3 w-[28rem] h-[28rem] rounded-full bg-blue-200/50 blur-3xl" />

        <div className="absolute top-[20%] left-[7%] w-3 h-3 rounded-full bg-white/80 shadow-lg catalogo-soft-pulse" />
        <div className="absolute top-[42%] right-[10%] w-4 h-4 rounded-full bg-cyan-300/80 shadow-lg catalogo-soft-pulse" />
        <div className="absolute bottom-[18%] left-[18%] w-5 h-5 rounded-full bg-sky-200/90 shadow-lg catalogo-soft-pulse" />
      </div>

      {/* Header creativo */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-800 via-sky-600 to-cyan-400" />

        {/* Glow superior */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[42rem] h-[42rem] rounded-full bg-white/10 blur-3xl" />

        {/* Patrón decorativo animado */}
        <div className="absolute inset-0 opacity-25">
          <div className="catalogo-shape-one absolute top-12 left-10 w-28 h-28 rounded-[2.5rem] border border-white/50 rotate-12" />
          <div className="catalogo-shape-two absolute top-36 right-28 w-24 h-24 rounded-full border border-white/50" />
          <div className="catalogo-shape-three absolute bottom-12 left-1/2 w-36 h-36 rounded-[3rem] border border-white/40 -rotate-12" />
          <div className="catalogo-shape-two absolute bottom-20 right-1/4 w-16 h-16 rounded-[1.5rem] bg-white/10 border border-white/30" />
        </div>

        <div className="relative max-w-7xl mx-auto px-5 pt-8 pb-28 lg:pt-12 lg:pb-32">
          <nav className="catalogo-fade-up flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="catalogo-logo-glow w-14 h-14 rounded-3xl bg-white shadow-xl shadow-sky-950/20 flex items-center justify-center overflow-hidden ring-4 ring-white/20">
                <img
                  src={logoFarmacia}
                  alt="Logo Farmacias Shaddai"
                  className="w-11 h-11 object-contain"
                />
              </div>

              <div>
                <p className="text-white font-black leading-tight">
                  Farmacias Shaddai
                </p>
                <p className="text-sky-100 text-sm font-semibold">
                  Bienestar al alcance de todos.
                </p>
              </div>
            </div>

            <div className="hidden sm:inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/20 px-4 py-2 text-white font-bold backdrop-blur-md">
              <ShieldCheck size={18} />
              Consulta rápida
            </div>
          </nav>

          <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_440px] lg:items-center">
            <div className="catalogo-fade-up" style={{ animationDelay: '.08s' }}>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/25 px-4 py-2 text-sm font-black text-white backdrop-blur-md shadow-lg shadow-sky-950/10">
                <Sparkles size={17} />
                Promociones, productos y disponibilidad
              </div>

              <h1 className="mt-6 text-4xl sm:text-5xl lg:text-7xl font-black tracking-tight text-white leading-[1.02]">
                Tu farmacia,
                <span className="block text-cyan-100">
                  ahora más cerca.
                </span>
              </h1>

              <p className="mt-6 max-w-2xl text-sky-50 text-lg leading-relaxed font-medium">
                Explora medicamentos, productos de cuidado personal y promociones
                antes de visitarnos.
              </p>

              <div className="mt-7 inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold text-sky-50 backdrop-blur-md">
                <ShieldCheck size={18} className="text-cyan-100" />
                Consulta productos y promociones desde cualquier dispositivo.
              </div>
            </div>

            {/* Tarjeta de marca */}
            <aside
              className="catalogo-fade-up relative"
              style={{ animationDelay: '.18s' }}
            >
              <div className="absolute -inset-4 rounded-[3rem] bg-white/20 blur-2xl" />

              <div className="relative overflow-hidden rounded-[3rem] border border-white/25 bg-white/15 p-3 shadow-2xl shadow-sky-950/20 backdrop-blur-xl sm:p-4">
                <div className="relative overflow-hidden rounded-[2.5rem] bg-white p-7 sm:p-8">
                  <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-cyan-100" />
                  <div className="absolute -bottom-24 -left-20 h-48 w-48 rounded-full bg-sky-100" />

                  <div className="relative flex min-h-[260px] flex-col items-center justify-center text-center">
                    <div className="relative flex h-32 w-60 items-center justify-center rounded-[2.7rem] border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-cyan-50 shadow-inner">
                      <div className="absolute inset-3 rounded-[2.2rem] bg-white shadow-lg" />
                      <img
                        src={logoFarmaciaCompleto}
                        alt="Logo Farmacias Shaddai"
                        className="relative h-60 w-50 object-contain drop-shadow-sm"
                      />
                    </div>

                    <span className="mt-5 inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50 px-4 py-2 text-xs font-black text-sky-700">
                      <Sparkles size={15} />
                      Catálogo digital
                    </span>

                    <h2 className="mt-4 text-2xl font-black leading-tight text-slate-900">
                      Salud y bienestar,
                      <span className="block text-sky-700">más cerca de ti.</span>
                    </h2>

                    <p className="mt-3 max-w-sm text-sm font-medium leading-relaxed text-slate-500">
                      Conoce productos, promociones y disponibilidad antes de visitarnos.
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </header>

      {/* Contenido */}
      <main className="relative mx-auto max-w-7xl px-5 pb-12">
        {/* Barra de redes: visible al iniciar, sin competir con el encabezado */}
        {redesVisibles.length > 0 && (
          <section
            className="catalogo-fade-up relative z-20 -mt-14"
            style={{ animationDelay: '.22s' }}
          >
            <div className="rounded-[2rem] border border-white bg-white/95 p-4 shadow-2xl shadow-sky-900/10 backdrop-blur-xl sm:p-5">
              <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(230px,0.8fr)_minmax(0,1.35fr)] lg:items-center lg:gap-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-600 to-cyan-500 text-white shadow-lg shadow-sky-500/20">
                    <Share2 size={21} />
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-sky-700">
                      Canales oficiales
                    </p>
                    <h2 className="mt-0.5 text-lg font-black text-slate-900">
                      Síguenos y mantente informado
                    </h2>
                  </div>
                </div>

                <div className="grid w-full grid-cols-3 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
                  {redesVisibles.map((red) => {
                    const configuracion = obtenerConfiguracionRedSocial(red.clave);
                    const esWhatsapp =
                      String(red.clave || '').toUpperCase() === 'WHATSAPP';

                    const claseBoton = `
                      group flex aspect-square items-center justify-center
                      rounded-2xl border border-slate-200 bg-white
                      p-3 shadow-sm transition
                      hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md
                      sm:aspect-auto sm:min-h-[58px] sm:justify-start sm:gap-3
                      sm:px-4 sm:py-3 lg:min-w-0 lg:px-3 xl:px-4
                    `;

                    const contenido = (
                      <>
                        <div
                          className={`
                            flex h-10 w-10 shrink-0 items-center justify-center
                            rounded-2xl ${configuracion.clase}
                          `}
                        >
                          <IconoRedSocial clave={red.clave} size={21} />
                        </div>

                        {/* En móvil se muestra únicamente el icono. */}
                        <div className="hidden min-w-0 flex-1 sm:block">
                          <p className="truncate text-sm font-black text-slate-800">
                            {red.nombre}
                          </p>

                          {/* La descripción aparece solo cuando hay espacio suficiente. */}
                          <p className="mt-0.5 hidden text-xs font-semibold text-slate-500 xl:block">
                            {configuracion.textoAccion}
                          </p>
                        </div>

                        <ArrowUpRight
                          size={17}
                          className="hidden shrink-0 text-slate-400 transition group-hover:text-sky-600 lg:block"
                        />
                      </>
                    );

                    if (esWhatsapp) {
                      return (
                        <button
                          key={red.id_red_social || red.clave}
                          type="button"
                          onClick={abrirSelectorWhatsapp}
                          title="Elegir sucursal para WhatsApp"
                          aria-label="Elegir sucursal para WhatsApp"
                          className={claseBoton}
                        >
                          {contenido}
                        </button>
                      );
                    }

                    return (
                      <a
                        key={red.id_red_social || red.clave}
                        href={red.url}
                        target="_blank"
                        rel="noreferrer"
                        title={red.nombre}
                        aria-label={red.nombre}
                        className={claseBoton}
                      >
                        {contenido}
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Filtros flotantes */}
        <section
          className={`${redesVisibles.length > 0 ? 'mt-5' : '-mt-20'} relative ${mostrarSugerencias ? 'z-40' : 'z-10'
            } catalogo-fade-up`}
        >
          <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] border border-white shadow-2xl shadow-sky-900/10 p-5 lg:p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-600 to-cyan-500 text-white flex items-center justify-center shadow-lg shadow-sky-500/20">
                  <SlidersHorizontal size={22} />
                </div>

                <div>
                  <h2 className="text-xl lg:text-2xl font-black text-slate-900">
                    Consulta nuestros productos
                  </h2>
                  <p className="text-sm text-slate-500 font-medium">
                    Filtra por producto o categoría.
                  </p>
                </div>
              </div>

              {hayFiltros && (
                <button
                  type="button"
                  onClick={limpiarFiltros}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black transition"
                >
                  <X size={18} />
                  Quitar filtros
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px_auto] gap-4">
              <div className="relative group">
                <Search
                  size={22}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-600 transition"
                />

                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => {
                    setBusqueda(e.target.value);
                    setIdCatalogoSeleccionado('');
                    setMostrarSugerencias(e.target.value.trim().length >= 2);
                    setIndiceSugerencia(-1);
                  }}
                  onFocus={() => {
                    if (String(busqueda || '').trim().length >= 2 && !idCatalogoSeleccionado) {
                      setMostrarSugerencias(true);
                    }
                  }}
                  onBlur={() => {
                    window.setTimeout(() => {
                      setMostrarSugerencias(false);
                      setIndiceSugerencia(-1);
                    }, 160);
                  }}
                  onKeyDown={manejarTeclaBusqueda}
                  placeholder="Buscar medicamento o producto..."
                  className="w-full pl-12 pr-12 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-400 text-slate-700 font-bold transition"
                  autoComplete="off"
                />

                {cargandoSugerencias && (
                  <RefreshCw
                    size={19}
                    className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-sky-600"
                  />
                )}

                {mostrarSugerencias &&
                  !idCatalogoSeleccionado &&
                  String(busqueda || '').trim().length >= 2 && (
                    <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15">
                      {cargandoSugerencias ? (
                        <div className="flex items-center gap-3 px-4 py-4 text-sm font-bold text-slate-500">
                          <RefreshCw size={18} className="animate-spin text-sky-600" />
                          Buscando productos...
                        </div>
                      ) : sugerenciasProductos.length === 0 ? (
                        <div className="px-4 py-4 text-sm font-semibold text-slate-500">
                          No encontramos productos con esa búsqueda.
                        </div>
                      ) : (
                        <div className="max-h-80 overflow-y-auto py-2">
                          {sugerenciasProductos.map((producto, indice) => {
                            const nombre =
                              producto.titulo_catalogo ||
                              producto.nombre_producto ||
                              producto.nombre ||
                              'Producto sin nombre';
                            const detalle = [
                              producto.codigo_barras,
                              producto.laboratorio,
                              producto.presentacion,
                            ]
                              .filter(Boolean)
                              .join(' · ');

                            return (
                              <button
                                key={producto.id_catalogo}
                                type="button"
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => seleccionarSugerencia(producto)}
                                className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${indiceSugerencia === indice
                                  ? 'bg-sky-50'
                                  : 'hover:bg-slate-50'
                                  }`}
                              >
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-sky-50 text-sky-600">
                                  {producto.imagen_url ? (
                                    <img
                                      src={producto.imagen_url}
                                      alt=""
                                      className="h-full w-full object-contain"
                                    />
                                  ) : (
                                    <PackageSearch size={20} />
                                  )}
                                </div>

                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-black text-slate-800">
                                    {nombre}
                                  </p>
                                  <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">
                                    {detalle || producto.nombre_categoria || 'Catálogo digital'}
                                  </p>
                                </div>

                                <span className="shrink-0 rounded-xl bg-sky-50 px-2.5 py-1 text-xs font-black text-sky-700">
                                  {Number(
                                    producto.precio_final ?? producto.precio_venta ?? 0
                                  ).toLocaleString('es-MX', {
                                    style: 'currency',
                                    currency: 'MXN',
                                  })}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
              </div>

              <select
                value={categoriaSeleccionada}
                onChange={(e) => {
                  setCategoriaSeleccionada(e.target.value);
                  setIdCatalogoSeleccionado('');
                  setIndiceSugerencia(-1);

                  if (String(busqueda || '').trim().length >= 2) {
                    setMostrarSugerencias(true);
                  }
                }}
                className="w-full px-4 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-400 text-slate-700 font-bold transition"
              >
                <option value="">Todas las categorías</option>
                {categorias.map((categoria) => (
                  <option
                    key={categoria.id_categoria}
                    value={categoria.id_categoria}
                  >
                    {categoria.nombre}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={limpiarFiltros}
                className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-slate-900 hover:bg-sky-700 text-white font-black transition shadow-lg shadow-slate-900/15 hover:-translate-y-0.5"
              >
                <RefreshCw size={19} />
                Limpiar
              </button>
            </div>

            {/* Chips de filtros activos */}
            {hayFiltros && (
              <div className="mt-4 flex flex-wrap gap-2">
                {busqueda.trim() && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-sky-50 border border-sky-100 px-4 py-2 text-sm font-black text-sky-700">
                    Búsqueda: {busqueda.trim()}
                  </span>
                )}

                {categoriaActual && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-cyan-50 border border-cyan-100 px-4 py-2 text-sm font-black text-cyan-700">
                    Categoría: {categoriaActual.nombre}
                  </span>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Estado de carga */}
        {cargando && (
          <div className="mt-10 flex flex-col items-center justify-center py-16 text-slate-500">
            <div className="relative">
              <div className="absolute inset-0 rounded-3xl bg-sky-300/40 blur-xl catalogo-soft-pulse" />
              <div className="relative w-20 h-20 rounded-3xl bg-white shadow-xl shadow-sky-900/10 flex items-center justify-center">
                <RefreshCw size={36} className="animate-spin text-sky-600" />
              </div>
            </div>

            <p className="mt-4 font-black text-slate-700">
              Cargando catálogo...
            </p>

            <p className="mt-1 text-sm text-slate-400 font-semibold">
              Preparando productos disponibles
            </p>
          </div>
        )}

        {/* Error */}
        {!cargando && error && (
          <div className="mt-8 rounded-[2rem] bg-red-50 border border-red-200 p-6 text-red-700 font-bold shadow-sm">
            {error}
          </div>
        )}

        {/* Sin productos */}
        {!cargando && !error && productos.length === 0 && (
          <div className="mt-10 bg-white/90 backdrop-blur-xl rounded-[2rem] border border-white p-10 text-center shadow-xl shadow-sky-900/10">
            <div className="w-24 h-24 rounded-[2rem] bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <PackageSearch size={46} />
            </div>

            <h3 className="mt-5 text-2xl font-black text-slate-900">
              No hay productos para mostrar
            </h3>

            <p className="mt-2 text-slate-500 font-medium max-w-xl mx-auto">
              Intenta limpiar los filtros o agregar productos al catálogo desde
              el panel administrador.
            </p>

            <button
              type="button"
              onClick={limpiarFiltros}
              className="mt-6 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-black transition hover:-translate-y-0.5"
            >
              <RefreshCw size={18} />
              Limpiar búsqueda
            </button>
          </div>
        )}

        {/* Grid de productos */}
        {!cargando && !error && productos.length > 0 && (
          <section className="mt-8 catalogo-fade-up">
            <div className="mb-5 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white border border-sky-100 px-4 py-2 text-sm font-black text-sky-700 shadow-sm">
                  <Store size={17} />
                  Productos disponibles
                </div>

                <h2 className="mt-3 text-3xl font-black text-slate-900">
                  Explora nuestros productos
                </h2>

                <br />
              </div>


            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
              {productos.map((producto) => (
                <ProductoCatalogoCard
                  key={producto.id_catalogo}
                  producto={producto}
                  onVerDetalle={abrirDetalle}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Selector de sucursal para WhatsApp */}
      {modalWhatsappAbierto && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-7xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5 sm:p-6">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
                  <MessageCircle size={23} />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">
                    Atención por WhatsApp
                  </p>
                  <h2 className="mt-1 text-xl font-black text-slate-900 sm:text-2xl">
                    Elige la sucursal que deseas contactar
                  </h2>
                  <p className="mt-1 text-sm font-semibold leading-relaxed text-slate-500">
                    Selecciona una sucursal para abrir una conversación directa por WhatsApp.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalWhatsappAbierto(false)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 transition hover:bg-red-50 hover:text-red-600"
                title="Cerrar"
                aria-label="Cerrar selector de sucursal"
              >
                <X size={23} />
              </button>
            </div>

            <div className="max-h-[68vh] overflow-y-auto p-5 sm:p-6">
              {cargandoSucursalesWhatsapp ? (
                <div className="flex flex-col items-center justify-center py-14 text-slate-500">
                  <RefreshCw size={34} className="animate-spin text-emerald-600" />
                  <p className="mt-3 font-black text-slate-700">Cargando sucursales...</p>
                </div>
              ) : errorSucursalesWhatsapp ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
                  {errorSucursalesWhatsapp}
                </div>
              ) : sucursalesWhatsapp.length === 0 ? (
                <div className="rounded-3xl border border-slate-100 bg-slate-50 px-5 py-12 text-center">
                  <MessageCircle size={40} className="mx-auto text-slate-400" />
                  <h3 className="mt-4 text-lg font-black text-slate-800">
                    Aún no hay sucursales disponibles
                  </h3>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Intenta más tarde o consulta nuestras demás redes oficiales.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {sucursalesWhatsapp.map((sucursal) => (
                    <article
                      key={sucursal.id_sucursal}
                      className="rounded-3xl border border-emerald-100 bg-emerald-50/40 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm">
                          <Store size={21} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-black leading-snug text-slate-900">
                            {sucursal.nombre}
                          </h3>

                        </div>
                      </div>

                      <div className="mt-4 space-y-3 text-sm">
                        <div className="flex items-start gap-2 text-slate-600">
                          <MapPin size={17} className="mt-0.5 shrink-0 text-sky-600" />
                          <span className="whitespace-pre-line font-semibold leading-relaxed">
                            {sucursal.direccion || 'Dirección disponible al contactar la sucursal.'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-slate-700">
                          <Phone size={17} className="shrink-0 text-emerald-600" />
                          <span className="font-black">{sucursal.telefono}</span>
                        </div>
                      </div>

                      <div className="mt-5 space-y-3">
                        <a
                          href={sucursal.url_whatsapp}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 font-black text-white shadow-lg shadow-emerald-600/20 transition hover:-translate-y-0.5 hover:bg-emerald-700"
                        >
                          <MessageCircle size={19} />
                          Abrir WhatsApp
                          <ArrowUpRight size={17} />
                        </a>

                        {sucursal.url_google_maps && (
                          <a
                            href={sucursal.url_google_maps}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-white px-4 py-3 font-black text-sky-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-sky-50"
                          >
                            <MapPin size={19} />
                            Ver ubicación
                            <ArrowUpRight size={17} />
                          </a>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Overlay detalle */}
      {cargandoDetalle && (
        <div className="fixed inset-0 z-[1000] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] px-7 py-6 shadow-2xl flex items-center gap-3">
            <RefreshCw size={24} className="animate-spin text-sky-600" />
            <span className="font-black text-slate-700">
              Cargando detalle...
            </span>
          </div>
        </div>
      )}

      {productoSeleccionado && (
        <ProductoCatalogoModal
          producto={productoSeleccionado}
          onCerrar={() => setProductoSeleccionado(null)}
          onVerDisponibilidad={(producto) => {
            setProductoDisponibilidadSeleccionado(producto);
          }}
        />
      )}

      {productoDisponibilidadSeleccionado && (
        <SucursalesDisponiblesModal
          producto={productoDisponibilidadSeleccionado}
          onCerrar={() => setProductoDisponibilidadSeleccionado(null)}
        />
      )}
            <ChatbotDisponibilidad
              onVerDetalle={abrirDetalle}
              onVerDisponibilidad={(producto) => {
                setProductoDisponibilidadSeleccionado(producto);
              }}
              onAbrirWhatsApp={abrirSelectorWhatsapp}
            />
    </div>

  );
}