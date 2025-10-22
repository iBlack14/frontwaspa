// Sistema de control de envíos masivos en memoria
// Almacena el estado de los envíos activos

const activeSpams = new Map();

/**
 * Crea un nuevo envío
 * @param {string} spamId - ID único del envío
 * @param {number} totalContacts - Total de contactos a enviar
 * @param {string} userId - ID del usuario
 */
export function createSpam(spamId, totalContacts, userId) {
  activeSpams.set(spamId, {
    id: spamId,
    userId,
    totalContacts,
    currentContact: 0,
    stopped: false,
    completed: false,
    startedAt: new Date(),
    errors: [],
    success: [],
  });
  
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
export function stopSpam(spamId) {
  const spam = activeSpams.get(spamId);
  if (spam) {
    spam.stopped = true;
    spam.stoppedAt = new Date();
  }
}

/**
 * Actualiza el progreso del envío
 * @param {string} spamId - ID del envío
 * @param {number} currentContact - Contacto actual
 * @param {object} result - Resultado del envío (success/error)
 */
export function updateProgress(spamId, currentContact, result = null) {
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
  }
}

/**
 * Marca el envío como completado
 * @param {string} spamId - ID del envío
 */
export function completeSpam(spamId) {
  const spam = activeSpams.get(spamId);
  if (spam) {
    spam.completed = true;
    spam.completedAt = new Date();
    
    // Limpiar después de 5 minutos
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
export function getSpamStatus(spamId) {
  return activeSpams.get(spamId) || null;
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
