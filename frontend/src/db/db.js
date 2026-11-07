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
    // 1. Eliminar los productos demo ficticios si existen en el IndexedDB local del navegador
    const demoIds = ['prod-1', 'prod-2', 'prod-3', 'prod-4', 'prod-5', 'prod-6', 'prod-7'];
    await db.productos.where('id').anyOf(demoIds).delete();

    // 2. Eliminar ventas y movimientos de prueba antiguos asociados a los demo
    await db.ventasDetalle.where('productoId').anyOf(demoIds).delete();

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
