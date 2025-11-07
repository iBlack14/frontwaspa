import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../pages/api/auth/[...nextauth]';

/**
 * Límites por plan
 * FREE: Solo spam y chatbot con limitaciones
 * PREMIUM: Acceso completo
 */
const PLAN_LIMITS = {
  free: {
    allowedTemplates: ['spam', 'chatbot'],
    maxMessagesPerDay: 100,
    maxMessagesPerHour: 20,
    maxInstances: 1,
    features: {
      spam: true,
      chatbot: true,
      autoResponse: false,
      scheduled: false,
      reminders: false,
      proxy: false,
    },
  },
  premium: {
    allowedTemplates: ['spam', 'chatbot', 'auto-response', 'scheduled', 'reminders'],
    maxMessagesPerDay: 10000,
    maxMessagesPerHour: 500,
    maxInstances: 10,
    features: {
      spam: true,
      chatbot: true,
      autoResponse: true,
      scheduled: true,
      reminders: true,
      proxy: true,
    },
  },
  enterprise: {
    allowedTemplates: ['spam', 'chatbot', 'auto-response', 'scheduled', 'reminders'],
    maxMessagesPerDay: -1, // Ilimitado
    maxMessagesPerHour: -1, // Ilimitado
    maxInstances: -1, // Ilimitado
    features: {
      spam: true,
      chatbot: true,
      autoResponse: true,
      scheduled: true,
      reminders: true,
      proxy: true,
    },
  },
};

/**
 * Middleware de validación de plan
 * @param {string} requiredTemplate - Template que se quiere usar (spam, chatbot, etc)
 * @param {string} requiredFeature - Feature específica (opcional)
 */
export async function validatePlan(req, res, requiredTemplate, requiredFeature = null) {
  try {
    // Obtener sesión del usuario
    const session = await getServerSession(req, res, authOptions);
    
    if (!session || !session.id) {
      return {
        allowed: false,
        error: 'No autorizado',
        statusCode: 401,
      };
    }

    // Obtener perfil y plan del usuario (incluir api_key para validación)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('status_plan, plan_type, api_key')
      .eq('id', session.id)
      .single();

    if (profileError || !profile) {
      return {
        allowed: false,
        error: 'Perfil no encontrado',
        statusCode: 404,
      };
    }

    // Verificar que tenga plan activo
    if (!profile.status_plan) {
      return {
        allowed: false,
        error: 'No tienes un plan activo',
        message: 'Por favor, activa un plan para usar esta función',
        statusCode: 403,
      };
    }

    // ✅ VALIDAR API KEY - Requerida para usar templates
    if (!profile.api_key) {
      return {
        allowed: false,
        error: 'API Key requerida',
        message: 'Para usar templates debes generar tu API Key en tu perfil. Ve a Profile → API Key → Generar',
        statusCode: 403,
        requiresApiKey: true,
      };
    }

    // Obtener límites del plan (por defecto FREE si no está especificado)
    const planType = (profile.plan_type || 'free').toLowerCase();
    const planLimits = PLAN_LIMITS[planType] || PLAN_LIMITS.free;

    // Verificar si el template está permitido
    if (!planLimits.allowedTemplates.includes(requiredTemplate)) {
      return {
        allowed: false,
        error: 'Template no disponible en tu plan',
        message: `El template "${requiredTemplate}" requiere un plan ${planType === 'free' ? 'PREMIUM' : 'superior'}`,
        currentPlan: planType,
        requiredPlan: 'premium',
        statusCode: 403,
      };
    }

    // Verificar feature específica si se requiere
    if (requiredFeature && !planLimits.features[requiredFeature]) {
      return {
        allowed: false,
        error: 'Función no disponible en tu plan',
        message: `La función "${requiredFeature}" requiere un plan ${planType === 'free' ? 'PREMIUM' : 'superior'}`,
        currentPlan: planType,
        requiredPlan: 'premium',
        statusCode: 403,
      };
    }

    // Verificar límites de mensajes diarios (solo si no es ilimitado)
    if (planLimits.maxMessagesPerDay > 0) {
      const today = new Date().toISOString().split('T')[0];
      
      // Contar mensajes enviados hoy
      const { data: instances } = await supabaseAdmin
        .from('instances')
        .select('historycal_data')
        .eq('user_id', session.id);

      let messagesToday = 0;
      instances?.forEach(instance => {
        const todayData = instance.historycal_data?.find(d => d.date === today);
        if (todayData) {
          messagesToday += (todayData.message_sent || 0) + (todayData.api_message_sent || 0);
        }
      });

      if (messagesToday >= planLimits.maxMessagesPerDay) {
        return {
          allowed: false,
          error: 'Límite diario alcanzado',
          message: `Has alcanzado el límite de ${planLimits.maxMessagesPerDay} mensajes por día de tu plan ${planType.toUpperCase()}`,
          currentUsage: messagesToday,
          limit: planLimits.maxMessagesPerDay,
          currentPlan: planType,
          statusCode: 429,
        };
      }
    }

    // ✅ TODO OK - Usuario puede usar el template
    // NOTA: NO verificamos límite de instancias aquí porque este middleware
    // se usa para activar templates en instancias EXISTENTES.
    // El límite de instancias se verifica al CREAR una nueva instancia.
    return {
      allowed: true,
      planType,
      limits: planLimits,
      userId: session.id,
    };
  } catch (error) {
    console.error('[PLAN-VALIDATION] Error:', error);
    return {
      allowed: false,
      error: 'Error validando plan',
      message: error.message,
      statusCode: 500,
    };
  }
}

/**
 * Wrapper para usar como middleware en API routes
 */
export function withPlanValidation(requiredTemplate, requiredFeature = null) {
  return async (req, res, next) => {
    const validation = await validatePlan(req, res, requiredTemplate, requiredFeature);
    
    if (!validation.allowed) {
      return res.status(validation.statusCode || 403).json({
        error: validation.error,
        message: validation.message,
        currentPlan: validation.currentPlan,
        requiredPlan: validation.requiredPlan,
        currentUsage: validation.currentUsage,
        limit: validation.limit,
      });
    }

    // Agregar info del plan al request para uso posterior
    req.planInfo = validation;
    
    if (next) {
      return next();
    }
  };
}

/**
 * Helper para obtener límites del plan de un usuario
 */
export async function getUserPlanLimits(userId) {
  try {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('plan_type')
      .eq('id', userId)
      .single();

    const planType = (profile?.plan_type || 'free').toLowerCase();
    return PLAN_LIMITS[planType] || PLAN_LIMITS.free;
  } catch (error) {
    console.error('[PLAN-LIMITS] Error:', error);
    return PLAN_LIMITS.free;
  }
}
