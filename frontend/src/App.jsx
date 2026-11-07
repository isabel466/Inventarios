import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { NetworkProvider } from './context/NetworkContext.jsx';
import { seedInitialDataIfNeeded } from './db/db.js';

import Header from './components/Header.jsx';
import Navigation from './components/Navigation.jsx';
import POSTerminal from './components/POS/POSTerminal.jsx';
import InventoryManager from './components/Inventory/InventoryManager.jsx';
import AnalyticsDashboard from './components/Dashboard/AnalyticsDashboard.jsx';
import SyncMonitor from './components/Sync/SyncMonitor.jsx';
import UserManager from './components/Users/UserManager.jsx';
import Login from './components/Auth/Login.jsx';

function MainApp() {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState(() => {
    return user?.role === 'almacen' ? 'inventory' : 'pos';
  });

  useEffect(() => {
    seedInitialDataIfNeeded().catch(err => console.error("Error sembrando datos iniciales:", err));
  }, []);

  // Restricción estricta de vistas según el rol del usuario autenticado:
  // - Vendedor: Solo accede a la pantalla de Ventas y consulta de Productos.
  // - Almacén: Solo accede a Entradas/Salidas y Productos.
  // - Administrador: Dashboard global, Usuarios, Reportes y Ajustes.
  useEffect(() => {
    if (!user) return;
    if (user.role === 'vendedor' && activeTab !== 'pos') {
      setActiveTab('pos');
    } else if (user.role === 'almacen' && activeTab !== 'inventory') {
      setActiveTab('inventory');
    }
  }, [user, activeTab]);

  // Si no está autenticado, mostrar la pantalla formal de Login / Registro
  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)' }}>
      <Header />
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

      <main style={{ flex: 1, maxWidth: '1440px', width: '100%', margin: '0 auto' }}>
        {/* Vistas protegidas por rol */}
        {activeTab === 'pos' && (user.role === 'vendedor' || user.role === 'admin') && <POSTerminal />}
        {activeTab === 'inventory' && (user.role === 'almacen' || user.role === 'admin') && <InventoryManager />}
        {activeTab === 'analytics' && user.role === 'admin' && <AnalyticsDashboard />}
        {activeTab === 'users' && user.role === 'admin' && <UserManager />}
        {activeTab === 'sync' && user.role === 'admin' && <SyncMonitor />}
      </main>

      <footer style={{
        textAlign: 'center',
        padding: '16px 24px',
        color: 'var(--text-muted)',
        fontSize: '0.78rem',
        borderTop: '1px solid var(--border-color)',
        backgroundColor: '#ffffff',
        marginTop: '24px'
      }}>
        <span>POS & Inventario Empresarial • Todos los derechos reservados</span>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NetworkProvider>
        <MainApp />
      </NetworkProvider>
    </AuthProvider>
  );
}
