import { renderHook, waitFor, act } from '@testing-library/react';
import { useFritzCallHistory } from '../useFritzCallHistory';

let mockInterval: number | null = null;

jest.mock('@/lib/hooks/useAdaptivePolling', () => ({
  useAdaptivePolling: ({ callback, interval }: { callback: () => void; interval: number | null }) => {
    mockInterval = interval;
    if (interval !== null) {
      callback();
    }
  },
}));

jest.mock('@/lib/hooks/useVisibility', () => ({
  useVisibility: () => true,
}));

describe('useFritzCallHistory', () => {
  // Real backend shape (CallRecordModel, backend/api/models.py) — no id/number/timestamp.
  const mockCalls = [
    {
      call_type: 'received',
      call_type_code: 1,
      name: 'Mario',
      caller: '+393331112233',
      called: '0301234567',
      caller_number: '+393331112233',
      called_number: '0301234567',
      date: '2026-02-17T10:30:00',
      duration_seconds: 125,
      device: 'Cucina',
      port: 'FON1',
    },
    {
      call_type: 'outgoing',
      call_type_code: 3,
      name: null,
      caller: '0301234567',
      called: '+393332223344',
      caller_number: '0301234567',
      called_number: '+393332223344',
      date: '2026-02-16T09:00:00',
      duration_seconds: 60,
      device: 'Cucina',
      port: 'FON1',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockInterval = null;
  });

  it('fetches with limit=50&offset=0 on first render', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          calls: { items: mockCalls, total_count: 2, limit: 50, offset: 0 },
        }),
    }) as jest.Mock;

    const { result } = renderHook(() => useFritzCallHistory());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const fetchUrl = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(fetchUrl).toContain('/api/v1/fritzbox/telephony/calls');
    expect(fetchUrl).toContain('limit=50');
    expect(fetchUrl).toContain('offset=0');
    expect(result.current.calls).toEqual(mockCalls);
    expect(result.current.totalCount).toBe(2);
    expect(result.current.stale).toBe(false);
  });

  it('does not crash when items is missing (Firebase cache drops empty arrays)', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ calls: { total_count: 0, limit: 50, offset: 0 } }),
    }) as jest.Mock;

    const { result } = renderHook(() => useFritzCallHistory());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.calls).toEqual([]);
    expect(result.current.totalCount).toBe(0);
  });

  it('sets stale=true and empties list on non-OK response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({}),
    }) as jest.Mock;

    const { result } = renderHook(() => useFritzCallHistory());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stale).toBe(true);
    expect(result.current.calls).toEqual([]);
    expect(result.current.totalCount).toBe(0);
  });

  it('stops polling (mockInterval === null) when paused: true', () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ calls: { items: [], total_count: 0, limit: 50, offset: 0 } }),
    }) as jest.Mock;

    renderHook(() => useFritzCallHistory({ paused: true }));

    expect(mockInterval).toBeNull();
  });

  it('updates offset to page*50 when setPage is called', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          calls: { items: mockCalls, total_count: 200, limit: 50, offset: 0 },
        }),
    }) as jest.Mock;

    const { result } = renderHook(() => useFritzCallHistory());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    (global.fetch as jest.Mock).mockClear();

    act(() => {
      result.current.setPage(2);
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    const refetchUrl = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(refetchUrl).toContain('offset=100');
  });

  it('resets page to 0 when total_count shrinks below current offset', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          calls: { items: mockCalls, total_count: 500, limit: 50, offset: 0 },
        }),
    }) as jest.Mock;

    const { result } = renderHook(() => useFritzCallHistory());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Advance to a high page while total_count is large.
    act(() => {
      result.current.setPage(5);
    });
    await waitFor(() => {
      expect(result.current.page).toBe(5);
    });

    // Next refetch returns a shrunken total_count (10 items → page 0 only).
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          calls: { items: mockCalls, total_count: 10, limit: 50, offset: 250 },
        }),
    });

    // Trigger a refetch by setting page again (simulates polling tick delivering new totalCount).
    act(() => {
      result.current.setPage(5);
    });

    await waitFor(() => {
      expect(result.current.page).toBe(0);
    });
  });
});
