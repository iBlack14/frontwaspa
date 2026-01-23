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
      realtime: isRealtimeEnabled ? {
        params: {
          eventsPerSecond: 2 // Allow some events per second
        }
      } : undefined, // Disable realtime if not enabled
      auth: {
        persistSession: false, // Disable persistence on server
        autoRefreshToken: false
      }
    })
  }

  // Client-side: use singleton to prevent multiple instances
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      realtime: isRealtimeEnabled ? {
        params: {
          eventsPerSecond: 2 // Allow realtime events
        },
        heartbeatIntervalMs: 30000,
        reconnectAfterMs: (tries: number) => Math.min(tries * 1000, 30000),
      } : undefined, // Disable realtime if not enabled
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })

    // Log realtime status
    if (typeof window !== 'undefined') {
      if (isRealtimeEnabled) {
        console.log('🔌 Supabase realtime ENABLED')
        if (process.env.NODE_ENV === 'development') {
          console.log('🔌 Realtime URL:', supabaseUrl)
          console.log('🔌 Realtime params: eventsPerSecond=2, heartbeat=30s')
        }
      } else {
        console.log('🔌 Supabase realtime DISABLED (not available in current setup)')
      }
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
