import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, Camera, Barcode, CheckCircle2 } from 'lucide-react';

export default function BarcodeScannerModal({ onClose, onScanSuccess }) {
  const scannerRef = useRef(null);
  const [scannedResult, setScannedResult] = useState('');

  useEffect(() => {
    // Configurar escáner html5-qrcode
    const html5QrcodeScanner = new Html5QrcodeScanner(
      'reader',
      {
        fps: 10,
        qrbox: { width: 250, height: 150 },
        aspectRatio: 1.777778
      },
      /* verbose= */ false
    );

    html5QrcodeScanner.render(
      (decodedText) => {
        setScannedResult(decodedText);
        html5QrcodeScanner.clear();
        onScanSuccess(decodedText);
      },
      (error) => {
        // Errores normales de frame sin código
      }
    );

    scannerRef.current = html5QrcodeScanner;

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(e => console.error("Error al limpiar escáner:", e));
      }
    };
  }, [onScanSuccess]);

  const testBarcodes = [
    { code: '75010001', name: 'Café Espresso Gourmet' },
    { code: '75010002', name: 'Agua Mineral 600ml' },
    { code: '75010003', name: 'Sandwich de Pavo' },
    { code: '75010004', name: 'Galletas Artesanales' },
    { code: '75010005', name: 'Jugo Natural Naranja' }
  ];

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(8px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', borderRadius: '16px', overflow: 'hidden' }}>
        
        {/* HEADER MODAL */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Camera color="var(--accent-cyan)" size={20} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Escáner de Código de Barras</h3>
          </div>
          <button className="btn btn-secondary" onClick={onClose} style={{ padding: '4px 8px' }}>
            <X size={18} />
          </button>
        </div>

        {/* CONTENEDOR CÁMARA */}
        <div style={{ padding: '20px' }}>
          <div id="reader" style={{ width: '100%', borderRadius: '12px', overflow: 'hidden', border: '2px solid var(--accent-cyan)' }}></div>

          {scannedResult && (
            <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid var(--accent-emerald)', borderRadius: '8px', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={18} />
              <span>Código detectado: <strong>{scannedResult}</strong></span>
            </div>
          )}

          {/* SIMULADOR RÁPIDO DE ESCÁNEO PARA PRUEBAS SIN CÁMARA */}
          <div style={{ marginTop: '20px', borderTop: '1px dashed var(--border-color)', paddingTop: '16px' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Barcode size={14} /> Simulador rápido de escáner de código de barras:
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {testBarcodes.map((b) => (
                <button
                  key={b.code}
                  className="btn btn-outline"
                  style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                  onClick={() => onScanSuccess(b.code)}
                >
                  ⚡ {b.name} ({b.code})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div style={{ padding: '12px 20px', backgroundColor: 'var(--bg-secondary)', textAlign: 'right' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}
