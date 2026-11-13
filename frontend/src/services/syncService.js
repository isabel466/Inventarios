

import { db } from '../db/db.js';
import { loadEncryptedSession } from '../utils/cryptoStorage.js';

// Estado de red para simulación desde la interfaz.
// null = conexión real, true = online, false = offline.
let simulatedNetworkStatus = null;

export function setSimulatedNetworkStatus(status) {
  simulatedNetworkStatus = status;
}

export function getIsOnline() {
  if (simulatedNetworkStatus !== null) {
    return simulatedNetworkStatus;
  }

  return navigator.onLine;
}

/**
 * Notificación de existencias bajas.
 */
export function triggerLowStockNotification(producto) {
  if (
    'Notification' in window &&
    Notification.permission === 'granted'
  ) {
    new Notification('Alerta de Stock Bajo', {
      body: `El producto "${producto.nombre}" tiene solo ${producto.stock} unidades disponibles.`,
      icon: '/icon-192.png',
      badge: '/icon-192.png'
    });
  }
}

/**
 * Registrar una venta local en IndexedDB.
 *
 * Cada venta, detalle y movimiento pertenece a una tienda.
 * syncStatus = 0 significa pendiente de sincronización.
 *
 * La sincronización con D1 está deshabilitada temporalmente.
 */
export async function registrarVentaLocal(
  itemsVenta,
  totalVenta,
  usuario,
  clienteNombre = 'Cliente General',
  tiendaId
) {
  if (
    !tiendaId ||
    !usuario?.id ||
    usuario.tienda_id !== tiendaId
  ) {
    throw new Error(
      'No se pudo identificar al usuario o su tienda.'
    );
  }

  if (
    !Array.isArray(itemsVenta) ||
    itemsVenta.length === 0
  ) {
    throw new Error('No hay productos en el carrito.');
  }

  const ventaId = crypto.randomUUID();
  const fechaActual = new Date().toISOString();

  const alertasStock = [];
  let totalCalculado = 0;

  try {
    await db.transaction(
      'rw',
      db.ventas,
      db.ventasDetalle,
      db.productos,
      db.movimientos,
      async () => {
        const productosValidados = [];
        const cantidadesPorProducto = new Map();

        // Agrupar cantidades para evitar ventas duplicadas
        // del mismo producto dentro del carrito.
        for (const item of itemsVenta) {
          if (
            typeof item.productoId !== 'string' ||
            !Number.isSafeInteger(item.cantidad) ||
            item.cantidad <= 0
          ) {
            throw new Error(
              'El carrito contiene cantidades inválidas.'
            );
          }

          const cantidadAnterior =
            cantidadesPorProducto.get(item.productoId) || 0;

          const cantidadTotal =
            cantidadAnterior + item.cantidad;

          if (!Number.isSafeInteger(cantidadTotal)) {
            throw new Error('Cantidad de producto inválida.');
          }

          cantidadesPorProducto.set(
            item.productoId,
            cantidadTotal
          );
        }

        // Validar que todos los productos existan,
        // pertenezcan a la tienda y tengan stock suficiente.
        for (const [productoId, cantidad] of cantidadesPorProducto) {
          const producto = await db.productos.get(productoId);

          if (
            !producto ||
            producto.tiendaId !== tiendaId
          ) {
            throw new Error(
              'Un producto no pertenece a esta tienda.'
            );
          }

          if (
            !Number.isSafeInteger(producto.stock) ||
            producto.stock < cantidad
          ) {
            throw new Error(
              `Existencias insuficientes: ${producto.nombre}`
            );
          }

          if (
            !Number.isFinite(producto.precio) ||
            producto.precio < 0
          ) {
            throw new Error(
              `Precio inválido: ${producto.nombre}`
            );
          }

          totalCalculado += producto.precio * cantidad;

          productosValidados.push({
            producto,
            cantidad,
            precio: producto.precio
          });
        }

        const totalFinal =
          Math.round((totalCalculado + Number.EPSILON) * 100) / 100;

        if (
          !Number.isFinite(totalFinal) ||
          totalFinal < 0 ||
          !Number.isSafeInteger(
            Math.round(totalFinal * 100)
          )
        ) {
          throw new Error('Total de venta inválido.');
        }

        // Guardar cabecera de venta.
        await db.ventas.add({
          id: ventaId,
          tiendaId,
          fecha: fechaActual,
          total: totalFinal,
          syncStatus: 0,
          usuarioId: usuario.id,
          usuarioNombre: usuario.nombre || 'Vendedor',
          clienteNombre:
            typeof clienteNombre === 'string'
              ? clienteNombre
              : 'Cliente General'
        });

        // Guardar detalles y descontar el inventario local.
        for (const item of productosValidados) {
          const { producto, cantidad, precio } = item;

          const nuevoStock = producto.stock - cantidad;

          await db.ventasDetalle.add({
            id: crypto.randomUUID(),
            tiendaId,
            ventaId,
            productoId: producto.id,
            cantidad,
            precioUnitario: precio
          });

          await db.productos.update(producto.id, {
            stock: nuevoStock
          });

          await db.movimientos.add({
            id: crypto.randomUUID(),
            tiendaId,
            productoId: producto.id,
            tipo: 'SALIDA',
            cantidad,
            fecha: fechaActual,
            motivo: `Venta POS #${ventaId.slice(0, 8)}`
          });

          if (nuevoStock <= producto.stockMinimo) {
            alertasStock.push({
              ...producto,
              stock: nuevoStock
            });
          }
        }
      }
    );

    // Mostrar notificaciones fuera de la transacción.
    for (const producto of alertasStock) {
      try {
        triggerLowStockNotification(producto);
      } catch (error) {
        console.warn(
          'No se pudo mostrar la notificación:',
          error
        );
      }
    }

    console.log(
      'Venta guardada localmente:',
      ventaId
    );

    // No realizar envío automático todavía.
    // El backend de ventas aún no está terminado.
    return {
      success: true,
      ventaId,
      syncStatus: 0
    };

  } catch (error) {
    console.error(
      'Error al registrar venta local:',
      error
    );

    throw error;
  }
}

