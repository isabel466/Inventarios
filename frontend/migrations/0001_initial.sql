
CREATE TABLE IF NOT EXISTS tiendas (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS usuarios (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  nombre TEXT NOT NULL,
  role TEXT NOT NULL,
  creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
  tienda_id TEXT REFERENCES tiendas(id)
);

CREATE TABLE IF NOT EXISTS productos (
  id TEXT PRIMARY KEY,
  codigoBarras TEXT NOT NULL,
  nombre TEXT NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  stockMinimo INTEGER NOT NULL DEFAULT 5,
  precio REAL NOT NULL DEFAULT 0,
  categoria TEXT NOT NULL,
  actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
  tienda_id TEXT NOT NULL REFERENCES tiendas(id),
  UNIQUE(tienda_id, codigoBarras)
);

CREATE TABLE IF NOT EXISTS ventas (
  id TEXT PRIMARY KEY,
  fecha DATETIME NOT NULL,
  total REAL NOT NULL,
  usuarioId TEXT,
  clienteNombre TEXT,
  sincronizadoEn DATETIME DEFAULT CURRENT_TIMESTAMP,
  tienda_id TEXT REFERENCES tiendas(id)
);

CREATE TABLE IF NOT EXISTS ventas_detalle (
  id TEXT PRIMARY KEY,
  ventaId TEXT NOT NULL,
  productoId TEXT NOT NULL,
  cantidad INTEGER NOT NULL,
  precioUnitario REAL NOT NULL,
  subtotal REAL NOT NULL,
  tienda_id TEXT REFERENCES tiendas(id),
  FOREIGN KEY (ventaId) REFERENCES ventas(id),
  FOREIGN KEY (productoId) REFERENCES productos(id)
);

CREATE TABLE IF NOT EXISTS operaciones_inventario (
  id TEXT PRIMARY KEY,
  tienda_id TEXT NOT NULL REFERENCES tiendas(id),
  producto_id TEXT NOT NULL REFERENCES productos(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('ENTRADA', 'SALIDA')),
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  stock_anterior INTEGER NOT NULL,
  stock_nuevo INTEGER NOT NULL,
  motivo TEXT,
  fecha TEXT NOT NULL,
  creado_en TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sync_logs (
  id TEXT PRIMARY KEY,
  tienda_id TEXT REFERENCES tiendas(id),
  fecha DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_productos_tienda
ON productos(tienda_id);

CREATE INDEX IF NOT EXISTS idx_usuarios_tienda
ON usuarios(tienda_id);

CREATE INDEX IF NOT EXISTS idx_ventas_tienda
ON ventas(tienda_id);
