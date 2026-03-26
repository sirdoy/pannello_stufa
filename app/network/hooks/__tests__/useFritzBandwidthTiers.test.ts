import { renderHook, act, waitFor } from '@testing-library/react';
import { useFritzBandwidthTiers } from '../useFritzBandwidthTiers';

describe('useFritzBandwidthTiers', () => {
  const mockHourlyItems = [
    {
      hour_timestamp: 1700000000, // Unix seconds
      avg_downstream_rate: 10_000_000, // 10 Mbps in bps
      min_downstream_rate: 5_000_000,
      max_downstream_rate: 20_000_000,
      avg_upstream_rate: 2_000_000, // 2 Mbps in bps
      min_upstream_rate: 1_000_000,
      max_upstream_rate: 5_000_000,
      total_downstream_bytes: 1000000,
      total_upstream_bytes: 200000,
      sample_count: 60,
    },
    {
      hour_timestamp: 1700003600, // 1 hour later
      avg_downstream_rate: 15_000_000,
      min_downstream_rate: 8_000_000,
      max_downstream_rate: 25_000_000,
      avg_upstream_rate: 3_000_000,
      min_upstream_rate: 1_500_000,
      max_upstream_rate: 6_000_000,
      total_downstream_bytes: 2000000,
      total_upstream_bytes: 300000,
      sample_count: 60,
    },
  ];

  const mockDailyItems = [
    {
      day_timestamp: 1699920000, // Unix seconds (day boundary)
      avg_downstream_rate: 20_000_000,
      min_downstream_rate: 5_000_000,
      max_downstream_rate: 50_000_000,
      avg_upstream_rate: 4_000_000,
      min_upstream_rate: 1_000_000,
      max_upstream_rate: 10_000_000,
      total_downstream_bytes: 50000000,
      total_upstream_bytes: 10000000,
      sample_count: 1440,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with tier "realtime" and empty tierData', () => {
    const { result } = renderHook(() => useFritzBandwidthTiers());

    expect(result.current.tier).toBe('realtime');
    expect(result.current.tierData).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('clears tierData when tier is "realtime"', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ hourly: { items: mockHourlyItems, total: 2 } }),
    }) as jest.Mock;

    const { result } = renderHook(() => useFritzBandwidthTiers());

    // Switch to hourly first
    act(() => {
      result.current.setTier('hourly');
    });

    await waitFor(() => {
      expect(result.current.tierData.length).toBeGreaterThan(0);
    });

    // Switch back to realtime
    act(() => {
      result.current.setTier('realtime');
    });

    expect(result.current.tierData).toEqual([]);
  });

  it('fetches /hourly?days=7 for hourly tier', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ hourly: { items: mockHourlyItems, total: 2 } }),
    }) as jest.Mock;

    const { result } = renderHook(() => useFritzBandwidthTiers());

    act(() => {
      result.current.setTier('hourly');
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/fritzbox/history/bandwidth/hourly?days=7');
  });

  it('fetches /daily?days=30 for daily tier', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ daily: { items: mockDailyItems, total: 1 } }),
    }) as jest.Mock;

    const { result } = renderHook(() => useFritzBandwidthTiers());

    act(() => {
      result.current.setTier('daily');
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/fritzbox/history/bandwidth/daily?days=30');
  });

  it('transforms bps to Mbps and seconds to ms for hourly data', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ hourly: { items: mockHourlyItems, total: 2 } }),
    }) as jest.Mock;

    const { result } = renderHook(() => useFritzBandwidthTiers());

    act(() => {
      result.current.setTier('hourly');
    });

    await waitFor(() => {
      expect(result.current.tierData.length).toBe(2);
    });

    // First item: hour_timestamp: 1700000000 -> time: 1700000000000 (ms)
    // avg_downstream_rate: 10_000_000 bps -> download: 10 Mbps
    // avg_upstream_rate: 2_000_000 bps -> upload: 2 Mbps
    const firstPoint = result.current.tierData[0];
    expect(firstPoint?.time).toBe(1700000000 * 1000);
    expect(firstPoint?.download).toBe(10);
    expect(firstPoint?.upload).toBe(2);
  });

  it('transforms bps to Mbps and seconds to ms for daily data', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ daily: { items: mockDailyItems, total: 1 } }),
    }) as jest.Mock;

    const { result } = renderHook(() => useFritzBandwidthTiers());

    act(() => {
      result.current.setTier('daily');
    });

    await waitFor(() => {
      expect(result.current.tierData.length).toBe(1);
    });

    const firstPoint = result.current.tierData[0];
    expect(firstPoint?.time).toBe(1699920000 * 1000);
    expect(firstPoint?.download).toBe(20);
    expect(firstPoint?.upload).toBe(4);
  });

  it('returns empty tierData on fetch error', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error')) as jest.Mock;

    const { result } = renderHook(() => useFritzBandwidthTiers());

    act(() => {
      result.current.setTier('hourly');
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.tierData).toEqual([]);
  });

  it('sorts chart points by time ascending', async () => {
    // Reverse order in API response
    const reversedItems = [...mockHourlyItems].reverse();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ hourly: { items: reversedItems, total: 2 } }),
    }) as jest.Mock;

    const { result } = renderHook(() => useFritzBandwidthTiers());

    act(() => {
      result.current.setTier('hourly');
    });

    await waitFor(() => {
      expect(result.current.tierData.length).toBe(2);
    });

    expect(result.current.tierData[0]?.time).toBeLessThan(result.current.tierData[1]?.time ?? 0);
  });

  // --- 'auto' tier tests ---

  const mockAutoItems = [
    { timestamp: 1700000000, granularity: 'hourly', avg_downstream_rate: 10_000_000, avg_upstream_rate: 2_000_000 },
    { timestamp: 1700003600, granularity: 'hourly', avg_downstream_rate: 15_000_000, avg_upstream_rate: 3_000_000 },
  ];

  it('fetches /api/fritzbox/history/bandwidth/auto?days=7 for auto tier', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ auto: { items: mockAutoItems, total: 2 } }),
    }) as jest.Mock;

    const { result } = renderHook(() => useFritzBandwidthTiers());

    act(() => {
      result.current.setTier('auto');
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/fritzbox/history/bandwidth/auto?days=7');
  });

  it('maps timestamp (not hour_timestamp) to chart points for auto tier', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ auto: { items: mockAutoItems, total: 2 } }),
    }) as jest.Mock;

    const { result } = renderHook(() => useFritzBandwidthTiers());

    act(() => {
      result.current.setTier('auto');
    });

    await waitFor(() => {
      expect(result.current.tierData.length).toBe(2);
    });

    // timestamp: 1700000000 → time: 1700000000 * 1000 ms
    const firstPoint = result.current.tierData[0];
    expect(firstPoint?.time).toBe(1700000000 * 1000);
    // avg_downstream_rate: 10_000_000 bps → 10 Mbps
    expect(firstPoint?.download).toBe(10);
    // avg_upstream_rate: 2_000_000 bps → 2 Mbps
    expect(firstPoint?.upload).toBe(2);
  });

  it('sets autoGranularity from first item granularity field', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ auto: { items: mockAutoItems, total: 2 } }),
    }) as jest.Mock;

    const { result } = renderHook(() => useFritzBandwidthTiers());

    act(() => {
      result.current.setTier('auto');
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.autoGranularity).toBe('hourly');
  });

  it('resets autoGranularity to null when switching from auto to realtime', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ auto: { items: mockAutoItems, total: 2 } }),
    }) as jest.Mock;

    const { result } = renderHook(() => useFritzBandwidthTiers());

    // Switch to auto first
    act(() => {
      result.current.setTier('auto');
    });

    await waitFor(() => {
      expect(result.current.autoGranularity).toBe('hourly');
    });

    // Switch back to realtime
    act(() => {
      result.current.setTier('realtime');
    });

    expect(result.current.autoGranularity).toBeNull();
  });

  it('returns empty tierData and null autoGranularity on auto fetch error', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error')) as jest.Mock;

    const { result } = renderHook(() => useFritzBandwidthTiers());

    act(() => {
      result.current.setTier('auto');
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.tierData).toEqual([]);
    expect(result.current.autoGranularity).toBeNull();
  });

  it('initializes with null autoGranularity', () => {
    const { result } = renderHook(() => useFritzBandwidthTiers());

    expect(result.current.autoGranularity).toBeNull();
  });
});
