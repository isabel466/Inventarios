import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { run, get, all, initDatabase } from './db.js';

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'pos_super_secure_jwt_secret_2026';

// 1. Ocultar la firma del framework para evitar fingerprinting de tecnología
app.disable('x-powered-by');

// 2. Cabeceras de seguridad HTTP alineadas a estándares OWASP
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.use(cors());
app.use(express.json());

// 3. Mecanismo contra Ataques de Fuerza Bruta (Brute-Force & Credential Stuffing)
const loginAttempts = new Map();

function loginRateLimiter(req, res, next) {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (record && record.lockUntil && now < record.lockUntil) {
    const minutesLeft = Math.ceil((record.lockUntil - now) / 60000);
    return res.status(429).json({
      error: `Demasiados intentos fallidos. Por seguridad, intente en ${minutesLeft} minuto(s).`
    });
  }
  next();
}

function handleFailedLogin(ip) {
  const now = Date.now();
  const record = loginAttempts.get(ip) || { count: 0, lockUntil: 0 };
  record.count += 1;
  if (record.count >= 5) {
    record.lockUntil = now + 5 * 60 * 1000; // Bloqueo de 5 minutos tras 5 fallos consecutivos
    record.count = 0;
  }
  loginAttempts.set(ip, record);
}

function handleSuccessfulLogin(ip) {
  loginAttempts.delete(ip);
}

// 4. Validador de formato de correo RFC 5322 simplificado
function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// Initialize Relational Database on startup
initDatabase().catch(err => {
  console.error('❌ Error inicializando base de datos:', err);
});

// Middleware for JWT Authentication
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acceso no proporcionado' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido o expirado' });
    }
    req.user = user;
    next();
  });
}

// --- AUTH & USUARIOS ENDPOINTS ---

// 1. Registro público de cuentas (cualquiera que descargue la app crea su cuenta con rol 'admin' de su tienda)
app.post('/api/v1/auth/register', async (req, res) => {
  try {
    const { email, password, nombre } = req.body;
    if (!email || !password || !nombre) {
      return res.status(400).json({ error: 'Nombre, correo y contraseña son obligatorios' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'El formato de correo electrónico no es válido' });
    }

    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const existing = await get(`SELECT id FROM usuarios WHERE email = ?`, [email.toLowerCase().trim()]);
    if (existing) {
      return res.status(409).json({ error: 'Este correo electrónico ya se encuentra registrado' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const userId = `usr-${Date.now()}`;
    const role = 'admin'; // El usuario que se registra es el Administrador / Dueño de la tienda

    await run(`
      INSERT INTO usuarios (id, email, password_hash, nombre, role)
      VALUES (?, ?, ?, ?, ?)
    `, [userId, email.toLowerCase().trim(), hashedPassword, nombre.trim(), role]);

    const tokenPayload = {
      id: userId,
      nombre: nombre.trim(),
      role,
      email: email.toLowerCase().trim()
    };
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });

    res.status(201).json({
      message: 'Cuenta creada con éxito',
      token,
      user: {
        id: userId,
        nombre: nombre.trim(),
        role,
        email: email.toLowerCase().trim()
      }
    });
  } catch (error) {
    console.error('Error en /api/v1/auth/register:', error);
    res.status(500).json({ error: 'Error interno al registrar usuario' });
  }
});

// 2. Login formal con protección brute-force, contraseñas encriptadas (bcrypt) y JWT
app.post('/api/v1/auth/login', loginRateLimiter, async (req, res) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }

    const user = await get(`SELECT * FROM usuarios WHERE LOWER(email) = ?`, [email.toLowerCase().trim()]);
    if (!user) {
      handleFailedLogin(ip);
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const passwordMatch = bcrypt.compareSync(password, user.password_hash);
    if (!passwordMatch) {
      handleFailedLogin(ip);
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    handleSuccessfulLogin(ip);

    // Firmar JWT con 24 horas de vigencia incluyendo su rol
    const tokenPayload = {
      id: user.id,
      nombre: user.nombre,
      role: user.role,
      email: user.email
    };
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        role: user.role,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Error en /api/v1/auth/login:', error);
    res.status(500).json({ error: 'Error interno del servidor en autenticación' });
  }
});

// 3. Validar token y obtener perfil del usuario
app.get('/api/v1/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await get(`SELECT id, email, nombre, role, creado_en FROM usuarios WHERE id = ?`, [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Error al verificar sesión' });
  }
});

// 4. Gestión de Colaboradores (Exclusivo Administrador)
app.get('/api/v1/usuarios', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Permiso denegado. Se requiere rol Administrador.' });
    }
    const usuarios = await all(`SELECT id, email, nombre, role, creado_en FROM usuarios ORDER BY creado_en DESC`);
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

