// Sistema de control de envíos masivos
// Usa LRU cache con límite + Supabase para persistencia

import { supabaseAdmin } from '@/lib/supabase-admin';

// =====================================================
// LRU CACHE CON LÍMITE Y TTL
// =====================================================

class LRUCache {
  constructor(maxSize = 100, ttl = 3600000) { // TTL por defecto: 1 hora
    this.maxSize = maxSize;
    this.ttl = ttl;
    this.cache = new Map();
    this.accessOrder = new Map(); // Tracking de último acceso
  }

  set(key, value) {
    // Si ya existe, eliminar para re-insertar al final
    if (this.cache.has(key)) {
      this.cache.delete(key);
      this.accessOrder.delete(key);
    }

    // Si alcanzamos el límite, eliminar el más antiguo (LRU)
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.accessOrder.keys().next().value;
      this.cache.delete(oldestKey);
      this.accessOrder.delete(oldestKey);
      console.log(`[LRU-CACHE] ♻️  Eliminado spam antiguo por límite: ${oldestKey}`);
    }

    // Agregar nuevo elemento con timestamp
    const entry = {
      value,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.ttl,
    };

    this.cache.set(key, entry);
    this.accessOrder.set(key, Date.now());
  }

  get(key) {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Verificar si expiró
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.accessOrder.delete(key);
      console.log(`[LRU-CACHE] ⏰ Spam expirado: ${key}`);
      return null;
    }

    // Actualizar orden de acceso (mover al final)
    this.accessOrder.delete(key);
    this.accessOrder.set(key, Date.now());

    return entry.value;
  }

  has(key) {
    return this.get(key) !== null;
  }

  delete(key) {
    this.accessOrder.delete(key);
    return this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
    this.accessOrder.clear();
  }

  size() {
    return this.cache.size;
  }

  // Limpieza de elementos expirados
  cleanup() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        this.accessOrder.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`[LRU-CACHE] 🧹 Limpieza automática: ${cleaned} spams expirados eliminados`);
    }

    return cleaned;
  }

  // Obtener estadísticas
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      usage: `${((this.cache.size / this.maxSize) * 100).toFixed(1)}%`,
      oldestEntry: this.accessOrder.keys().next().value,
    };
  }
}

// Instancia global del cache con límite de 100 spams y TTL de 1 hora
const activeSpams = new LRUCache(100, 3600000);

// =====================================================
// LIMPIEZA AUTOMÁTICA CADA HORA
// =====================================================

let cleanupInterval = null;

function startAutomaticCleanup() {
  if (cleanupInterval) {
    return; // Ya está corriendo
  }

  console.log('[SPAM-CONTROL] 🚀 Iniciando limpieza automática cada hora');

  cleanupInterval = setInterval(() => {
    const stats = activeSpams.getStats();
    console.log('[SPAM-CONTROL] 📊 Estadísticas antes de limpieza:', stats);
    
    const cleaned = activeSpams.cleanup();
    
    const newStats = activeSpams.getStats();
    console.log('[SPAM-CONTROL] 📊 Estadísticas después de limpieza:', newStats);
    
    // También limpiar registros antiguos de Supabase (más de 24 horas)
    cleanupOldDatabaseRecords();
  }, 3600000); // Cada hora (3600000 ms)

  // Limpieza inicial
  activeSpams.cleanup();
}

// Iniciar limpieza automática al cargar el módulo
startAutomaticCleanup();

// Función para limpiar registros antiguos de la base de datos
async function cleanupOldDatabaseRecords() {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data, error } = await supabaseAdmin
      .from('spam_progress')
      .delete()
      .lt('started_at', oneDayAgo)
      .eq('completed', true);

    if (!error) {
      console.log('[SPAM-CONTROL] 🗑️  Registros antiguos eliminados de la BD');
    }
  } catch (error) {
    console.error('[SPAM-CONTROL] Error limpiando BD:', error);
  }
}

// Función para detener limpieza (útil para tests)
export function stopAutomaticCleanup() {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
    console.log('[SPAM-CONTROL] 🛑 Limpieza automática detenida');
  }
}

// Función para obtener estadísticas del cache
export function getCacheStats() {
  return activeSpams.getStats();
}

/**
 * Crea un nuevo envío
 * @param {string} spamId - ID único del envío
 * @param {number} totalContacts - Total de contactos a enviar
 * @param {string} userId - ID del usuario
 */
export async function createSpam(spamId, totalContacts, userId) {
  const spamData = {
    id: spamId,
    userId,
    totalContacts,
    currentContact: 0,
    stopped: false,
    completed: false,
    startedAt: new Date(),
    errors: [],
    success: [],
  };
  
  // Guardar en LRU cache
  activeSpams.set(spamId, spamData);
  
  // Log de estadísticas del cache
  const stats = activeSpams.getStats();
  console.log(`[SPAM-CONTROL] 📊 Cache: ${stats.size}/${stats.maxSize} (${stats.usage})`);
  
  // Guardar en Supabase
  try {
    await supabaseAdmin
      .from('spam_progress')
      .insert({
        spam_id: spamId,
        user_id: userId,
        total_contacts: totalContacts,
        current_contact: 0,
        stopped: false,
        completed: false,
        success: [],
        errors: [],
      });
  } catch (error) {
    console.error('[SPAM-CONTROL] Error guardando en DB:', error);
  }
  
  return activeSpams.get(spamId);
}

