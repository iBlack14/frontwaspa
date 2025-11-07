import axios from 'axios';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';

export default async function handler(req, res) {
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { documentId } = req.query;

  try {
    // Obtener sesión del usuario
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.id) {
      return res.status(401).json({ error: 'No autorizado - Inicia sesión' });
    }

    // Obtener API key del usuario (opcional para desconectar)
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('api_key')
      .eq('id', session.id)
      .single();

    // ℹ️ Si no tiene API key, usar una master key del backend
    const apiKeyToUse = profile?.api_key || process.env.MASTER_API_KEY || 'internal-system-key';

    // ✅ Llamar al backend
    const response = await axios.post(
      `${BACKEND_URL}/api/disconnect-session/${documentId}`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${apiKeyToUse}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    return res.status(200).json(response.data);
  } catch (error) {
    console.error('Error disconnecting:', error.response?.data || error.message);
    return res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Internal Server Error',
    });
  }
}