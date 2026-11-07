import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

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
    console.log(`📦 Base de datos relacional conectada: ${DB_PATH}`);
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

// Inicialización de esquemas relacionales sin registros ficticios
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

  console.log('✅ Base de datos relacional lista (esquemas creados sin datos ficticios).');
}

export default { run, get, all, initDatabase };
