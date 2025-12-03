import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

export async function middleware(req) {
  // Bypass authentication in test mode (Playwright)
  if (process.env.TEST_MODE === 'true') {
    return NextResponse.next();
  }

  // Auth0 v4: middleware automatically mounts auth routes (/auth/login, /auth/callback, etc.)
  const authResponse = await auth0.middleware(req);

  // If auth0.middleware returns a response, it's handling an auth route
  if (authResponse) {
    return authResponse;
  }

  // For non-auth routes, check if user is authenticated
  const sessionCookie = req.cookies.get('appSession');

  // Allow access to homepage without authentication (after logout)
  if (!sessionCookie && req.nextUrl.pathname === '/') {
    return NextResponse.next();
  }

  if (!sessionCookie) {
    // Preserve the original URL to return after login
    // Note: v4 uses /auth/login instead of /api/auth/login
    const loginUrl = new URL('/auth/login', req.url);
    loginUrl.searchParams.set('returnTo', req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Exclude: public API routes, static files (but INCLUDE auth routes for auth0.middleware)
    "/((?!api/scheduler/check|api/stove|api/admin|offline|_next|favicon.ico|icons|manifest.json|sw.js|firebase-messaging-sw.js).*)",
  ],
};
