import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db.js';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { DollarSign, ShoppingBag, AlertTriangle, Cloud, CloudOff, TrendingUp } from 'lucide-react';

export default function AnalyticsDashboard() {
  const ventas = useLiveQuery(() => db.ventas.toArray(), []) ?? [];
  const productos = useLiveQuery(() => db.productos.toArray(), []) ?? [];
  const detalles = useLiveQuery(() => db.ventasDetalle.toArray(), []) ?? [];

  // KPIs
  const totalVentasMonto = ventas.reduce((acc, v) => acc + (v.total || 0), 0);
  const totalTransacciones = ventas.length;
  const pendientesSyncCount = ventas.filter(v => v.syncStatus === 0).length;
  const sincronizadasCount = ventas.filter(v => v.syncStatus === 1).length;
  const lowStockCount = productos.filter(p => p.stock <= p.stockMinimo).length;

  // Agrupamiento por Categoría
  const salesByCategoryMap = {};
  detalles.forEach((det) => {
    const prod = productos.find(p => p.id === det.productoId);
    const cat = prod?.categoria || 'General';
    const subtotal = (det.cantidad * det.precioUnitario);
    salesByCategoryMap[cat] = (salesByCategoryMap[cat] || 0) + subtotal;
  });

  const categoryChartData = Object.keys(salesByCategoryMap).map(cat => ({
    categoria: cat,
    ventas: parseFloat(salesByCategoryMap[cat].toFixed(2))
  }));

  // Agrupamiento de Estado de Sincronización para Pie Chart
  const syncPieData = [
    { name: 'Sincronizadas (Backend)', value: sincronizadasCount, color: '#059669' },
    { name: 'Pendientes (IndexedDB)', value: pendientesSyncCount, color: '#d97706' }
  ];

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* HEADER DASHBOARD */}
      <div className="corporate-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingUp color="var(--accent-primary)" size={20} />
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Panel de Reportes y Analíticas de Venta
          </h2>
        </div>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          Consolidación de métricas comerciales calculadas a partir de la base local IndexedDB.
        </p>
      </div>

      {/* KPI METRICS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        
        <div className="corporate-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
            <span>Ingresos Totales</span>
            <DollarSign size={18} color="var(--text-muted)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '8px', color: 'var(--text-main)' }}>
            ${totalVentasMonto.toFixed(2)}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{totalTransacciones} transacciones registradas</span>
        </div>

        <div className="corporate-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
            <span>Ventas Sincronizadas</span>
            <Cloud size={18} color="var(--accent-emerald)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '8px', color: 'var(--accent-emerald)' }}>
            {sincronizadasCount}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Confirmadas en el backend</span>
        </div>

        <div className="corporate-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
            <span>Pendientes por Sincronizar</span>
            <CloudOff size={18} color="var(--accent-amber)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '8px', color: 'var(--accent-amber)' }}>
            {pendientesSyncCount}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>En cola local IndexedDB</span>
        </div>

        <div className="corporate-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
            <span>Alertas de Inventario</span>
            <AlertTriangle size={18} color="var(--accent-rose)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '8px', color: lowStockCount > 0 ? 'var(--accent-rose)' : 'var(--text-main)' }}>
            {lowStockCount}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Productos bajo stock mínimo</span>
        </div>

      </div>

      {/* GRÁFICOS INTERACTIVOS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
        
        {/* GRÁFICO BARRA VENTAS POR CATEGORÍA */}
        <div className="corporate-panel" style={{ padding: '20px', minHeight: '340px' }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '16px', color: 'var(--text-main)' }}>
            Facturación por Categoría de Producto ($)
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={categoryChartData.length > 0 ? categoryChartData : [{ categoria: 'Bebidas', ventas: 45 }, { categoria: 'Alimentos', ventas: 70 }, { categoria: 'Snacks', ventas: 28 }]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="categoria" stroke="#64748b" fontSize={12} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
              <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', boxShadow: 'var(--shadow-md)', color: '#0f172a', fontSize: '12px' }} />
              <Bar dataKey="ventas" fill="#0f172a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* GRÁFICO CIRCULAR DE ESTADO OFFLINE/ONLINE */}
        <div className="corporate-panel" style={{ padding: '20px', minHeight: '340px' }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '16px', color: 'var(--text-main)' }}>
            Estado de Sincronización de Transacciones
          </h3>
          <ResponsiveContainer width="100%" height={230}>
            <PieChart>
              <Pie
                data={syncPieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
              >
                {syncPieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', boxShadow: 'var(--shadow-md)', color: '#0f172a', fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', fontSize: '0.8125rem', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
            <span style={{ color: '#059669', fontWeight: 600 }}>● Sincronizadas: {sincronizadasCount}</span>
            <span style={{ color: '#d97706', fontWeight: 600 }}>● En Cola Local: {pendientesSyncCount}</span>
          </div>
        </div>

      </div>

    </div>
  );
}
