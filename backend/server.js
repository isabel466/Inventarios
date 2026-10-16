import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// In-Memory Database for backend persistence
const serverDatabase = {
  users: [
    { id: '1', email: 'admin@pos.com', password: 'admin', nombre: 'Carlos Admin', role: 'admin' },
    { id: '2', email: 'vendedor@pos.com', password: '123', nombre: 'Laura Vendedora', role: 'vendedor' },
    { id: '3', email: 'almacen@pos.com', password: '123', nombre: 'Roberto Almacén', role: 'almacen' }
  ],
  productos: [
    { id: 'prod-1', codigoBarras: '75010001', nombre: 'Café Espresso Gourmet 250g', stock: 45, stockMinimo: 10, precio: 12.50, categoria: 'Bebidas' },
    { id: 'prod-2', codigoBarras: '75010002', nombre: 'Agua Mineral 600ml', stock: 120, stockMinimo: 25, precio: 2.00, categoria: 'Bebidas' },
    { id: 'prod-3', codigoBarras: '75010003', nombre: 'Sandwich de Pavo y Queso', stock: 8, stockMinimo: 10, precio: 6.80, categoria: 'Alimentos' },
    { id: 'prod-4', codigoBarras: '75010004', nombre: 'Galletas Artesanales Avena', stock: 30, stockMinimo: 12, precio: 3.50, categoria: 'Snacks' },
    { id: 'prod-5', codigoBarras: '75010005', nombre: 'Jugo Natural de Naranja 500ml', stock: 15, stockMinimo: 5, precio: 4.20, categoria: 'Bebidas' }
  ],
  ventas: [],
  ventasDetalle: [],
  syncLogs: []
};

// --- AUTH ENDPOINTS ---
app.post('/api/v1/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = serverDatabase.users.find(u => u.email === email && u.password === password);

  if (!user) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  // Generate simple base64 token payload for offline client storage
  const tokenPayload = {
    id: user.id,
    nombre: user.nombre,
    role: user.role,
    email: user.email,
    exp: Date.now() + 86400000 // 24 hours
  };
  const token = Buffer.from(JSON.stringify(tokenPayload)).toString('base64');

  res.json({
    token,
    user: {
      id: user.id,
      nombre: user.nombre,
      role: user.role,
      email: user.email
    }
  });
});

// --- PRODUCTS API ---
app.get('/api/v1/productos', (req, res) => {
  res.json(serverDatabase.productos);
});

app.post('/api/v1/productos', (req, res) => {
  const nuevoProd = req.body;
  const index = serverDatabase.productos.findIndex(p => p.id === nuevoProd.id || p.codigoBarras === nuevoProd.codigoBarras);
  if (index >= 0) {
    serverDatabase.productos[index] = { ...serverDatabase.productos[index], ...nuevoProd };
  } else {
    serverDatabase.productos.push(nuevoProd);
  }
  res.status(201).json({ message: 'Producto guardado', producto: nuevoProd });
});

// --- BATCH SYNC ENDPOINT (OFFLINE-FIRST ENGINE) ---
app.post('/api/v1/sincronizar-ventas', (req, res) => {
  const { ventas } = req.body;

  if (!Array.isArray(ventas) || ventas.length === 0) {
    return res.status(400).json({ error: 'No se enviaron ventas para sincronizar' });
  }

  console.log(`[BACKEND SERVER] 📡 Recibido lote de ${ventas.length} ventas para sincronizar.`);

  const idsProcesados = [];

  for (const ventaPayload of ventas) {
    const { id, fecha, total, detalles, usuarioId, clienteNombre } = ventaPayload;

    // Verificar si ya fue procesada anteriormente para prevenir duplicación
    const yaExiste = serverDatabase.ventas.some(v => v.id === id);
    if (!yaExiste) {
      serverDatabase.ventas.push({
        id,
        fecha,
        total,
        usuarioId: usuarioId || 'offline-user',
        clienteNombre: clienteNombre || 'Cliente General',
        sincronizadoEn: new Date().toISOString()
      });

      // Procesar detalles y ajustar inventario del servidor
      if (Array.isArray(detalles)) {
        for (const det of detalles) {
          serverDatabase.ventasDetalle.push(det);

          // Ajustar stock en servidor basándonos en la venta
          const prod = serverDatabase.productos.find(p => p.id === det.productoId);
          if (prod) {
            prod.stock = Math.max(0, prod.stock - det.cantidad);
          }
        }
      }
    }
    idsProcesados.push(id);
  }

  // Registrar en logs de sync
  serverDatabase.syncLogs.push({
    timestamp: new Date().toISOString(),
    ventasSincronizadas: idsProcesados.length,
    ids: idsProcesados
  });

  console.log(`[BACKEND SERVER] ✅ Sincronización exitosa. IDs confirmados:`, idsProcesados);

  res.json({
    status: 'success',
    message: `${idsProcesados.length} ventas sincronizadas con éxito en el servidor.`,
    processedIds: idsProcesados,
    productosActualizados: serverDatabase.productos
  });
});

// --- SERVER SYNC STATUS & STATS ---
app.get('/api/v1/sync-status', (req, res) => {
  res.json({
    serverOnline: true,
    totalVentasServidor: serverDatabase.ventas.length,
    productosTotal: serverDatabase.productos.length,
    syncLogs: serverDatabase.syncLogs.slice(-10)
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor Backend POS escuchando en http://localhost:${PORT}`);
});
