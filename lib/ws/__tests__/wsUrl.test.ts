import { createWsUrlResolver } from '../wsUrl';

describe('createWsUrlResolver', () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('fetches a fresh token on every call and builds the /ws/live URL', async () => {
    let n = 0;
    global.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({ query: `token=t${++n}` }),
    })) as unknown as typeof fetch;

    const resolve = createWsUrlResolver('wss://pi.example/');
    expect(await resolve()).toBe('wss://pi.example/ws/live?token=t1');
    expect(await resolve()).toBe('wss://pi.example/ws/live?token=t2');
    expect(global.fetch).toHaveBeenCalledWith('/api/ws-token', { cache: 'no-store' });
  });

  it('throws on a failed token request so the hook retries with backoff', async () => {
    global.fetch = jest.fn(async () => ({ ok: false, status: 401 })) as unknown as typeof fetch;
    await expect(createWsUrlResolver('wss://pi.example')()).rejects.toThrow('ws-token 401');
  });
});
