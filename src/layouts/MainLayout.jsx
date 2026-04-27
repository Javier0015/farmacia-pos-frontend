import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';

export default function MainLayout() {
  const navigate = useNavigate();
  const auth = useAuth();
  const { usuario } = auth;

  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);

  const cerrarSesion = () => {
    if (typeof auth.logout === 'function') {
      auth.logout();
    } else if (typeof auth.cerrarSesion === 'function') {
      auth.cerrarSesion();
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      localStorage.removeItem('farmacia_usuario');
      localStorage.removeItem('farmacia_token');
    }

    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Sidebar escritorio */}
      <Sidebar />

      {/* Sidebar móvil */}
      {menuMovilAbierto && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setMenuMovilAbierto(false)}
          />

          <div className="absolute left-0 top-0 h-full w-72 bg-slate-950 shadow-2xl">
            <div className="flex items-center justify-end p-4 border-b border-white/10">
              <button
                onClick={() => setMenuMovilAbierto(false)}
                className="w-10 h-10 rounded-2xl bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition"
              >
                <X size={22} />
              </button>
            </div>

            <Sidebar
              modoMovil
              onNavigate={() => setMenuMovilAbierto(false)}
            />
          </div>
        </div>
      )}

      <div className="flex-1 min-w-0">
        {/* Header móvil */}
        <header className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-40">
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => setMenuMovilAbierto(true)}
              className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center"
            >
              <Menu size={22} />
            </button>

            <div className="flex-1 text-right">
              <p className="text-sm font-bold text-slate-800">
                Shaddai POS
              </p>
              <p className="text-xs text-slate-500">
                {usuario?.nombre || usuario?.usuario || 'Farmacia multi-sucursal'}
              </p>
            </div>

            <button
              onClick={cerrarSesion}
              className="w-11 h-11 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-600 hover:text-white transition"
              title="Cerrar sesión"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        {/* Header escritorio */}
        <header className="hidden lg:flex bg-white border-b border-slate-200 px-8 py-4 items-center justify-between sticky top-0 z-30">
          <div>
            <p className="text-sm text-slate-500">
              Sesión activa
            </p>
            <h2 className="text-lg font-bold text-slate-800">
              {usuario?.nombre || usuario?.usuario || 'Usuario'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-bold text-slate-800">
                {usuario?.rol || 'Sin rol'}
              </p>
              <p className="text-xs text-slate-500">
                Shaddai POS
              </p>
            </div>

            <button
              onClick={cerrarSesion}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition font-bold text-sm"
            >
              <LogOut size={18} />
              
            </button>
          </div>
        </header>

        <main className="p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}