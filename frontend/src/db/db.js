import Dexie from 'dexie';

export const db = new Dexie('InventarioDB');

db.version(1).stores({
  productos: 'id, codigoBarras, nombre, stock, stockMinimo, precio, categoria',
  ventas: 'id, fecha, total, syncStatus, usuarioId, clienteNombre', // syncStatus: 0 = pendiente offline, 1 = sincronizado
  ventasDetalle: 'id, ventaId, productoId, cantidad, precioUnitario',
  movimientos: 'id, productoId, tipo, cantidad, fecha, motivo',
  clientes: 'id, nombre, telefono, email'
});

// Purga automática de registros ficticios antiguos del navegador del usuario
export async function seedInitialDataIfNeeded() {
  try {
    // 1. Eliminar los productos demo ficticios por ID y por código de barras
    const demoIds = ['prod-1', 'prod-2', 'prod-3', 'prod-4', 'prod-5', 'prod-6', 'prod-7'];
    const demoBarcodes = ['75010001', '75010002', '75010003', '75010004', '75010005', '75010006', '75010007'];
    
    await db.productos.bulkDelete(demoIds);
    await db.productos.where('codigoBarras').anyOf(demoBarcodes).delete();

    // 2. Eliminar ventas y movimientos de prueba antiguos asociados a los demo
    await db.ventasDetalle.where('productoId').anyOf(demoIds).delete();
    await db.clientes.bulkDelete(['cli-1', 'cli-2', 'cli-3']);

    // 3. Asegurar cliente genérico para cobros rápidos de mostrador
    const count = await db.clientes.count();
    if (count === 0) {
      await db.clientes.add({
        id: 'cli-default',
        nombre: 'Público General',
        telefono: '',
        email: ''
      });
    }
    console.log('✅ Base de datos IndexedDB purgada de registros demo ficticios.');
  } catch (err) {
    console.error('Error al purgar datos demo de IndexedDB:', err);
  }
}
