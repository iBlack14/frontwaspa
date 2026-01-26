// pages/api/instances/webhook.js
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@/utils/supabase/api';
import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Inicializar cliente de Supabase para API
    const supabase = createClient(req, res);

    // Obtener el usuario autenticado directamente desde Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({ error: 'No autorizado - Inicia sesión con Supabase' });
    }

    const userId = user.id;

    const { documentId } = req.query;
    const { webhook_url } = req.body;

    console.log(`📝 Updating webhook for ${documentId}:`, webhook_url);

    // Actualizar en Supabase
    const { data: instance, error } = await supabaseAdmin
      .from('instances')
      .update({ webhook_url })
      .eq('document_id', documentId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating webhook:', error);
      return res.status(500).json({ error: error.message });
    }

    // Actualizar en el backend de WhatsApp (opcional)
    try {
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
      if (BACKEND_URL) {
        await axios.post(
          `${BACKEND_URL}/api/update-webhook/${documentId}`,
          { webhook_url },
          { timeout: 5000 }
        );
      }
    } catch (backendError) {
      console.warn('Backend webhook update failed (non-critical):', backendError.message);
    }

    console.log(`✅ Webhook updated successfully for ${documentId}`);

    return res.status(200).json({
      success: true,
      data: instance
    });
  } catch (error) {
    console.error('Error in webhook update:', error);
    return res.status(500).json({ error: error.message });
  }
}
