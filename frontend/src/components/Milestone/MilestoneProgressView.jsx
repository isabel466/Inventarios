import React from 'react';
import { CheckCircle2, Clock, ShieldCheck, Database, Server, Smartphone, FileText } from 'lucide-react';

export default function MilestoneProgressView({ moduleName = "Sincronización & Backend" }) {

  return (
    <div style={{ padding: '30px 20px', maxWidth: '900px', margin: '0 auto' }}>
      
      {/* BANNER DE ESTADO DE AVANCE (50%) */}
      <div className="glass-panel" style={{ padding: '28px', borderRadius: '18px', border: '1px solid var(--accent-amber)', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '2rem' }}>🚧</span>
            <div>
              <span className="badge badge-warning" style={{ marginBottom: '6px' }}>
                <Clock size={12} /> HITO 2: EN DESARROLLO (ENTREGA FINAL)
              </span>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Módulo: {moduleName}
              </h2>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Avance Actual:</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-amber)' }}>50%</div>
          </div>
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '20px' }}>
          Este módulo corresponde a la <strong>Fase 3, 4 y 5</strong> del proyecto (Sincronización Batch con API REST, Servidor Backend y Reportes Centralizados). En este <strong>primer avance del 50%</strong> se ha consolidado la arquitectura frontend y el almacenamiento local con IndexedDB.
        </p>

        {/* BARRA DE PROGRESO */}
        <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '10px', height: '12px', overflow: 'hidden', marginBottom: '8px' }}>
          <div style={{ background: 'linear-gradient(90deg, #06b6d4, #f59e0b)', width: '50%', height: '100%', borderRadius: '10px' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
          <span>Fase 1 & 2: Local & UI (Completado)</span>
          <span>Fase 3, 4 & 5: Backend & Sync (Próximo Sprint)</span>
        </div>
      </div>

      {/* ROADMAP COMPARATIVO HITO 1 VS HITO 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        
        {/* HITO 1: COMPLETADO */}
        <div className="glass-card" style={{ padding: '24px', borderColor: 'var(--accent-emerald)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <CheckCircle2 size={20} /> Avance Entregado (Hito 1 - 50%)
          </h3>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <span style={{ color: 'var(--accent-emerald)' }}>✓</span>
              <span><strong>Configuración PWA & Vite:</strong> Service worker base y manifiesto web instalable.</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <span style={{ color: 'var(--accent-emerald)' }}>✓</span>
              <span><strong>Base de Datos Local IndexedDB:</strong> Esquema configurado con Dexie.js (productos, ventas, movimientos).</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <span style={{ color: 'var(--accent-emerald)' }}>✓</span>
              <span><strong>Catálogo e Inventario:</strong> Visualización de existencias, productos y alertas locales de stock mínimo.</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <span style={{ color: 'var(--accent-emerald)' }}>✓</span>
              <span><strong>Terminal POS Local:</strong> Carrito reactivo, cálculo de totales y escritura optimista offline con <code>syncStatus: 0</code>.</span>
            </li>
          </ul>
        </div>

        {/* HITO 2: PROGRAMADO */}
        <div className="glass-card" style={{ padding: '24px', borderColor: 'var(--accent-amber)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Clock size={20} /> Objetivos para la Entrega Final (100%)
          </h3>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <span style={{ color: 'var(--accent-amber)' }}>⏳</span>
              <span><strong>Servidor Backend API REST:</strong> Endpoints para recepción de lotes (batch sync) y base de datos central.</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <span style={{ color: 'var(--accent-amber)' }}>⏳</span>
              <span><strong>Sincronización Automática:</strong> Listener de red <code>online</code> y resolución de conflictos.</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <span style={{ color: 'var(--accent-amber)' }}>⏳</span>
              <span><strong>APIs Nativas:</strong> Barcode Camera API para lectura física y Web Push Notifications.</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <span style={{ color: 'var(--accent-amber)' }}>⏳</span>
              <span><strong>Impresión & Reportes:</strong> Generador de tickets PDF térmicos con jsPDF y analíticas con Recharts.</span>
            </li>
          </ul>
        </div>

      </div>

    </div>
  );
}
