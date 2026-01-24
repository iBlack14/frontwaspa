import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

// Store active IA conversations (in production, use Redis/database)
const activeConversations = new Map();

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verificar sesión
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user || !session.user.email) {
      // Note: session.id might be missing depending on mapping, usually session.user.id or sub
      // Let's assume session structure is standard next-auth.
      // If we used session.id previously, stick to it but ensure it exists.
      // previous code used session.id.
    }
    // Revert to strict check from original code to avoid breaking existing auth logic
    if (!session || !session.id) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const { instanceId, action } = req.method === 'POST' ? req.body : req.query;

    if (!instanceId) {
      return res.status(400).json({ error: 'instanceId es requerido' });
    }

    // Verificar que la instancia pertenece al usuario
    const { data: instance } = await supabaseAdmin
      .from('instances')
      .select('document_id, state, user_id')
      .eq('document_id', instanceId)
      .eq('user_id', session.id)
      .single();

    if (!instance) {
      return res.status(404).json({ error: 'Instancia no encontrada' });
    }

    if (instance.state !== 'Connected') {
      return res.status(400).json({
        error: 'La instancia no está conectada',
        message: 'Por favor, reconecta tu instancia de WhatsApp'
      });
    }

    // GET - Obtener estado de la conversación IA
    if (req.method === 'GET') {
      const conversationKey = `${session.id}-${instanceId}`;
      const conversationData = activeConversations.get(conversationKey);

      if (!conversationData) {
        return res.status(200).json({
          isActive: false,
          message: 'No hay conversación IA activa'
        });
      }

      return res.status(200).json({
        isActive: true,
        ...conversationData
      });
    }

    // POST - Iniciar o detener conversación IA
    if (action === 'start') {
      const { provider, apiKey } = req.body;
      return await startIAConversation(instanceId, session.id, res, provider, apiKey);
    } else if (action === 'stop') {
      return await stopIAConversation(instanceId, session.id, res);
    } else {
      return res.status(400).json({ error: 'Acción inválida. Use "start" o "stop"' });
    }

  } catch (error) {
    console.error('❌ Error en calentamiento IA API:', error);
    return res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message,
    });
  }
}

// Función para generar respuesta de IA
async function generateIAResponse(message, conversationHistory = [], context = {}, provider = 'openai', apiKey = null) {
  try {
    if (!apiKey) {
      console.warn('No API Key provided for IA response');
      return getFallbackResponse(message, conversationHistory);
    }

    // ---------------------------------------------------------
    // 🧠 OPENAI (ChatGPT)
    // ---------------------------------------------------------
    if (provider === 'openai') {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `Eres un profesional en una conversación de WhatsApp sobre temas de negocio, tecnología, marketing y emprendimiento. 
              TU OBJETIVO es mantener un flujo de conversación natural y realista.
              INSTRUCCIONES CRÍTICAS:
              1. NO respondas con una sola palabra.
              2. Tus respuestas deben tener entre 20 y 60 palabras.
              3. Usa un lenguaje natural de chat (puedes usar algún emoji, preguntar de vuelta, comentar algo interesante).
              4. Varía los temas: habla sobre retos diarios, reuniones, nuevas herramientas de IA, o planes de fin de semana.
              5. Actúa como si realmente conocieras a la otra persona hace tiempo.
              6. NO seas demasiado formal ni robótico.`
            },
            ...conversationHistory.map(msg => ({
              role: msg.isAI ? 'assistant' : 'user',
              content: msg.content
            })).slice(-10),
            {
              role: 'user',
              content: message
            }
          ],
          max_tokens: 300,
          temperature: 0.9
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.choices[0].message.content.trim();
      } else {
        const error = await response.json();
        console.error('OpenAI Error:', error);
      }
    }

    // ---------------------------------------------------------
    // 💎 GOOGLE GEMINI
    // ---------------------------------------------------------
    else if (provider === 'gemini') {
      const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

      const contents = [
        {
          role: "user",
          parts: [{
            text: `Actúa como un colega de trabajo en WhatsApp. Responde de forma muy natural y fluida al siguiente mensaje: "${message}". 
          REGLAS: No seas breve, escribe al menos 2 ó 3 oraciones completas (25-50 palabras). Pregunta algo relacionado para seguir el hilo. Usa un tono de oficina casual.` }]
        }
      ];

      const response = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: contents,
          generationConfig: {
            maxOutputTokens: 150,
            temperature: 0.7
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
          return data.candidates[0].content.parts[0].text.trim();
        }
      } else {
        const error = await response.json();
        console.error('Gemini Error:', error);
      }
    }

    // Fallback if API fails
    return getFallbackResponse(message, conversationHistory);

  } catch (error) {
    console.error('Error generando respuesta IA:', error);
    return getFallbackResponse(message, []);
  }
}

