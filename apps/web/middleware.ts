import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const marketingPaths = ['/', '/pricing', '/contact'];
const publicPaths = [
  ...marketingPaths,
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
];
const authPaths = ['/login', '/register', '/forgot-password', '/reset-password'];

const protectedPrefixes = [
  '/dashboard',
  '/clients',
  '/companies',
  '/contacts',
  '/opportunities',
  '/tasks',
  '/activities',
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

  if (isProtected && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
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
