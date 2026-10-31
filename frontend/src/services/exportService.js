/**
 * Servicio de exportación a CSV / Excel con codificación UTF-8 BOM
 * Garantiza que acentos y caracteres especiales se abran correctamente en Microsoft Excel.
 */

function downloadCSV(csvContent, filename) {
  // \uFEFF es el BOM de UTF-8 requerido por Microsoft Excel en Windows
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportarInventarioCSV(productos = []) {
  const headers = [
    'Código de Barras',
    'Producto',
    'Categoría',
    'Stock Actual',
    'Stock Mínimo',
    'Precio Unitario ($)',
    'Valor Total ($)',
    'Estado'
  ];

  const rows = productos.map(p => {
    const estado = p.stock <= 0 ? 'Agotado' : p.stock <= p.stockMinimo ? 'Stock Bajo' : 'Normal';
    const valorTotal = (p.stock * p.precio).toFixed(2);
    return [
      `"${p.codigoBarras || ''}"`,
      `"${(p.nombre || '').replace(/"/g, '""')}"`,
      `"${p.categoria || 'General'}"`,
      p.stock,
      p.stockMinimo,
      p.precio.toFixed(2),
      valorTotal,
      `"${estado}"`
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadCSV(csvContent, `reporte_inventario_${dateStr}.csv`);
}

export function exportarVentasCSV(ventas = []) {
  const headers = [
    'ID Venta',
    'Fecha',
    'Cliente',
    'Vendedor',
    'Total ($)',
    'Artículos',
    'Estado Sincronización'
  ];

  const rows = ventas.map(v => {
    const estado = v.syncStatus === 1 ? 'Sincronizado' : 'Pendiente';
    const articulos = v.detalles ? v.detalles.reduce((acc, d) => acc + (d.cantidad || 1), 0) : 1;
    return [
      `"${v.id || ''}"`,
      `"${v.fecha || ''}"`,
      `"${(v.clienteNombre || 'Cliente General').replace(/"/g, '""')}"`,
      `"${v.usuarioId || 'admin'}"`,
      (v.total || 0).toFixed(2),
      articulos,
      `"${estado}"`
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadCSV(csvContent, `reporte_ventas_${dateStr}.csv`);
}
