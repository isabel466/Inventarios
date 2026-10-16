import React from 'react';
import { ShoppingCart, Package, BarChart3, Database, ShieldAlert, Clock, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useProjectMode } from '../context/ProjectModeContext.jsx';

export default function Navigation({ activeTab, setActiveTab }) {
  const { user } = useAuth();
  const { isAvanceMode } = useProjectMode();

  const tabs = [
    { id: 'pos', label: isAvanceMode ? 'Terminal POS (Local)' : 'Terminal POS', icon: ShoppingCart, roles: ['vendedor', 'admin'], hito: 1 },
    { id: 'inventory', label: 'Inventario & Stock', icon: Package, roles: ['almacen', 'admin'], hito: 1 },
    { id: 'sync', label: isAvanceMode ? 'Sincronización (Hito 2)' : 'Cola de Sincronización', icon: Database, roles: ['admin', 'vendedor', 'almacen'], hito: 2 },
    { id: 'analytics', label: isAvanceMode ? 'Dashboard (Hito 2)' : 'Dashboard & Reportes', icon: BarChart3, roles: ['admin'], hito: 2 }
  ];

  return (
    <nav style={{ padding: '8px 24px', backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '8px', overflowX: 'auto' }}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isAllowed = tab.roles.includes(user?.role || 'admin');
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            className={`btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab(tab.id)}
            disabled={!isAllowed}
            style={{
              opacity: isAllowed ? 1 : 0.4,
              cursor: isAllowed ? 'pointer' : 'not-allowed',
              padding: '8px 16px',
              fontSize: '0.9rem',
              borderRadius: '10px'
            }}
            title={!isAllowed ? `Requiere rol: ${tab.roles.join(' o ')}` : tab.label}
          >
            <Icon size={18} />
            <span>{tab.label}</span>
            {!isAllowed && <ShieldAlert size={14} color="var(--accent-rose)" />}
          </button>
        );
      })}
    </nav>
  );
}
