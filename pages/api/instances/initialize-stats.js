// API para inicializar historycal_data con datos en 0 para instancias sin datos
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@/utils/supabase/api';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
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

    const { documentId } = req.body;

    try {
      // Si se proporciona documentId, inicializar solo esa instancia
      if (documentId) {
        const { data: instance, error: fetchError } = await supabaseAdmin
          .from('instances')
          .select('historycal_data')
          .eq('document_id', documentId)
          .eq('user_id', userId)
          .single();

        if (fetchError) {
          return res.status(500).json({ error: fetchError.message });
        }

        // Solo inicializar si no tiene datos
        if (!instance.historycal_data || instance.historycal_data.length === 0) {
          const today = new Date().toISOString().split('T')[0];
          const initialData = [{
            date: today,
            message_sent: 0,
            api_message_sent: 0,
            message_received: 0,
          }];

          const { error: updateError } = await supabaseAdmin
            .from('instances')
            .update({ historycal_data: initialData })
            .eq('document_id', documentId)
            .eq('user_id', userId);

          if (updateError) {
            return res.status(500).json({ error: updateError.message });
          }

          return res.status(200).json({
            success: true,
            message: 'Datos inicializados correctamente',
            data: initialData
          });
        }

        return res.status(200).json({
          success: true,
          message: 'La instancia ya tiene datos históricos',
          data: instance.historycal_data
        });
      }

      // Si no se proporciona documentId, inicializar todas las instancias sin datos
      const { data: instances, error: fetchError } = await supabaseAdmin
        .from('instances')
        .select('document_id, historycal_data')
        .eq('user_id', userId);

      if (fetchError) {
        return res.status(500).json({ error: fetchError.message });
      }

      const today = new Date().toISOString().split('T')[0];
      const initialData = [{
        date: today,
        message_sent: 0,
        api_message_sent: 0,
        message_received: 0,
      }];

      let updatedCount = 0;
      for (const instance of instances) {
        if (!instance.historycal_data || instance.historycal_data.length === 0) {
          await supabaseAdmin
            .from('instances')
            .update({ historycal_data: initialData })
            .eq('document_id', instance.document_id)
            .eq('user_id', userId);

          updatedCount++;
        }
      }

      return res.status(200).json({
        success: true,
        message: `${updatedCount} instancia(s) inicializada(s) correctamente`,
        updatedCount
      });

    } catch (error) {
      console.error('Error initializing stats:', error);
      return res.status(500).json({ error: error.message });
    }
  } catch (error) {
    console.error('Fatal error in handler:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
