import { supabaseAdmin } from '@/lib/supabase-admin';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    // Obtener sesión del usuario
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.id) {
      return res.status(401).json({ error: 'No autorizado - Inicia sesión' });
    }

    // Obtener perfil del usuario desde Supabase
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', session.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return res.status(500).json({ error: 'Error al obtener perfil' });
    }

    // Obtener datos de autenticación del usuario
    const { data: { user }, error: authError } = await supabaseAdmin.auth.admin.getUserById(session.id);

    if (authError || !user) {
      console.error('Error fetching user:', authError);
      return res.status(500).json({ error: 'Error al obtener usuario' });
    }

    // Retornar datos del usuario y perfil
    return res.status(200).json({
      documentId: session.id,
      email: user.email || session.email,
      username: profile?.username || user.user_metadata?.username || user.email?.split('@')[0] || 'Usuario',
      key: profile?.api_key || '',
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
