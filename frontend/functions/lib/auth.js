
import { jwtVerify } from 'jose';

export async function requireAuth(request, env) {
  if (!env.DB || !env.JWT_SECRET) {
    return {
      error: Response.json(
        { error: 'Servidor no configurado' },
        { status: 503 }
      )
    };
  }

  const header = request.headers.get('Authorization');

  if (!header?.startsWith('Bearer ')) {
    return {
      error: Response.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    };
  }

  try {
    const token = header.slice(7);
    const secret = new TextEncoder().encode(env.JWT_SECRET);

    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256']
    });

    if (!payload.sub) {
      throw new Error('Token sin usuario');
    }

    const user = await env.DB.prepare(`
      SELECT id, email, nombre, role, tienda_id
      FROM usuarios
      WHERE id = ?
    `).bind(payload.sub).first();

    if (!user || !user.tienda_id) {
      return {
        error: Response.json(
          { error: 'Usuario o tienda no encontrados' },
          { status: 403 }
        )
      };
    }

    return { user };

  } catch {
    return {
      error: Response.json(
        { error: 'Sesión inválida o expirada' },
        { status: 401 }
      )
    };
  }
}
