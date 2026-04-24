import { renderHook, waitFor } from '@testing-library/react';
import { useFritzSystemInfo } from '../useFritzSystemInfo';

// Mock useAdaptivePolling to call callback immediately
jest.mock('@/lib/hooks/useAdaptivePolling', () => ({
  useAdaptivePolling: ({ callback }: { callback: () => void }) => {
    callback();
  },
}));

// Mock useVisibility to return true
jest.mock('@/lib/hooks/useVisibility', () => ({
  useVisibility: () => true,
}));

describe('useFritzSystemInfo', () => {
  const mockSystemData = {
    model: 'FRITZ!Box 7590',
    firmware_version: '7.57',
    update_available: '',
    device_uptime_seconds: 86400,
    device_uptime_formatted: '1d 0h',
    is_stale: false,
    fetched_at: '2026-01-01T00:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns loading: true initially', () => {
    global.fetch = jest.fn(() =>
      new Promise(() => {}) // Never resolves — simulates pending fetch
    ) as jest.Mock;

    const { result } = renderHook(() => useFritzSystemInfo());

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.stale).toBe(false);
  });

  it('fetches from /api/v1/fritzbox/system', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ system: mockSystemData }),
    }) as jest.Mock;

    renderHook(() => useFritzSystemInfo());

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/v1/fritzbox/system');
    });
  });

  it('sets data from json.system on success', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ system: mockSystemData }),
    }) as jest.Mock;

    const { result } = renderHook(() => useFritzSystemInfo());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockSystemData);
    expect(result.current.stale).toBe(false);
  });

  it('sets stale: true on fetch error', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error')) as jest.Mock;

    const { result } = renderHook(() => useFritzSystemInfo());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stale).toBe(true);
    expect(result.current.data).toBeNull();
  });

  it('sets stale: true on non-ok response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 503,
    }) as jest.Mock;

    const { result } = renderHook(() => useFritzSystemInfo());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stale).toBe(true);
  });
});
