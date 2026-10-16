# ⚡ POS & Inventario Offline-First (PWA)

Sistema de Punto de Venta (POS) e Inventario desarrollado con arquitectura **Offline-First**, diseñado para operar de forma autónoma sin conexión a internet y sincronizar transacciones por lotes (*batch sync*) cuando se reestablece la conectividad.

---

## 🚀 Características Principales

- **Arquitectura Offline-First:** Persistencia completa en el cliente mediante **IndexedDB** administrado con **Dexie.js**.
- **PWA Instalable:** Service Worker con precaching y manifiesto web mediante `@vite-pwa/plugin`.
- **Escritura Optimista:** Registro instantáneo de ventas y decremento en tiempo real del stock local (`syncStatus: 0`).
- **Terminal POS Reactivo:** Carrito de compras, validación de stock, cálculo automático de totales/IVA y asignación de clientes.
- **Inventario y Stock:** Catálogo detallado, alertas visuales de stock bajo y registro de movimientos (Entrada / Salida).
- **Diseño UI Moderno:** Interfaz responsiva con tema oscuro (*Dark Slate*), efectos de glassmorphism e iconografía con Lucide React.
- **Backend API REST:** Servidor en Node.js + Express con endpoints para sincronización por lotes (`POST /api/v1/sincronizar-ventas`).

---

## 🛠️ Stack Tecnológico

### Frontend & PWA
- **Framework:** React 19 + Vite
- **Base de Datos Local:** IndexedDB con [Dexie.js](https://dexie.org/) y `dexie-react-hooks` (`useLiveQuery`)
- **PWA Engine:** `@vite-pwa/plugin` + Workbox
- **Iconos & Estilos:** Lucide React, CSS Moderno (Glassmorphism, CSS Custom Properties)

### Backend
- **Servidor:** Node.js + Express
- **API REST:** Endpoints de autenticación, catálogo y sincronización por lotes (*Batch Sync*)

---

## 📦 Estructura del Proyecto

```text
├── frontend/             # Aplicación PWA React + Vite
│   ├── src/
│   │   ├── components/   # Terminal POS, Inventario, Scanner, Dashboard, etc.
│   │   ├── context/      # Contextos (Auth, Red, Modo de Proyecto)
│   │   ├── db/           # Esquema de IndexedDB (db.js con Dexie)
│   │   ├── services/     # Servicio de sincronización (syncService.js)
│   │   └── styles/       # Sistema de estilos globales
│   └── vite.config.js    # Configuración de Vite y VitePWA
│
├── backend/              # Servidor API Express
│   ├── server.js         # Endpoints REST y persistencia en memoria
│   └── package.json
│
├── INFORME_AVANCE_50.md  # Informe técnico de avance
└── README.md
```

---

## 💻 Instalación y Ejecución Local

### Prerrequisitos
- Node.js (v18 o superior)
- npm o pnpm

### 1. Iniciar el Backend
```bash
cd backend
npm install
npm start
```
El servidor backend correrá en `http://localhost:3001`.

### 2. Iniciar el Frontend PWA
En otra terminal:
```bash
cd frontend
npm install
npm run dev
```
La aplicación web estará disponible en `http://localhost:3000`.

---

## 📄 Licencia

Este proyecto se distribuye bajo la licencia MIT.
