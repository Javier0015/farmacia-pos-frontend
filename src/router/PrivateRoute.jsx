import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PrivateRoute({ children }) {
  const { autenticado, cargando } = useAuth();

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-slate-600 text-lg font-semibold">
          Cargando sistema...
        </div>
      </div>
    );
  }

  if (!autenticado) {
    return <Navigate to="/" replace />;
  }

  return children;
}