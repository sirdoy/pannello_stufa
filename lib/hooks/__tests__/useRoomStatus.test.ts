/**
 * @jest-environment jsdom
 *
 * Tests for useRoomStatus hook
 *
 * Key behaviours under test:
 *  1. Returns rooms on success with correct shape transformation
 *  2. Sets loading=true initially and loading=false after fetch completes
 *  3. On 503 SERVICE_UNAVAILABLE: stays loading, retries, succeeds on next attempt
 *  4. On 503: retries up to MAX_RETRIES, then surfaces error after exhaustion
 *  5. On other non-ok responses: surfaces error immediately without retry
 *  6. refetch() cancels any pending retry and re-fetches immediately
 *  7. Cleanup cancels pending retry timeout on unmount
 */

import { renderHook, waitFor, configure, act } from '@testing-library/react';
import { useRoomStatus } from '../useRoomStatus';

// Disable React StrictMode for these tests to prevent double useEffect invocation
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

function make503Response(): Response {
  return {
    ok: false,
    status: 503,
    json: async () => ({
      success: false,
      error: 'Topology not yet available — waiting for first poll',
      code: 'SERVICE_UNAVAILABLE',
    }),
  } as unknown as Response;
}

function makeErrorResponse(status: number, message: string): Response {
  return {
    ok: false,
    status,
    json: async () => ({ error: message }),
  } as unknown as Response;
}

const ROOMS_PAYLOAD = {
  success: true,
  rooms: [
    {
      room_id: 'r1',
      room_name: 'Soggiorno',
      temperature: 20.5,
      therm_setpoint_temperature: 21.0,
      mode: 'schedule',
      heating_power_request: 0,
    },
    {
      room_id: 'r2',
      room_name: 'Camera',
      temperature: 18.0,
      therm_setpoint_temperature: 18.0,
      mode: 'away',
      heating_power_request: 0,
    },
  ],
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

describe('useRoomStatus', () => {
  it('returns rooms on a successful fetch with correct shape', async () => {
    mockFetch.mockResolvedValueOnce(makeOkResponse(ROOMS_PAYLOAD));

    const { result } = renderHook(() => useRoomStatus());

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.rooms).toHaveLength(2);
    expect(result.current.rooms[0]).toMatchObject({
      id: 'r1',
      name: 'Soggiorno',
      temperature: 20.5,
    });
    expect(result.current.error).toBeNull();
  });

  it('stays loading and retries on 503 SERVICE_UNAVAILABLE', async () => {
    mockFetch
      .mockResolvedValueOnce(make503Response())
      .mockResolvedValueOnce(makeOkResponse(ROOMS_PAYLOAD));

    const { result } = renderHook(() => useRoomStatus());

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();

    jest.advanceTimersByTime(3_000);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(result.current.rooms).toHaveLength(2);
    expect(result.current.error).toBeNull();
  });

  it('surfaces error after MAX_RETRIES (5) consecutive 503 responses', async () => {
    mockFetch.mockResolvedValue(make503Response());

    const { result } = renderHook(() => useRoomStatus());

    for (let i = 0; i < 5; i++) {
      await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(i + 1));
      jest.advanceTimersByTime(3_000);
    }

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBeTruthy();
    expect(result.current.error).toContain('non disponibile');
  });

  it('surfaces error immediately for non-503 errors without retrying', async () => {
    mockFetch.mockResolvedValueOnce(makeErrorResponse(500, 'Internal error'));

    const { result } = renderHook(() => useRoomStatus());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('Internal error');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('refetch cancels pending retry and re-fetches immediately', async () => {
    mockFetch
      .mockResolvedValueOnce(make503Response())
      .mockResolvedValueOnce(makeOkResponse(ROOMS_PAYLOAD));

    const { result } = renderHook(() => useRoomStatus());

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
    expect(result.current.loading).toBe(true);

    await act(async () => { await result.current.refetch(); });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(result.current.rooms).toHaveLength(2);
    expect(result.current.error).toBeNull();
  });

  it('cancels pending retry timeout on unmount', async () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

    mockFetch.mockResolvedValue(make503Response());

    const { result, unmount } = renderHook(() => useRoomStatus());

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
    expect(result.current.loading).toBe(true);

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();

    jest.advanceTimersByTime(3_000);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
