import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import formidable from 'formidable';
import XLSX from 'xlsx';
import fs from 'fs';
import axios from 'axios';
import { createSpam, shouldContinue, updateProgress, completeSpam, stopSpam } from '@/lib/spam-control';

export const config = {
  api: {
    bodyParser: false,
  },
};

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
    const message = Array.isArray(fields.message) ? fields.message[0] : fields.message;
    const imageUrl = Array.isArray(fields.imageUrl) ? fields.imageUrl[0] : fields.imageUrl;
    const waitTime = Array.isArray(fields.waitTime) ? parseInt(fields.waitTime[0]) : 3;
    const excelFile = files.file;
    const imageFile = files.imageFile; // Nueva imagen subida

    if (!instanceId || !excelFile) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
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

    // Leer archivo Excel
    const filePath = Array.isArray(excelFile) ? excelFile[0].filepath : excelFile.filepath;
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    // Validar que tenga la columna 'numero'
    if (data.length === 0 || !data[0].hasOwnProperty('numero')) {
      return res.status(400).json({ 
        error: 'El Excel debe tener una columna llamada "numero"' 
      });
    }

    // Preparar datos para N8N
    const contacts = data.map(row => ({
      clientId: instanceId,
      apiKey: profile.api_key,
      numero: row.numero.toString(),
      mensaje: row.mensaje || message || '',
      imagen: row.imagen || finalImageUrl || '', // Usar imagen subida o URL
    }));

    // ✅ Crear control de envío con ID único
    const spamId = `spam_${session.id}_${Date.now()}`;
    createSpam(spamId, contacts.length, session.id);

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

    // ✅ Limpiar archivo subido
    fs.unlinkSync(filePath);

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
  try {
    // Enviar directamente desde el backend
    for (let i = 0; i < contacts.length; i++) {
      // ✅ Verificar si el envío fue detenido
      if (!shouldContinue(spamId)) {
        break;
      }

      const contact = contacts[i];
      
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
        });
        
        // ✅ Actualizar progreso exitoso
        updateProgress(spamId, i + 1, { success: true, number: contact.numero });
        
        // ✅✅ Esperar entre mensajes, verificando shouldContinue cada 500ms
        if (i < contacts.length - 1) {
          const totalWaitTime = waitTime * 1000;
          const checkInterval = 500; // Verificar cada 500ms
          let elapsed = 0;
          
          while (elapsed < totalWaitTime) {
            // Verificar si fue detenido durante la espera
            if (!shouldContinue(spamId)) {
              return; // Salir completamente de la función
            }
            
            await new Promise(resolve => setTimeout(resolve, Math.min(checkInterval, totalWaitTime - elapsed)));
            elapsed += checkInterval;
          }
        }
      } catch (sendError) {
        // ✅ Actualizar progreso con error
        updateProgress(spamId, i + 1, { 
          success: false, 
          number: contact.numero, 
          error: sendError.message 
        });
        // Continuar con el siguiente
      }
    }

    // ✅ Marcar como completado
    completeSpam(spamId);
  } catch (error) {
    // Marcar como completado con errores
    completeSpam(spamId);
  }
}
