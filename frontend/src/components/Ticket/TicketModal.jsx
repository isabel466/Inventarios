import React from 'react';
import { jsPDF } from 'jspdf';
import { Printer, Download, X, CheckCircle2, CloudOff } from 'lucide-react';

export default function TicketModal({ venta, detalles, onClose }) {
  if (!venta) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF({
      unit: 'mm',
      format: [80, 160]
    });

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('POS SYSTEM PWA', 40, 12, { align: 'center' });

    doc.setFontSize(9);
    doc.setFont('Helvetica', 'normal');
    doc.text('Ticket de Venta (Offline-First)', 40, 18, { align: 'center' });
    doc.text(`ID: ${venta.id.slice(0, 13)}...`, 40, 24, { align: 'center' });
    doc.text(`Fecha: ${new Date(venta.fecha).toLocaleString()}`, 40, 29, { align: 'center' });
    doc.text(`Atendió: ${venta.usuarioNombre || 'Vendedor'}`, 40, 34, { align: 'center' });
    doc.text(`Cliente: ${venta.clienteNombre || 'General'}`, 40, 39, { align: 'center' });

    doc.line(5, 42, 75, 42);

    let y = 48;
    doc.setFont('Helvetica', 'bold');
    doc.text('Cant', 5, y);
    doc.text('Producto', 20, y);
    doc.text('Total', 75, y, { align: 'right' });

    y += 4;
    doc.setFont('Helvetica', 'normal');
    detalles.forEach((item) => {
      doc.text(`${item.cantidad}`, 5, y);
      const nombreCorto = item.nombre ? item.nombre.slice(0, 18) : 'Producto';
      doc.text(nombreCorto, 20, y);
      doc.text(`$${(item.cantidad * item.precioUnitario).toFixed(2)}`, 75, y, { align: 'right' });
      y += 5;
    });

    doc.line(5, y, 75, y);
    y += 6;

    doc.setFontSize(12);
    doc.setFont('Helvetica', 'bold');
    doc.text(`TOTAL: $${venta.total.toFixed(2)}`, 75, y, { align: 'right' });

    y += 8;
    doc.setFontSize(8);
    doc.setFont('Helvetica', 'italic');
    doc.text(
      venta.syncStatus === 1 ? 'Status: SINCRONIZADO EN SERVIDOR' : 'Status: GUARDADO LOCAL EN INDEXEDDB',
      40,
      y,
      { align: 'center' }
    );

    doc.save(`Ticket_Venta_${venta.id.slice(0, 8)}.pdf`);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(8px)',
      zIndex: 1100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', borderRadius: '16px', overflow: 'hidden' }}>
        
        {/* MODAL ACTION BAR */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Comprobante de Venta</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-primary" onClick={handlePrint} style={{ padding: '4px 10px', fontSize: '0.8rem' }}>
              <Printer size={14} /> Imprimir
            </button>
            <button className="btn btn-success" onClick={handleDownloadPDF} style={{ padding: '4px 10px', fontSize: '0.8rem' }}>
              <Download size={14} /> PDF
            </button>
            <button className="btn btn-secondary" onClick={onClose} style={{ padding: '4px 8px' }}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* PRINTABLE THERMAL TICKET FORMAT */}
        <div style={{ padding: '24px', backgroundColor: '#ffffff', color: '#0f172a', fontFamily: 'monospace' }} id="printable-ticket">
          <div style={{ textAlign: 'center', marginBottom: '12px', borderBottom: '2px dashed #cbd5e1', pb: '12px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>SISTEMA POS PWA</h2>
            <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Punto de Venta e Inventario</p>
            <p style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px' }}>Ticket #{venta.id.slice(0, 8)}</p>
          </div>

          <div style={{ fontSize: '0.75rem', marginBottom: '12px', lineHeight: 1.4 }}>
            <div><strong>Fecha:</strong> {new Date(venta.fecha).toLocaleString()}</div>
            <div><strong>Vendedor:</strong> {venta.usuarioNombre || 'Vendedor'}</div>
            <div><strong>Cliente:</strong> {venta.clienteNombre || 'General'}</div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', marginBottom: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #000' }}>
                <th style={{ textAlign: 'left', paddingBottom: '4px' }}>Cant</th>
                <th style={{ textAlign: 'left', paddingBottom: '4px' }}>Producto</th>
                <th style={{ textAlign: 'right', paddingBottom: '4px' }}>Precio</th>
                <th style={{ textAlign: 'right', paddingBottom: '4px' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {detalles.map((det) => (
                <tr key={det.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '4px 0' }}>{det.cantidad}</td>
                  <td style={{ padding: '4px 0' }}>{det.nombre || 'Producto'}</td>
                  <td style={{ textAlign: 'right', padding: '4px 0' }}>${det.precioUnitario.toFixed(2)}</td>
                  <td style={{ textAlign: 'right', padding: '4px 0' }}>${(det.cantidad * det.precioUnitario).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ borderTop: '2px solid #000', paddingTop: '8px', textAlign: 'right', fontSize: '1rem', fontWeight: 'bold' }}>
            TOTAL: ${venta.total.toFixed(2)}
          </div>

          <div style={{ marginTop: '16px', paddingTop: '8px', borderTop: '1px dashed #cbd5e1', textAlign: 'center', fontSize: '0.7rem', color: '#475569' }}>
            {venta.syncStatus === 1 ? (
              <span style={{ color: '#059669', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={12} /> Sincronizado en Servidor Central
              </span>
            ) : (
              <span style={{ color: '#d97706', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <CloudOff size={12} /> Creado Offline (Pendiente de Red)
              </span>
            )}
            <p style={{ marginTop: '4px' }}>¡Gracias por su compra!</p>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div style={{ padding: '12px 20px', backgroundColor: 'var(--bg-secondary)', textAlign: 'right' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}
