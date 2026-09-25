/**
 * POST /api/account/password — change your own password (roadmap 8.4).
 *
 * The backend revokes every session of the user and returns a new token pair,
 * which replaces the session cookie so this browser stays signed in.
 */
import { withErrorHandler } from '@/lib/core';
import { NextResponse, type NextRequest } from 'next/server';
import { haPost } from '@/lib/haClient';
import { requireStoredSession } from '@/lib/auth/storedSession';
import { SESSION_COOKIE, nowSeconds, sealSession, sessionCookieOptions } from '@/lib/auth/sessionCookie';
import { toSessionUser } from '@/lib/auth/backendSession';
import type { PasswordChangeRequest } from '@/types/users';

export const dynamic = 'force-dynamic';

interface TokensResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_expires_in: number;
  user: Parameters<typeof toSessionUser>[0];
}

export const POST = withErrorHandler(async (request: NextRequest) => {
  const { accessToken } = await requireStoredSession(request);
  const body = (await request.json()) as PasswordChangeRequest;
  const tokens = await haPost<TokensResponse>('/auth/me/password', body, { bearer: accessToken });

  const now = nowSeconds();
  const session = {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    accessExpiresAt: now + tokens.expires_in,
    refreshExpiresAt: now + tokens.refresh_expires_in,
    user: toSessionUser(tokens.user),
  };
  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE, await sealSession(session), sessionCookieOptions(session));
  return response;
}, 'Account/Password');
