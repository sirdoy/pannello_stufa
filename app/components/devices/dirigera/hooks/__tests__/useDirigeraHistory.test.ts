/**
 * Tests for useDirigeraHistory Hook
 */

jest.mock('@/lib/hooks/useAdaptivePolling');
jest.mock('@/lib/hooks/useVisibility');

import { renderHook, act } from '@testing-library/react';
import { useAdaptivePolling } from '@/lib/hooks/useAdaptivePolling';
import { useVisibility } from '@/lib/hooks/useVisibility';
import { useDirigeraHistory } from '../useDirigeraHistory';

const mockUseAdaptivePolling = useAdaptivePolling as jest.MockedFunction<typeof useAdaptivePolling>;
const mockUseVisibility = useVisibility as jest.MockedFunction<typeof useVisibility>;

const mockEvent1 = {
  id: 1,
  sensor_id: 'sensor-abc',
  sensor_name: 'Porta ingresso',
  event_type: 'open',
  recorded_at: 1773244800,
};

const mockEvent2 = {
  id: 2,
  sensor_id: 'sensor-abc',
  sensor_name: 'Porta ingresso',
  event_type: 'close',
  recorded_at: 1773244900,
};

describe('useDirigeraHistory', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockUseVisibility.mockReturnValue(true);
    mockUseAdaptivePolling.mockImplementation(() => undefined);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ events: [mockEvent1], total: 10, limit: 50, offset: 0 }),
    }) as jest.Mock;
  });

  it('uses 300s polling interval when visible', () => {
    renderHook(() => useDirigeraHistory());
    const pollingCall = mockUseAdaptivePolling.mock.calls[0]?.[0];
    expect(pollingCall?.interval).toBe(300_000);
  });

  it('uses 600s polling interval when hidden', () => {
    mockUseVisibility.mockReturnValue(false);
    renderHook(() => useDirigeraHistory());
    const pollingCall = mockUseAdaptivePolling.mock.calls[0]?.[0];
    expect(pollingCall?.interval).toBe(600_000);
  });

  it('fetches /api/v1/dirigera/history with limit=50 and offset=0 on poll', async () => {
    let capturedCallback: (() => Promise<void>) | null = null;
    mockUseAdaptivePolling.mockImplementation((opts) => {
      capturedCallback = opts.callback as () => Promise<void>;
    });
    renderHook(() => useDirigeraHistory());
    await act(async () => {
      await capturedCallback?.();
    });
    const url = (global.fetch as jest.Mock).mock.calls[0]?.[0] as string;
    expect(url).toContain('/api/v1/dirigera/history');
    expect(url).toContain('limit=50');
    expect(url).toContain('offset=0');
  });

  it('appends items on loadMore() with offset=50', async () => {
    let capturedCallback: (() => Promise<void>) | null = null;
    mockUseAdaptivePolling.mockImplementation((opts) => {
      capturedCallback = opts.callback as () => Promise<void>;
    });

    // First call returns event1, second (loadMore) returns event2
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ events: [mockEvent1], total: 10, limit: 50, offset: 0 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ events: [mockEvent2], total: 10, limit: 50, offset: 50 }),
      });

    const { result } = renderHook(() => useDirigeraHistory());

    // Trigger initial poll
    await act(async () => {
      await capturedCallback?.();
    });
    expect(result.current.items).toHaveLength(1);

    // Trigger loadMore
    await act(async () => {
      result.current.loadMore();
    });

    // Wait for async loadMore to complete
    await act(async () => {
      await new Promise(r => setTimeout(r, 0));
    });

    expect((global.fetch as jest.Mock).mock.calls).toHaveLength(2);
    const loadMoreUrl = (global.fetch as jest.Mock).mock.calls[1]?.[0] as string;
    expect(loadMoreUrl).toContain('offset=50');
    expect(result.current.items).toHaveLength(2);
  });

  it('replaces items on poll cycle after loadMore', async () => {
    let capturedCallback: (() => Promise<void>) | null = null;
    mockUseAdaptivePolling.mockImplementation((opts) => {
      capturedCallback = opts.callback as () => Promise<void>;
    });

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ events: [mockEvent1], total: 10, limit: 50, offset: 0 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ events: [mockEvent2], total: 10, limit: 50, offset: 50 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ events: [mockEvent1], total: 10, limit: 50, offset: 0 }),
      });

    const { result } = renderHook(() => useDirigeraHistory());

    // Initial poll → 1 item
    await act(async () => {
      await capturedCallback?.();
    });
    expect(result.current.items).toHaveLength(1);

    // loadMore → 2 items
    await act(async () => {
      result.current.loadMore();
    });
    await act(async () => {
      await new Promise(r => setTimeout(r, 0));
    });
    expect(result.current.items).toHaveLength(2);

    // Poll again → replaces, back to 1 item
    await act(async () => {
      await capturedCallback?.();
    });
    expect(result.current.items).toHaveLength(1);
  });

  it('forwards sensor_id param when provided', async () => {
    let capturedCallback: (() => Promise<void>) | null = null;
    mockUseAdaptivePolling.mockImplementation((opts) => {
      capturedCallback = opts.callback as () => Promise<void>;
    });
    renderHook(() => useDirigeraHistory({ sensor_id: 'abc123' }));
    await act(async () => {
      await capturedCallback?.();
    });
    const url = (global.fetch as jest.Mock).mock.calls[0]?.[0] as string;
    expect(url).toContain('sensor_id=abc123');
  });

  it('sets stale=true and error on fetch failure', async () => {
    let capturedCallback: (() => Promise<void>) | null = null;
    mockUseAdaptivePolling.mockImplementation((opts) => {
      capturedCallback = opts.callback as () => Promise<void>;
    });
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({}),
    }) as jest.Mock;
    const { result } = renderHook(() => useDirigeraHistory());
    await act(async () => {
      await capturedCallback?.();
    });
    expect(result.current.stale).toBe(true);
    expect(result.current.error).toBe('Impossibile caricare lo storico');
  });
});
