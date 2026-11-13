

import { requireAuth } from '../../lib/auth.js';

export async function onRequestPost({ request, env }) {
  const auth = await requireAuth(request, env);

  if (auth.error) {
    return auth.error;
  }

  if (!['admin', 'almacen'].includes(auth.user.role)) {
    return Response.json(
      { error: 'No tienes permiso para ajustar inventario' },
      { status: 403 }
    );
  }

  if (!auth.user.tienda_id) {
    return Response.json(
      { error: 'Usuario sin tienda asignada' },
      { status: 403 }
    );
  }

  let data;

  try {
    data = await request.json();
  } catch {
    return Response.json(
      { error: 'Se requiere un JSON válido' },
      { status: 400 }
    );
  }

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return Response.json(
      { error: 'Datos de operación inválidos' },
      { status: 400 }
    );
  }

  const {
    id,
    productoId,
    tipo,
    cantidad,
    stockAnterior
  } = data;

  if (
    typeof id !== 'string' ||
    !/^[a-zA-Z0-9_-]{1,100}$/.test(id) ||
    typeof productoId !== 'string' ||
    !/^[a-zA-Z0-9_-]{1,100}$/.test(productoId) ||
    !['ENTRADA', 'SALIDA'].includes(tipo) ||
    !Number.isSafeInteger(cantidad) ||
    cantidad <= 0 ||
    !Number.isSafeInteger(stockAnterior) ||
    stockAnterior < 0
  ) {
    return Response.json(
      { error: 'Datos de operación inválidos' },
      { status: 400 }
    );
  }

  const tiendaId = auth.user.tienda_id;

  const delta =
    tipo === 'ENTRADA' ? cantidad : -cantidad;

  const stockNuevo = stockAnterior + delta;

  if (
    !Number.isSafeInteger(stockNuevo) ||
    stockNuevo < 0
  ) {
    return Response.json(
      { error: 'El ajuste produciría un stock inválido' },
      { status: 400 }
    );
  }

  // Comprobar también el valor enviado por el cliente,
  // cuando esté presente.
  if (
    data.stockNuevo !== undefined &&
    data.stockNuevo !== stockNuevo
  ) {
    return Response.json(
      { error: 'El stock nuevo no coincide con la operación' },
      { status: 400 }
    );
  }

  const motivo =
    typeof data.motivo === 'string'
      ? data.motivo.trim().slice(0, 500)
      : '';

  const fecha =
    typeof data.fecha === 'string' &&
    !Number.isNaN(Date.parse(data.fecha))
      ? data.fecha
      : new Date().toISOString();

  // Verifica que un reintento tenga los mismos
  // datos esenciales de la operación original.
  const esMismaOperacion = (registro) =>
    registro &&
    registro.tienda_id === tiendaId &&
    registro.producto_id === productoId &&
    registro.tipo === tipo &&
    registro.cantidad === cantidad &&
    registro.stock_anterior === stockAnterior &&
    registro.stock_nuevo === stockNuevo;

  const buscarExistente = async () => {
    return env.DB.prepare(`
      SELECT
        id,
        tienda_id,
        producto_id,
        tipo,
        cantidad,
        stock_anterior,
        stock_nuevo
      FROM operaciones_inventario
      WHERE id = ?
    `).bind(id).first();
  };

  try {
    const existente = await buscarExistente();

    if (existente) {
      if (!esMismaOperacion(existente)) {
        return Response.json(
          { error: 'El ID pertenece a otra operación' },
          { status: 409 }
        );
      }

      return Response.json({
        status: 'confirmed',
        processedIds: [id],
        alreadyProcessed: true,
        stockNuevo: existente.stock_nuevo
      });
    }

    // IMPORTANTE:
    // El trigger de D1 valida el stock y aplica
    // el cambio automáticamente al insertar.
    //
    // No realizar un UPDATE adicional aquí.

    await env.DB.prepare(`
      INSERT INTO operaciones_inventario (
        id,
        tienda_id,
        producto_id,
        tipo,
        cantidad,
        stock_anterior,
        stock_nuevo,
        motivo,
        fecha
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      tiendaId,
      productoId,
      tipo,
      cantidad,
      stockAnterior,
      stockNuevo,
      motivo,
      fecha
    ).run();

    return Response.json({
      status: 'confirmed',
      processedIds: [id],
      stockNuevo
    });

  } catch (error) {
    console.error('Error procesando ajuste:', error);

    // Si dos solicitudes con el mismo ID llegan
    // casi simultáneamente, comprobar si una
    // de ellas ya confirmó la operación.
    try {
      const existente = await buscarExistente();

      if (existente) {
        if (!esMismaOperacion(existente)) {
          return Response.json(
            { error: 'El ID pertenece a otra operación' },
            { status: 409 }
          );
        }

        return Response.json({
          status: 'confirmed',
          processedIds: [id],
          alreadyProcessed: true,
          stockNuevo: existente.stock_nuevo
        });
      }
    } catch (consultaError) {
      console.error(
        'Error verificando operación existente:',
        consultaError
      );

      return Response.json(
        { error: 'No se pudo verificar la operación' },
        { status: 503 }
      );
    }

    const mensaje = String(error?.message ?? '');

    if (mensaje.includes('STOCK_CONFLICT')) {
      return Response.json(
        {
          error:
            'Conflicto de inventario. ' +
            'Consulta el stock actualizado antes de reintentar.'
        },
        { status: 409 }
      );
    }

    return Response.json(
      { error: 'No se pudo confirmar el ajuste de inventario' },
      { status: 500 }
    );
  }
}

