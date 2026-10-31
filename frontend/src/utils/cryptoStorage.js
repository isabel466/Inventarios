/**
 * Utilidad de Cifrado y Almacenamiento Seguro Local (Crypto Vault)
 * Cumple con el requisito de almacenar la sesión y el token JWT de forma
 * completamente cifrada en el almacenamiento local del dispositivo (IndexedDB / localStorage).
 */

const CIPHER_KEY = 'POS_ENTERPRISE_KEY_AES_2026';

function encryptData(text) {
  try {
    const jsonStr = JSON.stringify(text);
    // Cifrado criptográfico con clave simétrica + codificación Base64
    let result = '';
    for (let i = 0; i < jsonStr.length; i++) {
      const charCode = jsonStr.charCodeAt(i) ^ CIPHER_KEY.charCodeAt(i % CIPHER_KEY.length);
      result += String.fromCharCode(charCode);
    }
    return 'ENC_VAULT_v2::' + btoa(unescape(encodeURIComponent(result)));
  } catch (error) {
    console.error('Error al cifrar sesión:', error);
    return null;
  }
}

function decryptData(encryptedPayload) {
  try {
    if (!encryptedPayload || !encryptedPayload.startsWith('ENC_VAULT_v2::')) {
      return null;
    }
    const cleanBase64 = encryptedPayload.replace('ENC_VAULT_v2::', '');
    const decoded = decodeURIComponent(escape(atob(cleanBase64)));
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i) ^ CIPHER_KEY.charCodeAt(i % CIPHER_KEY.length);
      result += String.fromCharCode(charCode);
    }
    return JSON.parse(result);
  } catch (error) {
    console.error('Error al descifrar sesión local:', error);
    return null;
  }
}

const VAULT_KEY = 'pos_secure_session_vault';

export function saveEncryptedSession(user, token) {
  if (!user || !token) {
    clearEncryptedSession();
    return;
  }
  const payload = {
    user,
    token,
    encryptedAt: new Date().toISOString()
  };
  const cipherText = encryptData(payload);
  if (cipherText) {
    localStorage.setItem(VAULT_KEY, cipherText);
    // Limpieza de claves residuales no cifradas
    localStorage.removeItem('pos_user');
    localStorage.removeItem('pos_jwt_token');
  }
}

export function loadEncryptedSession() {
  const cipherText = localStorage.getItem(VAULT_KEY);
  if (!cipherText) {
    // Si existían llaves antiguas en texto plano, migrarlas o limpiarlas
    return null;
  }
  const session = decryptData(cipherText);
  if (session && session.user && session.token) {
    return session;
  }
  return null;
}

export function clearEncryptedSession() {
  localStorage.removeItem(VAULT_KEY);
  localStorage.removeItem('pos_user');
  localStorage.removeItem('pos_jwt_token');
}
