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
  const mockHandsets = [
    {
      id: '1',
      name: 'Cucina',
      model: 'C6',
      firmware_version: '113.01',
      battery_charge_level: 75,
      is_registered: true,
    },
    {
      id: '2',
      name: 'Camera',
      model: 'C5',
      firmware_version: '112.00',
      battery_charge_level: 15,
      is_registered: true,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockInterval = null;
  });

  it('fetches and stores handsets on success', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          dect: { items: mockHandsets, total_count: 2, limit: 50, offset: 0 },
        }),
    }) as jest.Mock;

    const { result } = renderHook(() => useFritzDectHandsets());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const fetchUrl = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(fetchUrl).toBe('/api/v1/fritzbox/telephony/dect');
    expect(result.current.handsets).toHaveLength(2);
    expect(result.current.total).toBe(2);
    expect(result.current.stale).toBe(false);
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
      json: () => Promise.resolve({ dect: { items: [], total_count: 0, limit: 50, offset: 0 } }),
    }) as jest.Mock;

    renderHook(() => useFritzDectHandsets({ paused: true }));

    expect(mockInterval).toBeNull();
  });
});
