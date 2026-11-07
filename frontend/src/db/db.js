import Dexie from 'dexie';

export const db = new Dexie('InventarioDB');

db.version(1).stores({
  productos: 'id, codigoBarras, nombre, stock, stockMinimo, precio, categoria',
  ventas: 'id, fecha, total, syncStatus, usuarioId, clienteNombre', // syncStatus: 0 = pendiente offline, 1 = sincronizado
  ventasDetalle: 'id, ventaId, productoId, cantidad, precioUnitario',
  movimientos: 'id, productoId, tipo, cantidad, fecha, motivo',
  clientes: 'id, nombre, telefono, email'
});

// Purga completa de registros locales a solicitud del usuario o en mantenimiento
export async function limpiarTodosLosRegistrosLocales() {
  try {
    await db.productos.clear();
    await db.ventas.clear();
    await db.ventasDetalle.clear();
    await db.movimientos.clear();
    await db.clientes.clear();

    await db.clientes.add({
      id: 'cli-default',
      nombre: 'Público General',
      telefono: '',
      email: ''
    });

    console.log('🧹 Base de datos IndexedDB limpiada por completo (0 productos, 0 ventas).');
  } catch (err) {
    console.error('Error al limpiar base de datos local:', err);
  }
}

// Inicialización de la base de datos en estado limpio para producción
export async function seedInitialDataIfNeeded() {
  try {
    // Si aún no se ha ejecutado la purga general definitiva:
    if (!localStorage.getItem('pos_records_cleaned_v3')) {
      await limpiarTodosLosRegistrosLocales();
      localStorage.setItem('pos_records_cleaned_v3', 'true');
    }

    // Asegurar cliente genérico para cobros rápidos de mostrador
    const count = await db.clientes.count();
    if (count === 0) {
      await db.clientes.add({
        id: 'cli-default',
        nombre: 'Público General',
        telefono: '',
        email: ''
      });
    }
    console.log('✅ Base de datos IndexedDB lista y en estado limpio.');
  } catch (err) {
    console.error('Error al inicializar IndexedDB:', err);
  }
}
