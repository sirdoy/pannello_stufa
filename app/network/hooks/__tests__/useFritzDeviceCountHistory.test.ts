import { renderHook, act, waitFor } from '@testing-library/react';
import { useFritzDeviceCountHistory } from '../useFritzDeviceCountHistory';

describe('useFritzDeviceCountHistory', () => {
  // Generate 24 hourly records for a single day
  const makeHourlyRecords = (
    dayTimestamp: number,
    baseOnline: number,
    baseOffline: number,
    baseTotal: number,
  ) =>
    Array.from({ length: 24 }, (_, hour) => ({
      day_timestamp: dayTimestamp,
      hour_bucket: hour,
      online_count: baseOnline + hour,    // varies by hour
      offline_count: baseOffline,
      total_devices: baseTotal + hour,
    }));

  // Day 1: 2024-11-14 00:00:00 UTC → timestamp 1731542400
  const day1Timestamp = 1731542400;
  // Day 2: 2024-11-15 00:00:00 UTC → timestamp 1731628800
  const day2Timestamp = 1731628800;

  const day1Records = makeHourlyRecords(day1Timestamp, 10, 5, 20);
  const day2Records = makeHourlyRecords(day2Timestamp, 15, 3, 25);

  const mock48Records = [...day1Records, ...day2Records];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with days=30 and empty chartData', () => {
    global.fetch = jest.fn().mockReturnValue(new Promise(() => {})) as jest.Mock;

    const { result } = renderHook(() => useFritzDeviceCountHistory());

    expect(result.current.days).toBe(30);
    expect(result.current.chartData).toEqual([]);
  });

  it('fetches /api/v1/fritzbox/history/devices/daily?days=30 on mount', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ deviceCounts: { items: mock48Records, total: 48 } }),
    }) as jest.Mock;

    const { result } = renderHook(() => useFritzDeviceCountHistory());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/v1/fritzbox/history/devices/daily?days=30',
    );
  });

  it('aggregates 24 hourly records per day into 2 daily DeviceCountPoints', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ deviceCounts: { items: mock48Records, total: 48 } }),
    }) as jest.Mock;

    const { result } = renderHook(() => useFritzDeviceCountHistory());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.chartData).toHaveLength(2);
  });

  it('uses max(online_count) for each day', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ deviceCounts: { items: mock48Records, total: 48 } }),
    }) as jest.Mock;

    const { result } = renderHook(() => useFritzDeviceCountHistory());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // day1 online_count: 10, 11, ..., 33 → max = 10 + 23 = 33
    const day1Point = result.current.chartData[0];
    expect(day1Point?.online).toBe(10 + 23); // max of 24 values starting at 10

    // day2 online_count: 15, 16, ..., 38 → max = 15 + 23 = 38
    const day2Point = result.current.chartData[1];
    expect(day2Point?.online).toBe(15 + 23);
  });

  it('converts day_timestamp to ms for date field', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ deviceCounts: { items: mock48Records, total: 48 } }),
    }) as jest.Mock;

    const { result } = renderHook(() => useFritzDeviceCountHistory());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.chartData[0]?.date).toBe(day1Timestamp * 1000);
    expect(result.current.chartData[1]?.date).toBe(day2Timestamp * 1000);
  });

  it('sorts chart points by date ascending', async () => {
    // Provide records in reverse day order
    const reversedRecords = [...day2Records, ...day1Records];
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ deviceCounts: { items: reversedRecords, total: 48 } }),
    }) as jest.Mock;

    const { result } = renderHook(() => useFritzDeviceCountHistory());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.chartData[0]?.date).toBeLessThan(
      result.current.chartData[1]?.date ?? 0,
    );
  });

  it('changing days triggers refetch with new days param', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ deviceCounts: { items: [], total: 0 } }),
    }) as jest.Mock;

    const { result } = renderHook(() => useFritzDeviceCountHistory());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Change days to 7
    act(() => {
      result.current.setDays(7);
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/fritzbox/history/devices/daily?days=7',
      );
    });
  });

  it('returns empty chartData on fetch error', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error')) as jest.Mock;

    const { result } = renderHook(() => useFritzDeviceCountHistory());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.chartData).toEqual([]);
  });
});
