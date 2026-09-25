/**
 * @jest-environment node
 *
 * /api/users and /api/users/[id] — admin user management proxy (roadmap 8.4).
 */
jest.unmock('next/server');

import { NextRequest } from 'next/server';
import { SESSION_COOKIE, sealSession, type StoredSession } from '@/lib/auth/sessionCookie';

const mockGet = jest.fn();
const mockPost = jest.fn();
const mockPatch = jest.fn();
jest.mock('@/lib/haClient', () => ({
  haGet: (...a: unknown[]) => mockGet(...a),
  haPost: (...a: unknown[]) => mockPost(...a),
  haPatch: (...a: unknown[]) => mockPatch(...a),
}));

import { GET, POST } from '@/app/api/users/route';
import { PATCH } from '@/app/api/users/[id]/route';

function stored(role: StoredSession['user']['role']): StoredSession {
  return {
    accessToken: `at-${role}`,
    refreshToken: 'rt',
    accessExpiresAt: 2e9,
    refreshExpiresAt: 2e9,
    user: { id: 1, email: 'me@example.com', name: null, role, sub: 'user:1' },
  };
}

async function req(url: string, init: { method?: string; body?: unknown; role?: StoredSession['user']['role'] } = {}) {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (init.role) headers.cookie = `${SESSION_COOKIE}=${await sealSession(stored(init.role))}`;
  return new NextRequest(`https://app.example${url}`, {
    method: init.method ?? 'GET',
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
}

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

describe('/api/users', () => {
  beforeEach(() => {
    process.env.SESSION_SECRET = 's'.repeat(40);
    mockGet.mockReset();
    mockPost.mockReset();
    mockPatch.mockReset();
  });

  it('lists users with the admin access token as Bearer', async () => {
    mockGet.mockResolvedValue({ users: [], count: 0 });
    const res = await GET(await req('/api/users', { role: 'admin' }), ctx(''));
    expect(res.status).toBe(200);
    expect(mockGet).toHaveBeenCalledWith('/auth/users', { bearer: 'at-admin' });
  });

  it('401 without session, 403 for non-admins (backend never called)', async () => {
    expect((await GET(await req('/api/users'), ctx(''))).status).toBe(401);
    expect((await GET(await req('/api/users', { role: 'user' }), ctx(''))).status).toBe(403);
    expect((await POST(await req('/api/users', { method: 'POST', role: 'test', body: {} }), ctx(''))).status).toBe(403);
    expect(mockGet).not.toHaveBeenCalled();
    expect(mockPost).not.toHaveBeenCalled();
  });

  it('creates a user and returns 201', async () => {
    mockPost.mockResolvedValue({ user: { id: 3 }, generated_password: 'gen' });
    const body = { email: 'n@example.com', role: 'user' };
    const res = await POST(await req('/api/users', { method: 'POST', role: 'admin', body }), ctx(''));
    expect(res.status).toBe(201);
    expect(mockPost).toHaveBeenCalledWith('/auth/users', body, { bearer: 'at-admin' });
    expect((await res.json()).generated_password).toBe('gen');
  });

  it('patches a user by numeric id only', async () => {
    mockPatch.mockResolvedValue({ id: 3, role: 'admin' });
    const res = await PATCH(await req('/api/users/3', { method: 'PATCH', role: 'admin', body: { role: 'admin' } }), ctx('3'));
    expect(res.status).toBe(200);
    expect(mockPatch).toHaveBeenCalledWith('/auth/users/3', { role: 'admin' }, { bearer: 'at-admin' });

    const bad = await PATCH(await req('/api/users/x', { method: 'PATCH', role: 'admin', body: {} }), ctx('../me'));
    expect(bad.status).toBe(400);
    expect(mockPatch).toHaveBeenCalledTimes(1);
  });
});
