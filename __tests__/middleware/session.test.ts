/**
 * @jest-environment node
 *
 * middleware.ts — first-party session gate (roadmap Fase 8).
 * Uses the real next/server (jest.setup mocks it globally).
 */
jest.unmock('next/server');
import { NextRequest } from 'next/server';
import { SESSION_COOKIE, sealSession, unsealSession, type StoredSession } from '@/lib/auth/sessionCookie';
import { SessionApiError } from '@/lib/auth/backendSession';

const mockRefresh = jest.fn();
jest.mock('@/lib/auth/backendSession', () => {
  const actual = jest.requireActual('@/lib/auth/backendSession');
  return { ...actual, refreshSession: (...args: unknown[]) => mockRefresh(...args) };
});

import { middleware } from '@/middleware';

const now = () => Math.floor(Date.now() / 1000);
function session(overrides: Partial<StoredSession> = {}): StoredSession {
  return {
    accessToken: 'at',
    refreshToken: 'rt-old',
    accessExpiresAt: now() + 900,
    refreshExpiresAt: now() + 86400,
    user: { id: 1, email: 'me@example.com', name: 'Me', role: 'admin', sub: 'google-oauth2|1' },
    ...overrides,
  };
}

async function request(path: string, stored?: StoredSession | string) {
  const headers = new Headers();
  if (stored) {
    const value = typeof stored === 'string' ? stored : await sealSession(stored);
    headers.set('cookie', `${SESSION_COOKIE}=${value}`);
  }
  return new NextRequest(new URL(path, 'https://app.example'), { headers });
}

describe('middleware session gate', () => {
  const env = { ...process.env };
  beforeEach(() => {
    process.env.SESSION_SECRET = 's'.repeat(40);
    delete process.env.TEST_MODE;
    delete process.env.BYPASS_AUTH;
    mockRefresh.mockReset();
  });
  afterAll(() => {
    process.env = env;
  });

  it('redirects pages without a session to /auth/login with returnTo', async () => {
    const res = await middleware(await request('/network?tab=wifi'));
    expect(res.status).toBe(307);
    const location = new URL(res.headers.get('location')!);
    expect(location.pathname).toBe('/auth/login');
    expect(location.searchParams.get('returnTo')).toBe('/network?tab=wifi');
  });

  it('answers 401 JSON for API routes without a session', async () => {
    const res = await middleware(await request('/api/v1/fritzbox/devices'));
    expect(res.status).toBe(401);
  });

  it('lets public auth paths through without a session', async () => {
    for (const path of ['/auth/login', '/auth/logout', '/auth/profile', '/api/auth/session']) {
      const res = await middleware(await request(path));
      expect(res.headers.get('location')).toBeNull();
      expect(res.status).toBe(200);
    }
  });

  it('passes a valid session without refreshing', async () => {
    const res = await middleware(await request('/', session()));
    expect(res.status).toBe(200);
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it('rejects tampered and expired sessions and clears the cookie', async () => {
    const tampered = await middleware(await request('/', 'garbage'));
    expect(tampered.status).toBe(307);
    expect(tampered.cookies.get(SESSION_COOKIE)?.value).toBe('');

    const expired = await middleware(await request('/', session({ refreshExpiresAt: now() - 1 })));
    expect(expired.status).toBe(307);
  });

  it('rotates tokens when the access token is about to expire', async () => {
    const refreshed = session({ accessToken: 'at-new', refreshToken: 'rt-new' });
    mockRefresh.mockResolvedValue(refreshed);

    const res = await middleware(await request('/', session({ accessExpiresAt: now() + 10 })));

    expect(mockRefresh).toHaveBeenCalledWith('rt-old');
    expect(res.status).toBe(200);
    const cookie = res.cookies.get(SESSION_COOKIE)!;
    expect(cookie.httpOnly).toBe(true);
    expect((await unsealSession(cookie.value))?.refreshToken).toBe('rt-new');
    // forwarded to this request's handlers too
    expect(res.headers.get('x-middleware-request-cookie') ?? res.headers.get('x-middleware-override-headers')).toBeTruthy();
  });

  it('logs out when the backend refuses the refresh (revoked / deactivated)', async () => {
    mockRefresh.mockRejectedValue(new SessionApiError('invalid_credentials', 401));
    const res = await middleware(await request('/stove', session({ accessExpiresAt: now() - 5 })));
    expect(res.status).toBe(307);
    expect(res.cookies.get(SESSION_COOKIE)?.value).toBe('');
  });

  it('keeps the session when the backend is unreachable', async () => {
    mockRefresh.mockRejectedValue(new SessionApiError('unavailable', 503));
    const res = await middleware(await request('/stove', session({ accessExpiresAt: now() - 5 })));
    expect(res.status).toBe(200);
    expect(res.headers.get('location')).toBeNull();
  });

  it('bypasses auth in TEST_MODE', async () => {
    process.env.TEST_MODE = 'true';
    expect((await middleware(await request('/stove'))).status).toBe(200);
  });
});
