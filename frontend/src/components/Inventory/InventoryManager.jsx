import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db.js';
import { triggerLowStockNotification } from '../../services/syncService.js';
import { exportarInventarioCSV } from '../../services/exportService.js';
import BarcodeLabelModal from './BarcodeLabelModal.jsx';
import {
  Package,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  AlertTriangle,
  Search,
  CheckCircle2,
  Boxes,
  Layers,
  X,
  FileSpreadsheet,
  Trash2,
  Tag
} from 'lucide-react';

export default function InventoryManager() {
  const { tiendaId } = useAuth();

  // Los registros anteriores sin tiendaId quedan intactos pero no se muestran.
  const productos = useLiveQuery(
    () => tiendaId
      ? db.productos.where('tiendaId').equals(tiendaId).toArray()
      : [],
    [tiendaId]
  ) ?? [];

  const movimientos = useLiveQuery(
    () => tiendaId
      ? db.movimientos.where('tiendaId').equals(tiendaId)
          .sortBy('fecha').then(items => items.reverse().slice(0, 15))
      : [],
    [tiendaId]
  ) ?? [];

  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [labelProduct, setLabelProduct] = useState(null);

  // Form para nuevo producto
  const [newProd, setNewProd] = useState({
    nombre: '',
    codigoBarras: '',
    categoria: 'Bebidas',
    precio: '',
    stock: '',
    stockMinimo: ''
  });

  // Form para ajuste de stock
  const [movForm, setMovForm] = useState({
    tipo: 'ENTRADA',
    cantidad: '',
    motivo: 'Compra de proveedor'
  });

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!tiendaId) {
      window.alert('No se pudo identificar la tienda. Inicia sesión nuevamente.');
      return;
    }

    const nombre = newProd.nombre.trim();
    const stock = Number(newProd.stock);
    const stockMinimo = Number(newProd.stockMinimo);
    const precio = Number(newProd.precio);

    if (!nombre || !Number.isSafeInteger(stock) || stock < 0 ||
        !Number.isSafeInteger(stockMinimo) || stockMinimo < 0 ||
        !Number.isFinite(precio) || precio < 0 || newProd.precio === '') {
      window.alert('Revisa nombre, precio y cantidades. No se permiten valores negativos.');
      return;
    }

    const id = crypto.randomUUID();
  
