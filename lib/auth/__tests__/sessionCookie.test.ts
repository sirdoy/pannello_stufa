/**
 * @jest-environment node
 */
import {
  ACCESS_REFRESH_LEEWAY_S,
  isSessionAlive,
  needsAccessRefresh,
  sealSession,
  unsealSession,
  type StoredSession,
} from '../sessionCookie';

const SECRET = 'x'.repeat(40);

function makeSession(overrides: Partial<StoredSession> = {}): StoredSession {
  const now = Math.floor(Date.now() / 1000);
  return {
    accessToken: 'at',
    refreshToken: 'rt',
    accessExpiresAt: now + 900,
    refreshExpiresAt: now + 86400,
    user: { id: 1, email: 'me@example.com', name: 'Me', role: 'admin', sub: 'google-oauth2|1' },
    ...overrides,
  };
}

describe('sessionCookie', () => {
  it('round-trips a sealed session', async () => {
    const session = makeSession();
    const sealed = await sealSession(session, SECRET);
    expect(sealed).not.toContain('rt');
    expect(await unsealSession(sealed, SECRET)).toEqual(session);
  });

  it('uses a fresh IV per seal (same input, different cookie)', async () => {
    const session = makeSession();
    expect(await sealSession(session, SECRET)).not.toBe(await sealSession(session, SECRET));
  });

  it('rejects tampered cookies, wrong secrets and garbage', async () => {
    const sealed = await sealSession(makeSession(), SECRET);
    const flipped = sealed.slice(0, -2) + (sealed.endsWith('A') ? 'BB' : 'AA');
    expect(await unsealSession(flipped, SECRET)).toBeNull();
    expect(await unsealSession(sealed, 'y'.repeat(40))).toBeNull();
    expect(await unsealSession('not-a-cookie', SECRET)).toBeNull();
    expect(await unsealSession(undefined, SECRET)).toBeNull();
  });

  it('is alive until the refresh token expires', () => {
    const now = 1_000_000;
    expect(isSessionAlive(makeSession({ refreshExpiresAt: now + 1 }), now)).toBe(true);
    expect(isSessionAlive(makeSession({ refreshExpiresAt: now }), now)).toBe(false);
  });

  it('asks for a refresh within the leeway before access expiry', () => {
    const now = 1_000_000;
    expect(needsAccessRefresh(makeSession({ accessExpiresAt: now + ACCESS_REFRESH_LEEWAY_S + 1 }), now)).toBe(false);
    expect(needsAccessRefresh(makeSession({ accessExpiresAt: now + ACCESS_REFRESH_LEEWAY_S }), now)).toBe(true);
  });

  it('requires a secret of at least 32 chars', async () => {
    const saved = process.env.SESSION_SECRET;
    process.env.SESSION_SECRET = 'short';
    await expect(sealSession(makeSession())).rejects.toThrow(/SESSION_SECRET/);
    process.env.SESSION_SECRET = saved;
  });

  it('ignores the legacy AUTH0_SECRET', async () => {
    const saved = { s: process.env.SESSION_SECRET, a: process.env.AUTH0_SECRET };
    try {
      delete process.env.SESSION_SECRET;
      process.env.AUTH0_SECRET = 'x'.repeat(64);
      await expect(sealSession(makeSession())).rejects.toThrow(/SESSION_SECRET/);
    } finally {
      process.env.SESSION_SECRET = saved.s;
      if (saved.a === undefined) delete process.env.AUTH0_SECRET;
      else process.env.AUTH0_SECRET = saved.a;
    }
  });
});
