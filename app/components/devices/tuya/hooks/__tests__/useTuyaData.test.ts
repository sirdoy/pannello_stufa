/**
 * Tests for useTuyaData Hook
 *
 * Validates loading state, data fetching from /api/tuya/plugs,
 * error handling, stale state, WebSocket subscription, and polling fallback.
 * Mirrors the pattern from useRaspiData.test.ts.
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import type { TuyaData } from '@/types/websocket';
import type { TuyaPlug } from '@/types/tuyaProxy';

// Mock dependencies (order matters: mocks before imports)
jest.mock('@/lib/hooks/useAdaptivePolling');
jest.mock('@/lib/hooks/useVisibility');
jest.mock('@/app/context/WebSocketContext');
jest.mock('@/lib/hooks/useWebSocketManager', () => ({
  ReadyState: { OPEN: 1, CLOSED: 3, CONNECTING: 0, CLOSING: 2, UNINSTANTIATED: -1 },
}));

// Import mocked modules
import { useAdaptivePolling } from '@/lib/hooks/useAdaptivePolling';
import { useVisibility } from '@/lib/hooks/useVisibility';
import { useWebSocketContext } from '@/app/context/WebSocketContext';

const mockUseVisibility = useVisibility as jest.MockedFunction<typeof useVisibility>;
const mockUseAdaptivePolling = useAdaptivePolling as jest.MockedFunction<typeof useAdaptivePolling>;
const mockUseWebSocketContext = useWebSocketContext as jest.MockedFunction<typeof useWebSocketContext>;

// WS mock helpers
const mockSubscribe = jest.fn();
const mockUnsubscribe = jest.fn();

function setWsConnected(connected: boolean) {
  mockUseWebSocketContext.mockReturnValue({
    subscribe: mockSubscribe,
    unsubscribe: mockUnsubscribe,
    readyState: connected ? 1 : 3,  // ReadyState.OPEN : ReadyState.CLOSED
  } as ReturnType<typeof useWebSocketContext>);
}

// Mock TuyaPlug fixture
const mockPlug: TuyaPlug = {
  device_id: 'bf_test_plug_001',
  switch_on: true,
  power_w: 45.2,
  voltage_v: 230.1,
  current_ma: 196.5,
  energy_kwh: 1.23,
  countdown_s: 0,
  data_freshness: 'LIVE',
  last_polled_at: 1711800000,
  custom_name: 'Presa Soggiorno',
  device_type: 'smart_plug',
};

// Mock WS payload (TuyaData shape)
const mockWsPayload: TuyaData = {
  plugs: [mockPlug],
  data_freshness: 'LIVE',
};

// Polling response (array of TuyaPlug)
const mockPlugsResponse: TuyaPlug[] = [mockPlug];

function makeFetchMock(overrides?: { ok?: boolean; data?: TuyaPlug[] }) {
  const opts = {
    ok: true,
    data: mockPlugsResponse,
    ...overrides,
  };
  return () =>
    Promise.resolve({
      ok: opts.ok,
      json: () => Promise.resolve({ success: true, plugs: opts.data }),
    });
}

describe('useTuyaData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();

    mockUseVisibility.mockReturnValue(true);
    setWsConnected(false);  // default: polling mode

    mockUseAdaptivePolling.mockImplementation(({ callback, immediate }) => {
      if (immediate) {
        setTimeout(() => void callback(), 0);
      }
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  let useTuyaData: typeof import('../useTuyaData').useTuyaData;

  beforeAll(async () => {
    const mod = await import('../useTuyaData');
    useTuyaData = mod.useTuyaData;
  });

  it('Test 1: returns loading=true initially, then loading=false after fetch resolves', async () => {
    (global.fetch as jest.Mock).mockImplementation(makeFetchMock());

    const { result } = renderHook(() => useTuyaData());

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.plugs).not.toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('Test 2: fetches /api/tuya/plugs endpoint', async () => {
    (global.fetch as jest.Mock).mockImplementation(makeFetchMock());

    const { result } = renderHook(() => useTuyaData());

    await waitFor(() => expect(result.current.loading).toBe(false));

    const calls = (global.fetch as jest.Mock).mock.calls.map((c: [string]) => c[0] as string);
    expect(calls).toContain('/api/tuya/plugs');
  });

  it('Test 3: returns error when fetch fails and no cached data', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useTuyaData());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('Tuya non raggiungibile');
    expect(result.current.plugs).toBeNull();
  });

  it('Test 4: sets stale=true when fetch fails but cached data exists', async () => {
    // First fetch succeeds
    (global.fetch as jest.Mock).mockImplementation(makeFetchMock());

    const { result } = renderHook(() => useTuyaData());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.plugs).not.toBeNull();

    // Second fetch fails
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    const callbackArg = mockUseAdaptivePolling.mock.calls[0]?.[0];
    if (callbackArg) {
      await callbackArg.callback();
    }

    await waitFor(() => expect(result.current.stale).toBe(true));

    // Data should still be present (not cleared)
    expect(result.current.plugs).not.toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('Test 5: sets stale=true when data_freshness is STALE', async () => {
    const stalePlugs: TuyaPlug[] = [{ ...mockPlug, data_freshness: 'STALE' }];
    (global.fetch as jest.Mock).mockImplementation(makeFetchMock({ data: stalePlugs }));

    const { result } = renderHook(() => useTuyaData());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.stale).toBe(true);
  });

  it('Test 6: sets stale=true when data_freshness is UNREACHABLE', async () => {
    const unreachablePlugs: TuyaPlug[] = [{ ...mockPlug, data_freshness: 'UNREACHABLE' }];
    (global.fetch as jest.Mock).mockImplementation(makeFetchMock({ data: unreachablePlugs }));

    const { result } = renderHook(() => useTuyaData());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.stale).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // WebSocket primary channel
  // ---------------------------------------------------------------------------

  it('subscribes to tuya topic when WS is OPEN', async () => {
    setWsConnected(true);
    (global.fetch as jest.Mock).mockImplementation(makeFetchMock());

    renderHook(() => useTuyaData());

    expect(mockSubscribe).toHaveBeenCalledWith('tuya', expect.any(Function));
  });

  it('does not subscribe when WS is CLOSED', () => {
    setWsConnected(false);

    renderHook(() => useTuyaData());

    expect(mockSubscribe).not.toHaveBeenCalled();
  });

  it('unsubscribes on unmount', () => {
    setWsConnected(true);
    (global.fetch as jest.Mock).mockImplementation(makeFetchMock());

    const { unmount } = renderHook(() => useTuyaData());
    unmount();

    expect(mockUnsubscribe).toHaveBeenCalledWith('tuya', expect.any(Function));
  });

  it('suspends polling when WS is connected', () => {
    setWsConnected(true);
    (global.fetch as jest.Mock).mockImplementation(makeFetchMock());

    renderHook(() => useTuyaData());

    const pollingArgs = mockUseAdaptivePolling.mock.calls[0]?.[0];
    expect(pollingArgs?.interval).toBeNull();
  });

  it('maps WS payload to plugs correctly', async () => {
    setWsConnected(true);
    (global.fetch as jest.Mock).mockImplementation(makeFetchMock());

    const { result } = renderHook(() => useTuyaData());

    // Get the handler that was passed to subscribe
    const handler = mockSubscribe.mock.calls[0]?.[1] as (data: unknown) => void;
    expect(handler).toBeDefined();

    // Simulate WS message
    act(() => { handler(mockWsPayload); });

    await waitFor(() => {
      expect(result.current.plugs).toEqual([mockPlug]);
    });
  });

  it('guards against null plugs in WS payload', async () => {
    setWsConnected(true);
    (global.fetch as jest.Mock).mockImplementation(makeFetchMock());

    const { result } = renderHook(() => useTuyaData());

    const handler = mockSubscribe.mock.calls[0]?.[1] as (data: unknown) => void;
    expect(handler).toBeDefined();

    // Simulate WS message with null plugs
    const nullPayload: TuyaData = { plugs: null, data_freshness: 'STALE' };
    act(() => { handler(nullPayload); });

    // Should not crash or set plugs to null (retains previous value or stays null but no error)
    // We just verify no exception was thrown and loading became false
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('sets lastUpdatedAt on WS message', async () => {
    setWsConnected(true);
    (global.fetch as jest.Mock).mockImplementation(makeFetchMock());

    const { result } = renderHook(() => useTuyaData());

    const handler = mockSubscribe.mock.calls[0]?.[1] as (data: unknown) => void;
    act(() => { handler(mockWsPayload); });

    await waitFor(() => {
      expect(result.current.lastUpdatedAt).toBeGreaterThan(0);
    });
  });
});
