// pages/api/instances.js
import { supabaseAdmin } from '@/lib/supabase-admin'
import axios from 'axios';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import { createWhatsAppSession } from '@/lib/backend-api';

export default async function handler(req, res) {
  const { method, headers, body, query } = req;
  const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL; // Server-side env variable
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL; // Server-side env variable

  const token_read = process.env.NEXT_PUBLIC_BACKEND_READ_TOKEN; // Server-side env variable
  const token_update = process.env.NEXT_PUBLIC_BACKEND_UPDATE_INSTANCE_TOKEN; // Server-side env variable

  // Obtener sesión del usuario
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.id) {
    return res.status(401).json({ 
      error: 'No autorizado - Inicia sesión',
      sessionExists: !!session,
      hasId: !!session?.id
    })
  }

  try {
    if (method === 'GET') {
      // Obtener instancias del usuario
      const { data: instances, error } = await supabaseAdmin
        .from('instances')
        .select('*')
        .eq('user_id', session.id)
        .order('created_at', { ascending: false })

      if (error) {
        return res.status(500).json({ error: error.message })
      }

      return res.status(200).json({ instances });



    } else if (method === 'POST') {
      // Create new instance
      
      // Verificar plan del usuario y obtener API key
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('status_plan, api_key')
        .eq('id', session.id)
        .single()

      if (!profile || profile.status_plan === false) {
        return res.status(400).json({ message: 'No tienes un plan activo' });
      }

      if (!profile.api_key) {
        return res.status(400).json({ 
          message: 'No tienes una API key generada. Por favor, contacta soporte.' 
        });
      }

      // Generar clientId único
      const clientId = `${session.id}-${Date.now()}`;

      // ✅ Llamar DIRECTAMENTE al backend con API key del usuario
      try {
        console.log('[INSTANCES] 🚀 Creando sesión de WhatsApp...');
        console.log('[INSTANCES] 📋 ClientId:', clientId);
        console.log('[INSTANCES] 👤 UserId:', session.id);
        console.log('[INSTANCES] 🔑 API Key:', profile.api_key ? 'Existe ✅' : 'No existe ❌');
        
        const response = await createWhatsAppSession(session.id, clientId);
        
        console.log('[INSTANCES] ✅ Respuesta del backend:', response);

        // Guardar instancia en Supabase
        const { error: insertError } = await supabaseAdmin
          .from('instances')
          .insert({
            document_id: clientId,
            user_id: session.id,
            state: 'Initializing',
            created_at: new Date().toISOString(),
          });

        if (insertError) {
          console.error('[INSTANCES] ❌ Error guardando en Supabase:', insertError);
        } else {
          console.log('[INSTANCES] ✅ Instancia guardada en Supabase');
        }

        return res.status(200).json({ 
          success: true,
          message: 'Instancia creada exitosamente',
          clientId,
          data: response
        });
      } catch (backendError) {
        console.error('[INSTANCES] ❌ Error llamando al backend:', backendError);
        console.error('[INSTANCES] 📋 Detalles del error:', {
          message: backendError.message,
          response: backendError.response?.data,
          status: backendError.response?.status,
        });
        
        return res.status(500).json({ 
          error: 'Error al crear la sesión de WhatsApp',
          details: backendError.response?.data || backendError.message
        });
      }



    } else if (method === 'PUT') {
      // Update webhook or instance
      // Obtener sesión del usuario
      const session = await getServerSession(req, res, authOptions);

      if (!session || !session.id) {
        return res.status(401).json({ error: 'No autorizado - Inicia sesión' })
      }

      // Verificar plan
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('status_plan')
        .eq('id', session.id)
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
        .eq('user_id', session.id)
        .select()
        .single()

      if (error) {
        return res.status(500).json({ error: error.message })
      }


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