/**
 * Consultar ventas pendientes de la tienda autenticada.
 *
 * IMPORTANTE:
 * El envío a Cloudflare D1 está temporalmente deshabilitado.
 * No modificar syncStatus hasta recibir confirmación real.
 */
export async function sincronizarVentasPendientes() {
  const session = loadEncryptedSession();

  const token = session?.token;
  const tiendaId = session?.user?.tienda_id;

  if (!token || !tiendaId) {
    return {
      status: 'unauthorized',
      count: 0,
      message: 'Inicia sesión para sincronizar ventas.'
    };
  }

  const ventasPendientes = await db.ventas
    .where('tiendaId')
    .equals(tiendaId)
    .filter(venta => venta.syncStatus === 0)
    .toArray();

  if (!getIsOnline()) {
    return {
      status: 'offline',
      count: ventasPendientes.length,
      message: 'Las ventas permanecen guardadas localmente.'
    };
  }

  if (ventasPendientes.length === 0) {
    return {
      status: 'idle',
      count: 0,
      message: 'No hay ventas pendientes.'
    };
  }

  // La sincronización real se activará cuando el endpoint
  // /api/v1/sincronizar-ventas esté implementado y probado.
  console.log(
    `Hay ${ventasPendientes.length} ventas pendientes de la tienda actual.`
  );

  return {
    status: 'pending',
    count: ventasPendientes.length,
    message:
      'Las ventas están guardadas localmente. ' +
      'La sincronización con Cloudflare D1 todavía está deshabilitada.'
  };
}

/**
 * Escuchar cambios de conexión.
 */
