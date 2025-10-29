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

    // Verificar plan activo
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('status_plan, api_key')
      .eq('id', session.id)
      .single();

    if (!profile || !profile.status_plan) {
      return res.status(403).json({ error: 'No tienes un plan activo' });
    }

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

    // Subir imagen a Supabase Storage si se subió un archivo
    let finalImageUrl = imageUrl || '';
    
    if (imageFile) {
      try {
        const imageFilePath = Array.isArray(imageFile) ? imageFile[0].filepath : imageFile.filepath;
        const imageFileName = Array.isArray(imageFile) ? imageFile[0].originalFilename : imageFile.originalFilename;
        const imageBuffer = fs.readFileSync(imageFilePath);
        
        // Generar nombre único
        const timestamp = Date.now();
        const extension = imageFileName.split('.').pop();
        const uniqueName = `spam-images/${session.id}/${timestamp}.${extension}`;
        
        // Subir a Supabase Storage
        const { data: uploadData, error: uploadError } = await supabaseAdmin
          .storage
          .from('public-files') // Asegúrate de tener este bucket creado
          .upload(uniqueName, imageBuffer, {
            contentType: Array.isArray(imageFile) ? imageFile[0].mimetype : imageFile.mimetype,
            upsert: false
          });
        
        if (uploadError) {
          // Error uploading image
        } else {
          // Obtener URL pública
          const { data: { publicUrl } } = supabaseAdmin
            .storage
            .from('public-files')
            .getPublicUrl(uniqueName);
          
          finalImageUrl = publicUrl;
        }
        
        // Limpiar archivo temporal
        fs.unlinkSync(imageFilePath);
      } catch (uploadError) {
        // Continuar sin imagen si falla
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
    
    if (uploadMode === 'excel') {
      // Leer archivo Excel
      const filePath = Array.isArray(excelFile) ? excelFile[0].filepath : excelFile.filepath;
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      data = XLSX.utils.sheet_to_json(worksheet);

      // Validar que tenga la columna 'numero'
      if (data.length === 0 || !data[0].hasOwnProperty('numero')) {
        return res.status(400).json({ 
          error: 'El Excel debe tener una columna llamada "numero"' 
        });
      }
      
      // Limpiar archivo subido
      fs.unlinkSync(filePath);
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
    }));

    // ✅ Crear control de envío con ID único
    const spamId = `spam_${session.id}_${Date.now()}`;
    console.log('[SPAM-WHATSAPP] Creando spam con ID:', spamId);
    console.log('[SPAM-WHATSAPP] Total contactos:', contacts.length);
    console.log('[SPAM-WHATSAPP] User ID:', session.id);
    
    const spamCreated = createSpam(spamId, contacts.length, session.id);
    console.log('[SPAM-WHATSAPP] Spam creado:', spamCreated ? 'Sí' : 'No');

    // ✅✅ IMPORTANTE: Ejecutar el proceso de envío en segundo plano
    // No usar await aquí para que retorne inmediatamente al frontend
    processSpamInBackground({
      spamId,
      contacts,
      instanceId,
      apiKey: profile.api_key,
      waitTime,
      BACKEND_URL,
      finalImageUrl,
    });

    // ✅✅ RETORNAR INMEDIATAMENTE (no esperar a que termine el envío)
    return res.json({
      success: true,
      spamId,
      totalContacts: contacts.length,
      message: `Iniciando envío a ${contacts.length} contactos`,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
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
}) {
  console.log(`[SPAM ${spamId}] 🚀 Iniciando envío con SISTEMA ANTI-BANEO`);
  console.log(`[SPAM ${spamId}] Total mensajes: ${contacts.length}`);
  
  // Tipo de cuenta (puedes obtenerlo de la BD o configuración)
  const accountType = 'warm_account'; // warm_account, new_account, established_account
  
  // Mostrar estado inicial
  logAntiBanStatus(instanceId);
  
  try {
    // Validar números antes de enviar
    const validContacts = contacts.filter(contact => isValidPhoneNumber(contact.numero));
    const invalidCount = contacts.length - validContacts.length;
    
    if (invalidCount > 0) {
      console.log(`[SPAM ${spamId}] ⚠️  ${invalidCount} números inválidos fueron filtrados`);
    }
    
    // Enviar directamente desde el backend
    for (let i = 0; i < validContacts.length; i++) {
      // ✅ Verificar si el envío fue detenido
      if (!shouldContinue(spamId)) {
        console.log(`[SPAM ${spamId}] 🛑 Envío detenido por el usuario en mensaje ${i + 1}`);
        break;
      }
      
      // ✅ Verificar límites anti-baneo
      const counters = getCounters(instanceId);
      
      // Límite diario alcanzado
      if (hasReachedDailyLimit(counters.messagesSentToday, accountType)) {
        console.log(`[SPAM ${spamId}] 🚫 LÍMITE DIARIO ALCANZADO. Deteniendo envío.`);
        updateProgress(spamId, i + 1, { 
          success: false, 
          number: 'SYSTEM', 
          error: 'Límite diario alcanzado para evitar baneo' 
        });
        break;
      }
      
      // Límite por hora alcanzado
      if (hasReachedHourlyLimit(counters.messagesSentThisHour, accountType)) {
        const waitTime = getTimeUntilNextHour();
        console.log(`[SPAM ${spamId}] ⏰ LÍMITE POR HORA ALCANZADO. Esperando ${Math.ceil(waitTime / 60000)} minutos...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        console.log(`[SPAM ${spamId}] ✅ Reanudando envío después de pausa por hora`);
      }
      
      // Horario no seguro - advertencia
      if (!isSafeHour()) {
        console.log(`[SPAM ${spamId}] ⚠️  ADVERTENCIA: Enviando fuera de horario seguro (9 AM - 9 PM)`);
      }

      const contact = validContacts[i];
      console.log(`[SPAM ${spamId}] Enviando mensaje ${i + 1}/${contacts.length} a ${contact.numero}`);
      
      try {
        const hasImage = Boolean(contact.imagen);
        const endpoint = hasImage
          ? `${BACKEND_URL}/api/send-image/${instanceId}`
          : `${BACKEND_URL}/api/send-message/${instanceId}`;
        
        const payload = hasImage
          ? {
              number: contact.numero,
              file: contact.imagen,
              message: contact.mensaje,
            }
          : {
              number: contact.numero,
              message: contact.mensaje,
            };
        
        const response = await axios.post(endpoint, payload, {
          headers: {
            'Authorization': apiKey,
            'Content-Type': 'application/json',
          },
          timeout: 30000, // 30 segundos timeout
        });
        
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

    // ✅ Marcar como completado
    console.log(`[SPAM ${spamId}] ✅ Proceso completado`);
    completeSpam(spamId);
  } catch (error) {
    console.error(`[SPAM ${spamId}] ❌ Error fatal en el proceso:`, error);
    // Marcar como completado con errores
    completeSpam(spamId);
  }
}
