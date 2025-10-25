// API para recibir webhooks del backend de WhatsApp
import { supabaseAdmin } from '@/lib/supabase-admin';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { event, instanceId, data } = req.body;

    console.log(`[WEBHOOK] Evento recibido: ${event} para instancia ${instanceId}`);
    console.log(`[WEBHOOK] Datos:`, JSON.stringify(data, null, 2));

    // Validar que tenemos los datos necesarios
    if (!event || !instanceId) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    // Obtener la instancia de la base de datos
    const { data: instance, error: fetchError } = await supabaseAdmin
      .from('instances')
      .select('historycal_data, user_id')
      .eq('document_id', instanceId)
      .single();

    if (fetchError || !instance) {
      console.error(`[WEBHOOK] Instancia no encontrada: ${instanceId}`);
      return res.status(404).json({ error: 'Instancia no encontrada' });
    }

    // Procesar según el tipo de evento
    let shouldUpdate = false;
    let statsUpdate = {
      message_sent: 0,
      api_message_sent: 0,
      message_received: 0,
    };

    switch (event) {
      case 'message.sent':
      case 'messages.upsert':
        // Mensaje enviado
        if (data?.fromMe === true || data?.key?.fromMe === true) {
          statsUpdate.message_sent = 1;
          statsUpdate.api_message_sent = 1;
          shouldUpdate = true;
          console.log(`[WEBHOOK] ✅ Mensaje enviado detectado`);
        }
        // Mensaje recibido
        else if (data?.fromMe === false || data?.key?.fromMe === false) {
          statsUpdate.message_received = 1;
          shouldUpdate = true;
          console.log(`[WEBHOOK] 📥 Mensaje recibido detectado`);
        }
        break;

      case 'message.received':
        // Mensaje recibido
        statsUpdate.message_received = 1;
        shouldUpdate = true;
        console.log(`[WEBHOOK] 📥 Mensaje recibido`);
        break;

      default:
        console.log(`[WEBHOOK] Evento ignorado: ${event}`);
        break;
    }

    // Actualizar estadísticas si es necesario
    if (shouldUpdate) {
      const today = new Date().toISOString().split('T')[0];
      let historycalData = instance.historycal_data || [];

      // Buscar registro de hoy
      const todayIndex = historycalData.findIndex(item => item.date === today);

      if (todayIndex >= 0) {
        // Actualizar registro existente
        historycalData[todayIndex] = {
          date: today,
          message_sent: (historycalData[todayIndex].message_sent || 0) + statsUpdate.message_sent,
          api_message_sent: (historycalData[todayIndex].api_message_sent || 0) + statsUpdate.api_message_sent,
          message_received: (historycalData[todayIndex].message_received || 0) + statsUpdate.message_received,
        };
      } else {
        // Crear nuevo registro
        historycalData.push({
          date: today,
          message_sent: statsUpdate.message_sent,
          api_message_sent: statsUpdate.api_message_sent,
          message_received: statsUpdate.message_received,
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
        .eq('document_id', instanceId);

      if (updateError) {
        console.error(`[WEBHOOK] Error actualizando estadísticas:`, updateError);
        return res.status(500).json({ error: updateError.message });
      }

      console.log(`[WEBHOOK] ✅ Estadísticas actualizadas para ${instanceId}`);
      console.log(`[WEBHOOK] Nuevos valores:`, historycalData[historycalData.length - 1]);
    }

    return res.status(200).json({ 
      success: true,
      message: 'Webhook procesado correctamente',
      updated: shouldUpdate,
    });

  } catch (error) {
    console.error('[WEBHOOK] Error procesando webhook:', error);
    return res.status(500).json({ error: error.message });
  }
}
