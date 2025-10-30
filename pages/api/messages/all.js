import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from 'next-auth/next';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verificar autenticación
    const session = await getServerSession(req, res);
    if (!session) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const userId = session.user.id;
    const { instanceId, limit = 100, offset = 0 } = req.query;

    // Obtener todas las instancias del usuario
    const { data: instances, error: instancesError } = await supabaseAdmin
      .from('instances')
      .select('document_id, name, phone_number')
      .eq('user_id', userId);

    if (instancesError) {
      console.error('Error al obtener instancias:', instancesError);
      return res.status(500).json({ error: 'Error al obtener instancias' });
    }

    if (!instances || instances.length === 0) {
      return res.status(200).json({ success: true, messages: [] });
    }

    const instanceIds = instances.map(i => i.document_id);

    // Query para obtener mensajes
    let query = supabaseAdmin
      .from('messages')
      .select('*')
      .in('instance_id', instanceIds)
      .eq('from_me', false) // Solo mensajes recibidos
      .order('timestamp', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    // Filtrar por instancia específica si se proporciona
    if (instanceId && instanceId !== 'all') {
      query = query.eq('instance_id', instanceId);
    }

    const { data: messages, error: messagesError } = await query;

    if (messagesError) {
      console.error('Error al obtener mensajes:', messagesError);
      return res.status(500).json({ error: 'Error al obtener mensajes' });
    }

    // Formatear mensajes para el frontend
    const formattedMessages = (messages || []).map(msg => ({
      id: msg.id,
      instanceId: msg.instance_id,
      chatId: msg.chat_id,
      sender: msg.sender_name || msg.chat_id?.split('@')[0] || 'Desconocido',
      text: msg.message_text || msg.message_caption || '[Mensaje multimedia]',
      timestamp: msg.timestamp,
      type: msg.message_type || 'text',
      mediaUrl: msg.media_url,
      fromMe: msg.from_me,
    }));

    return res.status(200).json({
      success: true,
      messages: formattedMessages,
      total: formattedMessages.length,
    });

  } catch (error) {
    console.error('Error en /api/messages/all:', error);
    return res.status(500).json({ error: error.message });
  }
}
