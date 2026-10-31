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
import Login from './components/Auth/Login.jsx';

function MainApp() {
  const [activeTab, setActiveTab] = useState('pos');
  const { user, isAuthenticated, authChecked } = useAuth();

  useEffect(() => {
    seedInitialDataIfNeeded().catch(err => console.error("Error sembrando datos iniciales:", err));
  }, []);

  // Ajustar tab si el rol actual no tiene permiso
  useEffect(() => {
    if (user?.role === 'vendedor' && (activeTab === 'inventory' || activeTab === 'analytics')) {
      setActiveTab('pos');
    } else if (user?.role === 'almacen' && (activeTab === 'pos' || activeTab === 'analytics')) {
      setActiveTab('inventory');
    }
  }, [user, activeTab]);

  // Si no está autenticado, mostrar la pantalla formal de Login
  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)' }}>
      <Header />
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

      <main style={{ flex: 1, maxWidth: '1440px', width: '100%', margin: '0 auto' }}>
        {activeTab === 'pos' && <POSTerminal />}
        {activeTab === 'inventory' && <InventoryManager />}
        {activeTab === 'analytics' && <AnalyticsDashboard />}
        {activeTab === 'sync' && <SyncMonitor />}
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
        <span>POS & Inventario Empresarial • Base de Datos Relacional y PWA Offline-First</span>
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
