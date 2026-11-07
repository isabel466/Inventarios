import React, { useState } from 'react';
import { useNetwork } from '../context/NetworkContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import {
  Store,
  RefreshCw,
  Bell,
  ChevronDown,
  LogOut
} from 'lucide-react';

export default function Header() {
  const {
    isOnline,
    pendingSalesCount,
    isSyncing,
    triggerManualSync,
    notificationPermission,
    requestNotificationPermission
  } = useNetwork();

  const { user, logout } = useAuth();
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  // Iniciales corporativas para el avatar
  const userInitials = user?.nombre
    ? user.nombre.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : 'US';

  const roleLabels = {
    admin: 'Administrador (Total)',
    vendedor: 'Vendedor (Cajero)',
    almacen: 'Almacén (Stock)'
  };

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
            <h1 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
              Inventario & POS
            </h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Punto de Venta y Gestión de Inventario
            </p>
          </div>
        </div>

        {/* ACTIONS & PROFILE */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>

          {/* BOTÓN DE SINCRONIZACIÓN DISCRETO */}
          {pendingSalesCount > 0 && user?.role === 'admin' && (
            <button
              className="btn btn-primary"
              onClick={triggerManualSync}
              disabled={isSyncing || !isOnline}
              style={{ fontSize: '0.8125rem', padding: '6px 12px' }}
              title="Sincronizar transacciones pendientes"
            >
              <RefreshCw size={13} className={isSyncing ? 'spin-anim' : ''} />
              <span>Sincronizar ({pendingSalesCount})</span>
            </button>
          )}

          {/* NOTIFICACIONES WEB */}
          {notificationPermission !== 'granted' && (
            <button
              className="btn btn-outline"
              style={{ fontSize: '0.8rem', padding: '6px 10px' }}
              onClick={requestNotificationPermission}
              title="Habilitar alertas de stock bajo"
            >
              <Bell size={13} />
              <span>Alertas</span>
            </button>
          )}

          {/* PERFIL DE USUARIO Y CIERRE DE SESIÓN */}
          <div style={{ position: 'relative' }}>
            <button
              className="btn btn-secondary"
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              style={{ fontSize: '0.8125rem', padding: '5px 12px', gap: '8px' }}
            >
              <div style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                backgroundColor: user?.role === 'admin' ? 'var(--accent-primary)' :
                                 user?.role === 'vendedor' ? '#d97706' : '#059669',
                color: '#ffffff',
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
                width: '260px',
                padding: '12px',
                boxShadow: 'var(--shadow-lg)'
              }}>
                <div style={{ paddingBottom: '10px', borderBottom: '1px solid var(--border-color)', marginBottom: '10px' }}>
                  <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {user?.nombre}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {user?.email}
                  </p>
                  <div style={{ marginTop: '6px' }}>
                    <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                      {roleLabels[user?.role] || user?.role}
                    </span>
                  </div>
                </div>

                <button
                  className="btn"
                  style={{
                    width: '100%',
                    justifyContent: 'flex-start',
                    padding: '8px 10px',
                    color: 'var(--accent-rose)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8125rem',
                    gap: '8px',
                    border: '1px solid var(--accent-rose-border)',
                    backgroundColor: 'var(--accent-rose-subtle)'
                  }}
                  onClick={() => {
                    setShowRoleMenu(false);
                    logout();
                  }}
                >
                  <LogOut size={15} />
                  <span style={{ fontWeight: 600 }}>Cerrar Sesión</span>
                </button>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
}
