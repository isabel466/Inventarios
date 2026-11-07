import React, { useEffect, useRef, useState } from 'react';
import JsBarcode from 'jsbarcode';
import { jsPDF } from 'jspdf';
import { Printer, Download, X, Tag, Copy, Check } from 'lucide-react';

export default function BarcodeLabelModal({ producto, onClose }) {
  const svgRef = useRef(null);
  const [copies, setCopies] = useState(4);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (svgRef.current && producto?.codigoBarras) {
      try {
        JsBarcode(svgRef.current, String(producto.codigoBarras), {
          format: 'CODE128',
          lineColor: '#0f172a',
          width: 2,
          height: 55,
          displayValue: true,
          font: 'monospace',
          fontSize: 14,
          textMargin: 4,
          margin: 6
        });
      } catch (err) {
        console.error('Error renderizando código de barras:', err);
      }
    }
  }, [producto]);

  if (!producto) return null;

  // Imprimir directamente la etiqueta en cualquier impresora o impresora térmica
  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=700,height=600');
    if (!printWindow) {
      alert('Por favor permite las ventanas emergentes para imprimir las etiquetas.');
      return;
    }

    const svgHtml = svgRef.current ? svgRef.current.outerHTML : '';

    let labelsHtml = '';
    for (let i = 0; i < copies; i++) {
      labelsHtml += `
        <div class="label-card">
          <div class="store-name">INVENTARIO & POS</div>
          <div class="product-name">${producto.nombre}</div>
          <div class="barcode-container">${svgHtml}</div>
          <div class="price-row">
            <span class="cat">${producto.categoria}</span>
            <span class="price">$${producto.precio.toFixed(2)}</span>
          </div>
        </div>
      `;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Imprimir Etiquetas - ${producto.nombre}</title>
          <style>
            @page {
              size: auto;
              margin: 10mm;
            }
            body {
              font-family: 'Segoe UI', Arial, sans-serif;
              margin: 0;
              padding: 10px;
              display: flex;
              flex-wrap: wrap;
              gap: 12px;
              justify-content: flex-start;
              background-color: #ffffff;
            }
            .label-card {
              width: 62mm;
              height: 38mm;
              border: 1px dashed #cbd5e1;
              border-radius: 4px;
              padding: 6px 8px;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              text-align: center;
              page-break-inside: avoid;
            }
            .store-name {
              font-size: 8px;
              font-weight: 700;
              letter-spacing: 0.5px;
              color: #64748b;
              text-transform: uppercase;
            }
            .product-name {
              font-size: 11px;
              font-weight: 700;
              color: #0f172a;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              margin: 2px 0;
            }
            .barcode-container {
              display: flex;
              justify-content: center;
              align-items: center;
            }
            .barcode-container svg {
              max-width: 100%;
              height: 38px;
            }
            .price-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-top: 1px solid #e2e8f0;
              padding-top: 3px;
              margin-top: 2px;
            }
            .cat {
              font-size: 9px;
              color: #475569;
            }
            .price {
              font-size: 14px;
              font-weight: 800;
              color: #0f172a;
            }
          </style>
        </head>
        <body>
          ${labelsHtml}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Generar y descargar PDF con la cuadrícula de etiquetas adhesivas
  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF({
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait'
      });

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('PLANTILLA DE ETIQUETAS DE CÓDIGO DE BARRAS', 105, 14, { align: 'center' });

      doc.setFontSize(9);
      doc.setFont('Helvetica', 'normal');
      doc.text(`Producto: ${producto.nombre} | Código: ${producto.codigoBarras} | Precio: $${producto.precio.toFixed(2)}`, 105, 19, { align: 'center' });
      doc.line(15, 22, 195, 22);

      const labelW = 55;
      const labelH = 34;
      const startX = 18;
      const startY = 28;
      const cols = 3;

      for (let i = 0; i < copies; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = startX + col * (labelW + 6);
        const y = startY + row * (labelH + 6);

        // Rectángulo borde de etiqueta
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.3);
        doc.roundedRect(x, y, labelW, labelH, 2, 2);

        // Header etiqueta
        doc.setFontSize(6.5);
        doc.setFont('Helvetica', 'bold');
        doc.setTextColor(100, 116, 139);
        doc.text('POS & CONTROL DE INVENTARIO', x + labelW / 2, y + 4.5, { align: 'center' });

        // Nombre producto
        doc.setFontSize(8.5);
        doc.setFont('Helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        const cleanName = producto.nombre.length > 24 ? producto.nombre.substring(0, 22) + '...' : producto.nombre;
        doc.text(cleanName, x + labelW / 2, y + 9.5, { align: 'center' });

        // Código de barras numérico y barras simuladas de alta definición en PDF
        doc.setFontSize(7.5);
        doc.setFont('Courier', 'bold');
        doc.text(`||||||| | ||||| | |||| ||||`, x + labelW / 2, y + 17, { align: 'center' });
        doc.text(`* ${producto.codigoBarras} *`, x + labelW / 2, y + 21, { align: 'center' });

        // Línea divisoria inferior
        doc.line(x + 3, y + 24, x + labelW - 3, y + 24);

        // Categoría y Precio
        doc.setFontSize(7.5);
        doc.setFont('Helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        doc.text(producto.categoria, x + 4, y + 29.5);

        doc.setFontSize(11);
        doc.setFont('Helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(`$${producto.precio.toFixed(2)}`, x + labelW - 4, y + 29.5, { align: 'right' });
      }

      doc.save(`etiquetas_${producto.codigoBarras}_${producto.nombre.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
    } catch (err) {
      alert('Error al generar PDF de etiquetas: ' + err.message);
    }
  };

  const copyBarcodeText = () => {
    navigator.clipboard.writeText(producto.codigoBarras);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      zIndex: 1200,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '480px',
        backgroundColor: '#ffffff',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-modal)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* HEADER */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Tag size={18} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Generador de Etiquetas con Código de Barras
            </h3>
          </div>
          <button className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={onClose}>
            <X size={15} />
          </button>
        </div>

        {/* CONTENIDO & VISTA PREVIA DE LA ETIQUETA */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Diseño listo para impresión en hoja tamaño carta, papel autoadhesivo o rollo para etiquetadora térmica:
          </p>

          {/* TARJETA FÍSICA PREVIA */}
          <div style={{
            margin: '0 auto',
            width: '240px',
            padding: '14px 16px',
            backgroundColor: '#ffffff',
            borderRadius: '6px',
            border: '2px solid var(--border-color)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.5px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Inventario & POS
            </span>

            <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)', margin: '2px 0' }}>
              {producto.nombre}
            </h4>

            {/* CÓDIGO DE BARRAS SVG GENERADO */}
            <div style={{ display: 'flex', justifyContent: 'center', overflow: 'hidden', margin: '4px 0' }}>
              <svg ref={svgRef} style={{ maxWidth: '100%' }}></svg>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '6px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{producto.categoria}</span>
              <span style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-main)' }}>
                ${producto.precio.toFixed(2)}
              </span>
            </div>
          </div>

          {/* DETALLES DEL CÓDIGO */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Código asignado:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{producto.codigoBarras}</span>
              <button
                className="btn btn-secondary"
                style={{ padding: '2px 6px', fontSize: '0.75rem' }}
                onClick={copyBarcodeText}
                title="Copiar código numérico"
              >
                {copied ? <Check size={12} color="var(--accent-emerald)" /> : <Copy size={12} />}
              </button>
            </div>
          </div>

          {/* SELECTOR DE CANTIDAD DE COPIAS */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)' }}>
              Cantidad de etiquetas a generar:
            </label>
            <select
              className="input-field"
              style={{ width: '130px', height: '34px', fontSize: '0.8125rem' }}
              value={copies}
              onChange={(e) => setCopies(parseInt(e.target.value))}
            >
              <option value={1}>1 etiqueta</option>
              <option value={4}>4 etiquetas</option>
              <option value={8}>8 etiquetas</option>
              <option value={12}>12 etiquetas</option>
              <option value={24}>24 etiquetas</option>
            </select>
          </div>

        </div>

        {/* ACCIONES FOOTER */}
        <div style={{ padding: '14px 20px', backgroundColor: 'var(--bg-subtle)', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={handleDownloadPDF} style={{ gap: '6px' }}>
            <Download size={15} />
            <span>Descargar Plantilla PDF</span>
          </button>
          <button className="btn btn-primary" onClick={handlePrint} style={{ gap: '6px' }}>
            <Printer size={15} />
            <span>Imprimir ({copies})</span>
          </button>
        </div>

      </div>
    </div>
  );
}