// Función fallback para respuestas naturales
function getFallbackResponse(message, history) {
  const responses = [
    "Claro, entiendo perfectamente. ¿Qué más detalles necesitas?",
    "Interesante punto. Yo también he estado pensando en eso últimamente.",
    "Buena observación. ¿Has probado alguna solución alternativa?",
    "Totalmente de acuerdo. El timing es clave en estos casos.",
    "Excelente idea. ¿Cuándo podríamos implementar algo así?",
    "Me parece perfecto. ¿Hay algún deadline específico?",
    "Buen trabajo con eso. ¿Cómo ha sido la respuesta del equipo?",
    "Entiendo tu punto de vista. ¿Qué opinas de esta alternativa?",
    "Suena prometedor. ¿Tienes algún ejemplo de casos similares?",
    "Estoy de acuerdo. La comunicación es fundamental aquí.",
    "Buena pregunta. Déjame pensar... creo que depende del contexto.",
    "Interesante perspectiva. No lo había visto de esa manera.",
    "Perfecto timing para hablar de esto. ¿Qué avances has visto?",
    "Totalmente comprensible. ¿Hay algún obstáculo específico?",
    "Excelente punto. Yo también he notado tendencias similares."
  ];

  // Responder basado en el contenido del mensaje
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('cómo') || lowerMessage.includes('como')) {
    return "Buena pregunta. Déjame explicarte mejor...";
  }

  if (lowerMessage.includes('cuándo') || lowerMessage.includes('cuando')) {
    return "Depende del contexto, pero generalmente...";
  }

  if (lowerMessage.includes('por qué') || lowerMessage.includes('porque')) {
    return "Principalmente porque...";
  }

  if (lowerMessage.includes('gracias') || lowerMessage.includes('thanks')) {
    return "De nada, para eso estamos. ¿Necesitas algo más?";
  }

  // Respuesta aleatoria
  return responses[Math.floor(Math.random() * responses.length)];
}

