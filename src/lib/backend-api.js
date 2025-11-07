import axios from 'axios';
import { supabaseAdmin } from './supabase-admin';

/**
 * Helper para hacer llamadas al backend de WhatsApp
 * Obtiene automáticamente la API key del usuario y la envía
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL;

/**
 * Hacer request al backend con API key del usuario
 * @param {string} userId - ID del usuario
 * @param {string} endpoint - Endpoint del backend (ej: '/api/create-session')
 * @param {object} data - Datos a enviar
 * @param {string} method - Método HTTP (GET, POST, etc)
 */
export async function backendRequest(userId, endpoint, data = null, method = 'POST') {
  try {
    // 1. Obtener API key del usuario desde Supabase
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('api_key')
      .eq('id', userId)
      .single();

    if (error || !profile?.api_key) {
      throw new Error('No se pudo obtener la API key del usuario');
    }

    const apiKey = profile.api_key;

    // 2. Hacer request al backend con la API key
    const config = {
      method,
      url: `${BACKEND_URL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.data = data;
    } else if (data && method === 'GET') {
      config.params = data;
    }

    const response = await axios(config);
    return response.data;

  } catch (error) {
    console.error('[BACKEND-API] Error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Crear sesión de WhatsApp
 */
export async function createWhatsAppSession(userId, clientId) {
  return backendRequest(userId, '/api/create-session', { clientId }, 'POST');
}

/**
 * Obtener QR de sesión
 */
export async function getSessionQR(userId, clientId) {
  return backendRequest(userId, `/api/qr/${clientId}`, null, 'GET');
}

/**
 * Obtener todas las sesiones
 */
export async function getAllSessions(userId) {
  return backendRequest(userId, '/api/sessions', null, 'GET');
}

/**
 * Enviar mensaje
 */
export async function sendMessage(userId, clientId, to, message) {
  return backendRequest(userId, '/api/send-message', {
    clientId,
    to,
    message,
  }, 'POST');
}

/**
 * Desconectar sesión
 */
export async function disconnectSession(userId, clientId) {
  return backendRequest(userId, `/api/disconnect/${clientId}`, null, 'POST');
}