const productoObj = {
  id,
  tiendaId,
  syncStatus: 0,
  nombre,
  codigoBarras:
    newProd.codigoBarras.trim() ||
    `${Math.floor(10000000 + Math.random() * 90000000)}`,
  categoria: newProd.categoria,
  precio,

  // Existencias actuales en este dispositivo.
  stock,

  // Existencias originales al crear el producto.
  // No deben cambiar con ventas ni ajustes posteriores.
  stockInicial: stock,

  stockMinimo
};


    try {
      const duplicado = await db.productos.where('tiendaId').equals(tiendaId)
        .filter(p => p.codigoBarras === productoObj.codigoBarras).first();
      if (duplicado) {
        window.alert('Esta tienda ya tiene un producto con ese código de barras.');
        return;
      }

      await db.transaction('rw', db.productos, db.movimientos, async () => {
        await db.productos.add(productoObj);
        await db.movimientos.add({
          id: crypto.randomUUID(),
          tiendaId,
          productoId: id,
          tipo: 'ENTRADA',
          cantidad: stock,
          fecha: new Date().toISOString(),
          motivo: 'Inventario Inicial'
        });
      });

      setShowAddModal(false);
      setNewProd({ nombre: '', codigoBarras: '', categoria: 'Bebidas', precio: '', stock: '', stockMinimo: '' });
    } catch (error) {
      console.error('Error guardando producto:', error);
      window.alert('No se pudo guardar el producto localmente.');
    }
  };

  const handleStockMovement = async (e) => {
    e.preventDefault();
    if (!tiendaId || !selectedProduct || selectedProduct.tiendaId !== tiendaId) {
      window.alert('Producto o tienda no válidos.');
      return;
    }

    const cantidadNum = Number(movForm.cantidad);
    if (!Number.isSafeInteger(cantidadNum) || cantidadNum <= 0 ||
        !['ENTRADA', 'SALIDA'].includes(movForm.tipo)) {
      window.alert('Introduce una cantidad entera mayor que cero.');
      return;
    }

    let stockActualizado;
    try {
      await db.transaction(
        'rw',
        db.productos,
        db.movimientos,
        db.operacionesInventario,
        async () => {
        const productoActual = await db.productos.get(selectedProduct.id);
        if (!productoActual || productoActual.tiendaId !== tiendaId) {
          throw new Error('El producto no pertenece a la tienda actual.');
        }
        const nuevoStock = movForm.tipo === 'ENTRADA'
          ? productoActual.stock + cantidadNum
          : productoActual.stock - cantidadNum;
        if (nuevoStock < 0) {
          throw new Error('No hay existencias suficientes para esa salida.');
        }
        await db.productos.update(productoActual.id, {
          stock: nuevoStock,
          syncStatus: 0
        });
        await db.operacionesInventario.add({
          id: crypto.randomUUID(),
          tiendaId,
          productoId: productoActual.id,
          tipo: movForm.tipo,
          cantidad: cantidadNum,
          stockAnterior: productoActual.stock,
          stockNuevo: nuevoStock,
          motivo: movForm.motivo.trim(),
          fecha: new Date().toISOString(),
          syncStatus: 0
        });
        await db.movimientos.add({
          id: crypto.randomUUID(),
          tiendaId,
          productoId: productoActual.id,
          tipo: movForm.tipo,
          cantidad: cantidadNum,
          fecha: new Date().toISOString(),
          motivo: movForm.motivo.trim()
        });
        stockActualizado = { ...productoActual, stock: nuevoStock };
      });
    } catch (error) {
      window.alert(error.message || 'No se pudo modificar el stock.');
      return;
    }

    if (stockActualizado.stock <= stockActualizado.stockMinimo) {
      triggerLowStockNotification(stockActualizado);
    }
    setShowMovementModal(false);
    setSelectedProduct(null);
  };

  // Se deshabilita temporalmente para no perder eliminaciones offline ni
  // desincronizar el inventario local del inventario de D1.
  const handleEliminarProducto = () => {
    window.alert('La eliminación está temporalmente deshabilitada hasta implementar la cola de sincronización de productos.');
  };

  const filtered = productos.filter(p => p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || p.codigoBarras.includes(searchTerm));
  const lowStockCount = productos.filter(p => p.stock <= p.stockMinimo).length;
  const totalUnits = productos.reduce((acc, p) => acc + (p.stock || 0), 0);

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* HEADER & RESUMEN DE INVENTARIO */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        <div className="corporate-card" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
            <span>Catálogo Registrado</span>
            <Boxes size={18} color="var(--text-muted)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '8px' }}>
            {productos.length}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Productos activos en base local</span>
        </div>

        <div className="corporate-card" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
            <span>Unidades en Existencia</span>
            <Package size={18} color="var(--text-muted)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '8px' }}>
            {totalUnits}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Stock acumulado en almacén</span>
        </div>

        <div className="corporate-card" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
            <span>Alertas de Stock Bajo</span>
            <AlertTriangle size={18} color="var(--accent-amber)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: lowStockCount > 0 ? 'var(--accent-amber)' : 'var(--accent-emerald)', marginTop: '8px' }}>
            {lowStockCount}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Por debajo del umbral mínimo</span>
        </div>
      </div>

      {/* ACCIONES Y TABLA DE PRODUCTOS */}
      <div className="corporate-panel" style={{ padding: '20px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="input-field"
              placeholder="Filtrar por nombre o código de barras..."
              style={{ paddingLeft: '38px', height: '38px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-secondary"
              onClick={() => exportarInventarioCSV(filtered)}
              style={{ height: '38px', gap: '6px' }}
              title="Descargar tabla en formato CSV compatible con Microsoft Excel"
            >
              <FileSpreadsheet size={16} color="var(--accent-emerald)" />
              <span>Exportar Excel / CSV</span>
            </button>

            <button className="btn btn-primary" onClick={() => setShowAddModal(true)} style={{ height: '38px' }}>
              <Plus size={16} />
              <span>Registrar Producto</span>
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-main)' }}>
                <th style={{ padding: '10px 14px', fontWeight: 600 }}>Código</th>
                <th style={{ padding: '10px 14px', fontWeight: 600 }}>Descripción</th>
                <th style={{ padding: '10px 14px', fontWeight: 600 }}>Categoría</th>
                <th style={{ padding: '10px 14px', fontWeight: 600 }}>Precio</th>
                <th style={{ padding: '10px 14px', fontWeight: 600 }}>Stock Actual</th>
                <th style={{ padding: '10px 14px', fontWeight: 600 }}>Mínimo</th>
                <th style={{ padding: '10px 14px', fontWeight: 600, textAlign: 'right' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No se encontraron productos en el inventario.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const isLow = p.stock <= p.stockMinimo;
                  const isOut = p.stock <= 0;
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: '#ffffff' }}>
                      <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                        #{p.codigoBarras}
                      </td>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-main)' }}>
                        {p.nombre}
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>
                        <span className="badge badge-neutral">{p.categoria}</span>
                      </td>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-main)' }}>
                        ${p.precio.toFixed(2)}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        {isOut ? (
                          <span className="badge badge-offline">Agotado (0)</span>
                        ) : isLow ? (
                          <span className="badge badge-warning">
                            <AlertTriangle size={11} /> {p.stock} unidades
                          </span>
                        ) : (
                          <span className="badge badge-online">
                            {p.stock} unidades
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>
                        {p.stockMinimo}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '0.78rem', gap: '4px' }}
                            title="Generar e imprimir etiqueta de código de barras"
                            onClick={() => setLabelProduct(p)}
                          >
                            <Tag size={13} color="var(--accent-primary)" />
                            <span>Etiqueta</span>
                          </button>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                            onClick={() => {
                              setSelectedProduct(p);
                              setShowMovementModal(true);
                            }}
                          >
                            Ajustar Stock
                          </button>
                          <button
                            className="btn"
                            style={{
                              padding: '4px 8px',
                              fontSize: '0.78rem',
                              color: 'var(--accent-rose)',
                              backgroundColor: 'var(--accent-rose-subtle)',
                              border: '1px solid var(--accent-rose-border)',
                              borderRadius: 'var(--radius-xs)'
                            }}
                            title="Eliminar producto"
                            onClick={() => handleEliminarProducto(p)}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* MODAL NUEVO PRODUCTO */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <form style={{
            width: '100%',
            maxWidth: '480px',
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-modal)'
          }} onSubmit={handleAddProduct}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>Registrar Nuevo Producto</h3>
              <button type="button" className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => setShowAddModal(false)}>
                <X size={16} />
              </button>
            </div>
            
            <div style={{ padding: '20px' }}>
              <div className="input-group" style={{ marginBottom: '14px' }}>
                <label className="input-label">Descripción del Producto:</label>
                <input type="text" required className="input-field" placeholder="Ej. Agua Mineral 600ml" value={newProd.nombre} onChange={e => setNewProd({ ...newProd, nombre: e.target.value })} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div className="input-group">
                  <label className="input-label">Código de Barras:</label>
                  <input type="text" className="input-field" placeholder="Autogenerado" value={newProd.codigoBarras} onChange={e => setNewProd({ ...newProd, codigoBarras: e.target.value })} />
                </div>
                <div className="input-group">
                  <label className="input-label">Categoría:</label>
                  <select className="input-field" value={newProd.categoria} onChange={e => setNewProd({ ...newProd, categoria: e.target.value })}>
                    <option value="Bebidas">Bebidas</option>
                    <option value="Alimentos">Alimentos</option>
                    <option value="Snacks">Snacks</option>
                    <option value="Limpieza">Limpieza</option>
                    <option value="General">General</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '10px' }}>
                <div className="input-group">
                  <label className="input-label">Precio ($):</label>
                  <input type="number" step="0.01" required className="input-field" placeholder="0.00" value={newProd.precio} onChange={e => setNewProd({ ...newProd, precio: e.target.value })} />
                </div>
                <div className="input-group">
                  <label className="input-label">Stock Inicial:</label>
                  <input type="number" required className="input-field" placeholder="0" value={newProd.stock} onChange={e => setNewProd({ ...newProd, stock: e.target.value })} />
                </div>
                <div className="input-group">
                  <label className="input-label">Stock Mínimo:</label>
                  <input type="number" required className="input-field" placeholder="5" value={newProd.stockMinimo} onChange={e => setNewProd({ ...newProd, stockMinimo: e.target.value })} />
                </div>
              </div>
            </div>

            <div style={{ padding: '14px 20px', backgroundColor: 'var(--bg-subtle)', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary">Guardar en Base Local</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL AJUSTE DE STOCK */}
      {showMovementModal && selectedProduct && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <form style={{
            width: '100%',
            maxWidth: '440px',
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-modal)'
          }} onSubmit={handleStockMovement}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>Ajuste de Stock</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{selectedProduct.nombre} (Existencias: {selectedProduct.stock})</p>
              </div>
              <button type="button" className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => setShowMovementModal(false)}>
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: '20px' }}>
              <div className="input-group" style={{ marginBottom: '14px' }}>
                <label className="input-label">Tipo de Movimiento:</label>
                <select className="input-field" value={movForm.tipo} onChange={e => setMovForm({ ...movForm, tipo: e.target.value })}>
                  <option value="ENTRADA">Entrada de Almacén (+ Aumentar)</option>
                  <option value="SALIDA">Salida de Almacén (- Disminuir)</option>
                </select>
              </div>

              <div className="input-group" style={{ marginBottom: '14px' }}>
                <label className="input-label">Cantidad a modificar:</label>
                <input type="number" min="1" required className="input-field" placeholder="1" value={movForm.cantidad} onChange={e => setMovForm({ ...movForm, cantidad: e.target.value })} />
              </div>

              <div className="input-group" style={{ marginBottom: '10px' }}>
                <label className="input-label">Motivo o Referencia:</label>
                <input type="text" required className="input-field" placeholder="Ej. Reabastecimiento de proveedor" value={movForm.motivo} onChange={e => setMovForm({ ...movForm, motivo: e.target.value })} />
              </div>
            </div>

            <div style={{ padding: '14px 20px', backgroundColor: 'var(--bg-subtle)', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowMovementModal(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary">Aplicar Movimiento</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL GENERADOR E IMPRESOR DE ETIQUETAS DE CÓDIGOS DE BARRAS */}
      {labelProduct && (
        <BarcodeLabelModal
          producto={labelProduct}
          onClose={() => setLabelProduct(null)}
        />
      )}

    </div>
  );
}
