import axios from 'axios';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

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

    const { name_service } = req.body;

    if (!name_service) {
      return res.status(400).json({ error: 'name_service is required' });
    }

    // Llamar al backend para obtener métricas
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    
    if (!backendUrl) {
      return res.status(500).json({ error: 'Backend URL not configured' });
    }

    // ✅ Obtener API key del usuario
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('api_key')
      .eq('id', session.id)
      .single();

    if (!profile || !profile.api_key) {
      return res.status(403).json({
        error: 'API Key requerida',
        message: 'Para ver métricas de Suite debes tener tu API Key generada en tu perfil.'
      });
    }

    const response = await axios.post(
      `${backendUrl}/api/suite/usage`,
      { name_service },
      {
        timeout: 10000,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${profile.api_key}`
        }
      }
    );

    return res.status(200).json(response.data);

  } catch (error) {
    console.error('Error fetching resource usage:', error.message);
    return res.status(500).json({
      error: error.response?.data?.error || error.message || 'Error al obtener métricas',
    });
  }
}
