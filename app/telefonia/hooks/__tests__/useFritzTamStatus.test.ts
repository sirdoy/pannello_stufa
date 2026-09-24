import { renderHook, waitFor } from '@testing-library/react';
import { useFritzTamStatus } from '../useFritzTamStatus';

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

describe('useFritzTamStatus', () => {
  // Real backend shape (TamStatusResponse, backend/api/models.py) wrapped by the Next route.
  const mockTam = {
    tam: {
      total_messages: 5,
      new_messages: 2,
      tam_enabled: true,
      tam_name: 'Anrufbeantworter',
    },
    is_stale: false,
    fetched_at: '2026-04-22T10:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockInterval = null;
  });

  it('fetches and stores status on success', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ tam: mockTam }),
    }) as jest.Mock;

    const { result } = renderHook(() => useFritzTamStatus());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const fetchUrl = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(fetchUrl).toBe('/api/v1/fritzbox/telephony/tam');
    expect(result.current.status).toEqual(mockTam);
    expect(result.current.status?.tam.tam_enabled).toBe(true);
    expect(result.current.status?.tam.new_messages).toBe(2);
    expect(result.current.stale).toBe(false);
  });

  it('propagates backend is_stale into stale', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ tam: { ...mockTam, is_stale: true } }),
    }) as jest.Mock;

    const { result } = renderHook(() => useFritzTamStatus());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stale).toBe(true);
    expect(result.current.status?.tam.total_messages).toBe(5);
  });

  it('treats a payload without the nested tam object as unavailable', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ tam: { enabled: true, new_messages: 1, total_messages: 1 } }),
    }) as jest.Mock;

    const { result } = renderHook(() => useFritzTamStatus());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.status).toBeNull();
    expect(result.current.stale).toBe(true);
  });

  it('sets stale=true and nulls status on non-OK response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({}),
    }) as jest.Mock;

    const { result } = renderHook(() => useFritzTamStatus());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stale).toBe(true);
    expect(result.current.status).toBeNull();
  });

  it('sets stale=true on fetch throw', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network')) as jest.Mock;

    const { result } = renderHook(() => useFritzTamStatus());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stale).toBe(true);
  });

  it('stops polling (mockInterval === null) when paused: true', () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ tam: mockTam }),
    }) as jest.Mock;

    renderHook(() => useFritzTamStatus({ paused: true }));

    expect(mockInterval).toBeNull();
  });
});
