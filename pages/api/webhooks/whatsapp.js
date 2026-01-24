// API para recibir webhooks del backend de WhatsApp
import { supabaseAdmin } from '@/lib/supabase-admin';
import { broadcastMessage } from '@/lib/websocket';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { event, instanceId, data } = req.body;

    // console.log(`[WEBHOOK] Evento: ${event} -> ${instanceId.substring(0, 8)}...`);

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
          shouldUpdate = true;
          // console.log(`[WEBHOOK] ✅ Sent`);
        }
        // Mensaje recibido
        else if (data?.fromMe === false || data?.key?.fromMe === false) {
          statsUpdate.message_received = 1;
          shouldUpdate = true;
          shouldUpdate = true;
          // console.log(`[WEBHOOK] 📥 Received`);

          // Emitir evento Socket.io para notificaciones
          try {
            const sender = data?.pushName || data?.key?.remoteJid?.split('@')[0] || 'Desconocido';
            const messageText = data?.message?.conversation ||
              data?.message?.extendedTextMessage?.text ||
              data?.message?.imageMessage?.caption ||
              data?.message?.videoMessage?.caption ||
              '[Mensaje multimedia]';

            const messageId = data?.key?.id || `${Date.now()}`;

            // Notificar a los clientes conectados
            broadcastMessage({
              type: 'new_message',
              messageId: messageId,
              chatId: data?.key?.remoteJid,
              sender: sender,
              text: messageText,
              timestamp: new Date().toISOString(),
              instanceId: instanceId
            });

            console.log(`[WEBSOCKET] 🔔 Notificación enviada para mensaje de ${sender} en instancia ${instanceId}`);
          } catch (wsError) {
            console.error('[WEBSOCKET] Error al emitir notificación:', wsError);
          }
        }
        break;

      case 'message.received':
        // Mensaje recibido
        if (data?.fromMe === false || data?.key?.fromMe === false) {
          statsUpdate.message_received = 1;
          shouldUpdate = true;
          console.log(`[WEBHOOK] ✅ Mensaje recibido detectado`);

          // Guardar mensaje en la base de datos
          try {
            const sender = data?.pushName || data?.key?.remoteJid?.split('@')[0] || 'Desconocido';
            const messageText = data?.message?.conversation ||
              data?.message?.extendedTextMessage?.text ||
              data?.message?.imageMessage?.caption ||
              data?.message?.videoMessage?.caption || null;

            const messageType = data?.message?.conversation ? 'text' :
              data?.message?.imageMessage ? 'image' :
                data?.message?.videoMessage ? 'video' :
                  data?.message?.audioMessage ? 'audio' :
                    data?.message?.documentMessage ? 'document' : 'other';

            // Insertar mensaje en la base de datos
            const { error: messageError } = await supabaseAdmin
              .from('messages')
              .insert({
                instance_id: instanceId,
                chat_id: data?.key?.remoteJid,
                message_id: data?.key?.id,
                sender_name: sender,
                sender_phone: data?.key?.remoteJid?.split('@')[0],
                message_text: messageText,
                message_type: messageType,
                from_me: false,
                timestamp: new Date().toISOString(),
                metadata: data
              });

            if (messageError) {
              console.error('[DB] Error al guardar mensaje:', messageError);
            } else {
              console.log('[DB] Mensaje guardado correctamente');
            }

            // Notificar a los clientes conectados
            broadcastMessage({
              type: 'new_message',
              messageId: data?.key?.id,
              chatId: data?.key?.remoteJid,
              sender: sender,
              text: messageText || '[Mensaje multimedia]',
              timestamp: new Date().toISOString(),
              instanceId: instanceId
            });

            console.log(`[WEBSOCKET] Notificación enviada para mensaje de ${sender}`);
          } catch (wsError) {
            console.error('[WEBSOCKET] Error al procesar mensaje:', wsError);
          }
        }
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

      const latest = historycalData[historycalData.length - 1];
      console.log(`📊 [STATS] ${instanceId.substring(0, 8)} | Enviados: ${latest.message_sent} (API: ${latest.api_message_sent}) | Recibidos: ${latest.message_received}`);
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
