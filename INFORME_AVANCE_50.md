# Informe de Avance de Proyecto (Hito 1 - 50%)

**Proyecto:** Sistema de Punto de Venta (POS) e Inventario Offline-First con Progressive Web App (PWA)  
**Estado:** Entregado al 50% (Hito Intermedio)  
**Fecha:** Octubre 2026  

---

## 1. Resumen Ejecutivo del Avance (50%)
El presente informe documenta el cumplimiento del **Hito 1 (50% de avance)** correspondiente al desarrollo de la arquitectura cliente, diseño de interfaces responsivas y persistencia local sin conexión a internet utilizando la API de **IndexedDB**.

El objetivo de esta primera entrega es garantizar que el sistema sea capaz de operar en su totalidad de manera local (*Offline-First*), permitiendo la consulta de catálogo, existencias y el registro optimista de transacciones de venta directamente en la base de datos del navegador sin depender de la conectividad de red.

---

## 2. Metodología de Fases del Proyecto

| Fase | Descripción | Estado en este Avance |
| :--- | :--- | :---: |
| **FASE 1: UI & Base de Datos Local** | Diseño visual, Vite + React y configuración de IndexedDB (`Dexie.js`) | **COMPLETADO (100%)** |
| **FASE 2: Service Worker & Cache** | PWA manifest, precaching de assets estáticos y funcionamiento autónomo | **COMPLETADO (100%)** |
| **FASE 3: Motor Offline & Sync** | Sincronización batch con backend central y resolución de conflictos | *En Desarrollo (Sprint 2)* |
| **FASE 4: APIs Avanzadas** | Barcode Detection API (cámara), Web Push y comprobantes térmicos en PDF | *En Desarrollo (Sprint 2)* |
| **FASE 5: Backend & Roles** | API REST en Node.js/Express, autenticación JWT y persistencia en servidor | *En Desarrollo (Sprint 2)* |

**Porcentaje de Avance Consolidado: 50%**

---

## 3. Entregables Implementados en el Hito 1 (50%)

### 3.1. Entorno y Arquitectura Frontend
- Configuración del proyecto con **Vite**, **React** y componentes modulares.
- Integración de `@vite-pwa/plugin` para autogeneración del Service Worker y Manifiesto Web instalable (`manifest.webmanifest`).
- Diseño UI moderno basado en tokens de diseño oscuro/slate, soporte responsive y efectos de glassmorphism.

### 3.2. Base de Datos Client-Side (IndexedDB con Dexie.js)
Se definió el esquema de base de datos relacional client-side en `src/db/db.js`:
- `productos`: Catálogo de artículos con código de barras, stock actual, stock mínimo y precios.
- `ventas`: Cabecera de transacciones con UUIDs cliente (`crypto.randomUUID()`), timestamps ISO y campo `syncStatus: 0` (pendiente de sincronización).
- `ventasDetalle`: Detalle de productos vendidos por transacción.
- `movimientos`: Historial de entradas y salidas de almacén.
- `clientes`: Directorio local de clientes.

### 3.3. Terminal de Punto de Venta (POS) Local
- Carrito de compras reactivo con controles de cantidad y validación de stock disponible.
- Búsqueda interactiva por código de barras o texto.
- Transacciones atómicas locales: al presionar cobrar, el sistema descuenta el stock del producto de forma optimista e inserta la transacción con `syncStatus = 0` en IndexedDB.

### 3.4. Módulo de Inventario & Almacén
- Tablero de existencias con alertas visuales de **Stock Bajo**.
- Formulario de alta de nuevos productos y registro de movimientos (Entrada / Salida).

---

## 4. Plan de Trabajo para la Entrega Final (Hito 2 - 50% Restante)
En el segundo sprint se completarán los siguientes módulos:
1. **API Backend y Base de Datos Servidor:** Servidor Node.js/Express con persistencia central y autenticación JWT.
2. **Motor de Sincronización Automática Batch:** Envío agrupado de ventas pendientes al recuperar la conexión mediante el listener `window.addEventListener('online')`.
3. **Escáner con Cámara Nativa:** Integración completa de cámara física mediante `html5-qrcode`.
4. **Comprobantes e Impresión:** Generador de tickets PDF térmicos con `jsPDF` y reglas CSS `@media print`.
5. **Dashboard Analítico:** Métricas consolidadas con gráficos interactivos (`Recharts`).

---

## 5. Instrucciones de Ejecución
- **Frontend PWA:** `http://localhost:3000/`
- En la barra superior se encuentra activo el indicador permanente **"Avance 50% (Hito 1)"**.
- Las pestañas de **Terminal POS (Local)** e **Inventario & Stock** permiten validar las operaciones locales con IndexedDB, mientras que las pestañas del siguiente hito muestran su estado técnico en desarrollo.
