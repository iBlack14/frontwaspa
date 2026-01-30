import { createClient } from '@supabase/supabase-js'

// Cliente con service role (SOLO para server-side - API routes)
// NUNCA importes esto en componentes del cliente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.warn('[Supabase Admin] Warning: Missing Supabase credentials')
}

export const supabaseAdmin = supabaseUrl && supabaseKey ? createClient(
  supabaseUrl,
  supabaseKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
) : null
