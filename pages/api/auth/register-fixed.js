// pages/api/auth/register.js
// VERSIÓN MEJORADA CON MANEJO DE ERRORES
import { supabaseAdmin } from '@/lib/supabase-admin'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email, password, username } = req.body

  // Validaciones
  if (!email || !password) {
    return res.status(400).json({ error: 'Email y password son requeridos' })
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' })
  }

  try {
    console.log('[Register] Creating user:', email);

    // 1. Crear usuario con supabaseAdmin
    const { data, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirmar email
      user_metadata: {
        username: username || email.split('@')[0],
      },
    })

    if (authError) {
      console.error('[Register] Auth error:', authError);
      return res.status(400).json({ 
        error: authError.message || 'Error al crear usuario' 
      })
    }

    if (!data.user) {
      console.error('[Register] No user data returned');
      return res.status(500).json({ error: 'Error al crear usuario' })
    }

    console.log('[Register] User created:', data.user.id);

    // 2. Esperar un momento para que el trigger se ejecute
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 3. Verificar si se creó el perfil
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, username, api_key')
      .eq('id', data.user.id)
      .single();

    // 4. Si NO existe el perfil, crearlo manualmente
    if (profileError || !profile) {
      console.warn('[Register] Profile not found, creating manually...');
      
      // Generar API key
      const apiKey = 'sk_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
      
      const { data: newProfile, error: insertError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: data.user.id,
          username: username || email.split('@')[0],
          api_key: apiKey,
          status_plan: false,
          plan_type: 'free',
        })
        .select()
        .single();

      if (insertError) {
        console.error('[Register] Error creating profile:', insertError);
        
        // El usuario se creó pero el perfil no - limpiar
        await supabaseAdmin.auth.admin.deleteUser(data.user.id);
        
        return res.status(500).json({ 
          error: 'Error al crear perfil de usuario',
          details: insertError.message 
        });
      }

      console.log('[Register] Profile created manually:', newProfile.id);
      
      return res.status(200).json({
        success: true,
        message: 'Usuario creado exitosamente',
        user: {
          id: data.user.id,
          email: data.user.email,
          username: newProfile.username,
          api_key: newProfile.api_key,
        },
      });
    }

    // 5. Perfil creado correctamente por el trigger
    console.log('[Register] Profile exists:', profile.id);

    return res.status(200).json({
      success: true,
      message: 'Usuario creado exitosamente',
      user: {
        id: data.user.id,
        email: data.user.email,
        username: profile.username,
        api_key: profile.api_key,
      },
    })
  } catch (error) {
    console.error('[Register] Unexpected error:', error)
    return res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    })
  }
}
