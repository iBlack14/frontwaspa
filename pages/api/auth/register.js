// pages/api/auth/register.js
import { supabaseAdmin } from '@/lib/supabase-admin'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email, password, username } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y password son requeridos' })
  }

  try {
    // Crear usuario con supabaseAdmin (sin confirmación de email)
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirmar email
      user_metadata: {
        username: username || email.split('@')[0],
      },
    })

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    return res.status(200).json({
      success: true,
      message: 'Usuario creado exitosamente',
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    })
  } catch (error) {
    console.error('Error al registrar:', error)
    return res.status(500).json({ error: 'Error interno del servidor' })
  }
}
