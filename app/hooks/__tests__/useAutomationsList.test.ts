/**
 * useAutomationsList — Phase 180 Plan 08 Task 1
 *
 * Tests the paginated CRUD hook: optimistic toggle, rollback on error,
 * Italian toast copy, no polling (D-25 compliance).
 *
 * BL-01 (REVIEW iteration 2): hook now talks to /api/v1/automations via fetch
 * (was: direct automationsProxy call which crashed in the browser). Tests now
 * mock global.fetch instead of the proxy module.
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { useAutomationsList } from '../useAutomationsList';

// ── Mock useToast ─────────────────────────────────────────────────────────────
const mockToastSuccess = jest.fn();
const mockToastError = jest.fn();
jest.mock('@/app/hooks/useToast', () => ({
  useToast: () => ({
    success: mockToastSuccess,
    error: mockToastError,
  }),
}));

import type { AutomationRule } from '@/types/automations';

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

// ── Fetch mock helpers ────────────────────────────────────────────────────────

interface FetchCall {
  url: string;
  method: string;
  body: unknown;
}

const fetchCalls: FetchCall[] = [];
let mockFetch: jest.Mock;

// Per-method handler overrides. Tests set these to customise responses
// while still letting the recorder in beforeEach capture every call.
type Handler = (call: FetchCall) => Promise<FakeResponse> | FakeResponse;
const methodHandlers: Record<string, Handler | null> = {
  GET: null,
  POST: null,
  PATCH: null,
  DELETE: null,
};

// Minimal Response-like shape covering the surface useAutomationsList relies on:
// `ok`, `status`, and `.json()`. Avoids relying on jsdom's Response polyfill.
type FakeResponse = {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
};

function jsonResponse(payload: unknown, status = 200): FakeResponse {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
  };
}

function emptyResponse(status = 204): FakeResponse {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => ({}),
  };
}

function errorResponse(message: string, status = 500): FakeResponse {
  return {
    ok: false,
    status,
    json: async () => ({ message }),
  };
}

// ── Setup ─────────────────────────────────────────────────────────────────────

function setHandler(method: 'GET' | 'POST' | 'PATCH' | 'DELETE', handler: Handler): void {
  methodHandlers[method] = handler;
}

// Phase 183 Plan 04: absorb console.error noise from the hook's catch blocks
// so error-path tests don't flood Jest output. Declared at module scope so the
// shared beforeEach/afterEach below can install/restore it.
let consoleErrorSpy: jest.SpyInstance;

beforeEach(() => {
  jest.clearAllMocks();
  fetchCalls.length = 0;
  consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  // Reset per-method handlers; tests opt-in via setHandler().
  for (const k of Object.keys(methodHandlers)) {
    methodHandlers[k] = null;
  }
  // Single fetch implementation: records every call into fetchCalls, then
  // delegates to the per-method handler (if any) or returns sensible defaults.
  mockFetch = jest.fn().mockImplementation(async (input: RequestInfo, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    const method = init?.method ?? 'GET';
    let body: unknown = undefined;
    if (init?.body && typeof init.body === 'string') {
      try {
        body = JSON.parse(init.body);
      } catch {
        body = init.body;
      }
    }
    const call: FetchCall = { url, method, body };
    fetchCalls.push(call);
    const handler = methodHandlers[method];
    if (handler) return handler(call);
    if (method === 'GET') return jsonResponse(makePaginatedResponse([]));
    if (method === 'POST') return jsonResponse(makeRule(), 201);
    if (method === 'PATCH') return jsonResponse(makeRule());
    if (method === 'DELETE') return emptyResponse(204);
    return jsonResponse({});
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).fetch = mockFetch;
});

afterEach(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (globalThis as any).fetch;
  consoleErrorSpy.mockRestore();
});

function getCalls(method: string): FetchCall[] {
  return fetchCalls.filter((c) => c.method === method);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useAutomationsList', () => {
  // D-25: No polling. fetch must NOT be invoked by a timer (setInterval).
  // We verify this by asserting that advancing timers by 60s does not trigger extra calls.
  it('does not poll on a timer (D-25 no-polling rule)', async () => {
    jest.useFakeTimers();
    const { unmount } = renderHook(() => useAutomationsList());

    // Let the mount fetch complete (run all pending promises)
    await act(async () => {
      await Promise.resolve();
    });

    const callsAfterMount = mockFetch.mock.calls.length;
    expect(callsAfterMount).toBeGreaterThanOrEqual(1);

    // Advance 60 seconds — no additional fetch should be triggered by a timer
    act(() => {
      jest.advanceTimersByTime(60_000);
    });

    expect(mockFetch).toHaveBeenCalledTimes(callsAfterMount);
    unmount();
    jest.useRealTimers();
  });

  describe('initial fetch on mount', () => {
    it('calls GET /api/v1/automations?limit=20&offset=0 by default', async () => {
      const rule = makeRule();
      setHandler('GET', () => jsonResponse(makePaginatedResponse([rule], 5)));

      const { result } = renderHook(() => useAutomationsList());

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/automations?limit=20&offset=0');
      expect(result.current.rules).toEqual([rule]);
      expect(result.current.totalCount).toBe(5);
      expect(result.current.error).toBeNull();
    });

    it('respects custom pageSize option', async () => {
      renderHook(() => useAutomationsList({ pageSize: 5 }));

      await waitFor(() =>
        expect(mockFetch).toHaveBeenCalledWith('/api/v1/automations?limit=5&offset=0')
      );
    });

    it('sets error state on fetch failure (network)', async () => {
      setHandler('GET', () => {
        throw new Error('Network error');
      });

      const { result } = renderHook(() => useAutomationsList());

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.error).toBe('Network error');
      expect(result.current.rules).toEqual([]);
    });

    it('sets error state on non-OK response', async () => {
      setHandler('GET', () => errorResponse('Boom', 500));

      const { result } = renderHook(() => useAutomationsList());

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.error).toBe('Boom');
    });
  });

  describe('pagination', () => {
    it('refetches with offset when setPage is called', async () => {
      const { result } = renderHook(() => useAutomationsList());

      await waitFor(() => expect(result.current.loading).toBe(false));

      // Subsequent GET (after page change) returns 40 total
      setHandler('GET', () => jsonResponse(makePaginatedResponse([], 40)));

      act(() => {
        result.current.setPage(1);
      });

      await waitFor(() =>
        expect(mockFetch).toHaveBeenCalledWith('/api/v1/automations?limit=20&offset=20')
      );

      expect(result.current.page).toBe(1);
    });
  });

  describe('create', () => {
    it('POSTs the body and toasts success message', async () => {
      const body = {
        name: 'New',
        condition: { type: 'always_true' as const },
        actions: [{ type: 'log_event' as const, message: 'ok' }],
      };
      // GETs return empty list; explicit success on POST set by default mock
      const { result } = renderHook(() => useAutomationsList());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.create(body);
      });

      const posts = getCalls('POST');
      expect(posts).toHaveLength(1);
      expect(posts[0]!.url).toBe('/api/v1/automations');
      expect(posts[0]!.body).toEqual(body);
      expect(mockToastSuccess).toHaveBeenCalledWith('Automazione creata');
    });

    it('toasts error and rethrows on create failure', async () => {
      setHandler('POST', () => errorResponse('Server error', 500));

      const { result } = renderHook(() => useAutomationsList());
      await waitFor(() => expect(result.current.loading).toBe(false));

      let caught: unknown;
      await act(async () => {
        try {
          await result.current.create({
            name: 'Fail',
            condition: { type: 'always_true' },
            actions: [{ type: 'log_event', message: 'x' }],
          });
        } catch (err) {
          caught = err;
        }
      });

      expect((caught as Error).message).toBe('Server error');
      expect(mockToastError).toHaveBeenCalledWith('Server error');
    });
  });

  describe('update', () => {
    it('PATCHes /api/v1/automations/:id and toasts success', async () => {
      const { result } = renderHook(() => useAutomationsList());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.update(7, { name: 'Updated' });
      });

      const patches = getCalls('PATCH');
      expect(patches).toHaveLength(1);
      expect(patches[0]!.url).toBe('/api/v1/automations/7');
      expect(patches[0]!.body).toEqual({ name: 'Updated' });
      expect(mockToastSuccess).toHaveBeenCalledWith('Automazione aggiornata');
    });

    it('toasts error and rethrows on update failure', async () => {
      setHandler('PATCH', () => errorResponse('PATCH fail', 500));

      const { result } = renderHook(() => useAutomationsList());
      await waitFor(() => expect(result.current.loading).toBe(false));

      let caught: unknown;
      await act(async () => {
        try {
          await result.current.update(3, { name: 'x' });
        } catch (err) {
          caught = err;
        }
      });

      expect((caught as Error).message).toBe('PATCH fail');
      expect(mockToastError).toHaveBeenCalledWith('PATCH fail');
    });
  });

  describe('remove', () => {
    it('DELETEs /api/v1/automations/:id and toasts success', async () => {
      const { result } = renderHook(() => useAutomationsList());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.remove(42);
      });

      const deletes = getCalls('DELETE');
      expect(deletes).toHaveLength(1);
      expect(deletes[0]!.url).toBe('/api/v1/automations/42');
      expect(mockToastSuccess).toHaveBeenCalledWith('Automazione eliminata');
    });

    it('toasts error and rethrows on remove failure', async () => {
      setHandler('DELETE', () => errorResponse('DELETE fail', 500));

      const { result } = renderHook(() => useAutomationsList());
      await waitFor(() => expect(result.current.loading).toBe(false));

      let caught: unknown;
      await act(async () => {
        try {
          await result.current.remove(99);
        } catch (err) {
          caught = err;
        }
      });

      expect((caught as Error).message).toBe('DELETE fail');
      expect(mockToastError).toHaveBeenCalledWith('DELETE fail');
    });
  });

  describe('toggle (optimistic)', () => {
    it('optimistically flips enabled=true to false; does NOT toast success', async () => {
      const rule = makeRule({ id: 1, enabled: true });
      setHandler('GET', () => jsonResponse(makePaginatedResponse([rule])));
      setHandler('PATCH', () => jsonResponse({ ...rule, enabled: false }));

      const { result } = renderHook(() => useAutomationsList());
      await waitFor(() => expect(result.current.loading).toBe(false));

      // Rules now have the rule with enabled=true
      expect(result.current.rules[0]?.enabled).toBe(true);

      await act(async () => {
        await result.current.toggle(1, true);
      });

      // Optimistic update should flip enabled to false
      expect(result.current.rules[0]?.enabled).toBe(false);
      const patches = getCalls('PATCH');
      expect(patches).toHaveLength(1);
      expect(patches[0]!.url).toBe('/api/v1/automations/1');
      expect(patches[0]!.body).toEqual({ enabled: false });
      // No success toast on toggle (InlineToggle is its own feedback)
      expect(mockToastSuccess).not.toHaveBeenCalled();
    });

    it('optimistically flips enabled=false to true', async () => {
      const rule = makeRule({ id: 2, enabled: false });
      setHandler('GET', () => jsonResponse(makePaginatedResponse([rule])));
      setHandler('PATCH', () => jsonResponse({ ...rule, enabled: true }));

      const { result } = renderHook(() => useAutomationsList());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.toggle(2, false);
      });

      expect(result.current.rules[0]?.enabled).toBe(true);
      const patches = getCalls('PATCH');
      expect(patches[0]!.body).toEqual({ enabled: true });
    });

    it('rolls back optimistic update on toggle failure', async () => {
      const rule = makeRule({ id: 3, enabled: true });
      setHandler('GET', () => jsonResponse(makePaginatedResponse([rule])));
      setHandler('PATCH', () => errorResponse('Toggle fail', 500));

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
      setHandler('GET', () => jsonResponse(makePaginatedResponse([rule])));
      setHandler('PATCH', () => errorResponse('fail', 500));

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
