import { renderHook, waitFor } from '@testing-library/react';
import { useFritzDevicePresenceHistory } from '../useFritzDevicePresenceHistory';

let mockAdaptivePollingInterval: number | null = null;

jest.mock('@/lib/hooks/useAdaptivePolling', () => ({
  useAdaptivePolling: ({ callback, interval }: { callback: () => void; interval: number | null }) => {
    mockAdaptivePollingInterval = interval;
    if (interval !== null) {
      callback();
    }
  },
}));

jest.mock('@/lib/hooks/useVisibility', () => ({
  useVisibility: () => true,
}));

describe('useFritzDevicePresenceHistory', () => {
  const sample = [
    { timestamp: 1713700000, mac: 'AA:BB:CC:DD:EE:FF', name: 'laptop', ip: '192.168.1.100', is_online: true },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockAdaptivePollingInterval = null;
  });

  it('loads presence items on success', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ devices: { items: sample, total_count: 1, limit: 100, offset: 0 } }),
    }) as jest.Mock;

    const { result } = renderHook(() => useFritzDevicePresenceHistory());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.notFound).toBe(false);
    expect(result.current.stale).toBe(false);
  });

  it('sets stale=true on non-OK 500 response', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500, json: () => Promise.resolve({}) }) as jest.Mock;

    const { result } = renderHook(() => useFritzDevicePresenceHistory());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stale).toBe(true);
    expect(result.current.items).toEqual([]);
    expect(result.current.notFound).toBe(false);
  });

  it('stops polling (interval: null) when paused', () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ devices: { items: [], total_count: 0, limit: 100, offset: 0 } }),
    }) as jest.Mock;

    renderHook(() => useFritzDevicePresenceHistory({ paused: true }));

    expect(mockAdaptivePollingInterval).toBeNull();
  });

  it('degrades gracefully on 404: notFound=true, stale=true, items=[], NEVER throws (Pitfall 1)', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404, json: () => Promise.resolve({}) }) as jest.Mock;

    // Must not throw during render.
    expect(() => renderHook(() => useFritzDevicePresenceHistory())).not.toThrow();

    const { result } = renderHook(() => useFritzDevicePresenceHistory());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.notFound).toBe(true);
    expect(result.current.stale).toBe(true);
    expect(result.current.items).toEqual([]);
    expect(result.current.totalCount).toBe(0);
  });

  it('builds URL with limit/offset only (no hours param for this endpoint)', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ devices: { items: [], total_count: 0, limit: 100, offset: 0 } }),
    }) as jest.Mock;

    renderHook(() => useFritzDevicePresenceHistory());

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    const fetchUrl = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(fetchUrl).toContain('/api/v1/fritzbox/history/devices');
    expect(fetchUrl).toContain('limit=100');
    expect(fetchUrl).toContain('offset=0');
    expect(fetchUrl).not.toContain('hours=');
  });
});
