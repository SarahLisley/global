import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/register', '/api/logout', '/images', '/favicon.ico', '/_next', '/public'];
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const hasSession = req.cookies.get('pgb_session')?.value;
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');

  if (!hasSession && pathname.startsWith('/dashboard')) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  if (hasSession && isAuthPage) {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  const response = NextResponse.next();

  // Sliding expiration: renew cookie if user is active on protected routes
  if (hasSession && !isAuthPage && !PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    response.cookies.set('pgb_session', hasSession, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 2, // 2 hours
    });
  }

  return response;
}
export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|images).*)'] };