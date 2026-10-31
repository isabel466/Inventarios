import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Users, UserPlus, Trash2, Shield, CheckCircle2, AlertCircle, ShoppingCart, Package } from 'lucide-react';

export default function UserManager() {
  const { user, token } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Formulario nuevo usuario
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('vendedor');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/usuarios', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsuarios(data);
      }
    } catch (e) {
      console.error('Error al cargar colaboradores:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const handleCrearUsuario = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);

    try {
      const res = await fetch('/api/v1/usuarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ nombre, email, password, role })
      });

      if (res.ok) {
        setShowModal(false);
        setNombre('');
        setEmail('');
        setPassword('');
        setRole('vendedor');
        await fetchUsuarios();
      } else {
        const err = await res.json();
        setFormError(err.error || 'No se pudo crear el colaborador');
      }
    } catch (err) {
      setFormError('Error de conexión con el servidor');
    } finally {
      setSaving(false);
    }
  };

  const handleEliminarUsuario = async (id, userRole) => {
    if (id === user?.id) {
      alert('No puedes eliminar tu propia cuenta administradora.');
      return;
    }
    if (!confirm('¿Seguro que deseas dar de baja este usuario?')) return;

    try {
      const res = await fetch(`/api/v1/usuarios/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        await fetchUsuarios();
      } else {
        const err = await res.json();
        alert(err.error || 'Error al eliminar');
      }
    } catch (e) {
      alert('Error de red al eliminar usuario');
    }
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* PANEL SUPERIOR */}
      <div className="corporate-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users color="var(--accent-primary)" size={20} />
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Gestión de Personal y Cuentas por Rol
            </h2>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Crea cuentas para tus cajeros (Vendedor) y encargados de inventario (Almacén) con permisos restringidos.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => setShowModal(true)}
          style={{ height: '38px', gap: '8px' }}
        >
          <UserPlus size={16} />
          <span>Nuevo Colaborador</span>
        </button>
      </div>

      {/* GUÍA DE ROLES RESTRINGIDOS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        <div className="corporate-card" style={{ padding: '16px', borderLeft: '4px solid #3730a3' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Shield size={16} color="#3730a3" />
            <strong style={{ fontSize: '0.875rem', color: '#0f172a' }}>Rol: Administrador</strong>
          </div>
          <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>
            Acceso completo a Dashboard global, Usuarios, Reportes financieros, POS e Inventario.
          </p>
        </div>

        <div className="corporate-card" style={{ padding: '16px', borderLeft: '4px solid #d97706' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <ShoppingCart size={16} color="#d97706" />
            <strong style={{ fontSize: '0.875rem', color: '#0f172a' }}>Rol: Vendedor (Cajero)</strong>
          </div>
          <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>
            Restringido: Solo accede a la pantalla de Ventas (Terminal POS) y consulta de catálogo de productos.
          </p>
        </div>

        <div className="corporate-card" style={{ padding: '16px', borderLeft: '4px solid #059669' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Package size={16} color="#059669" />
            <strong style={{ fontSize: '0.875rem', color: '#0f172a' }}>Rol: Almacén (Inventario)</strong>
          </div>
          <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>
            Restringido: Solo accede a Entradas/Salidas de stock, altas de productos y control de existencias.
          </p>
        </div>
      </div>

      {/* TABLA DE USUARIOS */}
      <div className="corporate-panel" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '14px' }}>
          Usuarios Activos en la Base de Datos Relacional ({usuarios.length})
        </h3>

        <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '10px 14px', fontWeight: 600 }}>Nombre</th>
                <th style={{ padding: '10px 14px', fontWeight: 600 }}>Correo Electrónico</th>
                <th style={{ padding: '10px 14px', fontWeight: 600 }}>Rol Asignado</th>
                <th style={{ padding: '10px 14px', fontWeight: 600 }}>Fecha Creación</th>
                <th style={{ padding: '10px 14px', fontWeight: 600, textAlign: 'right' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Cargando cuentas registradas...
                  </td>
                </tr>
              ) : usuarios.map((u) => {
                const isCurrent = u.id === user?.id;
                return (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: '#ffffff' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-main)' }}>
                      {u.nombre} {isCurrent && <span style={{ fontSize: '0.7rem', color: '#2563eb' }}>(Tú)</span>}
                    </td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>
                      {u.email}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span className={`badge ${
                        u.role === 'admin' ? 'badge-primary' :
                        u.role === 'vendedor' ? 'badge-warning' : 'badge-online'
                      }`} style={{ textTransform: 'capitalize' }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {u.creado_en ? new Date(u.creado_en).toLocaleDateString() : 'Activo'}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                      {!isCurrent && (
                        <button
                          className="btn"
                          onClick={() => handleEliminarUsuario(u.id, u.role)}
                          style={{
                            padding: '4px 8px',
                            color: 'var(--accent-rose)',
                            border: '1px solid var(--accent-rose-border)',
                            backgroundColor: 'var(--accent-rose-subtle)',
                            borderRadius: '4px',
                            fontSize: '0.75rem'
                          }}
                          title="Eliminar usuario"
                        >
                          <Trash2 size={13} />
                          <span>Baja</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL CREAR COLABORADOR */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 60,
          padding: '16px'
        }}>
          <div className="corporate-card" style={{ width: '100%', maxWidth: '440px', padding: '24px', backgroundColor: '#ffffff' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
              Registrar Nuevo Colaborador
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
              Esta cuenta podrá ingresar desde cualquier dispositivo con sus permisos limitados.
            </p>

            {formError && (
              <div style={{
                backgroundColor: '#fef2f2',
                color: '#991b1b',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={15} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCrearUsuario}>
              <div className="input-group" style={{ marginBottom: '14px' }}>
                <label className="input-label">Nombre del Colaborador</label>
                <input
                  type="text"
                  className="input-field"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Sofía Cajera"
                  required
                />
              </div>

              <div className="input-group" style={{ marginBottom: '14px' }}>
                <label className="input-label">Correo Electrónico (Usuario)</label>
                <input
                  type="email"
                  className="input-field"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sofia@mitienda.com"
                  required
                />
              </div>

              <div className="input-group" style={{ marginBottom: '14px' }}>
                <label className="input-label">Contraseña Temporal</label>
                <input
                  type="password"
                  className="input-field"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="input-group" style={{ marginBottom: '20px' }}>
                <label className="input-label">Rol y Restricción de Vista</label>
                <select
                  className="input-field"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="vendedor">Vendedor (Solo Terminal POS y consulta de productos)</option>
                  <option value="almacen">Almacén (Solo Entradas/Salidas y control de stock)</option>
                  <option value="admin">Administrador (Acceso Total a todo el sistema)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Guardando...' : 'Crear Colaborador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
