import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowRight, Store, AlertCircle } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor ingresa tu correo y contraseña.');
      return;
    }

    setLoading(true);
    setError('');

    const res = await login(email, password);
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'Credenciales inválidas. Verifica tu correo y contraseña.');
    }
  };

  const handleQuickLogin = (quickEmail, quickPassword) => {
    setEmail(quickEmail);
    setPassword(quickPassword);
    setError('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f8fafc',
      padding: '24px 16px',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)',
        overflow: 'hidden'
      }}>
        {/* ENCABEZADO CORPORATIVO */}
        <div style={{
          padding: '32px 32px 24px 32px',
          borderBottom: '1px solid #f1f5f9',
          textAlign: 'center'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '10px',
            backgroundColor: '#0f172a',
            color: '#ffffff',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
            boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.15)'
          }}>
            <Store size={24} />
          </div>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            color: '#0f172a',
            margin: '0 0 6px 0',
            letterSpacing: '-0.02em'
          }}>
            Inventario & POS
          </h2>
          <p style={{
            fontSize: '0.85rem',
            color: '#64748b',
            margin: 0
          }}>
            Inicio de sesión con validación JWT en servidor
          </p>
        </div>

        {/* FORMULARIO */}
        <div style={{ padding: '28px 32px' }}>
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: '#fef2f2',
              color: '#991b1b',
              border: '1px solid #fecaca',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '0.82rem',
              marginBottom: '20px'
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '18px' }}>
              <label style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#334155',
                marginBottom: '6px'
              }}>
                Correo Electrónico
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8'
                }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@pos.com"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px 10px 38px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.875rem',
                    color: '#0f172a',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#334155'
                }}>
                  Contraseña
                </label>
                <span style={{ fontSize: '0.75rem', color: '#64748b', cursor: 'default' }}>
                  Cifrada con bcrypt
                </span>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8'
                }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 38px 10px 38px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.875rem',
                    color: '#0f172a',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                  title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                backgroundColor: '#0f172a',
                color: '#ffffff',
                border: 'none',
                padding: '11px 16px',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: loading ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                transition: 'background-color 0.15s ease'
              }}
            >
              {loading ? (
                <span>Validando credenciales...</span>
              ) : (
                <>
                  <span>Iniciar Sesión</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* CUENTAS DE DEMOSTRACIÓN PRECARGADAS */}
          <div style={{
            marginTop: '28px',
            paddingTop: '20px',
            borderTop: '1px solid #f1f5f9'
          }}>
            <p style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              color: '#94a3b8',
              letterSpacing: '0.05em',
              margin: '0 0 12px 0'
            }}>
              Cuentas de Acceso Rápido:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@pos.com', 'admin')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  fontSize: '0.78rem',
                  color: '#334155',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div>
                  <strong style={{ color: '#0f172a' }}>Carlos Admin</strong>
                  <span style={{ color: '#64748b', marginLeft: '6px' }}>admin@pos.com</span>
                </div>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  backgroundColor: '#e0e7ff',
                  color: '#3730a3',
                  padding: '2px 6px',
                  borderRadius: '4px'
                }}>
                  Admin
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('vendedor@pos.com', '123')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  fontSize: '0.78rem',
                  color: '#334155',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div>
                  <strong style={{ color: '#0f172a' }}>Laura Vendedora</strong>
                  <span style={{ color: '#64748b', marginLeft: '6px' }}>vendedor@pos.com</span>
                </div>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  backgroundColor: '#fef3c7',
                  color: '#92400e',
                  padding: '2px 6px',
                  borderRadius: '4px'
                }}>
                  Cajero
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('almacen@pos.com', '123')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  fontSize: '0.78rem',
                  color: '#334155',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div>
                  <strong style={{ color: '#0f172a' }}>Roberto Almacén</strong>
                  <span style={{ color: '#64748b', marginLeft: '6px' }}>almacen@pos.com</span>
                </div>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  backgroundColor: '#e2e8f0',
                  color: '#334155',
                  padding: '2px 6px',
                  borderRadius: '4px'
                }}>
                  Almacén
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* PIE DEL MODAL DE LOGIN */}
        <div style={{
          padding: '12px 24px',
          backgroundColor: '#f8fafc',
          borderTop: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          fontSize: '0.75rem',
          color: '#64748b'
        }}>
          <ShieldCheck size={14} color="#059669" />
          <span>Base de datos relacional y autenticación JWT segura</span>
        </div>
      </div>
    </div>
  );
}
