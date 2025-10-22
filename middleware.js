import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  const isAuth = !!token;
  const isLoginPage = request.nextUrl.pathname === '/login';
  const isRoot = request.nextUrl.pathname === '/';

  if (isAuth && (isRoot || isLoginPage)) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  if (!isAuth && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url));
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
