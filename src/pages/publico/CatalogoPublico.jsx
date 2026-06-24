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
} from 'lucide-react';
import api from '../../api/axios';
import ProductoCatalogoCard from '../../components/catalogo/ProductoCatalogoCard';
import ProductoCatalogoModal from '../../components/catalogo/ProductoCatalogoModal';
import logoFarmacia from '../../assets/logoShaddai.png';

export default function CatalogoPublico() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);

  const [busqueda, setBusqueda] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
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

  const cargarCatalogo = async () => {
    try {
      setCargando(true);
      setError('');

      const params = {};

      if (busqueda.trim()) {
        params.q = busqueda.trim();
      }

      if (categoriaSeleccionada) {
        params.categoria = categoriaSeleccionada;
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
  };

  useEffect(() => {
    cargarCategorias();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      cargarCatalogo();
    }, 350);

    return () => clearTimeout(timer);
  }, [busqueda, categoriaSeleccionada]);

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

          <div className="mt-14 grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-10 lg:items-center">
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

            
            </div>


 {/* Tarjeta visual derecha */}
            <div className="relative">
              <div className="absolute -inset-4 rounded-[3rem] bg-white/20 blur-2xl" />

              <div className="relative rounded-[3rem] bg-white/15 border border-white/25 backdrop-blur-xl p-6 shadow-2xl shadow-sky-950/20">
                <div className="rounded-[2.5rem] bg-white p-6 overflow-hidden relative">
                  <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-cyan-100" />
                  <div className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full bg-sky-100" />

                  <div className="relative flex flex-col items-center text-center">
                    <div className="relative w-32 h-32 rounded-[2.7rem] bg-gradient-to-br from-sky-50 via-white to-cyan-50 flex items-center justify-center shadow-inner border border-sky-100">
                      <div className="absolute inset-3 rounded-[2.2rem] bg-white shadow-lg" />

                      <img
                        src={logoFarmacia}
                        alt="Logo Farmacias Shaddai"
                        className="relative w-24 h-24 object-contain drop-shadow-sm"
                      />
                    </div>

                    

                    <p className="mt-2 text-slate-500 font-semibold">
                      ¡Puedes consultar nuestras promociones!
                    </p>

                   
                    </div>
                    </div>
                    </div>
                    </div>
          </div>
        </div>
      </header>

      {/* Contenido */}
      <main className="relative max-w-7xl mx-auto px-5 pb-12">
        {/* Filtros flotantes */}
        <section className="-mt-20 relative z-10 catalogo-fade-up">
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
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar medicamento o producto..."
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-400 text-slate-700 font-bold transition"
                />
              </div>

              <select
                value={categoriaSeleccionada}
                onChange={(e) => setCategoriaSeleccionada(e.target.value)}
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
        />
      )}
    </div>
  );
}