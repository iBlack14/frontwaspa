import { createBrowserClient, createServerClient, type CookieOptions } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Cliente universal que se adapta al entorno (ssr-safe)
export const supabase = (() => {
  if (typeof window === 'undefined') {
    // Entorno de Servidor: Intentamos obtener cookies si es posible, si no, cliente básico
    // Nota: Para rutas de API o Server Components es mejor usar el helper de src/utils/supabase/server.ts
    // Pero este fallback mantiene compatibilidad con el código actual.
    return createBrowserClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        // @ts-ignore
        endpoint: 'wss://realtime.wasapi-supabase.ld4pxg.easypanel.host/realtime/v1',
        timeout: 20000
      }
    })
  }

  // Entorno de Navegador
  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    realtime: {
      // @ts-ignore
      endpoint: 'wss://realtime.wasapi-supabase.ld4pxg.easypanel.host/realtime/v1',
      timeout: 10000,
      headers: {
        apikey: supabaseAnonKey
      },
      heartbeatIntervalMs: 5000,
    }
  })
})()

// Tipos TypeScript para las tablas
export type Instance = {
  id: string
  document_id: string
  user_id: string
  webhook_url?: string
  state: 'Initializing' | 'Connected' | 'Disconnected' | 'Failure'
  is_active: boolean
  message_received: boolean
  message_sent: boolean
  qr?: string
  qr_loading: boolean
  historycal_data?: any
  profile_name?: string
  profile_pic_url?: string
  phone_number?: string
  created_at: string
  updated_at: string
}

export type Profile = {
  id: string
  status_plan: boolean
  plan_type: 'free' | 'trial' | 'basic' | 'premium'
  plan_expires_at?: string
  created_by_google: boolean
  created_at: string
  updated_at: string
}

export type Product = {
  id: string
  name: string
  fields?: any
  img?: string[]
  price?: number
  description?: string
  created_at: string
  updated_at: string
}
