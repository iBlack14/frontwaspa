// pages/api/instances.js
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createClient } from '@/utils/supabase/api';
import axios from 'axios';
import { createWhatsAppSession } from '@/lib/backend-api';

export default async function handler(req, res) {
  const { method, headers, body, query } = req;

  // Inicializar cliente de Supabase para API
  const supabase = createClient(req, res);

  // Obtener el usuario autenticado directamente desde Supabase
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return res.status(401).json({
      error: 'No autorizado - Inicia sesión con Supabase',
    })
  }

  const userId = user.id;

  try {
    if (method === 'GET') {
      // Obtener instancias del usuario
      const { data: instances, error } = await supabaseAdmin
        .from('instances')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        return res.status(500).json({ error: error.message })
      }

      return res.status(200).json({ instances });

    } else if (method === 'POST') {
      // Verificar plan del usuario
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('status_plan, api_key')
        .eq('id', userId)
        .single()

      if (!profile || profile.status_plan === false) {
        return res.status(400).json({ message: 'No tienes un plan activo' });
      }

      // Generar clientId único
      const clientId = `${userId}-${Date.now()}`;

      // Llamar al backend
      try {
        console.log('[INSTANCES] 🚀 Creando sesión de WhatsApp...');
        const response = await createWhatsAppSession(userId, clientId);

        // Guardar instancia en Supabase
        const { error: insertError } = await supabaseAdmin
          .from('instances')
          .insert({
            document_id: clientId,
            user_id: userId,
            state: 'Initializing',
            created_at: new Date().toISOString(),
          });

        if (insertError) console.error('[INSTANCES] ❌ Error guardando en Supabase:', insertError);

        return res.status(200).json({
          success: true,
          message: 'Instancia creada exitosamente',
          clientId,
          data: response
        });
      } catch (backendError) {
        return res.status(500).json({
          error: 'Error al crear la sesión de WhatsApp',
          details: backendError.response?.data || backendError.message
        });
      }

    } else if (method === 'PUT') {
      // Verificar plan
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('status_plan')
        .eq('id', userId)
        .single()

      if (!profile || profile.status_plan === false) {
        return res.status(400).json({ message: 'No tienes un plan activo' });
      }

      const { documentId } = query;

      // Actualizar instancia en Supabase
      const { data: instance, error } = await supabaseAdmin
        .from('instances')
        .update(body.data)
        .eq('document_id', documentId)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) return res.status(500).json({ error: error.message })


      // Extraer webhook_url correctamente del body
      const webhookUrl = body.data?.webhook_url;

      if (webhookUrl === undefined) {
        return res.status(200).json({ data: instance });
      } else {
        const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

        await axios.post(
          `${BACKEND_URL}/api/update-weebhook/${documentId}`,
          { webhook_url: webhookUrl },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        return res.status(200).json({ data: instance });
      }


    }
    // Add other methods (DELETE, etc.) as needed
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    return res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || error.response?.data?.error || error.message || 'Internal Server Error',
      details: error.response?.data
    });
  }
}

// const deleteInstance = async (documentId: string) => {
//   if (!confirm('¿Estás seguro de que quieres eliminar esta instancia?')) return;

//   try {
//     await axios.delete(`${process.env.NEXT_PUBLIC_STRAPI_URL}/api/instances/${documentId}`, {
//       headers: { Authorization: `Bearer ${typedSession?.jwt}` },
//     });

//     await axios.post(
//       `${process.env.BACKEND_URL}/api/delete-session/${documentId}`,
//       {},
//       {
//         headers: { 'Content-Type': 'application/json' },
//       }
//     );
//   } catch (error: any) {
//     console.error('Error al eliminar la instancia:', error.response?.data || error.message);
//   }
// };