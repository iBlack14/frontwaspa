import { supabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@/utils/supabase/api';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
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

    if (req.method === 'GET') {
      // Obtener estado de suscripción
      const { data: profile, error } = await supabaseAdmin
        .from('profiles')
        .select('status_plan, plan_type, created_at')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching subscription:', error);
        return res.status(500).json({ error: 'Error al obtener suscripción' });
      }

      return res.status(200).json({
        status_plan: profile?.status_plan || false,
        plan_type: profile?.plan_type || 'free',
        created_at: profile?.created_at,
      });
    }

    if (req.method === 'POST') {
      // Actualizar estado de suscripción (solo para admin o webhook)
      const { status_plan, plan_type } = req.body;

      if (status_plan === undefined || !plan_type) {
        return res.status(400).json({ error: 'Faltan parámetros requeridos' });
      }

      const { data: updatedProfile, error } = await supabaseAdmin
        .from('profiles')
        .update({
          status_plan,
          plan_type,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating subscription:', error);
        return res.status(500).json({ error: 'Error al actualizar suscripción' });
      }

      return res.status(200).json({
        success: true,
        data: updatedProfile,
      });
    }
  } catch (error) {
    console.error('Error en subscription/status:', error.message);
    return res.status(500).json({
      error: 'Error interno del servidor',
    });
  }
}
