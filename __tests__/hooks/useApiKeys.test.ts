/**
 * @jest-environment jsdom
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import { useApiKeys } from '@/app/hooks/useApiKeys';

const SAMPLE_KEYS = [
  {
    id: 1,
    name: 'Prod',
    created_at: '2026-04-20T10:00:00Z',
    last_used_at: '2026-04-22T12:00:00Z',
    is_active: true,
  },
  {
    id: 2,
    name: 'CI',
    created_at: '2026-04-15T10:00:00Z',
    last_used_at: null,
    is_active: false,
  },
];

/**
 * URL-dispatched fetch mock. Returns a different response per URL+method.
 * Robust to React StrictMode double-invocation of useEffect (tests config
 * enables strict mode — see jest.setup.ts `reactStrictMode: true`).
 */
function makeFetchMock(
  handlers: Record<
    string,
    { ok: boolean; status: number; json?: () => Promise<unknown> }
  >,
): jest.Mock {
  return jest.fn((url: string, init?: RequestInit) => {
    const method = (init?.method ?? 'GET').toUpperCase();
    const key = `${method} ${url}`;
    const response = handlers[key];
    if (!response) {
      return Promise.reject(new Error(`Unmocked fetch call: ${key}`));
    }
    return Promise.resolve({
      ok: response.ok,
      status: response.status,
      json: response.json ?? (async () => ({})),
    });
  });
}

describe('useApiKeys', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('fetches keys on mount via GET /api/auth/api-keys', async () => {
    const fetchMock = makeFetchMock({
      'GET /api/auth/api-keys': {
        ok: true,
        status: 200,
        json: async () => ({ keys: SAMPLE_KEYS, count: 2 }),
      },
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const { result } = renderHook(() => useApiKeys());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/auth/api-keys',
      expect.objectContaining({ method: 'GET' }),
    );
    expect(result.current.keys).toEqual(SAMPLE_KEYS);
    expect(result.current.error).toBeNull();
  });

  it('sets SESSION_EXPIRED on 401 from GET', async () => {
    const fetchMock = makeFetchMock({
      'GET /api/auth/api-keys': { ok: false, status: 401 },
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const { result } = renderHook(() => useApiKeys());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('SESSION_EXPIRED');
    expect(result.current.keys).toEqual([]);
  });

  it('sets Italian error on 500 from GET', async () => {
    const fetchMock = makeFetchMock({
      'GET /api/auth/api-keys': { ok: false, status: 500 },
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const { result } = renderHook(() => useApiKeys());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('Errore nel caricamento delle API key');
  });

  it('create(name) POSTs {name} and returns APIKeyResponse plaintext', async () => {
    const fetchMock = makeFetchMock({
      'GET /api/auth/api-keys': {
        ok: true,
        status: 200,
        json: async () => ({ keys: [], count: 0 }),
      },
      'POST /api/auth/api-keys': {
        ok: true,
        status: 201,
        json: async () => ({
          ok: true,
          created: true,
          data: {
            id: 3,
            name: 'New',
            api_key: 'ha_live_abc123xyz',
            created_at: '2026-04-23T00:00:00Z',
          },
        }),
      },
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const { result } = renderHook(() => useApiKeys());
    await waitFor(() => expect(result.current.loading).toBe(false));

    let plaintext: string | undefined;
    await act(async () => {
      const res = await result.current.create('New');
      plaintext = res.api_key;
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/auth/api-keys',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ name: 'New' }),
      }),
    );
    expect(plaintext).toBe('ha_live_abc123xyz');
    // Caller is responsible for refetching after reveal modal close — hook does NOT auto-refetch here
  });

  it('create() throws on non-ok response (caller surfaces via FormModal ErrorSummary)', async () => {
    const fetchMock = makeFetchMock({
      'GET /api/auth/api-keys': {
        ok: true,
        status: 200,
        json: async () => ({ keys: [], count: 0 }),
      },
      'POST /api/auth/api-keys': { ok: false, status: 500 },
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const { result } = renderHook(() => useApiKeys());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await expect(result.current.create('fail')).rejects.toThrow();
  });

  it('revoke(id) DELETEs /api/auth/api-keys/{id} and refetches on 204', async () => {
    // Dynamic: after revoke, next GET returns a list with only the second key.
    let revoked = false;
    const fetchMock = jest.fn((url: string, init?: RequestInit) => {
      const method = (init?.method ?? 'GET').toUpperCase();
      if (method === 'GET' && url === '/api/auth/api-keys') {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () =>
            revoked ? { keys: [SAMPLE_KEYS[1]!], count: 1 } : { keys: SAMPLE_KEYS, count: 2 },
        });
      }
      if (method === 'DELETE' && url === '/api/auth/api-keys/1') {
        revoked = true;
        return Promise.resolve({ ok: true, status: 204, json: async () => ({}) });
      }
      return Promise.reject(new Error(`Unmocked: ${method} ${url}`));
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const { result } = renderHook(() => useApiKeys());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await waitFor(() => expect(result.current.keys).toHaveLength(2));

    await act(async () => {
      await result.current.revoke(1);
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/auth/api-keys/1',
      expect.objectContaining({ method: 'DELETE' }),
    );
    await waitFor(() => expect(result.current.keys).toHaveLength(1));
  });

  it('revoke() treats 404 as already-revoked (no throw, still refetches)', async () => {
    let revoked = false;
    const fetchMock = jest.fn((url: string, init?: RequestInit) => {
      const method = (init?.method ?? 'GET').toUpperCase();
      if (method === 'GET' && url === '/api/auth/api-keys') {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () =>
            revoked ? { keys: [], count: 0 } : { keys: SAMPLE_KEYS, count: 2 },
        });
      }
      if (method === 'DELETE' && url === '/api/auth/api-keys/99') {
        revoked = true;
        return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
      }
      return Promise.reject(new Error(`Unmocked: ${method} ${url}`));
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const { result } = renderHook(() => useApiKeys());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await waitFor(() => expect(result.current.keys).toHaveLength(2));

    await act(async () => {
      await result.current.revoke(99); // does NOT throw
    });
    await waitFor(() => expect(result.current.keys).toHaveLength(0));
  });

  it('revoke() throws on 500', async () => {
    const fetchMock = makeFetchMock({
      'GET /api/auth/api-keys': {
        ok: true,
        status: 200,
        json: async () => ({ keys: SAMPLE_KEYS, count: 2 }),
      },
      'DELETE /api/auth/api-keys/1': { ok: false, status: 500 },
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const { result } = renderHook(() => useApiKeys());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await expect(result.current.revoke(1)).rejects.toThrow();
  });
});
