/**
 * @jest-environment node
 *
 * GET /api/ws-token — browser WS auth without an API key in the bundle (8.7).
 */
jest.unmock('next/server');

import { NextRequest } from 'next/server';
import { SESSION_COOKIE, sealSession } from '@/lib/auth/sessionCookie';

const mockPost = jest.fn();
jest.mock('@/lib/haClient', () => ({ haPost: (...a: unknown[]) => mockPost(...a) }));

import { GET } from '@/app/api/ws-token/route';

const ctx = { params: Promise.resolve({}) };

describe('GET /api/ws-token', () => {
  const env = { ...process.env };
  beforeEach(() => {
    process.env = { ...env, SESSION_SECRET: 's'.repeat(40), HA_API_KEY: 'server-key' };
    delete process.env.BYPASS_AUTH;
    mockPost.mockReset();
  });
  afterAll(() => {
    process.env = env;
  });

  it('returns a user WS token query, never the API key', async () => {
    mockPost.mockResolvedValue({ token: 'ws.jwt', expires_in: 60 });
    const cookie = await sealSession({
      accessToken: 'at', refreshToken: 'rt', accessExpiresAt: 2e9, refreshExpiresAt: 2e9,
      user: { id: 2, email: 'a@b.it', name: null, role: 'test', sub: 'user:2' },
    });
    const res = await GET(
      new NextRequest('https://app.example/api/ws-token', { headers: { cookie: `${SESSION_COOKIE}=${cookie}` } }),
      ctx
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('no-store');
    const body = await res.json();
    expect(body).toEqual({ query: 'token=ws.jwt' });
    expect(JSON.stringify(body)).not.toContain('server-key');
    expect(mockPost).toHaveBeenCalledWith('/auth/ws-token', {}, { bearer: 'at' });
  });

  it('401 without a session', async () => {
    const res = await GET(new NextRequest('https://app.example/api/ws-token'), ctx);
    expect(res.status).toBe(401);
    expect(mockPost).not.toHaveBeenCalled();
  });

  it('dev bypass (non-production) falls back to the server API key', async () => {
    process.env.BYPASS_AUTH = 'true';
    const res = await GET(new NextRequest('https://app.example/api/ws-token'), ctx);
    expect((await res.json()).query).toBe('api_key=server-key');
  });

  it('never uses the API key fallback in production', async () => {
    process.env.BYPASS_AUTH = 'true';
    (process.env as Record<string, string>).NODE_ENV = 'production';
    const res = await GET(new NextRequest('https://app.example/api/ws-token'), ctx);
    expect(res.status).toBe(401);
  });
});
