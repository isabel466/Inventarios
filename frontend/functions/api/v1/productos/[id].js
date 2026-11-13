
import { requireAuth } from '../../../lib/auth.js';
export async function onRequestDelete({ request, env, params }) {
  const auth = await requireAuth(request, env);
  if (auth.error) return auth.error;

  if (!['admin', 'almacen'].includes(auth.user.role)) {
    return Response.json(
      { error: 'No tienes permisos para eliminar productos' },
      { status: 403 }
    );
  }

  const productoId = params.id;
  const tiendaId = auth.user.tienda_id;

  if (!productoId) {
    return Response.json(
      { error: 'ID de producto requerido' },
      { status: 400 }
    );
  }

  try {
    const result = await env.DB.prepare(`
      DELETE FROM productos
      WHERE id = ? AND tienda_id = ?
    `).bind(productoId, tiendaId).run();

    if (result.meta.changes === 0) {
      return Response.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    return Response.json({
      message: 'Producto eliminado correctamente'
    });
  } catch (error) {
    console.error('Error eliminando producto:', error);

    return Response.json(
      { error: 'No se pudo eliminar el producto' },
      { status: 500 }
    );
  }
}
