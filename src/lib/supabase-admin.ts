import { createClient } from '@supabase/supabase-js'

// Cliente con service role (SOLO para server-side - API routes)
// NUNCA importes esto en componentes del cliente

// Validar variables de entorno necesarias
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl) {
  console.error('[Supabase] Error: NEXT_PUBLIC_SUPABASE_URL no está configurada')
}

if (!supabaseKey) {
  console.error('[Supabase] Error: SUPABASE_SERVICE_ROLE_KEY o SUPABASE_SERVICE_KEY no está configurada')
}

export const supabaseAdmin = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null
