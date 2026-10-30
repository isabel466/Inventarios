import React, { useState } from 'react';
import { useNetwork } from '../context/NetworkContext.jsx';
import { useAuth, DEFAULT_USERS } from '../context/AuthContext.jsx';
import {
  Store,
  Wifi,
  WifiOff,
  RefreshCw,
  Bell,
  CheckCircle2,
  ChevronDown,
  SlidersHorizontal
} from 'lucide-react';

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

  const { user, switchUserRole } = useAuth();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNetworkSettings, setShowNetworkSettings] = useState(false);

  // Initial letter for corporate avatar
  const userInitials = user?.nombre
    ? user.nombre.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : 'US';

  return (
    <header style={{
      backgroundColor: '#ffffff',
      borderBottom: '1px solid var(--border-color)',
      padding: '12px 24px',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      boxShadow: 'var(--shadow-xs)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        
        {/* LOGO & BRAND IDENTITY */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--accent-primary)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-xs)'
          }}>
            <Store size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
                Inventario & POS
              </h1>
              <span className="badge badge-neutral" style={{ fontSize: '0.7rem', fontWeight: 600 }}>
                Enterprise Offline-First
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Almacenamiento Local IndexedDB • Sincronización en Red
            </p>
          </div>
        </div>

        {/* ACTIONS & NETWORK STATUS */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          
          {/* SIMULADOR DE RED DISCRETO */}
          <div style={{ position: 'relative' }}>
            <button
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', padding: '6px 10px', color: 'var(--text-muted)' }}
              onClick={() => setShowNetworkSettings(!showNetworkSettings)}
              title="Ajustes de simulación de red"
            >
              <SlidersHorizontal size={14} />
              <span>Red: {simulationMode === 'auto' ? 'Automática' : simulationMode === 'force_online' ? 'Online (Forzado)' : 'Offline (Simulado)'}</span>
              <ChevronDown size={12} />
            </button>

            {showNetworkSettings && (
              <div className="corporate-panel" style={{
                position: 'absolute',
                right: 0,
                top: '115%',
                zIndex: 50,
                width: '230px',
                padding: '8px',
                boxShadow: 'var(--shadow-lg)'
              }}>
                <div style={{ padding: '6px 8px', borderBottom: '1px solid var(--border-color)', marginBottom: '6px' }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main)' }}>Simulador de Conectividad</p>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Para evaluar comportamiento offline</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <button
                    className={`btn ${simulationMode === 'auto' ? 'btn-primary' : 'btn-outline'}`}
                    style={{ fontSize: '0.75rem', justifyContent: 'flex-start', padding: '6px 8px' }}
                    onClick={() => { setSimulationMode('auto'); setShowNetworkSettings(false); }}
                  >
                    ● Automático (Estado real del navegador)
                  </button>
                  <button
                    className={`btn ${simulationMode === 'force_online' ? 'btn-primary' : 'btn-outline'}`}
                    style={{ fontSize: '0.75rem', justifyContent: 'flex-start', padding: '6px 8px' }}
                    onClick={() => { setSimulationMode('force_online'); setShowNetworkSettings(false); }}
                  >
                    <Wifi size={13} color="var(--accent-emerald)" /> Forzar Online
                  </button>
                  <button
                    className={`btn ${simulationMode === 'force_offline' ? 'btn-primary' : 'btn-outline'}`}
                    style={{ fontSize: '0.75rem', justifyContent: 'flex-start', padding: '6px 8px' }}
                    onClick={() => { setSimulationMode('force_offline'); setShowNetworkSettings(false); }}
                  >
                    <WifiOff size={13} color="var(--accent-rose)" /> Forzar Offline (Sin internet)
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* BADGE NETWORK STATUS */}
          <div className={`badge ${isOnline ? 'badge-online' : 'badge-offline'}`}>
            <span className={`pulse-dot ${isOnline ? 'online' : 'offline'}`} />
            {isOnline ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Wifi size={13} /> Conectado
              </span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <WifiOff size={13} /> Sin Conexión
              </span>
            )}
          </div>

          {/* COLA LOCAL & BOTÓN DE SINCRONIZACIÓN */}
          <button
            className={`btn ${pendingSalesCount > 0 ? 'btn-primary' : 'btn-secondary'}`}
            onClick={triggerManualSync}
            disabled={isSyncing || !isOnline}
            style={{ fontSize: '0.8125rem', padding: '6px 12px' }}
            title={pendingSalesCount > 0 ? "Enviar transacciones pendientes al servidor central" : "No hay transacciones pendientes"}
          >
            <RefreshCw size={13} className={isSyncing ? 'spin-anim' : ''} />
            <span>Sincronizar {pendingSalesCount > 0 && `(${pendingSalesCount})`}</span>
          </button>

          {/* NOTIFICACIONES WEB */}
          {notificationPermission !== 'granted' && (
            <button
              className="btn btn-outline"
              style={{ fontSize: '0.8rem', padding: '6px 10px' }}
              onClick={requestNotificationPermission}
              title="Habilitar alertas nativas de stock bajo"
            >
              <Bell size={13} />
              <span>Alertas</span>
            </button>
          )}

          {/* USER ROLE SWITCHER DROPDOWN */}
          <div style={{ position: 'relative' }}>
            <button
              className="btn btn-secondary"
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              style={{ fontSize: '0.8125rem', padding: '5px 10px', gap: '8px' }}
            >
              <div style={{
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent-blue-subtle)',
                color: 'var(--accent-blue)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.6875rem',
                fontWeight: 700
              }}>
                {userInitials}
              </div>
              <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                <span style={{ fontWeight: 600, color: 'var(--text-main)', display: 'block' }}>
                  {user?.nombre || 'Usuario'}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                  {user?.role || 'admin'}
                </span>
              </div>
              <ChevronDown size={12} color="var(--text-muted)" />
            </button>

            {showRoleMenu && (
              <div className="corporate-panel" style={{
                position: 'absolute',
                right: 0,
                top: '115%',
                zIndex: 50,
                width: '240px',
                padding: '8px',
                boxShadow: 'var(--shadow-lg)'
              }}>
                <div style={{ padding: '6px 10px', borderBottom: '1px solid var(--border-color)', marginBottom: '6px' }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main)' }}>Perfil y Roles</p>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Cambiar cuenta activa</p>
                </div>
                {DEFAULT_USERS.map((u) => {
                  const initials = u.nombre.split(' ').map(n => n[0]).slice(0, 2).join('');
                  const isSelected = user?.role === u.role;
                  return (
                    <button
                      key={u.id}
                      className="btn"
                      style={{
                        width: '100%',
                        justifyContent: 'flex-start',
                        marginBottom: '4px',
                        padding: '8px 10px',
                        backgroundColor: isSelected ? 'var(--bg-subtle)' : 'transparent',
                        border: isSelected ? '1px solid var(--border-color)' : '1px solid transparent',
                        borderRadius: 'var(--radius-sm)'
                      }}
                      onClick={() => {
                        switchUserRole(u.role);
                        setShowRoleMenu(false);
                      }}
                    >
                      <div style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        backgroundColor: isSelected ? 'var(--accent-primary)' : 'var(--border-color)',
                        color: isSelected ? '#ffffff' : 'var(--text-body)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 600
                      }}>
                        {initials}
                      </div>
                      <div style={{ textAlign: 'left', flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-main)' }}>{u.nombre}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>Rol: {u.role}</div>
                      </div>
                      {isSelected && <CheckCircle2 size={14} color="var(--accent-emerald)" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
}