/**
 * Verifica si el envío debe continuar
 * @param {string} spamId - ID del envío
 * @returns {boolean}
 */
export function shouldContinue(spamId) {
  const spam = activeSpams.get(spamId);
  if (!spam) return false;
  return !spam.stopped && !spam.completed;
}

/**
 * Detiene un envío
 * @param {string} spamId - ID del envío
 */
export async function stopSpam(spamId) {
  const spam = activeSpams.get(spamId);
  if (spam) {
    spam.stopped = true;
    spam.stoppedAt = new Date();
    
    // Actualizar en Supabase
    try {
      await supabaseAdmin
        .from('spam_progress')
        .update({
          stopped: true,
          stopped_at: new Date().toISOString(),
        })
        .eq('spam_id', spamId);
    } catch (error) {
      console.error('[SPAM-CONTROL] Error deteniendo en DB:', error);
    }
  }
}

/**
 * Actualiza el progreso del envío
 * @param {string} spamId - ID del envío
 * @param {number} currentContact - Contacto actual
 * @param {object} result - Resultado del envío (success/error)
 */
export async function updateProgress(spamId, currentContact, result = null) {
  const spam = activeSpams.get(spamId);
  if (spam) {
    spam.currentContact = currentContact;
    spam.lastUpdate = new Date();
    
    if (result) {
      if (result.success) {
        spam.success.push(result.number);
      } else {
        spam.errors.push({ number: result.number, error: result.error });
      }
    }
    
    // Actualizar en Supabase (sin await para no bloquear)
    supabaseAdmin
      .from('spam_progress')
      .update({
        current_contact: currentContact,
        success: spam.success,
        errors: spam.errors,
        last_update: new Date().toISOString(),
      })
      .eq('spam_id', spamId)
      .then(({ error }) => {
        if (error) console.error('[SPAM-CONTROL] Error actualizando DB:', error);
      });
  }
}

/**
 * Marca el envío como completado
 * @param {string} spamId - ID del envío
 */
export async function completeSpam(spamId) {
  const spam = activeSpams.get(spamId);
  if (spam) {
    spam.completed = true;
    spam.completedAt = new Date();
    
    // Actualizar en Supabase
    try {
      await supabaseAdmin
        .from('spam_progress')
        .update({
          completed: true,
          completed_at: new Date().toISOString(),
        })
        .eq('spam_id', spamId);
    } catch (error) {
      console.error('[SPAM-CONTROL] Error completando en DB:', error);
    }
    
    // ✅ NO usar setTimeout - el LRU cache lo eliminará automáticamente
    // cuando expire (1 hora) o cuando se alcance el límite de 100
    console.log(`[SPAM-CONTROL] ✅ Spam completado: ${spamId} (será limpiado automáticamente)`);
  }
}

/**
 * Obtiene el estado de un envío
 * @param {string} spamId - ID del envío
 * @returns {object|null}
 */
export async function getSpamStatus(spamId) {
  // Intentar obtener de memoria primero (más rápido)
  let spam = activeSpams.get(spamId);
  
  // Si no está en memoria, buscar en Supabase
  if (!spam) {
    try {
      const { data, error } = await supabaseAdmin
        .from('spam_progress')
        .select('*')
        .eq('spam_id', spamId)
        .single();
      
      if (!error && data) {
        // Reconstruir objeto desde DB
        spam = {
          id: data.spam_id,
          userId: data.user_id,
          totalContacts: data.total_contacts,
          currentContact: data.current_contact,
          stopped: data.stopped,
          completed: data.completed,
          startedAt: new Date(data.started_at),
          completedAt: data.completed_at ? new Date(data.completed_at) : null,
          stoppedAt: data.stopped_at ? new Date(data.stopped_at) : null,
          lastUpdate: new Date(data.last_update),
          errors: data.errors || [],
          success: data.success || [],
        };
        
        // Guardar en memoria para próximas consultas
        activeSpams.set(spamId, spam);
      }
    } catch (error) {
      console.error('[SPAM-CONTROL] Error obteniendo de DB:', error);
    }
  }
  
  return spam || null;
}

/**
 * Obtiene todos los envíos activos de un usuario
 * @param {string} userId - ID del usuario
 * @returns {array}
 */
export function getUserSpams(userId) {
  const userSpams = [];
  for (const [id, spam] of activeSpams.entries()) {
    if (spam.userId === userId) {
      userSpams.push(spam);
    }
  }
  return userSpams;
}

/**
 * Limpia un envío específico
 * @param {string} spamId - ID del envío
 */
export function cleanupSpam(spamId) {
  const spam = activeSpams.get(spamId);
  if (spam) {
    activeSpams.delete(spamId);
    return true;
  }
  return false;
}
