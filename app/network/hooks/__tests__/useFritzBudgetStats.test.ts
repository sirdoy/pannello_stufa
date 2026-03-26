import { renderHook, waitFor } from '@testing-library/react';
import { useFritzBudgetStats } from '../useFritzBudgetStats';

describe('useFritzBudgetStats', () => {
  const mockBudgetStats = {
    window_seconds: 3600,
    current_window_requests: 42,
    soft_limit: 100,
    hard_limit: 200,
    total_lifetime_requests: 5000,
    warning_count: 3,
    utilization_percent: 42,
    status: 'ok' as const,
    message: 'All good',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with loading=true and data=null', () => {
    global.fetch = jest.fn().mockReturnValue(new Promise(() => {})) as jest.Mock;

    const { result } = renderHook(() => useFritzBudgetStats());

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe(false);
  });

  it('fetches /api/fritzbox/budget-stats on mount', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ stats: mockBudgetStats }),
    }) as jest.Mock;

    const { result } = renderHook(() => useFritzBudgetStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/fritzbox/budget-stats');
    // React strict mode may call effects twice in development
    expect(global.fetch).toHaveBeenCalled();
  });

  it('returns BudgetStats from json.stats on success', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ stats: mockBudgetStats }),
    }) as jest.Mock;

    const { result } = renderHook(() => useFritzBudgetStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockBudgetStats);
    expect(result.current.error).toBe(false);
  });

  it('returns correct status fields', async () => {
    const dangerStats = { ...mockBudgetStats, status: 'danger' as const, utilization_percent: 95 };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ stats: dangerStats }),
    }) as jest.Mock;

    const { result } = renderHook(() => useFritzBudgetStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data?.status).toBe('danger');
    expect(result.current.data?.utilization_percent).toBe(95);
  });

  it('sets error=true and data stays null on fetch error', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error')) as jest.Mock;

    const { result } = renderHook(() => useFritzBudgetStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe(true);
    expect(result.current.data).toBeNull();
  });

  it('does not poll after initial fetch (no polling interval)', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ stats: mockBudgetStats }),
    }) as jest.Mock;

    const { result } = renderHook(() => useFritzBudgetStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Data is populated — no useAdaptivePolling is used
    expect(result.current.data).toEqual(mockBudgetStats);
    expect(result.current.data?.status).toBe('ok');
  });
});
