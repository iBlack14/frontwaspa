import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  const isAuth = !!token;
  const isLoginPage = request.nextUrl.pathname === '/login';
  const isRoot = request.nextUrl.pathname === '/';

  // Si está autenticado y va a raíz o login → redirige a /home
  if (isAuth && (isRoot || isLoginPage)) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  // Si NO está autenticado y va a raíz → permite ver landing page
  if (!isAuth && isRoot) {
    return NextResponse.next();
  }

  // Si NO está autenticado y va a login → permite ver login
  if (!isAuth && isLoginPage) {
    return NextResponse.next();
  }

  // Si NO está autenticado y va a cualquier otra ruta → redirige a raíz (landing)
  if (!isAuth) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/home/:path*',
    '/login',
    '/instances/:path*',
    '/templates/:path*',
    '/suite/:path*',
    '/profile/:path*',
  ],
};
