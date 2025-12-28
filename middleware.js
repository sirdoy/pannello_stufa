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

  // For non-auth routes, validate session with Auth0
  // CRITICAL: getSession() validates token signature, expiration, and claims
  const session = await auth0.getSession(req);

  if (!session) {
    // No valid session - redirect to login with returnTo parameter
    const loginUrl = new URL('/auth/login', req.url);
    loginUrl.searchParams.set('returnTo', req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  // Valid session exists - allow request to proceed
  // Note: Defense-in-depth - Server Components also validate with getSession()
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Exclude: public API routes, static files (but INCLUDE auth routes for auth0.middleware)
    "/((?!api/scheduler/check|api/stove|api/admin|offline|_next|favicon.ico|icons|manifest.json|sw.js|firebase-messaging-sw.js).*)",
  ],
};
