import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/register', '/forgot-password', '/reset-password', '/api/logout', '/images', '/favicon.ico', '/_next', '/public'];
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const host = req.headers.get('host');

  // Redirecionamento Global Condicional — apenas em produção (ignora localhost)
  const isLocalhost = host?.includes('localhost') || host?.startsWith('127.0.0.1') || host?.startsWith('10.');
  if (!isLocalhost && host !== 'globalh.ddns.net:3200' && !pathname.startsWith('/_next') && !pathname.startsWith('/images') && !pathname.startsWith('/favicon.ico')) {
    return NextResponse.redirect('http://globalh.ddns.net:3200/login', 301);
  }

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const hasSession = req.cookies.get('pgb_session')?.value;
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/forgot-password') || pathname.startsWith('/reset-password');

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