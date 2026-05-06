import { useState } from 'react';
import {
  Search,
  Boxes,
  Store,
  Package,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';

export default function StockSucursales() {
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [producto, setProducto] = useState(null);
  const [sucursales, setSucursales] = useState([]);

  const buscarStock = async (e) => {
    e.preventDefault();

    const texto = busqueda.trim();

    if (!texto) {
      setMensaje('Escribe el nombre o código de barras');
      setProducto(null);
      setSucursales([]);
      return;
    }

    try {
      setCargando(true);
      setMensaje('');
      setProducto(null);
      setSucursales([]);

      const token = localStorage.getItem('token');

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/inventario/stock-sucursales?buscar=${encodeURIComponent(texto)}`,
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

  const limpiarBusqueda = () => {
    setBusqueda('');
    setProducto(null);
    setSucursales([]);
    setMensaje('');
  };

  const totalDisponible = sucursales.reduce(
    (total, item) => total + Number(item.stock || 0),
    0
  );

  const sucursalesConStock = sucursales.filter(
    (item) => Number(item.stock || 0) > 0
  ).length;

  const obtenerEstado = (stock) => {
    const cantidad = Number(stock || 0);

    if (cantidad <= 0) {
      return {
        texto: 'Sin stock',
        clase: 'bg-red-100 text-red-700 border-red-200',
        icono: XCircle,
      };
    }

    if (cantidad <= 5) {
      return {
        texto: 'Stock bajo',
        clase: 'bg-amber-100 text-amber-700 border-amber-200',
        icono: AlertCircle,
      };
    }

    return {
      texto: 'Disponible',
      clase: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      icono: CheckCircle2,
    };
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="rounded-3xl bg-gradient-to-r from-sky-700 to-sky-500 text-white p-6 shadow-lg shadow-sky-900/20">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center">
                <Boxes size={26} />
              </div>

              <div>
                <h1 className="text-2xl font-bold">
                  Consulta de stock
                </h1>
                <p className="text-sky-100 text-sm">
                  Verifica existencias de productos en todas las sucursales.
                </p>
              </div>
            </div>
          </div>

          
        </div>
      </div>

      {/* Buscador */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-5">
        <form onSubmit={buscarStock} className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre o código de barras"
              className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            />
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="px-6 py-3 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-bold shadow-lg shadow-sky-900/20 transition disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {cargando ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Buscando...
              </>
            ) : (
              <>
                <Search size={20} />
                Buscar
              </>
            )}
          </button>

          {(producto || sucursales.length > 0 || mensaje) && (
            <button
              type="button"
              onClick={limpiarBusqueda}
              className="px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
            >
              Limpiar
            </button>
          )}
        </form>
      </div>

      {/* Mensaje */}
      {mensaje && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 text-amber-800 px-5 py-4 flex items-start gap-3">
          <AlertCircle size={22} className="mt-0.5" />
          <p className="font-medium">{mensaje}</p>
        </div>
      )}

      {/* Información del producto */}
      {producto && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1 bg-white rounded-3xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center">
                <Package size={23} />
              </div>

              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase">
                  Producto
                </p>
                <h2 className="font-bold text-slate-800">
                  {producto.nombre || producto.producto || 'Producto'}
                </h2>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-3 border-t border-slate-100 pt-3">
                <span className="text-slate-500">Código:</span>
                <span className="font-semibold text-slate-800 text-right">
                  {producto.codigo_barras || producto.codigo || 'N/A'}
                </span>
              </div>

              
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Boxes size={23} />
              </div>

              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase">
                  Total disponible
                </p>
                <p className="text-3xl font-black text-slate-800">
                  {totalDisponible}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center">
                <Store size={23} />
              </div>

              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase">
                  Sucursales con stock
                </p>
                <p className="text-3xl font-black text-slate-800">
                  {sucursalesConStock}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabla */}
      {sucursales.length > 0 && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-800">
                Existencias por sucursal
              </h3>
              <p className="text-sm text-slate-500">
                Consulta rápida para informar al cliente dónde hay producto disponible.
              </p>
            </div>
          </div>

          {/* Desktop */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-5 py-4 text-left font-bold">
                    Sucursal
                  </th>
                  <th className="px-5 py-4 text-left font-bold">
                    Dirección
                  </th>
                  <th className="px-5 py-4 text-center font-bold">
                    Stock
                  </th>
                  <th className="px-5 py-4 text-center font-bold">
                    Estado
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {sucursales.map((item, index) => {
                  const estado = obtenerEstado(item.stock);
                  const IconEstado = estado.icono;

                  return (
                    <tr key={item.id_sucursal || index} className="hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center">
                            <Store size={20} />
                          </div>

                          <div>
                            <p className="font-bold text-slate-800">
                              {item.sucursal || item.nombre_sucursal}
                            </p>
                            <p className="text-xs text-slate-500">
                              ID: {item.id_sucursal || 'N/A'}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {item.direccion || 'Sin dirección registrada'}
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span className="text-xl font-black text-slate-800">
                          {Number(item.stock || 0)}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold ${estado.clase}`}
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

          {/* Móvil */}
          <div className="lg:hidden p-4 space-y-3">
            {sucursales.map((item, index) => {
              const estado = obtenerEstado(item.stock);
              const IconEstado = estado.icono;

              return (
                <div
                  key={item.id_sucursal || index}
                  className="rounded-2xl border border-slate-200 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center">
                        <Store size={20} />
                      </div>

                      <div>
                        <p className="font-bold text-slate-800">
                          {item.sucursal || item.nombre_sucursal}
                        </p>
                        <p className="text-xs text-slate-500">
                          {item.direccion || 'Sin dirección registrada'}
                        </p>
                      </div>
                    </div>

                    <span className="text-2xl font-black text-slate-800">
                      {Number(item.stock || 0)}
                    </span>
                  </div>

                  <div className="mt-4">
                    <span
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold ${estado.clase}`}
                    >
                      <IconEstado size={16} />
                      {estado.texto}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Estado vacío inicial */}
      {!producto && sucursales.length === 0 && !mensaje && !cargando && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-10 text-center">
          <div className="w-16 h-16 rounded-3xl bg-sky-100 text-sky-700 flex items-center justify-center mx-auto mb-4">
            <Search size={32} />
          </div>

          <h3 className="text-lg font-bold text-slate-800">
            Busca un producto
          </h3>

          <p className="text-slate-500 mt-1 max-w-md mx-auto">
            Escribe el nombre o código de barras para consultar en qué sucursal hay stock disponible.
          </p>
        </div>
      )}
    </div>
  );
}