import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import formidable from 'formidable';
import XLSX from 'xlsx';
import fs from 'fs';
import axios from 'axios';
import { createSpam, shouldContinue, updateProgress, completeSpam, stopSpam } from '../../../src/lib/spam-control';
import {
  calculateAdaptiveDelay,
  shouldTakeLongPause,
  getLongPauseDuration,
  hasReachedDailyLimit,
  hasReachedHourlyLimit,
  getTimeUntilNextHour,
  incrementMessageCount,
  recordError,
  getCounters,
  logAntiBanStatus,
  isSafeHour,
  isValidPhoneNumber,
} from '../../../src/lib/anti-ban-system';
import { validatePlan } from '../../../src/middleware/plan-validation.middleware';

export const config = {
  api: {
    bodyParser: false,
  },
};

// ✅ Función helper para actualizar estadísticas de instancia
async function updateInstanceStats(documentId, stats) {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Obtener datos actuales
    const { data: instance, error: fetchError } = await supabaseAdmin
      .from('instances')
      .select('historycal_data')
      .eq('document_id', documentId)
      .single();

    if (fetchError) {
      console.error('[UPDATE-STATS] Error fetching instance:', fetchError);
      return;
    }

    // Obtener o inicializar datos históricos
    let historycalData = instance.historycal_data || [];

    // Buscar registro de hoy
    const todayIndex = historycalData.findIndex(item => item.date === today);

    if (todayIndex >= 0) {
      // Actualizar registro existente
      historycalData[todayIndex] = {
        date: today,
        message_sent: (historycalData[todayIndex].message_sent || 0) + (stats.message_sent || 0),
        api_message_sent: (historycalData[todayIndex].api_message_sent || 0) + (stats.api_message_sent || 0),
        message_received: (historycalData[todayIndex].message_received || 0) + (stats.message_received || 0),
      };
    } else {
      // Crear nuevo registro para hoy
      historycalData.push({
        date: today,
        message_sent: stats.message_sent || 0,
        api_message_sent: stats.api_message_sent || 0,
        message_received: stats.message_received || 0,
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
      .eq('document_id', documentId);

    if (updateError) {
      console.error('[UPDATE-STATS] Error updating instance:', updateError);
    } else {
      console.log(`[UPDATE-STATS] ✅ Estadísticas actualizadas para ${documentId}`);
    }
  } catch (error) {
    console.error('[UPDATE-STATS] Error:', error);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verificar sesión
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.id) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    // ✅ VALIDAR PLAN - FREE solo puede usar spam con limitaciones
    const planValidation = await validatePlan(req, res, 'spam');
    if (!planValidation.allowed) {
      return res.status(planValidation.statusCode).json({
        error: planValidation.error,
        message: planValidation.message,
        currentPlan: planValidation.currentPlan,
        requiredPlan: planValidation.requiredPlan,
        currentUsage: planValidation.currentUsage,
        limit: planValidation.limit,
      });
    }

    console.log(`[SPAM] ✅ Plan validado: ${planValidation.planType.toUpperCase()}`);
    console.log(`[SPAM] Límites: ${planValidation.limits.maxMessagesPerDay} msg/día, ${planValidation.limits.maxMessagesPerHour} msg/hora`);

    // Verificar plan activo y obtener configuración de proxy
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('status_plan, api_key, proxy_enabled, proxy_type, proxy_host, proxy_port, proxy_username, proxy_password, proxy_country')
      .eq('id', session.id)
      .single();

    if (!profile || !profile.status_plan) {
      return res.status(403).json({ error: 'No tienes un plan activo' });
    }

    // Extraer configuración de proxy
    const proxyConfig = profile.proxy_enabled ? {
      enabled: true,
      type: profile.proxy_type,
      host: profile.proxy_host,
      port: profile.proxy_port,
      username: profile.proxy_username,
      password: profile.proxy_password,
      country: profile.proxy_country,
    } : null;

    // Parsear form-data
    const form = formidable({ multiples: false });

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    const instanceId = Array.isArray(fields.instanceId) ? fields.instanceId[0] : fields.instanceId;
    const uploadMode = Array.isArray(fields.uploadMode) ? fields.uploadMode[0] : fields.uploadMode;
    const message = Array.isArray(fields.message) ? fields.message[0] : fields.message;
    const imageUrl = Array.isArray(fields.imageUrl) ? fields.imageUrl[0] : fields.imageUrl;
    const waitTime = Array.isArray(fields.waitTime) ? parseInt(fields.waitTime[0]) : 3;
    const manualNumbers = Array.isArray(fields.manualNumbers) ? fields.manualNumbers[0] : fields.manualNumbers;
    const excelFile = files.file;
    const imageFile = files.imageFile; // Nueva imagen subida

    if (!instanceId) {
      return res.status(400).json({ error: 'Falta la instancia' });
    }

    if (!uploadMode || (uploadMode !== 'excel' && uploadMode !== 'manual')) {
      return res.status(400).json({ error: 'Modo de carga inválido' });
    }

    if (uploadMode === 'excel' && !excelFile) {
      return res.status(400).json({ error: 'Falta el archivo Excel' });
    }

    if (uploadMode === 'manual' && !manualNumbers) {
      return res.status(400).json({ error: 'Faltan los números manuales' });
    }

    // Subir imagen a Supabase si existe
    let finalImageUrl = null;
    let imageFilePath = null;

    if (imageFile) {
      try {
        imageFilePath = Array.isArray(imageFile) ? imageFile[0].filepath : imageFile.filepath;
        const imageFileName = Array.isArray(imageFile) ? imageFile[0].originalFilename : imageFile.originalFilename;
        const imageBuffer = fs.readFileSync(imageFilePath);

        // Generar nombre único
        const fileExt = imageFileName.split('.').pop();
        const uniqueName = `spam-images/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        // Subir a Supabase Storage
        const { data: uploadData, error: uploadError } = await supabaseAdmin
          .storage
          .from('public-files')
          .upload(uniqueName, imageBuffer, {
            contentType: Array.isArray(imageFile) ? imageFile[0].mimetype : imageFile.mimetype,
            upsert: false
          });

        if (uploadError) {
          console.error('[SPAM] Error subiendo imagen:', uploadError);
        } else {
          // Obtener URL pública
          const { data: { publicUrl } } = supabaseAdmin
            .storage
            .from('public-files')
            .getPublicUrl(uniqueName);

          finalImageUrl = publicUrl;
        }
      } catch (uploadError) {
        console.error('[SPAM] Error procesando imagen:', uploadError);
      } finally {
        // ✅ GARANTIZAR limpieza del archivo temporal
        if (imageFilePath && fs.existsSync(imageFilePath)) {
          try {
            fs.unlinkSync(imageFilePath);
            console.log('[SPAM] 🧹 Archivo temporal de imagen eliminado');
          } catch (cleanupError) {
            console.error('[SPAM] Error limpiando archivo temporal:', cleanupError);
          }
        }
      }
    }

    // Verificar que la instancia pertenece al usuario
    const { data: instance } = await supabaseAdmin
      .from('instances')
      .select('document_id, state')
      .eq('document_id', instanceId)
      .eq('user_id', session.id)
      .single();

    if (!instance) {
      return res.status(404).json({ error: 'Instancia no encontrada' });
    }

    if (instance.state !== 'Connected') {
      return res.status(400).json({
        error: 'La instancia no está conectada',
        message: 'Por favor, reconecta tu instancia de WhatsApp y escanea el QR antes de enviar mensajes.',
        instanceState: instance.state
      });
    }

    // Verificar que el backend de WhatsApp esté disponible
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (!BACKEND_URL) {
      return res.status(500).json({
        error: 'Backend de WhatsApp no configurado',
        message: 'Contacta al administrador'
      });
    }

    // Probar conexión con el backend
    try {
      await axios.get(`${BACKEND_URL}/api/sessions`, { timeout: 5000 });
    } catch (backendError) {
      return res.status(503).json({
        error: 'Backend de WhatsApp no disponible',
        message: 'El servidor de WhatsApp no está respondiendo. Intenta más tarde.'
      });
    }

    // Leer contactos según el modo de carga
    let data = [];
    let excelFilePath = null;

    if (uploadMode === 'excel') {
      try {
        // Leer archivo Excel
        excelFilePath = Array.isArray(excelFile) ? excelFile[0].filepath : excelFile.filepath;
        const workbook = XLSX.readFile(excelFilePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        data = XLSX.utils.sheet_to_json(worksheet);

        // Validar que tenga la columna 'numero'
        if (data.length === 0 || !data[0].hasOwnProperty('numero')) {
          return res.status(400).json({
            error: 'El Excel debe tener una columna llamada "numero"'
          });
        }
      } finally {
        // ✅ GARANTIZAR limpieza del archivo Excel temporal
        if (excelFilePath && fs.existsSync(excelFilePath)) {
          try {
            fs.unlinkSync(excelFilePath);
            console.log('[SPAM] 🧹 Archivo Excel temporal eliminado');
          } catch (cleanupError) {
            console.error('[SPAM] Error limpiando Excel temporal:', cleanupError);
          }
        }
      }
    } else if (uploadMode === 'manual') {
      // Parsear números manuales con validación mejorada
      const numbersArray = manualNumbers
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => {
          // Limpiar: eliminar +, espacios, guiones, paréntesis, etc.
          const cleaned = line.replace(/[^0-9]/g, '');
          return { numero: cleaned };
        })
        .filter(item => {
          // Validar longitud: entre 8 y 15 dígitos
          const length = item.numero.length;
          return length >= 8 && length <= 15;
        });

      if (numbersArray.length === 0) {
        return res.status(400).json({
          error: 'No se detectaron números válidos. Verifica que tengan entre 8 y 15 dígitos.'
        });
      }

      console.log(`[SPAM-WHATSAPP] ${numbersArray.length} números válidos procesados`);
      data = numbersArray;
    }

    // Preparar datos para envío
    const contacts = data.map(row => ({
      clientId: instanceId,
      apiKey: profile.api_key,
      numero: row.numero.toString(),
      mensaje: row.mensaje || message || '',
      imagen: row.imagen || finalImageUrl || '', // Usar imagen subida o URL
      variables: row, // ✅ Guardar todas las columnas para variables dinámicas
    }));

    // ... (rest of the code)

    const spamCreated = createSpam(spamId, contacts.length, session.id);
    console.log('[SPAM-WHATSAPP] Spam creado:', spamCreated ? 'Sí' : 'No');

    // ✅✅ IMPORTANTE: Ejecutar el proceso de envío en segundo plano
    processSpamInBackground({
      spamId,
      contacts,
      instanceId,
      apiKey: profile.api_key,
      waitTime,
      BACKEND_URL,
      finalImageUrl,
      proxyConfig, // Pasar configuración de proxy
    });

    // ... (return response)
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// ✅ Helper para reemplazar variables
function replaceVariables(text, variables) {
  if (!text || !variables) return text;
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] !== undefined ? variables[key] : match;
  });
}

// ✅✅ Función para procesar envíos en segundo plano
async function processSpamInBackground({
  spamId,
  contacts,
  instanceId,
  apiKey,
  waitTime,
  BACKEND_URL,
  finalImageUrl,
  proxyConfig,
}) {
  console.log(`[SPAM ${spamId}] 🚀 Iniciando proceso en background para ${contacts.length} contactos`);

  // Filtrar contactos válidos
  const validContacts = contacts.filter(c => c.numero);

  // Tipo de cuenta por defecto
  const accountType = 'warm';

  try {
    for (let i = 0; i < validContacts.length; i++) {
      // Verificar si el proceso sigue activo
      if (!shouldContinue(spamId)) {
        console.log(`[SPAM ${spamId}] 🛑 Proceso detenido por el usuario`);
        break;
      }
      const contact = validContacts[i];
      console.log(`[SPAM ${spamId}] Enviando mensaje ${i + 1}/${contacts.length} a ${contact.numero}`);

      try {
        // ✅ Reemplazar variables dinámicas en el mensaje
        const finalMessage = replaceVariables(contact.mensaje, contact.variables);

        const hasImage = Boolean(contact.imagen);
        const endpoint = hasImage
          ? `${BACKEND_URL}/api/send-image/${instanceId}`
          : `${BACKEND_URL}/api/send-message/${instanceId}`;

        const payload = hasImage
          ? {
            number: contact.numero,
            file: contact.imagen,
            message: finalMessage, // ✅ Usar mensaje procesado
          }
          : {
            number: contact.numero,
            message: finalMessage, // ✅ Usar mensaje procesado
          };

        // Usar configuración con proxy si está disponible
        const response = await axios.post(endpoint, payload, axiosConfig);

        console.log(`[SPAM ${spamId}] ✅ Mensaje ${i + 1} enviado correctamente a ${contact.numero}`);

        // ✅ Incrementar contador de mensajes
        const updatedCounters = incrementMessageCount(instanceId);

        // ✅ Actualizar progreso exitoso
        updateProgress(spamId, i + 1, { success: true, number: contact.numero });

        // ✅✅ Actualizar estadísticas en historycal_data (llamada interna)
        try {
          await updateInstanceStats(instanceId, {
            message_sent: 1,
            api_message_sent: 1,
            message_received: 0,
          });
        } catch (statsError) {
          console.error(`[SPAM ${spamId}] Error actualizando estadísticas:`, statsError.message);
        }

        // ✅ Verificar si necesita pausa larga
        if (shouldTakeLongPause(i + 1, accountType)) {
          const pauseDuration = getLongPauseDuration(accountType);
          console.log(`[SPAM ${spamId}] ⏸️  PAUSA LARGA: ${pauseDuration / 1000} segundos (enviados ${i + 1} mensajes)`);
          await new Promise(resolve => setTimeout(resolve, pauseDuration));
          console.log(`[SPAM ${spamId}] ▶️  Reanudando envío después de pausa`);
        }

        // ✅✅ Delay ADAPTATIVO e INTELIGENTE entre mensajes
        if (i < validContacts.length - 1) {
          // Calcular delay adaptativo basado en uso y condiciones
          const adaptiveDelay = calculateAdaptiveDelay({
            accountType,
            messagesSentThisHour: updatedCounters.messagesSentThisHour,
            messagesSentToday: updatedCounters.messagesSentToday,
            recentErrors: updatedCounters.recentErrors,
          });

          const delaySeconds = (adaptiveDelay / 1000).toFixed(1);
          console.log(`[SPAM ${spamId}] ⏳ Delay adaptativo: ${delaySeconds}s (enviados hoy: ${updatedCounters.messagesSentToday})`);

          // Verificar shouldContinue mientras espera
          const checkInterval = 500; // Verificar cada 500ms
          let elapsed = 0;

          while (elapsed < adaptiveDelay) {
            // Verificar si fue detenido durante la espera
            if (!shouldContinue(spamId)) {
              console.log(`[SPAM ${spamId}] 🛑 Envío detenido durante el delay`);
              return; // Salir completamente de la función
            }

            await new Promise(resolve => setTimeout(resolve, Math.min(checkInterval, adaptiveDelay - elapsed)));
            elapsed += checkInterval;
          }

          // Mostrar estado cada 10 mensajes
          if ((i + 1) % 10 === 0) {
            logAntiBanStatus(instanceId);
          }
        }
      } catch (sendError) {
        console.error(`[SPAM ${spamId}] ❌ Error enviando mensaje ${i + 1} a ${contact.numero}:`, sendError.message);

        // ✅ Registrar error para ajustar delays
        recordError(instanceId);

        // ✅ Actualizar progreso con error
        updateProgress(spamId, i + 1, {
          success: false,
          number: contact.numero,
          error: sendError.message
        });

        // Si es error de rate limit, esperar más tiempo
        if (sendError.message.includes('429') || sendError.message.includes('rate') || sendError.message.includes('limit')) {
          console.log(`[SPAM ${spamId}] 🚨 RATE LIMIT detectado. Pausa de 5 minutos...`);
          await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000));
        }

        // Continuar con el siguiente
      }
    }

    // ✅ Marcar como completado (Final)
    console.log(`[SPAM ${spamId}] ✅ Proceso completado exitosamente`);
    completeSpam(spamId);
  } catch (error) {
    console.error(`[SPAM ${spamId}] ❌ Error fatal en el proceso:`, error);
    // Marcar como completado con errores
    completeSpam(spamId);
  }
}
