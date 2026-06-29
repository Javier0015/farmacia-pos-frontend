import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    X,
    Pill,
    BadgePercent,
    AlertTriangle,
    Package,
    FlaskConical,
    ClipboardList,
    Info,
    Store,
    MapPin,
    ArrowUpRight,
} from 'lucide-react';

const formatearPrecio = (valor) => {
    const numero = Number(valor || 0);

    return numero.toLocaleString('es-MX', {
        style: 'currency',
        currency: 'MXN',
    });
};

const esValorActivo = (valor) => {
    return valor === true || valor === 'true' || valor === 1 || valor === '1';
};

const obtenerSucursalesDisponibles = (producto) => {
    const valor = producto?.sucursales_disponibles;

    if (Array.isArray(valor)) {
        return valor;
    }

    if (typeof valor === 'string') {
        try {
            const resultado = JSON.parse(valor);
            return Array.isArray(resultado) ? resultado : [];
        } catch {
            return [];
        }
    }

    return [];
};

export default function ProductoCatalogoModal({
    producto,
    onCerrar,
    onVerDisponibilidad,
}) {
    useEffect(() => {
        if (!producto) return undefined;

        const cerrarConEscape = (event) => {
            if (event.key === 'Escape') {
                onCerrar();
            }
        };

        const overflowAnterior = document.body.style.overflow;

        document.addEventListener('keydown', cerrarConEscape);
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', cerrarConEscape);
            document.body.style.overflow = overflowAnterior;
        };
    }, [producto, onCerrar]);

    if (!producto) return null;

    const nombre =
        producto.titulo_catalogo ||
        producto.nombre_producto ||
        'Producto sin nombre';

    const tieneOferta = esValorActivo(producto.tiene_oferta);
    const requiereReceta = esValorActivo(producto.requiere_receta);
    const esControlado = esValorActivo(producto.es_controlado);

    const precioVenta = Number(producto.precio_venta || 0);
    const precioFinal = Number(producto.precio_final || precioVenta);

    const sucursalesDisponibles = obtenerSucursalesDisponibles(producto);

    const totalSucursales = Math.max(
        Number(producto.total_sucursales_disponibles || 0),
        sucursalesDisponibles.length
    );

    const modal = (
        <div
            className="fixed inset-0 z-[99999] flex items-end justify-center bg-slate-950/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
            onMouseDown={onCerrar}
        >
            <div
                className="relative flex h-[100dvh] w-full max-w-5xl flex-col overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-h-[92dvh] sm:rounded-[2rem]"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 bg-white px-5 py-4 sm:px-7 sm:py-5">
                    <div className="min-w-0">
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-sky-700">
                            Detalle del producto
                        </p>

                        <p className="mt-1 truncate text-sm font-bold text-slate-500">
                            {nombre}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onCerrar}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-red-50 hover:text-red-600"
                        aria-label="Cerrar detalle del producto"
                        title="Cerrar"
                    >
                        <X size={23} />
                    </button>
                </header>

                <div className="min-h-0 flex-1 overflow-y-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2">
                        <div className="flex min-h-[250px] items-center justify-center bg-gradient-to-br from-slate-50 to-sky-50 p-5 sm:min-h-[340px] sm:p-8 lg:min-h-[480px]">
                            {producto.imagen_url ? (
                                <img
                                    src={producto.imagen_url}
                                    alt={nombre}
                                    className="max-h-[38vh] max-w-full object-contain sm:max-h-[430px]"
                                />
                            ) : (
                                <div className="flex h-44 w-44 items-center justify-center rounded-[3rem] border border-slate-200 bg-white text-sky-600 shadow-sm sm:h-52 sm:w-52">
                                    <Pill size={82} />
                                </div>
                            )}
                        </div>

                        <div className="p-5 sm:p-7 lg:p-9">
                            <div className="flex flex-wrap gap-2">
                                {producto.nombre_categoria && (
                                    <span className="rounded-xl border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-black uppercase text-sky-700">
                                        {producto.nombre_categoria}
                                    </span>
                                )}

                                {tieneOferta && (
                                    <span className="inline-flex items-center gap-1 rounded-xl bg-red-600 px-3 py-1 text-xs font-black uppercase text-white">
                                        <BadgePercent size={14} />
                                        Oferta -{Number(producto.porcentaje_descuento || 0)}%
                                    </span>
                                )}

                                {requiereReceta && (
                                    <span className="inline-flex items-center gap-1 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-black uppercase text-amber-700">
                                        <AlertTriangle size={14} />
                                        Requiere receta
                                    </span>
                                )}

                                {esControlado && (
                                    <span className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-3 py-1 text-xs font-black uppercase text-red-700">
                                        <AlertTriangle size={14} />
                                        Controlado
                                    </span>
                                )}
                            </div>

                            <h2 className="mt-5 break-words text-3xl font-black leading-tight text-slate-900 sm:text-4xl">
                                {nombre}
                            </h2>

                            <p className="mt-3 text-base leading-relaxed text-slate-500">
                                {producto.descripcion_catalogo ||
                                    producto.descripcion_producto ||
                                    'Sin descripción disponible.'}
                            </p>

                            <div className="mt-6">
                                {tieneOferta && (
                                    <p className="text-lg font-semibold text-slate-400 line-through">
                                        {formatearPrecio(precioVenta)}
                                    </p>
                                )}

                                <p
                                    className={`text-4xl font-black ${tieneOferta ? 'text-red-600' : 'text-sky-700'
                                        }`}
                                >
                                    {formatearPrecio(precioFinal)}
                                </p>

                                {producto.nombre_oferta && (
                                    <p className="mt-2 text-sm font-bold text-red-600">
                                        {producto.nombre_oferta}
                                    </p>
                                )}
                            </div>

                            <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                    <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                                        <FlaskConical size={17} />
                                        Laboratorio
                                    </div>

                                    <p className="mt-1 break-words font-black text-slate-800">
                                        {producto.laboratorio || 'No especificado'}
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                    <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                                        <Package size={17} />
                                        Presentación
                                    </div>

                                    <p className="mt-1 break-words font-black text-slate-800">
                                        {producto.presentacion || 'No especificada'}
                                    </p>
                                </div>
                            </div>

                            <section className="mt-5 rounded-3xl border border-emerald-100 bg-emerald-50/60 p-4 sm:p-5">
                                <div className="flex items-start gap-3">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm">
                                        <Store size={21} />
                                    </div>

                                    <div className="min-w-0">
                                        <p className="text-sm font-black text-slate-800">
                                            Disponibilidad por sucursal
                                        </p>

                                        <p className="mt-0.5 text-sm font-semibold text-slate-500">
                                            {totalSucursales > 0
                                                ? totalSucursales === 1
                                                    ? 'Disponible en 1 sucursal.'
                                                    : `Disponible en ${totalSucursales} sucursales.`
                                                : 'Sin existencia por el momento.'}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    disabled={totalSucursales <= 0 || !onVerDisponibilidad}
                                    onClick={() => onVerDisponibilidad?.(producto)}
                                    className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition ${totalSucursales > 0 && onVerDisponibilidad
                                            ? 'border border-sky-200 bg-white text-sky-700 shadow-sm hover:-translate-y-0.5 hover:bg-sky-50'
                                            : 'cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400'
                                        }`}
                                >
                                    <MapPin size={18} />
                                    {totalSucursales > 0
                                        ? 'Ver disponibilidad por sucursal'
                                        : 'Sin sucursales disponibles'}
                                    {totalSucursales > 0 && onVerDisponibilidad && (
                                        <ArrowUpRight size={16} />
                                    )}
                                </button>
                            </section>
                        </div>
                    </div>

                    <div className="border-t border-slate-100 p-5 sm:p-7 lg:p-9">
                        <h3 className="text-2xl font-black text-slate-900">
                            Detalles del producto
                        </h3>

                        <div className="mt-5 border-b border-slate-200">
                            <div className="inline-flex items-center gap-2 border-b-4 border-sky-500 px-5 py-3 font-black text-sky-700">
                                <ClipboardList size={19} />
                                Descripción
                            </div>
                        </div>

                        <div className="mt-6 space-y-6">
                            <section>
                                <h4 className="text-xl font-black text-slate-900">
                                    {nombre}
                                </h4>

                                <p className="mt-2 leading-relaxed text-slate-600">
                                    {producto.descripcion_catalogo ||
                                        producto.descripcion_producto ||
                                        'Sin descripción disponible.'}
                                </p>
                            </section>

                            {producto.indicaciones && (
                                <section>
                                    <h4 className="flex items-center gap-2 text-lg font-black text-sky-700">
                                        <Info size={20} />
                                        Indicaciones
                                    </h4>

                                    <p className="mt-2 leading-relaxed text-slate-600">
                                        {producto.indicaciones}
                                    </p>
                                </section>
                            )}

                            {producto.modo_uso && (
                                <section>
                                    <h4 className="flex items-center gap-2 text-lg font-black text-sky-700">
                                        <ClipboardList size={20} />
                                        Modo de uso
                                    </h4>

                                    <p className="mt-2 leading-relaxed text-slate-600">
                                        {producto.modo_uso}
                                    </p>
                                </section>
                            )}

                            {producto.advertencias && (
                                <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
                                    <h4 className="flex items-center gap-2 text-lg font-black text-amber-700">
                                        <AlertTriangle size={20} />
                                        Advertencias
                                    </h4>

                                    <p className="mt-2 leading-relaxed text-amber-900">
                                        {producto.advertencias}
                                    </p>
                                </section>
                            )}

                            {(requiereReceta || esControlado) && (
                                <section className="rounded-3xl border border-red-200 bg-red-50 p-5">
                                    <h4 className="flex items-center gap-2 text-lg font-black text-red-700">
                                        <AlertTriangle size={20} />
                                        Información importante
                                    </h4>

                                    <p className="mt-2 leading-relaxed text-red-900">
                                        Este producto puede requerir validación por receta médica o
                                        control especial antes de su venta. Consulte al personal de
                                        farmacia.
                                    </p>
                                </section>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(modal, document.body);
}
