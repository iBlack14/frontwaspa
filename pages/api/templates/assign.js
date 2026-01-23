import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { supabaseAdmin } from '../../../src/lib/supabase-admin';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    // Obtener sesión del usuario
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.id) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const { instanceId, templateType } = req.body;

    // Validaciones
    if (!instanceId) {
      return res.status(400).json({ error: 'instanceId es requerido' });
    }

    if (!templateType) {
      return res.status(400).json({ error: 'templateType es requerido' });
    }

    const validTemplates = ['none', 'spam', 'chatbot'];
    if (!validTemplates.includes(templateType)) {
      return res.status(400).json({ error: 'Template inválido' });
    }

    // Verificar que la instancia pertenece al usuario
    const { data: instance, error: instanceError } = await supabaseAdmin
      .from('instances')
      .select('document_id, user_id, active_template')
      .eq('document_id', instanceId)
      .eq('user_id', session.id)
      .single();

    if (instanceError || !instance) {
      return res.status(404).json({ error: 'Instancia no encontrada o no autorizada' });
    }

    // Si está cambiando de template, desactivar el anterior
    if (instance.active_template && instance.active_template !== 'none' && instance.active_template !== templateType) {
      // Desactivar chatbot si existe
      if (instance.active_template === 'chatbot') {
        await supabaseAdmin
          .from('chatbots')
          .update({ is_active: false })
          .eq('instance_id', instanceId);
      }
      
      // Aquí puedes agregar lógica para desactivar otros templates
    }

    // Actualizar el template activo en la instancia
    const { error: updateError } = await supabaseAdmin
      .from('instances')
      .update({
        active_template: templateType,
        template_updated_at: new Date().toISOString(),
      })
      .eq('document_id', instanceId);

    if (updateError) {
      console.error('Error actualizando template:', updateError);
      return res.status(500).json({ error: 'Error al asignar template' });
    }

    // Si el nuevo template es chatbot, activarlo
    if (templateType === 'chatbot') {
      const { data: chatbot } = await supabaseAdmin
        .from('chatbots')
        .select('id')
        .eq('instance_id', instanceId)
        .single();

      if (chatbot) {
        await supabaseAdmin
          .from('chatbots')
          .update({ is_active: true })
          .eq('id', chatbot.id);
      }
    }

    console.log('✅ Template asignado exitosamente:', {
      instanceId,
      templateType,
      previousTemplate: instance.active_template,
    });

    return res.status(200).json({
      success: true,
      message: 'Template asignado exitosamente',
      templateType,
    });
  } catch (error) {
    console.error('❌ Error en assign endpoint:', error);
    return res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message,
    });
  }
}
