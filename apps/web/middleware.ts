import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const marketingPaths = ['/', '/pricing', '/contact'];
const publicPaths = [
  ...marketingPaths,
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/github/callback',
];
const authPaths = ['/login', '/register', '/forgot-password', '/reset-password'];

function isAccessTokenExpired(token: string) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1] ?? '')) as { exp?: number };
    if (!payload.exp) return true;
    return payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

const protectedPrefixes = [
  '/dashboard',
  '/clients',
  '/companies',
  '/contacts',
  '/opportunities',
  '/tasks',
  '/activities',
  '/reminders',
  '/settings',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('vibe-access-token')?.value;

  const isPublic = publicPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const isAuthPage = authPaths.some((p) => pathname === p);
  const isProtected = protectedPrefixes.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  const isMarketing = marketingPaths.some((p) => pathname === p);

  if (isMarketing && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (isProtected && (!token || isAccessTokenExpired(token))) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    const response = NextResponse.redirect(loginUrl);
    if (token && isAccessTokenExpired(token)) {
      response.cookies.set('vibe-access-token', '', { path: '/', maxAge: 0 });
    }
    return response;
  }

  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (!isPublic && !isProtected) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
