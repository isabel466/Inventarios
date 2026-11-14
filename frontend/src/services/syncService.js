

import { db } from '../db/db.js';
import { loadEncryptedSession } from '../utils/cryptoStorage.js';

// Estado de red para simulaciÃ³n desde la interfaz.
// null = conexiÃ³n real, true = online, false = offline.
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
 * NotificaciÃ³n de existencias bajas.
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
 * syncStatus = 0 significa pendiente de sincronizaciÃ³n.
 *
 * La sincronizaciÃ³n con D1 estÃ¡ deshabilitada temporalmente.
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
              'El carrito contiene cantidades invÃ¡lidas.'
            );
          }

          const cantidadAnterior =
            cantidadesPorProducto.get(item.productoId) || 0;

          const cantidadTotal =
            cantidadAnterior + item.cantidad;

          if (!Number.isSafeInteger(cantidadTotal)) {
            throw new Error('Cantidad de producto invÃ¡lida.');
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
              `Precio invÃ¡lido: ${producto.nombre}`
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
          throw new Error('Total de venta invÃ¡lido.');
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

    // Mostrar notificaciones fuera de la transacciÃ³n.
    for (const producto of alertasStock) {
      try {
        triggerLowStockNotification(producto);
      } catch (error) {
        console.warn(
          'No se pudo mostrar la notificaciÃ³n:',
          error
        );
      }
    }

    console.log(
      'Venta guardada localmente:',
      ventaId
    );

    // No realizar envÃ­o automÃ¡tico todavÃ­a.
    // El backend de ventas aÃºn no estÃ¡ terminado.
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
 * El envÃ­o a Cloudflare D1 estÃ¡ temporalmente deshabilitado.
 * No modificar syncStatus hasta recibir confirmaciÃ³n real.
 */
export async function sincronizarVentasPendientes() {
  const session = loadEncryptedSession();

  const token = session?.token;
  const tiendaId = session?.user?.tienda_id;

  if (!token || !tiendaId) {
    return {
      status: 'unauthorized',
      count: 0,
      message: 'Inicia sesiÃ³n para sincronizar ventas.'
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

  // La sincronizaciÃ³n real se activarÃ¡ cuando el endpoint
  // /api/v1/sincronizar-ventas estÃ© implementado y probado.
  console.log(
    `Hay ${ventasPendientes.length} ventas pendientes de la tienda actual.`
  );

  return {
    status: 'pending',
    count: ventasPendientes.length,
    message:
      'Las ventas estÃ¡n guardadas localmente. ' +
      'La sincronizaciÃ³n con Cloudflare D1 todavÃ­a estÃ¡ deshabilitada.'
  };
}

/**
 * Escuchar cambios de conexiÃ³n.
 */
export function initSyncListeners(onStatusChange) {
  const handleOnline = async () => {
    console.log('ConexiÃ³n restablecida.');

    if (onStatusChange) {
      onStatusChange(true);
    }

    // Sincronizar productos pendientes al recuperar internet.
    try {
      const resultado = await sincronizarProductosPendientes();
      console.log('Sincronización automática de productos:', resultado);
    } catch (error) {
      console.error('Error sincronizando productos:', error);
    }

    // Solo consulta la cola; todavÃ­a no envÃ­a ventas.
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
      'Sin conexiÃ³n. Los datos permanecen en IndexedDB.'
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
 * SincronizaciÃ³n MANUAL de ajustes de inventario.
 *
 * Solo para pruebas locales.
 * No se ejecuta automÃ¡ticamente.
 * No sincroniza ventas.
 */
let sincronizandoInventario = false;

export async function sincronizarOperacionesInventario() {
  if (sincronizandoInventario) {
    return {
      status: 'busy',
      count: 0,
      message: 'Ya existe una sincronizaciÃ³n en curso.'
    };
  }

  // Evitar pruebas accidentales contra producciÃ³n.
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
      message: 'No hay conexiÃ³n.'
    };
  }

  const session = loadEncryptedSession();
  const token = session?.token;
  const tiendaId = session?.user?.tienda_id;

  if (!token || !tiendaId) {
    return {
      status: 'unauthorized',
      count: 0,
      message: 'Debes iniciar sesiÃ³n.'
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

    // ProtecciÃ³n temporal: no mezclar ajustes y ventas
    // hasta implementar su sincronizaciÃ³n cronolÃ³gica.
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
        message: 'No se pudo consultar el catÃ¡logo remoto.'
      };
    }

    const productosRemotos = await respuestaProductos.json();

    if (!Array.isArray(productosRemotos)) {
      return {
        status: 'error',
        count: 0,
        message: 'Respuesta remota invÃ¡lida.'
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
      // Comprobar que sigue activa la misma sesiÃ³n.
      const sesionActual = loadEncryptedSession();

      if (
        sesionActual?.token !== token ||
        sesionActual?.user?.tienda_id !== tiendaId
      ) {
        return {
          status: 'unauthorized',
          count: confirmadas,
          message: 'La sesiÃ³n cambiÃ³.'
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
          message: 'El envÃ­o se detuvo. Las operaciones restantes siguen pendientes.'
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
          message: 'D1 no confirmÃ³ el identificador de la operaciÃ³n.'
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
          message: 'La sesiÃ³n cambiÃ³ antes de guardar la confirmaciÃ³n.'
        };
      }

      // Actualizar Ãºnicamente el registro confirmado.
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

/**
 * Sincronizar productos pendientes con Cloudflare D1.
 * Conserva el identificador y el stock inicial.
 */
let sincronizandoProductos = false;

export async function sincronizarProductosPendientes() {
  if (sincronizandoProductos) {
    return { ok: false, motivo: 'SincronizaciÃ³n en curso' };
  }

  // Por ahora, solo permitir pruebas con la API local.
  if (!['localhost', '127.0.0.1'].includes(window.location.hostname)) {
    return { ok: false, motivo: 'Solo disponible en desarrollo local' };
  }

  const sesion = loadEncryptedSession();
  const tiendaId = sesion?.user?.tienda_id;

  if (!sesion?.token || !tiendaId) {
    return { ok: false, motivo: 'No hay sesiÃ³n activa' };
  }

  if (!navigator.onLine || !getIsOnline()) {
    return { ok: false, motivo: 'Sin conexiÃ³n' };
  }

  sincronizandoProductos = true;

  try {
    // No sincronizar productos mientras existan ventas
    // locales pendientes: todavÃ­a no hay sincronizaciÃ³n
    // segura de ventas.
    const ventasPendientes = await db.ventas
      .where('tiendaId')
      .equals(tiendaId)
      .filter(v => v.syncStatus === 0)
      .count();

    if (ventasPendientes > 0) {
      return {
        ok: false,
        motivo: 'Hay ventas pendientes de sincronizaciÃ³n'
      };
    }

    const productos = await db.productos
      .where('tiendaId')
      .equals(tiendaId)
      .filter(p => p.syncStatus === 0)
      .toArray();

    let sincronizados = 0;
    const errores = [];

    for (const producto of productos) {
      if (
        !producto.id ||
        !Number.isSafeInteger(producto.stockInicial) ||
        producto.stockInicial < 0
      ) {
        errores.push({
          producto: producto.nombre,
          motivo: 'Stock inicial o identificador invÃ¡lido'
        });
        continue;
      }

      try {
        const respuesta = await fetch('/api/v1/productos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sesion.token}`
          },
          body: JSON.stringify({
            ...producto,
            stock: producto.stockInicial
          })
        });

        if (!respuesta.ok) {
          errores.push({
            producto: producto.nombre,
            http: respuesta.status
          });

          if ([401, 403].includes(respuesta.status)) {
            break;
          }

          continue;
        }

        // El servidor confirma el producto.
        // Los ajustes pendientes se sincronizan por separado.
        await db.transaction(
          'rw',
          db.productos,
          db.operacionesInventario,
          async () => {
            const actual = await db.productos.get(producto.id);

            if (!actual || actual.tiendaId !== tiendaId) {
              return;
            }

            const operacionesPendientes =
              await db.operacionesInventario
                .where('productoId')
                .equals(producto.id)
                .filter(o => o.syncStatus === 0)
                .count();

            // Si hay ajustes pendientes, conservar el
            // estado local hasta sincronizarlos.
            if (operacionesPendientes === 0) {
              await db.productos.update(producto.id, {
                syncStatus: 1
              });
            }
          }
        );

        sincronizados++;
        console.log('Producto confirmado en D1:', producto.nombre);
      } catch (error) {
        errores.push({
          producto: producto.nombre,
          motivo: error.message
        });
      }
    }

    return {
      ok: errores.length === 0,
      sincronizados,
      errores
    };
  } finally {
    sincronizandoProductos = false;
  }
}
