/**
 * Tests for useWeatherSummary hook (Phase 177 / DASH-06 enabling).
 *
 * Validates initial loading state, populated summary after fetch resolves,
 * and graceful failure on fetch rejection. Read-only — no setpoints, no
 * commands. Mocks subscribeToLocation to fire its callback synchronously
 * with deterministic coords + city name.
 */

// Mock dependencies (mocks before imports — Phase 92 pattern)
jest.mock('@/lib/services/locationService', () => ({
  subscribeToLocation: jest.fn(),
}));

import { renderHook, waitFor, act } from '@testing-library/react';
import { subscribeToLocation } from '@/lib/services/locationService';
import { useWeatherSummary } from '../useWeatherSummary';

const mockedSubscribe = subscribeToLocation as jest.MockedFunction<
  typeof subscribeToLocation
>;

// Forecast payload matches the shape returned by /api/weather/forecast
// (consumed by app/components/weather/WeatherCardWrapper.tsx).
const okForecast = {
  current: {
    temperature: 18.4,
    condition: { description: 'Sereno' },
  },
  forecast: [
    { date: '2026-04-28', tempMax: 22.1, tempMin: 9.8, weatherCode: 0 },
  ],
};

const mockUnsubscribe = jest.fn();
const originalFetch = global.fetch;

beforeEach(() => {
  mockedSubscribe.mockReset();
  mockUnsubscribe.mockReset();
  // Default fetch stub — individual tests override via mockResolvedValueOnce / mockRejectedValueOnce.
  global.fetch = jest.fn() as unknown as typeof fetch;
});

afterEach(() => {
  global.fetch = originalFetch;
});

describe('useWeatherSummary (Phase 177 — DASH-06)', () => {
  test('initial render returns loading=true with all fields null', () => {
    // subscribeToLocation never fires its callback → stays in initial state
    mockedSubscribe.mockImplementation(() => mockUnsubscribe);

    const { result } = renderHook(() => useWeatherSummary());

    expect(result.current.loading).toBe(true);
    expect(result.current.city).toBeNull();
    expect(result.current.temp).toBeNull();
    expect(result.current.condition).toBeNull();
    expect(result.current.high).toBeNull();
    expect(result.current.low).toBeNull();
  });

  test('after fetch resolves, returns the populated summary', async () => {
    mockedSubscribe.mockImplementation((cb) => {
      cb({
        latitude: 45.4642,
        longitude: 9.19,
        name: 'Milano',
        updatedAt: 0,
      });
      return mockUnsubscribe;
    });

    // Use mockResolvedValue (not Once) — React StrictMode (jest.setup.ts) double-invokes
    // useEffect in tests, so the hook may issue two fetches. Both should land on okForecast.
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(okForecast),
    } as Response);

    const { result } = renderHook(() => useWeatherSummary());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/weather/forecast?lat=45.4642&lon=9.19'),
    );
    expect(result.current.city).toBe('Milano');
    expect(result.current.temp).toBe(18.4);
    expect(result.current.condition).toBe('Sereno');
    expect(result.current.high).toBe(22.1);
    expect(result.current.low).toBe(9.8);
  });

  test('on fetch rejection, loading flips to false and fields stay null', async () => {
    mockedSubscribe.mockImplementation((cb) => {
      cb({
        latitude: 1,
        longitude: 2,
        name: 'Nowhere',
        updatedAt: 0,
      });
      return mockUnsubscribe;
    });

    // Use mockRejectedValue (not Once) — React StrictMode double-mount triggers two fetch
    // attempts; both should reject. Hook flips loading=false, fields stay null.
    (global.fetch as jest.Mock).mockRejectedValue(new Error('network down'));

    const { result } = renderHook(() => useWeatherSummary());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.city).toBeNull();
    expect(result.current.temp).toBeNull();
    expect(result.current.condition).toBeNull();
    expect(result.current.high).toBeNull();
    expect(result.current.low).toBeNull();
  });

  test('calls the unsubscribe function on unmount', () => {
    mockedSubscribe.mockImplementation(() => mockUnsubscribe);

    const { unmount } = renderHook(() => useWeatherSummary());
    const beforeUnmount = mockUnsubscribe.mock.calls.length;
    unmount();
    // Final unmount must trigger at least one additional unsubscribe call.
    // (Under React StrictMode the cleanup also fires once during the
    // intentional double-mount, so the total may be 2.)
    expect(mockUnsubscribe.mock.calls.length).toBeGreaterThan(beforeUnmount);
  });

  test('handles location with no coordinates (loading flips to false, no fetch)', async () => {
    mockedSubscribe.mockImplementation((cb) => {
      cb(null);
      return mockUnsubscribe;
    });

    const { result } = renderHook(() => useWeatherSummary());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(global.fetch).not.toHaveBeenCalled();
    expect(result.current.temp).toBeNull();
  });
});
