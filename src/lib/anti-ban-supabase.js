// =============================================
// SISTEMA ANTI-BANEO CON PERSISTENCIA EN SUPABASE
// Reemplaza el sistema en memoria por uno persistente
// =============================================

import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * Configuración de límites seguros según tipo de cuenta
 */
export const SAFE_LIMITS = {
  // Cuenta nueva (menos de 7 días)
  new_account: {
    messagesPerHour: 20,
    messagesPerDay: 100,
    minDelay: 8, // segundos
    maxDelay: 15,
    pauseAfter: 10, // pausa cada X mensajes
    pauseDuration: 120, // 2 minutos
  },
  
  // Cuenta caliente (7-30 días, con actividad)
  warm_account: {
    messagesPerHour: 50,
    messagesPerDay: 250,
    minDelay: 5,
    maxDelay: 12,
    pauseAfter: 20,
    pauseDuration: 90,
  },
  
  // Cuenta establecida (30+ días, mucha actividad)
  established_account: {
    messagesPerHour: 100,
    messagesPerDay: 500,
    minDelay: 3,
    maxDelay: 8,
    pauseAfter: 30,
    pauseDuration: 60,
  },
  
  // Cuenta verificada (Business verificada)
  verified_account: {
    messagesPerHour: 200,
    messagesPerDay: 1000,
    minDelay: 2,
    maxDelay: 5,
    pauseAfter: 50,
    pauseDuration: 45,
  },
};

/**
 * Horarios seguros para envío (evitar horas de sueño)
 */
export const SAFE_HOURS = {
  start: 9, // 9 AM
  end: 21, // 9 PM
};

/**
 * Generar delay aleatorio entre min y max segundos
 */
