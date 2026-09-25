/**
 * @jest-environment node
 *
 * GET /auth/logout — revoke + clear the first-party session.
 */
jest.unmock('next/server');

import { NextRequest } from 'next/server';
import { SESSION_COOKIE, sealSession } from '@/lib/auth/sessionCookie';

const mockRevoke = jest.fn();
jest.mock('@/lib/auth/backendSession', () => ({
  revokeSession: (...args: unknown[]) => mockRevoke(...args),
}));

import { GET } from '@/app/auth/logout/route';

describe('GET /auth/logout', () => {
  beforeEach(() => {
    process.env.SESSION_SECRET = 's'.repeat(40);
    mockRevoke.mockReset().mockResolvedValue(undefined);
  });

  it('revokes the refresh token, clears the cookie and redirects to login', async () => {
    const sealed = await sealSession({
      accessToken: 'at',
      refreshToken: 'rt-1',
      accessExpiresAt: 2e9,
      refreshExpiresAt: 2e9,
      user: { id: 1, email: 'a@b.it', name: null, role: 'user', sub: 'user:1' },
    });
    const res = await GET(
      new NextRequest('https://app.example/auth/logout', {
        headers: { cookie: `${SESSION_COOKIE}=${sealed}` },
      })
    );
    expect(mockRevoke).toHaveBeenCalledWith('rt-1');
    expect(new URL(res.headers.get('location')!).pathname).toBe('/auth/login');
    expect(res.cookies.get(SESSION_COOKIE)?.value).toBe('');
  });

  it('works without a session', async () => {
    const res = await GET(new NextRequest('https://app.example/auth/logout'));
    expect(mockRevoke).not.toHaveBeenCalled();
    expect(new URL(res.headers.get('location')!).pathname).toBe('/auth/login');
  });
});
