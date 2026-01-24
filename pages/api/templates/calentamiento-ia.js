import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import axios from 'axios';

// Store active IA conversations (in production, use Redis/database)
const activeConversations = new Map();

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const action = req.body?.action || req.query?.action || 'status';
  if (action !== 'status') {
    console.log(`🔥 [IA-API] ${action.toUpperCase()} (${req.method})`);
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

    const { instanceId, instanceIds, action } = req.method === 'POST' ? req.body : req.query;

    if (!instanceId && (!instanceIds || !Array.isArray(instanceIds))) {
      return res.status(400).json({ error: 'instanceId o instanceIds es requerido' });
    }

    // Si es una sola instancia (GET o stop), verificamos su estado
    if (instanceId) {
      const { data: instance } = await supabaseAdmin
        .from('instances')
        .select('document_id, state, user_id')
        .eq('document_id', instanceId)
        .eq('user_id', session.id)
        .single();

      if (!instance) {
        return res.status(404).json({ error: 'Instancia no encontrada' });
      }

      if (instance.state !== 'Connected' && action !== 'start') {
        return res.status(400).json({
          error: 'La instancia no está conectada',
          message: 'Por favor, reconecta tu instancia de WhatsApp'
        });
      }
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
      const { provider, apiKey, instanceIds, theme } = req.body;

      if (!instanceIds || !Array.isArray(instanceIds) || instanceIds.length < 2) {
        return res.status(400).json({ error: 'Se requieren al menos 2 instanciaIds para conversar' });
      }

      const results = [];
      for (const id of instanceIds) {
        const resMock = { status: () => ({ json: () => { } }) }; // Simple mock for internal loops
        const result = await startIAConversation(id, session.id, resMock, provider, apiKey, instanceIds, theme, req.body.unlimited);
        results.push(result);
      }

      return res.status(200).json({
        success: true,
        isActive: true,
        message: 'Conversaciones IA iniciadas para el grupo',
        instances: instanceIds
      });

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
async function generateIAResponse(message, conversationHistory = [], context = {}, provider = 'openai', apiKey = null, theme = null) {
  try {
    if (!apiKey) {
      console.warn('No API Key provided for IA response');
      return getFallbackResponse(message, conversationHistory);
    }

    const themePrompt = theme ? ` TEMA ESPECÍFICO DE ESTA CONVERSACIÓN: "${theme}". ASEGÚRATE DE HABLAR SOBRE ESTO.` : '';

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
              content: `Eres un profesional en una conversación de WhatsApp. 
              TU OBJETIVO es mantener un flujo de conversación natural y realista.${themePrompt}
              INSTRUCCIONES CRÍTICAS:
              1. NO respondas con una sola palabra.
              2. Tus respuestas deben tener entre 20 y 60 palabras.
              3. Usa un lenguaje natural de chat.
              4. Varía los temas si no hay un tema específico.
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
            text: `Actúa como un colega de trabajo en WhatsApp. Responde de forma muy natural y fluida al siguiente mensaje: "${message}". ${themePrompt}
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
    return getFallbackResponse(message, conversationHistory, theme);

  } catch (error) {
    console.error('Error generando respuesta IA:', error);
    return getFallbackResponse(message, [], theme);
  }
}

// Función de respaldo si falla la IA (Mejorada y Contextual)
function getFallbackResponse(message, conversationHistory, theme = "negocios") {
  // Frases genéricas de negocios/tecnología si el tema lo sugiere
  const businessFallbacks = [
    "He estado revisando las métricas del último sprint y se ven prometedoras.",
    "¿Has tenido oportunidad de ver el feedback del cliente sobre la nueva feature?",
    "Creo que deberíamos agendar una reunión para sincronizar los avances del proyecto.",
    "La integración de la API está casi lista, faltan unos detalles de seguridad.",
    "¿Qué opinas si probamos una estrategia diferente para la optimización?",
    "Recuerda enviar el reporte antes del cierre del día.",
    "Estaba pensando que podríamos automatizar ese proceso para ahorrar tiempo.",
    "¿Cómo van los tests de cargas? ¿Todo estable?",
    "Excelente, sigamos con ese plan entonces.",
    "Voy a documentar estos cambios para que todo el equipo esté alineado."
  ];

  const generalFallbacks = [
    "Entiendo tu punto, suena razonable.",
    "Sí, totalmente de acuerdo. ¿Cómo sugerirías proceder?",
    "Interesante. Déjame pensarlo un momento y te comento.",
    "Claro, tiene todo el sentido del mundo.",
    "Perfecto, avancemos con eso entonces.",
    "Me parece bien. ¿Necesitas ayuda con algo de eso?",
    "Vale, lo tendré en cuenta para la próxima iteración."
  ];

  // Detectar si el tema es de negocios/tecnología (simple heurística)
  const isBusiness = theme && (theme.toLowerCase().includes('negocio') || theme.toLowerCase().includes('tecnología') || theme.toLowerCase().includes('trabajo'));

  const selectedFallbacks = isBusiness ? businessFallbacks : generalFallbacks;
  return selectedFallbacks[Math.floor(Math.random() * selectedFallbacks.length)];
}
async function startIAConversation(instanceId, userId, res, provider = 'openai', apiKey = null, groupInstanceIds = null, theme = null, unlimited = false) {
  const conversationKey = `${userId}-${instanceId}`;

  // Verificar si ya hay una conversación activa
  if (activeConversations.has(conversationKey)) {
    return { error: 'Ya activa' };
  }

  // Validate API Key presence
  if (!apiKey) {
    return { error: 'Falta API Key' };
  }

  // Si nos pasan un grupo específico, usamos ese. Si no, buscamos todas las conectadas.
  let otherInstances = [];

  if (groupInstanceIds && Array.isArray(groupInstanceIds)) {
    const { data: allInstances } = await supabaseAdmin
      .from('instances')
      .select('document_id, phone_number, profile_name')
      .in('document_id', groupInstanceIds)
      .eq('state', 'Connected');

    if (allInstances) {
      otherInstances = allInstances
        .filter(inst => inst.document_id !== instanceId && inst.phone_number)
        .map(inst => ({
          id: inst.document_id,
          number: inst.phone_number.replace(/\D/g, ''),
          name: inst.profile_name || 'Colega'
        }));
    }
  } else {
    // Lógica fallback original
    const { data: allInstances } = await supabaseAdmin
      .from('instances')
      .select('document_id, phone_number, profile_name')
      .eq('user_id', userId)
      .eq('state', 'Connected');

    if (allInstances) {
      otherInstances = allInstances
        .filter(inst => inst.document_id !== instanceId && inst.phone_number)
        .map(inst => ({
          id: inst.document_id,
          number: inst.phone_number.replace(/\D/g, ''),
          name: inst.profile_name || 'Colega'
        }));
    }
  }

  if (otherInstances.length === 0) {
    return { error: 'No hay compañeros' };
  }

  // Verificar conexión con backend
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  // Inicializar conversación IA
  const conversationData = {
    instanceId,
    userId,
    provider,
    apiKey,
    theme,
    unlimited,
    userKey: '', // Will be filled below
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

  // Obtener la clave interna del usuario para autenticar con el backend-whatsapp
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('api_key')
    .eq('id', userId)
    .single();

  if (profile && profile.api_key) {
    conversationData.userKey = profile.api_key;
  }

  // Guardar en memoria
  activeConversations.set(conversationKey, conversationData);

  // Iniciar proceso en background
  startIAConversationProcess(conversationData, BACKEND_URL);

  return { success: true };
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
  const { instanceId, userId, conversationPartners, provider, apiKey, userKey } = conversationData;
  const conversationKey = `${userId}-${instanceId}`;

  console.log(`🚀 Iniciando proceso IA para ${instanceId} (Auth Key: ${userKey ? 'Presente' : 'Faltante'})`);

  // Pequeña espera inicial para que el usuario vea el cambio en el UI antes del primer mensaje
  await new Promise(resolve => setTimeout(resolve, 5000));

  let messagesSinceLastPause = 0;
  let pauseThreshold = Math.floor(Math.random() * 6) + 10; // 10-15 mensajes

  try {
    while (activeConversations.has(conversationKey)) {
      const currentData = activeConversations.get(conversationKey);
      if (!currentData || !currentData.isActive) break;

      const currentPhase = currentData.phases[currentData.currentPhase - 1];
      const todayMessages = currentPhase.messagesSent;

      // Verificar si ya alcanzó el límite del día (SÓLO SI NO ES UNLIMITED)
      if (!currentData.unlimited && todayMessages >= currentPhase.maxMessages) {
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
            message: messageToSend // Mensaje limpio sin etiquetas de debug
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${userKey || apiKey}` // Priorizar userKey interna
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

      // ☕ Lógica de pausas largas de seguridad
      messagesSinceLastPause++;
      if (messagesSinceLastPause >= pauseThreshold) {
        console.log(`☕ IA: Tomando descanso largo de seguridad (5 min) después de ${messagesSinceLastPause} mensajes...`);
        await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000));
        messagesSinceLastPause = 0;
        pauseThreshold = Math.floor(Math.random() * 6) + 10;
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