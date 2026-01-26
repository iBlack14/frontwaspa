import { supabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@/src/utils/supabase/server';

/**
 * Configuración de límites por endpoint
 */
const RATE_LIMITS = {
  // Endpoints críticos
  '/api/templates/spam-whatsapp': { limit: 10, window: 60 }, // 10 por hora
  '/api/templates/chatbot': { limit: 20, window: 60 }, // 20 por hora
  '/api/instances': { limit: 50, window: 60 }, // 50 por hora
  '/api/templates/assign': { limit: 30, window: 60 }, // 30 por hora

  // Endpoints normales
  '/api/messages': { limit: 100, window: 60 }, // 100 por hora
  '/api/user': { limit: 100, window: 60 }, // 100 por hora

  // Default para otros endpoints
  'default': { limit: 200, window: 60 }, // 200 por hora
};

/**
 * Middleware de rate limiting por usuario
 * @param {Request} req 
 * @param {Response} res 
 * @param {Function} next 
 */
export async function rateLimitByUser(req, res, next) {
  try {
    // Obtener sesión del usuario con Supabase
    const supabase = createClient(req, res);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // Si no hay sesión, aplicar rate limit por IP
      return rateLimitByIP(req, res, next);
    }

    const userId = user.id;
    const endpoint = getEndpointKey(req.url);
    const config = RATE_LIMITS[endpoint] || RATE_LIMITS['default'];

    // Verificar rate limit usando función de Supabase
    const { data, error } = await supabaseAdmin
      .rpc('check_rate_limit', {
        p_user_id: userId,
        p_endpoint: endpoint,
        p_limit: config.limit,
        p_window_minutes: config.window,
      });

    if (error) {
      console.error('[RATE-LIMIT] Error checking rate limit:', error);
      // En caso de error, permitir la request (fail-open)
      return next();
    }

    const result = data[0];

    if (!result.allowed) {
      const resetTime = new Date(result.reset_at);
      const waitMinutes = Math.ceil((resetTime - new Date()) / 60000);

      return res.status(429).json({
        error: 'Too Many Requests',
        message: `Has excedido el límite de ${config.limit} requests por ${config.window} minutos`,
        retryAfter: waitMinutes,
        resetAt: resetTime.toISOString(),
        currentCount: result.current_count,
      });
    }

    // Agregar headers informativos
    res.setHeader('X-RateLimit-Limit', config.limit);
    res.setHeader('X-RateLimit-Remaining', config.limit - result.current_count);
    res.setHeader('X-RateLimit-Reset', new Date(result.reset_at).toISOString());

    next();
  } catch (error) {
    console.error('[RATE-LIMIT] Error in middleware:', error);
    // Fail-open: permitir la request si hay error
    next();
  }
}

/**
 * Rate limiting por IP (backup cuando no hay sesión)
 */
async function rateLimitByIP(req, res, next) {
  try {
    const ipAddress = getClientIP(req);
    const endpoint = getEndpointKey(req.url);
    const config = RATE_LIMITS[endpoint] || RATE_LIMITS['default'];

    // Verificar en tabla de rate_limits_ip
    const { data: existing } = await supabaseAdmin
      .from('rate_limits_ip')
      .select('*')
      .eq('ip_address', ipAddress)
      .eq('endpoint', endpoint)
      .single();

    const now = new Date();
    const windowStart = new Date(now - config.window * 60 * 1000);

    if (!existing) {
      // Crear nuevo registro
      await supabaseAdmin
        .from('rate_limits_ip')
        .insert({
          ip_address: ipAddress,
          endpoint,
          request_count: 1,
          window_start: now.toISOString(),
          last_request: now.toISOString(),
        });

      res.setHeader('X-RateLimit-Limit', config.limit);
      res.setHeader('X-RateLimit-Remaining', config.limit - 1);
      return next();
    }

    // Verificar si está bloqueado
    if (existing.blocked_until && new Date(existing.blocked_until) > now) {
      const waitMinutes = Math.ceil((new Date(existing.blocked_until) - now) / 60000);
      return res.status(429).json({
        error: 'Too Many Requests',
        message: `IP bloqueada temporalmente. Intenta en ${waitMinutes} minutos`,
        retryAfter: waitMinutes,
      });
    }

    // Verificar si la ventana expiró
    if (new Date(existing.window_start) < windowStart) {
      // Resetear contador
      await supabaseAdmin
        .from('rate_limits_ip')
        .update({
          request_count: 1,
          window_start: now.toISOString(),
          last_request: now.toISOString(),
          blocked_until: null,
        })
        .eq('ip_address', ipAddress)
        .eq('endpoint', endpoint);

      res.setHeader('X-RateLimit-Limit', config.limit);
      res.setHeader('X-RateLimit-Remaining', config.limit - 1);
      return next();
    }

    // Incrementar contador
    const newCount = existing.request_count + 1;

    if (newCount > config.limit) {
      // Bloquear IP
      const blockedUntil = new Date(new Date(existing.window_start).getTime() + config.window * 60 * 1000);

      await supabaseAdmin
        .from('rate_limits_ip')
        .update({
          request_count: newCount,
          blocked_until: blockedUntil.toISOString(),
        })
        .eq('ip_address', ipAddress)
        .eq('endpoint', endpoint);

      return res.status(429).json({
        error: 'Too Many Requests',
        message: `Has excedido el límite de ${config.limit} requests`,
        retryAfter: Math.ceil((blockedUntil - now) / 60000),
      });
    }

    // Actualizar contador
    await supabaseAdmin
      .from('rate_limits_ip')
      .update({
        request_count: newCount,
        last_request: now.toISOString(),
      })
      .eq('ip_address', ipAddress)
      .eq('endpoint', endpoint);

    res.setHeader('X-RateLimit-Limit', config.limit);
    res.setHeader('X-RateLimit-Remaining', config.limit - newCount);

    next();
  } catch (error) {
    console.error('[RATE-LIMIT-IP] Error:', error);
    next();
  }
}

/**
 * Obtener clave del endpoint (normalizar)
 */
function getEndpointKey(url) {
  if (!url) return 'default';
  const path = url.split('?')[0];
  if (RATE_LIMITS[path]) return path;
  for (const key of Object.keys(RATE_LIMITS)) {
    if (path.startsWith(key)) return key;
  }
  return 'default';
}

/**
 * Obtener IP del cliente
 */
function getClientIP(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

/**
 * Wrapper para usar como middleware de Next.js
 */
export function withRateLimit(handler) {
  return async (req, res) => {
    return new Promise((resolve, reject) => {
      rateLimitByUser(req, res, async (error) => {
        if (error) {
          return reject(error);
        }
        try {
          await handler(req, res);
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    });
  };
}
