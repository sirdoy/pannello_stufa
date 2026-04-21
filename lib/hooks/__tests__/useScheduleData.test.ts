/**
 * @jest-environment jsdom
 *
 * Tests for useScheduleData hook
 *
 * Key behaviours under test:
 *  1. Returns schedules and homeId on success
 *  2. Sets loading=true initially and loading=false after fetch completes
 *  3. On 503 SERVICE_UNAVAILABLE: stays loading, retries, succeeds on next attempt
 *  4. On 503: retries up to MAX_RETRIES, then surfaces error after exhaustion
 *  5. On 429: surfaces rate-limit error immediately without retry
 *  6. On other non-ok responses: surfaces error immediately without retry
 *  7. refetch() cancels any pending retry and re-fetches immediately
 *  8. Cleanup cancels pending retry timeout on unmount
 */

import { renderHook, waitFor, configure, act } from '@testing-library/react';
import { useScheduleData } from '../useScheduleData';

// Disable React StrictMode for these tests to prevent double useEffect invocation
// (which would cause fetch to be called twice, breaking call-count assertions)
configure({ reactStrictMode: false });

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeOkResponse(body: object): Response {
  return {
    ok: true,
    status: 200,
    json: async () => body,
  } as unknown as Response;
}

function make503Response(message = 'Topology not yet available — waiting for first poll'): Response {
  return {
    ok: false,
    status: 503,
    json: async () => ({
      success: false,
      error: message,
      code: 'SERVICE_UNAVAILABLE',
    }),
  } as unknown as Response;
}

function make429Response(): Response {
  return {
    ok: false,
    status: 429,
    json: async () => ({ retryAfter: 30 }),
  } as unknown as Response;
}

function makeErrorResponse(status: number, message: string): Response {
  return {
    ok: false,
    status,
    json: async () => ({ error: message }),
  } as unknown as Response;
}

// Phase 168 Plan 02 D-04: legacy /schedules endpoint dropped. useScheduleData now
// reads NETATMO_ROUTES.homesData (v1 /api/v1/netatmo/homesdata) and extracts the
// schedules array from the raw-proxy shape: { body: { homes: [{ id, schedules }] } }.
const SCHEDULES_PAYLOAD = {
  body: {
    homes: [
      {
        id: 'home123',
        schedules: [
          { id: 's1', name: 'Default', selected: true },
          { id: 's2', name: 'Night', selected: false },
        ],
      },
    ],
  },
};

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.useFakeTimers();
  mockFetch.mockReset();
});

afterEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useScheduleData', () => {
  it('returns schedules and homeId on a successful fetch', async () => {
    mockFetch.mockResolvedValueOnce(makeOkResponse(SCHEDULES_PAYLOAD));

    const { result } = renderHook(() => useScheduleData());

    // Initially loading
    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.schedules).toHaveLength(2);
    expect(result.current.homeId).toBe('home123');
    expect(result.current.source).toBe('api');
    expect(result.current.error).toBeNull();
  });

  it('derives activeSchedule from the schedule with selected=true', async () => {
    mockFetch.mockResolvedValueOnce(makeOkResponse(SCHEDULES_PAYLOAD));

    const { result } = renderHook(() => useScheduleData());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.activeSchedule).toMatchObject({ id: 's1', selected: true });
  });

  it('stays loading and retries on 503 SERVICE_UNAVAILABLE', async () => {
    // First call: 503; second call: success
    mockFetch
      .mockResolvedValueOnce(make503Response())
      .mockResolvedValueOnce(makeOkResponse(SCHEDULES_PAYLOAD));

    const { result } = renderHook(() => useScheduleData());

    // After the first (failed) fetch resolves, loading should still be true (retry pending)
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();

    // Advance timers to trigger the retry
    jest.advanceTimersByTime(3_000);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(result.current.schedules).toHaveLength(2);
    expect(result.current.error).toBeNull();
  });

  it('surfaces error after MAX_RETRIES (5) consecutive 503 responses', async () => {
    // 6 failures total (initial + 5 retries)
    mockFetch.mockResolvedValue(make503Response());

    const { result } = renderHook(() => useScheduleData());

    // Advance through all 5 retry intervals
    for (let i = 0; i < 5; i++) {
      await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(i + 1));
      jest.advanceTimersByTime(3_000);
    }

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBeTruthy();
    expect(result.current.error).toContain('non disponibile');
  });

  it('surfaces rate-limit error immediately without retrying (429)', async () => {
    mockFetch.mockResolvedValueOnce(make429Response());

    const { result } = renderHook(() => useScheduleData());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toMatch(/Limite API raggiunto/);
    // Only one fetch — no retry
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('surfaces error immediately for other non-ok responses', async () => {
    mockFetch.mockResolvedValueOnce(makeErrorResponse(500, 'Internal Server Error'));

    const { result } = renderHook(() => useScheduleData());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('Internal Server Error');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('refetch cancels any pending retry and re-fetches immediately', async () => {
    // First call: 503 (retry pending after 3s); then immediate refetch should succeed
    mockFetch
      .mockResolvedValueOnce(make503Response())
      .mockResolvedValueOnce(makeOkResponse(SCHEDULES_PAYLOAD));

    const { result } = renderHook(() => useScheduleData());

    // Wait for the first fetch to complete (503)
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
    expect(result.current.loading).toBe(true);

    // Manually refetch — should cancel the pending 3s retry
    await act(async () => { await result.current.refetch(); });

    await waitFor(() => expect(result.current.loading).toBe(false));

    // The retry should NOT have fired (still only 2 total fetches)
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(result.current.schedules).toHaveLength(2);
    expect(result.current.error).toBeNull();
  });

  it('cancels pending retry timeout on unmount', async () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

    mockFetch.mockResolvedValue(make503Response());

    const { result, unmount } = renderHook(() => useScheduleData());

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
    // Retry is now scheduled — loading still true
    expect(result.current.loading).toBe(true);

    unmount();

    // clearTimeout should have been called to cancel the retry
    expect(clearTimeoutSpy).toHaveBeenCalled();

    // No additional fetches after unmount even if we advance timers
    jest.advanceTimersByTime(3_000);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
