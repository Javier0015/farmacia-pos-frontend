import {
    Heart,
    BadgePercent,
    Pill,
    Package,
    AlertTriangle,
    Eye,
} from 'lucide-react';

const formatearPrecio = (valor) => {
    const numero = Number(valor || 0);

    return numero.toLocaleString('es-MX', {
        style: 'currency',
        currency: 'MXN',
    });
};

export default function ProductoCatalogoCard({ producto, onVerDetalle }) {
    const nombre =
        producto.titulo_catalogo ||
        producto.nombre_producto ||
        'Producto sin nombre';

    const tieneOferta = producto.tiene_oferta === true;
    const precioVenta = Number(producto.precio_venta || 0);
    const precioFinal = Number(producto.precio_final || precioVenta);

    return (
        <article
            onClick={() => onVerDetalle(producto)}
            className="group relative bg-white rounded-[1.6rem] border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer"
        >
            {/* Badges superiores */}
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                {tieneOferta && (
                    <span className="inline-flex items-center gap-1 rounded-xl bg-red-600 px-3 py-1 text-xs font-black text-white shadow">
                        <BadgePercent size={14} />
                        -{Number(producto.porcentaje_descuento || 0)}%
                    </span>
                )}

                {producto.destacado && (
                    <span className="inline-flex items-center gap-1 rounded-xl bg-sky-600 px-3 py-1 text-xs font-black text-white shadow">
                        <Eye size={14} />
                        Destacado
                    </span>
                )}
            </div>

            {/* Favorito visual */}
            <button
                type="button"
                onClick={(e) => e.stopPropagation()}
                className="absolute top-4 right-4 z-10 w-10 h-10 rounded-2xl bg-white/90 border border-slate-200 text-sky-600 flex items-center justify-center shadow-sm hover:bg-sky-50 transition"
                title="Favorito"
            >
                <Heart size={22} />
            </button>

            {/* Imagen */}
            <div className="h-56 bg-gradient-to-br from-slate-50 to-sky-50 flex items-center justify-center p-5">
                {producto.imagen_url ? (
                    <img
                        src={producto.imagen_url}
                        alt={nombre}
                        className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="w-28 h-28 rounded-[2rem] bg-white border border-slate-200 shadow-sm flex items-center justify-center text-sky-600">
                        <Pill size={54} />
                    </div>
                )}
            </div>

            {/* Contenido */}
            <div className="p-5">
                <div className="min-h-[90px]">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        {producto.nombre_categoria || 'Sin categoría'}
                    </p>

                    <h3 className="mt-1 text-lg font-black text-slate-900 leading-tight line-clamp-2">
                        {nombre}
                    </h3>

                    <p className="mt-2 text-sm text-slate-500 line-clamp-2">
                        {producto.presentacion ||
                            producto.descripcion_catalogo ||
                            producto.descripcion_producto ||
                            'Sin descripción disponible.'}
                    </p>
                </div>

                {/* Precio */}
                <div className="mt-4">
                    {tieneOferta && (
                        <p className="text-sm text-slate-400 line-through font-semibold">
                            {formatearPrecio(precioVenta)}
                        </p>
                    )}

                    <p
                        className={`text-3xl font-black ${tieneOferta ? 'text-red-600' : 'text-sky-700'
                            }`}
                    >
                        {formatearPrecio(precioFinal)}
                    </p>
                </div>

                {/* Badges inferiores */}
                <div className="mt-4 flex flex-wrap gap-2">
                    {producto.requiere_receta && (
                        <span className="inline-flex items-center gap-1 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 text-xs font-bold">
                            <AlertTriangle size={13} />
                            Receta
                        </span>
                    )}

                    {producto.es_controlado && (
                        <span className="inline-flex items-center gap-1 rounded-xl bg-red-50 text-red-700 border border-red-200 px-3 py-1 text-xs font-bold">
                            <AlertTriangle size={13} />
                            Controlado
                        </span>
                    )}

                    {producto.mostrar_stock && (
                        Number(producto.stock_total || 0) > 0 ? (
                            <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 text-xs font-bold">
                                <Package size={13} />
                                Disponible
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 rounded-xl bg-slate-100 text-slate-500 border border-slate-200 px-3 py-1 text-xs font-bold">
                                <Package size={13} />
                                Agotado
                            </span>
                        )
                    )}
                </div>
            </div>
        </article>
    );
}