import Dexie from 'dexie';

export const db = new Dexie('InventarioDB');

db.version(1).stores({
  productos: 'id, codigoBarras, nombre, stock, stockMinimo, precio, categoria',
  ventas: 'id, fecha, total, syncStatus, usuarioId, clienteNombre', // syncStatus: 0 = pendiente offline, 1 = sincronizado
  ventasDetalle: 'id, ventaId, productoId, cantidad, precioUnitario',
  movimientos: 'id, productoId, tipo, cantidad, fecha, motivo',
  clientes: 'id, nombre, telefono, email'
});

// Semilla inicial de datos para demostración en primera ejecución
export async function seedInitialDataIfNeeded() {
  const count = await db.productos.count();
  if (count === 0) {
    const productosIniciales = [
      { id: 'prod-1', codigoBarras: '75010001', nombre: 'Café Espresso Gourmet 250g', stock: 45, stockMinimo: 10, precio: 12.50, categoria: 'Bebidas' },
      { id: 'prod-2', codigoBarras: '75010002', nombre: 'Agua Mineral 600ml', stock: 120, stockMinimo: 25, precio: 2.00, categoria: 'Bebidas' },
      { id: 'prod-3', codigoBarras: '75010003', nombre: 'Sandwich de Pavo y Queso', stock: 8, stockMinimo: 10, precio: 6.80, categoria: 'Alimentos' },
      { id: 'prod-4', codigoBarras: '75010004', nombre: 'Galletas Artesanales Avena', stock: 30, stockMinimo: 12, precio: 3.50, categoria: 'Snacks' },
      { id: 'prod-5', codigoBarras: '75010005', nombre: 'Jugo Natural Naranja 500ml', stock: 15, stockMinimo: 5, precio: 4.20, categoria: 'Bebidas' },
      { id: 'prod-6', codigoBarras: '75010006', nombre: 'Ensalada Caesar Pollo', stock: 5, stockMinimo: 8, precio: 8.50, categoria: 'Alimentos' },
      { id: 'prod-7', codigoBarras: '75010007', nombre: 'Muffin de Arándanos', stock: 22, stockMinimo: 6, precio: 3.00, categoria: 'Snacks' }
    ];

    const clientesIniciales = [
      { id: 'cli-1', nombre: 'Cliente General', telefono: '000-000-0000', email: 'general@pos.com' },
      { id: 'cli-2', nombre: 'María García', telefono: '555-0192', email: 'maria@ejemplo.com' },
      { id: 'cli-3', nombre: 'Juan Pérez', telefono: '555-0143', email: 'juan@ejemplo.com' }
    ];

    await db.productos.bulkAdd(productosIniciales);
    await db.clientes.bulkAdd(clientesIniciales);

    console.log('🌱 Datos iniciales sembrados con éxito en IndexedDB.');
  }
}
