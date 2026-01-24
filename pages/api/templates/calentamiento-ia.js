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
      const { provider, apiKey, instanceIds, theme, unlimited, customLimit, messageDelay } = req.body;

      if (!instanceIds || !Array.isArray(instanceIds) || instanceIds.length < 2) {
        return res.status(400).json({ error: 'Se requieren al menos 2 instanciaIds para conversar' });
      }

      const results = [];
      for (const id of instanceIds) {
        const resMock = { status: () => ({ json: () => { } }) }; // Simple mock for internal loops
        const result = await startIAConversation(id, session.id, resMock, provider, apiKey, instanceIds, theme, unlimited, customLimit, messageDelay);
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
      // Usamos gemini-2.0-flash según indicación del usuario (el 1.5 daba 404)
      const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

      const contents = [
        {
          role: "user",
          parts: [{
            text: `Actúa como un colega de trabajo en WhatsApp. Responde de forma muy natural y fluida al siguiente mensaje: "${message}". ${themePrompt}
          REGLAS: No seas breve, escribe al menos 2 ó 3 oraciones completas (25-50 palabras). Pregunta algo relacionado para seguir el hilo. Usa un tono de oficina casual.` }]
        }
      ];

      // Retry Logic para manejo de Rate Limits (429)
      let retries = 0;
      const maxRetries = 3;

      while (retries <= maxRetries) {
        try {
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
          }

          if (response.status === 429) {
            retries++;
            console.warn(`⚠️ [IA LIMIT] Gemini Cuota excedida (429). Reintento ${retries}/${maxRetries} en ${retries * 2}s...`);
            if (retries <= maxRetries) {
              await new Promise(resolve => setTimeout(resolve, retries * 2000)); // Espera exponencial: 2s, 4s, 6s...
              continue;
            }
          }

          // Si llegamos aquí es un error no-429 o se acabaron los retries
          try {
            const errorData = await response.json();
            console.error('Gemini Error (No-Retry):', errorData);
          } catch (e) {
            console.error('Gemini Error Status:', response.status);
          }
          break; // Salir del loop si es error definitivo

        } catch (fetchError) {
          console.error('Gemini Fetch Network Error:', fetchError);
          break;
        }
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
async function startIAConversation(instanceId, userId, res, provider = 'openai', apiKey = null, groupInstanceIds = null, theme = null, unlimited = false, customLimit = null, messageDelay = null) {
  const conversationKey = `${userId}-${instanceId}`;

  // Log de depuración para rastrear customLimit y messageDelay
  console.log(`🔍 [IA-START] Petición recibida para ${instanceId}`);
  console.log(`🔍 [IA-START] Params: customLimit=${customLimit}, messageDelay=${messageDelay}, Unlimited=${unlimited}`);
  if (activeConversations.has(conversationKey)) {
    return { error: 'Ya activa' };
  }

  // Validate API Key presence for AI (if required by provider)
  // Nota: Si el usuario no da key de IA, usaremos la del sistema si existe en el perfil, o error.

  // Buscar SIEMPRE la key del sistema (para enviar mensajes) y keys guardadas
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('api_key, openai_api_key, gemini_api_key')
    .eq('id', userId)
    .single();

  const systemApiKey = profile?.api_key;
  if (!systemApiKey) {
    console.error('❌ [IA-START] Error: El usuario no tiene API Key de sistema');
    return { error: 'No se encontró API Key del sistema para este usuario. Contacta soporte.' };
  }

  // Determinar la key final para la IA
  let finalAiKey = apiKey;

  if (!finalAiKey) {
    // Si no viene en el request, buscar en perfil según provider
    if (provider === 'openai' && profile.openai_api_key) {
      finalAiKey = profile.openai_api_key;
    } else if (provider === 'gemini' && profile.gemini_api_key) {
      finalAiKey = profile.gemini_api_key;
    }
  }

  // Si sigue sin haber key de IA, advertir (pero permitir arrancar si hay lógica fallback sin key)
  if (!finalAiKey) {
    console.warn('⚠️ [IA-START] Arrancando sin API Key de IA explícita (usará fallback local o fallará la IA)');
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
    apiKey: finalAiKey, // Key para la IA (OpenAI/Gemini)
    systemApiKey: systemApiKey, // Key para nuestra API (Backend)
    theme,
    unlimited,
    customLimit: customLimit ? parseInt(customLimit) : null,
    messageDelay: messageDelay ? parseInt(messageDelay) : null,
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
  const { instanceId, userId, conversationPartners, provider, apiKey, systemApiKey } = conversationData;
  const conversationKey = `${userId}-${instanceId}`;

  console.log(`🚀 Iniciando proceso IA para ${instanceId} (Auth Key: ${systemApiKey ? 'Presente' : 'Faltante'})`);

  // Pequeña espera inicial para que el usuario vea el cambio en el UI antes del primer mensaje
  await new Promise(resolve => setTimeout(resolve, 5000));

  let messagesSinceLastPause = 0;
  let pauseThreshold = Math.floor(Math.random() * 6) + 10; // 10-15 mensajes

  try {
    while (activeConversations.has(conversationKey)) {
      const currentData = activeConversations.get(conversationKey);
      if (!currentData || !currentData.isActive) break;

      const currentPhase = currentData.phases[currentData.currentPhase - 1];

      // Verificar límites diarios
      const today = new Date().toISOString().split('T')[0];

      // Obtener estadísticas actuales desde la DB
      const { data: instanceData } = await supabaseAdmin
        .from('instances')
        .select('historycal_data')
        .eq('document_id', instanceId)
        .single();

      const historycal = instanceData?.historycal_data || [];
      const todayStats = historycal.find(h => h.date === today) || { message_sent: 0 };

      // Lógica de límite: Personalizado (META DE SESIÓN) > Infinito > Fases (TOPE DIARIO)
      if (currentData.customLimit) {
        // En modo manual, el límite aplica a la CANTIDAD DE MENSAJES DE ESTA SESIÓN
        if (currentData.messagesSent >= currentData.customLimit) {
          console.log(`🛑 [IA-LIMIT] Meta de sesión manual alcanzada (${currentData.customLimit} mensajes nuevos). Deteniendo.`);
          activeConversations.delete(conversationKey);
          return;
        }
      } else if (!currentData.unlimited) {
        // Lógica por fases (Tope Diario, seguridad por defecto)
        const phaseLimits = { 1: 5, 2: 10, 3: 15, 4: 25, 5: 35, 6: 50, 7: 75, 8: 100, 9: 125, 10: 150 };
        const maxMessages = phaseLimits[currentData.currentPhase] || 5;

        if (todayStats.message_sent >= maxMessages) {
          console.log(`🛑 [IA-LIMIT] Límite diario de fase ${currentData.currentPhase} alcanzado (${maxMessages} totales). Deteniendo.`);
          activeConversations.delete(conversationKey);
          return;
        }
      }

      // Elegir un participante aleatorio para conversar
      const randomPartner = conversationPartners[Math.floor(Math.random() * conversationPartners.length)];

      try {
        // Generar mensaje inicial o respuesta basada en historial
        let messageToSend;

        if (currentData.conversationHistory.length === 0) {
          // -------------------------------------------------------------
          // 🎬 PRIMER MENSAJE (OPENER)
          // -------------------------------------------------------------
          if (currentData.theme && currentData.apiKey) {
            // ✅ Generar apertura contextual con IA si hay tema
            console.log(`🤖 IA: Generando frase inicial sobre "${currentData.theme}"...`);
            messageToSend = await generateIAResponse(
              `Instrucción interna: Inicia una conversación por WhatsApp con tu amigo ${randomPartner.name}. 
               El tema es estrictamente: "${currentData.theme}". 
               Solo escribe la primera frase de saludo y una pregunta o comentario sobre el tema. 
               Sé casual, corto y natural.`,
              [],
              {},
              provider,
              apiKey,
              currentData.theme
            );
          }

          // Si falló la IA o no hay tema, usar fallbacks
          if (!messageToSend || messageToSend.includes("Instrucción interna")) {
            const starterMessages = [
              `Hola ${randomPartner.name}, ¿cómo va todo?`,
              `¿Qué tal ${randomPartner.name}?`,
              `Buenas, ¿tienes un minuto?`,
              `Hola!`,
            ];
            messageToSend = starterMessages[Math.floor(Math.random() * starterMessages.length)];
          }
        } else {
          // -------------------------------------------------------------
          // 💬 RESPUESTA (REPLY)
          // -------------------------------------------------------------
          // Responder al último mensaje usando IA
          const lastMessage = currentData.conversationHistory[currentData.conversationHistory.length - 1];
          messageToSend = await generateIAResponse(lastMessage.content, currentData.conversationHistory, {}, provider, apiKey, currentData.theme);
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
              'Authorization': `Bearer ${systemApiKey}` // USAR KEY DEL SISTEMA SIEMPRE
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

        console.log(`🤖 IA: Mensaje enviado a ${randomPartner.name} (${currentData.messagesSent}/${currentData.customLimit || '∞'} sesión)`);

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

      // Esperar tiempo configurado o aleatorio
      let delaySeconds;
      if (currentData.messageDelay) {
        // Si hay configuración manual, usamos ese valor como base con pequeña variación natural (+/- 20%)
        // Ejemplo: si es 10s, será entre 8s y 12s
        const variation = currentData.messageDelay * 0.2;
        delaySeconds = currentData.messageDelay + (Math.random() * variation * 2 - variation);
        // Asegurar que no sea menor a 5 segundos por seguridad
        if (delaySeconds < 5) delaySeconds = 5;
      } else {
        // Default: entre 45-180 segundos (conversación natural lenta)
        delaySeconds = Math.random() * (180 - 45) + 45;
      }

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