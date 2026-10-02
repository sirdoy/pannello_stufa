/**
 * Browser side of Web Push (workspace ROADMAP M48): permission, subscription
 * through /sw.js, registration on the Pi, stored per-device choice.
 */
import {
  CHOICE_KEY,
  SUBSCRIPTION_ID_KEY,
  disablePush,
  enablePush,
  getChoice,
  getPushSupport,
  shouldAskForPush,
  syncPush,
  urlBase64ToUint8Array,
} from '../pushClient';

const VAPID = 'BAEC'; // 3 bytes, enough for key comparison
const KEY = urlBase64ToUint8Array(VAPID);

interface FakeSub {
  endpoint: string;
  options: { applicationServerKey: ArrayBuffer | null };
  toJSON: () => unknown;
  unsubscribe: jest.Mock;
}

function fakeSub(endpoint: string, key: Uint8Array | null = KEY): FakeSub {
  return {
    endpoint,
    options: { applicationServerKey: key ? (key.slice().buffer as ArrayBuffer) : null },
    toJSON: () => ({ endpoint, keys: { p256dh: 'p', auth: 'a' } }),
    unsubscribe: jest.fn().mockResolvedValue(true),
  };
}

let current: FakeSub | null;
const pushManager = {
  getSubscription: jest.fn(async () => current),
  subscribe: jest.fn(async () => {
    current = fakeSub('https://push.example.com/new');
    return current;
  }),
};
const registration = { active: {}, installing: null, waiting: null, pushManager };
const cache = { put: jest.fn(), delete: jest.fn(), match: jest.fn() };
let fetchMock: jest.Mock;

function setPermission(permission: NotificationPermission, onRequest: NotificationPermission = permission) {
  Object.defineProperty(window, 'Notification', {
    configurable: true,
    value: { permission, requestPermission: jest.fn().mockResolvedValue(onRequest) },
  });
}

beforeEach(() => {
  localStorage.clear();
  current = null;
  jest.clearAllMocks();
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: {
      register: jest.fn().mockResolvedValue(registration),
      getRegistration: jest.fn().mockResolvedValue(registration),
    },
  });
  Object.defineProperty(window, 'PushManager', { configurable: true, value: function PushManager() {} });
  Object.defineProperty(globalThis, 'caches', { configurable: true, value: { open: async () => cache } });
  if (typeof Response === 'undefined') {
    Object.defineProperty(globalThis, 'Response', {
      configurable: true,
      value: class {
        constructor(public body: unknown) {}
      },
    });
  }
  setPermission('default', 'granted');
  fetchMock = jest.fn(async (url: string) => {
    if (url.endsWith('/vapid-public-key')) return { ok: true, json: async () => ({ public_key: VAPID }) };
    if (url.endsWith('/subscriptions')) return { ok: true, json: async () => ({ id: 9 }) };
    return { ok: true, status: 204, json: async () => ({}) };
  });
  global.fetch = fetchMock as unknown as typeof fetch;
});

describe('support + first-launch question', () => {
  it('asks only while no choice is stored and the permission is not blocked', () => {
    expect(getPushSupport()).toBe('supported');
    expect(shouldAskForPush()).toBe(true);
    localStorage.setItem(CHOICE_KEY, 'disabled');
    expect(shouldAskForPush()).toBe(false);
    localStorage.clear();
    setPermission('denied');
    expect(shouldAskForPush()).toBe(false);
  });

  it('iPhone outside the installed PWA cannot receive pushes', () => {
    const ua = jest.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0)');
    expect(getPushSupport()).toBe('ios-install');
    expect(shouldAskForPush()).toBe(false);
    ua.mockRestore();
  });
});

describe('enablePush', () => {
  it('asks the permission, subscribes with the Pi key and registers the device', async () => {
    const result = await enablePush();
    expect(result).toEqual({ ok: true, subscriptionId: 9 });
    expect(navigator.serviceWorker.register).toHaveBeenCalledWith('/sw.js', { scope: '/' });
    expect(pushManager.subscribe).toHaveBeenCalledWith({ userVisibleOnly: true, applicationServerKey: KEY });
    const [, init] = fetchMock.mock.calls.find(([u]) => String(u).endsWith('/subscriptions'))!;
    expect(JSON.parse(init.body)).toMatchObject({
      endpoint: 'https://push.example.com/new',
      keys: { p256dh: 'p', auth: 'a' },
    });
    expect(getChoice()).toBe('enabled');
    expect(localStorage.getItem(SUBSCRIPTION_ID_KEY)).toBe('9');
    expect(cache.put).toHaveBeenCalled(); // endpoint kept for pushsubscriptionchange
  });

  it('replaces a subscription made with another key (old FCM one)', async () => {
    const old = fakeSub('https://fcm.googleapis.com/old', new Uint8Array([9, 9, 9]));
    current = old;
    await enablePush();
    expect(old.unsubscribe).toHaveBeenCalled();
    expect(pushManager.subscribe).toHaveBeenCalled();
  });

  it('reuses a subscription made with the Pi key', async () => {
    current = fakeSub('https://push.example.com/same');
    await enablePush();
    expect(pushManager.subscribe).not.toHaveBeenCalled();
  });

  it('stores the refusal when the browser permission is denied', async () => {
    setPermission('default', 'denied');
    const result = await enablePush();
    expect(result).toMatchObject({ ok: false, reason: 'denied' });
    expect(getChoice()).toBe('disabled');
    expect(pushManager.subscribe).not.toHaveBeenCalled();
  });

  it('reports a server failure without storing the choice', async () => {
    fetchMock.mockImplementation(async () => ({ ok: false, status: 503, json: async () => ({}) }));
    const result = await enablePush();
    expect(result).toMatchObject({ ok: false, reason: 'error' });
    expect(getChoice()).toBeNull();
  });
});

describe('disablePush', () => {
  it('removes the device on the Pi and drops the browser subscription', async () => {
    const sub = fakeSub('https://push.example.com/mine');
    current = sub;
    localStorage.setItem(CHOICE_KEY, 'enabled');
    localStorage.setItem(SUBSCRIPTION_ID_KEY, '9');
    await disablePush();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/v1/notifications/subscriptions/remove');
    expect(JSON.parse(init.body)).toEqual({ endpoint: 'https://push.example.com/mine' });
    expect(sub.unsubscribe).toHaveBeenCalled();
    expect(getChoice()).toBe('disabled');
    expect(localStorage.getItem(SUBSCRIPTION_ID_KEY)).toBeNull();
  });
});

describe('syncPush', () => {
  it('does nothing until the user said yes', async () => {
    expect(await syncPush()).toBe('skipped');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('re-registers the device when on and permitted', async () => {
    localStorage.setItem(CHOICE_KEY, 'enabled');
    setPermission('granted');
    current = fakeSub('https://push.example.com/same');
    expect(await syncPush()).toBe('synced');
    expect(fetchMock.mock.calls.some(([u]) => String(u).endsWith('/subscriptions'))).toBe(true);
  });

  it('reports a permission revoked in the browser settings', async () => {
    localStorage.setItem(CHOICE_KEY, 'enabled');
    setPermission('denied');
    expect(await syncPush()).toBe('permission-lost');
  });
});
