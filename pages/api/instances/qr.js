import axios from 'axios';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req, res) {
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { clientId } = req.body;

  if (!clientId) {
    return res.status(400).json({ error: 'clientId is required' });
  }

  try {
    // Obtener sesión del usuario
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.id) {
      return res.status(401).json({ error: 'No autorizado - Inicia sesión' });
    }

    // Verificar plan del usuario y obtener API key
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('status_plan, api_key')
      .eq('id', session.id)
      .single();

    if (!profile || profile.status_plan === false) {
      return res.status(400).json({ message: 'No tienes un plan activo' });
    }

    if (!profile.api_key) {
      return res.status(400).json({ 
        message: 'No tienes una API key generada. Por favor, contacta soporte.' 
      });
    }

    // Actualizar estado en Supabase antes de generar QR
    await supabaseAdmin
      .from('instances')
      .update({ 
        qr_loading: true,
        state: 'Initializing'
      })
      .eq('document_id', clientId)
      .eq('user_id', session.id);

    // ✅ Llamar al backend de WhatsApp con API key del usuario
    const response = await axios.post(
      `${BACKEND_URL}/api/generate-qr`,
      { clientId },
      {
        headers: {
          'Authorization': `Bearer ${profile.api_key}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return res.status(200).json(response.data);
  } catch (error) {
    console.error('Error generating QR:', error.response?.data || error.message);
    return res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Internal Server Error',
    });
  }
}