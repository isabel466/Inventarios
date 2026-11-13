
import { jwtVerify } from 'jose';

export async function onRequestGet({ request, env }) {
  try {
    if (!env.DB || !env.JWT_SECRET) {
      return Response.json(
        { error: 'Servidor no configurado' },
        { status: 503 }
      );
    }

    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return Response.json(
        { error: 'Token de acceso no proporcionado' },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);
    const secret = new TextEncoder().encode(env.JWT_SECRET);

    let payload;

    try {
      const verified = await jwtVerify(token, secret, {
        algorithms: ['HS256']
      });

      payload = verified.payload;
    } catch {
      return Response.json(
        { error: 'Token inválido o expirado' },
        { status: 403 }
      );
    }

    if (!payload.sub) {
      return Response.json(
        { error: 'Token inválido' },
        { status: 403 }
      );
    }

    
const user = await env.DB.prepare(`
  SELECT id, nombre, email, role, tienda_id
  FROM usuarios
  WHERE id = ?
`).bind(payload.sub).first();


    if (!user) {
      return Response.json(
        { error: 'Usuario no encontrado' },
        { status: 401 }
      );
    }


if (!user.tienda_id) {
  return Response.json(
    { error: 'El usuario no tiene una tienda asignada' },
    { status: 403 }
  );
}


    return Response.json({ user });

  } catch (error) {
    console.error('Error al validar sesión:', error);

    return Response.json(
      { error: 'Error interno al validar sesión' },
      { status: 500 }
    );
  }
}
