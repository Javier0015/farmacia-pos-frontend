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
} from 'lucide-react';

const formatearPrecio = (valor) => {
    const numero = Number(valor || 0);

    return numero.toLocaleString('es-MX', {
        style: 'currency',
        currency: 'MXN',
    });
};

export default function ProductoCatalogoModal({ producto, onCerrar }) {
    if (!producto) return null;

    const nombre =
        producto.titulo_catalogo ||
        producto.nombre_producto ||
        'Producto sin nombre';

    const tieneOferta = producto.tiene_oferta === true;
    const precioVenta = Number(producto.precio_venta || 0);
    const precioFinal = Number(producto.precio_final || precioVenta);

    useEffect(() => {
        const cerrarConEscape = (e) => {
            if (e.key === 'Escape') {
                onCerrar();
            }
        };

        document.addEventListener('keydown', cerrarConEscape);
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', cerrarConEscape);
            document.body.style.overflow = '';
        };
    }, [onCerrar]);

    const modal = (
        <div
            className="fixed inset-0 z-[99999] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
            onMouseDown={onCerrar}
        >
            <div
                className="catalogo-modal-scroll relative w-full max-w-5xl max-h-[92vh] overflow-y-auto bg-white rounded-[2rem] shadow-2xl border border-white/30"
                onMouseDown={(e) => e.stopPropagation()}
            >
                {/* Botón cerrar */}
                <button
                    type="button"
                    onClick={onCerrar}
                    className="sticky top-5 ml-auto mr-5 z-30 w-11 h-11 rounded-2xl bg-white border border-slate-200 text-slate-600 flex items-center justify-center shadow-md hover:bg-red-50 hover:text-red-600 transition"
                >
                    <X size={24} />
                </button>

                <div className="-mt-11 grid grid-cols-1 lg:grid-cols-2">
                    {/* Imagen */}
                    <div className="bg-gradient-to-br from-slate-50 to-sky-50 p-8 flex items-center justify-center min-h-[360px]">
                        {producto.imagen_url ? (
                            <img
                                src={producto.imagen_url}
                                alt={nombre}
                                className="max-h-[430px] max-w-full object-contain"
                            />
                        ) : (
                            <div className="w-48 h-48 rounded-[3rem] bg-white border border-slate-200 shadow-sm flex items-center justify-center text-sky-600">
                                <Pill size={92} />
                            </div>
                        )}
                    </div>

                    {/* Información principal */}
                    <div className="p-7 lg:p-9">
                        <div className="flex flex-wrap gap-2 pr-10">
                            {producto.nombre_categoria && (
                                <span className="rounded-xl bg-sky-50 text-sky-700 border border-sky-100 px-3 py-1 text-xs font-black uppercase">
                                    {producto.nombre_categoria}
                                </span>
                            )}

                            {tieneOferta && (
                                <span className="inline-flex items-center gap-1 rounded-xl bg-red-600 text-white px-3 py-1 text-xs font-black uppercase">
                                    <BadgePercent size={14} />
                                    Oferta -{Number(producto.porcentaje_descuento || 0)}%
                                </span>
                            )}

                            {producto.requiere_receta && (
                                <span className="inline-flex items-center gap-1 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 text-xs font-black uppercase">
                                    <AlertTriangle size={14} />
                                    Requiere receta
                                </span>
                            )}

                            {producto.es_controlado && (
                                <span className="inline-flex items-center gap-1 rounded-xl bg-red-50 text-red-700 border border-red-200 px-3 py-1 text-xs font-black uppercase">
                                    <AlertTriangle size={14} />
                                    Controlado
                                </span>
                            )}
                        </div>

                        <h2 className="mt-5 text-3xl lg:text-4xl font-black text-slate-900 leading-tight">
                            {nombre}
                        </h2>

                        <p className="mt-3 text-slate-500 text-base leading-relaxed">
                            {producto.descripcion_catalogo ||
                                producto.descripcion_producto ||
                                'Sin descripción disponible.'}
                        </p>

                        <div className="mt-6">
                            {tieneOferta && (
                                <p className="text-lg text-slate-400 line-through font-semibold">
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
                                <p className="mt-2 text-sm text-red-600 font-bold">
                                    {producto.nombre_oferta}
                                </p>
                            )}
                        </div>

                        <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                                <div className="flex items-center gap-2 text-slate-500 text-sm font-bold">
                                    <FlaskConical size={17} />
                                    Laboratorio
                                </div>
                                <p className="mt-1 font-black text-slate-800">
                                    {producto.laboratorio || 'No especificado'}
                                </p>
                            </div>

                            <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                                <div className="flex items-center gap-2 text-slate-500 text-sm font-bold">
                                    <Package size={17} />
                                    Presentación
                                </div>
                                <p className="mt-1 font-black text-slate-800">
                                    {producto.presentacion || 'No especificada'}
                                </p>
                            </div>

                            {producto.mostrar_stock && (
                                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 sm:col-span-2">
                                    <div className="flex items-center gap-2 text-slate-500 text-sm font-bold">
                                        <Package size={17} />
                                        Disponibilidad
                                    </div>

                                    {Number(producto.stock_total || 0) > 0 ? (
                                        <p className="mt-2 inline-flex items-center gap-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 text-sm font-black">
                                            Disponible
                                        </p>
                                    ) : (
                                        <p className="mt-2 inline-flex items-center gap-2 rounded-xl bg-slate-100 text-slate-500 border border-slate-200 px-3 py-1.5 text-sm font-black">
                                            Agotado
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Detalles */}
                <div className="p-7 lg:p-9 border-t border-slate-100">
                    <h3 className="text-2xl font-black text-slate-900">
                        Detalles del producto
                    </h3>

                    <div className="mt-5 border-b border-slate-200">
                        <div className="inline-flex items-center gap-2 px-5 py-3 border-b-4 border-sky-500 text-sky-700 font-black">
                            <ClipboardList size={19} />
                            Descripción
                        </div>
                    </div>

                    <div className="mt-6 space-y-6">
                        <section>
                            <h4 className="text-xl font-black text-slate-900">
                                {nombre}
                            </h4>

                            <p className="mt-2 text-slate-600 leading-relaxed">
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
                                <p className="mt-2 text-slate-600 leading-relaxed">
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
                                <p className="mt-2 text-slate-600 leading-relaxed">
                                    {producto.modo_uso}
                                </p>
                            </section>
                        )}

                        {producto.advertencias && (
                            <section className="rounded-3xl bg-amber-50 border border-amber-200 p-5">
                                <h4 className="flex items-center gap-2 text-lg font-black text-amber-700">
                                    <AlertTriangle size={20} />
                                    Advertencias
                                </h4>
                                <p className="mt-2 text-amber-900 leading-relaxed">
                                    {producto.advertencias}
                                </p>
                            </section>
                        )}

                        {(producto.requiere_receta || producto.es_controlado) && (
                            <section className="rounded-3xl bg-red-50 border border-red-200 p-5">
                                <h4 className="flex items-center gap-2 text-lg font-black text-red-700">
                                    <AlertTriangle size={20} />
                                    Información importante
                                </h4>
                                <p className="mt-2 text-red-900 leading-relaxed">
                                    Este producto puede requerir validación por receta médica o control especial antes de su venta. Consulte al personal de farmacia.
                                </p>
                            </section>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(modal, document.body);
}