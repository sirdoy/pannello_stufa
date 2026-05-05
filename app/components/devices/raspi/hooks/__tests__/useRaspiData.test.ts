/**
 * Tests for useRaspiData Hook
 *
 * Validates loading state, data fetching from all 4 endpoints,
 * error handling, stale state, health computation,
 * WebSocket subscription, and polling fallback.
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import type { CpuResponse, MemoryResponse, DiskResponse, SystemResponse } from '@/types/raspi';
import type { RaspiData as WsRaspiData } from '@/types/websocket';

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

// Mock WS payload (RaspiData shape from types/websocket.ts)
const mockWsPayload: WsRaspiData = {
  cpu_percent: 25.3,
  memory: { total: 8589934592, available: 4294967296, percent: 50.0, used: 4294967296 },
  disk: { total: 32212254720, used: 12884901888, free: 19327352832, percent: 40.0 },
  system: { temperature: 42.5, uptime: 86400, load_avg: [0.5, 0.3, 0.2], process_count: 145 },
  data_freshness: 'LIVE',
};

// Fixture data
const mockCpu: CpuResponse = { cpu_percent: 25.3, data_freshness: 'LIVE' };
const mockMemory: MemoryResponse = { used_bytes: 500000000, total_bytes: 1000000000, percent: 50.0, data_freshness: 'LIVE' };
const mockDisk: DiskResponse = { used_bytes: 8000000000, total_bytes: 32000000000, percent: 25.0, mount_point: '/', data_freshness: 'LIVE' };
const mockSystem: SystemResponse = {
  cpu_temperature: 45.2,
  uptime_seconds: 86400,
  load_avg_1: 0.5,
  load_avg_5: 0.4,
  load_avg_15: 0.3,
  process_count: 120,
  network: { bytes_sent: 1000, bytes_recv: 2000, interface: 'eth0' },
  data_freshness: 'LIVE',
};

function makeFetchMock(overrides?: Partial<{
  cpuOk: boolean;
  memOk: boolean;
  diskOk: boolean;
  sysOk: boolean;
  cpu: CpuResponse;
  memory: MemoryResponse;
  disk: DiskResponse;
  system: SystemResponse;
}>) {
  const opts = {
    cpuOk: true,
    memOk: true,
    diskOk: true,
    sysOk: true,
    cpu: mockCpu,
    memory: mockMemory,
    disk: mockDisk,
    system: mockSystem,
    ...overrides,
  };

  return (url: string) => {
    if (url === '/api/raspi/cpu') {
      return Promise.resolve({ ok: opts.cpuOk, json: () => Promise.resolve(opts.cpu) });
    }
    if (url === '/api/raspi/memory') {
      return Promise.resolve({ ok: opts.memOk, json: () => Promise.resolve(opts.memory) });
    }
    if (url === '/api/raspi/disk') {
      return Promise.resolve({ ok: opts.diskOk, json: () => Promise.resolve(opts.disk) });
    }
    if (url === '/api/raspi/system') {
      return Promise.resolve({ ok: opts.sysOk, json: () => Promise.resolve(opts.system) });
    }
    return Promise.reject(new Error(`Unexpected URL: ${url as string}`));
  };
}

describe('useRaspiData', () => {
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

  // Import hook lazily after mocks are set up
  let useRaspiData: typeof import('../useRaspiData').useRaspiData;

  beforeAll(async () => {
    const mod = await import('../useRaspiData');
    useRaspiData = mod.useRaspiData;
  });

  it('Test 1: returns loading=true initially, then loading=false after fetch resolves', async () => {
    (global.fetch as jest.Mock).mockImplementation(makeFetchMock());

    const { result } = renderHook(() => useRaspiData());

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).not.toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('Test 2: fetches all 4 endpoints in Promise.all', async () => {
    (global.fetch as jest.Mock).mockImplementation(makeFetchMock());

    const { result } = renderHook(() => useRaspiData());

    await waitFor(() => expect(result.current.loading).toBe(false));

    const calls = (global.fetch as jest.Mock).mock.calls.map((c: [string]) => c[0] as string);
    expect(calls).toContain('/api/raspi/cpu');
    expect(calls).toContain('/api/raspi/memory');
    expect(calls).toContain('/api/raspi/disk');
    expect(calls).toContain('/api/raspi/system');
  });

  it('Test 3: returns error when all fetches fail and no cached data', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useRaspiData());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('Raspberry Pi non raggiungibile');
    expect(result.current.data).toBeNull();
  });

  it('Test 4: sets stale=true when fetch fails but cached data exists', async () => {
    // First fetch succeeds
    (global.fetch as jest.Mock).mockImplementation(makeFetchMock());

    const { result } = renderHook(() => useRaspiData());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).not.toBeNull();

    // Second fetch fails
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    // Manually invoke the callback again
    const callbackArg = mockUseAdaptivePolling.mock.calls[0]?.[0];
    if (callbackArg) {
      await callbackArg.callback();
    }

    await waitFor(() => expect(result.current.stale).toBe(true));

    // Data should still be present (not cleared)
    expect(result.current.data).not.toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('Test 5: computes health=ok when cpu < 80, mem < 80, disk < 75, temp < 70', async () => {
    (global.fetch as jest.Mock).mockImplementation(makeFetchMock({
      cpu: { cpu_percent: 40, data_freshness: 'LIVE' },
      memory: { ...mockMemory, percent: 60 },
      disk: { ...mockDisk, percent: 50 },
      system: { ...mockSystem, cpu_temperature: 55 },
    }));

    const { result } = renderHook(() => useRaspiData());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.health).toBe('ok');
  });

  it('Test 6: computes health=warning when cpu > 80', async () => {
    (global.fetch as jest.Mock).mockImplementation(makeFetchMock({
      cpu: { cpu_percent: 85, data_freshness: 'LIVE' },
    }));

    const { result } = renderHook(() => useRaspiData());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.health).toBe('warning');
  });

  it('Test 7: computes health=error when disk > 90', async () => {
    (global.fetch as jest.Mock).mockImplementation(makeFetchMock({
      disk: { ...mockDisk, percent: 92 },
    }));

    const { result } = renderHook(() => useRaspiData());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.health).toBe('error');
  });

  // ---------------------------------------------------------------------------
  // WebSocket primary channel
  // ---------------------------------------------------------------------------

  it('subscribes to raspi topic when WS is OPEN', async () => {
    setWsConnected(true);
    (global.fetch as jest.Mock).mockImplementation(makeFetchMock());

    renderHook(() => useRaspiData());

    expect(mockSubscribe).toHaveBeenCalledWith('raspi', expect.any(Function));
  });

  it('does not subscribe when WS is CLOSED', () => {
    setWsConnected(false);

    renderHook(() => useRaspiData());

    expect(mockSubscribe).not.toHaveBeenCalled();
  });

  it('unsubscribes on unmount', () => {
    setWsConnected(true);
    (global.fetch as jest.Mock).mockImplementation(makeFetchMock());

    const { unmount } = renderHook(() => useRaspiData());
    unmount();

    expect(mockUnsubscribe).toHaveBeenCalledWith('raspi', expect.any(Function));
  });

  it('suppresses polling when WS is OPEN (interval=null)', () => {
    setWsConnected(true);
    (global.fetch as jest.Mock).mockImplementation(makeFetchMock());

    renderHook(() => useRaspiData());

    const pollingArgs = mockUseAdaptivePolling.mock.calls[0]?.[0];
    expect(pollingArgs?.interval).toBeNull();
  });

  it('polls at 60000ms when WS is CLOSED (fallback)', () => {
    setWsConnected(false);
    (global.fetch as jest.Mock).mockImplementation(makeFetchMock());

    renderHook(() => useRaspiData());

    const pollingArgs = mockUseAdaptivePolling.mock.calls[0]?.[0];
    expect(pollingArgs?.interval).toBe(60000);
  });

  it('maps WS payload to RaspiData correctly', async () => {
    setWsConnected(true);
    (global.fetch as jest.Mock).mockImplementation(makeFetchMock());

    const { result } = renderHook(() => useRaspiData());

    // Get the handler that was passed to subscribe
    const handler = mockSubscribe.mock.calls[0]?.[1] as (data: unknown) => void;
    expect(handler).toBeDefined();

    // Simulate WS message
    act(() => { handler(mockWsPayload); });

    await waitFor(() => {
      expect(result.current.data).toEqual({
        cpuPercent: 25.3,
        memoryPercent: 50.0,
        diskPercent: 40.0,
        cpuTemperature: 42.5,
      });
    });
  });

  it('drops malformed WS payload (missing cpu_percent) without crashing', async () => {
    setWsConnected(true);
    (global.fetch as jest.Mock).mockImplementation(makeFetchMock());

    const { result } = renderHook(() => useRaspiData());
    await waitFor(() => expect(result.current.data).not.toBeNull());
    const goodData = result.current.data;

    const handler = mockSubscribe.mock.calls[0]?.[1] as (data: unknown) => void;
    const malformed = { ...mockWsPayload, cpu_percent: undefined as unknown as number };
    act(() => { handler(malformed); });

    // Data untouched — last known good preserved
    expect(result.current.data).toEqual(goodData);
  });

  it('sets stale=true when fetch returns payload with missing cpu_percent', async () => {
    (global.fetch as jest.Mock).mockImplementation(makeFetchMock({
      cpu: { data_freshness: 'LIVE' } as unknown as CpuResponse,
    }));

    const { result } = renderHook(() => useRaspiData());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toBeNull();
    expect(result.current.stale).toBe(true);
    expect(result.current.error).toBe('Raspberry Pi non raggiungibile');
  });

  it('sets lastUpdatedAt on WS message', async () => {
    setWsConnected(true);
    (global.fetch as jest.Mock).mockImplementation(makeFetchMock());

    const { result } = renderHook(() => useRaspiData());

    const handler = mockSubscribe.mock.calls[0]?.[1] as (data: unknown) => void;
    act(() => { handler(mockWsPayload); });

    await waitFor(() => {
      expect(result.current.lastUpdatedAt).toBeGreaterThan(0);
    });
  });
});