// Función para iniciar conversación IA
async function startIAConversation(instanceId, userId, res, provider = 'openai', apiKey = null) {
  const conversationKey = `${userId}-${instanceId}`;

  // Verificar si ya hay una conversación activa
  if (activeConversations.has(conversationKey)) {
    return res.status(400).json({
      error: 'Ya hay una conversación IA activa para esta instancia'
    });
  }

  // Validate API Key presence
  if (!apiKey) {
    return res.status(400).json({
      error: 'Falta API Key',
      message: 'Debes ingresar tu API Key de OpenAI o Gemini para iniciar.'
    });
  }

  // Obtener todas las instancias conectadas del usuario
  const { data: allInstances, error: instancesError } = await supabaseAdmin
    .from('instances')
    .select('document_id, phone_number, name')
    .eq('user_id', userId)
    .eq('state', 'Connected');

  if (instancesError || !allInstances || (!Array.isArray(allInstances))) {
    console.error('Error fetching instances for IA:', instancesError);
    return res.status(500).json({
      error: 'Error al obtener instancias para conversaciones IA',
      details: instancesError?.message
    });
  }

  const otherInstances = allInstances
    .filter(inst => inst.document_id !== instanceId && inst.phone_number)
    .map(inst => ({
      id: inst.document_id,
      number: inst.phone_number.replace(/\D/g, ''),
      name: inst.name || 'Colega'
    }));

  if (otherInstances.length === 0) {
    return res.status(400).json({
      error: 'Se necesitan al menos 2 instancias conectadas para conversaciones IA',
      message: 'Asegúrate de tener otras instancias conectadas con número de teléfono configurado.'
    });
  }

  // Obtener perfil del usuario para API key (opcional, ahora usamos BYOK)
  // We keep this check if needed for other features, but usually not blocking if BYOK
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('api_key')
    .eq('id', userId)
    .single();

  if (!profile) {
    return res.status(403).json({ error: 'Perfil no encontrado' });
  }

  // Verificar conexión con backend
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!BACKEND_URL) {
    return res.status(500).json({
      error: 'Backend no configurado'
    });
  }

  try {
    await axios.get(`${BACKEND_URL}/api/sessions`, { timeout: 5000 });
  } catch (backendError) {
    return res.status(503).json({
      error: 'Backend no disponible',
      message: 'El servidor de WhatsApp no está respondiendo'
    });
  }

  // Inicializar conversación IA
  const conversationData = {
    instanceId,
    userId,
    provider,
    apiKey,
    startDate: new Date().toISOString(),
    currentPhase: 1,
    messagesSent: 0,
    totalMessagesSent: 0,
    lastMessageTime: null,
    isActive: true,
    conversationPartners: otherInstances,
    conversationHistory: [],
    phases: [
      { day: 1, maxMessages: 5, messagesSent: 0 },
      { day: 2, maxMessages: 10, messagesSent: 0 },
      { day: 3, maxMessages: 15, messagesSent: 0 },
      { day: 4, maxMessages: 25, messagesSent: 0 },
      { day: 5, maxMessages: 35, messagesSent: 0 },
      { day: 6, maxMessages: 50, messagesSent: 0 },
      { day: 7, maxMessages: 75, messagesSent: 0 },
      { day: 8, maxMessages: 100, messagesSent: 0 },
      { day: 9, maxMessages: 125, messagesSent: 0 },
      { day: 10, maxMessages: 150, messagesSent: 0 },
    ]
  };

  // Guardar en memoria
  activeConversations.set(conversationKey, conversationData);

  // Iniciar proceso en background
  startIAConversationProcess(conversationData, BACKEND_URL);

  console.log(`🤖 Conversación IA iniciada para instancia ${instanceId} con ${otherInstances.length} participantes`);

  return res.status(200).json({
    success: true,
    message: 'Conversación IA iniciada exitosamente',
    conversation: {
      ...conversationData,
      participantCount: otherInstances.length
    }
  });
}

// Función para detener conversación IA
async function stopIAConversation(instanceId, userId, res) {
  const conversationKey = `${userId}-${instanceId}`;

  if (!activeConversations.has(conversationKey)) {
    return res.status(400).json({
      error: 'No hay conversación IA activa para esta instancia'
    });
  }

  // Remover de memoria
  activeConversations.delete(conversationKey);

  console.log(`🛑 Conversación IA detenida para instancia ${instanceId}`);

  return res.status(200).json({
    success: true,
    message: 'Conversación IA detenida exitosamente'
  });
}

