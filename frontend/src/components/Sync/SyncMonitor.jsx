import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db.js';
import { useNetwork } from '../../context/NetworkContext.jsx';
import {
  CloudSync,
  RefreshCw,
  Wifi,
  WifiOff,
  CheckCircle2,
  Server,
  Eye,
  SlidersHorizontal,
  Clock,
  Database,
  ArrowRight,
  X
} from 'lucide-react';

export default function SyncMonitor() {
  const {
    isOnline,
    simulationMode,
    setSimulationMode,
    pendingSalesCount,
    isSyncing,
    triggerManualSync,
    lastSyncTime
  } = useNetwork();

  const pendingSales = useLiveQuery(() => db.ventas.where('syncStatus').equals(0).toArray(), []) ?? [];
  const syncedSales = useLiveQuery(() => db.ventas.where('syncStatus').equals(1).reverse().limit(10).toArray(), []) ?? [];

  const [serverStats, setServerStats] = useState(null);
  const [selectedSaleDetail, setSelectedSaleDetail] = useState(null);

  const fetchServerStatus = async () => {
    try {
      const res = await fetch('/api/v1/sync-status');
      if (res.ok) {
        const data = await res.json();
        setServerStats(data);
      }
    } catch (e) {
      setServerStats(null);
    }
  };

  useEffect(() => {
    fetchServerStatus();
    const interval = setInterval(fetchServerStatus, 5000);
    return () => clearInterval(interval);
  }, [lastSyncTime]);

  const viewSalePayload = async (venta) => {
    const detalles = await db.ventasDetalle.where('ventaId').equals(venta.id).toArray();
    setSelectedSaleDetail({ ...venta, detalles });
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* HEADER MONITOREO */}
      <div className="corporate-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CloudSync color="var(--accent-primary)" size={20} />
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Motor de Sincronización Cloud y Cola Offline
            </h2>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Control transaccional entre IndexedDB (Client-side) y el Servidor API REST (Backend).
          </p>
        </div>

        <button
          className={`btn ${pendingSalesCount > 0 ? 'btn-primary' : 'btn-secondary'}`}
          onClick={triggerManualSync}
          disabled={isSyncing || !isOnline}
          style={{ padding: '9px 18px', fontSize: '0.875rem' }}
        >
          <RefreshCw size={15} className={isSyncing ? 'spin-anim' : ''} />
          <span>{isSyncing ? 'Sincronizando por lote...' : `Sincronizar Lote (${pendingSalesCount})`}</span>
        </button>
      </div>

      {/* STATUS TARJETAS RED & SERVIDOR */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        
        {/* NETWORK STATUS */}
        <div className="corporate-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isOnline ? <Wifi color="var(--accent-emerald)" size={16} /> : <WifiOff color="var(--accent-rose)" size={16} />}
              Estado de Red y Conectividad
            </h3>
            <span className={`badge ${isOnline ? 'badge-online' : 'badge-offline'}`}>
              {isOnline ? 'En Línea' : 'Sin Conexión'}
            </span>
          </div>

          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            {isOnline
              ? 'Las transacciones registradas se envían automáticamente al servidor central.'
              : 'Modo seguro offline: las ventas se almacenan localmente en IndexedDB.'}
          </p>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button className={`btn ${simulationMode === 'auto' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setSimulationMode('auto')} style={{ fontSize: '0.75rem', padding: '5px 10px' }}>
              Automático
            </button>
            <button className={`btn ${simulationMode === 'force_online' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setSimulationMode('force_online')} style={{ fontSize: '0.75rem', padding: '5px 10px' }}>
              Forzar Online
            </button>
            <button className={`btn ${simulationMode === 'force_offline' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setSimulationMode('force_offline')} style={{ fontSize: '0.75rem', padding: '5px 10px' }}>
              Forzar Offline
            </button>
          </div>
        </div>

        {/* SERVER HEALTH */}
        <div className="corporate-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Server color="var(--accent-primary)" size={16} />
              Servidor API Backend (Express)
            </h3>
            <span className={`badge ${serverStats ? 'badge-online' : 'badge-offline'}`}>
              {serverStats ? 'Activo (Puerto 3001)' : 'Desconectado'}
            </span>
          </div>

          {serverStats ? (
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              <p style={{ marginBottom: '6px' }}>
                Ventas consolidadas en backend: <strong style={{ color: 'var(--text-main)' }}>{serverStats.totalVentasServidor}</strong>
              </p>
              <p>
                Catálogo central: <strong style={{ color: 'var(--text-main)' }}>{serverStats.productosTotal}</strong> artículos sincronizados
              </p>
            </div>
          ) : (
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              El servidor en <code>http://localhost:3001</code> no responde. Las transacciones se preservarán intactas en IndexedDB.
            </div>
          )}
        </div>

      </div>

      {/* TABLA DE VENTAS PENDIENTES EN COLA */}
      <div className="corporate-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={16} color="var(--accent-amber)" />
            Cola de Transacciones Pendientes en IndexedDB ({pendingSales.length})
          </h3>
          <span className="badge badge-warning">syncStatus = 0</span>
        </div>

        {pendingSales.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '36px',
            color: 'var(--text-muted)',
            backgroundColor: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-sm)',
            border: '1px dashed var(--border-color)',
            fontSize: '0.85rem'
          }}>
            <CheckCircle2 size={24} color="var(--accent-emerald)" style={{ marginBottom: '8px', display: 'inline-block' }} />
            <p style={{ fontWeight: 500, color: 'var(--text-main)' }}>No hay ventas pendientes por sincronizar</p>
            <p style={{ fontSize: '0.75rem' }}>Todas las transacciones locales coinciden con el servidor central.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-main)' }}>
                  <th style={{ padding: '10px 14px', fontWeight: 600 }}>Folio UUID Cliente</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600 }}>Fecha Local</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600 }}>Cliente</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600 }}>Monto</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600 }}>Estado</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600, textAlign: 'right' }}>Detalle</th>
                </tr>
              </thead>
              <tbody>
                {pendingSales.map((v) => (
                  <tr key={v.id} style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: '#ffffff' }}>
                    <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>{v.id}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>{new Date(v.fecha).toLocaleString()}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 500 }}>{v.clienteNombre}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--text-main)' }}>${v.total.toFixed(2)}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span className="badge badge-warning">En Cola (Local)</span>
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                      <button className="btn btn-secondary" style={{ padding: '3px 8px', fontSize: '0.75rem' }} onClick={() => viewSalePayload(v)}>
                        <Eye size={12} /> Payload
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* HISTORIAL RECIENTE SINCRONIZADAS */}
      <div className="corporate-panel" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 color="var(--accent-emerald)" size={16} />
          Historial Reciente de Ventas Confirmadas por el Servidor
        </h3>

        <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8125rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-main)' }}>
                <th style={{ padding: '10px 14px', fontWeight: 600 }}>UUID Venta</th>
                <th style={{ padding: '10px 14px', fontWeight: 600 }}>Fecha</th>
                <th style={{ padding: '10px 14px', fontWeight: 600 }}>Cliente</th>
                <th style={{ padding: '10px 14px', fontWeight: 600 }}>Total</th>
                <th style={{ padding: '10px 14px', fontWeight: 600 }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {syncedSales.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No hay ventas sincronizadas registradas en esta sesión.
                  </td>
                </tr>
              ) : (
                syncedSales.map((v) => (
                  <tr key={v.id} style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: '#ffffff' }}>
                    <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{v.id}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>{new Date(v.fecha).toLocaleString()}</td>
                    <td style={{ padding: '10px 14px' }}>{v.clienteNombre}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-main)' }}>${v.total.toFixed(2)}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span className="badge badge-online">syncStatus = 1 (OK)</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL VER JSON PAYLOAD */}
      {selectedSaleDetail && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          zIndex: 1100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '540px',
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-modal)'
          }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-main)' }}>Payload Batch JSON</h3>
              <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => setSelectedSaleDetail(null)}>
                <X size={15} />
              </button>
            </div>
            
            <div style={{ padding: '16px' }}>
              <pre style={{
                backgroundColor: '#0f172a',
                padding: '14px',
                borderRadius: 'var(--radius-sm)',
                color: '#38bdf8',
                fontSize: '0.78rem',
                fontFamily: 'var(--font-mono)',
                overflowX: 'auto',
                maxHeight: '320px'
              }}>
                {JSON.stringify(selectedSaleDetail, null, 2)}
              </pre>
            </div>

            <div style={{ padding: '12px 18px', backgroundColor: 'var(--bg-subtle)', borderTop: '1px solid var(--border-color)', textAlign: 'right' }}>
              <button className="btn btn-primary" onClick={() => setSelectedSaleDetail(null)}>
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
