import NextAuth, { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { signIn } from '../../../src/services/auth';
import GoogleProvider from 'next-auth/providers/google';
import { createClient } from '@supabase/supabase-js';

// Cliente Supabase Admin (Solo lado servidor)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Sign in with Email',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials) return null;

        try {
          const { user, jwt } = await signIn({
            email: credentials.email,
            password: credentials.password,
          });

          return {
            id: user.id,
            jwt: jwt,
            username: user.username,
            email: user.email,
          };
        } catch (error) {
          return null;
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      clientSecret: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 72, // 72 horas
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google' && profile?.email) {
        try {
          // 1. Verificar si el usuario existe en Supabase Auth
          const { data: existingUser, error: fetchError } = await supabaseAdmin.auth.admin.listUsers();
          const supabaseUser = existingUser?.users.find(u => u.email === profile.email);

          let userId = supabaseUser?.id;

          // 2. Si no existe, crearlo
          if (!userId) {
            const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
              email: profile.email,
              email_confirm: true,
              user_metadata: {
                full_name: profile.name,
                avatar_url: (profile as any).picture,
              }
            });

            if (createError) throw createError;
            userId = newUser.user.id;
          }

          // 3. Verificar/Crear perfil en tabla 'profiles'
          if (userId) {
            const { data: existingProfile } = await supabaseAdmin
              .from('profiles')
              .select('*')
              .eq('id', userId)
              .single();

            if (!existingProfile) {
              // Generar username base
              const baseUsername = profile.email.split('@')[0];
              // Insertar perfil
              await supabaseAdmin.from('profiles').insert({
                id: userId,
                username: baseUsername, // Podría necesitar manejo de duplicados, pero por ahora base
                created_by_google: true,
                status_plan: true, // Plan gratuito por defecto
                plan_type: 'free'
              });
            }

            // Asignar el ID real de Supabase al objeto user de NextAuth para que pase al JWT
            user.id = userId;
          }

          return true;
        } catch (error) {
          console.error('Error syncing Google user with Supabase:', error);
          return false;
        }
      }
      return true;
    },

    async jwt({ token, user, account, profile }) {
      // Login inicial (Credentials o Google)
      if (user) {
        // Si viene de Google, user.id ya fue actualizado en signIn callback
        token.id = user.id;
        token.email = user.email;

        // Si es credentials tiene estos campos extra
        if (account?.provider === 'credentials') {
          token.jwt = (user as any).jwt;
          token.username = (user as any).username;
        } else if (account?.provider === 'google') {
          // Si es Google, intentar obtener username del perfil si no lo tenemos
          if (!token.username) {
            const { data: profileData } = await supabaseAdmin
              .from('profiles')
              .select('username')
              .eq('id', user.id)
              .single();
            if (profileData) token.username = profileData.username;
          }
        }
      }
      return token;
    },

    async redirect({ url, baseUrl }) {
      // Redirigir a home después del login
      if (url === baseUrl || url === `${baseUrl}/login`) {
        return `${baseUrl}/`;
      }
      // Si hay una URL de callback, redirigir ahí
      if (url.startsWith(baseUrl)) {
        return url;
      }
      return baseUrl;
    },

    async session({ session, token }) {
      if (token) {
        session.id = token.id as string;
        session.jwt = token.jwt as string; // Puede ser undefined en Google, pero no bloqueante
        session.email = token.email as string;
        session.username = token.username as string;
      }
      return session;
    },
  },
};

export default NextAuth(authOptions);
