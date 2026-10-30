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
    doc.setFontSize(13);
    doc.text('SISTEMA POS & INVENTARIO', 40, 12, { align: 'center' });

    doc.setFontSize(9);
    doc.setFont('Helvetica', 'normal');
    doc.text('Comprobante de Transacción', 40, 17, { align: 'center' });
    doc.text(`Folio: ${venta.id.slice(0, 13)}...`, 40, 22, { align: 'center' });
    doc.text(`Fecha: ${new Date(venta.fecha).toLocaleString()}`, 40, 27, { align: 'center' });
    doc.text(`Atendido por: ${venta.usuarioNombre || 'Vendedor'}`, 40, 32, { align: 'center' });
    doc.text(`Cliente: ${venta.clienteNombre || 'General'}`, 40, 37, { align: 'center' });

    doc.line(5, 40, 75, 40);

    let y = 46;
    doc.setFont('Helvetica', 'bold');
    doc.text('Cant', 5, y);
    doc.text('Descripción', 18, y);
    doc.text('Total', 75, y, { align: 'right' });

    y += 4;
    doc.setFont('Helvetica', 'normal');
    detalles.forEach((item) => {
      doc.text(`${item.cantidad}`, 5, y);
      const nombreCorto = item.nombre ? item.nombre.slice(0, 20) : 'Producto';
      doc.text(nombreCorto, 18, y);
      doc.text(`$${(item.cantidad * item.precioUnitario).toFixed(2)}`, 75, y, { align: 'right' });
      y += 5;
    });

    doc.line(5, y, 75, y);
    y += 6;

    doc.setFontSize(11);
    doc.setFont('Helvetica', 'bold');
    doc.text(`TOTAL: $${venta.total.toFixed(2)}`, 75, y, { align: 'right' });

    y += 8;
    doc.setFontSize(7.5);
    doc.setFont('Helvetica', 'normal');
    doc.text(
      venta.syncStatus === 1 ? 'Estado: Sincronizado en Servidor Central' : 'Estado: Guardado Localmente en IndexedDB',
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
        maxWidth: '440px',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        backgroundColor: '#ffffff',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-modal)'
      }}>
        
        {/* MODAL ACTION BAR */}
        <div style={{
          padding: '12px 18px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#ffffff'
        }}>
          <div>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-main)' }}>
              Comprobante de Venta
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Folio #{venta.id.slice(0, 8)}</span>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button className="btn btn-secondary" onClick={handlePrint} style={{ padding: '6px 10px', fontSize: '0.8rem' }}>
              <Printer size={13} /> Imprimir
            </button>
            <button className="btn btn-primary" onClick={handleDownloadPDF} style={{ padding: '6px 10px', fontSize: '0.8rem' }}>
              <Download size={13} /> PDF
            </button>
            <button className="btn btn-secondary" onClick={onClose} style={{ padding: '6px 8px' }}>
              <X size={15} />
            </button>
          </div>
        </div>

        {/* PRINTABLE THERMAL TICKET FORMAT */}
        <div style={{ padding: '24px', backgroundColor: '#fcfcfd', color: '#0f172a', fontFamily: 'var(--font-mono)' }} id="printable-ticket">
          <div style={{ textAlign: 'center', marginBottom: '14px', borderBottom: '1px dashed #cbd5e1', paddingBottom: '12px' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>POS & INVENTARIO</h2>
            <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Punto de Venta Enterprise</p>
            <p style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px' }}>Ticket #{venta.id.slice(0, 8)}</p>
          </div>

          <div style={{ fontSize: '0.75rem', marginBottom: '12px', lineHeight: 1.4, color: '#334155' }}>
            <div><strong>Fecha:</strong> {new Date(venta.fecha).toLocaleString()}</div>
            <div><strong>Vendedor:</strong> {venta.usuarioNombre || 'Vendedor'}</div>
            <div><strong>Cliente:</strong> {venta.clienteNombre || 'General'}</div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', marginBottom: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #cbd5e1', color: '#64748b' }}>
                <th style={{ textAlign: 'left', paddingBottom: '6px' }}>Cant</th>
                <th style={{ textAlign: 'left', paddingBottom: '6px' }}>Descripción</th>
                <th style={{ textAlign: 'right', paddingBottom: '6px' }}>P.U.</th>
                <th style={{ textAlign: 'right', paddingBottom: '6px' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {detalles.map((det) => (
                <tr key={det.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '6px 0' }}>{det.cantidad}</td>
                  <td style={{ padding: '6px 0' }}>{det.nombre || 'Producto'}</td>
                  <td style={{ textAlign: 'right', padding: '6px 0' }}>${det.precioUnitario.toFixed(2)}</td>
                  <td style={{ textAlign: 'right', padding: '6px 0', fontWeight: 600 }}>${(det.cantidad * det.precioUnitario).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ borderTop: '1px solid #0f172a', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', fontWeight: 700 }}>
            <span>TOTAL:</span>
            <span>${venta.total.toFixed(2)}</span>
          </div>

          <div style={{ marginTop: '16px', paddingTop: '10px', borderTop: '1px dashed #cbd5e1', textAlign: 'center', fontSize: '0.7rem' }}>
            {venta.syncStatus === 1 ? (
              <span className="badge badge-online">
                <CheckCircle2 size={11} /> Sincronizado en Servidor
              </span>
            ) : (
              <span className="badge badge-warning">
                <CloudOff size={11} /> Guardado en IndexedDB (Local)
              </span>
            )}
            <p style={{ marginTop: '8px', color: '#64748b' }}>Comprobante de compra comercial</p>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div style={{ padding: '12px 18px', backgroundColor: '#ffffff', borderTop: '1px solid var(--border-color)', textAlign: 'right' }}>
          <button className="btn btn-primary" onClick={onClose} style={{ padding: '7px 16px' }}>
            Aceptar y Nueva Venta
          </button>
        </div>

      </div>
    </div>
  );
}
