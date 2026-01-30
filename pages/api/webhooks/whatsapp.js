// API para recibir webhooks del backend de WhatsApp
import { supabaseAdmin } from '@/lib/supabase-admin';
import { broadcastMessage } from '@/lib/websocket';
import axios from 'axios';

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

          // Variables para procesar el mensaje
          const sender = data?.pushName || data?.key?.remoteJid?.split('@')[0] || 'Desconocido';
          const chatId = data?.key?.remoteJid;
          const messageText = data?.message?.conversation ||
            data?.message?.extendedTextMessage?.text ||
            data?.message?.imageMessage?.caption ||
            data?.message?.videoMessage?.caption || null;

          // -------------------------------------------------------------
          // 🤖 LOGICA DEL CHATBOT
          // -------------------------------------------------------------
          if (messageText && chatId && !chatId.includes('status@broadcast')) {
            try {
              // 1. Buscar si hay un chatbot activo para esta instancia
              const { data: chatbot } = await supabaseAdmin
                .from('instance_chatbots')
                .select('*')
                .eq('instance_id', instanceId)
                .eq('is_active', true)
                .single();

              if (chatbot) {
                console.log(`[CHATBOT] 🤖 Bot activo encontrado para ${instanceId}`);

                let responseToSend = null;

                // 2. Buscar coincidencia en reglas
                // Normalizar mensaje de entrada
                const lowerMessage = messageText.toLowerCase().trim();

                // Buscar regla coincidente
                const matchedRule = chatbot.rules.find(rule => {
                  if (!rule.isActive) return false;

                  // Separar triggers por | y limpiar espacios
                  const triggers = rule.trigger.split('|').map(t => t.trim().toLowerCase());

                  // Verificar si alguno de los triggers está presente en el mensaje
                  // Opción A: Coincidencia exacta o parcial?
                  // Vamos a usar 'includes' para ser más flexibles, o match exacto si se prefiere
                  return triggers.some(trigger => lowerMessage.includes(trigger));
                });

                if (matchedRule) {
                  console.log(`[CHATBOT] ✅ Regla coincidente: "${matchedRule.trigger}"`);
                  responseToSend = matchedRule.response;
                } else if (chatbot.default_response) {
                  // Sólo responder por defecto si NO es un mensaje de sistema importante?
                  // Para evitar spam, podríamos limitar esto.
                  // Por ahora, usaremos la respuesta por defecto si está configurada
                  console.log(`[CHATBOT] ⚠️ Sin coincidencia, usando respuesta por defecto`);
                  // responseToSend = chatbot.default_response; // Opcional: Descomentar si se quiere respuesta por defecto siempre
                }

                // 3. Enviar respuesta si hay alguna
                if (responseToSend) {
                  // Pequeño delay para simular "escribiendo"
                  await new Promise(r => setTimeout(r, 1500)); // 1.5s delay

                  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api.connect.blxkstudio.com'; // Fallback

                  // Enviar mensaje usando la API interna
                  // Necesitamos la key del usuario. La tomamos de la instancia que ya consultamos arriba (instance.user_id)
                  // Consultamos la API Key del perfil
                  const { data: profile } = await supabaseAdmin
                    .from('profiles')
                    .select('api_key')
                    .eq('id', instance.user_id)
                    .single();

                  const apiKey = profile?.api_key || '';

                  await axios.post(`${backendUrl}/api/send-message/${instanceId}`, {
                    number: chatId.replace(/\D/g, ''), // Solo números para la API
                    message: responseToSend
                  }, {
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${apiKey}`
                    }
                  });

                  console.log(`[CHATBOT] 📤 Respuesta enviada a ${sender}: "${responseToSend}"`);

                  // Actualizar stats de envío también
                  statsUpdate.message_sent = (statsUpdate.message_sent || 0) + 1;
                  statsUpdate.api_message_sent = (statsUpdate.api_message_sent || 0) + 1;
                }
              }
            } catch (botError) {
              console.error('[CHATBOT] ❌ Error procesando lógica del bot:', botError);
            }
          }

          // Guardar mensaje en la base de datos
          try {
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
