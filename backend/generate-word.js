import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle
} from 'docx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper para crear cajas de placeholder para pegar capturas
function createScreenshotBox(title, description) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.DASHED, size: 2, color: '2563EB' },
      bottom: { style: BorderStyle.DASHED, size: 2, color: '2563EB' },
      left: { style: BorderStyle.DASHED, size: 2, color: '2563EB' },
      right: { style: BorderStyle.DASHED, size: 2, color: '2563EB' }
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: 'F8FAFC' },
            children: [
              new Paragraph({
                spacing: { before: 140, after: 80 },
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: `📸 ${title.toUpperCase()}`,
                    bold: true,
                    color: '1E40AF',
                    size: 22
                  })
                ]
              }),
              new Paragraph({
                spacing: { after: 120 },
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: description,
                    italics: true,
                    color: '475569',
                    size: 19
                  })
                ]
              }),
              new Paragraph({
                spacing: { after: 160 },
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: '[ HAZ CLIC AQUÍ Y PEGA TU CAPTURA DE PANTALLA (Ctrl + V) ]',
                    bold: true,
                    color: '94A3B8',
                    size: 18
                  })
                ]
              })
            ]
          })
        ]
      })
    ]
  });
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 120 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 32,
        color: '0F172A'
      })
    ]
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 260, after: 100 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 26,
        color: '1E293B'
      })
    ]
  });
}

function p(text, options = {}) {
  return new Paragraph({
    spacing: { after: 120, line: 276 },
    children: [
      new TextRun({
        text,
        size: 22,
        color: '334155',
        ...options
      })
    ]
  });
}

function bullet(boldPrefix, text) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 80, line: 260 },
    children: [
      new TextRun({ text: boldPrefix + ' ', bold: true, color: '0F172A', size: 21 }),
      new TextRun({ text, color: '334155', size: 21 })
    ]
  });
}

