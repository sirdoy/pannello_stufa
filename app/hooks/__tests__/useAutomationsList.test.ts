/**
 * useAutomationsList — Phase 180 Plan 08 Task 1
 *
 * Tests the paginated CRUD hook: optimistic toggle, rollback on error,
 * Italian toast copy, no polling (D-25 compliance).
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { useAutomationsList } from '../useAutomationsList';

// ── Mock automationsProxy ──────────────────────────────────────────────────────
jest.mock('@/lib/automations/automationsProxy', () => ({
  automationsProxy: {
    getAutomations: jest.fn(),
    createAutomation: jest.fn(),
    updateAutomation: jest.fn(),
    deleteAutomation: jest.fn(),
  },
}));

// ── Mock useToast ─────────────────────────────────────────────────────────────
const mockToastSuccess = jest.fn();
const mockToastError = jest.fn();
jest.mock('@/app/hooks/useToast', () => ({
  useToast: () => ({
    success: mockToastSuccess,
    error: mockToastError,
  }),
}));

import { automationsProxy } from '@/lib/automations/automationsProxy';
import type { AutomationRule } from '@/types/automations';

const mockProxy = automationsProxy as jest.Mocked<typeof automationsProxy>;

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeRule(overrides: Partial<AutomationRule> = {}): AutomationRule {
  return {
    id: 1,
    name: 'Test Rule',
    description: null,
    enabled: true,
    trigger: { type: 'manual_api_call' },
    condition: { type: 'always_true' },
    actions: [{ type: 'log_event', message: 'ok' }],
    min_interval_seconds: 0,
    max_triggers_per_hour: 0,
    last_triggered_at: null,
    active_hours_start: null,
    active_hours_end: null,
    created_at: 1000,
    updated_at: 1000,
    ...overrides,
  };
}

function makePaginatedResponse(items: AutomationRule[], total_count = items.length) {
  return { items, total_count, limit: 20, offset: 0 };
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  mockProxy.getAutomations.mockResolvedValue(makePaginatedResponse([]));
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useAutomationsList', () => {
  // D-25: No polling. getAutomations must NOT be called by a timer (setInterval).
  // We verify this by asserting that advancing timers by 60s does not trigger extra calls.
  it('does not poll on a timer (D-25 no-polling rule)', async () => {
    jest.useFakeTimers();
    const { unmount } = renderHook(() => useAutomationsList());

    // Let the mount fetch complete (run all pending promises)
    await act(async () => {
      await Promise.resolve();
    });

    const callsAfterMount = mockProxy.getAutomations.mock.calls.length;
    expect(callsAfterMount).toBeGreaterThanOrEqual(1);

    // Advance 60 seconds — no additional fetch should be triggered by a timer
    act(() => {
      jest.advanceTimersByTime(60_000);
    });

    expect(mockProxy.getAutomations).toHaveBeenCalledTimes(callsAfterMount);
    unmount();
    jest.useRealTimers();
  });

  describe('initial fetch on mount', () => {
    it('calls getAutomations with { limit: 20, offset: 0 } by default', async () => {
      const rule = makeRule();
      // Use mockResolvedValue (not Once) so StrictMode double-invocation both return the rule
      mockProxy.getAutomations.mockResolvedValue(makePaginatedResponse([rule], 5));

      const { result } = renderHook(() => useAutomationsList());

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(mockProxy.getAutomations).toHaveBeenCalledWith({ limit: 20, offset: 0 });
      expect(result.current.rules).toEqual([rule]);
      expect(result.current.totalCount).toBe(5);
      expect(result.current.error).toBeNull();
    });

    it('respects custom pageSize option', async () => {
      renderHook(() => useAutomationsList({ pageSize: 5 }));

      await waitFor(() =>
        expect(mockProxy.getAutomations).toHaveBeenCalledWith({ limit: 5, offset: 0 })
      );
    });

    it('sets error state on fetch failure', async () => {
      mockProxy.getAutomations.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useAutomationsList());

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.error).toBe('Network error');
      expect(result.current.rules).toEqual([]);
    });
  });

  describe('pagination', () => {
    it('refetches with offset when setPage is called', async () => {
      const { result } = renderHook(() => useAutomationsList());

      await waitFor(() => expect(result.current.loading).toBe(false));

      mockProxy.getAutomations.mockResolvedValueOnce(makePaginatedResponse([], 40));

      act(() => {
        result.current.setPage(1);
      });

      await waitFor(() =>
        expect(mockProxy.getAutomations).toHaveBeenCalledWith({ limit: 20, offset: 20 })
      );

      expect(result.current.page).toBe(1);
    });
  });

  describe('create', () => {
    it('calls createAutomation and toasts success message', async () => {
      const body = {
        name: 'New',
        condition: { type: 'always_true' as const },
        actions: [{ type: 'log_event' as const, message: 'ok' }],
      };
      mockProxy.createAutomation.mockResolvedValueOnce(makeRule({ name: 'New' }));
      mockProxy.getAutomations.mockResolvedValue(makePaginatedResponse([makeRule()]));

      const { result } = renderHook(() => useAutomationsList());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.create(body);
      });

      expect(mockProxy.createAutomation).toHaveBeenCalledWith(body);
      expect(mockToastSuccess).toHaveBeenCalledWith('Automazione creata');
    });

    it('toasts error and rethrows on create failure', async () => {
      mockProxy.createAutomation.mockRejectedValueOnce(new Error('Server error'));

      const { result } = renderHook(() => useAutomationsList());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await expect(
        act(async () => {
          await result.current.create({
            name: 'Fail',
            condition: { type: 'always_true' },
            actions: [{ type: 'log_event', message: 'x' }],
          });
        })
      ).rejects.toThrow('Server error');

      expect(mockToastError).toHaveBeenCalledWith('Server error');
    });
  });

  describe('update', () => {
    it('calls updateAutomation with String(id) and toasts success', async () => {
      const rule = makeRule({ id: 7 });
      mockProxy.updateAutomation.mockResolvedValueOnce(rule);
      mockProxy.getAutomations.mockResolvedValue(makePaginatedResponse([rule]));

      const { result } = renderHook(() => useAutomationsList());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.update(7, { name: 'Updated' });
      });

      expect(mockProxy.updateAutomation).toHaveBeenCalledWith('7', { name: 'Updated' });
      expect(mockToastSuccess).toHaveBeenCalledWith('Automazione aggiornata');
    });

    it('toasts error and rethrows on update failure', async () => {
      mockProxy.updateAutomation.mockRejectedValueOnce(new Error('PATCH fail'));

      const { result } = renderHook(() => useAutomationsList());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await expect(
        act(async () => {
          await result.current.update(3, { name: 'x' });
        })
      ).rejects.toThrow('PATCH fail');

      expect(mockToastError).toHaveBeenCalledWith('PATCH fail');
    });
  });

  describe('remove', () => {
    it('calls deleteAutomation with String(id) and toasts success', async () => {
      mockProxy.deleteAutomation.mockResolvedValueOnce(undefined);
      mockProxy.getAutomations.mockResolvedValue(makePaginatedResponse([]));

      const { result } = renderHook(() => useAutomationsList());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.remove(42);
      });

      expect(mockProxy.deleteAutomation).toHaveBeenCalledWith('42');
      expect(mockToastSuccess).toHaveBeenCalledWith('Automazione eliminata');
    });

    it('toasts error and rethrows on remove failure', async () => {
      mockProxy.deleteAutomation.mockRejectedValueOnce(new Error('DELETE fail'));

      const { result } = renderHook(() => useAutomationsList());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await expect(
        act(async () => {
          await result.current.remove(99);
        })
      ).rejects.toThrow('DELETE fail');

      expect(mockToastError).toHaveBeenCalledWith('DELETE fail');
    });
  });

  describe('toggle (optimistic)', () => {
    it('optimistically flips enabled=true to false; does NOT toast success', async () => {
      const rule = makeRule({ id: 1, enabled: true });
      mockProxy.getAutomations.mockResolvedValue(makePaginatedResponse([rule]));
      mockProxy.updateAutomation.mockResolvedValueOnce({ ...rule, enabled: false });

      const { result } = renderHook(() => useAutomationsList());
      await waitFor(() => expect(result.current.loading).toBe(false));

      // Rules now have the rule with enabled=true
      expect(result.current.rules[0]?.enabled).toBe(true);

      await act(async () => {
        await result.current.toggle(1, true);
      });

      // Optimistic update should flip enabled to false
      expect(result.current.rules[0]?.enabled).toBe(false);
      expect(mockProxy.updateAutomation).toHaveBeenCalledWith('1', { enabled: false });
      // No success toast on toggle (InlineToggle is its own feedback)
      expect(mockToastSuccess).not.toHaveBeenCalled();
    });

    it('optimistically flips enabled=false to true', async () => {
      const rule = makeRule({ id: 2, enabled: false });
      mockProxy.getAutomations.mockResolvedValue(makePaginatedResponse([rule]));
      mockProxy.updateAutomation.mockResolvedValueOnce({ ...rule, enabled: true });

      const { result } = renderHook(() => useAutomationsList());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.toggle(2, false);
      });

      expect(result.current.rules[0]?.enabled).toBe(true);
      expect(mockProxy.updateAutomation).toHaveBeenCalledWith('2', { enabled: true });
    });

    it('rolls back optimistic update on toggle failure', async () => {
      const rule = makeRule({ id: 3, enabled: true });
      mockProxy.getAutomations.mockResolvedValue(makePaginatedResponse([rule]));
      mockProxy.updateAutomation.mockRejectedValueOnce(new Error('Toggle fail'));

      const { result } = renderHook(() => useAutomationsList());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.toggle(3, true);
      });

      // Should be rolled back to original enabled=true
      expect(result.current.rules[0]?.enabled).toBe(true);
      expect(mockToastError).toHaveBeenCalled();
    });

    it('does not toast success on toggle error only (toasts error)', async () => {
      const rule = makeRule({ id: 5, enabled: false });
      mockProxy.getAutomations.mockResolvedValue(makePaginatedResponse([rule]));
      mockProxy.updateAutomation.mockRejectedValueOnce(new Error('fail'));

      const { result } = renderHook(() => useAutomationsList());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.toggle(5, false);
      });

      expect(mockToastSuccess).not.toHaveBeenCalled();
      expect(mockToastError).toHaveBeenCalled();
    });
  });

  describe('return shape', () => {
    it('exposes all required fields', async () => {
      const { result } = renderHook(() => useAutomationsList());

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(typeof result.current.rules).toBe('object');
      expect(typeof result.current.totalCount).toBe('number');
      expect(typeof result.current.loading).toBe('boolean');
      expect(result.current.error).toBeNull();
      expect(typeof result.current.refetch).toBe('function');
      expect(typeof result.current.page).toBe('number');
      expect(typeof result.current.setPage).toBe('function');
      expect(typeof result.current.create).toBe('function');
      expect(typeof result.current.update).toBe('function');
      expect(typeof result.current.remove).toBe('function');
      expect(typeof result.current.toggle).toBe('function');
    });
  });
});
