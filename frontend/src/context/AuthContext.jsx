import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const DEFAULT_USERS = [
  { id: 'usr-admin', email: 'admin@pos.com', password: 'admin', nombre: 'Carlos Rodríguez', role: 'admin', avatar: '👨‍💼' },
  { id: 'usr-vendedor', email: 'vendedor@pos.com', password: '123', nombre: 'Laura Vendedora', role: 'vendedor', avatar: '👩‍💻' },
  { id: 'usr-almacen', email: 'almacen@pos.com', password: '123', nombre: 'Roberto Almacén', role: 'almacen', avatar: '👷' }
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('pos_user');
    return saved ? JSON.parse(saved) : DEFAULT_USERS[0]; // Admin por defecto para probar todo
  });

  const [token, setToken] = useState(() => localStorage.getItem('pos_jwt_token') || 'simulated-jwt-token-admin');

  useEffect(() => {
    if (user) {
      localStorage.setItem('pos_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('pos_user');
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('pos_jwt_token', token);
    } else {
      localStorage.removeItem('pos_jwt_token');
    }
  }, [token]);

  const login = async (email, password) => {
    try {
      // Intentar login con backend si está online
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setToken(data.token);
        return { success: true };
      }
    } catch (e) {
      console.log('⚠️ Backend no disponible. Usando autenticación offline local.');
    }

    // Fallback de login local sin conexión
    const localUser = DEFAULT_USERS.find(u => u.email === email && u.password === password);
    if (localUser) {
      setUser(localUser);
      setToken(`offline-jwt-${localUser.role}`);
      return { success: true };
    }

    return { success: false, error: 'Credenciales inválidas' };
  };

  const switchUserRole = (targetRole) => {
    const matched = DEFAULT_USERS.find(u => u.role === targetRole);
    if (matched) {
      setUser(matched);
      setToken(`offline-jwt-${matched.role}`);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('pos_user');
    localStorage.removeItem('pos_jwt_token');
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
    <AuthContext.Provider value={{ user, token, login, logout, switchUserRole, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
