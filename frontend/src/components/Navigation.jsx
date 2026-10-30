import React from 'react';
import { ShoppingCart, Package, BarChart3, CloudSync, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navigation({ activeTab, setActiveTab }) {
  const { user } = useAuth();

  const tabs = [
    {
      id: 'pos',
      label: 'Terminal POS',
      icon: ShoppingCart,
      roles: ['vendedor', 'admin']
    },
    {
      id: 'inventory',
      label: 'Inventario y Existencias',
      icon: Package,
      roles: ['almacen', 'admin']
    },
    {
      id: 'sync',
      label: 'Sincronización Cloud',
      icon: CloudSync,
      roles: ['admin', 'vendedor', 'almacen']
    },
    {
      id: 'analytics',
      label: 'Reportes y Analíticas',
      icon: BarChart3,
      roles: ['admin']
    }
  ];

  return (
    <nav style={{
      backgroundColor: '#ffffff',
      borderBottom: '1px solid var(--border-color)',
      padding: '0 24px',
      display: 'flex',
      gap: '4px',
      overflowX: 'auto'
    }}>
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
  );
}
