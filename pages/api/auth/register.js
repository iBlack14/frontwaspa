// pages/api/auth/register.js
// VERSIÓN MEJORADA CON LOGS Y MANEJO DE ERRORES
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
    console.log('🔵 [Register] Iniciando registro para:', email);

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
      console.error('❌ [Register] Error de autenticación:', authError.message);
      return res.status(400).json({ 
        error: authError.message || 'Error al crear usuario' 
      })
    }

    if (!data.user) {
      console.error('❌ [Register] No se retornó datos del usuario');
      return res.status(500).json({ error: 'Error al crear usuario' })
    }

    console.log('✅ [Register] Usuario creado en auth:', data.user.id);

    // 2. Esperar a que el trigger cree el perfil
    console.log('⏳ [Register] Esperando creación de perfil...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 3. Verificar si se creó el perfil
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, username, api_key')
      .eq('id', data.user.id)
      .single();

    // 4. Si NO existe el perfil, crearlo manualmente
    if (profileError || !profile) {
      console.warn('⚠️  [Register] Perfil no encontrado, creando manualmente...');
      
      // Generar API key
      const apiKey = 'sk_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
      
      const { data: newProfile, error: insertError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: data.user.id,
          username: username || email.split('@')[0],
          api_key: apiKey,
          status_plan: true,           // ✅ Plan activo desde el inicio
          plan_type: 'free',           // ✅ Plan Free permanente
          plan_expires_at: null,       // ✅ Sin expiración
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ [Register] Error creando perfil:', insertError.message);
        
        // Limpiar usuario creado
        await supabaseAdmin.auth.admin.deleteUser(data.user.id);
        
        return res.status(500).json({ 
          error: 'Error al crear perfil de usuario',
          details: insertError.message 
        });
      }

      console.log('✅ [Register] Perfil creado manualmente');
      
      return res.status(200).json({
        success: true,
        message: 'Usuario creado exitosamente',
        user: {
          id: data.user.id,
          email: data.user.email,
          username: newProfile.username,
          api_key: newProfile.api_key,
        },
        plan: {
          type: 'free',
          status: 'active',
          expires_at: null,
          limits: {
            instances: 1,
            messages_per_day: 100,
            webhooks: 1,
          },
          message: '¡Bienvenido! Tu plan Free está activo con acceso ilimitado.',
        },
      });
    }

    // 5. Perfil creado correctamente por el trigger
    console.log('✅ [Register] Perfil encontrado:', profile.id);
    console.log('✅ [Register] Registro completado exitosamente');

    return res.status(200).json({
      success: true,
      message: 'Usuario creado exitosamente',
      user: {
        id: data.user.id,
        email: data.user.email,
        username: profile.username,
        api_key: profile.api_key,
      },
      plan: {
        type: 'free',
        status: 'active',
        expires_at: null,
        limits: {
          instances: 1,
          messages_per_day: 100,
          webhooks: 1,
        },
        message: '¡Bienvenido! Tu plan Free está activo con acceso ilimitado.',
      },
    })
  } catch (error) {
    console.error('❌ [Register] Error inesperado:', error)
    return res.status(500).json({ 
      error: 'Error interno del servidor',
      details: error.message 
    })
  }
}
