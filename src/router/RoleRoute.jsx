import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tienePermiso } from '../config/permisos';

export default function RoleRoute({ modulo, children }) {
  const { usuario } = useAuth();

  if (!usuario) {
    return <Navigate to="/" replace />;
  }

  const rol = usuario?.rol;

  if (!tienePermiso(rol, modulo)) {
    return <Navigate to="/app/no-autorizado" replace />;
  }

  return children;
}