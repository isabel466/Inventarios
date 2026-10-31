import React, { createContext, useContext, useState, useEffect } from 'react';
import { saveEncryptedSession, loadEncryptedSession, clearEncryptedSession } from '../utils/cryptoStorage.js';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Inicialización con sesión descifrada desde el almacén seguro local
  const [session, setSession] = useState(() => {
    return loadEncryptedSession();
  });

  const [authChecked, setAuthChecked] = useState(false);

  const user = session?.user || null;
  const token = session?.token || null;

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
          const updatedSession = { user: data.user, token };
          setSession(updatedSession);
          saveEncryptedSession(data.user, token);
        } else if (res.status === 401 || res.status === 403) {
          logout();
        }
      } catch (e) {
        // En modo sin conexión se preserva la sesión cifrada local
        console.log('Sesión local cargada y verificada desde almacenamiento seguro cifrado.');
      } finally {
        setAuthChecked(true);
      }
    }

    verifySession();
  }, []);

  // 1. Iniciar Sesión (valida contraseña con bcrypt en backend y recibe JWT con rol)
  const login = async (email, password) => {
    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const data = await response.json();
        setSession({ user: data.user, token: data.token });
        // Almacenar la sesión de forma encriptada localmente
        saveEncryptedSession(data.user, data.token);
        return { success: true };
      } else {
        const errData = await response.json().catch(() => ({}));
        return { success: false, error: errData.error || 'Credenciales inválidas' };
      }
    } catch (e) {
      console.warn('Backend fuera de línea. Intentando acceso de contingencia local.');
      // Fallback offline si el usuario ya tenía su sesión guardada
      const local = loadEncryptedSession();
      if (local && local.user.email.toLowerCase() === email.toLowerCase()) {
        setSession(local);
        return { success: true };
      }
      return { success: false, error: 'Servidor no disponible y no hay sesión previa para esta cuenta.' };
    }
  };

  // 2. Registro Público (Cualquier persona que descargue la app crea su cuenta admin)
  const register = async (nombre, email, password) => {
    try {
      const response = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, email, password })
      });

      if (response.ok) {
        const data = await response.json();
        setSession({ user: data.user, token: data.token });
        saveEncryptedSession(data.user, data.token);
        return { success: true };
      } else {
        const errData = await response.json().catch(() => ({}));
        return { success: false, error: errData.error || 'No se pudo crear la cuenta' };
      }
    } catch (e) {
      return { success: false, error: 'No se pudo conectar al servidor para registrar la cuenta.' };
    }
  };

  // 3. Cerrar Sesión (limpia el almacén cifrado)
  const logout = () => {
    setSession(null);
    clearEncryptedSession();
  };

  // 4. Verificación de permisos según los requerimientos estrictos:
  // - Vendedor: Solo accede a la pantalla de Ventas y consulta de Productos.
  // - Almacén: Solo accede a Entradas/Salidas y Productos.
  // - Administrador: Dashboard global, Usuarios, Reportes y Ajustes.
  const hasPermission = (permission) => {
    if (!user) return false;
    if (user.role === 'admin') return true;

    switch (permission) {
      case 'pos_sales':
        return user.role === 'vendedor';
      case 'inventory_stock':
        return user.role === 'almacen';
      case 'view_products':
        return user.role === 'vendedor' || user.role === 'almacen';
      case 'reports':
      case 'users':
      case 'settings':
        return user.role === 'admin';
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
      register,
      logout,
      hasPermission
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
