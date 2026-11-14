
import { requireAuth } from '../../lib/auth.js';

const dinero = (valor) => Math.round(valor * 100);

export async function onRequestPost({ request, env }) {
  const auth = await requireAuth(request, env);
  if (auth.error) return auth.error;

  if (!['admin', 'vendedor'].includes(auth.user.role)) {
    return Response.json(
      { error: 'Sin permiso para sincronizar ventas' },
      { status: 403 }
    );
  }

  let datos;
  try {
    datos = await request.json();
  } catch {
    return Response.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const { venta, detalles } = datos ?? {};
  const tiendaId = auth.user.tienda_id;

  if (
    !tiendaId ||
    !venta ||
    typeof venta.id !== 'string' ||
    venta.id.length > 100 ||
    !venta.id ||
    typeof venta.fecha !== 'string' ||
    !Number.isFinite(Date.parse(venta.fecha)) ||
    !Array.isArray(detalles) ||
    detalles.length < 1 ||
    detalles.length > 100 ||
    !Number.isFinite(venta.total) ||
    venta.total < 0 ||
    !Number.isSafeInteger(dinero(venta.total)) ||
    venta.tiendaId !== tiendaId ||
    venta.usuarioId !== auth.user.id
  ) {
    return Response.json(
      { error: 'Datos de venta inválidos' },
      { status: 400 }
    );
  }

  const ids = new Set();
  let totalCentavos = 0;

  for (const d of detalles) {
    if (
      !d ||
      typeof d.id !== 'string' ||
      !d.id ||
      d.id.length > 100 ||
      ids.has(d.id) ||
      d.ventaId !== venta.id ||
      d.tiendaId !== tiendaId ||
      typeof d.productoId !== 'string' ||
      !d.productoId ||
      !Number.isSafeInteger(d.cantidad) ||
      d.cantidad <= 0 ||
      !Number.isFinite(d.precioUnitario) ||
      d.precioUnitario < 0 ||
      !Number.isSafeInteger(dinero(d.precioUnitario))
    ) {
      return Response.json(
        { error: 'Detalle de venta inválido' },
        { status: 400 }
      );
    }

    ids.add(d.id);
    totalCentavos += dinero(d.precioUnitario) * d.cantidad;
  }

  if (
    !Number.isSafeInteger(totalCentavos) ||
    totalCentavos !== dinero(venta.total)
  ) {
    return Response.json(
      { error: 'El total no coincide con los detalles' },
      { status: 400 }
    );
  }

  const confirmarExistente = async () => {
    const existente = await env.DB.prepare(`
      SELECT id, fecha, total, usuarioId, clienteNombre, tienda_id
      FROM ventas WHERE id = ?
    `).bind(venta.id).first();

    if (!existente) return null;

    if (
      existente.tienda_id !== tiendaId ||
      existente.usuarioId !== auth.user.id ||
      existente.fecha !== venta.fecha ||
      dinero(existente.total) !== totalCentavos ||
      existente.clienteNombre !==
        (venta.clienteNombre || 'Cliente General')
    ) {
      return Response.json(
        { error: 'Conflicto: el folio pertenece a otra venta' },
        { status: 409 }
      );
    }

    const { results } = await env.DB.prepare(`
      SELECT id, ventaId, productoId, cantidad,
             precioUnitario, subtotal, tienda_id
      FROM ventas_detalle WHERE ventaId = ?
    `).bind(venta.id).all();

    const guardados = new Map(results.map(d => [d.id, d]));

    const coinciden =
      guardados.size === detalles.length &&
      detalles.every(d => {
        const g = guardados.get(d.id);
        return g &&
          g.ventaId === venta.id &&
          g.tienda_id === tiendaId &&
          g.productoId === d.productoId &&
          g.cantidad === d.cantidad &&
          dinero(g.precioUnitario) === dinero(d.precioUnitario) &&
          dinero(g.subtotal) ===
            dinero(d.precioUnitario) * d.cantidad;
      });

    if (!coinciden) {
      return Response.json(
        { error: 'Conflicto: detalles diferentes' },
        { status: 409 }
      );
    }

    return Response.json({
      status: 'confirmed',
      alreadyProcessed: true,
      processedIds: [venta.id]
    });
  };

  try {
    const anterior = await confirmarExistente();
    if (anterior) return anterior;

    const statements = [
      env.DB.prepare(`
        INSERT INTO ventas
          (id, fecha, total, usuarioId, clienteNombre, tienda_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        venta.id,
        venta.fecha,
        totalCentavos / 100,
        auth.user.id,
        venta.clienteNombre || 'Cliente General',
        tiendaId
      )
    ];

    for (const d of detalles) {
      const subtotal =
        dinero(d.precioUnitario) * d.cantidad / 100;

      statements.push(
        env.DB.prepare(`
          INSERT INTO ventas_detalle
            (id, ventaId, productoId, cantidad,
             precioUnitario, subtotal, tienda_id)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
          d.id,
          venta.id,
          d.productoId,
          d.cantidad,
          dinero(d.precioUnitario) / 100,
          subtotal,
          tiendaId
        )
      );
    }

    await env.DB.batch(statements);

    return Response.json({
      status: 'confirmed',
      alreadyProcessed: false,
      processedIds: [venta.id]
    });

  } catch (error) {
    // Una petición concurrente podría haber registrado
    // el mismo folio. Comprobar antes de responder.
    try {
      const anterior = await confirmarExistente();
      if (anterior) return anterior;
    } catch (verificacionError) {
      console.error('Error verificando venta:', verificacionError);
    }

    console.error('Error registrando venta en D1:', error);

    return Response.json(
      {
        error: 'No se pudo confirmar la venta',
        processedIds: []
      },
      { status: 409 }
    );
  }
}
