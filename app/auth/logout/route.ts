/**
 * GET /auth/logout — end the first-party session (roadmap Fase 8).
 *
 * Revokes the refresh token on the backend (best effort), clears the session
 * cookie and sends the browser to the login page. Linked from Altro → "Esci".
 */

import { NextResponse, type NextRequest } from 'next/server';
import { revokeSession } from '@/lib/auth/backendSession';
import { SESSION_COOKIE, unsealSession } from '@/lib/auth/sessionCookie';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const stored = await unsealSession(request.cookies.get(SESSION_COOKIE)?.value).catch(() => null);
  if (stored) {
    await revokeSession(stored.refreshToken);
  }
  const response = NextResponse.redirect(new URL('/auth/login', request.url));
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
