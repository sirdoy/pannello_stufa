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
  const mockCalls = [
    {
      id: 'c1',
      call_type: 'incoming',
      number: '+393331112233',
      name: 'Mario',
      duration_seconds: 125,
      timestamp: 1713700000,
      port: 'DECT-1',
    },
    {
      id: 'c2',
      call_type: 'outgoing',
      number: '+393332223344',
      name: null,
      duration_seconds: 60,
      timestamp: 1713600000,
      port: 'DECT-1',
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
    expect(fetchUrl).toContain('/api/fritzbox/telephony/calls');
    expect(fetchUrl).toContain('limit=50');
    expect(fetchUrl).toContain('offset=0');
    expect(result.current.calls).toHaveLength(2);
    expect(result.current.totalCount).toBe(2);
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
