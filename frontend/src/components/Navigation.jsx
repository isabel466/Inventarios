import React from 'react';
import { ShoppingCart, Package, BarChart3, CloudSync, ShieldAlert, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navigation({ activeTab, setActiveTab }) {
  const { user } = useAuth();
  const currentRole = user?.role || 'admin';

  // Configuración estricta de tabs por rol según requerimientos del sistema:
  // - Vendedor: Solo accede a la pantalla de Ventas y consulta de Productos.
  // - Almacén: Solo accede a Entradas/Salidas y Productos.
  // - Administrador: Dashboard global, Usuarios, Reportes y Ajustes.
  const allTabs = [
    {
      id: 'pos',
      label: 'Punto de Venta',
      shortLabel: 'Ventas',
      icon: ShoppingCart,
      roles: ['vendedor', 'admin']
    },
    {
      id: 'inventory',
      label: 'Inventario',
      shortLabel: 'Inventario',
      icon: Package,
      roles: ['almacen', 'admin']
    },
    {
      id: 'analytics',
      label: 'Reportes y Métricas',
      shortLabel: 'Reportes',
      icon: BarChart3,
      roles: ['admin']
    },
    {
      id: 'users',
      label: 'Personal y Cuentas',
      shortLabel: 'Personal',
      icon: Users,
      roles: ['admin']
    },
    {
      id: 'sync',
      label: 'Sincronización',
      shortLabel: 'Sync',
      icon: CloudSync,
      roles: ['admin']
    }
  ];

  // Filtramos estrictamente los tabs permitidos para el rol actual
  const visibleTabs = allTabs.filter(tab => tab.roles.includes(currentRole));

  return (
    <>
      {/* 1. NAVEGACIÓN SUPERIOR PARA ESCRITORIO */}
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
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
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
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={17} color={isActive ? 'var(--text-main)' : 'var(--text-dim)'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* 2. BARRA DE NAVEGACIÓN INFERIOR PARA MÓVILES */}
      <div className="mobile-bottom-nav">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={`mobile-${tab.id}`}
              className={`mobile-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
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
