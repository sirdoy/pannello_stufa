/**
 * Tests for useSonosHistory Hook
 *
 * Validates on-demand history fetching with type/range/filter options.
 */

import { renderHook, act } from '@testing-library/react';
import { useSonosHistory } from '../useSonosHistory';

const mockHistoryResponse = {
  items: [],
  total: 0,
  granularity: 'hourly' as const,
  limit: 200,
  offset: 0,
};

describe('useSonosHistory', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('Test 1: fetchHistory builds correct URL with type=volume, 24h range, limit=200', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockHistoryResponse),
    } as Response);
    global.fetch = mockFetch;

    const { result } = renderHook(() => useSonosHistory());

    // Default state: volume, 24h, no filters
    expect(result.current.historyType).toBe('volume');
    expect(result.current.timeRange).toBe('24h');

    await act(async () => {
      await result.current.fetchHistory();
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const calledUrl = mockFetch.mock.calls[0]![0] as string;
    expect(calledUrl).toMatch(/\/api\/sonos\/history\?type=volume/);
    expect(calledUrl).toMatch(/&start=/);
    expect(calledUrl).toMatch(/&end=/);
    expect(calledUrl).toMatch(/&limit=200/);
    expect(calledUrl).not.toMatch(/speaker_uid/);
    expect(calledUrl).not.toMatch(/group_id/);
  });

  it('Test 2: fetchHistory appends speaker_uid when speakerFilter is set', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockHistoryResponse),
    } as Response);
    global.fetch = mockFetch;

    const { result } = renderHook(() => useSonosHistory());

    await act(async () => {
      result.current.setSpeakerFilter('RINCON_ABC123');
    });

    await act(async () => {
      await result.current.fetchHistory();
    });

    const calledUrl = mockFetch.mock.calls[0]![0] as string;
    expect(calledUrl).toMatch(/speaker_uid=RINCON_ABC123/);
  });

  it('Test 3: fetchHistory sets error on fetch failure', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useSonosHistory());

    await act(async () => {
      await result.current.fetchHistory();
    });

    expect(result.current.error).toBe('Cronologia non disponibile');
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeNull();
  });

  it('Test 4: fetchHistory sets data on success', async () => {
    const mockData = { ...mockHistoryResponse, total: 5 };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    } as Response);

    const { result } = renderHook(() => useSonosHistory());

    await act(async () => {
      await result.current.fetchHistory();
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('Test 5: setHistoryType changes historyType state', () => {
    const { result } = renderHook(() => useSonosHistory());

    act(() => {
      result.current.setHistoryType('playback');
    });

    expect(result.current.historyType).toBe('playback');
  });

  it('Test 6: setTimeRange changes timeRange state', () => {
    const { result } = renderHook(() => useSonosHistory());

    act(() => {
      result.current.setTimeRange('7d');
    });

    expect(result.current.timeRange).toBe('7d');
  });
});
