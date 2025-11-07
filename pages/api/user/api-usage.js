import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * Endpoint para obtener estadísticas de uso de API
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    // Verificar sesión
    const session = await getServerSession(req, res, authOptions);
    
    if (!session || !session.id) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const { days = 7 } = req.query;

    // Obtener estadísticas usando función SQL
    const { data: stats, error: statsError } = await supabaseAdmin
      .rpc('get_api_usage_stats', {
        p_user_id: session.id,
        p_days: parseInt(days),
      });

    if (statsError) {
      console.error('[API-USAGE] Error obteniendo stats:', statsError);
      return res.status(500).json({ 
        error: 'Error al obtener estadísticas',
        details: statsError.message 
      });
    }

    // Obtener últimas 20 llamadas
    const { data: recentCalls, error: callsError } = await supabaseAdmin
      .from('api_key_usage')
      .select('endpoint, method, status_code, response_time_ms, timestamp')
      .eq('user_id', session.id)
      .order('timestamp', { ascending: false })
      .limit(20);

    if (callsError) {
      console.error('[API-USAGE] Error obteniendo llamadas:', callsError);
    }

    const result = stats && stats.length > 0 ? stats[0] : {
      total_requests: 0,
      successful_requests: 0,
      failed_requests: 0,
      avg_response_time_ms: 0,
      most_used_endpoint: 'N/A',
      requests_by_day: {},
    };

    return res.status(200).json({
      success: true,
      stats: result,
      recentCalls: recentCalls || [],
    });
  } catch (error) {
    console.error('[API-USAGE] Error:', error);
    return res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
}
