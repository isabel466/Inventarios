import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db.js';
import { triggerLowStockNotification } from '../../services/syncService.js';
import { Package, Plus, ArrowUpRight, ArrowDownLeft, AlertTriangle, Search, Filter, Edit3 } from 'lucide-react';

export default function InventoryManager() {
  const productos = useLiveQuery(() => db.productos.toArray(), []) ?? [];
  const movimientos = useLiveQuery(() => db.movimientos.orderBy('fecha').reverse().limit(15).toArray(), []) ?? [];

  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

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
    const id = `prod-${crypto.randomUUID().slice(0, 8)}`;
    const productoObj = {
      id,
      nombre: newProd.nombre,
      codigoBarras: newProd.codigoBarras || `${Math.floor(10000000 + Math.random() * 90000000)}`,
      categoria: newProd.categoria,
      precio: parseFloat(newProd.precio),
      stock: parseInt(newProd.stock),
      stockMinimo: parseInt(newProd.stockMinimo)
    };

    await db.productos.add(productoObj);

    // Movimiento inicial
    await db.movimientos.add({
      id: crypto.randomUUID(),
      productoId: id,
      tipo: 'ENTRADA',
      cantidad: productoObj.stock,
      fecha: new Date().toISOString(),
      motivo: 'Inventario Inicial'
    });

    setShowAddModal(false);
    setNewProd({ nombre: '', codigoBarras: '', categoria: 'Bebidas', precio: '', stock: '', stockMinimo: '' });
  };

  const handleStockMovement = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const cantidadNum = parseInt(movForm.cantidad);
    const nuevoStock = movForm.tipo === 'ENTRADA' 
      ? selectedProduct.stock + cantidadNum
      : Math.max(0, selectedProduct.stock - cantidadNum);

    await db.transaction('rw', db.productos, db.movimientos, async () => {
      await db.productos.update(selectedProduct.id, { stock: nuevoStock });
      await db.movimientos.add({
        id: crypto.randomUUID(),
        productoId: selectedProduct.id,
        tipo: movForm.tipo,
        cantidad: cantidadNum,
        fecha: new Date().toISOString(),
        motivo: movForm.motivo
      });
    });

    if (nuevoStock <= selectedProduct.stockMinimo) {
      triggerLowStockNotification({ ...selectedProduct, stock: nuevoStock });
    }

    setShowMovementModal(false);
    setSelectedProduct(null);
  };

  const filtered = productos.filter(p => p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || p.codigoBarras.includes(searchTerm));

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* HEADER DE INVENTARIO */}
      <div className="glass-card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Package color="var(--accent-cyan)" size={24} /> Gestión de Inventario & Stock
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Total productos: <strong>{productos.length}</strong> • Stock bajo: <strong style={{ color: 'var(--accent-amber)' }}>{productos.filter(p => p.stock <= p.stockMinimo).length}</strong>
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={18} /> Nuevo Producto
        </button>
      </div>

      {/* TABLA DE PRODUCTOS & BÚSQUEDA */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        
        <div style={{ marginBottom: '16px', display: 'flex', gap: '12px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="input-field"
              placeholder="Buscar producto por nombre o código de barras..."
              style={{ paddingLeft: '40px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px' }}>Código</th>
                <th style={{ padding: '12px' }}>Producto</th>
                <th style={{ padding: '12px' }}>Categoría</th>
                <th style={{ padding: '12px' }}>Precio</th>
                <th style={{ padding: '12px' }}>Stock Actual</th>
                <th style={{ padding: '12px' }}>Stock Mínimo</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const isLow = p.stock <= p.stockMinimo;
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '12px', fontFamily: 'monospace', color: 'var(--accent-cyan)' }}>#{p.codigoBarras}</td>
                    <td style={{ padding: '12px', fontWeight: 600 }}>{p.nombre}</td>
                    <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{p.categoria}</td>
                    <td style={{ padding: '12px', fontWeight: 600 }}>${p.precio.toFixed(2)}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        color: isLow ? 'var(--accent-rose)' : 'var(--accent-emerald)',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        {p.stock} {isLow && <AlertTriangle size={14} color="var(--accent-amber)" />}
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{p.stockMinimo}</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                        onClick={() => {
                          setSelectedProduct(p);
                          setShowMovementModal(true);
                        }}
                      >
                        Ajustar Stock
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

      {/* MODAL NUEVO PRODUCTO */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <form className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '24px' }} onSubmit={handleAddProduct}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Agregar Nuevo Producto</h3>
            
            <div className="input-group" style={{ marginBottom: '12px' }}>
              <label className="input-label">Nombre del Producto:</label>
              <input type="text" required className="input-field" value={newProd.nombre} onChange={e => setNewProd({ ...newProd, nombre: e.target.value })} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <div className="input-group">
                <label className="input-label">Precio ($):</label>
                <input type="number" step="0.01" required className="input-field" value={newProd.precio} onChange={e => setNewProd({ ...newProd, precio: e.target.value })} />
              </div>
              <div className="input-group">
                <label className="input-label">Stock Inicial:</label>
                <input type="number" required className="input-field" value={newProd.stock} onChange={e => setNewProd({ ...newProd, stock: e.target.value })} />
              </div>
              <div className="input-group">
                <label className="input-label">Stock Mínimo:</label>
                <input type="number" required className="input-field" value={newProd.stockMinimo} onChange={e => setNewProd({ ...newProd, stockMinimo: e.target.value })} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary">Guardar Producto</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL AJUSTE DE STOCK */}
      {showMovementModal && selectedProduct && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <form className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '24px' }} onSubmit={handleStockMovement}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '6px' }}>Ajustar Stock de Inventario</h3>
            <p style={{ color: 'var(--accent-cyan)', marginBottom: '16px' }}>{selectedProduct.nombre} (Stock actual: {selectedProduct.stock})</p>

            <div className="input-group" style={{ marginBottom: '12px' }}>
              <label className="input-label">Tipo de Movimiento:</label>
              <select className="input-field" value={movForm.tipo} onChange={e => setMovForm({ ...movForm, tipo: e.target.value })}>
                <option value="ENTRADA">📥 ENTRADA (+ Aumentar Stock)</option>
                <option value="SALIDA">📤 SALIDA (- Disminuir Stock)</option>
              </select>
            </div>

            <div className="input-group" style={{ marginBottom: '12px' }}>
              <label className="input-label">Cantidad:</label>
              <input type="number" min="1" required className="input-field" value={movForm.cantidad} onChange={e => setMovForm({ ...movForm, cantidad: e.target.value })} />
            </div>

            <div className="input-group" style={{ marginBottom: '20px' }}>
              <label className="input-label">Motivo / Descripción:</label>
              <input type="text" required className="input-field" value={movForm.motivo} onChange={e => setMovForm({ ...movForm, motivo: e.target.value })} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowMovementModal(false)}>Cancelar</button>
              <button type="submit" className="btn btn-success">Aplicar Ajuste</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
