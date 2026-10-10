/**
 * useHouseStatus spec (ROADMAP M84): rooms of the Pi with their devices.
 *
 * Runs the real `useAdaptivePolling`, so the first read on mount and the refresh every minute are
 * part of what is tested.
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import { useHouseStatus } from '../useHouseStatus';
import type { HouseStatusResponse, RoomStatusResponse } from '@/types/rooms';

const mockFetch = jest.fn();

function room(id: number, name: string): RoomStatusResponse {
  return {
    room_id: id,
    room_name: name,
    devices: [],
    device_count: 0,
    available_count: 0,
    unavailable_count: 0,
  };
}

function house(rooms: RoomStatusResponse[]): HouseStatusResponse {
  return { rooms, total_devices: 0, total_available: 0, total_unavailable: 0 };
}

function okResponse(body: unknown): Response {
  return { ok: true, status: 200, json: async () => body } as unknown as Response;
}

function failedResponse(status: number): Response {
  return { ok: false, status, json: async () => ({}) } as unknown as Response;
}

beforeEach(() => {
  mockFetch.mockReset();
  global.fetch = mockFetch;
});

afterEach(() => {
  jest.useRealTimers();
});

describe('useHouseStatus', () => {
  it('starts loading, with no rooms and no error', () => {
    mockFetch.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useHouseStatus());
    expect(result.current).toMatchObject({ rooms: null, loading: true, error: null });
  });

  it('reads the rooms from /api/rooms/house/status on mount', async () => {
    const rooms = [room(1, 'Sala'), room(2, 'Cucina')];
    mockFetch.mockResolvedValue(okResponse(house(rooms)));

    const { result } = renderHook(() => useHouseStatus());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith('/api/rooms/house/status');
    expect(result.current.rooms).toEqual(rooms);
    expect(result.current.error).toBeNull();
  });

  it('a body without rooms is an empty house, not an error', async () => {
    mockFetch.mockResolvedValue(okResponse({}));
    const { result } = renderHook(() => useHouseStatus());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.rooms).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('reports "Stanze non disponibili" when the first read fails with an HTTP error', async () => {
    mockFetch.mockResolvedValue(failedResponse(503));
    const { result } = renderHook(() => useHouseStatus());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.rooms).toBeNull();
    expect(result.current.error).toBe('Stanze non disponibili');
  });

  it('reports the same error when the first read fails on the network', async () => {
    mockFetch.mockRejectedValue(new Error('network down'));
    const { result } = renderHook(() => useHouseStatus());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.rooms).toBeNull();
    expect(result.current.error).toBe('Stanze non disponibili');
  });

  it('refetch after an error loads the rooms and clears the error', async () => {
    mockFetch.mockResolvedValueOnce(failedResponse(500));
    const { result } = renderHook(() => useHouseStatus());
    await waitFor(() => expect(result.current.error).toBe('Stanze non disponibili'));

    mockFetch.mockResolvedValueOnce(okResponse(house([room(1, 'Sala')])));
    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.rooms).toEqual([room(1, 'Sala')]);
    expect(result.current.error).toBeNull();
  });

  it('a failed refresh keeps the last layout read and shows no error', async () => {
    const rooms = [room(1, 'Sala')];
    mockFetch.mockResolvedValueOnce(okResponse(house(rooms)));
    const { result } = renderHook(() => useHouseStatus());
    await waitFor(() => expect(result.current.rooms).toEqual(rooms));

    mockFetch.mockResolvedValueOnce(failedResponse(503));
    await act(async () => {
      await result.current.refetch();
    });
    expect(result.current.rooms).toEqual(rooms);
    expect(result.current.error).toBeNull();

    mockFetch.mockRejectedValueOnce(new Error('network down'));
    await act(async () => {
      await result.current.refetch();
    });
    expect(result.current.rooms).toEqual(rooms);
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('a later successful refresh replaces the layout', async () => {
    mockFetch.mockResolvedValueOnce(okResponse(house([room(1, 'Sala')])));
    const { result } = renderHook(() => useHouseStatus());
    await waitFor(() => expect(result.current.rooms).toHaveLength(1));

    const next = [room(1, 'Sala'), room(3, 'Studio')];
    mockFetch.mockResolvedValueOnce(okResponse(house(next)));
    await act(async () => {
      await result.current.refetch();
    });
    expect(result.current.rooms).toEqual(next);
  });

  it('an aborted request is not an error', async () => {
    const aborted = new Error('aborted');
    aborted.name = 'AbortError';
    mockFetch.mockRejectedValue(aborted);
    const { result } = renderHook(() => useHouseStatus());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.rooms).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('reads again every 60 seconds', async () => {
    jest.useFakeTimers();
    mockFetch.mockResolvedValue(okResponse(house([room(1, 'Sala')])));

    const { result } = renderHook(() => useHouseStatus());
    await act(async () => {
      await jest.advanceTimersByTimeAsync(0);
    });
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(result.current.rooms).toHaveLength(1);

    await act(async () => {
      await jest.advanceTimersByTimeAsync(59_000);
    });
    expect(mockFetch).toHaveBeenCalledTimes(1);

    mockFetch.mockResolvedValue(okResponse(house([room(1, 'Sala'), room(2, 'Cucina')])));
    await act(async () => {
      await jest.advanceTimersByTimeAsync(1_000);
    });
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(result.current.rooms).toHaveLength(2);

    await act(async () => {
      await jest.advanceTimersByTimeAsync(60_000);
    });
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('stops reading after unmount', async () => {
    jest.useFakeTimers();
    mockFetch.mockResolvedValue(okResponse(house([])));
    const { unmount } = renderHook(() => useHouseStatus());
    await act(async () => {
      await jest.advanceTimersByTimeAsync(0);
    });
    unmount();
    await act(async () => {
      await jest.advanceTimersByTimeAsync(180_000);
    });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
