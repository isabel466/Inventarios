
import { requireAuth } from '../../lib/auth.js';

// GET: consultar productos únicamente de la tienda autenticada.
export async function onRequestGet({ request, env }) {
  const auth = await requireAuth(request, env);
  if (auth.error) return auth.error;

  try {
    const { results } = await env.DB.prepare(`
      SELECT *
      FROM productos
      WHERE tienda_id = ?
      ORDER BY nombre ASC
    `).bind(auth.user.tienda_id).all();

    return Response.json(results ?? []);
  } catch (error) {
    console.error('Error consultando productos:', error);

    return Response.json(
      { error: 'No se pudieron obtener productos' },
      { status: 500 }
    );
  }
}

// POST: crear productos o actualizar sus datos descriptivos.
// El stock de un producto existente NO se sobrescribe.
export async function onRequestPost({ request, env }) {
  const auth = await requireAuth(request, env);
  if (auth.error) return auth.error;

  if (!['admin', 'almacen'].includes(auth.user.role)) {
    return Response.json(
      { error: 'No tienes permisos para gestionar productos' },
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
      { error: 'Datos de producto inválidos' },
      { status: 400 }
    );
  }

  const id =
    typeof data.id === 'string' ? data.id.trim() : '';

  const codigoBarras =
    typeof data.codigoBarras === 'string'
      ? data.codigoBarras.trim()
      : '';

  const nombre =
    typeof data.nombre === 'string'
      ? data.nombre.trim()
      : '';

  const categoria =
    typeof data.categoria === 'string' && data.categoria.trim()
      ? data.categoria.trim()
      : 'General';

  const stock = Number(data.stock ?? 0);
  const stockMinimo = Number(data.stockMinimo ?? 5);
  const precio = Number(data.precio ?? 0);

  if (
    !/^[a-zA-Z0-9_-]{1,100}$/.test(id) ||
    !codigoBarras ||
    codigoBarras.length > 150 ||
    !nombre ||
    nombre.length > 200 ||
    categoria.length > 100 ||
    !Number.isSafeInteger(stock) ||
    stock < 0 ||
    !Number.isSafeInteger(stockMinimo) ||
    stockMinimo < 0 ||
    !Number.isFinite(precio) ||
    precio < 0
  ) {
    return Response.json(
      { error: 'Datos de producto inválidos' },
      { status: 400 }
    );
  }

  const tiendaId = auth.user.tienda_id;

  if (!tiendaId) {
    return Response.json(
      { error: 'El usuario no tiene una tienda asignada' },
      { status: 403 }
    );
  }

  try {
    // Al crear un producto se conserva su ID local.
    // Al actualizarlo NO se modifica su stock.
    const resultado = await env.DB.prepare(`
      INSERT INTO productos (
        id,
        codigoBarras,
        nombre,
        stock,
        stockMinimo,
        precio,
        categoria,
        tienda_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)

      ON CONFLICT(id) DO UPDATE SET
        codigoBarras = excluded.codigoBarras,
        nombre = excluded.nombre,
        stockMinimo = excluded.stockMinimo,
        precio = excluded.precio,
        categoria = excluded.categoria,
        actualizado_en = CURRENT_TIMESTAMP

      WHERE productos.tienda_id = excluded.tienda_id
    `).bind(
      id,
      codigoBarras,
      nombre,
      stock,
      stockMinimo,
      precio,
      categoria,
      tiendaId
    ).run();

    if (resultado.meta?.changes !== 1) {
      return Response.json(
        {
          error:
            'No se pudo guardar el producto. ' +
            'Verifica su identificador y tienda.'
        },
        { status: 409 }
      );
    }

    const producto = await env.DB.prepare(`
      SELECT *
      FROM productos
      WHERE id = ?
        AND tienda_id = ?
    `).bind(id, tiendaId).first();

    if (!producto) {
      return Response.json(
        { error: 'Producto no disponible para esta tienda' },
        { status: 409 }
      );
    }

    return Response.json({
      message: 'Producto guardado correctamente',
      producto
    });

  } catch (error) {
    console.error('Error guardando producto:', error);

    const mensaje = String(error?.message ?? '');

    if (
      mensaje.includes('UNIQUE constraint failed') ||
      mensaje.includes('PRIMARY KEY constraint failed')
    ) {
      return Response.json(
        {
          error:
            'Ya existe un producto con ese identificador ' +
            'o código de barras.'
        },
        { status: 409 }
      );
    }

    return Response.json(
      { error: 'No se pudo guardar el producto' },
      { status: 500 }
    );
  }
}

