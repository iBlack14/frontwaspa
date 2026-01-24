import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { username, key } = req.body;
  if (!username || !key) {
    return res.status(400).json({ error: 'Faltan datos necesarios' });
  }

  try {
    // Obtener sesión del usuario
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.id) {
      return res.status(401).json({ error: 'No autorizado - Inicia sesión' });
    }

    // Actualizar metadata del usuario en auth
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      session.id,
      {
        user_metadata: { username }
      }
    );

    if (authError) {
      console.error('Error updating auth metadata:', authError);
      return res.status(500).json({ error: 'Error al actualizar usuario' });
    }

    // Actualizar perfil en la tabla profiles
    const updateData = { api_key: key };
    if (req.body.openai_api_key) updateData.openai_api_key = req.body.openai_api_key;
    if (req.body.gemini_api_key) updateData.gemini_api_key = req.body.gemini_api_key;

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', session.id);

    if (profileError) {
      console.error('Error updating profile:', profileError);
      return res.status(500).json({ error: 'Error al actualizar perfil' });
    }

    return res.status(200).json({
      success: true,
      message: 'Usuario actualizado correctamente'
    });
  } catch (error) {
    console.error('Error al actualizar la info del usuario:', error.message);
    return res.status(500).json({
      error: 'Error interno al actualizar usuario',
    });
  }
}
