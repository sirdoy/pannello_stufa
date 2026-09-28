/**
 * Tests for useNewVersion (M17)
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import { useNewVersion, VERSION_CHECK_MIN_GAP_MS } from '../useNewVersion';
import { FRONTEND_BUILD_ID } from '@/lib/buildVersion';

function respond(backend: string | null) {
  return { ok: true, json: async () => ({ frontend: FRONTEND_BUILD_ID, backend }) } as Response;
}

describe('useNewVersion', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    jest.useFakeTimers();
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('checks on mount and stays quiet when nothing changed', async () => {
    fetchMock.mockResolvedValue(respond('a1'));
    const { result } = renderHook(() => useNewVersion());
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/version', { cache: 'no-store' }));
    expect(result.current.updateAvailable).toBe(false);
  });

  it('flags a backend deploy seen after the baseline', async () => {
    fetchMock.mockResolvedValueOnce(respond('a1')).mockResolvedValueOnce(respond('b2'));
    const { result } = renderHook(() => useNewVersion());
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    act(() => {
      jest.advanceTimersByTime(VERSION_CHECK_MIN_GAP_MS + 1);
    });
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    await waitFor(() => expect(result.current.updateAvailable).toBe(true));
  });

  it('throttles bursts of triggers', async () => {
    fetchMock.mockResolvedValue(respond('a1'));
    renderHook(() => useNewVersion());
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'));
      window.dispatchEvent(new Event('pageshow'));
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('re-checks immediately when the live connection re-opens', async () => {
    fetchMock.mockResolvedValueOnce(respond('a1')).mockResolvedValueOnce(respond('b2'));
    const { result, rerender } = renderHook(({ connected }) => useNewVersion(connected), {
      initialProps: { connected: true },
    });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    rerender({ connected: false });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    rerender({ connected: true });

    await waitFor(() => expect(result.current.updateAvailable).toBe(true));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('ignores network errors', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));
    const { result } = renderHook(() => useNewVersion());
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(result.current.updateAvailable).toBe(false);
  });
});
