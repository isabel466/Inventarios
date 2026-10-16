import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { NetworkProvider } from './context/NetworkContext.jsx';
import { ProjectModeProvider, useProjectMode } from './context/ProjectModeContext.jsx';
import { seedInitialDataIfNeeded } from './db/db.js';

import Header from './components/Header.jsx';
import Navigation from './components/Navigation.jsx';
import POSTerminal from './components/POS/POSTerminal.jsx';
import InventoryManager from './components/Inventory/InventoryManager.jsx';
import AnalyticsDashboard from './components/Dashboard/AnalyticsDashboard.jsx';
import SyncMonitor from './components/Sync/SyncMonitor.jsx';
import MilestoneProgressView from './components/Milestone/MilestoneProgressView.jsx';

function MainApp() {
  const [activeTab, setActiveTab] = useState('pos');
  const { user } = useAuth();
  const { isAvanceMode } = useProjectMode();

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

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)' }}>
      <Header />
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

      <main style={{ flex: 1, maxWidth: '1440px', width: '100%', margin: '0 auto' }}>
        {activeTab === 'pos' && <POSTerminal />}
        {activeTab === 'inventory' && <InventoryManager />}
        {activeTab === 'analytics' && (
          isAvanceMode ? (
            <MilestoneProgressView moduleName="Dashboard de Analíticas & Métricas Centralizadas" />
          ) : (
            <AnalyticsDashboard />
          )
        )}
        {activeTab === 'sync' && (
          isAvanceMode ? (
            <MilestoneProgressView moduleName="Motor de Sincronización Batch con API REST" />
          ) : (
            <SyncMonitor />
          )
        )}
      </main>

      <footer style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)', fontSize: '0.8rem', borderTop: '1px solid var(--border-color)', marginTop: '20px' }}>
        {isAvanceMode ? (
          <span>📋 Avance de Proyecto (50% Hito 1): Frontend PWA & Persistencia Local con IndexedDB</span>
        ) : (
          <span>⚡ Sistema POS & Inventario Offline-First PWA • IndexedDB (Dexie) • @vite-pwa/plugin</span>
        )}
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ProjectModeProvider>
      <AuthProvider>
        <NetworkProvider>
          <MainApp />
        </NetworkProvider>
      </AuthProvider>
    </ProjectModeProvider>
  );
}

