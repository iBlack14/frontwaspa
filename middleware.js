import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(request) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isAuth = !!user;
  const isLoginPage = request.nextUrl.pathname === '/login';
  const isRoot = request.nextUrl.pathname === '/';
  const isAuthCallback = request.nextUrl.pathname === '/auth/callback';

  // Allow auth callback to proceed without redirection
  if (isAuthCallback) {
    return response;
  }

  // Si está autenticado y va a raíz o login → redirige a /home
  if (isAuth && (isRoot || isLoginPage)) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  // Si NO está autenticado y va a raíz o login → permite ver landing o login
  if (!isAuth && (isRoot || isLoginPage)) {
    return response;
  }

  // Si NO está autenticado y va a cualquier otra ruta protegida → redirige a raíz (landing)
  if (!isAuth) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/',
    '/home/:path*',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/email-confirmation',
    '/instances/:path*',
    '/templates/:path*',
    '/suite/:path*',
    '/profile/:path*',
    '/chat/:path*',
    '/settings/:path*',
    '/messages/:path*',
  ],
};
