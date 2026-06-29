import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    ArrowUpRight,
    MapPin,
    Phone,
    Store,
    X,
} from 'lucide-react';

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

export default function SucursalesDisponiblesModal({
    producto,
    onCerrar,
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

    const sucursales = obtenerSucursalesDisponibles(producto);

    const nombreProducto =
        producto?.titulo_catalogo ||
        producto?.nombre_producto ||
        'Producto';

    const esUnaSucursal = sucursales.length === 1;

    const modal = (
        <div
            className="fixed inset-0 z-[100000] flex items-end justify-center bg-slate-950/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
            onMouseDown={onCerrar}
        >
            <div
                className={`relative flex max-h-[92dvh] w-full flex-col overflow-hidden bg-white shadow-2xl rounded-t-[2rem] sm:rounded-[2rem] ${esUnaSucursal ? 'sm:max-w-2xl' : 'sm:max-w-5xl'
                    }`}
                onMouseDown={(event) => event.stopPropagation()}
            >
                {/* Encabezado */}
                <header className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 bg-white px-5 py-4 sm:px-7 sm:py-5">
                    <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 sm:h-12 sm:w-12">
                            <Store size={21} />
                        </div>

                        <div className="min-w-0">
                            <p className="text-xs font-black uppercase tracking-[0.14em] text-sky-700">
                                Disponibilidad por sucursal
                            </p>

                            <h3 className="mt-1 break-words text-xl font-black text-slate-900 sm:text-2xl">
                                {nombreProducto}
                            </h3>

                            <p className="mt-1 text-sm font-medium text-slate-500">
                                Consulta dónde está disponible antes de visitarnos.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onCerrar}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-red-50 hover:text-red-600"
                        aria-label="Cerrar disponibilidad por sucursal"
                        title="Cerrar"
                    >
                        <X size={22} />
                    </button>
                </header>

                {/* Contenido */}
                <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7">
                    {sucursales.length === 0 ? (
                        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-5 py-12 text-center">
                            <Store className="mx-auto text-slate-300" size={42} />

                            <p className="mt-4 font-black text-slate-700">
                                Sin disponibilidad por el momento
                            </p>

                            <p className="mt-1 text-sm font-medium text-slate-500">
                                Este producto no tiene existencia registrada en una sucursal activa.
                            </p>
                        </div>
                    ) : (
                        <div
                            className={`grid gap-4 ${esUnaSucursal
                                    ? 'grid-cols-1'
                                    : 'grid-cols-1 md:grid-cols-2'
                                }`}
                        >
                            {sucursales.map((sucursal) => (
                                <article
                                    key={sucursal.id_sucursal}
                                    className="rounded-3xl border border-sky-100 bg-sky-50/60 p-4 sm:p-5"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-sky-700 shadow-sm">
                                            <Store size={20} />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <h4 className="break-words text-base font-black leading-relaxed text-slate-900 sm:text-lg">
                                                {sucursal.nombre}
                                            </h4>

                                            <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">
                                                Farmacias Shaddai
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-5 space-y-3 text-sm">
                                        <div className="flex items-start gap-2 text-slate-600">
                                            <MapPin
                                                size={18}
                                                className="mt-0.5 shrink-0 text-sky-600"
                                            />

                                            <span className="whitespace-pre-line font-semibold leading-relaxed">
                                                {sucursal.direccion ||
                                                    'Dirección disponible al contactar la sucursal.'}
                                            </span>
                                        </div>

                                        {sucursal.telefono && (
                                            <div className="flex items-center gap-2 text-slate-700">
                                                <Phone
                                                    size={18}
                                                    className="shrink-0 text-emerald-600"
                                                />

                                                <a
                                                    href={`tel:${String(sucursal.telefono).replace(/\s/g, '')}`}
                                                    className="font-bold hover:text-emerald-700"
                                                >
                                                    {sucursal.telefono}
                                                </a>
                                            </div>
                                        )}
                                    </div>

                                    {sucursal.url_google_maps && (
                                        <a
                                            href={sucursal.url_google_maps}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-white px-4 py-3 text-sm font-black text-sky-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-sky-100"
                                        >
                                            <MapPin size={18} />
                                            Ver ubicación
                                            <ArrowUpRight size={16} />
                                        </a>
                                    )}
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return createPortal(modal, document.body);
}