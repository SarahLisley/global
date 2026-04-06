import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtDecode } from 'jwt-decode';

const PUBLIC_PATHS = ['/login', '/register', '/verify-register', '/forgot-password', '/reset-password', '/api/logout', '/images', '/favicon.ico', '/_next', '/public'];
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const host = req.headers.get('host');

  // Redirecionamento Global Condicional — força domínio (mantendo localhost intacto)
  const isLocalhost = host?.includes('localhost') || host?.startsWith('127.0.0.1') || host?.startsWith('10.');
  if (!isLocalhost && host !== 'globalh.ddns.net:3200' && !pathname.startsWith('/_next') && !pathname.startsWith('/images') && !pathname.startsWith('/favicon.ico')) {
    const protocol = req.nextUrl.protocol || 'http:';
    return NextResponse.redirect(`${protocol}//globalh.ddns.net:3200/login`, 301);
  }

  // Limpeza automática de sessão solicitada via URL
  if (req.nextUrl.searchParams.get('clean_session') === '1') {
    const response = NextResponse.next();
    response.cookies.delete('pgb_session');
    // Removemos o parâmetro da URL para não ficar limpando sempre
    const url = req.nextUrl.clone();
    url.searchParams.delete('clean_session');
    return NextResponse.redirect(url);
  }

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const sessionCookie = req.cookies.get('pgb_session');
  const hasSession = sessionCookie?.value;
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/forgot-password') || pathname.startsWith('/reset-password');

  // Validar token JWT se existir
  let isTokenValid = true;
  if (hasSession) {
    try {
      jwtDecode(hasSession);
    } catch (jwtError) {
      console.warn('Invalid JWT token in middleware, clearing cookie');
      isTokenValid = false;
      const url = req.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('from', pathname);
      url.searchParams.set('clean_session', '1');
      url.searchParams.set('reason', 'invalid_token');
      const response = NextResponse.redirect(url);
      response.cookies.delete('pgb_session');
      return response;
    }
  }

  if (!hasSession || !isTokenValid) {
    if (pathname.startsWith('/dashboard')) {
      const url = req.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('from', pathname);
      return NextResponse.redirect(url);
    }
  }

  if (hasSession && isAuthPage) {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  const response = NextResponse.next();

  // Sliding expiration: renew cookie if user is active on protected routes
  if (hasSession && !isAuthPage && !PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    const isHttps = req.nextUrl.protocol === 'https:';
    response.cookies.set('pgb_session', hasSession, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isHttps, // Automatizado: apenas secure se for HTTPS
      path: '/',
      maxAge: 60 * 60 * 2, // 2 hours
    });
  }

  return response;
}
export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|images).*)'] };