app.post('/api/v1/usuarios', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Permiso denegado. Se requiere rol Administrador.' });
    }
    const { email, password, nombre, role } = req.body;
    if (!email || !password || !nombre || !role) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    if (!['admin', 'vendedor', 'almacen'].includes(role)) {
      return res.status(400).json({ error: 'Rol no válido. Debe ser: admin, vendedor o almacen' });
    }

    const existing = await get(`SELECT id FROM usuarios WHERE email = ?`, [email.toLowerCase().trim()]);
    if (existing) {
      return res.status(409).json({ error: 'Este correo ya está registrado' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const userId = `usr-${Date.now()}`;

    await run(`
      INSERT INTO usuarios (id, email, password_hash, nombre, role)
      VALUES (?, ?, ?, ?, ?)
    `, [userId, email.toLowerCase().trim(), hashedPassword, nombre.trim(), role]);

    res.status(201).json({
      message: 'Colaborador creado exitosamente',
      usuario: { id: userId, email: email.toLowerCase().trim(), nombre: nombre.trim(), role }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar colaborador' });
  }
});

app.delete('/api/v1/usuarios/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Permiso denegado.' });
    }
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta administradora activa' });
    }
    await run(`DELETE FROM usuarios WHERE id = ?`, [req.params.id]);
    res.json({ message: 'Usuario eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
});

// --- PRODUCTOS (SQL RELACIONAL) ---

app.get('/api/v1/productos', async (req, res) => {
  try {
    const productos = await all(`SELECT * FROM productos ORDER BY nombre ASC`);
    res.json(productos);
  } catch (error) {
    console.error('Error al consultar productos:', error);
    res.status(500).json({ error: 'Error al obtener productos de la base de datos relacional' });
  }
});

app.post('/api/v1/productos', async (req, res) => {
  try {
    const { id, codigoBarras, nombre, stock, stockMinimo, precio, categoria } = req.body;
    const existing = await get(`SELECT id FROM productos WHERE id = ? OR codigoBarras = ?`, [id, codigoBarras]);

    if (existing) {
      await run(`
        UPDATE productos
        SET nombre = ?, stock = ?, stockMinimo = ?, precio = ?, categoria = ?, actualizado_en = CURRENT_TIMESTAMP
        WHERE id = ? OR codigoBarras = ?
      `, [nombre, stock, stockMinimo, precio, categoria, id, codigoBarras]);
    } else {
      await run(`
        INSERT INTO productos (id, codigoBarras, nombre, stock, stockMinimo, precio, categoria)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [id || `prod-${Date.now()}`, codigoBarras, nombre, stock || 0, stockMinimo || 5, precio || 0, categoria || 'General']);
    }

    const updated = await get(`SELECT * FROM productos WHERE codigoBarras = ?`, [codigoBarras]);
    res.status(201).json({ message: 'Producto guardado con éxito', producto: updated });
  } catch (error) {
    console.error('Error guardando producto:', error);
    res.status(500).json({ error: 'Error guardando producto en base de datos relacional' });
  }
});

app.delete('/api/v1/productos/:id', async (req, res) => {
  try {
    await run(`DELETE FROM productos WHERE id = ?`, [req.params.id]);
    res.json({ message: 'Producto eliminado con éxito' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
});

// --- BATCH SYNC ENDPOINT (OFFLINE-FIRST ENGINE) ---
app.post('/api/v1/sincronizar-ventas', async (req, res) => {
  try {
    const { ventas } = req.body;

    if (!Array.isArray(ventas) || ventas.length === 0) {
      return res.status(400).json({ error: 'No se enviaron ventas para sincronizar' });
    }

    console.log(`[BACKEND RELACIONAL] 📡 Recibido lote de ${ventas.length} ventas para sincronizar.`);
    const idsProcesados = [];

    for (const ventaPayload of ventas) {
      const { id, fecha, total, detalles, usuarioId, clienteNombre } = ventaPayload;

      // Verificar si ya existe para evitar duplicados
      const existente = await get(`SELECT id FROM ventas WHERE id = ?`, [id]);
      if (!existente) {
        await run(`
          INSERT INTO ventas (id, fecha, total, usuarioId, clienteNombre, sincronizadoEn)
          VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `, [id, fecha || new Date().toISOString(), total, usuarioId || 'offline-user', clienteNombre || 'Cliente General']);

        // Insertar detalles y actualizar stock en BD relacional
        if (Array.isArray(detalles)) {
          for (const det of detalles) {
            const detalleId = det.id || `${id}-${det.productoId}`;
            await run(`
              INSERT INTO ventas_detalle (id, ventaId, productoId, cantidad, precioUnitario, subtotal)
              VALUES (?, ?, ?, ?, ?, ?)
            `, [detalleId, id, det.productoId, det.cantidad, det.precioUnitario, det.subtotal]);

            // Decrementar stock
            await run(`
              UPDATE productos
              SET stock = MAX(0, stock - ?), actualizado_en = CURRENT_TIMESTAMP
              WHERE id = ?
            `, [det.cantidad, det.productoId]);
          }
        }
      }
      idsProcesados.push(id);
    }

    // Registrar en log de sincronización
    await run(`
      INSERT INTO sync_logs (ventasSincronizadas, ids_json)
      VALUES (?, ?)
    `, [idsProcesados.length, JSON.stringify(idsProcesados)]);

    console.log(`[BACKEND RELACIONAL] ✅ Sincronización exitosa. Registros afectados: ${idsProcesados.length}`);

    const productosActualizados = await all(`SELECT * FROM productos ORDER BY nombre ASC`);

    res.json({
      status: 'success',
      message: `${idsProcesados.length} ventas sincronizadas con éxito en la base de datos relacional.`,
      processedIds: idsProcesados,
      productosActualizados
    });
  } catch (error) {
    console.error('Error en sincronización relacional:', error);
    res.status(500).json({ error: 'Error procesando lote de sincronización en BD relacional' });
  }
});

// --- SERVER STATUS & METRICS ---
app.get('/api/v1/sync-status', async (req, res) => {
  try {
    const totalVentas = await get(`SELECT COUNT(*) as count FROM ventas`);
    const totalProductos = await get(`SELECT COUNT(*) as count FROM productos`);
    const syncLogs = await all(`SELECT * FROM sync_logs ORDER BY id DESC LIMIT 10`);

    res.json({
      serverOnline: true,
      databaseType: 'SQLite Relational (ACID)',
      totalVentasServidor: totalVentas.count,
      productosTotal: totalProductos.count,
      syncLogs
    });
  } catch (error) {
    res.status(500).json({ serverOnline: true, error: error.message });
  }
});

// --- EXPORTACIÓN DE REPORTES A CSV/EXCEL ---

// Reporte de Ventas en CSV (compatible con Excel con BOM UTF-8)
app.get('/api/v1/reportes/ventas-csv', async (req, res) => {
  try {
    const ventas = await all(`
      SELECT v.id, v.fecha, v.clienteNombre, v.usuarioId, v.total, v.sincronizadoEn,
             COUNT(d.id) as totalArticulos
      FROM ventas v
      LEFT JOIN ventas_detalle d ON v.id = d.ventaId
      GROUP BY v.id
      ORDER BY v.fecha DESC
    `);

    let csv = '\uFEFF"ID Venta","Fecha","Cliente","Vendedor / Usuario","Total ($)","Articulos","Sincronizado En"\n';
    ventas.forEach(v => {
      csv += `"${v.id}","${v.fecha}","${(v.clienteNombre || 'General').replace(/"/g, '""')}","${v.usuarioId}","${v.total.toFixed(2)}","${v.totalArticulos || 0}","${v.sincronizadoEn}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="reporte_ventas_${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Error exportando ventas:', error);
    res.status(500).send('Error exportando reporte de ventas');
  }
});

