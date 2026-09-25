/**
 * @jest-environment node
 *
 * lib/auth0.ts getSession() on top of the first-party session cookie.
 */
import { SESSION_COOKIE, sealSession, type StoredSession } from '@/lib/auth/sessionCookie';

let cookieValue: string | undefined;
jest.mock('next/headers', () => ({
  cookies: async () => ({ get: () => (cookieValue ? { value: cookieValue } : undefined) }),
}));

function stored(overrides: Partial<StoredSession> = {}): StoredSession {
  return {
    accessToken: 'at',
    refreshToken: 'rt',
    accessExpiresAt: 1, // access expiry is the middleware's job: still a valid session
    refreshExpiresAt: Math.floor(Date.now() / 1000) + 60,
    user: { id: 5, email: 'me@example.com', name: null, role: 'admin', sub: 'google-oauth2|5' },
    ...overrides,
  };
}

describe('auth0.getSession (first-party)', () => {
  const env = { ...process.env };
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...env, SESSION_SECRET: 's'.repeat(40) };
    delete process.env.BYPASS_AUTH;
    cookieValue = undefined;
  });
  afterAll(() => {
    process.env = env;
  });

  it('returns an Auth0-shaped user keyed by the legacy sub', async () => {
    const { auth0 } = await import('@/lib/auth0');
    const value = await sealSession(stored());
    const session = await auth0.getSession({ cookies: { get: (n: string) => (n === SESSION_COOKIE ? { value } : undefined) } } as never);
    expect(session?.user).toMatchObject({
      sub: 'google-oauth2|5',
      email: 'me@example.com',
      name: 'me@example.com',
      nickname: 'me',
      role: 'admin',
    });
  });

  it('reads next/headers cookies when called without a request', async () => {
    const { auth0 } = await import('@/lib/auth0');
    cookieValue = await sealSession(stored());
    expect((await auth0.getSession())?.user.sub).toBe('google-oauth2|5');
  });

  it('returns null for missing or expired sessions', async () => {
    const { auth0 } = await import('@/lib/auth0');
    expect(await auth0.getSession()).toBeNull();
    cookieValue = await sealSession(stored({ refreshExpiresAt: 1 }));
    expect(await auth0.getSession()).toBeNull();
  });

  it('returns the mock session with BYPASS_AUTH', async () => {
    process.env.BYPASS_AUTH = 'true';
    const { auth0 } = await import('@/lib/auth0');
    expect((await auth0.getSession())?.user.sub).toBe('local-dev-user');
  });
});
