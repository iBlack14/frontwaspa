import { supabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@/utils/supabase/api';

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
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

    // Obtener perfil del usuario desde Supabase
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return res.status(500).json({ error: 'Error al obtener perfil' });
    }

    // Retornar datos del usuario y perfil
    return res.status(200).json({
      documentId: userId,
      email: user.email,
      username: profile?.username || user.user_metadata?.username || user.email?.split('@')[0] || 'Usuario',
      key: profile?.api_key || '',
      openai_api_key: profile?.openai_api_key || '',
      gemini_api_key: profile?.gemini_api_key || '',
      status_plan: profile?.status_plan || false,
      plan_type: profile?.plan_type || 'free',
    });
  } catch (error) {
    console.error('Error al obtener la info del usuario:', error.message);
    return res.status(500).json({
      error: 'Error interno al obtener usuario',
    });
  }
}
