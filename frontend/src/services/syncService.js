import { db } from '../db/db.js';

// Estado global para simulación de red (override manual desde la UI)
let simulatedNetworkStatus = null; // null = usa navigator.onLine, true = forzar online, false = forzar offline

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
 * Notificación nativa de navegador para alerta de stock bajo
 */
export function triggerLowStockNotification(producto) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('⚠️ Alerta de Stock Bajo', {
      body: `El producto "${producto.nombre}" tiene solo ${producto.stock} unidades disponibles.`,
      icon: '/icon-192.png',
      badge: '/icon-192.png'
    });
  }
}

/**
 * Registrar una Venta en IndexedDB (Modo Offline-First con Escritura Optimista)
 */
export async function registrarVentaLocal(itemsVenta, totalVenta, usuario = { id: 'usr-1', nombre: 'Vendedor' }, clienteNombre = 'Cliente General') {
  const ventaId = crypto.randomUUID();
  const fechaActual = new Date().toISOString();

  try {
    await db.transaction('rw', db.ventas, db.ventasDetalle, db.productos, db.movimientos, async () => {
      // 1. Guardar cabecera de la venta en IndexedDB (syncStatus = 0: PENDIENTE)
      await db.ventas.add({
        id: ventaId,
        fecha: fechaActual,
        total: parseFloat(totalVenta.toFixed(2)),
        syncStatus: 0,
        usuarioId: usuario.id || 'usr-1',
        usuarioNombre: usuario.nombre || 'Vendedor',
        clienteNombre: clienteNombre
      });

      // 2. Guardar detalles y realizar actualización optimista de stock
      for (const item of itemsVenta) {
        const detalleId = crypto.randomUUID();
        await db.ventasDetalle.add({
          id: detalleId,
          ventaId: ventaId,
          productoId: item.productoId,
          cantidad: item.cantidad,
          precioUnitario: item.precio
        });

        // Registrar movimiento de salida
        await db.movimientos.add({
          id: crypto.randomUUID(),
          productoId: item.productoId,
          tipo: 'SALIDA',
          cantidad: item.cantidad,
          fecha: fechaActual,
          motivo: `Venta POS #${ventaId.slice(0, 8)}`
        });

        // Actualización optimista de stock en IndexedDB
        const producto = await db.productos.get(item.productoId);
        if (producto) {
          const nuevoStock = Math.max(0, producto.stock - item.cantidad);
          await db.productos.update(item.productoId, { stock: nuevoStock });

          // Verificar si el stock cae por debajo del mínimo para lanzar alerta
          if (nuevoStock <= producto.stockMinimo) {
            triggerLowStockNotification({ ...producto, stock: nuevoStock });
          }
        }
      }
    });

    console.log('✅ Venta registrada localmente en IndexedDB con éxito. ID:', ventaId);

    // Intentar sincronizar inmediatamente si hay conexión
    if (getIsOnline()) {
      sincronizarVentasPendientes();
    }

    return { success: true, ventaId };
  } catch (error) {
    console.error('❌ Error al registrar la venta local:', error);
    throw error;
  }
}

/**
 * Motor de Sincronización Batch de Ventas Pendientes (IndexedDB -> Backend Server)
 */
export async function sincronizarVentasPendientes() {
  if (!getIsOnline()) {
    console.log('🔌 Dispositivo sin conexión. La sincronización se mantiene en cola.');
    return { status: 'offline', count: 0 };
  }

  // 1. Obtener todas las ventas pendientes de envío (syncStatus = 0)
  const ventasPendientes = await db.ventas
    .where('syncStatus')
    .equals(0)
    .toArray();

  if (ventasPendientes.length === 0) {
    console.log('🔄 No hay ventas pendientes por sincronizar.');
    return { status: 'idle', count: 0 };
  }

  console.log(`📡 Iniciando sincronización por lote de ${ventasPendientes.length} ventas...`);

  // 2. Estructurar el paquete de datos con sus detalles
  const payload = await Promise.all(
    ventasPendientes.map(async (venta) => {
      const detalles = await db.ventasDetalle
        .where('ventaId')
        .equals(venta.id)
        .toArray();

      return {
        ...venta,
        detalles
      };
    })
  );

  try {
    const token = localStorage.getItem('pos_jwt_token') || '';
    
    // 3. Enviar todo el lote al servidor backend
    const response = await fetch('/api/v1/sincronizar-ventas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ ventas: payload })
    });

    if (response.ok) {
      const resultado = await response.json();

      // 4. Marcar las ventas enviadas como sincronizadas (syncStatus = 1)
      await db.transaction('rw', db.ventas, async () => {
        for (const venta of ventasPendientes) {
          await db.ventas.update(venta.id, { syncStatus: 1 });
        }
      });

      console.log('🎉 Sincronización completada exitosamente. IDs procesados:', resultado.processedIds);
      return { status: 'success', count: ventasPendientes.length, result: resultado };
    } else {
      console.warn('⚠️ El servidor devolvió un error al sincronizar:', response.statusText);
      return { status: 'error', message: response.statusText };
    }
  } catch (error) {
    console.error('❌ Falló la conexión durante la sincronización:', error);
    return { status: 'network_error', error: error.message };
  }
}

/**
 * Escuchador automático del evento 'online'
 */
export function initSyncListeners(onStatusChange) {
  const handleOnline = async () => {
    console.log('🌐 Conexión restablecida (Evento Online). Disparando sincronización...');
    if (onStatusChange) onStatusChange(true);
    await sincronizarVentasPendientes();
  };

  const handleOffline = () => {
    console.log('🔌 Conexión perdida (Evento Offline). Se activó modo almacenamiento local.');
    if (onStatusChange) onStatusChange(false);
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}
