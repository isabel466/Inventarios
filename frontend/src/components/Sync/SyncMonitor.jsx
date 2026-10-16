import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db.js';
import { useNetwork } from '../../context/NetworkContext.jsx';
import { Database, RefreshCw, Wifi, WifiOff, CheckCircle2, Server, Eye } from 'lucide-react';

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
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* HEADER MONITOREO */}
      <div className="glass-card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Database color="var(--accent-cyan)" size={24} /> Motor de Sincronización & Cola Offline
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Supervisa en tiempo real las escrituras en IndexedDB y el envío batch al backend.
          </p>
        </div>

        <button
          className={`btn ${pendingSalesCount > 0 ? 'btn-primary' : 'btn-secondary'}`}
          onClick={triggerManualSync}
          disabled={isSyncing || !isOnline}
          style={{ padding: '10px 20px', fontSize: '0.95rem' }}
        >
          <RefreshCw size={18} className={isSyncing ? 'spin-anim' : ''} />
          {isSyncing ? 'Sincronizando Lote...' : `Sincronizar Pendientes (${pendingSalesCount})`}
        </button>
      </div>

      {/* STATUS TARJETAS RED & SERVIDOR */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        
        {/* NETWORK SIMULATOR CONTROL */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isOnline ? <Wifi color="var(--accent-emerald)" size={18} /> : <WifiOff color="var(--accent-rose)" size={18} />}
            Estado Conexión de Red
          </h3>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
            Estado actual: <strong style={{ color: isOnline ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>{isOnline ? 'ONLINE (Conectado)' : 'OFFLINE (Almacenando localmente)'}</strong>
          </p>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button className={`btn ${simulationMode === 'auto' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setSimulationMode('auto')} style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
              Auto
            </button>
            <button className={`btn ${simulationMode === 'force_online' ? 'btn-success' : 'btn-secondary'}`} onClick={() => setSimulationMode('force_online')} style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
              <Wifi size={14} /> Forzar Online
            </button>
            <button className={`btn ${simulationMode === 'force_offline' ? 'btn-danger' : 'btn-secondary'}`} onClick={() => setSimulationMode('force_offline')} style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
              <WifiOff size={14} /> Forzar Offline
            </button>
          </div>
        </div>

        {/* SERVER HEALTH */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Server color="var(--accent-cyan)" size={18} /> Servidor Backend Express
          </h3>

          {serverStats ? (
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--accent-emerald)', marginBottom: '6px', fontWeight: 600 }}>
                🟢 Servidor activo en http://localhost:3001
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Ventas en BD Servidor: <strong>{serverStats.totalVentasServidor}</strong> • Catálogo: <strong>{serverStats.productosTotal}</strong> productos
              </p>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--accent-rose)', fontWeight: 600 }}>
                🔴 Servidor Backend No Disponible / Desconectado
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Las ventas se mantendrán seguras en IndexedDB hasta restablecer el servidor.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* TABLA DE VENTAS PENDIENTES EN COLA */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          ⏳ Cola de Transacciones Pendientes en IndexedDB ({pendingSales.length})
        </h3>

        {pendingSales.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', border: '1px dashed var(--border-color)', borderRadius: '12px' }}>
            🎉 No hay transacciones pendientes por sincronizar. Toda la información local coincide con el servidor.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px' }}>ID UUID Cliente</th>
                  <th style={{ padding: '10px' }}>Fecha Registro</th>
                  <th style={{ padding: '10px' }}>Cliente</th>
                  <th style={{ padding: '10px' }}>Monto Total</th>
                  <th style={{ padding: '10px' }}>Estado Sync</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Payload</th>
                </tr>
              </thead>
              <tbody>
                {pendingSales.map((v) => (
                  <tr key={v.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '10px', fontFamily: 'monospace', color: 'var(--accent-amber)' }}>{v.id}</td>
                    <td style={{ padding: '10px' }}>{new Date(v.fecha).toLocaleString()}</td>
                    <td style={{ padding: '10px' }}>{v.clienteNombre}</td>
                    <td style={{ padding: '10px', fontWeight: 700 }}>${v.total.toFixed(2)}</td>
                    <td style={{ padding: '10px' }}>
                      <span className="badge badge-warning">syncStatus: 0 (PENDIENTE)</span>
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>
                      <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => viewSalePayload(v)}>
                        <Eye size={12} /> Ver JSON
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* TABLA DE VENTAS YA SINCRONIZADAS RECIENTEMENTE */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 color="var(--accent-emerald)" size={20} /> Historial Reciente de Ventas Sincronizadas
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '10px' }}>UUID Venta</th>
                <th style={{ padding: '10px' }}>Fecha</th>
                <th style={{ padding: '10px' }}>Cliente</th>
                <th style={{ padding: '10px' }}>Total</th>
                <th style={{ padding: '10px' }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {syncedSales.map((v) => (
                <tr key={v.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '10px', fontFamily: 'monospace', color: 'var(--accent-cyan)' }}>{v.id}</td>
                  <td style={{ padding: '10px' }}>{new Date(v.fecha).toLocaleString()}</td>
                  <td style={{ padding: '10px' }}>{v.clienteNombre}</td>
                  <td style={{ padding: '10px', fontWeight: 700 }}>${v.total.toFixed(2)}</td>
                  <td style={{ padding: '10px' }}>
                    <span className="badge badge-online">syncStatus: 1 (OK)</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL VER JSON PAYLOAD */}
      {selectedSaleDetail && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '520px', padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '12px' }}>Payload JSON enviado al Backend</h3>
            <pre style={{ backgroundColor: '#090d16', padding: '14px', borderRadius: '8px', color: '#38bdf8', fontSize: '0.8rem', overflowX: 'auto', maxHeight: '300px' }}>
              {JSON.stringify(selectedSaleDetail, null, 2)}
            </pre>
            <div style={{ marginTop: '16px', textAlign: 'right' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedSaleDetail(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
