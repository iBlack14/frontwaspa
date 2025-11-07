import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { validatePlan } from '../../../src/middleware/plan-validation.middleware';

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

    // ✅ VALIDAR PLAN - FREE solo puede usar chatbot con limitaciones
    const planValidation = await validatePlan(req, res, 'chatbot');
    if (!planValidation.allowed) {
      return res.status(planValidation.statusCode).json({
        error: planValidation.error,
        message: planValidation.message,
        currentPlan: planValidation.currentPlan,
        requiredPlan: planValidation.requiredPlan,
      });
    }

    console.log(`[CHATBOT] ✅ Plan validado: ${planValidation.planType.toUpperCase()}`);

    const { instanceId, chatbotName, welcomeMessage, defaultResponse, rules } = req.body;

    // Validaciones
    if (!instanceId) {
      return res.status(400).json({ error: 'instanceId es requerido' });
    }

    if (!chatbotName || !chatbotName.trim()) {
      return res.status(400).json({ error: 'El nombre del chatbot es requerido' });
    }

    if (!rules || rules.length === 0) {
      return res.status(400).json({ error: 'Debes agregar al menos una regla' });
    }

    // Verificar que la instancia pertenece al usuario
    const { data: instance, error: instanceError } = await supabaseAdmin
      .from('instances')
      .select('document_id, user_id')
      .eq('document_id', instanceId)
      .eq('user_id', session.id)
      .single();

    if (instanceError || !instance) {
      return res.status(404).json({ error: 'Instancia no encontrada o no autorizada' });
    }

    // Guardar configuración del chatbot en Supabase
    const chatbotConfig = {
      user_id: session.id,
      instance_id: instanceId,
      name: chatbotName.trim(),
      welcome_message: welcomeMessage?.trim() || null,
      default_response: defaultResponse?.trim() || 'Lo siento, no entendí tu mensaje.',
      rules: rules,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Verificar si ya existe un chatbot para esta instancia
    const { data: existingChatbot } = await supabaseAdmin
      .from('chatbots')
      .select('id')
      .eq('instance_id', instanceId)
      .single();

    let chatbotId;

    if (existingChatbot) {
      // Actualizar chatbot existente
      const { data: updatedChatbot, error: updateError } = await supabaseAdmin
        .from('chatbots')
        .update(chatbotConfig)
        .eq('id', existingChatbot.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error actualizando chatbot:', updateError);
        return res.status(500).json({ error: 'Error al actualizar chatbot' });
      }

      chatbotId = updatedChatbot.id;
    } else {
      // Crear nuevo chatbot
      const { data: newChatbot, error: insertError } = await supabaseAdmin
        .from('chatbots')
        .insert(chatbotConfig)
        .select()
        .single();

      if (insertError) {
        console.error('Error creando chatbot:', insertError);
        return res.status(500).json({ error: 'Error al crear chatbot' });
      }

      chatbotId = newChatbot.id;
    }

    console.log('✅ Chatbot configurado exitosamente:', {
      chatbotId,
      instanceId,
      name: chatbotName,
      rulesCount: rules.length,
    });

    return res.status(200).json({
      success: true,
      message: 'Chatbot configurado exitosamente',
      chatbot: {
        id: chatbotId,
        name: chatbotName,
        instanceId,
        rulesCount: rules.length,
      },
    });
  } catch (error) {
    console.error('❌ Error en chatbot endpoint:', error);
    return res.status(500).json({
      error: 'Error interno del servidor',
      details: error.message,
    });
  }
}
