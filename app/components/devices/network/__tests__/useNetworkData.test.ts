/**
 * Tests for useNetworkData Hook
 *
 * Validates state management, polling, error handling, and derived state.
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import { useNetworkData } from '../hooks/useNetworkData';
import type { BandwidthData, DeviceData, WanData } from '../types';
import { useWebSocketContext } from '@/app/context/WebSocketContext';
import { ReadyState } from '@/lib/hooks/useWebSocketManager';

// Mock dependencies
jest.mock('@/lib/hooks/useAdaptivePolling');
jest.mock('@/lib/hooks/useVisibility');
jest.mock('@/app/context/WebSocketContext');
jest.mock('../networkHealthUtils', () => ({
  computeNetworkHealth: jest.fn((params) => ({
    health: params.wanConnected ? 'excellent' : 'poor',
    consecutiveReadings: 1,
  })),
  mapHealthToDeviceCard: jest.fn((health) => health === 'excellent' ? 'ok' : 'critical'),
}));

// Import mocked modules
import { useAdaptivePolling } from '@/lib/hooks/useAdaptivePolling';
import { useVisibility } from '@/lib/hooks/useVisibility';

const mockUseVisibility = useVisibility as jest.MockedFunction<typeof useVisibility>;
const mockUseAdaptivePolling = useAdaptivePolling as jest.MockedFunction<typeof useAdaptivePolling>;

// Capture polling opts for WS assertions
let lastPollingOpts: Record<string, unknown> = {};

describe('useNetworkData', () => {
  let mockSubscribe: jest.Mock;
  let mockUnsubscribe: jest.Mock;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    lastPollingOpts = {};
    global.fetch = jest.fn();

    mockSubscribe = jest.fn();
    mockUnsubscribe = jest.fn();

    // Default: WS disconnected — existing HTTP polling tests unaffected
    jest.mocked(useWebSocketContext).mockReturnValue({
      subscribe: mockSubscribe,
      unsubscribe: mockUnsubscribe,
      readyState: ReadyState.CLOSED,
    });

    // Mock useVisibility to return true (visible)
    mockUseVisibility.mockReturnValue(true);

    // Mock useAdaptivePolling to capture options and call callback asynchronously (like real polling)
    mockUseAdaptivePolling.mockImplementation((opts) => {
      lastPollingOpts = opts as Record<string, unknown>;
      if (opts.immediate) {
        // Call async to avoid state updates during render
        setTimeout(() => opts.callback(), 0);
      }
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('has correct initial state', () => {
    // Mock fetch to never resolve (testing initial state)
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

    const { result } = renderHook(() => useNetworkData());

    expect(result.current.loading).toBe(true);
    expect(result.current.bandwidth).toBeNull();
    expect(result.current.wan).toBeNull();
    expect(result.current.devices).toEqual([]);
    expect(result.current.downloadHistory).toEqual([]);
    expect(result.current.uploadHistory).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(result.current.stale).toBe(false);
    expect(result.current.lastUpdated).toBeNull();
  });

  it('fetches data successfully and updates all state', async () => {
    const mockBandwidth: BandwidthData = {
      download: 50,
      upload: 30,
      timestamp: Date.now(),
    };

    const mockDevices: DeviceData[] = [
      { id: '1', name: 'Device 1', ip: '192.168.1.10', mac: 'AA:BB:CC:DD:EE:01', active: true },
      { id: '2', name: 'Device 2', ip: '192.168.1.11', mac: 'AA:BB:CC:DD:EE:02', active: false },
    ];

    const mockWan: WanData = {
      connected: true,
      uptime: 86400,
      externalIp: '1.2.3.4',
      linkSpeed: 100,
      timestamp: Date.now(),
    };

    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/bandwidth')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ bandwidth: mockBandwidth }),
        });
      }
      if (url.includes('/devices')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ devices: mockDevices }),
        });
      }
      if (url.includes('/wan')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ wan: mockWan }),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    const { result } = renderHook(() => useNetworkData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.bandwidth).toEqual(mockBandwidth);
    expect(result.current.devices).toEqual(mockDevices);
    expect(result.current.wan).toEqual(mockWan);
    expect(result.current.connected).toBe(true);
    expect(result.current.activeDeviceCount).toBe(1);
    expect(result.current.error).toBeNull();
    expect(result.current.stale).toBe(false);
    expect(result.current.lastUpdated).toBeGreaterThan(0);
  });

  it('appends sparkline data points on each fetch', async () => {
    let pollCycleCount = 0;
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      const bandwidth = {
        download: 50 + pollCycleCount,
        upload: 30 + pollCycleCount,
        timestamp: Date.now(),
      };

      if (url.includes('/bandwidth')) {
        // Increment after bandwidth endpoint (first of 3 calls in Promise.all)
        pollCycleCount++;
        return Promise.resolve({
          ok: true,
          json: async () => ({ bandwidth }),
        });
      }
      if (url.includes('/devices')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ devices: [] }),
        });
      }
      if (url.includes('/wan')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ wan: { connected: true, uptime: 100, timestamp: Date.now() } }),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    const { result } = renderHook(() => useNetworkData());

    // Wait for first fetch to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should have at least one sparkline point
    await waitFor(() => {
      expect(result.current.downloadHistory.length).toBeGreaterThan(0);
      expect(result.current.uploadHistory.length).toBeGreaterThan(0);
    });

    // Verify sparkline data has mbps values and timestamps
    expect(result.current.downloadHistory.every(point => typeof point.mbps === 'number')).toBe(true);
    expect(result.current.downloadHistory.every(point => typeof point.time === 'number')).toBe(true);
    expect(result.current.uploadHistory.every(point => typeof point.mbps === 'number')).toBe(true);
    expect(result.current.uploadHistory.every(point => typeof point.time === 'number')).toBe(true);
  });

  it('caps sparkline buffer at 12 points', async () => {
    let pollCount = 0;
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      const bandwidth = {
        download: 50 + pollCount,
        upload: 30 + pollCount,
        timestamp: Date.now(),
      };

      if (url.includes('/bandwidth')) {
        pollCount++;
        return Promise.resolve({
          ok: true,
          json: async () => ({ bandwidth }),
        });
      }
      if (url.includes('/devices')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ devices: [] }),
        });
      }
      if (url.includes('/wan')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ wan: { connected: true, uptime: 100, timestamp: Date.now() } }),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    const { result } = renderHook(() => useNetworkData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Trigger many manual fetches to exceed the 120-point limit
    for (let i = 0; i < 130; i++) {
      await mockUseAdaptivePolling.mock.calls[0]?.[0].callback();
      // Small delay to allow state updates
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    // Wait for buffer to stabilize
    await waitFor(() => {
      expect(result.current.downloadHistory.length).toBeLessThanOrEqual(120);
    });

    // Should cap at 120 (2h at 60s interval)
    expect(result.current.downloadHistory.length).toBeLessThanOrEqual(120);
    expect(result.current.uploadHistory.length).toBeLessThanOrEqual(120);

    // If we have 120 points, verify oldest are removed
    if (result.current.downloadHistory.length === 120) {
      // Last point should be from a later poll than first point
      const firstMbps = result.current.downloadHistory[0]?.mbps || 0;
      const lastMbps = result.current.downloadHistory[119]?.mbps || 0;
      expect(lastMbps).toBeGreaterThan(firstMbps);
    }
  }, 15000);

  it('preserves cached data on API error', async () => {
    const mockBandwidth: BandwidthData = {
      download: 50,
      upload: 30,
      timestamp: Date.now(),
    };

    let shouldFail = false;
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (shouldFail) {
        if (url.includes('/bandwidth')) {
          return Promise.resolve({
            ok: false,
            json: async () => ({ code: 'FRITZBOX_TIMEOUT', message: 'Timeout' }),
          });
        }
      }

      if (url.includes('/bandwidth')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ bandwidth: mockBandwidth }),
        });
      }
      if (url.includes('/devices')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ devices: [] }),
        });
      }
      if (url.includes('/wan')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ wan: { connected: true, uptime: 100, timestamp: Date.now() } }),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    const { result } = renderHook(() => useNetworkData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const cachedBandwidth = result.current.bandwidth;
    expect(cachedBandwidth).toEqual(mockBandwidth);

    // Trigger error
    shouldFail = true;
    mockUseAdaptivePolling.mock.calls[0]?.[0].callback();

    await waitFor(() => {
      expect(result.current.stale).toBe(true);
    });

    // Cached data should still be there
    expect(result.current.bandwidth).toEqual(cachedBandwidth);
  });

  it('sets setup error for TR064_NOT_ENABLED', async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/bandwidth')) {
        return Promise.resolve({
          ok: false,
          json: async () => ({ code: 'TR064_NOT_ENABLED', message: 'TR-064 disabled' }),
        });
      }
      // Other endpoints should succeed or also fail - doesn't matter, first error is used
      return Promise.resolve({
        ok: true,
        json: async () => ({ devices: [], wan: { connected: true, uptime: 100, timestamp: Date.now() } }),
      });
    });

    const { result } = renderHook(() => useNetworkData());

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
    });

    expect(result.current.error?.type).toBe('setup');
    expect(result.current.error?.message).toContain('TR-064');
  });

  it('sets rate_limited error with retryAfter', async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/bandwidth')) {
        return Promise.resolve({
          ok: false,
          json: async () => ({
            code: 'RATE_LIMITED',
            message: 'Too many requests',
            retryAfter: 60,
          }),
        });
      }
      // Other endpoints succeed
      return Promise.resolve({
        ok: true,
        json: async () => ({ devices: [], wan: { connected: true, uptime: 100, timestamp: Date.now() } }),
      });
    });

    const { result } = renderHook(() => useNetworkData());

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
    });

    expect(result.current.error?.type).toBe('rate_limited');
    expect(result.current.error?.retryAfter).toBe(60);
  });

  it('sets stale flag on timeout error without clearing data', async () => {
    const mockBandwidth: BandwidthData = {
      download: 50,
      upload: 30,
      timestamp: Date.now(),
    };

    let shouldTimeout = false;
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (shouldTimeout && url.includes('/bandwidth')) {
        return Promise.resolve({
          ok: false,
          json: async () => ({ code: 'FRITZBOX_TIMEOUT', message: 'Timeout' }),
        });
      }

      if (url.includes('/bandwidth')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ bandwidth: mockBandwidth }),
        });
      }
      if (url.includes('/devices')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ devices: [] }),
        });
      }
      if (url.includes('/wan')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ wan: { connected: true, uptime: 100, timestamp: Date.now() } }),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    const { result } = renderHook(() => useNetworkData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.bandwidth).toEqual(mockBandwidth);

    // Trigger timeout
    shouldTimeout = true;
    mockUseAdaptivePolling.mock.calls[0]?.[0].callback();

    await waitFor(() => {
      expect(result.current.stale).toBe(true);
    });

    // Should NOT have cleared bandwidth
    expect(result.current.bandwidth).toEqual(mockBandwidth);
    // Should NOT have set error (timeout is non-fatal)
    expect(result.current.error).toBeNull();
  });

  it('handles network error (fetch throws) by preserving cached data', async () => {
    const mockBandwidth: BandwidthData = {
      download: 50,
      upload: 30,
      timestamp: Date.now(),
    };

    let shouldThrow = false;
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (shouldThrow) {
        return Promise.reject(new Error('Network error'));
      }

      if (url.includes('/bandwidth')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ bandwidth: mockBandwidth }),
        });
      }
      if (url.includes('/devices')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ devices: [] }),
        });
      }
      if (url.includes('/wan')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ wan: { connected: true, uptime: 100, timestamp: Date.now() } }),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    const { result } = renderHook(() => useNetworkData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const cachedBandwidth = result.current.bandwidth;

    // Trigger network error
    shouldThrow = true;
    mockUseAdaptivePolling.mock.calls[0]?.[0].callback();

    await waitFor(() => {
      expect(result.current.stale).toBe(true);
    });

    // Should preserve cached data
    expect(result.current.bandwidth).toEqual(cachedBandwidth);
  });

  it('sets loading to false after first fetch (success)', async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/bandwidth')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ bandwidth: { download: 50, upload: 30, timestamp: Date.now() } }),
        });
      }
      if (url.includes('/devices')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ devices: [] }),
        });
      }
      if (url.includes('/wan')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ wan: { connected: true, uptime: 100, timestamp: Date.now() } }),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    const { result } = renderHook(() => useNetworkData());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('sets loading to false after first fetch (error)', async () => {
    (global.fetch as jest.Mock).mockImplementation(() => {
      return Promise.resolve({
        ok: false,
        json: async () => ({ code: 'GENERIC_ERROR', message: 'Error' }),
      });
    });

    const { result } = renderHook(() => useNetworkData());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('calculates activeDeviceCount correctly', async () => {
    const mockDevices: DeviceData[] = [
      { id: '1', name: 'Device 1', ip: '192.168.1.10', mac: 'AA:BB:CC:DD:EE:01', active: true },
      { id: '2', name: 'Device 2', ip: '192.168.1.11', mac: 'AA:BB:CC:DD:EE:02', active: true },
      { id: '3', name: 'Device 3', ip: '192.168.1.12', mac: 'AA:BB:CC:DD:EE:03', active: false },
      { id: '4', name: 'Device 4', ip: '192.168.1.13', mac: 'AA:BB:CC:DD:EE:04', active: true },
    ];

    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/bandwidth')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ bandwidth: { download: 50, upload: 30, timestamp: Date.now() } }),
        });
      }
      if (url.includes('/devices')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ devices: mockDevices }),
        });
      }
      if (url.includes('/wan')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ wan: { connected: true, uptime: 100, timestamp: Date.now() } }),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    const { result } = renderHook(() => useNetworkData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.activeDeviceCount).toBe(3);
  });

  it('derives connected status from wan.connected', async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/bandwidth')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ bandwidth: { download: 50, upload: 30, timestamp: Date.now() } }),
        });
      }
      if (url.includes('/devices')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ devices: [] }),
        });
      }
      if (url.includes('/wan')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ wan: { connected: false, uptime: 0, timestamp: Date.now() } }),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    const { result } = renderHook(() => useNetworkData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.connected).toBe(false);
  });

  describe('WebSocket integration', () => {
    const mockWsPayload = {
      devices: [{ ip: '192.168.1.1', name: 'TestDevice', mac: 'AA:BB:CC:DD:EE:FF', status: 1 }],
      bandwidth: { upstream_bps: 5_000_000, downstream_bps: 50_000_000, bytes_sent: 0, bytes_received: 0 },
      wan: { is_connected: true, is_linked: true, uptime: 3600, external_ip: '1.2.3.4', max_upstream_bps: 50_000_000, max_downstream_bps: 250_000_000 },
    };

    it('subscribes to fritzbox topic when readyState is OPEN', () => {
      jest.mocked(useWebSocketContext).mockReturnValue({
        subscribe: mockSubscribe,
        unsubscribe: mockUnsubscribe,
        readyState: ReadyState.OPEN,
      });

      // Mock fetch to never resolve
      (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

      renderHook(() => useNetworkData());

      expect(mockSubscribe).toHaveBeenCalled();
      expect(mockSubscribe).toHaveBeenCalledWith('fritzbox', expect.any(Function));
    });

    it('does NOT subscribe when readyState is CLOSED', () => {
      // Default mock is CLOSED — no override needed
      (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

      renderHook(() => useNetworkData());

      expect(mockSubscribe).not.toHaveBeenCalledWith('fritzbox', expect.any(Function));
    });

    it('passes interval=null to useAdaptivePolling when WS OPEN', () => {
      jest.mocked(useWebSocketContext).mockReturnValue({
        subscribe: mockSubscribe,
        unsubscribe: mockUnsubscribe,
        readyState: ReadyState.OPEN,
      });

      (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

      renderHook(() => useNetworkData());

      expect(lastPollingOpts).not.toBeNull();
      expect(lastPollingOpts.interval).toBeNull();
    });

    it('passes visibility-aware interval (60000) to useAdaptivePolling when WS CLOSED + visible', () => {
      // Default mock: CLOSED, useVisibility returns true (already set in beforeEach)
      (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

      renderHook(() => useNetworkData());

      expect(lastPollingOpts).not.toBeNull();
      expect(lastPollingOpts.interval).toBe(60000);
    });

    it('passes interval=300000 when WS CLOSED + hidden', () => {
      // Override visibility to hidden
      mockUseVisibility.mockReturnValue(false);

      (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

      renderHook(() => useNetworkData());

      expect(lastPollingOpts).not.toBeNull();
      expect(lastPollingOpts.interval).toBe(300000);
    });

    it('preserves alwaysActive=false', () => {
      (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

      renderHook(() => useNetworkData());

      expect(lastPollingOpts.alwaysActive).toBe(false);
    });

    it('WS handleMessage maps bandwidth bps to Mbps', async () => {
      let capturedCallback: ((data: unknown) => void) | null = null;
      mockSubscribe.mockImplementation((_topic: string, cb: (data: unknown) => void) => {
        capturedCallback = cb;
      });

      jest.mocked(useWebSocketContext).mockReturnValue({
        subscribe: mockSubscribe,
        unsubscribe: mockUnsubscribe,
        readyState: ReadyState.OPEN,
      });

      (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useNetworkData());

      await act(async () => {
        capturedCallback?.(mockWsPayload);
      });

      expect(result.current.bandwidth?.download).toBe(50); // 50_000_000 / 1_000_000
      expect(result.current.bandwidth?.upload).toBe(5);    // 5_000_000 / 1_000_000
    });

    it('WS handleMessage maps device status 0|1 to active boolean', async () => {
      let capturedCallback: ((data: unknown) => void) | null = null;
      mockSubscribe.mockImplementation((_topic: string, cb: (data: unknown) => void) => {
        capturedCallback = cb;
      });

      jest.mocked(useWebSocketContext).mockReturnValue({
        subscribe: mockSubscribe,
        unsubscribe: mockUnsubscribe,
        readyState: ReadyState.OPEN,
      });

      (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useNetworkData());

      // Test status:1 → active:true
      await act(async () => {
        capturedCallback?.(mockWsPayload);
      });

      expect(result.current.devices[0]?.active).toBe(true);

      // Test status:0 → active:false
      await act(async () => {
        capturedCallback?.({
          ...mockWsPayload,
          devices: [{ ip: '192.168.1.1', name: 'TestDevice', mac: 'AA:BB:CC:DD:EE:FF', status: 0 }],
        });
      });

      expect(result.current.devices[0]?.active).toBe(false);
    });

    it('WS handleMessage maps WAN fields (is_connected → connected, max_downstream_bps/1_000_000 → linkSpeed)', async () => {
      let capturedCallback: ((data: unknown) => void) | null = null;
      mockSubscribe.mockImplementation((_topic: string, cb: (data: unknown) => void) => {
        capturedCallback = cb;
      });

      jest.mocked(useWebSocketContext).mockReturnValue({
        subscribe: mockSubscribe,
        unsubscribe: mockUnsubscribe,
        readyState: ReadyState.OPEN,
      });

      (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useNetworkData());

      await act(async () => {
        capturedCallback?.(mockWsPayload);
      });

      expect(result.current.wan?.connected).toBe(true);
      expect(result.current.wan?.uptime).toBe(3600);
      expect(result.current.wan?.linkSpeed).toBe(250); // 250_000_000 / 1_000_000
    });

    it('WS handleMessage appends to sparkline arrays without reset', async () => {
      let capturedCallback: ((data: unknown) => void) | null = null;
      mockSubscribe.mockImplementation((_topic: string, cb: (data: unknown) => void) => {
        capturedCallback = cb;
      });

      jest.mocked(useWebSocketContext).mockReturnValue({
        subscribe: mockSubscribe,
        unsubscribe: mockUnsubscribe,
        readyState: ReadyState.OPEN,
      });

      (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useNetworkData());

      // First WS message
      await act(async () => {
        capturedCallback?.(mockWsPayload);
      });

      const lengthAfterFirst = result.current.downloadHistory.length;
      expect(lengthAfterFirst).toBeGreaterThan(0);

      // Second WS message — should append, not reset
      await act(async () => {
        capturedCallback?.({
          ...mockWsPayload,
          bandwidth: { upstream_bps: 3_000_000, downstream_bps: 30_000_000, bytes_sent: 0, bytes_received: 0 },
        });
      });

      expect(result.current.downloadHistory.length).toBeGreaterThan(lengthAfterFirst);
    });

    it('WS handleMessage sets loading=false, stale=false, and lastUpdated', async () => {
      let capturedCallback: ((data: unknown) => void) | null = null;
      mockSubscribe.mockImplementation((_topic: string, cb: (data: unknown) => void) => {
        capturedCallback = cb;
      });

      jest.mocked(useWebSocketContext).mockReturnValue({
        subscribe: mockSubscribe,
        unsubscribe: mockUnsubscribe,
        readyState: ReadyState.OPEN,
      });

      // Polling suppressed — don't auto-call callback
      mockUseAdaptivePolling.mockImplementation((opts) => {
        lastPollingOpts = opts as Record<string, unknown>;
        // interval=null means polling is suppressed, don't call callback
      });

      (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useNetworkData());

      // Initially loading
      expect(result.current.loading).toBe(true);

      await act(async () => {
        capturedCallback?.(mockWsPayload);
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.stale).toBe(false);
      expect(result.current.lastUpdated).toBeGreaterThan(0);
    });

    it('unsubscribes from fritzbox topic on unmount', () => {
      let capturedCallback: ((data: unknown) => void) | null = null;
      mockSubscribe.mockImplementation((_topic: string, cb: (data: unknown) => void) => {
        capturedCallback = cb;
      });

      jest.mocked(useWebSocketContext).mockReturnValue({
        subscribe: mockSubscribe,
        unsubscribe: mockUnsubscribe,
        readyState: ReadyState.OPEN,
      });

      (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

      const { unmount } = renderHook(() => useNetworkData());

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalledWith('fritzbox', capturedCallback);
    });
  });
});
