import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    // Obtener sesión del usuario
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.id) {
      return res.status(401).json({ error: 'No autorizado - Inicia sesión' });
    }

    // Obtener resumen de uso del usuario
    const { data: usage, error } = await supabaseAdmin
      .from('user_usage_summary')
      .select('*')
      .eq('user_id', session.id)
      .single();

    if (error) {
      console.error('Error fetching usage:', error);
      return res.status(500).json({ error: 'Error al obtener uso' });
    }

    // Calcular porcentajes
    const instancesPercent = usage.max_instances > 0 
      ? Math.round((usage.current_instances / usage.max_instances) * 100)
      : 0;

    const messagesPercent = usage.max_messages_per_day > 0
      ? Math.round((usage.messages_sent_today / usage.max_messages_per_day) * 100)
      : 0;

    const webhooksPercent = usage.max_webhooks > 0
      ? Math.round((usage.current_webhooks / usage.max_webhooks) * 100)
      : 0;

    const suitesPercent = usage.max_suites > 0
      ? Math.round((usage.current_suites / usage.max_suites) * 100)
      : 0;

    return res.status(200).json({
      plan: {
        type: usage.plan_type,
        status: usage.status_plan ? 'active' : 'inactive',
      },
      limits: {
        instances: {
          current: usage.current_instances,
          max: usage.max_instances,
          percent: instancesPercent,
          available: usage.max_instances - usage.current_instances,
        },
        messages: {
          current: usage.messages_sent_today,
          max: usage.max_messages_per_day,
          percent: messagesPercent,
          available: usage.max_messages_per_day - usage.messages_sent_today,
          resets_at: 'medianoche',
        },
        webhooks: {
          current: usage.current_webhooks,
          max: usage.max_webhooks,
          percent: webhooksPercent,
          available: usage.max_webhooks - usage.current_webhooks,
        },
        suites: {
          current: usage.current_suites,
          max: usage.max_suites,
          percent: suitesPercent,
          available: usage.max_suites - usage.current_suites,
        },
      },
      warnings: {
        instances_limit_reached: usage.current_instances >= usage.max_instances,
        messages_limit_reached: usage.messages_sent_today >= usage.max_messages_per_day,
        webhooks_limit_reached: usage.current_webhooks >= usage.max_webhooks,
        suites_limit_reached: usage.current_suites >= usage.max_suites,
        messages_near_limit: messagesPercent >= 80,
      },
    });
  } catch (error) {
    console.error('Error en usage endpoint:', error.message);
    return res.status(500).json({
      error: 'Error interno del servidor',
    });
  }
}