// Reporte de Inventario en CSV (compatible con Excel con BOM UTF-8)
app.get('/api/v1/reportes/inventario-csv', async (req, res) => {
  try {
    const productos = await all(`SELECT * FROM productos ORDER BY categoria ASC, nombre ASC`);

    let csv = '\uFEFF"ID","Código Barras","Nombre","Categoría","Stock Actual","Stock Mínimo","Precio Unitario ($)","Valor Inventario ($)"\n';
    productos.forEach(p => {
      const valorTotal = (p.stock * p.precio).toFixed(2);
      csv += `"${p.id}","${p.codigoBarras}","${p.nombre.replace(/"/g, '""')}","${p.categoria}","${p.stock}","${p.stockMinimo}","${p.precio.toFixed(2)}","${valorTotal}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="reporte_inventario_${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Error exportando inventario:', error);
    res.status(500).send('Error exportando reporte de inventario');
  }
});

// --- MANTENIMIENTO Y SEGURIDAD DE BASE DE DATOS ---

// Endpoint de purga general de registros (exclusivo para usuarios con rol 'admin')
app.delete('/api/v1/admin/limpiar-registros', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Permiso denegado. Se requiere rol de Administrador.' });
    }

    await run('DELETE FROM ventas_detalle');
    await run('DELETE FROM ventas');
    await run('DELETE FROM productos');
    await run('DELETE FROM sync_logs');

    console.log(`[SEGURIDAD & AUDITORÍA] 🧹 Base de datos purgada por administrador: ${req.user.email} (${req.user.id})`);

    res.json({
      status: 'success',
      message: 'Base de datos restaurada a estado limpio: productos, ventas y logs eliminados exitosamente.'
    });
  } catch (error) {
    console.error('Error al limpiar registros:', error);
    res.status(500).json({ error: 'Error interno al limpiar base de datos central' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor Backend POS con Base de Datos Relacional escuchando en http://localhost:${PORT}`);
});
