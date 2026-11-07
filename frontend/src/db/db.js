import Dexie from 'dexie';

export const db = new Dexie('InventarioDB');

db.version(1).stores({
  productos: 'id, codigoBarras, nombre, stock, stockMinimo, precio, categoria',
  ventas: 'id, fecha, total, syncStatus, usuarioId, clienteNombre', // syncStatus: 0 = pendiente offline, 1 = sincronizado
  ventasDetalle: 'id, ventaId, productoId, cantidad, precioUnitario',
  movimientos: 'id, productoId, tipo, cantidad, fecha, motivo',
  clientes: 'id, nombre, telefono, email'
});

// Inicialización limpia: solo cliente genérico para cobros de mostrador
export async function seedInitialDataIfNeeded() {
  const count = await db.clientes.count();
  if (count === 0) {
    await db.clientes.add({
      id: 'cli-default',
      nombre: 'Público General',
      telefono: '',
      email: ''
    });
  }
}
