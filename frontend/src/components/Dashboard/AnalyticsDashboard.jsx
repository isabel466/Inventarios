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
  Cell,
  AreaChart,
  Area
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
    { name: 'Sincronizadas (Server)', value: sincronizadasCount, color: '#10b981' },
    { name: 'Pendientes (IndexedDB)', value: pendientesSyncCount, color: '#f59e0b' }
  ];

  // Datos simulados de tendencia si no hay suficientes ventas
  const salesTrendData = ventas.length > 0 ? ventas.map((v, i) => ({
    index: `#${i + 1}`,
    monto: v.total,
    hora: new Date(v.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  })) : [
    { hora: '09:00', monto: 25.5 },
    { hora: '10:00', monto: 42.0 },
    { hora: '11:00', monto: 88.5 },
    { hora: '12:00', monto: 120.0 }
  ];

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* HEADER DASHBOARD */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <TrendingUp color="var(--accent-cyan)" size={24} /> Dashboard Analítico & Reportes
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Métricas consolidadas directamente desde la Base de Datos Local IndexedDB.
        </p>
      </div>

      {/* KPI METRICS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        
        <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid var(--accent-cyan)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <span>Ventas Acumuladas</span>
            <DollarSign size={18} color="var(--accent-cyan)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, marginTop: '8px', color: 'var(--accent-cyan)' }}>
            ${totalVentasMonto.toFixed(2)}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>En {totalTransacciones} transacciones</span>
        </div>

        <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid var(--accent-emerald)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <span>Ventas Sincronizadas</span>
            <Cloud size={18} color="var(--accent-emerald)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, marginTop: '8px', color: 'var(--accent-emerald)' }}>
            {sincronizadasCount}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Confirmadas por Servidor</span>
        </div>

        <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid var(--accent-amber)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <span>Pendientes por Sync</span>
            <CloudOff size={18} color="var(--accent-amber)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, marginTop: '8px', color: 'var(--accent-amber)' }}>
            {pendientesSyncCount}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>En cola offline IndexedDB</span>
        </div>

        <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid var(--accent-rose)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <span>Productos Stock Bajo</span>
            <AlertTriangle size={18} color="var(--accent-rose)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, marginTop: '8px', color: 'var(--accent-rose)' }}>
            {lowStockCount}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Por debajo de stock mínimo</span>
        </div>

      </div>

      {/* GRÁFICOS INTERACTIVOS RECHARTS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        
        {/* GRÁFICO BARRA VENTAS POR CATEGORÍA */}
        <div className="glass-panel" style={{ padding: '20px', minHeight: '320px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px', color: 'var(--text-main)' }}>
            Ventas por Categoría ($)
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={categoryChartData.length > 0 ? categoryChartData : [{ categoria: 'Bebidas', ventas: 50 }, { categoria: 'Alimentos', ventas: 80 }]}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="categoria" stroke="var(--text-muted)" />
              <YAxis stroke="var(--text-muted)" />
              <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: '#fff' }} />
              <Bar dataKey="ventas" fill="var(--accent-cyan)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* GRÁFICO CIRCULAR DE ESTADO OFFLINE/ONLINE */}
        <div className="glass-panel" style={{ padding: '20px', minHeight: '320px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px', color: 'var(--text-main)' }}>
            Distribución de Sincronización de Ventas
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={syncPieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
              >
                {syncPieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', fontSize: '0.85rem' }}>
            <span style={{ color: '#10b981' }}>● Sincronizadas: {sincronizadasCount}</span>
            <span style={{ color: '#f59e0b' }}>● Pendientes Offline: {pendientesSyncCount}</span>
          </div>
        </div>

      </div>

    </div>
  );
}
