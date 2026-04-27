import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [cargando, setCargando] = useState(true);

  const login = async (usuarioLogin, password) => {
    const { data } = await api.post('/auth/login', {
      usuario: usuarioLogin,
      password,
    });

    if (data.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('usuario', JSON.stringify(data.usuario));

      setToken(data.token);
      setUsuario(data.usuario);
    }

    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');

    setToken(null);
    setUsuario(null);
  };

  useEffect(() => {
    const usuarioGuardado = localStorage.getItem('usuario');
    const tokenGuardado = localStorage.getItem('token');

    if (usuarioGuardado && tokenGuardado) {
      setUsuario(JSON.parse(usuarioGuardado));
      setToken(tokenGuardado);
    }

    setCargando(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        usuario,
        token,
        cargando,
        login,
        logout,
        autenticado: Boolean(token),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}