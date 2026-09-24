import { renderHook, waitFor } from '@testing-library/react';
import { useFritzDectHandsets } from '../useFritzDectHandsets';

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

describe('useFritzDectHandsets', () => {
  // Real backend shape (DectListResponse, backend/api/models.py) wrapped by the Next route.
  const mockHandsets = [
    { dect_id: 1, name: 'Cucina', phonebook_id: 0, model: null, registration_status: 'registered' },
    { dect_id: 2, name: 'Camera', phonebook_id: 0, model: null, registration_status: 'registered' },
  ];
  const dectPayload = (overrides: Record<string, unknown> = {}) => ({
    dect: {
      handsets: mockHandsets,
      handset_count: 2,
      is_stale: false,
      fetched_at: '2026-02-17T13:00:00Z',
      ...overrides,
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockInterval = null;
  });

  it('fetches and stores handsets on success', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(dectPayload()),
    }) as jest.Mock;

    const { result } = renderHook(() => useFritzDectHandsets());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const fetchUrl = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(fetchUrl).toBe('/api/v1/fritzbox/telephony/dect');
    expect(result.current.handsets).toEqual(mockHandsets);
    expect(result.current.total).toBe(2);
    expect(result.current.stale).toBe(false);
  });

  it('uses handset_count for total and propagates is_stale', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(dectPayload({ handset_count: 5, is_stale: true })),
    }) as jest.Mock;

    const { result } = renderHook(() => useFritzDectHandsets());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.total).toBe(5);
    expect(result.current.stale).toBe(true);
  });

  it('does not crash when handsets is missing (Firebase cache drops empty arrays)', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ dect: { handset_count: 0, is_stale: false, fetched_at: null } }),
    }) as jest.Mock;

    const { result } = renderHook(() => useFritzDectHandsets());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.handsets).toEqual([]);
    expect(result.current.total).toBe(0);
  });

  it('sets stale=true and empties list on non-OK response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({}),
    }) as jest.Mock;

    const { result } = renderHook(() => useFritzDectHandsets());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stale).toBe(true);
    expect(result.current.handsets).toEqual([]);
    expect(result.current.total).toBe(0);
  });

  it('sets stale=true on fetch throw', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network')) as jest.Mock;

    const { result } = renderHook(() => useFritzDectHandsets());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stale).toBe(true);
  });

  it('stops polling (mockInterval === null) when paused: true', () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(dectPayload({ handsets: [], handset_count: 0 })),
    }) as jest.Mock;

    renderHook(() => useFritzDectHandsets({ paused: true }));

    expect(mockInterval).toBeNull();
  });
});
