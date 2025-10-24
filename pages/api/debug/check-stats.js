// API para verificar los datos de historycal_data
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.id) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  try {
    // Obtener todas las instancias del usuario
    const { data: instances, error } = await supabaseAdmin
      .from('instances')
      .select('document_id, historycal_data, profile_name, state')
      .eq('user_id', session.id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Formatear respuesta
    const results = instances.map(instance => ({
      documentId: instance.document_id,
      name: instance.profile_name || 'Sin nombre',
      state: instance.state,
      hasData: !!instance.historycal_data && instance.historycal_data.length > 0,
      dataCount: instance.historycal_data ? instance.historycal_data.length : 0,
      data: instance.historycal_data || [],
    }));

    return res.status(200).json({
      success: true,
      totalInstances: instances.length,
      instances: results,
    });

  } catch (error) {
    console.error('Error checking stats:', error);
    return res.status(500).json({ error: error.message });
  }
}
