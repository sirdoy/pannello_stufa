/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react';
import { useLogin } from '@/app/hooks/useLogin';

describe('useLogin', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('initial state is unauthenticated, not loading, no error', () => {
    const { result } = renderHook(() => useLogin());
    expect(result.current.authenticated).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.rateLimitedUntil).toBe(0);
  });

  it('login({username, password}) POSTs JSON body and sets authenticated on 200', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, data: { authenticated: true } }),
    });

    const { result } = renderHook(() => useLogin());
    let returned: boolean | undefined;
    await act(async () => {
      returned = await result.current.login({ username: 'bob', password: 'pw' });
    });

    expect(returned).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/auth/login',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ username: 'bob', password: 'pw' }),
      }),
    );
    expect(result.current.authenticated).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('login() with no args POSTs empty JSON object "{}" (env-fallback path)', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, data: { authenticated: true } }),
    });

    const { result } = renderHook(() => useLogin());
    await act(async () => {
      await result.current.login();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/auth/login',
      expect.objectContaining({
        method: 'POST',
        body: '{}',
      }),
    );
  });

  it('sets INVALID_CREDENTIALS on 401', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) });
    const { result } = renderHook(() => useLogin());
    let returned: boolean | undefined;
    await act(async () => {
      returned = await result.current.login({ username: 'bob', password: 'wrong' });
    });
    expect(returned).toBe(false);
    expect(result.current.error).toBe('INVALID_CREDENTIALS');
    expect(result.current.authenticated).toBe(false);
  });

  it('sets RATE_LIMITED + rateLimitedUntil ≈ now + 30s on 429', async () => {
    const t0 = Date.now();
    fetchMock.mockResolvedValueOnce({ ok: false, status: 429, json: async () => ({}) });
    const { result } = renderHook(() => useLogin());
    await act(async () => {
      await result.current.login({ username: 'bob', password: 'pw' });
    });
    expect(result.current.error).toBe('RATE_LIMITED');
    expect(result.current.rateLimitedUntil).toBeGreaterThanOrEqual(t0 + 29_000);
    expect(result.current.rateLimitedUntil).toBeLessThanOrEqual(t0 + 31_000);
  });

  it('lockout: second login during rate-limit window returns false without calling fetch', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 429, json: async () => ({}) });
    const { result } = renderHook(() => useLogin());
    await act(async () => {
      await result.current.login({ username: 'bob', password: 'pw' });
    });
    const callCountAfterFirst = fetchMock.mock.calls.length;

    let secondReturned: boolean | undefined;
    await act(async () => {
      secondReturned = await result.current.login({ username: 'bob', password: 'pw' });
    });
    expect(secondReturned).toBe(false);
    expect(fetchMock.mock.calls.length).toBe(callCountAfterFirst); // no new fetch
    expect(result.current.error).toBe('RATE_LIMITED');
  });

  it('sets NETWORK_ERROR when fetch rejects', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    const { result } = renderHook(() => useLogin());
    await act(async () => {
      await result.current.login({ username: 'bob', password: 'pw' });
    });
    expect(result.current.error).toBe('NETWORK_ERROR');
  });

  it('sets SERVER_ERROR on 500', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) });
    const { result } = renderHook(() => useLogin());
    await act(async () => {
      await result.current.login({ username: 'bob', password: 'pw' });
    });
    expect(result.current.error).toBe('SERVER_ERROR');
  });

  it('logout() POSTs empty JSON object to /api/auth/logout and resets authenticated', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, data: { authenticated: false } }),
    });
    const { result } = renderHook(() => useLogin());
    await act(async () => {
      await result.current.logout();
    });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/auth/logout',
      expect.objectContaining({
        method: 'POST',
        body: '{}',
      }),
    );
    expect(result.current.authenticated).toBe(false);
  });
});
