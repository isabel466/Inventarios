
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

export async function onRequestPost({ request, env }) {
  try {
    if (!env.DB || !env.JWT_SECRET) {
      return Response.json(
        { error: 'Servidor no configurado' },
        { status: 503 }
      );
    }

    const { nombre, email, password } = await request.json();

    if (
      typeof nombre !== 'string' ||
      typeof email !== 'string' ||
      typeof password !== 'string'
    ) {
      return Response.json(
        { error: 'Datos inválidos' },
        { status: 400 }
      );
    }

    const cleanName = nombre.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (
      !cleanName ||
      cleanName.length > 120 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) ||
      password.length < 8 ||
      password.length > 72
    ) {
      return Response.json(
        { error: 'Revisa el nombre, correo y contraseña (8 a 72 caracteres)' },
        { status: 400 }
      );
    }

    const existing = await env.DB
      .prepare('SELECT id FROM usuarios WHERE email = ?')
      .bind(cleanEmail)
      .first();

    if (existing) {
      return Response.json(
        { error: 'Este correo ya está registrado' },
        { status: 409 }
      );
    }

   
const tiendaId = crypto.randomUUID();

const user = {
  id: crypto.randomUUID(),
  nombre: cleanName,
  email: cleanEmail,
  role: 'admin',
  tienda_id: tiendaId
};

const hash = await bcrypt.hash(password, 10);

// Crear la tienda y el administrador
// en una misma transacción de D1.
await env.DB.batch([
  env.DB.prepare(`
    INSERT INTO tiendas (id, nombre)
    VALUES (?, ?)
  `).bind(
    tiendaId,
    `Tienda de ${cleanName}`
  ),

  env.DB.prepare(`
    INSERT INTO usuarios
      (id, email, password_hash, nombre, role, tienda_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(
    user.id,
    user.email,
    hash,
    user.nombre,
    user.role,
    tiendaId
  )
]);


    const secret = new TextEncoder().encode(env.JWT_SECRET);

    const token = await new SignJWT({
      nombre: user.nombre,
      email: user.email,
      role: user.role
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(user.id)
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(secret);

    return Response.json(
      { message: 'Cuenta creada', user, token },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error de registro:', error);

    return Response.json(
      { error: 'No se pudo crear la cuenta' },
      { status: 500 }
    );
  }
}