const doc = new Document({
  styles: {
    default: {
      document: {
        run: {
          font: 'Calibri'
        }
      }
    }
  },
  sections: [
    {
      properties: {
        page: {
          margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 }
        }
      },
      children: [
        // PORTADA / TÍTULO PRINCIPAL
        new Paragraph({
          spacing: { before: 200, after: 100 },
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: 'Informe Técnico de Desarrollo',
              bold: true,
              size: 44,
              color: '0F172A'
            })
          ]
        }),
        new Paragraph({
          spacing: { after: 200 },
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: 'Sistema de Punto de Venta (POS) y Control de Inventarios Multiplataforma Offline-First',
              bold: true,
              size: 28,
              color: '2563EB'
            })
          ]
        }),

        // METADATOS
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  shading: { fill: 'F1F5F9' },
                  children: [
                    p('Proyecto: Sistema POS & Inventario Empresarial', { bold: true }),
                    p('Arquitectura: Offline-First PWA + Capacitor Mobile (Google Play Store & Apple App Store)'),
                    p('Backend & Base de Datos: Node.js, Express, SQLite Relacional (ACID), JWT y Bcrypt'),
                    p('Fecha de Entrega: Noviembre 2026')
                  ]
                })
              ]
            })
          ]
        }),

        new Paragraph({ spacing: { after: 200 } }),

        // 1. RESUMEN EJECUTIVO
        h1('1. Resumen Ejecutivo del Proyecto'),
        p('El presente informe describe el desarrollo técnico, arquitectura e integración funcional del Sistema POS & Control de Inventarios, una solución moderna orientada al comercio minorista con capacidad de operación ininterrumpida sin conexión a internet (Offline-First).'),
        p('El sistema resuelve la problemática de pérdida de transacciones y dependencia de conectividad crítica en terminales de cobro mediante una arquitectura híbrida:'),
        bullet('1. Almacenamiento Local Autónomo:', 'Persistencia reactiva en el dispositivo cliente mediante IndexedDB y Service Workers.'),
        bullet('2. Sincronización Transaccional por Lotes:', 'Motor en segundo plano que detecta conectividad y transmite lotes de venta al backend relacional.'),
        bullet('3. Seguridad y Control de Roles:', 'Autenticación con contraseñas encriptadas con bcrypt, tokens JWT y una bóveda de sesión cifrada localmente en el dispositivo.'),
        bullet('4. Despliegue Multiplataforma:', 'Preparado para distribución en la web (PWA) y empaquetado nativo mediante Capacitor para publicación en Google Play Store (Android) y Apple App Store (iOS).'),

        // 2. ARQUITECTURA DEL SISTEMA
        h1('2. Arquitectura del Sistema'),
        p('La aplicación se estructura en tres capas principales:'),
        bullet('Capa de Cliente (Dispositivo):', 'Interfaz reactiva construida en React + Vite, base de datos local en IndexedDB (Dexie.js), bóveda de sesión cifrada, escáner óptico por cámara y generador de tickets térmicos/PDF.'),
        bullet('Capa de Red y Sincronización:', 'Cola de eventos asíncronos que agrupa las transacciones efectuadas sin red y las transmite por lotes en cuanto se detecta conexión activa.'),
        bullet('Capa de Servidor (Backend):', 'Servidor Express con middleware de autenticación JWT, almacenamiento persistente en base de datos relacional SQL (SQLite con soporte para PostgreSQL) y servicio de exportación a Excel/CSV.'),

        // 3. MÓDULOS DEL SISTEMA Y CAPTURAS
        h1('3. Módulos y Funcionalidades Desarrolladas'),

        h2('3.1. Pantalla de Acceso, Registro y Seguridad (Login & SignUp)'),
        p('Permite el acceso formal al sistema mediante credenciales validadas en servidor. Incluye formulario de inicio de sesión y registro de nuevos negocios (donde el usuario adquiere automáticamente el rol de Administrador). Las contraseñas están protegidas mediante hash bcrypt y las sesiones se almacenan de forma cifrada en el dispositivo.'),
        createScreenshotBox(
          'Captura 1: Pantalla de Inicio de Sesión y Registro',
          'Toma captura de la pantalla de Login con los campos de correo, contraseña y la pestaña "Crear Cuenta".'
        ),
        new Paragraph({ spacing: { after: 200 } }),

        h2('3.2. Control y Restricción Estricta de Accesos por Rol (RBAC)'),
        p('Se implementó un control de acceso basado en roles (Role-Based Access Control) con las siguientes restricciones en la interfaz:'),
        bullet('Vendedor (Cajero):', 'Acceso exclusivo al Punto de Venta (POS) y catálogo de productos. No tiene acceso a inventario ni reportes.'),
        bullet('Encargado de Almacén:', 'Acceso exclusivo a Inventario y Existencias (entradas/salidas). No tiene acceso a ventas ni finanzas.'),
        bullet('Administrador:', 'Acceso total a Dashboard global, Reportes, Personal, POS, Inventario y Sincronización.'),
        createScreenshotBox(
          'Captura 2: Vista Restringida del Vendedor / Cajero',
          'Inicia sesión con una cuenta de vendedor para mostrar que solo tiene acceso a la pestaña "Punto de Venta".'
        ),
        new Paragraph({ spacing: { after: 200 } }),

        h2('3.3. Terminal de Punto de Venta (POS) y Cobro'),
        p('Permite buscar productos, escanear códigos de barras, agregar al carrito con cálculo automático de impuestos (IVA 16%), subtotal y total. El cobro descuenta el stock local al instante y genera el ticket de venta.'),
        createScreenshotBox(
          'Captura 3: Terminal de Punto de Venta (POS) con Carrito Activo',
          'Agrega artículos al carrito y captura la terminal mostrando el desglose financiero del ticket y el botón de cobrar.'
        ),
        new Paragraph({ spacing: { after: 200 } }),

        h2('3.4. Escáner Óptico de Código de Barras por Cámara'),
        p('Integración con la librería html5-qrcode para detectar códigos de barras tradicionales y códigos QR mediante la cámara de teléfonos, tabletas o laptops, agregando los artículos al carrito en tiempo real.'),
        createScreenshotBox(
          'Captura 4: Modal del Escáner de Código de Barras',
          'Presiona el botón "Escanear Código" y captura la ventana modal con la cámara en vivo.'
        ),
        new Paragraph({ spacing: { after: 200 } }),

        h2('3.5. Emisión de Tickets de Venta (Impresión Térmica y Descarga en PDF)'),
        p('Al concretar una transacción, el sistema despliega el comprobante digital listo para imprimir en impresoras térmicas de 80mm o para descargar directamente como archivo PDF generado con jsPDF.'),
        createScreenshotBox(
          'Captura 5: Modal de Ticket de Venta y Descarga PDF',
          'Realiza una venta de prueba y captura el ticket con los botones "Imprimir Ticket" y "Descargar PDF".'
        ),
        new Paragraph({ spacing: { after: 200 } }),

        h2('3.6. Control de Inventarios, Entradas y Salidas de Mercancía'),
        p('Módulo para consultar existencias, umbrales mínimos, registrar nuevos productos en el catálogo, ajustar stock (entradas por compra o salidas por merma) y eliminar artículos.'),
        createScreenshotBox(
          'Captura 6: Módulo de Gestión de Inventario',
          'Captura la tabla de productos mostrando el stock, las alertas de stock bajo y los botones de registrar y ajustar.'
        ),
        new Paragraph({ spacing: { after: 200 } }),

        h2('3.7. Gestión de Personal y Cuentas de Colaboradores'),
        p('Panel administrativo donde el dueño del negocio puede registrar nuevos cajeros o almacenistas con sus contraseñas y roles asignados de forma centralizada.'),
        createScreenshotBox(
          'Captura 7: Panel de Administración de Personal',
          'Captura la pestaña "Personal" mostrando la lista de usuarios y el botón "Nuevo Colaborador".'
        ),
        new Paragraph({ spacing: { after: 200 } }),

        h2('3.8. Reportes, Analítica y Exportación a Excel / CSV'),
        p('Gráficos de ventas por categoría y transacciones con la librería recharts, junto con la exportación del catálogo y ventas en formato CSV con codificación UTF-8 BOM para apertura nativa en Microsoft Excel.'),
        createScreenshotBox(
          'Captura 8: Gráficas de Analítica y Botón de Exportar Excel',
          'Captura el panel de reportes con las gráficas de ventas y el botón "Exportar Ventas Excel / CSV".'
        ),
        new Paragraph({ spacing: { after: 200 } }),

        h2('3.9. Monitor de Sincronización Cloud'),
        p('Panel de auditoría que permite visualizar la cola de ventas pendientes en IndexedDB, forzar la sincronización hacia el servidor e inspeccionar la carga útil en formato JSON.'),
        createScreenshotBox(
          'Captura 9: Monitor de Sincronización Cloud',
          'Captura la pestaña de Sincronización mostrando el estado de la cola y el visor de paquetes JSON.'
        ),
        new Paragraph({ spacing: { after: 200 } }),

        h2('3.10. Adaptabilidad Móvil y Preparación para App Stores'),
        p('La aplicación cuenta con una barra de navegación inferior (Bottom Bar) para teléfonos móviles, safe-area insets para pantallas modernas y proyectos nativos en Capacitor listos para Google Play Store y Apple App Store.'),
        createScreenshotBox(
          'Captura 10: Interfaz Móvil Responsiva con Barra Inferior',
          'Presiona F12 en tu navegador, activa el modo móvil y captura la vista de teléfono con la barra inferior.'
        ),
        new Paragraph({ spacing: { after: 200 } }),

        // 4. ESQUEMA DE BASE DE DATOS RELACIONAL
        h1('4. Esquema de Base de Datos Relacional (SQL)'),
        p('El backend implementa un motor relacional SQL con tablas vinculadas mediante llaves foráneas:'),
        bullet('Tabla usuarios:', 'id (PK), email (UNIQUE), password_hash (bcrypt), nombre, role, creado_en.'),
        bullet('Tabla productos:', 'id (PK), codigoBarras (UNIQUE), nombre, stock, stockMinimo, precio, categoria, actualizado_en.'),
        bullet('Tabla ventas:', 'id (PK), fecha, total, usuarioId, clienteNombre, sincronizadoEn.'),
        bullet('Tabla ventas_detalle:', 'id (PK), ventaId (FK -> ventas), productoId (FK -> productos), cantidad, precioUnitario, subtotal.'),
        bullet('Tabla sync_logs:', 'id (PK AUTOINCREMENT), timestamp, ventasSincronizadas, ids_json.'),

        // 5. STACK TECNOLÓGICO
        h1('5. Stack Tecnológico del Proyecto'),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({ shading: { fill: '0F172A' }, children: [new Paragraph({ children: [new TextRun({ text: 'Capa', bold: true, color: 'FFFFFF' })] })] }),
                new TableCell({ shading: { fill: '0F172A' }, children: [new Paragraph({ children: [new TextRun({ text: 'Tecnología', bold: true, color: 'FFFFFF' })] })] }),
                new TableCell({ shading: { fill: '0F172A' }, children: [new Paragraph({ children: [new TextRun({ text: 'Propósito', bold: true, color: 'FFFFFF' })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [p('Frontend')] }),
                new TableCell({ children: [p('React 18 + Vite')] }),
                new TableCell({ children: [p('Interfaz reactiva de alto rendimiento')] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [p('Persistencia Local')] }),
                new TableCell({ children: [p('Dexie.js (IndexedDB)')] }),
                new TableCell({ children: [p('Almacenamiento offline autónomo en el cliente')] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [p('PWA & Caché')] }),
                new TableCell({ children: [p('Workbox, Vite PWA')] }),
                new TableCell({ children: [p('Instalación en dispositivo y caché de assets')] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [p('Empaquetado Móvil')] }),
                new TableCell({ children: [p('Capacitor (Android & iOS)')] }),
                new TableCell({ children: [p('Proyectos nativos para Play Store y App Store')] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [p('Backend API')] }),
                new TableCell({ children: [p('Node.js + Express')] }),
                new TableCell({ children: [p('API REST y endpoints de sincronización batch')] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [p('Seguridad')] }),
                new TableCell({ children: [p('JWT + Bcrypt')] }),
                new TableCell({ children: [p('Autenticación y cifrado de contraseñas')] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [p('Base de Datos')] }),
                new TableCell({ children: [p('SQLite Relacional / PostgreSQL')] }),
                new TableCell({ children: [p('Almacenamiento persistente en servidor')] })
              ]
            })
          ]
        }),

        new Paragraph({ spacing: { after: 200 } }),

        // 6. CONCLUSIONES
        h1('6. Conclusiones'),
        p('El sistema desarrollado consolida una plataforma comercial robusta, escalable y completamente lista para entornos reales. Combina la agilidad de una Progressive Web App con la potencia de empaquetado nativo para tiendas de aplicaciones móviles, garantizando que el cobro y control de inventario nunca se detengan, incluso en ausencia de internet.')
      ]
    }
  ]
});

async function main() {
  const outputPath = path.resolve(__dirname, '..', 'INFORME_TECNICO_PROYECTO.docx');
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputPath, buffer);
  console.log(`✅ Documento de Word generado exitosamente en: ${outputPath}`);
}

main().catch(console.error);
