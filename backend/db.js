import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'pos_database.sqlite');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Error abriendo base de datos SQLite relacional:', err.message);
  } else {
    console.log(`📦 Base de datos relacional SQLite conectada: ${DB_PATH}`);
  }
});

// Promisified query helper functions
export function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

export function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

export function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// Initialize tables and seed initial data
export async function initDatabase() {
  // 1. Tabla Usuarios
  await run(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      nombre TEXT NOT NULL,
      role TEXT NOT NULL,
      creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 2. Tabla Productos
  await run(`
    CREATE TABLE IF NOT EXISTS productos (
      id TEXT PRIMARY KEY,
      codigoBarras TEXT UNIQUE NOT NULL,
      nombre TEXT NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      stockMinimo INTEGER NOT NULL DEFAULT 5,
      precio REAL NOT NULL DEFAULT 0.0,
      categoria TEXT NOT NULL,
      actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 3. Tabla Ventas
  await run(`
    CREATE TABLE IF NOT EXISTS ventas (
      id TEXT PRIMARY KEY,
      fecha DATETIME NOT NULL,
      total REAL NOT NULL,
      usuarioId TEXT,
      clienteNombre TEXT,
      sincronizadoEn DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 4. Tabla Ventas Detalle
  await run(`
    CREATE TABLE IF NOT EXISTS ventas_detalle (
      id TEXT PRIMARY KEY,
      ventaId TEXT NOT NULL,
      productoId TEXT NOT NULL,
      cantidad INTEGER NOT NULL,
      precioUnitario REAL NOT NULL,
      subtotal REAL NOT NULL,
      FOREIGN KEY (ventaId) REFERENCES ventas(id),
      FOREIGN KEY (productoId) REFERENCES productos(id)
    )
  `);

  // 5. Tabla Sync Logs
  await run(`
    CREATE TABLE IF NOT EXISTS sync_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      ventasSincronizadas INTEGER NOT NULL,
      ids_json TEXT
    )
  `);

  // Sembrar usuarios iniciales con contraseña cifrada con bcrypt si no existen
  const usersCount = await get(`SELECT COUNT(*) as count FROM usuarios`);
  if (usersCount.count === 0) {
    console.log('🌱 Inicializando usuarios con contraseñas encriptadas (bcrypt)...');
    const adminHash = bcrypt.hashSync('admin', 10);
    const pass123Hash = bcrypt.hashSync('123', 10);

    await run(`INSERT INTO usuarios (id, email, password_hash, nombre, role) VALUES (?, ?, ?, ?, ?)`,
      ['1', 'admin@pos.com', adminHash, 'Carlos Admin', 'admin']);
    await run(`INSERT INTO usuarios (id, email, password_hash, nombre, role) VALUES (?, ?, ?, ?, ?)`,
      ['2', 'vendedor@pos.com', pass123Hash, 'Laura Vendedora', 'vendedor']);
    await run(`INSERT INTO usuarios (id, email, password_hash, nombre, role) VALUES (?, ?, ?, ?, ?)`,
      ['3', 'almacen@pos.com', pass123Hash, 'Roberto Almacén', 'almacen']);
  }

  // Sembrar catálogo inicial si la tabla de productos está vacía
  const prodCount = await get(`SELECT COUNT(*) as count FROM productos`);
  if (prodCount.count === 0) {
    console.log('🌱 Inicializando catálogo de productos relacional...');
    const initialProducts = [
      { id: 'prod-1', codigoBarras: '75010001', nombre: 'Café Espresso Gourmet 250g', stock: 45, stockMinimo: 10, precio: 12.50, categoria: 'Bebidas' },
      { id: 'prod-2', codigoBarras: '75010002', nombre: 'Agua Mineral 600ml', stock: 120, stockMinimo: 25, precio: 2.00, categoria: 'Bebidas' },
      { id: 'prod-3', codigoBarras: '75010003', nombre: 'Sandwich de Pavo y Queso', stock: 8, stockMinimo: 10, precio: 6.80, categoria: 'Alimentos' },
      { id: 'prod-4', codigoBarras: '75010004', nombre: 'Galletas Artesanales Avena', stock: 30, stockMinimo: 12, precio: 3.50, categoria: 'Snacks' },
      { id: 'prod-5', codigoBarras: '75010005', nombre: 'Jugo Natural de Naranja 500ml', stock: 15, stockMinimo: 5, precio: 4.20, categoria: 'Bebidas' }
    ];

    for (const p of initialProducts) {
      await run(`
        INSERT INTO productos (id, codigoBarras, nombre, stock, stockMinimo, precio, categoria)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [p.id, p.codigoBarras, p.nombre, p.stock, p.stockMinimo, p.precio, p.categoria]);
    }
  }

  console.log('✅ Base de datos relacional inicializada y verificada.');
}

export default { run, get, all, initDatabase };
