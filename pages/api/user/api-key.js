import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * Endpoint para gestionar API keys del usuario
 * GET: Obtener API key actual
 * POST: Regenerar API key
 */
export default async function handler(req, res) {
  try {
    // Verificar sesión
    const session = await getServerSession(req, res, authOptions);
    
    if (!session || !session.id) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    // GET - Obtener API key actual
    if (req.method === 'GET') {
      const { data: profile, error } = await supabaseAdmin
        .from('profiles')
        .select('api_key, created_at')
        .eq('id', session.id)
        .single();

      if (error || !profile) {
        return res.status(404).json({ error: 'Perfil no encontrado' });
      }

      // Obtener historial de rotación
      const { data: history } = await supabaseAdmin
        .from('api_key_history')
        .select('*')
        .eq('user_id', session.id)
        .order('revoked_at', { ascending: false })
        .limit(5);

      return res.status(200).json({
        success: true,
        apiKey: profile.api_key,
        createdAt: profile.created_at,
        history: history || [],
      });
    }

    // POST - Regenerar API key
    if (req.method === 'POST') {
      const { reason } = req.body;

      const { data, error } = await supabaseAdmin
        .rpc('regenerate_api_key', {
          p_user_id: session.id,
          p_reason: reason || 'User requested regeneration',
        });

      if (error) {
        console.error('[API-KEY] Error regenerando:', error);
        return res.status(500).json({ 
          error: 'Error al regenerar API key',
          details: error.message 
        });
      }

      const result = data[0];

      if (!result.success) {
        return res.status(500).json({ 
          error: 'No se pudo regenerar la API key' 
        });
      }

      return res.status(200).json({
        success: true,
        newApiKey: result.new_api_key,
        message: 'API key regenerada exitosamente',
      });
    }

    return res.status(405).json({ error: 'Método no permitido' });
  } catch (error) {
    console.error('[API-KEY] Error:', error);
    return res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    });
  }
}
