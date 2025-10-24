// API para actualizar estadísticas de mensajes de una instancia
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.id) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const { documentId, message_sent, api_message_sent, message_received } = req.body;

  if (!documentId) {
    return res.status(400).json({ error: 'documentId es requerido' });
  }

  try {
    // Obtener la instancia actual
    const { data: instance, error: fetchError } = await supabaseAdmin
      .from('instances')
      .select('historycal_data')
      .eq('document_id', documentId)
      .eq('user_id', session.id)
      .single();

    if (fetchError) {
      return res.status(500).json({ error: fetchError.message });
    }

    // Obtener fecha actual en formato YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];
    
    // Obtener datos históricos o inicializar array vacío
    let historycalData = instance.historycal_data || [];
    
    // Buscar si ya existe un registro para hoy
    const todayIndex = historycalData.findIndex(item => item.date === today);
    
    if (todayIndex >= 0) {
      // Actualizar registro existente
      historycalData[todayIndex] = {
        date: today,
        message_sent: (historycalData[todayIndex].message_sent || 0) + (message_sent || 0),
        api_message_sent: (historycalData[todayIndex].api_message_sent || 0) + (api_message_sent || 0),
        message_received: (historycalData[todayIndex].message_received || 0) + (message_received || 0),
      };
    } else {
      // Crear nuevo registro para hoy
      historycalData.push({
        date: today,
        message_sent: message_sent || 0,
        api_message_sent: api_message_sent || 0,
        message_received: message_received || 0,
      });
    }

    // Mantener solo los últimos 30 días
    if (historycalData.length > 30) {
      historycalData = historycalData.slice(-30);
    }

    // Actualizar en la base de datos
    const { error: updateError } = await supabaseAdmin
      .from('instances')
      .update({ historycal_data: historycalData })
      .eq('document_id', documentId)
      .eq('user_id', session.id);

    if (updateError) {
      return res.status(500).json({ error: updateError.message });
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Estadísticas actualizadas',
      data: historycalData 
    });

  } catch (error) {
    console.error('Error updating stats:', error);
    return res.status(500).json({ error: error.message });
  }
}
