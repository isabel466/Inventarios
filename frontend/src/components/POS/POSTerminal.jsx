import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db.js';
import { registrarVentaLocal } from '../../services/syncService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import BarcodeScannerModal from '../Scanner/BarcodeScannerModal.jsx';
import TicketModal from '../Ticket/TicketModal.jsx';
import {
  Search,
  Camera,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  User,
  Barcode,
  Package
} from 'lucide-react';

export default function POSTerminal() {
  const { user } = useAuth();
  
  // Reactividad en tiempo real con IndexedDB mediante Dexie hooks
  const productos = useLiveQuery(() => db.productos.toArray(), []) ?? [];
  const clientes = useLiveQuery(() => db.clientes.toArray(), []) ?? [];

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState('TODAS');
  const [cart, setCart] = useState([]);
  const [selectedCliente, setSelectedCliente] = useState('Cliente General');
  
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [currentVentaCompleted, setCurrentVentaCompleted] = useState(null);
  const [currentVentaDetalles, setCurrentVentaDetalles] = useState([]);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Filtrar productos
  const filteredProductos = productos.filter((p) => {
    const matchesSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || p.codigoBarras.includes(searchTerm);
    const matchesCat = selectedCategoria === 'TODAS' || p.categoria === selectedCategoria;
    return matchesSearch && matchesCat;
  });

  const categorias = ['TODAS', ...new Set(productos.map(p => p.categoria).filter(Boolean))];

  // Agregar al carrito
  const addToCart = (producto) => {
    if (producto.stock <= 0) {
      alert(`El producto "${producto.nombre}" no cuenta con existencias disponibles.`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find(item => item.productoId === producto.id);
      if (existing) {
        if (existing.cantidad + 1 > producto.stock) {
          alert(`Stock máximo alcanzado (${producto.stock} unidades en existencia).`);
          return prev;
        }
        return prev.map(item => item.productoId === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item);
      }
      return [...prev, {
        productoId: producto.id,
        nombre: producto.nombre,
        precio: producto.precio,
        codigoBarras: producto.codigoBarras,
        cantidad: 1,
        stockDisponible: producto.stock
      }];
    });
  };

  const updateQuantity = (productoId, delta) => {
    setCart((prev) => {
      return prev.map(item => {
        if (item.productoId === productoId) {
          const newQty = item.cantidad + delta;
          if (newQty > item.stockDisponible) {
            alert(`Stock máximo disponible: ${item.stockDisponible} unidades.`);
            return item;
          }
          return newQty > 0 ? { ...item, cantidad: newQty } : null;
        }
        return item;
      }).filter(Boolean);
    });
  };

  const removeFromCart = (productoId) => {
    setCart(prev => prev.filter(item => item.productoId !== productoId));
  };

  const totalVenta = cart.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);

  // Escaneo exitoso desde la cámara
  const handleBarcodeScan = (code) => {
    setShowScannerModal(false);
    const prod = productos.find(p => p.codigoBarras === code);
    if (prod) {
      addToCart(prod);
    } else {
      alert(`Producto no encontrado para el código de barras: ${code}`);
    }
  };

  // COBRAR VENTA (ESCRITURA OPTIMISTA EN INDEXEDDB)
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);

    try {
      const res = await registrarVentaLocal(cart, totalVenta, user, selectedCliente);
      
      // Cargar la venta creada para el ticket
      const ventaCreada = await db.ventas.get(res.ventaId);
      const detallesCreados = cart.map(item => ({
        id: crypto.randomUUID(),
        ventaId: res.ventaId,
        productoId: item.productoId,
        nombre: item.nombre,
        cantidad: item.cantidad,
        precioUnitario: item.precio
      }));

      setCurrentVentaCompleted(ventaCreada);
      setCurrentVentaDetalles(detallesCreados);
      setCart([]);
      setShowTicketModal(true);
    } catch (error) {
      alert('Error al registrar la transacción: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="pos-layout">
      
      {/* SECCIÓN IZQUIERDA: CATÁLOGO Y BÚSQUEDA */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        
        {/* BARRA DE BÚSQUEDA & BOTÓN ESCÁNER */}
        <div className="corporate-card" style={{ padding: '14px 18px', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="input-field"
              placeholder="Buscar por nombre o escanear código de barras (Enter para agregar)..."
              style={{ paddingLeft: '38px', height: '40px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const exact = productos.find(p => p.codigoBarras === searchTerm || p.nombre.toLowerCase().includes(searchTerm.toLowerCase()));
                  if (exact) {
                    addToCart(exact);
                    setSearchTerm('');
                  }
                }
              }}
            />
          </div>

          <button className="btn btn-secondary" onClick={() => setShowScannerModal(true)} style={{ height: '40px' }}>
            <Camera size={16} />
            <span>Escanear Código</span>
          </button>
        </div>

        {/* FILTROS POR CATEGORÍA */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
          {categorias.map(cat => {
            const isSelected = selectedCategoria === cat;
            return (
              <button
                key={cat}
                className="btn"
                onClick={() => setSelectedCategoria(cat)}
                style={{
                  padding: '5px 12px',
                  fontSize: '0.8125rem',
                  fontWeight: isSelected ? 600 : 500,
                  backgroundColor: isSelected ? 'var(--accent-primary)' : '#ffffff',
                  color: isSelected ? '#ffffff' : 'var(--text-body)',
                  border: '1px solid',
                  borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-color)',
                  borderRadius: 'var(--radius-sm)'
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* GRID DE PRODUCTOS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '14px', alignContent: 'start' }}>
          {filteredProductos.length === 0 ? (
            <div style={{
              gridColumn: '1 / -1',
              padding: '60px 24px',
              textAlign: 'center',
              backgroundColor: '#ffffff',
              border: '1px dashed var(--border-color)',
              borderRadius: 'var(--radius-lg)'
            }}>
              <Package size={40} color="var(--text-dim)" style={{ marginBottom: '12px' }} />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
                Catálogo de productos vacío
              </h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                No hay productos en inventario. Comienza dando de alta tus productos reales en la pestaña de Inventario.
              </p>
            </div>
          ) : (
            filteredProductos.map((p) => {
            const isLowStock = p.stock <= p.stockMinimo;
            const isOut = p.stock <= 0;
            const cartItem = cart.find(item => item.productoId === p.id);

            return (
              <div
                key={p.id}
                className="corporate-card"
                style={{
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  cursor: isOut ? 'not-allowed' : 'pointer',
                  opacity: isOut ? 0.55 : 1,
                  boxShadow: cartItem ? '0 0 0 2px var(--accent-primary)' : undefined,
                  borderLeft: isOut
                    ? '4px solid var(--accent-rose)'
                    : isLowStock
                    ? '4px solid var(--accent-amber)'
                    : cartItem
                    ? '4px solid var(--accent-primary)'
                    : '1px solid var(--border-color)'
                }}
                onClick={() => !isOut && addToCart(p)}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      #{p.codigoBarras}
                    </span>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      {cartItem && (
                        <span className="badge" style={{ backgroundColor: 'var(--accent-primary)', color: '#ffffff', fontSize: '0.6875rem', fontWeight: 600 }}>
                          {cartItem.cantidad} en orden
                        </span>
                      )}
                      <span className="badge badge-neutral" style={{ fontSize: '0.6875rem' }}>
                        {p.categoria}
                      </span>
                    </div>
                  </div>

                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px', lineHeight: 1.3 }}>
                    {p.nombre}
                  </h4>
                </div>

                <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.1875rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    ${p.precio.toFixed(2)}
                  </span>
                  
                  {isOut ? (
                    <span className="badge badge-offline" style={{ fontSize: '0.7rem' }}>Agotado</span>
                  ) : isLowStock ? (
                    <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>
                      <AlertTriangle size={11} /> {p.stock} disp.
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Stock: <strong>{p.stock}</strong>
                    </span>
                  )}
                </div>
              </div>
            );
          }))}
        </div>

        {/* BARRA FLOTANTE DE ACCESO RÁPIDO AL CARRITO EN MÓVIL */}
        {cart.length > 0 && (
          <div
            className="mobile-cart-bar"
            style={{
              display: 'none',
              position: 'fixed',
              bottom: 'calc(68px + env(safe-area-inset-bottom, 0px))',
              left: '16px',
              right: '16px',
              zIndex: 45,
              backgroundColor: 'var(--accent-primary)',
              color: '#ffffff',
              padding: '12px 18px',
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 6px 20px rgba(0, 0, 0, 0.28)',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer'
            }}
            onClick={() => document.getElementById('pos-cart-panel')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShoppingBag size={18} />
              <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                {cart.reduce((a, b) => a + b.cantidad, 0)} {cart.reduce((a, b) => a + b.cantidad, 0) === 1 ? 'artículo' : 'artículos'} en orden
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>${totalVenta.toFixed(2)}</span>
              <span style={{ fontSize: '0.8rem', padding: '4px 10px', backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: '6px', fontWeight: 600 }}>Ver Ticket / Cobrar →</span>
            </div>
          </div>
        )}

      </div>

      {/* SECCIÓN DERECHA: CARRITO DE COMPRAS Y COBRO */}
      <div id="pos-cart-panel" className="corporate-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '520px' }}>
        <div>
          {/* HEADER CARRITO */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '14px', borderBottom: '1px solid var(--border-color)', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShoppingBag color="var(--accent-primary)" size={18} />
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-main)' }}>Ticket de Venta</h3>
            </div>
            <span className="badge badge-neutral">{cart.length} {cart.length === 1 ? 'artículo' : 'artículos'}</span>
          </div>

          {/* SELECCIÓN CLIENTE */}
          <div className="input-group" style={{ marginBottom: '16px' }}>
            <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={13} color="var(--text-muted)" /> Cliente:
            </label>
            <select
              className="input-field"
              value={selectedCliente}
              onChange={(e) => setSelectedCliente(e.target.value)}
            >
              {clientes.map(c => (
                <option key={c.id} value={c.nombre}>{c.nombre} {c.telefono ? `(${c.telefono})` : ''}</option>
              ))}
            </select>
          </div>

          {/* LISTA DE ÍTEMS EN CARRITO */}
          <div style={{ maxHeight: '360px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {cart.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '44px 16px',
                color: 'var(--text-muted)',
                backgroundColor: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-sm)',
                border: '1px dashed var(--border-color)'
              }}>
                <ShoppingBag size={28} color="var(--text-dim)" style={{ marginBottom: '8px', display: 'inline-block' }} />
                <p style={{ fontSize: '0.85rem', fontWeight: 500 }}>El ticket se encuentra vacío</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Selecciona productos del catálogo o escanea un código.</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.productoId} style={{
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)'
                }}>
                  <div style={{ flex: 1, paddingRight: '8px' }}>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.3 }}>{item.nombre}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>${item.precio.toFixed(2)} c/u</div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button className="btn btn-secondary" style={{ padding: '3px 6px' }} onClick={() => updateQuantity(item.productoId, -1)}>
                      <Minus size={11} />
                    </button>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, minWidth: '18px', textAlign: 'center', color: 'var(--text-main)' }}>{item.cantidad}</span>
                    <button className="btn btn-secondary" style={{ padding: '3px 6px' }} onClick={() => updateQuantity(item.productoId, 1)}>
                      <Plus size={11} />
                    </button>
                    <button className="btn btn-outline" style={{ padding: '4px', marginLeft: '4px', color: 'var(--accent-rose)' }} onClick={() => removeFromCart(item.productoId)} title="Quitar">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* TOTAL Y BOTÓN DE COBRO */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '6px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Subtotal:</span>
            <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>${(totalVenta * 0.84).toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '14px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Impuestos (IVA 16%):</span>
            <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>${(totalVenta * 0.16).toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '16px' }}>
            <span>Total a Cobrar:</span>
            <span>${totalVenta.toFixed(2)}</span>
          </div>

          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '0.9375rem', fontWeight: 600 }}
            disabled={cart.length === 0 || isProcessing}
            onClick={handleCheckout}
          >
            <CheckCircle2 size={16} />
            {isProcessing ? 'Registrando en IndexedDB...' : `Cobrar $${totalVenta.toFixed(2)}`}
          </button>
        </div>

      </div>

      {/* MODAL ESCÁNER */}
      {showScannerModal && (
        <BarcodeScannerModal
          onClose={() => setShowScannerModal(false)}
          onScanSuccess={handleBarcodeScan}
        />
      )}

      {/* MODAL TICKET */}
      {showTicketModal && currentVentaCompleted && (
        <TicketModal
          venta={currentVentaCompleted}
          detalles={currentVentaDetalles}
          onClose={() => setShowTicketModal(false)}
        />
      )}

    </div>
  );
}
