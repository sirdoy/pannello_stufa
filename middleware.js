import { NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0/edge';

export async function middleware(req) {
  const res = NextResponse.next();
  const session = await getSession(req, res);

  if (!session || !session.user) {
    // Preserve the original URL to return after login
    const loginUrl = new URL('/api/auth/login', req.url);
    loginUrl.searchParams.set('returnTo', req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!api/auth|api/scheduler/check|api/stove|api/admin|offline|_next|favicon.ico|icons|manifest.json|sw.js|firebase-messaging-sw.js).*)",
  ],
};
