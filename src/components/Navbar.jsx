import { LogOut, Store } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { usuario, logout } = useAuth();

  const sucursalPrincipal = usuario?.sucursales?.[0];

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">
          Panel administrativo
        </h2>

        <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
          <Store size={16} />
          <span>
            {sucursalPrincipal
              ? `${sucursalPrincipal.nombre} (${sucursalPrincipal.clave})`
              : 'Sin sucursal asignada'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="font-semibold text-slate-800">
            {usuario?.nombre}
          </p>
          <p className="text-sm text-slate-500">
            {usuario?.rol}
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="w-11 h-11 rounded-2xl bg-slate-100 hover:bg-red-50 hover:text-red-600 flex items-center justify-center transition"
          title="Cerrar sesión"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
}