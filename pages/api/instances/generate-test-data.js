// API para generar datos de prueba en historycal_data
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

    if (!documentId) {
      return res.status(400).json({ error: 'documentId es requerido' });
    }

    try {
      // Generar datos de prueba para los últimos 7 días
      const testData = [];
      const today = new Date();

      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        testData.push({
          date: dateStr,
          message_sent: Math.floor(Math.random() * 50) + 10,      // 10-60 mensajes
          api_message_sent: Math.floor(Math.random() * 30) + 5,   // 5-35 mensajes API
          message_received: Math.floor(Math.random() * 80) + 20,  // 20-100 recibidos
        });
      }

      // Actualizar en la base de datos
      const { error: updateError } = await supabaseAdmin
        .from('instances')
        .update({ historycal_data: testData })
        .eq('document_id', documentId)
        .eq('user_id', userId);

      if (updateError) {
        return res.status(500).json({ error: updateError.message });
      }

      return res.status(200).json({
        success: true,
        message: 'Datos de prueba generados correctamente',
        data: testData
      });

    } catch (error) {
      console.error('Error generating test data:', error);
      return res.status(500).json({ error: error.message });
    }
  } catch (error) {
    console.error('Fatal error in handler:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
