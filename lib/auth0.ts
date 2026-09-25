/**
 * Server-side session access (roadmap Fase 8: first-party login on the Pi DB).
 *
 * Keeps the `auth0.getSession()` API the ~110 call sites and test mocks rely on,
 * but reads our own sealed session cookie (lib/auth/sessionCookie.ts) instead of
 * an Auth0 session. `session.user.sub` stays the per-user data key: the legacy
 * Auth0 sub for migrated accounts, `user:<id>` otherwise.
 *
 * Token refresh happens in middleware.ts; here a session is valid until its
 * refresh token expires.
 */

import type { NextRequest } from 'next/server';
import {
  SESSION_COOKIE,
  isSessionAlive,
  unsealSession,
  type SessionUser,
} from '@/lib/auth/sessionCookie';

// =============================================================================
// DEV BYPASS
// =============================================================================

const BYPASS_AUTH = process.env.BYPASS_AUTH === 'true';
const DEV_USER_ID = 'local-dev-user';

const MOCK_SESSION: AppSession = {
  user: {
    sub: DEV_USER_ID,
    email: 'dev@localhost',
    name: 'Local Dev User',
    nickname: 'dev',
    picture: '',
    role: 'admin',
  },
};

// =============================================================================
// SESSION
// =============================================================================

/** Auth0-compatible session shape (user.sub/email/name/nickname/picture). */
export interface AppSession {
  user: {
    sub: string;
    email: string;
    name: string;
    nickname: string;
    picture: string;
    role: SessionUser['role'];
    id?: number;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

function toAppSession(user: SessionUser): AppSession {
  const name = user.name || user.email;
  return {
    user: {
      sub: user.sub,
      email: user.email,
      name,
      nickname: user.email.split('@')[0] ?? name,
      picture: '',
      role: user.role,
      id: user.id,
    },
  };
}

async function readCookie(request?: Pick<NextRequest, 'cookies'>): Promise<string | undefined> {
  if (request?.cookies) {
    return request.cookies.get(SESSION_COOKIE)?.value;
  }
  // Server components / route handlers called without the request object
  const { cookies } = await import('next/headers');
  return (await cookies()).get(SESSION_COOKIE)?.value;
}

async function getSession(request?: Pick<NextRequest, 'cookies'>): Promise<AppSession | null> {
  if (BYPASS_AUTH) return MOCK_SESSION;
  const stored = await unsealSession(await readCookie(request));
  if (!stored || !isSessionAlive(stored)) return null;
  return toAppSession(stored.user);
}

export const auth0 = { getSession };
