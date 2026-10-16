# REPORTE DE AVANCE DE PROYECTO (HITO 1 - 50%)

---

**PROYECTO:** Sistema de Punto de Venta (POS) e Inventario Offline-First PWA  
**ALUMNO / DESARROLLADOR:** Isa  
**MATERIA / ÁREA:** Arquitectura de Software / Desarrollo Web Full-Stack  
**FECHA DE ENTREGA:** Octubre 2026  
**ESTADO DEL PROYECTO:** 50% de Avance (Hito 1: UI & Persistencia Local con IndexedDB)  

---

## ÍNDICE
1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Objetivos del Hito 1 (50%)](#2-objetivos-del-hito-1-50)
3. [Stack Tecnológico Implementado](#3-stack-tecnológico-implementado)
4. [Diseño y Esquema de Base de Datos Local (IndexedDB)](#4-diseño-y-esquema-de-base-de-datos-local-indexeddb)
5. [Módulos Desarrollados y Evidencias Visuales](#5-módulos-desarrollados-y-evidencias-visuales)
   - 5.1. [Terminal Punto de Venta (POS)](#51-terminal-punto-de-venta-pos)
   - 5.2. [Persistencia Optimista de Ventas](#52-persistencia-optimista-de-ventas)
   - 5.3. [Inspección de IndexedDB en el Navegador](#53-inspección-de-indexeddb-en-el-navegador)
   - 5.4. [Gestión de Inventario y Existencias](#54-gestión-de-inventario-y-existencias)
   - 5.5. [Arquitectura PWA y Cola Local](#55-arquitectura-pwa-y-cola-local)
   - 5.6. [Módulos Planificados para el Hito Final](#56-módulos-planificados-para-el-hito-final)
6. [Pruebas Técnicas Realizadas](#6-pruebas-técnicas-realizadas)
7. [Plan de Trabajo para el Hito 2 (50% Restante)](#7-plan-de-trabajo-para-el-hito-2-50-restante)
8. [Conclusiones del Avance](#8-conclusiones-del-avance)

---

## 1. Resumen Ejecutivo
El presente informe describe el desarrollo y cumplimiento del **Hito 1 (50% de avance)** correspondiente a la construcción de un Sistema de Punto de Venta (POS) e Inventario bajo una arquitectura **Offline-First** (primero sin conexión).

En esta primera etapa se han cumplido satisfactoriamente las **Fases 1 y 2** de la metodología del proyecto, logrando:
- Una interfaz gráfica de usuario moderna, reactiva y adaptable (*responsive*).
- La configuración del núcleo PWA (*Progressive Web App*) con soporte para instalación y manifiesto web.
- La persistencia completa de datos en el cliente mediante **IndexedDB** administrado con la librería **Dexie.js**.
- La ejecución autónoma del Punto de Venta, permitiendo consultar productos, armar carritos de venta y registrar transacciones localmente con decremento optimista de stock, sin depender de una conexión activa a internet.

---

## 2. Objetivos del Hito 1 (50%)

### Objetivos Alcanzados en este Avance:
1. **Configurar el entorno cliente:** Inicialización del proyecto con Vite y React, garantizando tiempos de carga ultrarrápidos y soporte modular.
2. **Implementar la base de datos local:** Crear y versionar el esquema relacional en IndexedDB para productos, ventas, movimientos y clientes.
3. **Desarrollar el flujo comercial local:** Diseñar el terminal de venta (POS) con cálculo automático de totales, gestión de cantidades e inserción atómica de transacciones con marca `syncStatus: 0` (pendiente de sincronización).
4. **Implementar el catálogo de inventario:** Visualización de stock actual, umbrales de stock mínimo y formulario de movimientos de almacén (Entradas/Salidas).
5. **Configurar PWA instalable:** Estructuración del archivo `manifest.webmanifest` e integración del plugin Vite PWA.

---

## 3. Stack Tecnológico Implementado

| Capa | Tecnología / Herramienta | Función en el Proyecto |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19 + Vite | Interfaz reactiva por componentes y compilador de última generación. |
| **Base de Datos Local** | IndexedDB + Dexie.js | Almacenamiento local persistente en el navegador con soporte transaccional. |
| **Reactividad Local** | dexie-react-hooks (`useLiveQuery`) | Sincronización en tiempo real entre la base de datos del navegador y la UI. |
| **PWA Engine** | `@vite-pwa/plugin` | Gestión de Service Workers, caché estático y manifiesto instalable. |
| **Iconografía y Estilos** | Lucide React + CSS Moderno | Iconos vectoriales limpios y sistema de diseño oscuro (*Dark Slate/Glassmorphism*). |

---

## 4. Diseño y Esquema de Base de Datos Local (IndexedDB)

La persistencia del navegador utiliza **Dexie.js** bajo el esquema denominado `InventarioDB`. En este avance se encuentran creadas y operativas las siguientes tablas:

```javascript
db.version(1).stores({
  productos: 'id, codigoBarras, nombre, stock, stockMinimo, precio, categoria',
  ventas: 'id, fecha, total, syncStatus, usuarioId, clienteNombre',
  ventasDetalle: 'id, ventaId, productoId, cantidad, precioUnitario',
  movimientos: 'id, productoId, tipo, cantidad, fecha, motivo',
  clientes: 'id, nombre, telefono, email'
});
```

*Nota técnica:* El campo `syncStatus: 0` marca que el registro fue creado localmente en IndexedDB y queda preparado en cola para la futura fase de sincronización por lotes (*Batch Sync*) hacia el servidor central.

---

## 5. Módulos Desarrollados y Evidencias Visuales

En esta sección se detallan las funcionalidades construidas junto con los apartados designados para incorporar las capturas de pantalla de la aplicación en ejecución.

---

### 5.1. Terminal Punto de Venta (POS)
El módulo de ventas permite al operador buscar productos mediante código de barras o texto, agregarlos al carrito de compra, ajustar cantidades, visualizar los subtotales e IVA calculados al instante y seleccionar el cliente asignado.

```
+-----------------------------------------------------------------------------------+
|                                                                                   |
|                   [PEGAR AQUÍ CAPTURA 1: TERMINAL POS Y CARRITO]                  |
|                                                                                   |
+-----------------------------------------------------------------------------------+
```
> 📷 **Captura 1:** *Vista general del Terminal POS mostrando el catálogo de artículos, barra de búsqueda interactiva y el panel derecho con el carrito de compra activo y el total calculado.*
> 
> *Sugerencia para la toma:* Abre [http://localhost:3000/](http://localhost:3000/), mantén la pestaña **Terminal POS** activa, añade 2 o 3 productos al carrito y toma una captura de pantalla completa.

---

### 5.2. Persistencia Optimista de Ventas
Al hacer clic en **"Guardar Venta en IndexedDB"**, el sistema ejecuta una transacción atómica local que:
1. Genera un identificador único global `UUID` para la cabecera y sus detalles.
2. Descuenta el inventario local inmediatamente (*escritura optimista*).
3. Inserta la venta en IndexedDB con estado `syncStatus = 0`.
4. Despliega un modal de confirmación con los metadatos de la transacción guardada.

```
+-----------------------------------------------------------------------------------+
|                                                                                   |
|              [PEGAR AQUÍ CAPTURA 2: MODAL DE VENTA GUARDADA EN INDEXEDDB]         |
|                                                                                   |
+-----------------------------------------------------------------------------------+
```
> 📷 **Captura 2:** *Modal de confirmación generado al cobrar una venta, mostrando el UUID único generado en cliente, el total procesado y la confirmación de guardado en la cola local de IndexedDB.*
> 
> *Sugerencia para la toma:* Tras hacer clic en el botón verde de cobrar en el carrito, toma una captura del modal que aparece en pantalla indicando *"Venta Registrada en IndexedDB - Hito 1"*.

---

### 5.3. Inspección de IndexedDB en el Navegador
Para comprobar de manera formal que los datos no son simplemente variables volátiles en memoria, se valida la persistencia física en el motor IndexedDB de Chrome DevTools.

```
+-----------------------------------------------------------------------------------+
|                                                                                   |
|           [PEGAR AQUÍ CAPTURA 3: INSPECCIÓN DE INDEXEDDB EN DEVTOOLS]             |
|                                                                                   |
+-----------------------------------------------------------------------------------+
```
> 📷 **Captura 3:** *Panel de Herramientas de Desarrollador (F12) -> Application -> Storage -> IndexedDB -> InventarioDB, mostrando las tablas `productos` y `ventas` con los registros persistidos físicamente en el disco local.*
> 
> *Sugerencia para la toma:* Presiona `F12` en tu navegador, dirígete a la pestaña **Application** (o Aplicación), despliega **IndexedDB** en el menú izquierdo, selecciona **ventas** y toma captura de la tabla con los registros guardados.

---

### 5.4. Gestión de Inventario y Existencias
El módulo de inventario ofrece un listado tabular del catálogo de productos con sus códigos de barras, categoría, precio, existencias actuales e indicador visual de alerta cuando el stock se encuentra igual o menor que el stock mínimo configurado. Permite además registrar entradas o salidas manuales de almacén.

```
+-----------------------------------------------------------------------------------+
|                                                                                   |
|               [PEGAR AQUÍ CAPTURA 4: TABLA DE INVENTARIO Y STOCK]                 |
|                                                                                   |
+-----------------------------------------------------------------------------------+
```
> 📷 **Captura 4:** *Pestaña "Inventario & Stock" con el listado de productos, las etiquetas de advertencia "Stock Bajo" en color ámbar y los botones de ajuste de stock.*
> 
> *Sugerencia para la toma:* Haz clic en la pestaña **Inventario & Stock** en la barra de navegación superior y toma una captura de pantalla del listado general.

---

### 5.5. Arquitectura PWA y Cola Local
En la cabecera permanente de la aplicación se exhibe el identificador formal del avance: **`Avance 50% (Hito 1)`**, acompañado de un indicador en tiempo real de la cola de transacciones locales pendientes (`Cola Local (N)`), el cual se incrementa automáticamente cada vez que se efectúa una venta en el navegador.

```
+-----------------------------------------------------------------------------------+
|                                                                                   |
|          [PEGAR AQUÍ CAPTURA 5: CABECERA CON INDICADOR DE AVANCE 50%]             |
|                                                                                   |
+-----------------------------------------------------------------------------------+
```
> 📷 **Captura 5:** *Detalle de la barra superior donde se aprecia el título con la insignia naranja "Avance 50% (Hito 1)", el indicador de estado de red y la insignia reactiva "Cola Local".*
> 
> *Sugerencia para la toma:* Toma una captura de la parte superior (header) de la pantalla donde se destaquen los badges y el título del proyecto.

---

### 5.6. Módulos Planificados para el Hito Final
Las pestañas correspondientes al segundo sprint (Sincronización Batch y Dashboard de Analíticas) presentan un tablero de estado que documenta explícitamente qué componentes se encuentran en desarrollo para la entrega final, demostrando una planificación estructurada del proyecto.

```
+-----------------------------------------------------------------------------------+
|                                                                                   |
|       [PEGAR AQUÍ CAPTURA 6: ROADMAP DE MÓDULOS EN DESARROLLO (HITO 2)]           |
|                                                                                   |
+-----------------------------------------------------------------------------------+
```
> 📷 **Captura 6:** *Tablero informativo de "Hito 2: En Desarrollo (Entrega Final)" en las pestañas de Sincronización o Dashboard, exhibiendo el porcentaje de avance (50%) y el cuadro comparativo de objetivos.*
> 
> *Sugerencia para la toma:* Haz clic en la pestaña **Sincronización (Hito 2)** o **Dashboard (Hito 2)** y toma captura del roadmap con las listas de objetivos completados vs programados.

---

## 6. Pruebas Técnicas Realizadas

Durante este primer hito se llevaron a cabo las siguientes pruebas de validación:

| Prueba | Procedimiento | Resultado Obtenido | Estado |
| :--- | :--- | :--- | :---: |
| **Persistencia sin recarga** | Registro de 3 ventas y posterior recarga completa de la página (`F5`). | Las ventas y el descuento de stock se mantuvieron íntegros en IndexedDB. | **Aprobada** |
| **Operación Offline simulada** | Cambio manual del simulador de red a estado `OFFLINE`. | El sistema permitió operar el catálogo y realizar ventas sin errores. | **Aprobada** |
| **Actualización reactiva de stock** | Venta de 2 unidades del producto "Café Espresso". | El stock se redujo inmediatamente de 45 a 43 en la interfaz sin latencia. | **Aprobada** |
| **Compilación PWA** | Ejecución del comando de construcción en producción `npm run build`. | Compilación exitosa generando el manifiesto y el Service Worker (`dist/sw.js`). | **Aprobada** |

---

## 7. Plan de Trabajo para el Hito 2 (50% Restante)

Para la entrega final del proyecto (100%), se tiene programada la ejecución de las fases complementarias:

1. **Fase 3: Motor de Sincronización Batch con Backend**
   - Desarrollo del escuchador de red automático `window.addEventListener('online')`.
   - Construcción del endpoint POST `/api/v1/sincronizar-ventas` en el servidor backend para recibir los lotes pendientes con `syncStatus: 0` y actualizarlos a `syncStatus: 1`.
   - Mecanismo de resolución de conflictos de inventario basado en marcas de tiempo (`timestamps`).

2. **Fase 4: APIs Web Avanzadas**
   - Integración de la cámara web para lectura en tiempo real de códigos de barras físicos mediante `html5-qrcode` / *Barcode Detection API*.
   - Activación de alertas push nativas del navegador con la *Web Notification API*.
   - Generación y descarga de comprobantes de venta en formato PDF térmico de 80mm utilizando `jsPDF` y reglas `@media print`.

3. **Fase 5: Servidor Backend, Roles y Dashboard Analítico**
   - Servidor API en Node.js/Express con autenticación JWT.
   - Vistas restringidas por roles (`Vendedor`, `Almacén` y `Administrador`).
   - Dashboard analítico con gráficos interactivos desarrollados con la librería `Recharts`.

---

## 8. Conclusiones del Avance

El desarrollo del Hito 1 ha permitido establecer con éxito los cimientos más críticos y complejos de una aplicación de Punto de Venta moderna: **la capacidad de operar localmente con persistencia física garantizada mediante IndexedDB**.

El proyecto cumple a cabalidad con el 50% de los requerimientos establecidos, ofreciendo una experiencia de usuario fluida, diseño responsivo de alto impacto visual y un código modularizado preparado para la integración final del backend y la sincronización en red en el siguiente hito evaluativo.

---
*Fin del Reporte de Avance - Hito 1 (50%)*
