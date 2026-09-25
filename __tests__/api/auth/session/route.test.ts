/**
 * @jest-environment node
 *
 * POST /api/auth/session — email/password login (roadmap Fase 8).
 */
jest.unmock('next/server');

import { NextRequest } from 'next/server';
import { SESSION_COOKIE, unsealSession, type StoredSession } from '@/lib/auth/sessionCookie';
import { SessionApiError } from '@/lib/auth/backendSession';

const mockLogin = jest.fn();
jest.mock('@/lib/auth/backendSession', () => {
  const actual = jest.requireActual('@/lib/auth/backendSession');
  return { ...actual, loginWithPassword: (...args: unknown[]) => mockLogin(...args) };
});

import { POST } from '@/app/api/auth/session/route';

const stored: StoredSession = {
  accessToken: 'at',
  refreshToken: 'rt',
  accessExpiresAt: Math.floor(Date.now() / 1000) + 900,
  refreshExpiresAt: Math.floor(Date.now() / 1000) + 86400,
  user: { id: 1, email: 'me@example.com', name: 'Me', role: 'admin', sub: 'google-oauth2|1' },
};

function req(body: unknown) {
  return new NextRequest('https://app.example/api/auth/session', {
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body),
    headers: { 'content-type': 'application/json', 'user-agent': 'UA' },
  });
}

describe('POST /api/auth/session', () => {
  beforeEach(() => {
    process.env.SESSION_SECRET = 's'.repeat(40);
    mockLogin.mockReset();
  });

  it('sets a sealed httpOnly cookie and never returns tokens', async () => {
    mockLogin.mockResolvedValue(stored);
    const res = await POST(req({ email: ' me@example.com ', password: 'pw' }));

    expect(mockLogin).toHaveBeenCalledWith('me@example.com', 'pw', 'UA');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ user: { email: 'me@example.com', name: 'Me', role: 'admin' } });
    expect(JSON.stringify(body)).not.toContain('rt');

    const cookie = res.cookies.get(SESSION_COOKIE)!;
    expect(cookie.httpOnly).toBe(true);
    expect(cookie.sameSite).toBe('lax');
    expect((await unsealSession(cookie.value))?.refreshToken).toBe('rt');
  });

  it('400 on invalid body', async () => {
    expect((await POST(req('not json'))).status).toBe(400);
    expect((await POST(req({ email: 'me@example.com' }))).status).toBe(400);
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('maps backend errors (401, 429 with retryAfter, 503) without setting a cookie', async () => {
    mockLogin.mockRejectedValue(new SessionApiError('invalid_credentials', 401));
    let res = await POST(req({ email: 'me@example.com', password: 'x' }));
    expect(res.status).toBe(401);
    expect(res.cookies.get(SESSION_COOKIE)).toBeUndefined();

    mockLogin.mockRejectedValue(new SessionApiError('locked', 429, 300));
    res = await POST(req({ email: 'me@example.com', password: 'x' }));
    expect(res.status).toBe(429);
    expect((await res.json()).retryAfter).toBe(300);

    mockLogin.mockRejectedValue(new SessionApiError('unavailable', 503));
    res = await POST(req({ email: 'me@example.com', password: 'x' }));
    expect(res.status).toBe(503);
  });
});
