import { NextResponse, type NextRequest } from 'next/server';
import { TOKEN_COOKIE_NAME, verifyToken, type JWTPayload } from '@/lib/auth';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname === '/login' || pathname === '/register';
  const isAdminPage = pathname === '/admin' || pathname.startsWith('/admin/');
  const isStaffPage = pathname === '/siswa' || pathname.startsWith('/siswa/');

  const token = request.cookies.get(TOKEN_COOKIE_NAME)?.value || null;
  const payload: JWTPayload | null = token ? verifyToken(token) : null;

  if (!isAuthPage && !payload) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPage && payload) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (isAdminPage && payload && payload.role !== 'admin') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (isStaffPage && payload && payload.role === 'siswa') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
};