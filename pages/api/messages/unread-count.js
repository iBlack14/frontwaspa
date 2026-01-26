import { supabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@/utils/supabase/api';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Inicializar cliente de Supabase para API
    const supabase = createClient(req, res);

    // Obtener el usuario autenticado directamente desde Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const userId = user.id;

    // Obtener todas las instancias del usuario
    const { data: instances, error: instancesError } = await supabaseAdmin
      .from('instances')
      .select('document_id')
      .eq('user_id', userId);

    if (instancesError) {
      console.error('Error al obtener instancias:', instancesError);
      return res.status(500).json({ error: 'Error al obtener instancias' });
    }

    if (!instances || instances.length === 0) {
      return res.status(200).json({ success: true, count: 0 });
    }

    const instanceIds = instances.map(i => i.document_id);

    // Contar mensajes no leídos
    const { count, error: countError } = await supabaseAdmin
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .in('instance_id', instanceIds)
      .eq('from_me', false)
      .eq('is_read', false);

    if (countError) {
      console.error('Error al contar mensajes:', countError);
      return res.status(500).json({ error: 'Error al contar mensajes' });
    }

    return res.status(200).json({
      success: true,
      count: count || 0,
    });

  } catch (error) {
    console.error('Error en /api/messages/unread-count:', error);
    return res.status(500).json({ error: error.message });
  }
}
