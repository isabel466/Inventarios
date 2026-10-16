import React, { useState } from 'react';
import { useNetwork } from '../context/NetworkContext.jsx';
import { useAuth, DEFAULT_USERS } from '../context/AuthContext.jsx';
import { useProjectMode } from '../context/ProjectModeContext.jsx';
import { Wifi, WifiOff, RefreshCw, Bell, Shield, User, LogOut, CheckCircle2 } from 'lucide-react';

export default function Header() {
  const {
    isOnline,
    simulationMode,
    setSimulationMode,
    pendingSalesCount,
    isSyncing,
    triggerManualSync,
    notificationPermission,
    requestNotificationPermission
  } = useNetwork();

  const { user, switchUserRole, logout } = useAuth();
  const { isAvanceMode } = useProjectMode();
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  return (
    <header className="glass-panel" style={{ borderRadius: 0, borderTop: 0, borderLeft: 0, borderRight: 0, padding: '12px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        
        {/* LOGO & TITLE */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: isAvanceMode ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #06b6d4, #3b82f6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: '1.4rem',
            color: '#fff',
            boxShadow: isAvanceMode ? '0 0 15px rgba(245, 158, 11, 0.4)' : '0 0 15px rgba(6, 182, 212, 0.4)'
          }}>
            {isAvanceMode ? '📊' : '⚡'}
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, background: 'linear-gradient(90deg, #f8fafc, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              POS & Inventario{' '}
              {isAvanceMode ? (
                <span style={{ fontSize: '0.75rem', background: '#f59e0b', color: '#000', padding: '2px 8px', borderRadius: '10px', textTransform: 'uppercase', fontWeight: 800 }}>
                  Avance 50% (Hito 1)
                </span>
              ) : (
                <span style={{ fontSize: '0.75rem', background: '#06b6d4', color: '#000', padding: '2px 8px', borderRadius: '10px', textTransform: 'uppercase', fontWeight: 800 }}>
                  Versión Final 100%
                </span>
              )}
            </h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {isAvanceMode ? 'Hito 1: UI & Base de Datos Client-Side en IndexedDB (Dexie.js)' : 'Base de Datos: IndexedDB (Dexie) • Sincronización Automática Batch'}
            </p>
          </div>
        </div>

        {/* CONTROLES DE ESTADO DE RED & SIMULADOR */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          
          {/* SIMULADOR DE RED */}
          <div className="glass-card" style={{ padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', paddingLeft: '4px' }}>Simular Red:</span>
            <button
              className={`btn ${simulationMode === 'auto' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '3px 8px', fontSize: '0.75rem' }}
              onClick={() => setSimulationMode('auto')}
              title="Usar estado de red real del navegador"
            >
              Auto
            </button>
            <button
              className={`btn ${simulationMode === 'force_online' ? 'btn-success' : 'btn-secondary'}`}
              style={{ padding: '3px 8px', fontSize: '0.75rem' }}
              onClick={() => setSimulationMode('force_online')}
              title="Forzar estado Online"
            >
              <Wifi size={12} /> Online
            </button>
            <button
              className={`btn ${simulationMode === 'force_offline' ? 'btn-danger' : 'btn-secondary'}`}
              style={{ padding: '3px 8px', fontSize: '0.75rem' }}
              onClick={() => setSimulationMode('force_offline')}
              title="Forzar estado Offline (Probar transacciones sin conexión)"
            >
              <WifiOff size={12} /> Offline
            </button>
          </div>

          {/* BADGE NETWORK STATUS */}
          <div className={`badge ${isOnline ? 'badge-online' : 'badge-offline'}`}>
            <span className={`pulse-dot ${isOnline ? 'online' : 'offline'}`} />
            {isOnline ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Wifi size={14} /> ONLINE
              </span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <WifiOff size={14} /> OFFLINE
              </span>
            )}
          </div>

          {/* COLA DE VENTAS PENDIENTES LOCALES EN INDEXEDDB */}
          <div
            className="badge badge-warning"
            style={{ padding: '6px 12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Transacciones guardadas localmente en IndexedDB"
          >
            <RefreshCw size={14} />
            <span>Cola Local ({pendingSalesCount})</span>
          </div>

          {/* NOTIFICACIONES WEB */}
          {notificationPermission !== 'granted' && (
            <button
              className="btn btn-outline"
              style={{ padding: '6px 10px', fontSize: '0.8rem' }}
              onClick={requestNotificationPermission}
              title="Activar alertas nativas de stock bajo"
            >
              <Bell size={14} /> Activar Alertas
            </button>
          )}

          {/* USER ROLE SWITCHER DROPDOWN */}
          <div style={{ position: 'relative' }}>
            <button
              className="btn btn-secondary"
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              style={{ padding: '6px 12px', fontSize: '0.85rem', borderColor: 'var(--accent-cyan)' }}
            >
              <span>{user?.avatar || '👤'}</span>
              <span style={{ fontWeight: 600 }}>{user?.nombre || 'Usuario'}</span>
              <span className="badge badge-syncing" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>{user?.role}</span>
            </button>

            {showRoleMenu && (
              <div className="glass-panel" style={{
                position: 'absolute',
                right: 0,
                top: '110%',
                zIndex: 100,
                width: '240px',
                padding: '8px',
                boxShadow: 'var(--shadow-main)'
              }}>
                <div style={{ padding: '6px 10px', borderBottom: '1px solid var(--border-color)', marginBottom: '6px' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cambiar Rol (Modo Demo):</p>
                </div>
                {DEFAULT_USERS.map((u) => (
                  <button
                    key={u.id}
                    className="btn btn-secondary"
                    style={{
                      width: '100%',
                      justifyContent: 'flex-start',
                      marginBottom: '4px',
                      padding: '8px 10px',
                      fontSize: '0.85rem',
                      backgroundColor: user?.role === u.role ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                      border: user?.role === u.role ? '1px solid var(--accent-cyan)' : 'none'
                    }}
                    onClick={() => {
                      switchUserRole(u.role);
                      setShowRoleMenu(false);
                    }}
                  >
                    <span>{u.avatar}</span>
                    <div style={{ textAlign: 'left', flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{u.nombre}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Rol: {u.role}</div>
                    </div>
                    {user?.role === u.role && <CheckCircle2 size={14} color="var(--accent-cyan)" />}
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
}
