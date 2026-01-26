import { supabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@/utils/supabase/api';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { username, key } = req.body;
  if (!username || !key) {
    return res.status(400).json({ error: 'Faltan datos necesarios' });
  }

  try {
    // Inicializar cliente de Supabase para API
    const supabase = createClient(req, res);

    // Obtener el usuario autenticado directamente desde Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({ error: 'No autorizado - Inicia sesión' });
    }

    const userId = user.id;

    // Actualizar metadata del usuario en auth
    const { error: adminAuthError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
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
      .eq('id', userId);

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
