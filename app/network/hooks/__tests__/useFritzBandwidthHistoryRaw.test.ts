import { renderHook, waitFor } from '@testing-library/react';
import { useFritzBandwidthHistoryRaw } from '../useFritzBandwidthHistoryRaw';

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

describe('useFritzBandwidthHistoryRaw', () => {
  const sample = [
    {
      timestamp: 1713700000,
      bytes_sent: 2100000,
      bytes_received: 4200000,
      upstream_rate: 1500000,
      downstream_rate: 8000000,
      latency_ms: 12,
      connection_uptime: 86400,
      external_ip: '203.0.113.5',
      connection_type: 'PPPoE',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockAdaptivePollingInterval = null;
  });

  it('loads bandwidth items on success', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ bandwidth: { items: sample, total_count: 1, limit: 100, offset: 0 } }),
    }) as jest.Mock;

    const { result } = renderHook(() => useFritzBandwidthHistoryRaw());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.totalCount).toBe(1);
    expect(result.current.stale).toBe(false);
  });

  it('sets stale=true and items=[] on non-OK response (500)', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500, json: () => Promise.resolve({}) }) as jest.Mock;

    const { result } = renderHook(() => useFritzBandwidthHistoryRaw());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stale).toBe(true);
    expect(result.current.items).toEqual([]);
    expect(result.current.totalCount).toBe(0);
  });

  it('stops polling (interval: null) when paused', () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ bandwidth: { items: [], total_count: 0, limit: 100, offset: 0 } }),
    }) as jest.Mock;

    renderHook(() => useFritzBandwidthHistoryRaw({ paused: true }));

    expect(mockAdaptivePollingInterval).toBeNull();
  });

  it("forwards hours '7d' as hours=168 in the URL", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ bandwidth: { items: [], total_count: 0, limit: 100, offset: 0 } }),
    }) as jest.Mock;

    const { result } = renderHook(() => useFritzBandwidthHistoryRaw({ hours: '7d' }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const fetchUrl = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(fetchUrl).toContain('/api/v1/fritzbox/history/bandwidth');
    expect(fetchUrl).toContain('hours=168');
    expect(fetchUrl).toContain('limit=100');
    expect(fetchUrl).toContain('offset=0');
  });

  it('resets offset=0 when hours changes', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ bandwidth: { items: [], total_count: 0, limit: 100, offset: 0 } }),
    }) as jest.Mock;

    const { rerender, result } = renderHook(
      ({ hours }: { hours: '1h' | '24h' | '7d' }) => useFritzBandwidthHistoryRaw({ hours }),
      { initialProps: { hours: '24h' as const } }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    (global.fetch as jest.Mock).mockClear();

    rerender({ hours: '7d' as const });

    await waitFor(() => {
      expect((global.fetch as jest.Mock).mock.calls.length).toBeGreaterThan(0);
    });

    const lastUrl = (global.fetch as jest.Mock).mock.calls.at(-1)[0] as string;
    expect(lastUrl).toContain('hours=168');
    expect(lastUrl).toContain('offset=0');
  });
});
