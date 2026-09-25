/**
 * @jest-environment node
 *
 * lib/auth/session.ts getSession() on top of the first-party session cookie.
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

describe('authSession.getSession (first-party)', () => {
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

  it('returns a session user keyed by the legacy sub', async () => {
    const { authSession } = await import('@/lib/auth/session');
    const value = await sealSession(stored());
    const session = await authSession.getSession({ cookies: { get: (n: string) => (n === SESSION_COOKIE ? { value } : undefined) } } as never);
    expect(session?.user).toMatchObject({
      sub: 'google-oauth2|5',
      email: 'me@example.com',
      name: 'me@example.com',
      nickname: 'me',
      role: 'admin',
    });
  });

  it('reads next/headers cookies when called without a request', async () => {
    const { authSession } = await import('@/lib/auth/session');
    cookieValue = await sealSession(stored());
    expect((await authSession.getSession())?.user.sub).toBe('google-oauth2|5');
  });

  it('returns null for missing or expired sessions', async () => {
    const { authSession } = await import('@/lib/auth/session');
    expect(await authSession.getSession()).toBeNull();
    cookieValue = await sealSession(stored({ refreshExpiresAt: 1 }));
    expect(await authSession.getSession()).toBeNull();
  });

  it('returns the mock session with BYPASS_AUTH', async () => {
    process.env.BYPASS_AUTH = 'true';
    const { authSession } = await import('@/lib/auth/session');
    expect((await authSession.getSession())?.user.sub).toBe('local-dev-user');
  });
});
