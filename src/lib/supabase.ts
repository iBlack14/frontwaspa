import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Cliente para el navegador (client-side)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 0
    }
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
})

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
