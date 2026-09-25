/**
 * Calls the backend first-party session API (backend docs/api/auth.md "User sessions").
 *
 * Plain fetch (no haClient) so it also runs in the Edge middleware. Every call
 * sends X-API-Key: the backend only accepts these routes from this server.
 */

import { nowSeconds, type SessionUser, type StoredSession } from './sessionCookie';

/** Backend UserPublic */
interface BackendUser {
  id: number;
  email: string;
  display_name: string | null;
  role: SessionUser['role'];
  last_login_at: string | null;
  legacy_sub: string | null;
}

/** Backend SessionTokens */
interface BackendTokens {
  access_token: string;
  refresh_token: string;
  token_type: 'bearer';
  expires_in: number;
  refresh_expires_in: number;
  user: BackendUser;
}

export type SessionErrorKind = 'invalid_credentials' | 'locked' | 'unavailable';

export class SessionApiError extends Error {
  constructor(
    public kind: SessionErrorKind,
    public status: number,
    public retryAfter?: number
  ) {
    super(`Session API ${kind} (${status})`);
    this.name = 'SessionApiError';
  }
}

const TIMEOUT_MS = 15_000;

function backendConfig(): { baseUrl: string; apiKey: string } {
  const baseUrl = process.env.HA_API_URL;
  const apiKey = process.env.HA_API_KEY;
  if (!baseUrl || !apiKey) {
    throw new SessionApiError('unavailable', 500);
  }
  return { baseUrl: baseUrl.replace(/\/$/, ''), apiKey };
}

async function post(path: string, body: unknown): Promise<Response> {
  const { baseUrl, apiKey } = backendConfig();
  try {
    return await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
      body: JSON.stringify(body),
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw new SessionApiError('unavailable', 503);
  }
}

export function toSessionUser(user: BackendUser): SessionUser {
  return {
    id: user.id,
    email: user.email,
    name: user.display_name,
    role: user.role,
    sub: user.legacy_sub ?? `user:${user.id}`,
  };
}

function toStoredSession(tokens: BackendTokens): StoredSession {
  const now = nowSeconds();
  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    accessExpiresAt: now + tokens.expires_in,
    refreshExpiresAt: now + tokens.refresh_expires_in,
    user: toSessionUser(tokens.user),
  };
}

async function tokensOrThrow(response: Response): Promise<StoredSession> {
  if (response.ok) {
    return toStoredSession((await response.json()) as BackendTokens);
  }
  if (response.status === 401) throw new SessionApiError('invalid_credentials', 401);
  if (response.status === 429) {
    const retryAfter = Number(response.headers.get('Retry-After')) || undefined;
    throw new SessionApiError('locked', 429, retryAfter);
  }
  throw new SessionApiError('unavailable', response.status);
}

export async function loginWithPassword(
  email: string,
  password: string,
  userAgent?: string | null
): Promise<StoredSession> {
  const response = await post('/auth/session/login', {
    email,
    password,
    ...(userAgent ? { user_agent: userAgent.slice(0, 512) } : {}),
  });
  return tokensOrThrow(response);
}

export async function refreshSession(refreshToken: string): Promise<StoredSession> {
  return tokensOrThrow(await post('/auth/session/refresh', { refresh_token: refreshToken }));
}

/** Best effort: the cookie is cleared anyway, so failures are ignored. */
export async function revokeSession(refreshToken: string): Promise<void> {
  try {
    await post('/auth/session/logout', { refresh_token: refreshToken });
  } catch {
    /* backend unreachable: the refresh token will expire on its own */
  }
}
