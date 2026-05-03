import { renderHook, waitFor } from '@testing-library/react';
import { useFritzDeviceEventsRaw } from '../useFritzDeviceEventsRaw';

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

describe('useFritzDeviceEventsRaw', () => {
  const sample = [
    {
      timestamp: 1713700000,
      mac: 'AA:BB:CC:DD:EE:FF',
      name: 'laptop',
      ip: '192.168.1.100',
      event_type: 'connected' as const,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockAdaptivePollingInterval = null;
  });

  it('loads events on success', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ events: { items: sample, total_count: 1, limit: 100, offset: 0 } }),
    }) as jest.Mock;

    const { result } = renderHook(() => useFritzDeviceEventsRaw());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]!.event_type).toBe('connected');
    expect(result.current.stale).toBe(false);
  });

  it('sets stale=true on non-OK response', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500, json: () => Promise.resolve({}) }) as jest.Mock;

    const { result } = renderHook(() => useFritzDeviceEventsRaw());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stale).toBe(true);
    expect(result.current.items).toEqual([]);
  });

  it('stops polling when paused', () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ events: { items: [], total_count: 0, limit: 100, offset: 0 } }),
    }) as jest.Mock;

    renderHook(() => useFritzDeviceEventsRaw({ paused: true }));

    expect(mockAdaptivePollingInterval).toBeNull();
  });

  it("forwards hours '1h' as hours=1 in URL", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ events: { items: [], total_count: 0, limit: 100, offset: 0 } }),
    }) as jest.Mock;

    renderHook(() => useFritzDeviceEventsRaw({ hours: '1h' }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    const fetchUrl = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(fetchUrl).toContain('hours=1');
    expect(fetchUrl).toContain('limit=100');
    expect(fetchUrl).toContain('offset=0');
  });

  it('never forwards a mac param when not provided (base URL has only hours/limit/offset)', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ events: { items: [], total_count: 0, limit: 100, offset: 0 } }),
    }) as jest.Mock;

    renderHook(() => useFritzDeviceEventsRaw());

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    const fetchUrl = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(fetchUrl).toContain('/api/v1/fritzbox/history/device-events');
    expect(fetchUrl).not.toContain('mac=');
  });
});
