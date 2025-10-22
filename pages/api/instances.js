// pages/api/instances.js
import { supabaseAdmin } from '@/lib/supabase-admin'
import axios from 'axios';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';

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
      
      // Verificar plan del usuario
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('status_plan')
        .eq('id', session.id)
        .single()

      if (!profile || profile.status_plan === false) {
        return res.status(400).json({ message: 'No tienes un plan activo' });
      }

      // Generar clientId único
      const clientId = `${session.id}-${Date.now()}`;

      // Llamar a N8N para crear la instancia
      const n8nWebhook = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || 'https://blxk-n8n.1mrj9n.easypanel.host/webhook/create-instance';
      
      const response = await axios.post(
        n8nWebhook,
        {
          clientId,
          userId: session.id,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      return res.status(200).json({ 
        success: true,
        message: 'Instancia creada exitosamente',
        clientId,
        data: response.data
      });



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
    res.status(500).json({ error: error.message });
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