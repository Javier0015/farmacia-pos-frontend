import { useEffect, useState } from 'react';
import {
  Search,
  Boxes,
  Store,
  Package,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  Barcode,
  MapPin,
  RefreshCw,
  Layers3,
  Building2,
  ShieldCheck,
} from 'lucide-react';

export default function StockSucursales() {
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [producto, setProducto] = useState(null);
  const [sucursales, setSucursales] = useState([]);

  const [sugerencias, setSugerencias] = useState([]);
  const [cargandoSugerencias, setCargandoSugerencias] = useState(false);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [indiceSugerencia, setIndiceSugerencia] = useState(-1);
  const [productoSeleccionadoId, setProductoSeleccionadoId] = useState(null);

  useEffect(() => {
    const texto = busqueda.trim();

    if (productoSeleccionadoId || texto.length < 2) {
      setSugerencias([]);
      setMostrarSugerencias(false);
      setIndiceSugerencia(-1);
      setCargandoSugerencias(false);
      return undefined;
    }

    /*
     * El menú se abre desde que el usuario escribe dos caracteres.
     * Así se muestra el loader inmediatamente, igual que en el POS,
     * mientras se espera el debounce y la respuesta del endpoint.
     */
    setMostrarSugerencias(true);
    setSugerencias([]);
    setIndiceSugerencia(-1);
    setCargandoSugerencias(true);

    const controller = new AbortController();

    const timeout = window.setTimeout(async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/inventario/stock-sucursales?modo=sugerencias&buscar=${encodeURIComponent(texto)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          }
        );

        const data = await response.json();

        if (!response.ok || !data.ok) {
          setSugerencias([]);
          return;
        }

        setSugerencias(data.productos || []);
        setIndiceSugerencia(-1);
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error al buscar sugerencias de productos:', error);
          setSugerencias([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setCargandoSugerencias(false);
        }
      }
    }, 300);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [busqueda, productoSeleccionadoId]);

  const consultarStock = async ({ idProducto = null, texto = '' } = {}) => {
    const criterio = texto.trim();

    if (!idProducto && !criterio) {
      setMensaje('Escribe el nombre, código de barras o presentación del producto');
      setProducto(null);
      setSucursales([]);
      return;
    }

    try {
      setCargando(true);
      setMensaje('');
      setProducto(null);
      setSucursales([]);
      setMostrarSugerencias(false);

      const token = localStorage.getItem('token');

      const parametroBusqueda = idProducto
        ? `id_producto=${encodeURIComponent(idProducto)}`
        : `buscar=${encodeURIComponent(criterio)}`;

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/inventario/stock-sucursales?${parametroBusqueda}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.ok) {
        setMensaje(data.mensaje || 'No se encontró información del producto.');
        return;
      }

      setProducto(data.producto || null);
      setSucursales(data.sucursales || []);

      if (!data.sucursales || data.sucursales.length === 0) {
        setMensaje('No hay existencias registradas para este producto.');
      }
    } catch (error) {
      console.error(error);
      setMensaje('Error al consultar el stock en sucursales.');
    } finally {
      setCargando(false);
    }
  };

  const buscarStock = async (e) => {
    e.preventDefault();

    if (productoSeleccionadoId) {
      await consultarStock({ idProducto: productoSeleccionadoId });
      return;
    }

    await consultarStock({ texto: busqueda });
  };

  const seleccionarProducto = async (item) => {
    setProductoSeleccionadoId(item.id_producto);
    setBusqueda(item.nombre || item.producto || '');
    setSugerencias([]);
    setMostrarSugerencias(false);
    setIndiceSugerencia(-1);

    await consultarStock({ idProducto: item.id_producto });
  };

  const manejarCambioBusqueda = (e) => {
    setBusqueda(e.target.value);
    setProductoSeleccionadoId(null);
    setProducto(null);
    setSucursales([]);
    setMensaje('');
  };

  const manejarTeclaBusqueda = (e) => {
    if (e.key === 'Escape') {
      setMostrarSugerencias(false);
      setIndiceSugerencia(-1);
      return;
    }

    if (!mostrarSugerencias || cargandoSugerencias || sugerencias.length === 0) {
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIndiceSugerencia((actual) =>
        actual >= sugerencias.length - 1 ? 0 : actual + 1
      );
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIndiceSugerencia((actual) =>
        actual <= 0 ? sugerencias.length - 1 : actual - 1
      );
      return;
    }

    if (e.key === 'Enter' && indiceSugerencia >= 0) {
      e.preventDefault();
      seleccionarProducto(sugerencias[indiceSugerencia]);
    }
  };

  const limpiarBusqueda = () => {
    setBusqueda('');
    setProductoSeleccionadoId(null);
    setProducto(null);
    setSucursales([]);
    setSugerencias([]);
    setMensaje('');
    setMostrarSugerencias(false);
    setIndiceSugerencia(-1);
  };

  const totalDisponible = sucursales.reduce(
    (total, item) => total + Number(item.stock || 0),
    0
  );

  const sucursalesConStock = sucursales.filter(
    (item) => Number(item.stock || 0) > 0
  ).length;

  const sucursalesSinStock = sucursales.filter(
    (item) => Number(item.stock || 0) <= 0
  ).length;

  const sucursalesStockBajo = sucursales.filter((item) => {
    const stock = Number(item.stock || 0);
    return stock > 0 && stock <= 5;
  }).length;

  const obtenerEstado = (stock) => {
    const cantidad = Number(stock || 0);

    if (cantidad <= 0) {
      return {
        texto: 'Sin stock',
        clase: 'bg-red-50 text-red-700 border-red-200',
        icono: XCircle,
        barra: 'bg-red-500',
      };
    }

    if (cantidad <= 5) {
      return {
        texto: 'Stock bajo',
        clase: 'bg-amber-50 text-amber-700 border-amber-200',
        icono: AlertCircle,
        barra: 'bg-amber-500',
      };
    }

    return {
      texto: 'Disponible',
      clase: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icono: CheckCircle2,
      barra: 'bg-emerald-500',
    };
  };

  const porcentajeDisponibilidad =
    sucursales.length > 0
      ? Math.round((sucursalesConStock / sucursales.length) * 100)
      : 0;

  return (
    <div className="w-full max-w-full overflow-hidden space-y-6 pb-10">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-600/45 via-cyan-500/20 to-emerald-500/10" />
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-sky-400/20 blur-3xl" />
        <div className="absolute bottom-0 -left-24 h-72 w-72 rounded-full bg-cyan-300/10 blur-3xl" />

        <div className="relative p-5 sm:p-7 lg:p-8">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/10 px-3 py-1 text-xs sm:text-sm font-bold text-sky-100">
                <Boxes size={15} />
                Inventario intersucursales
              </div>

              <h1 className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">
                Consulta de stock
              </h1>

              <p className="mt-3 max-w-2xl text-sm sm:text-base text-slate-200 leading-relaxed">
                Busca un producto por nombre o código de barras y revisa en qué sucursales
                hay disponibilidad para orientar mejor al cliente.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full xl:w-auto">
              <div className="rounded-3xl bg-white/10 border border-white/10 p-4 backdrop-blur-sm">
                <p className="text-xs font-bold uppercase text-sky-100">
                  Total disponible
                </p>
                <p className="mt-2 text-2xl font-black">
                  {totalDisponible}
                </p>
              </div>

              <div className="rounded-3xl bg-white/10 border border-white/10 p-4 backdrop-blur-sm">
                <p className="text-xs font-bold uppercase text-emerald-100">
                  Con stock
                </p>
                <p className="mt-2 text-2xl font-black">
                  {sucursalesConStock}
                </p>
              </div>

              <div className="rounded-3xl bg-white/10 border border-white/10 p-4 backdrop-blur-sm">
                <p className="text-xs font-bold uppercase text-amber-100">
                  Disponibilidad
                </p>
                <p className="mt-2 text-2xl font-black">
                  {porcentajeDisponibilidad}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BUSCADOR */}
      <section className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-4 sm:p-5">
        <form onSubmit={buscarStock} className="flex flex-col xl:flex-row gap-3">
          <div className="relative flex-1 min-w-0">
            <Search
              size={21}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={busqueda}
              onChange={manejarCambioBusqueda}
              onKeyDown={manejarTeclaBusqueda}
              onFocus={() => {
                if (busqueda.trim().length >= 2) {
                  setMostrarSugerencias(true);
                }
              }}
              onBlur={() => {
                window.setTimeout(() => {
                  setMostrarSugerencias(false);
                  setIndiceSugerencia(-1);
                }, 150);
              }}
              autoComplete="off"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={mostrarSugerencias && busqueda.trim().length >= 2}
              aria-controls="sugerencias-stock-sucursales"
              placeholder="Buscar por nombre, código de barras o descripción del producto..."
              className="w-full pl-12 pr-12 py-4 rounded-2xl border border-slate-200 bg-slate-50/60 text-slate-800 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            />

            {cargandoSugerencias && (
              <Loader2
                size={19}
                className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-sky-600"
              />
            )}

            {mostrarSugerencias && busqueda.trim().length >= 2 && (
              <div
                id="sugerencias-stock-sucursales"
                role="listbox"
                className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15"
              >
                {cargandoSugerencias ? (
                  <div className="flex items-center gap-2 px-4 py-3 text-sm font-bold text-slate-500">
                    <Loader2 size={17} className="animate-spin" />
                    Buscando productos...
                  </div>
                ) : sugerencias.length === 0 ? (
                  <div className="px-4 py-3 text-sm font-bold text-slate-500">
                    No se encontraron productos con “{busqueda.trim()}”.
                  </div>
                ) : (
                  <div className="max-h-80 overflow-y-auto py-2">
                    {sugerencias.map((item, index) => (
                      <button
                        key={item.id_producto}
                        type="button"
                        role="option"
                        aria-selected={indiceSugerencia === index}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => seleccionarProducto(item)}
                        className={`flex w-full items-start justify-between gap-4 px-4 py-3 text-left transition ${
                          indiceSugerencia === index
                            ? 'bg-sky-50 text-sky-950'
                            : 'hover:bg-sky-50 text-slate-800'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black">
                            {item.nombre || item.producto || 'Producto sin nombre'}
                          </p>
                          <p className="mt-0.5 text-xs font-semibold text-slate-500">
                            {item.codigo_barras || 'Sin código'}
                            {item.laboratorio ? ` · ${item.laboratorio}` : ''}
                            {item.presentacion ? ` · ${item.presentacion}` : ''}
                          </p>
                        </div>

                        <span className="shrink-0 rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-black text-sky-700">
                          Ver stock
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="px-6 py-4 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-black shadow-lg shadow-sky-900/20 transition disabled:opacity-60 inline-flex items-center justify-center gap-2"
          >
            {cargando ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Buscando...
              </>
            ) : (
              <>
                <Search size={20} />
                Buscar stock
              </>
            )}
          </button>

          {(producto || sucursales.length > 0 || mensaje) && (
            <button
              type="button"
              onClick={limpiarBusqueda}
              className="px-6 py-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black transition inline-flex items-center justify-center gap-2"
            >
              <RefreshCw size={19} />
              Limpiar
            </button>
          )}
        </form>
      </section>

      {/* MENSAJE */}
      {mensaje && (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 text-amber-800 px-5 py-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">
            <AlertCircle size={22} />
          </div>

          <div>
            <p className="font-black">Aviso de consulta</p>
            <p className="font-semibold text-sm mt-1">{mensaje}</p>
          </div>
        </div>
      )}

      {/* PRODUCTO + RESUMEN */}
      {producto && (
        <section className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          {/* Tarjeta principal producto */}
          <div className="xl:col-span-6 bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-5 sm:p-6 bg-gradient-to-br from-sky-50 to-white border-b border-slate-100">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-3xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-sky-900/20">
                  <Package size={28} />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-wide text-sky-700">
                    Producto consultado
                  </p>

                  <h2 className="mt-1 text-xl sm:text-2xl font-black text-slate-900 break-words">
                    {producto.nombre || producto.producto || 'Producto'}
                  </h2>

                  <p className="mt-2 text-sm text-slate-500">
                    Información consolidada del producto en las sucursales registradas.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-3xl bg-slate-50 border border-slate-100 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white text-sky-700 flex items-center justify-center">
                    <Barcode size={21} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase text-slate-500">
                      Código
                    </p>
                    <p className="font-black text-slate-900 break-words">
                      {producto.codigo_barras || producto.codigo || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl bg-slate-50 border border-slate-100 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white text-emerald-700 flex items-center justify-center">
                    <ShieldCheck size={21} />
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase text-slate-500">
                      Estado general
                    </p>
                    <p className="font-black text-slate-900">
                      {totalDisponible > 0 ? 'Disponible' : 'Sin existencia'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* KPIS */}
          <div className="xl:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Boxes size={24} />
                </div>

                <span className="text-xs font-black bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full">
                  Stock
                </span>
              </div>

              <p className="mt-5 text-sm font-bold text-slate-500">
                Total disponible
              </p>

              <p className="mt-1 text-4xl font-black text-slate-950">
                {totalDisponible}
              </p>

              <p className="mt-2 text-sm text-slate-400">
                Piezas acumuladas en todas las sucursales.
              </p>
            </div>

            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center">
                  <Store size={24} />
                </div>

                <span className="text-xs font-black bg-sky-50 text-sky-700 px-3 py-1 rounded-full">
                  Sucursales
                </span>
              </div>

              <p className="mt-5 text-sm font-bold text-slate-500">
                Sucursales con stock
              </p>

              <p className="mt-1 text-4xl font-black text-slate-950">
                {sucursalesConStock}
              </p>

              <p className="mt-2 text-sm text-slate-400">
                De {sucursales.length} sucursal(es) consultadas.
              </p>
            </div>

            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
                  <AlertCircle size={24} />
                </div>

                <span className="text-xs font-black bg-amber-50 text-amber-700 px-3 py-1 rounded-full">
                  Alerta
                </span>
              </div>

              <p className="mt-5 text-sm font-bold text-slate-500">
                Stock bajo
              </p>

              <p className="mt-1 text-4xl font-black text-slate-950">
                {sucursalesStockBajo}
              </p>

              <p className="mt-2 text-sm text-slate-400">
                Sucursales con 1 a 5 piezas.
              </p>
            </div>

            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-700 flex items-center justify-center">
                  <XCircle size={24} />
                </div>

                <span className="text-xs font-black bg-red-50 text-red-700 px-3 py-1 rounded-full">
                  Sin stock
                </span>
              </div>

              <p className="mt-5 text-sm font-bold text-slate-500">
                Sucursales sin stock
              </p>

              <p className="mt-1 text-4xl font-black text-slate-950">
                {sucursalesSinStock}
              </p>

              <p className="mt-2 text-sm text-slate-400">
                Sucursales donde no hay existencia.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* TABLA */}
      {sucursales.length > 0 && (
        <section className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 text-sky-700 px-3 py-1 text-xs font-black mb-3">
                <Layers3 size={14} />
                Detalle por sucursal
              </div>

              <h3 className="text-xl font-black text-slate-900">
                Existencias por sucursal
              </h3>

              <p className="text-sm text-slate-500 mt-1">
                Consulta rápida para saber dónde se puede surtir o localizar el producto.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-2xl bg-emerald-50 px-4 py-3">
                <p className="text-xs font-black text-emerald-700">
                  Disponible
                </p>
                <p className="text-xl font-black text-emerald-700">
                  {sucursalesConStock}
                </p>
              </div>

              <div className="rounded-2xl bg-amber-50 px-4 py-3">
                <p className="text-xs font-black text-amber-700">
                  Bajo
                </p>
                <p className="text-xl font-black text-amber-700">
                  {sucursalesStockBajo}
                </p>
              </div>

              <div className="rounded-2xl bg-red-50 px-4 py-3">
                <p className="text-xs font-black text-red-700">
                  Sin stock
                </p>
                <p className="text-xl font-black text-red-700">
                  {sucursalesSinStock}
                </p>
              </div>
            </div>
          </div>

          {/* Desktop */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-4 text-left font-black uppercase text-xs">
                    Sucursal
                  </th>
                  <th className="px-5 py-4 text-left font-black uppercase text-xs">
                    Dirección
                  </th>
                  <th className="px-5 py-4 text-center font-black uppercase text-xs">
                    Stock
                  </th>
                  <th className="px-5 py-4 text-center font-black uppercase text-xs">
                    Estado
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {sucursales.map((item, index) => {
                  const estado = obtenerEstado(item.stock);
                  const IconEstado = estado.icono;
                  const stock = Number(item.stock || 0);

                  return (
                    <tr key={item.id_sucursal || index} className="hover:bg-slate-50 transition">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
                            <Building2 size={21} />
                          </div>

                          <div>
                            <p className="font-black text-slate-900">
                              {item.sucursal || item.nombre_sucursal}
                            </p>
                            <p className="text-xs text-slate-500 font-semibold">
                              ID: {item.id_sucursal || 'N/A'}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        <div className="flex items-start gap-2">
                          <MapPin size={16} className="text-slate-400 mt-0.5 shrink-0" />
                          <span>
                            {item.direccion || 'Sin dirección registrada'}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className="text-2xl font-black text-slate-900">
                            {stock}
                          </span>

                          <div className="mt-2 h-2 w-24 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${estado.barra}`}
                              style={{
                                width: `${Math.min(100, Math.max(8, stock * 10))}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-black ${estado.clase}`}
                        >
                          <IconEstado size={16} />
                          {estado.texto}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Móvil / tablet */}
          <div className="lg:hidden p-4 space-y-3">
            {sucursales.map((item, index) => {
              const estado = obtenerEstado(item.stock);
              const IconEstado = estado.icono;
              const stock = Number(item.stock || 0);

              return (
                <div
                  key={item.id_sucursal || index}
                  className="rounded-3xl border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-2xl bg-white text-sky-700 flex items-center justify-center shrink-0">
                        <Store size={21} />
                      </div>

                      <div className="min-w-0">
                        <p className="font-black text-slate-900 break-words">
                          {item.sucursal || item.nombre_sucursal}
                        </p>

                        <p className="text-xs text-slate-500 mt-1 break-words">
                          {item.direccion || 'Sin dirección registrada'}
                        </p>
                      </div>
                    </div>

                    <span className="text-3xl font-black text-slate-900 shrink-0">
                      {stock}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-black ${estado.clase}`}
                    >
                      <IconEstado size={16} />
                      {estado.texto}
                    </span>

                    <span className="text-xs font-bold text-slate-400">
                      ID: {item.id_sucursal || 'N/A'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ESTADO VACÍO */}
      {!producto && sucursales.length === 0 && !mensaje && !cargando && (
        <section className="relative overflow-hidden bg-white rounded-[2rem] shadow-sm border border-slate-100 p-8 sm:p-12 text-center">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-500 via-cyan-400 to-emerald-400" />

          <div className="w-20 h-20 rounded-[2rem] bg-sky-50 text-sky-700 flex items-center justify-center mx-auto mb-5">
            <Search size={36} />
          </div>

          <h3 className="text-xl font-black text-slate-900">
            Busca un producto para consultar existencias
          </h3>

          <p className="text-slate-500 mt-2 max-w-lg mx-auto leading-relaxed">
            Puedes escribir el nombre del producto o escanear/escribir el código de barras.
            El sistema mostrará la disponibilidad por cada sucursal registrada.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-black">
              Disponible
            </span>
            <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-black">
              Stock bajo
            </span>
            <span className="px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-black">
              Sin stock
            </span>
          </div>
        </section>
      )}
    </div>
  );
}