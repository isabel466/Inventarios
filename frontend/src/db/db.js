import Dexie from 'dexie';


export const db = new Dexie('InventarioDB');

db.version(1).stores({
  productos: 'id, codigoBarras, nombre, stock, stockMinimo, precio, categoria',
  ventas: 'id, fecha, total, syncStatus, usuarioId, clienteNombre',
  ventasDetalle: 'id, ventaId, productoId, cantidad, precioUnitario',
  movimientos: 'id, productoId, tipo, cantidad, fecha, motivo',
  clientes: 'id, nombre, telefono, email'
});

db.version(2).stores({
  productos: 'id, codigoBarras, nombre, stock, stockMinimo, precio, categoria, tiendaId',
  ventas: 'id, fecha, total, syncStatus, usuarioId, clienteNombre, tiendaId',
  ventasDetalle: 'id, ventaId, productoId, cantidad, precioUnitario, tiendaId',
  movimientos: 'id, productoId, tipo, cantidad, fecha, motivo, tiendaId',
  clientes: 'id, nombre, telefono, email, tiendaId'
});


db.version(3).stores({
  productos:
    'id, codigoBarras, nombre, stock, stockMinimo, precio, categoria, tiendaId, syncStatus',

  ventas:
    'id, fecha, total, syncStatus, usuarioId, clienteNombre, tiendaId',

  ventasDetalle:
    'id, ventaId, productoId, cantidad, precioUnitario, tiendaId',

  movimientos:
    'id, productoId, tipo, cantidad, fecha, motivo, tiendaId',

  clientes:
    'id, nombre, telefono, email, tiendaId'
});


db.version(4).stores({
  productos:
    'id, codigoBarras, nombre, stock, stockMinimo, precio, categoria, tiendaId, syncStatus',

  ventas:
    'id, fecha, total, syncStatus, usuarioId, clienteNombre, tiendaId',

  ventasDetalle:
    'id, ventaId, productoId, cantidad, precioUnitario, tiendaId',

  movimientos:
    'id, productoId, tipo, cantidad, fecha, motivo, tiendaId',

  clientes:
    'id, nombre, telefono, email, tiendaId',

  operacionesInventario:
    'id, tiendaId, productoId, tipo, syncStatus, fecha'
});


/**
 * Versión 5: recuperar el stock inicial de productos antiguos.
 *
 * Solo utiliza el movimiento "Inventario Inicial"
 * cuando hay exactamente uno y pertenece a la misma tienda.
 *
 * No modifica las existencias actuales.
 * No elimina registros.
 */
db.version(5).stores({}).upgrade(async (tx) => {
  const tablaProductos = tx.table('productos');
  const tablaMovimientos = tx.table('movimientos');

  const productos = await tablaProductos.toArray();

  for (const producto of productos) {
    // Respetar los productos que ya tienen stock inicial.
    if (
      Number.isSafeInteger(producto.stockInicial) &&
      producto.stockInicial >= 0
    ) {
      continue;
    }

    // No asignar datos de productos sin tienda identificada.
    if (!producto.tiendaId) {
      continue;
    }

    const movimientos = await tablaMovimientos
      .where('productoId')
      .equals(producto.id)
      .toArray();

    const iniciales = movimientos.filter((movimiento) =>
      movimiento.tiendaId === producto.tiendaId &&
      movimiento.motivo === 'Inventario Inicial' &&
      movimiento.tipo === 'ENTRADA' &&
      Number.isSafeInteger(movimiento.cantidad) &&
      movimiento.cantidad >= 0
    );

    // Si no existe un único registro fiable,
    // dejar el producto sin modificar para revisión.
    if (iniciales.length !== 1) {
      continue;
    }

    await tablaProductos.update(producto.id, {
      stockInicial: iniciales[0].cantidad
    });
  }
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

    console.log(' Base de datos IndexedDB limpiada por completo (0 productos, 0 ventas).');
  } catch (err) {
    console.error('Error al limpiar base de datos local:', err);
  }
}

// Inicialización de la base de datos en estado limpio para producción


export async function seedInitialDataIfNeeded(tiendaId) {
  if (!tiendaId) {
    console.warn('No se puede inicializar sin tiendaId.');
    return;
  }

  try {
    const clienteId = `cli-default-${tiendaId}`;

    const clienteExistente = await db.clientes.get(clienteId);

    if (!clienteExistente) {
      await db.clientes.add({
        id: clienteId,
        tiendaId,
        nombre: 'Público General',
        telefono: '',
        email: ''
      });
    }

    console.log(
      'Cliente Público General preparado para la tienda.'
    );
  } catch (error) {
    console.error(
      'Error al inicializar clientes de la tienda:',
      error
    );
    throw error;
  }
}
