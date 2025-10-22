// Sistema de control de envíos masivos
// Usa memoria para velocidad + Supabase para persistencia

import { supabaseAdmin } from './supabase-admin.js';

const activeSpams = new Map();

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
  
  // Guardar en memoria
  activeSpams.set(spamId, spamData);
  
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
    
    // Limpiar de memoria después de 5 minutos
    setTimeout(() => {
      activeSpams.delete(spamId);
    }, 5 * 60 * 1000);
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