export function initSyncListeners(onStatusChange) {
  const handleOnline = async () => {
    console.log('Conexión restablecida.');

    if (onStatusChange) {
      onStatusChange(true);
    }

    // Solo consulta la cola; todavía no envía ventas.
    try {
      await sincronizarVentasPendientes();
    } catch (error) {
      console.error(
        'Error consultando ventas pendientes:',
        error
      );
    }
  };

  const handleOffline = () => {
    console.log(
      'Sin conexión. Los datos permanecen en IndexedDB.'
    );

    if (onStatusChange) {
      onStatusChange(false);
    }
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}


/**
 * Sincronización MANUAL de ajustes de inventario.
 *
 * Solo para pruebas locales.
 * No se ejecuta automáticamente.
 * No sincroniza ventas.
 */
let sincronizandoInventario = false;

export async function sincronizarOperacionesInventario() {
  if (sincronizandoInventario) {
    return {
      status: 'busy',
      count: 0,
      message: 'Ya existe una sincronización en curso.'
    };
  }

  // Evitar pruebas accidentales contra producción.
  if (!['localhost', '127.0.0.1'].includes(window.location.hostname)) {
    return {
      status: 'disabled',
      count: 0,
      message: 'Solo se permiten pruebas locales.'
    };
  }

  if (!getIsOnline()) {
    return {
      status: 'offline',
      count: 0,
      message: 'No hay conexión.'
    };
  }

  const session = loadEncryptedSession();
  const token = session?.token;
  const tiendaId = session?.user?.tienda_id;

  if (!token || !tiendaId) {
    return {
      status: 'unauthorized',
      count: 0,
      message: 'Debes iniciar sesión.'
    };
  }

  sincronizandoInventario = true;
  let confirmadas = 0;

  try {
    const pendientes = await db.operacionesInventario
      .where('tiendaId')
      .equals(tiendaId)
      .filter(op => op.syncStatus === 0)
      .toArray();

    pendientes.sort((a, b) =>
      String(a.fecha).localeCompare(String(b.fecha)) ||
      String(a.id).localeCompare(String(b.id))
    );

    if (pendientes.length === 0) {
      return {
        status: 'idle',
        count: 0,
        message: 'No hay operaciones pendientes.'
      };
    }

    // Protección temporal: no mezclar ajustes y ventas
    // hasta implementar su sincronización cronológica.
    const ventasPendientes = await db.ventas
      .where('tiendaId')
      .equals(tiendaId)
      .filter(v => v.syncStatus === 0)
      .toArray();

    if (ventasPendientes.length > 0) {
      return {
        status: 'blocked',
        count: 0,
        message: 'Existen ventas pendientes. No se enviaron ajustes.'
      };
    }

    // Comprobar que los productos ya existen en D1.
    const respuestaProductos = await fetch('/api/v1/productos', {
      headers: {
        Authorization: `Bearer ${token}`
      },
      cache: 'no-store'
    });

    if (!respuestaProductos.ok) {
      return {
        status: 'error',
        count: 0,
        httpStatus: respuestaProductos.status,
        message: 'No se pudo consultar el catálogo remoto.'
      };
    }

    const productosRemotos = await respuestaProductos.json();

    if (!Array.isArray(productosRemotos)) {
      return {
        status: 'error',
        count: 0,
        message: 'Respuesta remota inválida.'
      };
    }

    const idsRemotos = new Set(
      productosRemotos.map(producto => producto.id)
    );

    if (pendientes.some(op => !idsRemotos.has(op.productoId))) {
      return {
        status: 'blocked',
        count: 0,
        message: 'Hay productos pendientes de crear en D1.'
      };
    }

    for (const operacion of pendientes) {
      // Comprobar que sigue activa la misma sesión.
      const sesionActual = loadEncryptedSession();

      if (
        sesionActual?.token !== token ||
        sesionActual?.user?.tienda_id !== tiendaId
      ) {
        return {
          status: 'unauthorized',
          count: confirmadas,
          message: 'La sesión cambió.'
        };
      }

      const respuesta = await fetch(
        '/api/v1/operaciones-inventario',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            id: operacion.id,
            productoId: operacion.productoId,
            tipo: operacion.tipo,
            cantidad: operacion.cantidad,
            stockAnterior: operacion.stockAnterior,
            stockNuevo: operacion.stockNuevo,
            motivo: operacion.motivo,
            fecha: operacion.fecha
          })
        }
      );

      if (!respuesta.ok) {
        return {
          status: respuesta.status === 409
            ? 'conflict'
            : 'error',
          count: confirmadas,
          httpStatus: respuesta.status,
          operationId: operacion.id,
          message: 'El envío se detuvo. Las operaciones restantes siguen pendientes.'
        };
      }

      const resultado = await respuesta.json();

      // Confirmar solamente el ID realmente procesado.
      if (
        resultado.status !== 'confirmed' ||
        !Array.isArray(resultado.processedIds) ||
        !resultado.processedIds.includes(operacion.id)
      ) {
        return {
          status: 'error',
          count: confirmadas,
          message: 'D1 no confirmó el identificador de la operación.'
        };
      }

      const sesionFinal = loadEncryptedSession();

      if (
        sesionFinal?.token !== token ||
        sesionFinal?.user?.tienda_id !== tiendaId
      ) {
        return {
          status: 'unauthorized',
          count: confirmadas,
          message: 'La sesión cambió antes de guardar la confirmación.'
        };
      }

      // Actualizar únicamente el registro confirmado.
      await db.transaction(
        'rw',
        db.operacionesInventario,
        async () => {
          const actual = await db.operacionesInventario
            .get(operacion.id);

          if (
            actual?.tiendaId === tiendaId &&
            actual.syncStatus === 0
          ) {
            await db.operacionesInventario.update(
              operacion.id,
              { syncStatus: 1 }
            );
          }
        }
      );

      confirmadas++;
    }

    return {
      status: 'success',
      count: confirmadas,
      message: 'Operaciones confirmadas por Cloudflare D1.'
    };

  } catch (error) {
    console.error('Error sincronizando inventario:', error);

    return {
      status: 'network_error',
      count: confirmadas,
      message: 'Las operaciones no confirmadas permanecen pendientes.'
    };

  } finally {
    sincronizandoInventario = false;
  }
}