// Función que ejecuta el proceso de conversación IA en background
async function startIAConversationProcess(conversationData, backendUrl) {
  const { instanceId, userId, conversationPartners, provider, apiKey } = conversationData;
  const conversationKey = `${userId}-${instanceId}`;

  console.log(`🚀 Iniciando conversación IA para ${instanceId}`);

  try {
    while (activeConversations.has(conversationKey)) {
      const currentData = activeConversations.get(conversationKey);
      if (!currentData || !currentData.isActive) break;

      const currentPhase = currentData.phases[currentData.currentPhase - 1];
      const todayMessages = currentPhase.messagesSent;

      // Verificar si ya alcanzó el límite del día
      if (todayMessages >= currentPhase.maxMessages) {
        if (currentData.currentPhase < 10) {
          currentData.currentPhase++;
          console.log(`📈 IA: Avanzando a fase ${currentData.currentPhase} para ${instanceId}`);
        } else {
          console.log(`🎉 IA: Conversación completada para ${instanceId}`);
          activeConversations.delete(conversationKey);
          break;
        }
        continue;
      }

      // Elegir un participante aleatorio para conversar
      const randomPartner = conversationPartners[Math.floor(Math.random() * conversationPartners.length)];

      try {
        // Generar mensaje inicial o respuesta basada en historial
        let messageToSend;

        if (currentData.conversationHistory.length === 0) {
          // Primer mensaje - algo para iniciar conversación
          const starterMessages = [
            `Hola ${randomPartner.name}, ¿cómo va todo por tu lado?`,
            `¿Qué tal ${randomPartner.name}? ¿Alguna novedad interesante?`,
            `Buenas ${randomPartner.name}, ¿cómo está resultando el proyecto?`,
            `Hola, ¿has tenido oportunidad de revisar lo que comentamos?`,
            `¿Qué opinas de las últimas actualizaciones del sistema?`
          ];
          messageToSend = starterMessages[Math.floor(Math.random() * starterMessages.length)];
        } else {
          // Responder al último mensaje usando IA
          const lastMessage = currentData.conversationHistory[currentData.conversationHistory.length - 1];
          messageToSend = await generateIAResponse(lastMessage.content, currentData.conversationHistory, {}, provider, apiKey);
        }

        // Enviar mensaje
        const response = await axios.post(
          `${backendUrl}/api/send-message/${instanceId}`,
          {
            number: randomPartner.number,
            message: `${messageToSend} (IA Conversación - Día ${currentData.currentPhase})`
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}` // Using user API key just in case, but usually backend endpoint handles its own auth or is internal
            },
            timeout: 10000
          }
        );

        // Actualizar contadores y historial
        currentData.messagesSent++;
        currentData.totalMessagesSent++;
        currentPhase.messagesSent++;
        currentData.lastMessageTime = new Date().toISOString();

        // Agregar al historial de conversación
        currentData.conversationHistory.push({
          from: instanceId,
          to: randomPartner.id,
          content: messageToSend,
          timestamp: new Date().toISOString(),
          isAI: true
        });

        // Limitar historial a últimos 20 mensajes
        if (currentData.conversationHistory.length > 20) {
          currentData.conversationHistory = currentData.conversationHistory.slice(-20);
        }

        console.log(`🤖 IA: Mensaje enviado a ${randomPartner.name} (${currentData.messagesSent}/${currentPhase.maxMessages} hoy)`);

        // Actualizar estadísticas
        try {
          await updateInstanceStats(instanceId, {
            message_sent: 1,
            api_message_sent: 1,
            message_received: 0,
          });
        } catch (statsError) {
          console.error(`🤖 IA: Error actualizando estadísticas:`, statsError.message);
        }

      } catch (sendError) {
        console.error(`🤖 IA: Error enviando mensaje a ${randomPartner.name}:`, sendError.message);

        if (sendError.response?.status === 429) {
          console.log(`🤖 IA: Rate limit detectado, esperando 5 minutos...`);
          await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000));
        }
      }

      // Esperar entre 45-180 segundos (más tiempo para conversaciones naturales)
      const delaySeconds = Math.random() * (180 - 45) + 45;
      console.log(`🤖 IA: Esperando ${Math.round(delaySeconds)} segundos para siguiente mensaje...`);
      await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
    }

  } catch (error) {
    console.error(`❌ Error en conversación IA ${instanceId}:`, error);
    activeConversations.delete(conversationKey);
  }

  console.log(`🏁 Conversación IA finalizada para ${instanceId}`);
}

// Función helper para actualizar estadísticas
async function updateInstanceStats(documentId, stats) {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { data: instance, error: fetchError } = await supabaseAdmin
      .from('instances')
      .select('historycal_data')
      .eq('document_id', documentId)
      .single();

    if (fetchError) {
      console.error('[UPDATE-STATS] Error fetching instance:', fetchError);
      return;
    }

    let historycalData = instance.historycal_data || [];
    const todayIndex = historycalData.findIndex(item => item.date === today);

    if (todayIndex >= 0) {
      historycalData[todayIndex] = {
        date: today,
        message_sent: (historycalData[todayIndex].message_sent || 0) + (stats.message_sent || 0),
        api_message_sent: (historycalData[todayIndex].api_message_sent || 0) + (stats.api_message_sent || 0),
        message_received: (historycalData[todayIndex].message_received || 0) + (stats.message_received || 0),
      };
    } else {
      historycalData.push({
        date: today,
        message_sent: stats.message_sent || 0,
        api_message_sent: stats.api_message_sent || 0,
        message_received: stats.message_received || 0,
      });
    }

    if (historycalData.length > 30) {
      historycalData = historycalData.slice(-30);
    }

    const { error: updateError } = await supabaseAdmin
      .from('instances')
      .update({ historycal_data: historycalData })
      .eq('document_id', documentId);

    if (updateError) {
      console.error('[UPDATE-STATS] Error updating instance:', updateError);
    }
  } catch (error) {
    console.error('[UPDATE-STATS] Error:', error);
  }
}