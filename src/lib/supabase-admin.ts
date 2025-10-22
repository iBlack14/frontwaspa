import { createClient } from '@supabase/supabase-js'

// Cliente con service role (SOLO para server-side - API routes)
// NUNCA importes esto en componentes del cliente
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
