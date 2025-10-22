import { supabase } from '@/lib/supabase'

export async function signIn({ email, password }: { email: string; password: string }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw new Error(error.message || 'Error al iniciar sesión')
  }

  // Fetch user profile to get username and other fields
  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', data.user?.id)
    .single()

  return {
    jwt: data.session?.access_token || '',
    user: {
      id: data.user?.id || '',
      email: data.user?.email || '',
      username: profile?.username || data.user?.email?.split('@')[0] || '',
    },
  }
}
  