export function getRandomDelay(minSeconds, maxSeconds) {
  const min = minSeconds * 1000;
  const max = maxSeconds * 1000;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Verificar si es horario seguro para enviar
 */
export function isSafeHour() {
  const now = new Date();
  const hour = now.getHours();
  return hour >= SAFE_HOURS.start && hour < SAFE_HOURS.end;
}

/**
 * Obtener o crear contador desde Supabase
 */
export async function getCounters(instanceId, userId) {
  try {
    const { data, error } = await supabaseAdmin
      .rpc('get_or_create_anti_ban_counter', {
        p_instance_id: instanceId,
        p_user_id: userId,
      });

    if (error) {
      console.error('[ANTI-BAN-SUPABASE] Error obteniendo contador:', error);
      // Retornar valores por defecto en caso de error
      return {
        messagesSentToday: 0,
        messagesSentThisHour: 0,
        recentErrors: 0,
        lastResetDay: new Date().getDate(),
        lastResetHour: new Date().getHours(),
      };
    }

    const counter = data[0];
    return {
      messagesSentToday: counter.messages_sent_today,
      messagesSentThisHour: counter.messages_sent_this_hour,
      recentErrors: counter.recent_errors,
      lastResetDay: counter.last_reset_day,
      lastResetHour: counter.last_reset_hour,
    };
  } catch (error) {
    console.error('[ANTI-BAN-SUPABASE] Error:', error);
    return {
      messagesSentToday: 0,
      messagesSentThisHour: 0,
      recentErrors: 0,
      lastResetDay: new Date().getDate(),
      lastResetHour: new Date().getHours(),
    };
  }
}

/**
 * Incrementar contador de mensajes en Supabase
 */
export async function incrementMessageCount(instanceId) {
  try {
    const { error} = await supabaseAdmin
      .rpc('increment_anti_ban_counter', {
        p_instance_id: instanceId,
      });

    if (error) {
      console.error('[ANTI-BAN-SUPABASE] Error incrementando contador:', error);
    }

    // Retornar contadores actualizados
    // Nota: No podemos obtener el userId aquí, así que retornamos valores estimados
    return {
      messagesSentToday: 0, // Se actualizará en la próxima llamada a getCounters
      messagesSentThisHour: 0,
      recentErrors: 0,
    };
  } catch (error) {
    console.error('[ANTI-BAN-SUPABASE] Error:', error);
    return {
      messagesSentToday: 0,
      messagesSentThisHour: 0,
      recentErrors: 0,
    };
  }
}

/**
 * Registrar error en Supabase
 */
export async function recordError(instanceId) {
  try {
    const { error } = await supabaseAdmin
      .rpc('record_anti_ban_error', {
        p_instance_id: instanceId,
      });

    if (error) {
      console.error('[ANTI-BAN-SUPABASE] Error registrando error:', error);
    }

    return {
      messagesSentToday: 0,
      messagesSentThisHour: 0,
      recentErrors: 1,
    };
  } catch (error) {
    console.error('[ANTI-BAN-SUPABASE] Error:', error);
    return {
      messagesSentToday: 0,
      messagesSentThisHour: 0,
      recentErrors: 0,
    };
  }
}

/**
 * Calcular tiempo de espera adaptativo
 */
export function calculateAdaptiveDelay(config) {
  const {
    accountType = 'warm_account',
    messagesSentThisHour = 0,
    messagesSentToday = 0,
    recentErrors = 0,
  } = config;
  
  const limits = SAFE_LIMITS[accountType];
  
  // Factor de ajuste por uso
  let delayMultiplier = 1;
  
  // Si estamos cerca del límite por hora, aumentar delay
  if (messagesSentThisHour > limits.messagesPerHour * 0.7) {
    delayMultiplier = 1.5;
  }
  
  // Si hay errores recientes, ser más conservador
  if (recentErrors > 0) {
    delayMultiplier = Math.max(delayMultiplier, 1 + (recentErrors * 0.3));
  }
  
  // Si no es horario seguro, aumentar delay
  if (!isSafeHour()) {
    delayMultiplier *= 1.5;
  }
  
  // Calcular delay final
  const minDelay = limits.minDelay * delayMultiplier;
  const maxDelay = limits.maxDelay * delayMultiplier;
  
  return getRandomDelay(minDelay, maxDelay);
}

/**
 * Verificar si se debe hacer una pausa larga
 */
export function shouldTakeLongPause(messageCount, accountType = 'warm_account') {
  const limits = SAFE_LIMITS[accountType];
  return messageCount > 0 && messageCount % limits.pauseAfter === 0;
}

/**
 * Obtener duración de pausa larga
 */
export function getLongPauseDuration(accountType = 'warm_account') {
  return SAFE_LIMITS[accountType].pauseDuration * 1000;
}

/**
 * Verificar si se alcanzó el límite diario
 */
export function hasReachedDailyLimit(messagesSentToday, accountType = 'warm_account') {
  return messagesSentToday >= SAFE_LIMITS[accountType].messagesPerDay;
}

/**
 * Verificar si se alcanzó el límite por hora
 */
export function hasReachedHourlyLimit(messagesSentThisHour, accountType = 'warm_account') {
  return messagesSentThisHour >= SAFE_LIMITS[accountType].messagesPerHour;
}

/**
 * Calcular tiempo de espera hasta la próxima hora
 */
export function getTimeUntilNextHour() {
  const now = new Date();
  const nextHour = new Date(now);
  nextHour.setHours(now.getHours() + 1, 0, 0, 0);
  return nextHour - now;
}

/**
 * Validar número de teléfono (formato internacional)
 */
export function isValidPhoneNumber(number) {
  // Limpiar número
  const cleaned = number.replace(/[^0-9]/g, '');
  
  // Validar longitud (8-15 dígitos)
  if (cleaned.length < 8 || cleaned.length > 15) {
    return false;
  }
  
  // Lista de prefijos no válidos
  const invalidPrefixes = ['0000', '1111', '2222', '9999'];
  if (invalidPrefixes.some(prefix => cleaned.startsWith(prefix))) {
    return false;
  }
  
  return true;
}

/**
 * Logs para debugging
 */
export function logAntiBanStatus(instanceId, counters) {
  console.log(`
╔═══════════════════════════════════════════════╗
║         ANTI-BAN STATUS: ${instanceId.substring(0, 15)}...         ║
╠═══════════════════════════════════════════════╣
║ Mensajes hoy:     ${counters.messagesSentToday.toString().padStart(4)} / ${SAFE_LIMITS.warm_account.messagesPerDay}          ║
║ Mensajes esta hora: ${counters.messagesSentThisHour.toString().padStart(2)} / ${SAFE_LIMITS.warm_account.messagesPerHour}             ║
║ Errores recientes:  ${counters.recentErrors.toString().padStart(2)}                    ║
║ Horario seguro:     ${isSafeHour() ? 'SÍ ✅' : 'NO ⚠️ '.padEnd(8)}             ║
╚═══════════════════════════════════════════════╝
  `);
}

/**
 * Configuración recomendada según análisis de cuenta
 */
export function getRecommendedAccountType(accountAge, messagesTotal) {
  // accountAge en días
  if (accountAge < 7) {
    return 'new_account';
  } else if (accountAge < 30) {
    return 'warm_account';
  } else if (messagesTotal > 5000) {
    return 'established_account';
  } else {
    return 'warm_account';
  }
}

/**
 * Limpieza de instancias inactivas (llamar desde cron job)
 */
export async function cleanupInactiveInstances() {
  try {
    const { data, error } = await supabaseAdmin
      .rpc('cleanup_inactive_instances');

    if (error) {
      console.error('[ANTI-BAN-SUPABASE] Error en limpieza:', error);
      return 0;
    }

    console.log(`[ANTI-BAN-SUPABASE] 🧹 Limpieza completada: ${data} instancias eliminadas`);
    return data;
  } catch (error) {
    console.error('[ANTI-BAN-SUPABASE] Error:', error);
    return 0;
  }
}
