import { useEffect, useMemo, useState } from 'react';
import {
    Search,
    RefreshCw,
    Pill,
    SlidersHorizontal,
    PackageSearch,
    Store,
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

    return (
        <div className="min-h-screen bg-slate-100">
            {/* Header */}
            <header className="relative overflow-hidden bg-gradient-to-br from-sky-700 via-sky-600 to-cyan-500 text-white">
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-white blur-3xl" />
                    <div className="absolute -bottom-24 right-10 w-96 h-96 rounded-full bg-cyan-200 blur-3xl" />
                </div>

                <div className="relative max-w-7xl mx-auto px-5 py-10 lg:py-14">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-2xl bg-white/15 border border-white/20 px-4 py-2 text-sm font-bold">
                                <Store size={18} />
                                Catálogo digital
                            </div>

                            <h1 className="mt-5 text-4xl lg:text-6xl font-black tracking-tight">
                                Farmacias Shaddai
                            </h1>

                            <p className="mt-4 max-w-2xl text-sky-50 text-lg leading-relaxed">
                                Consulta productos, promociones y detalles antes de visitar la farmacia.
                            </p>
                        </div>

                        <div className="bg-white/15 border border-white/20 backdrop-blur-md rounded-[2rem] p-5 min-w-[260px]">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-3xl bg-white flex items-center justify-center shadow-lg overflow-hidden border border-white/40">
                                    <img
                                        src={logoFarmacia}
                                        alt="Logo Farmacias Shaddai"
                                        className="w-12 h-12 object-contain drop-shadow"
                                    />
                                </div>

                                <div>
                                    <p className="text-sm text-sky-100 font-semibold">
                                        Productos disponibles
                                    </p>
                                    <p className="text-4xl font-black">{totalProductos}</p>
                                </div>
                            </div>

                            <div className="mt-4 rounded-2xl bg-white/10 px-4 py-3">
                                <p className="text-sm font-semibold text-sky-50">
                                    {productosConOferta} producto(s) con oferta activa
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Filtros */}
            <main className="max-w-7xl mx-auto px-5 py-8">
                <section className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-5 lg:p-6 -mt-16 relative z-10">
                    <div className="flex items-center gap-2 mb-5">
                        <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center">
                            <SlidersHorizontal size={21} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900">
                                Buscar productos
                            </h2>
                            <p className="text-sm text-slate-500">
                                Filtra por nombre, laboratorio, presentación o categoría.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px_auto] gap-4">
                        <div className="relative">
                            <Search
                                size={21}
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                            <input
                                type="text"
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                placeholder="Buscar medicamento o producto..."
                                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-700 font-semibold"
                            />
                        </div>

                        <select
                            value={categoriaSeleccionada}
                            onChange={(e) => setCategoriaSeleccionada(e.target.value)}
                            className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-700 font-semibold"
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
                            className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black transition"
                        >
                            <RefreshCw size={19} />
                            Limpiar
                        </button>
                    </div>
                </section>

                {/* Estado de carga */}
                {cargando && (
                    <div className="mt-10 flex flex-col items-center justify-center py-16 text-slate-500">
                        <RefreshCw size={36} className="animate-spin text-sky-600" />
                        <p className="mt-4 font-bold">Cargando catálogo...</p>
                    </div>
                )}

                {/* Error */}
                {!cargando && error && (
                    <div className="mt-8 rounded-3xl bg-red-50 border border-red-200 p-6 text-red-700 font-bold">
                        {error}
                    </div>
                )}

                {/* Sin productos */}
                {!cargando && !error && productos.length === 0 && (
                    <div className="mt-10 bg-white rounded-[2rem] border border-slate-200 p-10 text-center">
                        <div className="w-20 h-20 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                            <PackageSearch size={42} />
                        </div>

                        <h3 className="mt-5 text-2xl font-black text-slate-900">
                            No hay productos para mostrar
                        </h3>

                        <p className="mt-2 text-slate-500">
                            Intenta limpiar los filtros o agregar productos al catálogo desde el panel administrador.
                        </p>
                    </div>
                )}

                {/* Grid de productos */}
                {!cargando && !error && productos.length > 0 && (
                    <section className="mt-8">
                        <div className="mb-5 flex items-center justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900">
                                    Productos
                                </h2>
                                <p className="text-slate-500 font-semibold">
                                    {totalProductos} resultado(s)
                                </p>
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

            {cargandoDetalle && (
                <div className="fixed inset-0 z-[1000] bg-slate-950/50 backdrop-blur-sm flex items-center justify-center">
                    <div className="bg-white rounded-3xl px-7 py-6 shadow-2xl flex items-center gap-3">
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