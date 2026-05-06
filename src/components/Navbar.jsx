import { useEffect, useRef, useState } from 'react';
import { LogOut, Store, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function Navbar() {
  const { usuario, logout } = useAuth();

  const [totalAlertas, setTotalAlertas] = useState(0);
  const [alertas, setAlertas] = useState([]);
  const [mostrarAlertas, setMostrarAlertas] = useState(false);

  const contenedorAlertasRef = useRef(null);

  const sucursalPrincipal = usuario?.sucursales?.[0];

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  const cargarTotalAlertas = async () => {
    try {
      const { data } = await api.get('/alertas/no-leidas');

      if (data.ok) {
        setTotalAlertas(data.total || 0);
      }
    } catch (error) {
      console.error('Error al cargar total de alertas:', error);
    }
  };

  const cargarMisAlertas = async () => {
    try {
      const { data } = await api.get('/alertas/mis-alertas');

      if (data.ok) {
        setAlertas(data.alertas || []);
      }
    } catch (error) {
      console.error('Error al cargar alertas:', error);
    }
  };

  const abrirAlertas = async () => {
    const nuevoEstado = !mostrarAlertas;
    setMostrarAlertas(nuevoEstado);

    if (nuevoEstado) {
      await cargarMisAlertas();
      await cargarTotalAlertas();
    }
  };

  const marcarComoLeida = async (idAlerta) => {
    try {
      await api.put(`/alertas/${idAlerta}/leer`);

      setAlertas((prev) =>
        prev.map((alerta) =>
          alerta.id_alerta === idAlerta
            ? { ...alerta, leida: true }
            : alerta
        )
      );

      await cargarTotalAlertas();
    } catch (error) {
      console.error('Error al marcar alerta como leída:', error);
    }
  };

  const clasePrioridad = (prioridad) => {
    switch (prioridad) {
      case 'URGENTE':
        return 'bg-red-50 text-red-700 border-red-100';
      case 'IMPORTANTE':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      default:
        return 'bg-sky-50 text-sky-700 border-sky-100';
    }
  };

  useEffect(() => {
    if (usuario) {
      cargarTotalAlertas();

      const intervalo = setInterval(() => {
        cargarTotalAlertas();
      }, 30000);

      return () => clearInterval(intervalo);
    }
  }, [usuario]);

  useEffect(() => {
    const cerrarAlDarClickAfuera = (event) => {
      if (
        contenedorAlertasRef.current &&
        !contenedorAlertasRef.current.contains(event.target)
      ) {
        setMostrarAlertas(false);
      }
    };

    document.addEventListener('mousedown', cerrarAlDarClickAfuera);

    return () => {
      document.removeEventListener('mousedown', cerrarAlDarClickAfuera);
    };
  }, []);

  return (
    <header className="min-h-16 sm:min-h-20 bg-white border-b border-slate-200 px-3 sm:px-4 lg:px-6 py-3 flex items-center justify-between gap-3 relative z-30">
      <div className="min-w-0 flex-1">
        <h2 className="text-base sm:text-xl font-bold text-slate-800 truncate">
          Panel administrativo
        </h2>

        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 mt-1 min-w-0">
          <Store size={16} className="shrink-0" />
          <span className="truncate">
            {sucursalPrincipal
              ? `${sucursalPrincipal.nombre} (${sucursalPrincipal.clave})`
              : 'Sin sucursal asignada'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 relative shrink-0">
        <div className="relative" ref={contenedorAlertasRef}>
          <button
            type="button"
            onClick={abrirAlertas}
            className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-slate-100 hover:bg-sky-50 hover:text-sky-700 flex items-center justify-center transition"
            title="Alertas"
          >
            <Bell size={20} />

            {totalAlertas > 0 && (
              <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-amber-400 text-slate-900 text-[11px] font-black flex items-center justify-center border-2 border-white">
                {totalAlertas > 99 ? '99+' : totalAlertas}
              </span>
            )}
          </button>

          {mostrarAlertas && (
            <div
              className="
                fixed sm:absolute
                left-3 right-3 sm:left-auto sm:right-0
                top-[4.75rem] sm:top-14
                sm:w-96
                max-w-none sm:max-w-[calc(100vw-2rem)]
                bg-white rounded-2xl sm:rounded-3xl
                shadow-2xl border border-slate-100
                z-50 overflow-hidden
              "
            >
              <div className="px-4 sm:px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-800">
                    Alertas
                  </h3>
                  <p className="text-xs text-slate-500">
                    Notificaciones recientes del sistema
                  </p>
                </div>

                {totalAlertas > 0 && (
                  <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold shrink-0">
                    {totalAlertas} nuevas
                  </span>
                )}
              </div>

              <div className="max-h-[65vh] sm:max-h-96 overflow-y-auto overscroll-contain">
                {alertas.length === 0 ? (
                  <div className="p-6 text-center text-slate-500">
                    No tienes alertas.
                  </div>
                ) : (
                  alertas.map((alerta) => (
                    <button
                      key={alerta.id_alerta}
                      type="button"
                      onClick={() => marcarComoLeida(alerta.id_alerta)}
                      className={`w-full text-left px-4 sm:px-5 py-4 border-b border-slate-100 hover:bg-slate-50 transition ${
                        !alerta.leida ? 'bg-sky-50/40' : 'bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 break-words">
                            {alerta.titulo}
                          </p>
                          <p className="text-sm text-slate-600 mt-1 line-clamp-2 break-words">
                            {alerta.mensaje}
                          </p>
                        </div>

                        {!alerta.leida && (
                          <span className="w-2.5 h-2.5 rounded-full bg-sky-600 mt-2 shrink-0" />
                        )}
                      </div>

                      <div className="mt-3 flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2">
                        <span
                          className={`w-fit text-[11px] font-bold px-2.5 py-1 rounded-full border ${clasePrioridad(
                            alerta.prioridad
                          )}`}
                        >
                          {alerta.prioridad}
                        </span>

                        <span className="text-[11px] text-slate-400">
                          {new Date(alerta.fecha_creacion).toLocaleString('es-MX', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="text-right hidden md:block max-w-[180px]">
          <p className="font-semibold text-slate-800 truncate">
            {usuario?.nombre}
          </p>
          <p className="text-sm text-slate-500 truncate">
            {usuario?.rol}
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-slate-100 hover:bg-red-50 hover:text-red-600 flex items-center justify-center transition"
          title="Cerrar sesión"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
}