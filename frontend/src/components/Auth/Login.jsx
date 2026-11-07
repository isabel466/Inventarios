import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Lock, Mail, Eye, EyeOff, ArrowRight, Store, AlertCircle, UserPlus, LogIn, User } from 'lucide-react';

export default function Login() {
  const { login, register } = useAuth();
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Form fields
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || (isRegisterMode && !nombre)) {
      setError('Por favor completa todos los campos requeridos.');
      return;
    }

    setLoading(true);
    setError('');

    let res;
    if (isRegisterMode) {
      res = await register(nombre, email, password);
    } else {
      res = await login(email, password);
    }

    setLoading(false);

    if (!res.success) {
      setError(res.error || 'Credenciales incorrectas. Verifica tus datos.');
    }
  };

  const handleQuickLogin = (quickEmail, quickPassword) => {
    setIsRegisterMode(false);
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
          padding: '32px 32px 20px 32px',
          borderBottom: '1px solid #f1f5f9',
          textAlign: 'center'
        }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '10px',
            backgroundColor: '#0f172a',
            color: '#ffffff',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '12px',
            boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.15)'
          }}>
            <Store size={22} />
          </div>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            color: '#0f172a',
            margin: '0 0 4px 0',
            letterSpacing: '-0.02em'
          }}>
            Inventario & POS
          </h2>
          <p style={{
            fontSize: '0.8125rem',
            color: '#64748b',
            margin: 0
          }}>
            {isRegisterMode
              ? 'Crea tu cuenta de administrador'
              : 'Inicia sesión para acceder a tu terminal'}
          </p>

          {/* SELECTOR MODO: INICIAR SESIÓN / CREAR CUENTA */}
          <div style={{
            display: 'flex',
            marginTop: '18px',
            backgroundColor: '#f1f5f9',
            borderRadius: '8px',
            padding: '3px'
          }}>
            <button
              type="button"
              onClick={() => { setIsRegisterMode(false); setError(''); }}
              style={{
                flex: 1,
                padding: '7px 0',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.8125rem',
                fontWeight: !isRegisterMode ? 600 : 500,
                backgroundColor: !isRegisterMode ? '#ffffff' : 'transparent',
                color: !isRegisterMode ? '#0f172a' : '#64748b',
                boxShadow: !isRegisterMode ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <LogIn size={14} />
              <span>Iniciar Sesión</span>
            </button>

            <button
              type="button"
              onClick={() => { setIsRegisterMode(true); setError(''); }}
              style={{
                flex: 1,
                padding: '7px 0',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.8125rem',
                fontWeight: isRegisterMode ? 600 : 500,
                backgroundColor: isRegisterMode ? '#ffffff' : 'transparent',
                color: isRegisterMode ? '#0f172a' : '#64748b',
                boxShadow: isRegisterMode ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <UserPlus size={14} />
              <span>Crear Cuenta</span>
            </button>
          </div>
        </div>

        {/* FORMULARIO */}
        <div style={{ padding: '24px 32px' }}>
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
              fontSize: '0.8125rem',
              marginBottom: '18px'
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {isRegisterMode && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                  Nombre Completo
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Tu nombre o negocio"
                    required={isRegisterMode}
                    style={{
                      width: '100%',
                      padding: '10px 14px 10px 38px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.875rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                Correo Electrónico
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px 10px 38px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.875rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '22px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                Contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 38px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.875rem',
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
                    cursor: 'pointer'
                  }}
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
                gap: '8px'
              }}
            >
              {loading ? (
                <span>Ingresando...</span>
              ) : isRegisterMode ? (
                <>
                  <span>Crear Cuenta</span>
                  <ArrowRight size={16} />
                </>
              ) : (
                <>
                  <span>Iniciar Sesión</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* ACCESO RÁPIDO DISCRETO PARA PRUEBAS */}
          {!isRegisterMode && (
            <div style={{
              marginTop: '22px',
              paddingTop: '16px',
              borderTop: '1px solid #f1f5f9'
            }}>
              <p style={{
                fontSize: '0.72rem',
                fontWeight: 500,
                color: '#94a3b8',
                marginBottom: '8px',
                textAlign: 'center'
              }}>
                Acceso rápido demo:
              </p>

              <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin@pos.com', 'admin')}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '6px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    fontSize: '0.75rem',
                    color: '#334155',
                    cursor: 'pointer',
                    fontWeight: 500
                  }}
                >
                  Admin
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('vendedor@pos.com', '123')}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '6px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    fontSize: '0.75rem',
                    color: '#334155',
                    cursor: 'pointer',
                    fontWeight: 500
                  }}
                >
                  Cajero
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('almacen@pos.com', '123')}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '6px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    fontSize: '0.75rem',
                    color: '#334155',
                    cursor: 'pointer',
                    fontWeight: 500
                  }}
                >
                  Almacén
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
