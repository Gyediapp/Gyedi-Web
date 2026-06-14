import { NextRequest, NextResponse } from 'next/server';

const PROTECTED = [
  '/dashboard',
  '/escrow',
  '/profile',
  '/my-store',
  '/history',
  '/wallet',
  '/sell',
  '/send',
  '/notifications',
  '/verify',
  '/my-listings',
  '/watermark',
];

const AUTH_ONLY = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('gyedi_token')?.value;

  const isProtected = PROTECTED.some(p => pathname === p || pathname.startsWith(p + '/'));
  const isAuthOnly  = AUTH_ONLY.some(p => pathname === p || pathname.startsWith(p + '/'));

  if (isProtected && !token) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (isAuthOnly && token) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/escrow/:path*',
    '/profile/:path*',
    '/my-store/:path*',
    '/history/:path*',
    '/wallet/:path*',
    '/sell/:path*',
    '/send/:path*',
    '/notifications/:path*',
    '/verify/:path*',
    '/my-listings/:path*',
    '/watermark/:path*',
    '/login',
    '/register',
  ],
};
