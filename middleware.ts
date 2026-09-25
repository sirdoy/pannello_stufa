import { NextResponse, type NextRequest } from 'next/server';
import {
  SESSION_COOKIE,
  isSessionAlive,
  needsAccessRefresh,
  sealSession,
  sessionCookieOptions,
  unsealSession,
} from '@/lib/auth/sessionCookie';
import { SessionApiError, refreshSession } from '@/lib/auth/backendSession';

/** Reachable without a session: the login page, its API, logout and the profile probe. */
const PUBLIC_PATHS = ['/auth/login', '/auth/logout', '/auth/profile', '/api/auth/session'];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function deny(req: NextRequest): NextResponse {
  let response: NextResponse;
  if (req.nextUrl.pathname.startsWith('/api/')) {
    response = NextResponse.json(
      { error: 'Unauthorized', message: 'Authentication required' },
      { status: 401 }
    );
  } else {
    const loginUrl = new URL('/auth/login', req.url);
    loginUrl.searchParams.set('returnTo', req.nextUrl.pathname + req.nextUrl.search);
    response = NextResponse.redirect(loginUrl);
  }
  if (req.cookies.has(SESSION_COOKIE)) response.cookies.delete(SESSION_COOKIE);
  return response;
}

export async function middleware(req: NextRequest) {
  // Block /debug pages in production
  if (process.env.NODE_ENV === 'production' && req.nextUrl.pathname.startsWith('/debug')) {
    return NextResponse.rewrite(new URL('/not-found', req.url));
  }

  // Bypass authentication in test mode (Playwright) and local dev bypass
  if (process.env.TEST_MODE === 'true' || process.env.BYPASS_AUTH === 'true') {
    return NextResponse.next();
  }

  if (isPublic(req.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const stored = await unsealSession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!stored || !isSessionAlive(stored)) {
    return deny(req);
  }

  if (!needsAccessRefresh(stored)) {
    return NextResponse.next();
  }

  // Access token about to expire: rotate it. This is also where a deactivated
  // user or a revoked session gets logged out (refresh answers 401).
  try {
    const refreshed = await refreshSession(stored.refreshToken);
    const sealed = await sealSession(refreshed);
    // Expose the new cookie to this request's handlers, then persist it in the browser.
    req.cookies.set(SESSION_COOKIE, sealed);
    const response = NextResponse.next({ request: { headers: req.headers } });
    response.cookies.set(SESSION_COOKIE, sealed, sessionCookieOptions(refreshed));
    return response;
  } catch (error) {
    if (error instanceof SessionApiError && error.kind === 'invalid_credentials') {
      return deny(req);
    }
    // Backend unreachable (Pi offline): keep the current session rather than
    // logging everyone out; the refresh is retried on the next request.
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    // Exclude: public API routes and static files
    "/((?!api/scheduler/check|api/stove|api/admin|offline|_next|favicon.ico|icons|manifest.json|sw.js|firebase-messaging-sw.js).*)",
  ],
};
