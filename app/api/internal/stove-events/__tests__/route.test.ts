/**
 * Tests for POST /api/internal/stove-events (Pi → frontend notifications, ROADMAP D2.4)
 */
jest.mock('@/lib/auth/session', () => ({
  authSession: { getSession: jest.fn() },
}));
jest.mock('@/lib/notifications/stoveEvents', () => ({
  ...jest.requireActual('@/lib/notifications/stoveEvents'),
  dispatchStoveEvent: jest.fn().mockResolvedValue({ success: true }),
}));

import { POST } from '../route';
import { dispatchStoveEvent } from '@/lib/notifications/stoveEvents';

const mockDispatch = jest.mocked(dispatchStoveEvent);
const SECRET = 'a'.repeat(64);
const BODY = { event: 'scheduler_shutdown', data: {}, ts: 1790000000 };

function post(body: unknown, auth: string | null = `Bearer ${SECRET}`) {
  // Minimal request object: jsdom's Request has no usable headers.get.
  const headers = new Map<string, string>([['content-type', 'application/json']]);
  if (auth) headers.set('authorization', auth);
  const request = {
    headers: { get: (name: string) => headers.get(name.toLowerCase()) ?? null },
    text: async () => JSON.stringify(body),
  };
  return POST(request as never, {} as never);
}

describe('POST /api/internal/stove-events', () => {
  const env = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    process.env = { ...env, STOVE_EVENTS_SECRET: SECRET, ADMIN_USER_ID: 'user:1' };
  });

  afterAll(() => {
    process.env = env;
  });

  it('dispatches a valid event for the admin user', async () => {
    const res = await post(BODY);

    expect(res.status).toBe(200);
    expect(mockDispatch).toHaveBeenCalledWith('user:1', BODY);
    expect((await res.json()).delivered).toBe(true);
  });

  it.each([
    ['missing header', null],
    ['wrong secret', `Bearer ${'b'.repeat(64)}`],
    ['wrong length', 'Bearer short'],
    ['not bearer', SECRET],
  ])('401 on %s', async (_label, auth) => {
    const res = await post(BODY, auth);

    expect(res.status).toBe(401);
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('401 when the secret is not configured', async () => {
    delete process.env.STOVE_EVENTS_SECRET;

    expect((await post(BODY)).status).toBe(401);
  });

  it.each([
    ['unknown event', { ...BODY, event: 'fire' }],
    ['missing ts', { event: 'scheduler_shutdown', data: {} }],
  ])('400 on %s', async (_label, body) => {
    const res = await post(body);

    expect(res.status).toBe(400);
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('accepts but skips when ADMIN_USER_ID is not set', async () => {
    delete process.env.ADMIN_USER_ID;

    const res = await post(BODY);

    expect(res.status).toBe(200);
    expect((await res.json()).delivered).toBe(false);
    expect(mockDispatch).not.toHaveBeenCalled();
  });
});
