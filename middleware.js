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

  const path = request.nextUrl.pathname;

  // 1. IGNORAR ARCHIVOS ESTÁTICOS Y DE NEXT.JS
  // Esto previene que el middleware bloquee la carga de la app en Builder/V0
  if (
    path.startsWith('/_next') ||
    path.startsWith('/static') ||
    path.startsWith('/api') ||
    path.includes('.') // Archivos con extensión (ej: favicon.ico, logo.png)
  ) {
    return response;
  }

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error) {
    console.log('Middleware Auth Error:', error);
  }

  const isAuth = !!user;

  const publicRoutes = [
    '/',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/email-confirmation',
    '/auth/callback'
  ];

  const isPublicRoute = publicRoutes.includes(path);

  // Allow auth callback to proceed without redirection
  if (path === '/auth/callback') {
    return response;
  }

  // Si está autenticado y va a raíz o login → redirige a /home
  if (isAuth && (path === '/' || path === '/login')) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  // Si NO está autenticado y la ruta NO es pública → redirige a raíz (landing)
  if (!isAuth && !isPublicRoute) {
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
