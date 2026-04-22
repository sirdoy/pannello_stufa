/**
 * Tests for useDirigeraStats Hook
 */

jest.mock('@/lib/hooks/useAdaptivePolling');
jest.mock('@/lib/hooks/useVisibility');

import { renderHook, act } from '@testing-library/react';
import { useAdaptivePolling } from '@/lib/hooks/useAdaptivePolling';
import { useVisibility } from '@/lib/hooks/useVisibility';
import { useDirigeraStats } from '../useDirigeraStats';

const mockUseAdaptivePolling = useAdaptivePolling as jest.MockedFunction<typeof useAdaptivePolling>;
const mockUseVisibility = useVisibility as jest.MockedFunction<typeof useVisibility>;

const mockStatsData = {
  aggregation: {
    last_run_at: 1773244800,
    last_run_status: 'ok',
    rows_aggregated_last_run: 248,
    total_runs: 7,
    total_rows_aggregated: 1736,
  },
  retention: {
    last_run_at: 1773244800,
    last_run_status: 'ok',
    rows_deleted_last_run: 0,
    total_runs: 7,
    total_rows_deleted: 42,
  },
};

describe('useDirigeraStats', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockUseVisibility.mockReturnValue(true);
    mockUseAdaptivePolling.mockImplementation(() => undefined);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockStatsData),
    }) as jest.Mock;
  });

  it('uses 300s polling interval when visible', () => {
    renderHook(() => useDirigeraStats());
    const pollingCall = mockUseAdaptivePolling.mock.calls[0]?.[0];
    expect(pollingCall?.interval).toBe(300_000);
  });

  it('uses 600s polling interval when hidden', () => {
    mockUseVisibility.mockReturnValue(false);
    renderHook(() => useDirigeraStats());
    const pollingCall = mockUseAdaptivePolling.mock.calls[0]?.[0];
    expect(pollingCall?.interval).toBe(600_000);
  });

  it('fetches /api/v1/dirigera/stats on poll callback', async () => {
    let capturedCallback: (() => Promise<void>) | null = null;
    mockUseAdaptivePolling.mockImplementation((opts) => {
      capturedCallback = opts.callback as () => Promise<void>;
    });
    renderHook(() => useDirigeraStats());
    await act(async () => {
      await capturedCallback?.();
    });
    expect(global.fetch).toHaveBeenCalledWith('/api/v1/dirigera/stats');
  });

  it('returns data on successful fetch', async () => {
    let capturedCallback: (() => Promise<void>) | null = null;
    mockUseAdaptivePolling.mockImplementation((opts) => {
      capturedCallback = opts.callback as () => Promise<void>;
    });
    const { result } = renderHook(() => useDirigeraStats());
    await act(async () => {
      await capturedCallback?.();
    });
    expect(result.current.data?.aggregation.total_runs).toBe(7);
    expect(result.current.data?.retention.total_rows_deleted).toBe(42);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
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
    const { result } = renderHook(() => useDirigeraStats());
    await act(async () => {
      await capturedCallback?.();
    });
    expect(result.current.stale).toBe(true);
    expect(result.current.error).toBe('Impossibile caricare le statistiche');
  });
});
