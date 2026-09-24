import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi, onNoAutenticado } from '../api/cliente.js';

const AuthContext = createContext(null);

// Provee la sesión actual (usuario, expiración) y las acciones de login/logout.
export function AuthProvider({ children }) {
  const [sesion, setSesion] = useState({ usuario: null, expiraEn: null, cargando: true });

  useEffect(() => {
    // Si la API responde 401 en cualquier momento (sesión revocada o expirada) se limpia el estado.
    onNoAutenticado(() => setSesion({ usuario: null, expiraEn: null, cargando: false }));
    authApi
      .me()
      .then(({ usuario, expiraEn }) => setSesion({ usuario, expiraEn, cargando: false }))
      .catch(() => setSesion({ usuario: null, expiraEn: null, cargando: false }));
  }, []);

  const login = useCallback(async (email, password) => {
    const { usuario, expiraEn } = await authApi.login(email, password);
    setSesion({ usuario, expiraEn, cargando: false });
    return usuario;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setSesion({ usuario: null, expiraEn: null, cargando: false });
    }
  }, []);

  const valor = useMemo(() => ({ ...sesion, login, logout }), [sesion, login, logout]);
  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
