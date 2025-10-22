import NextAuth, { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { signIn } from '../../../src/services/auth';
import GoogleProvider from 'next-auth/providers/google';
import axios from 'axios'; // Asegúrate de importar axios

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
    async jwt({ token, user, account, profile }) {
      // Login con credenciales (email/password)
      if (user) {
        const userData = user as any;
        token.jwt = userData.jwt;
        token.id = userData.id;
        token.email = userData.email;
        token.username = userData.username;
      }

      // Login con Google
      if (account?.provider === 'google' && profile) {
        token.email = profile.email;
        token.name = profile.name;
        token.picture = (profile as any).picture;
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
        session.jwt = token.jwt as string;
        session.email = token.email as string;
        session.username = token.username as string;
      }
      return session;
    },
  },
};

export default NextAuth(authOptions);
