
import { requireAuth } from '../../lib/auth.js';

export async function onRequestPost({ request, env }) {
  const auth = await requireAuth(request, env);

  if (auth.error) {
    return auth.error;
  }

  if (!['admin', 'vendedor'].includes(auth.user.role)) {
    return Response.json(
      { error: 'No tienes permiso para sincronizar ventas' },
      { status: 403 }
    );
  }

  return Response.json(
    {
      status: 'not_implemented',
      message: 'La sincronización de ventas todavía no está habilitada.',
      processedIds: []
    },
    { status: 501 }
  );
}
