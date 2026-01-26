import { supabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@/utils/supabase/api';

export default async function handler(req, res) {
  console.log('[ASSIGN] 🚀 Iniciando asignación de template...');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Inicializar cliente de Supabase para API
    const supabase = createClient(req, res);

    // Obtener el usuario autenticado directamente desde Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[ASSIGN] ❌ No autorizado');
      return res.status(401).json({ error: 'No autorizado' });
    }

    const userId = user.id;
    console.log('[ASSIGN] ✅ Sesión válida para usuario:', userId);

    // 2. Parsear Body
    const { instanceId, templateType } = req.body;
    console.log('[ASSIGN] 📋 Datos recibidos:', { instanceId, templateType });

    if (!instanceId || !templateType) {
      console.error('[ASSIGN] ❌ Faltan datos requeridos');
      return res.status(400).json({ error: 'instanceId y templateType son requeridos' });
    }

    const validTemplates = ['none', 'spam', 'chatbot', 'calentamiento'];
    if (!validTemplates.includes(templateType)) {
      console.error('[ASSIGN] ❌ Template inválido:', templateType);
      return res.status(400).json({ error: 'Template inválido' });
    }

    // 3. Verificar Instancia
    console.log('[ASSIGN] 🔍 Buscando instancia:', instanceId);
    const { data: instance, error: instanceError } = await supabaseAdmin
      .from('instances')
      .select('document_id, user_id, active_template')
      .eq('document_id', instanceId)
      .eq('user_id', userId)
      .single();

    if (instanceError) {
      console.error('[ASSIGN] ❌ Error buscando instancia:', instanceError);
      return res.status(404).json({ error: 'Error al buscar instancia', details: instanceError.message });
    }

    if (!instance) {
      console.error('[ASSIGN] ❌ Instancia no encontrada');
      return res.status(404).json({ error: 'Instancia no encontrada o no autorizada' });
    }
    console.log('[ASSIGN] ✅ Instancia encontrada. Template actual:', instance.active_template);

    // 4. Desactivar anterior si era chatbot
    if (instance.active_template === 'chatbot' && templateType !== 'chatbot') {
      console.log('[ASSIGN] 🤖 Desactivando chatbot anterior...');
      const { error: deactivateError } = await supabaseAdmin
        .from('instance_chatbots')
        .update({ is_active: false })
        .eq('instance_id', instanceId);

      if (deactivateError) {
        console.warn('[ASSIGN] ⚠️ Error desactivando chatbot (no crítico):', deactivateError.message);
      } else {
        console.log('[ASSIGN] ✅ Chatbot anterior desactivado');
      }
    }

    // 5. Actualizar Template Principal
    console.log('[ASSIGN] 🔄 Actualizando active_template a:', templateType);
    const updatePayload = {
      active_template: templateType,
    };

    const { error: updateError } = await supabaseAdmin
      .from('instances')
      .update(updatePayload)
      .eq('document_id', instanceId);

    if (updateError) {
      console.error('[ASSIGN] ❌ Error en update active_template:', updateError);
      return res.status(500).json({
        error: 'Error de base de datos al asignar template',
        details: updateError.message,
        code: updateError.code
      });
    }
    console.log('[ASSIGN] ✅ Tabla instances actualizada');

    // 6. Activar chatbot si el nuevo es chatbot
    if (templateType === 'chatbot') {
      console.log('[ASSIGN] 🤖 Activando logic para nuevo chatbot...');
      const { data: chatbot, error: fetchChatbotError } = await supabaseAdmin
        .from('instance_chatbots')
        .select('id')
        .eq('instance_id', instanceId)
        .maybeSingle();

      if (fetchChatbotError) {
        console.error('[ASSIGN] ❌ Error buscando chatbot para activar:', fetchChatbotError);
      } else if (chatbot) {
        const { error: activateError } = await supabaseAdmin
          .from('instance_chatbots')
          .update({ is_active: true })
          .eq('instance_id', instanceId); // Use instance_id for safety instead of id if it's simpler

        if (activateError) {
          console.error('[ASSIGN] ❌ Error activando chatbot:', activateError);
        } else {
          console.log('[ASSIGN] ✅ Chatbot activado correctamente');
        }
      } else {
        console.log('[ASSIGN] ℹ️ No hay configuración de chatbot previa para esta instancia');
      }
    }

    console.log('✅ [ASSIGN] Proceso finalizado con éxito');

    return res.status(200).json({
      success: true,
      message: 'Template asignado exitosamente',
      templateType,
    });

  } catch (error) {
    console.error('❌ [ASSIGN] ERROR FATAL:', error);
    return res.status(500).json({
      error: 'Error interno del servidor (Crash)',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
