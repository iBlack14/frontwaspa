import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Check if realtime should be enabled (disable if not available in Easypanel)
const isRealtimeEnabled = process.env.NEXT_PUBLIC_SUPABASE_REALTIME_ENABLED !== 'false'

// Singleton pattern to prevent multiple GoTrueClient instances
let supabaseInstance: ReturnType<typeof createClient> | null = null

// Cliente para el navegador (client-side) - Singleton
export const supabase = (() => {
  if (typeof window === 'undefined') {
    // Server-side: create a new instance each time (SSR safe)
    return createClient(supabaseUrl, supabaseAnonKey, {
      // @ts-ignore
      realtime: {
        // Force endpoint for server-side too (just in case)
        endpoint: 'wss://realtime.wasapi-supabase.ld4pxg.easypanel.host/realtime/v1',
        timeout: 20000
      },
      auth: {
        persistSession: false, // Disable persistence on server
        autoRefreshToken: false
      }
    })
  }

  // Client-side: use singleton to prevent multiple instances
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      // PROPER CONFIGURATION:
      // Directly configure the RealtimeClient to use the correct WSS endpoint.
      // @ts-ignore
      realtime: {
        endpoint: 'wss://realtime.wasapi-supabase.ld4pxg.easypanel.host/realtime/v1',
        timeout: 10000,
        headers: {
          apikey: supabaseAnonKey
        },
        heartbeatIntervalMs: 5000, // Keep connection alive
      },
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })

    // Log realtime status
    if (typeof window !== 'undefined') {
      console.log('🔌 Supabase Realtime: Custom Endpoint Configured (wss://realtime...)')
    }

    // Log status
    if (typeof window !== 'undefined') {
      console.log('🔌 Supabase Realtime: HYBRID MODE (Custom WS Endpoint + 1s Polling)')
    }
  }

  return supabaseInstance
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
