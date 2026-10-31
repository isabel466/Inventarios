import React from 'react';
import { ShoppingCart, Package, BarChart3, CloudSync, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navigation({ activeTab, setActiveTab }) {
  const { user } = useAuth();

  const tabs = [
    {
      id: 'pos',
      label: 'Terminal POS',
      shortLabel: 'POS',
      icon: ShoppingCart,
      roles: ['vendedor', 'admin']
    },
    {
      id: 'inventory',
      label: 'Inventario y Existencias',
      shortLabel: 'Stock',
      icon: Package,
      roles: ['almacen', 'admin']
    },
    {
      id: 'sync',
      label: 'Sincronización Cloud',
      shortLabel: 'Sync',
      icon: CloudSync,
      roles: ['admin', 'vendedor', 'almacen']
    },
    {
      id: 'analytics',
      label: 'Reportes y Analíticas',
      shortLabel: 'Reportes',
      icon: BarChart3,
      roles: ['admin']
    }
  ];

  return (
    <>
      {/* 1. NAVEGACIÓN SUPERIOR PARA ESCRITORIO Y TABLET GRANDE */}
      <nav
        className="desktop-nav"
        style={{
          backgroundColor: '#ffffff',
          borderBottom: '1px solid var(--border-color)',
          padding: '0 24px',
          display: 'flex',
          gap: '4px',
          overflowX: 'auto'
        }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isAllowed = tab.roles.includes(user?.role || 'admin');
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              disabled={!isAllowed}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 16px',
                fontSize: '0.875rem',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? 'var(--text-main)' : 'var(--text-muted)',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: isActive ? '2px solid var(--accent-primary)' : '2px solid transparent',
                cursor: isAllowed ? 'pointer' : 'not-allowed',
                opacity: isAllowed ? 1 : 0.45,
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap'
              }}
              title={!isAllowed ? `Requiere rol: ${tab.roles.join(' o ')}` : tab.label}
            >
              <Icon size={17} color={isActive ? 'var(--text-main)' : 'var(--text-dim)'} />
              <span>{tab.label}</span>
              {!isAllowed && <ShieldAlert size={14} color="var(--accent-rose)" />}
            </button>
          );
        })}
      </nav>

      {/* 2. BARRA DE NAVEGACIÓN INFERIOR (BOTTOM BAR) PARA MÓVILES (PLAY STORE / APP STORE) */}
      <div className="mobile-bottom-nav">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isAllowed = tab.roles.includes(user?.role || 'admin');
          const isActive = activeTab === tab.id;

          return (
            <button
              key={`mobile-${tab.id}`}
              className={`mobile-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => isAllowed && setActiveTab(tab.id)}
              disabled={!isAllowed}
            >
              <Icon size={20} />
              <span>{tab.shortLabel}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}
