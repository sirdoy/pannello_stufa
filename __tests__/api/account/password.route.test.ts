/**
 * @jest-environment node
 *
 * POST /api/account/password — self password change keeps this browser signed in.
 */
jest.unmock('next/server');

import { NextRequest } from 'next/server';
import { SESSION_COOKIE, sealSession, unsealSession } from '@/lib/auth/sessionCookie';

const mockPost = jest.fn();
jest.mock('@/lib/haClient', () => ({ haPost: (...a: unknown[]) => mockPost(...a) }));

import { POST } from '@/app/api/account/password/route';

describe('POST /api/account/password', () => {
  beforeEach(() => {
    process.env.SESSION_SECRET = 's'.repeat(40);
    mockPost.mockReset();
  });

  it('forwards with Bearer and replaces the session cookie with the new pair', async () => {
    mockPost.mockResolvedValue({
      access_token: 'at-new',
      refresh_token: 'rt-new',
      expires_in: 900,
      refresh_expires_in: 86400,
      user: { id: 1, email: 'me@example.com', display_name: null, role: 'admin', last_login_at: null, legacy_sub: 'google-oauth2|1' },
    });
    const cookie = await sealSession({
      accessToken: 'at-old', refreshToken: 'rt-old', accessExpiresAt: 2e9, refreshExpiresAt: 2e9,
      user: { id: 1, email: 'me@example.com', name: null, role: 'admin', sub: 'google-oauth2|1' },
    });
    const body = { current_password: 'old-password', new_password: 'new-password-123' };
    const res = await POST(
      new NextRequest('https://app.example/api/account/password', {
        method: 'POST',
        headers: { cookie: `${SESSION_COOKIE}=${cookie}`, 'content-type': 'application/json' },
        body: JSON.stringify(body),
      }),
      { params: Promise.resolve({}) }
    );

    expect(res.status).toBe(200);
    expect(mockPost).toHaveBeenCalledWith('/auth/me/password', body, { bearer: 'at-old' });
    const next = await unsealSession(res.cookies.get(SESSION_COOKIE)!.value);
    expect(next?.refreshToken).toBe('rt-new');
    expect(next?.user.sub).toBe('google-oauth2|1');
  });

  it('401 without a session', async () => {
    const res = await POST(
      new NextRequest('https://app.example/api/account/password', { method: 'POST', body: '{}' }),
      { params: Promise.resolve({}) }
    );
    expect(res.status).toBe(401);
    expect(mockPost).not.toHaveBeenCalled();
  });
});
