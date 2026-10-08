/**
 * Next proxy routes for Web Push notifications (workspace ROADMAP M48).
 * Proxy (haClient) mocked; checks validation, session handling and forwarding.
 */
jest.mock('@/lib/auth/session', () => ({
  authSession: { getSession: jest.fn() },
}));
jest.mock('@/lib/push/notificationsProxy');

import { authSession } from '@/lib/auth/session';
import { ApiError } from '@/lib/core';
import * as proxy from '@/lib/push/notificationsProxy';
import * as vapid from '../vapid-public-key/route';
import * as subscriptions from '../subscriptions/route';
import * as remove from '../subscriptions/remove/route';
import * as rotate from '../subscriptions/rotate/route';
import * as one from '../subscriptions/[id]/route';
import * as test from '../test/route';
import * as history from '../history/route';
import * as preferences from '../preferences/route';

const mocked = jest.mocked(proxy);
const SUB = {
  endpoint: 'https://fcm.googleapis.com/fcm/send/abc',
  keys: { p256dh: 'BKey', auth: 'secret' },
};

function req(body?: unknown, search = '') {
  const headers = new Map([['content-type', 'application/json']]);
  return {
    headers: { get: (n: string) => headers.get(n.toLowerCase()) ?? null },
    text: async () => (body === undefined ? '' : JSON.stringify(body)),
    json: async () => body,
    nextUrl: new URL(`http://localhost/x${search}`),
  } as never;
}

const ctx = (params: Record<string, string> = {}) => ({ params: Promise.resolve(params) }) as never;

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.mocked(authSession.getSession).mockResolvedValue({
    user: { sub: 'user:1', email: 'a@b.c', name: 'A' },
  } as never);
  for (const fn of Object.values(mocked)) {
    if (typeof fn === 'function' && 'mockResolvedValue' in fn) {
      (fn as jest.Mock).mockResolvedValue({ id: 7 });
    }
  }
});

describe('session', () => {
  it('401 without a session on the protected routes', async () => {
    jest.mocked(authSession.getSession).mockResolvedValue(null as never);
    expect((await subscriptions.POST(req(SUB), ctx())).status).toBe(401);
    expect((await test.POST(req({}), ctx())).status).toBe(401);
    expect(mocked.subscribe).not.toHaveBeenCalled();
  });

  it('rotate works without a session (service worker while logged out)', async () => {
    jest.mocked(authSession.getSession).mockResolvedValue(null as never);
    const res = await rotate.POST(req({ old_endpoint: 'https://fcm.googleapis.com/old', subscription: SUB }), ctx());
    expect(res.status).toBe(200);
    expect(mocked.rotateSubscription).toHaveBeenCalledWith({
      old_endpoint: 'https://fcm.googleapis.com/old',
      subscription: SUB,
    });
  });
});

describe('subscriptions', () => {
  it('subscribe forwards the device and stamps the user from the session', async () => {
    const res = await subscriptions.POST(req({ ...SUB, device_name: 'Pixel', user_id: 'spoofed' }), ctx());
    expect(res.status).toBe(200);
    expect(mocked.subscribe).toHaveBeenCalledWith({ ...SUB, device_name: 'Pixel', user_id: 'user:1' });
  });

  it('rejects a non-https endpoint and missing keys', async () => {
    expect((await subscriptions.POST(req({ ...SUB, endpoint: 'http://x.y/z' }), ctx())).status).toBe(400);
    expect((await subscriptions.POST(req({ endpoint: SUB.endpoint }), ctx())).status).toBe(400);
    expect(mocked.subscribe).not.toHaveBeenCalled();
  });

  it('list, remove by endpoint, delete by id', async () => {
    expect((await subscriptions.GET(req(), ctx())).status).toBe(200);
    expect((await remove.POST(req({ endpoint: SUB.endpoint }), ctx())).status).toBe(204);
    expect(mocked.removeSubscriptionByEndpoint).toHaveBeenCalledWith(SUB.endpoint);
    expect((await one.DELETE(req(), ctx({ id: '3' }))).status).toBe(204);
    expect(mocked.deleteSubscription).toHaveBeenCalledWith(3);
    expect((await one.DELETE(req(), ctx({ id: 'abc' }))).status).toBe(400);
  });

  it('rotate passes the backend 404 through', async () => {
    mocked.rotateSubscription.mockRejectedValue(new ApiError('NOT_FOUND', 'Subscription not found', 404));
    const res = await rotate.POST(req({ old_endpoint: 'https://fcm.googleapis.com/old', subscription: SUB }), ctx());
    expect(res.status).toBe(404);
  });
});

describe('preferences (M61)', () => {
  it('reads the choices of the session user', async () => {
    const res = await preferences.GET(req(undefined, '?user_id=user:2'), ctx());
    expect(res.status).toBe(200);
    expect(mocked.getPreferences).toHaveBeenCalledWith('user:1');
  });

  it('saves for the session user only, whatever the body says', async () => {
    const res = await preferences.PUT(req({ user_id: 'user:2', events: { stove_alarm: false } }), ctx());
    expect(res.status).toBe(200);
    expect(mocked.setPreferences).toHaveBeenCalledWith('user:1', { stove_alarm: false });
  });

  it('rejects a missing, empty or non-boolean choice', async () => {
    expect((await preferences.PUT(req({}), ctx())).status).toBe(400);
    expect((await preferences.PUT(req({ events: {} }), ctx())).status).toBe(400);
    expect((await preferences.PUT(req({ events: { stove_alarm: 'no' } }), ctx())).status).toBe(400);
    expect(mocked.setPreferences).not.toHaveBeenCalled();
  });

  it('401 without a session', async () => {
    jest.mocked(authSession.getSession).mockResolvedValue(null as never);
    expect((await preferences.GET(req(), ctx())).status).toBe(401);
    expect((await preferences.PUT(req({ events: { stove_alarm: false } }), ctx())).status).toBe(401);
  });
});

describe('test + history + vapid', () => {
  it('test push to one device or all', async () => {
    await test.POST(req({ subscription_id: 4 }), ctx());
    expect(mocked.sendTestPush).toHaveBeenCalledWith(4);
    await test.POST(req({}), ctx());
    expect(mocked.sendTestPush).toHaveBeenLastCalledWith(undefined);
    expect((await test.POST(req({ subscription_id: -1 }), ctx())).status).toBe(400);
  });

  it('history validates limit/offset', async () => {
    await history.GET(req(undefined, '?limit=20'), ctx());
    expect(mocked.getPushHistory).toHaveBeenCalledWith(20, 0);
    expect((await history.GET(req(undefined, '?limit=500'), ctx())).status).toBe(400);
  });

  it('vapid key is forwarded', async () => {
    mocked.getVapidPublicKey.mockResolvedValue({ public_key: 'BPub' });
    const res = await vapid.GET(req(), ctx());
    expect(await res.json()).toMatchObject({ public_key: 'BPub' });
  });
});
