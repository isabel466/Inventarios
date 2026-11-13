
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

    const { email, password } = await request.json();

    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !email.trim() ||
      !password
    ) {
      return Response.json(
        { error: 'Correo y contraseña requeridos' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    const user = await env.DB
      .prepare('SELECT * FROM usuarios WHERE email = ?')
      .bind(cleanEmail)
      .first();

    const invalidCredentials = () =>
      Response.json(
        { error: 'Correo o contraseña incorrectos' },
        { status: 401 }
      );

    if (!user) {
      return invalidCredentials();
    }

    const validPassword = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!validPassword) {
      return invalidCredentials();
    }

  
if (!user.tienda_id) {
  return Response.json(
    { error: 'El usuario no tiene una tienda asignada' },
    { status: 403 }
  );
}

const userData = {
  id: user.id,
  nombre: user.nombre,
  email: user.email,
  role: user.role,
  tienda_id: user.tienda_id
};


    const secret = new TextEncoder()
      .encode(env.JWT_SECRET);

    const token = await new SignJWT({
      nombre: userData.nombre,
      email: userData.email,
      role: userData.role
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(userData.id)
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(secret);

    return Response.json({
      message: 'Inicio de sesión exitoso',
      token,
      user: userData
    });

  } catch (error) {
    console.error('Error de login:', error);

    return Response.json(
      { error: 'Error interno al iniciar sesión' },
      { status: 500 }
    );
  }
}
