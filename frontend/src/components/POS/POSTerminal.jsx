import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db.js';
import { registrarVentaLocal } from '../../services/syncService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useProjectMode } from '../../context/ProjectModeContext.jsx';
import BarcodeScannerModal from '../Scanner/BarcodeScannerModal.jsx';
import TicketModal from '../Ticket/TicketModal.jsx';
import { Search, Camera, ShoppingBag, Plus, Minus, Trash2, CheckCircle2, AlertTriangle, User, Database, ArrowRight } from 'lucide-react';

export default function POSTerminal() {
  const { user } = useAuth();
  const { isAvanceMode } = useProjectMode();
  
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
  const [showAvanceModal, setShowAvanceModal] = useState(false);
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
      alert(`⚠️ El producto "${producto.nombre}" no tiene stock disponible.`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find(item => item.productoId === producto.id);
      if (existing) {
        if (existing.cantidad + 1 > producto.stock) {
          alert(`⚠️ Stock máximo alcanzado (${producto.stock} unidades).`);
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
            alert(`⚠️ Stock máximo disponible: ${item.stockDisponible}`);
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
      alert(`❌ Producto no encontrado para el código de barras: ${code}`);
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
      
      if (isAvanceMode) {
        setShowAvanceModal(true);
      } else {
        setShowTicketModal(true);
      }
    } catch (error) {
      alert('Error al registrar la venta: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 380px', gap: '20px', minHeight: 'calc(100vh - 120px)' }}>
      
      {/* SECCIÓN IZQUIERDA: CATÁLOGO Y BÚSQUEDA */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* BARRA DE BÚSQUEDA & BOTÓN ESCÁNER */}
        <div className="glass-card" style={{ padding: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="input-field"
              placeholder="Buscar por código de barras o nombre de producto..."
              style={{ paddingLeft: '40px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const exact = productos.find(p => p.codigoBarras === searchTerm);
                  if (exact) {
                    addToCart(exact);
                    setSearchTerm('');
                  }
                }
              }}
            />
          </div>

          <button className="btn btn-primary" onClick={() => setShowScannerModal(true)}>
            <Camera size={18} /> Escanear Cámara
          </button>
        </div>

        {/* FILTROS POR CATEGORÍA */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {categorias.map(cat => (
            <button
              key={cat}
              className={`btn ${selectedCategoria === cat ? 'btn-outline' : 'btn-secondary'}`}
              onClick={() => setSelectedCategoria(cat)}
              style={{ padding: '6px 14px', fontSize: '0.85rem' }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* GRID DE PRODUCTOS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px', alignContent: 'start' }}>
          {filteredProductos.map((p) => {
            const isLowStock = p.stock <= p.stockMinimo;
            const isOut = p.stock <= 0;

            return (
              <div
                key={p.id}
                className="glass-card"
                style={{
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  cursor: isOut ? 'not-allowed' : 'pointer',
                  opacity: isOut ? 0.5 : 1,
                  borderColor: isOut ? 'var(--accent-rose)' : isLowStock ? 'var(--accent-amber)' : 'var(--border-color)'
                }}
                onClick={() => !isOut && addToCart(p)}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                      #{p.codigoBarras}
                    </span>
                    {isLowStock && (
                      <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>
                        <AlertTriangle size={10} /> Stock Bajo
                      </span>
                    )}
                  </div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
                    {p.nombre}
                  </h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.categoria}</p>
                </div>

                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                    ${p.precio.toFixed(2)}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: p.stock > 0 ? 'var(--text-muted)' : 'var(--accent-rose)' }}>
                    Stock: <strong>{p.stock}</strong>
                  </span>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* SECCIÓN DERECHA: CARRITO DE COMPRAS Y COBRO */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: '16px' }}>
        <div>
          {/* HEADER CARRITO */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '14px', borderBottom: '1px solid var(--border-color)', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShoppingBag color="var(--accent-cyan)" size={20} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Carrito de Venta</h3>
            </div>
            <span className="badge badge-syncing">{cart.length} Ítems</span>
          </div>

          {/* SELECCIÓN CLIENTE */}
          <div className="input-group" style={{ marginBottom: '16px' }}>
            <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={14} /> Cliente:
            </label>
            <select
              className="input-field"
              value={selectedCliente}
              onChange={(e) => setSelectedCliente(e.target.value)}
            >
              {clientes.map(c => (
                <option key={c.id} value={c.nombre}>{c.nombre} ({c.telefono})</option>
              ))}
            </select>
          </div>

          {/* LISTA DE ÍTEMS EN CARRITO */}
          <div style={{ maxHeight: '380px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-dim)' }}>
                🛒 Carrito vacío. Escanea un código o selecciona productos del catálogo.
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.productoId} className="glass-card" style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ flex: 1, paddingRight: '8px' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>{item.nombre}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>${item.precio.toFixed(2)} c/u</div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button className="btn btn-secondary" style={{ padding: '2px 6px' }} onClick={() => updateQuantity(item.productoId, -1)}>
                      <Minus size={12} />
                    </button>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, minWidth: '20px', textAlign: 'center' }}>{item.cantidad}</span>
                    <button className="btn btn-secondary" style={{ padding: '2px 6px' }} onClick={() => updateQuantity(item.productoId, 1)}>
                      <Plus size={12} />
                    </button>
                    <button className="btn btn-danger" style={{ padding: '4px', marginLeft: '4px' }} onClick={() => removeFromCart(item.productoId)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* TOTAL Y BOTÓN DE COBRO OPTIMISTA */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Subtotal:</span>
            <span>${(totalVenta * 0.84).toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
            <span style={{ color: 'var(--text-muted)' }}>IVA (16%):</span>
            <span>${(totalVenta * 0.16).toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '16px' }}>
            <span>TOTAL:</span>
            <span>${totalVenta.toFixed(2)}</span>
          </div>

          <button
            className="btn btn-success"
            style={{ width: '100%', padding: '14px', fontSize: '1.05rem' }}
            disabled={cart.length === 0 || isProcessing}
            onClick={handleCheckout}
          >
            <CheckCircle2 size={20} />
            {isProcessing ? 'Guardando en IndexedDB...' : (isAvanceMode ? `Guardar Venta en IndexedDB ($${totalVenta.toFixed(2)})` : `Cobrar $${totalVenta.toFixed(2)}`)}
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

      {/* MODAL AVANCE 50% - CONFIRMACIÓN INDEXEDDB */}
      {showAvanceModal && currentVentaCompleted && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 1100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', borderRadius: '16px', padding: '24px', border: '1px solid var(--accent-emerald)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={24} color="var(--accent-emerald)" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Venta Registrada en IndexedDB
                </h3>
                <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>
                  Hito 1: Avance 50% (Persistencia Local)
                </span>
              </div>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.5 }}>
              La transacción se almacenó exitosamente en la base de datos local del navegador (IndexedDB) con escritura optimista, descontando el stock local sin requerir conexión a internet.
            </p>

            <div className="glass-card" style={{ padding: '14px', marginBottom: '20px', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div><strong>UUID Venta:</strong> <code style={{ color: 'var(--accent-cyan)' }}>{currentVentaCompleted.id}</code></div>
              <div><strong>Monto Total:</strong> <strong style={{ color: 'var(--accent-emerald)' }}>${currentVentaCompleted.total.toFixed(2)}</strong></div>
              <div><strong>Estado Sincronización:</strong> <span className="badge badge-warning">syncStatus = 0 (Cola de Sincronización)</span></div>
              <div><strong>Cliente:</strong> {currentVentaCompleted.clienteNombre}</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button
                className="btn btn-primary"
                style={{ width: '100%', padding: '10px' }}
                onClick={() => setShowAvanceModal(false)}
              >
                Aceptar & Nueva Venta
              </button>
            </div>
          </div>
        </div>
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
