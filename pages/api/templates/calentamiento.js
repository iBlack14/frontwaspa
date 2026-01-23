import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import axios from 'axios';

// Store active calentamiento processes (in production, use Redis/database)
const activeCalentamientos = new Map();

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verificar sesión
    const session = await getServerSession(req, res, authOptions);
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

    // GET - Obtener estado del calentamiento
    if (req.method === 'GET') {
      const calentamientoKey = `${session.id}-${instanceId}`;
      const calentamientoData = activeCalentamientos.get(calentamientoKey);

      if (!calentamientoData) {
        return res.status(200).json({
          isActive: false,
          message: 'No hay calentamiento activo'
        });
      }

      return res.status(200).json({
        isActive: true,
        ...calentamientoData
      });
    }

    // POST - Iniciar o detener calentamiento
    if (action === 'start') {
      return await startCalentamiento(instanceId, session.id, res);
    } else if (action === 'stop') {
      return await stopCalentamiento(instanceId, session.id, res);
    } else {
      return res.status(400).json({ error: 'Acción inválida. Use "start" o "stop"' });
    }

  } catch (error) {
    console.error('❌ Error en calentamiento API:', error);
    return res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message,
    });
  }
}

// Función para iniciar el calentamiento
async function startCalentamiento(instanceId, userId, res) {
  const calentamientoKey = `${userId}-${instanceId}`;

  // Verificar si ya hay un calentamiento activo
  if (activeCalentamientos.has(calentamientoKey)) {
    return res.status(400).json({
      error: 'Ya hay un calentamiento activo para esta instancia'
    });
  }

  // Obtener perfil del usuario para API key
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('api_key')
    .eq('id', userId)
    .single();

  if (!profile || !profile.api_key) {
    return res.status(403).json({
      error: 'API Key requerida',
      message: 'Necesitas una API Key para usar el calentamiento'
    });
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

  // Inicializar datos del calentamiento
  const calentamientoData = {
    instanceId,
    userId,
    startDate: new Date().toISOString(),
    currentPhase: 1,
    messagesSent: 0,
    totalMessagesSent: 0,
    lastMessageTime: null,
    isActive: true,
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

  // Guardar en memoria (en producción usar Redis/database)
  activeCalentamientos.set(calentamientoKey, calentamientoData);

  // Iniciar proceso en background
  startCalentamientoProcess(calentamientoData, profile.api_key, BACKEND_URL);

  console.log(`🔥 Calentamiento iniciado para instancia ${instanceId}`);

  return res.status(200).json({
    success: true,
    message: 'Calentamiento iniciado exitosamente',
    calentamiento: calentamientoData
  });
}

// Función para detener el calentamiento
async function stopCalentamiento(instanceId, userId, res) {
  const calentamientoKey = `${userId}-${instanceId}`;

  if (!activeCalentamientos.has(calentamientoKey)) {
    return res.status(400).json({
      error: 'No hay calentamiento activo para esta instancia'
    });
  }

  // Remover de memoria
  activeCalentamientos.delete(calentamientoKey);

  console.log(`🛑 Calentamiento detenido para instancia ${instanceId}`);

  return res.status(200).json({
    success: true,
    message: 'Calentamiento detenido exitosamente'
  });
}

// Función para generar mensajes aleatorios entre instancias
function getRandomInterInstanceMessage() {
  const messages = [
    'Hola, ¿cómo va todo por ahí?',
    '¿Todo bien con los envíos?',
    '¿Has visto el nuevo sistema?',
    '¿Qué tal funciona la nueva app?',
    '¿Cómo va la configuración?',
    '¿Necesitas ayuda con algo?',
    '¿Has probado las nuevas funciones?',
    '¿Qué tal el rendimiento?',
    '¿Cómo está funcionando el bot?',
    '¿Has revisado los logs últimamente?',
    '¿Qué opinas del nuevo diseño?',
    '¿Cómo va la integración?',
    '¿Has probado el spam control?',
    '¿Qué tal la velocidad de respuesta?',
    '¿Cómo está el servidor?',
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}

// Función que ejecuta el proceso de calentamiento en background
async function startCalentamientoProcess(calentamientoData, apiKey, backendUrl) {
  const { instanceId, userId } = calentamientoData;
  const calentamientoKey = `${userId}-${instanceId}`;

  console.log(`🚀 Iniciando proceso de calentamiento para ${instanceId}`);

  // Obtener todas las instancias conectadas del usuario para enviar mensajes entre ellas
  const { data: allInstances } = await supabaseAdmin
    .from('instances')
    .select('document_id, phone_number')
    .eq('user_id', userId)
    .eq('state', 'Connected');

  // Filtrar la instancia actual y obtener números de teléfono válidos
  const otherInstances = allInstances
    .filter(inst => inst.document_id !== instanceId && inst.phone_number)
    .map(inst => ({
      number: inst.phone_number.replace(/\D/g, ''), // Limpiar número
      instanceId: inst.document_id
    }));

  // Si no hay otras instancias, usar mensajes de prueba seguros
  let contactsToUse;
  if (otherInstances.length > 0) {
    // Usar otras instancias del usuario para conversaciones reales
    contactsToUse = otherInstances.map(inst => ({
      number: inst.number,
      message: getRandomInterInstanceMessage(),
      isInterInstance: true
    }));
    console.log(`🔄 Calentamiento entre instancias: ${otherInstances.length} números disponibles`);
  } else {
    // Fallback a mensajes de prueba
    contactsToUse = [
      { number: '1234567890', message: 'Hola, ¿cómo estás?', isInterInstance: false },
      { number: '0987654321', message: '¿Todo bien por ahí?', isInterInstance: false },
      { number: '1122334455', message: 'Un saludo cordial', isInterInstance: false },
      { number: '5566778899', message: 'Espero que tengas un buen día', isInterInstance: false },
      { number: '4433221100', message: 'Saludos desde la aplicación', isInterInstance: false },
    ];
    console.log(`🧪 Calentamiento con mensajes de prueba: ${contactsToUse.length} mensajes disponibles`);
  }

  try {
    while (activeCalentamientos.has(calentamientoKey)) {
      const currentData = activeCalentamientos.get(calentamientoKey);
      if (!currentData || !currentData.isActive) break;

      const currentPhase = currentData.phases[currentData.currentPhase - 1];
      const todayMessages = currentPhase.messagesSent;

      // Verificar si ya alcanzó el límite del día
      if (todayMessages >= currentPhase.maxMessages) {
        // Avanzar a la siguiente fase
        if (currentData.currentPhase < 10) {
          currentData.currentPhase++;
          console.log(`📈 Avanzando a fase ${currentData.currentPhase} para ${instanceId}`);
        } else {
          console.log(`🎉 Calentamiento completado para ${instanceId}`);
          activeCalentamientos.delete(calentamientoKey);
          break;
        }
        continue;
      }

      // Enviar un mensaje
      try {
        const contact = contactsToUse[Math.floor(Math.random() * contactsToUse.length)];
        const messageType = contact.isInterInstance ? '🔄 Inter-instancia' : '🧪 Prueba';

        const response = await axios.post(
          `${backendUrl}/api/send-message/${instanceId}`,
          {
            number: contact.number,
            message: `${contact.message} (Calentamiento - Día ${currentData.currentPhase})`
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            },
            timeout: 10000
          }
        );

        // Actualizar contadores
        currentData.messagesSent++;
        currentData.totalMessagesSent++;
        currentPhase.messagesSent++;
        currentData.lastMessageTime = new Date().toISOString();

        console.log(`${messageType} ✅ Mensaje enviado en calentamiento ${instanceId}: ${currentData.messagesSent}/${currentPhase.maxMessages} hoy`);

      } catch (sendError) {
        console.error(`❌ Error enviando mensaje en calentamiento ${instanceId}:`, sendError.message);

        // Si hay error de rate limit, esperar más tiempo
        if (sendError.response?.status === 429) {
          console.log(`⏳ Rate limit detectado, esperando 5 minutos...`);
          await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000));
        }
      }

      // Esperar entre 30 segundos y 2 minutos entre mensajes
      const waitTime = Math.random() * (120 - 30) + 30; // 30-120 segundos
      console.log(`⏳ Esperando ${Math.round(waitTime)} segundos antes del siguiente mensaje...`);
      await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
    }

  } catch (error) {
    console.error(`❌ Error en proceso de calentamiento ${instanceId}:`, error);
    activeCalentamientos.delete(calentamientoKey);
  }

  console.log(`🏁 Proceso de calentamiento finalizado para ${instanceId}`);
}

// Función helper para obtener estado del calentamiento
function getCalentamientoStatus(instanceId, userId) {
  const key = `${userId}-${instanceId}`;
  return activeCalentamientos.get(key) || null;
}

// Exportar función para uso en otras partes
export { getCalentamientoStatus };