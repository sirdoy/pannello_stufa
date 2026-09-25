/**
 * @jest-environment node
 */
import {
  SessionApiError,
  loginWithPassword,
  refreshSession,
  revokeSession,
} from '../backendSession';

const tokens = (legacy_sub: string | null) => ({
  access_token: 'at',
  refresh_token: 'rt',
  token_type: 'bearer',
  expires_in: 900,
  refresh_expires_in: 2592000,
  user: { id: 2, email: 'me@example.com', display_name: 'Me', role: 'admin', last_login_at: null, legacy_sub },
});

function mockFetch(status: number, body?: unknown, headers: Record<string, string> = {}) {
  global.fetch = jest.fn().mockResolvedValue(
    new Response(body === undefined ? null : JSON.stringify(body), { status, headers })
  ) as unknown as typeof fetch;
}

describe('backendSession', () => {
  const originalFetch = global.fetch;
  beforeEach(() => {
    process.env.HA_API_URL = 'https://pi.example/';
    process.env.HA_API_KEY = 'k';
  });
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('logs in with X-API-Key and maps legacy_sub to sub', async () => {
    mockFetch(200, tokens('google-oauth2|9'));
    const session = await loginWithPassword('me@example.com', 'pw', 'UA');

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('https://pi.example/auth/session/login');
    expect(init.headers['X-API-Key']).toBe('k');
    expect(JSON.parse(init.body)).toEqual({ email: 'me@example.com', password: 'pw', user_agent: 'UA' });
    expect(session.user).toEqual({ id: 2, email: 'me@example.com', name: 'Me', role: 'admin', sub: 'google-oauth2|9' });
    expect(session.refreshExpiresAt - session.accessExpiresAt).toBe(2592000 - 900);
  });

  it('falls back to user:<id> when there is no legacy sub', async () => {
    mockFetch(200, tokens(null));
    expect((await refreshSession('rt')).user.sub).toBe('user:2');
  });

  it('maps 401 / 429 / network errors', async () => {
    mockFetch(401, { detail: 'x' });
    await expect(loginWithPassword('a@b.it', 'x')).rejects.toMatchObject({ kind: 'invalid_credentials' });

    mockFetch(429, { detail: 'x' }, { 'Retry-After': '120' });
    await expect(loginWithPassword('a@b.it', 'x')).rejects.toMatchObject({ kind: 'locked', retryAfter: 120 });

    global.fetch = jest.fn().mockRejectedValue(new TypeError('fetch failed')) as unknown as typeof fetch;
    const err = await refreshSession('rt').catch((e) => e);
    expect(err).toBeInstanceOf(SessionApiError);
    expect(err.kind).toBe('unavailable');
  });

  it('revokeSession never throws', async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError('down')) as unknown as typeof fetch;
    await expect(revokeSession('rt')).resolves.toBeUndefined();
  });
});
