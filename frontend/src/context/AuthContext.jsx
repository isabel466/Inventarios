import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const DEFAULT_USERS = [
  { id: '1', email: 'admin@pos.com', password: 'admin', nombre: 'Carlos Admin', role: 'admin' },
  { id: '2', email: 'vendedor@pos.com', password: '123', nombre: 'Laura Vendedora', role: 'vendedor' },
  { id: '3', email: 'almacen@pos.com', password: '123', nombre: 'Roberto Almacén', role: 'almacen' }
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('pos_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('pos_jwt_token') || null;
  });

  const [authChecked, setAuthChecked] = useState(false);

  // Validar token contra el servidor si existe sesión previa
  useEffect(() => {
    async function verifySession() {
      if (!token) {
        setAuthChecked(true);
        return;
      }
      try {
        const res = await fetch('/api/v1/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          localStorage.setItem('pos_user', JSON.stringify(data.user));
        } else if (res.status === 401 || res.status === 403) {
          // Si el token expiró, cerrar sesión
          logout();
        }
      } catch (e) {
        // Modo offline: se conserva la sesión local
        console.log('Validación de token en modo offline con credenciales en caché');
      } finally {
        setAuthChecked(true);
      }
    }

    verifySession();
  }, []);

  const login = async (email, password) => {
    try {
      // 1. Intentar autenticar contra el servidor backend (valida bcrypt y emite JWT)
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('pos_user', JSON.stringify(data.user));
        localStorage.setItem('pos_jwt_token', data.token);
        return { success: true };
      } else {
        const errData = await response.json().catch(() => ({}));
        return { success: false, error: errData.error || 'Credenciales inválidas' };
      }
    } catch (e) {
      console.warn('Backend inalcanzable. Intentando autenticación offline de contingencia.');
      // 2. Fallback de contingencia Offline
      const localUser = DEFAULT_USERS.find(u => u.email === email && u.password === password);
      if (localUser) {
        const offlineToken = `offline-jwt-${btoa(JSON.stringify(localUser))}`;
        setUser(localUser);
        setToken(offlineToken);
        localStorage.setItem('pos_user', JSON.stringify(localUser));
        localStorage.setItem('pos_jwt_token', offlineToken);
        return { success: true };
      }
      return { success: false, error: 'Credenciales inválidas o servidor no disponible' };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('pos_user');
    localStorage.removeItem('pos_jwt_token');
  };

  const switchUserRole = (targetRole) => {
    const matched = DEFAULT_USERS.find(u => u.role === targetRole);
    if (matched) {
      setUser(matched);
      localStorage.setItem('pos_user', JSON.stringify(matched));
    }
  };

  const hasPermission = (permission) => {
    if (!user) return false;
    if (user.role === 'admin') return true;

    switch (permission) {
      case 'pos_sales':
        return user.role === 'vendedor';
      case 'inventory_stock':
        return user.role === 'almacen';
      case 'product_view':
        return true;
      default:
        return false;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!user && !!token,
      authChecked,
      login,
      logout,
      switchUserRole,
      hasPermission
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
