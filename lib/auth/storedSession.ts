/**
 * Server-side access to the full sealed session (tokens included) for routes
 * that call user-scoped backend endpoints (/auth/me/password, /auth/users*).
 */
import type { NextRequest } from 'next/server';
import { ApiError, ERROR_CODES, HTTP_STATUS } from '@/lib/core/apiErrors';
import { SESSION_COOKIE, isSessionAlive, unsealSession, type StoredSession } from './sessionCookie';

export async function requireStoredSession(request: Pick<NextRequest, 'cookies'>): Promise<StoredSession> {
  const stored = await unsealSession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!stored || !isSessionAlive(stored)) {
    throw new ApiError(ERROR_CODES.UNAUTHORIZED, 'Authentication required', HTTP_STATUS.UNAUTHORIZED);
  }
  return stored;
}

export async function requireAdminSession(request: Pick<NextRequest, 'cookies'>): Promise<StoredSession> {
  const stored = await requireStoredSession(request);
  if (stored.user.role !== 'admin') {
    throw new ApiError(ERROR_CODES.FORBIDDEN, 'Admin role required', HTTP_STATUS.FORBIDDEN);
  }
  return stored;
}
