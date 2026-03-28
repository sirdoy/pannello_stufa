/**
 * Tests for useDirigeraData Hook
 *
 * Validates HTTP polling path and WebSocket primary channel.
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { ReadyState } from '@/lib/hooks/useWebSocketManager';

// Mock dependencies (order matters: mocks before imports)
jest.mock('@/lib/hooks/useAdaptivePolling');
jest.mock('@/lib/hooks/useVisibility');
jest.mock('@/app/context/WebSocketContext');
jest.mock('@/lib/hooks/useWebSocketManager', () => ({
  ReadyState: { OPEN: 1, CLOSED: 3, CONNECTING: 0, CLOSING: 2, UNINSTANTIATED: -1 },
}));

import { useAdaptivePolling } from '@/lib/hooks/useAdaptivePolling';
import { useVisibility } from '@/lib/hooks/useVisibility';
import { useWebSocketContext } from '@/app/context/WebSocketContext';
import { useDirigeraData, computeDirigeraHealth } from '../useDirigeraData';
import type { DirigeraData } from '@/types/websocket';

// Typed mocks
const mockUseAdaptivePolling = useAdaptivePolling as jest.MockedFunction<typeof useAdaptivePolling>;
const mockUseVisibility = useVisibility as jest.MockedFunction<typeof useVisibility>;
const mockUseWebSocketContext = useWebSocketContext as jest.MockedFunction<typeof useWebSocketContext>;

// Mock WS payload with three sensors using proxy DirigeraSensor shape
const mockWsPayload: DirigeraData = {
  sensors: [
    {
      id: '1',
      type: 'openCloseSensor',
      custom_name: 'Door',
      room: 'Living',
      firmware_version: '1.0',
      battery_percentage: 85,
      is_reachable: true,
      last_seen: '2026-03-27T10:00:00Z',
      is_open: true,
    },
    {
      id: '2',
      type: 'openCloseSensor',
      custom_name: 'Window',
      room: 'Bedroom',
      firmware_version: '1.0',
      battery_percentage: 15, // low battery
      is_reachable: true,
      last_seen: '2026-03-27T10:00:00Z',
      is_open: false,
    },
    {
      id: '3',
      type: 'occupancySensor',
      custom_name: 'Hall',
      room: 'Hall',
      firmware_version: '1.0',
      battery_percentage: null,
      is_reachable: false, // offline
      last_seen: null,
      is_open: null, // motion sensors have is_open: null
    },
  ],
  data_freshness: 'LIVE',
};

describe('useDirigeraData', () => {
  let mockSubscribe: jest.Mock;
  let mockUnsubscribe: jest.Mock;

  beforeEach(() => {
    jest.resetAllMocks();
    mockSubscribe = jest.fn();
    mockUnsubscribe = jest.fn();

    jest.mocked(useVisibility).mockReturnValue(true);

    // Default: WS disconnected
    mockUseWebSocketContext.mockReturnValue({
      subscribe: mockSubscribe,
      unsubscribe: mockUnsubscribe,
      readyState: ReadyState.CLOSED,
    });

    // Capture polling callback but do not auto-invoke
    mockUseAdaptivePolling.mockImplementation(() => undefined);

    // Default fetch mock: health + summary
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ firmware_version: '2.4.62', connected_sensors: 3, is_reachable: true }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ total_sensors: 3, open_count: 1, offline_count: 0, low_battery_count: 0, is_stale: false }),
      }) as jest.Mock;
  });

  // ---------------------------------------------------------------------------
  // HTTP polling path
  // ---------------------------------------------------------------------------

  describe('HTTP polling path', () => {
    it('fetches health and summary on mount via polling callback', async () => {
      let capturedCallback: (() => Promise<void>) | null = null;
      mockUseAdaptivePolling.mockImplementation((opts) => {
        capturedCallback = opts.callback as () => Promise<void>;
      });

      const { result } = renderHook(() => useDirigeraData());

      // Trigger the polling callback manually (simulates useAdaptivePolling immediate:true)
      await act(async () => {
        await capturedCallback?.();
      });

      const fetchMock = global.fetch as jest.Mock;
      expect(fetchMock).toHaveBeenCalledWith('/api/dirigera/health');
      expect(fetchMock).toHaveBeenCalledWith('/api/dirigera/sensors/summary');
    });

    it('returns data with health and summary after successful fetch', async () => {
      let capturedCallback: (() => Promise<void>) | null = null;
      mockUseAdaptivePolling.mockImplementation((opts) => {
        capturedCallback = opts.callback as () => Promise<void>;
      });

      const { result } = renderHook(() => useDirigeraData());

      await act(async () => {
        await capturedCallback?.();
      });

      expect(result.current.data).not.toBeNull();
      expect(result.current.data?.health.firmware_version).toBe('2.4.62');
      expect(result.current.data?.summary.total_sensors).toBe(3);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('sets stale to true on fetch error', async () => {
      let capturedCallback: (() => Promise<void>) | null = null;
      mockUseAdaptivePolling.mockImplementation((opts) => {
        capturedCallback = opts.callback as () => Promise<void>;
      });

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({}),
      }) as jest.Mock;

      const { result } = renderHook(() => useDirigeraData());

      await act(async () => {
        await capturedCallback?.();
      });

      expect(result.current.stale).toBe(true);
      expect(result.current.error).toBe('DIRIGERA non raggiungibile');
    });

    it('computes health as ok when no offline or low-battery sensors', async () => {
      let capturedCallback: (() => Promise<void>) | null = null;
      mockUseAdaptivePolling.mockImplementation((opts) => {
        capturedCallback = opts.callback as () => Promise<void>;
      });

      const { result } = renderHook(() => useDirigeraData());

      await act(async () => {
        await capturedCallback?.();
      });

      expect(result.current.health).toBe('ok');
    });

    it('computes health as error when offline sensors present', async () => {
      let capturedCallback: (() => Promise<void>) | null = null;
      mockUseAdaptivePolling.mockImplementation((opts) => {
        capturedCallback = opts.callback as () => Promise<void>;
      });

      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ firmware_version: '2.4.62', connected_sensors: 3, is_reachable: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ total_sensors: 3, open_count: 0, offline_count: 1, low_battery_count: 0, is_stale: false }),
        }) as jest.Mock;

      const { result } = renderHook(() => useDirigeraData());

      await act(async () => {
        await capturedCallback?.();
      });

      expect(result.current.health).toBe('error');
    });

    it('computes health as warning when only low-battery sensors present', async () => {
      let capturedCallback: (() => Promise<void>) | null = null;
      mockUseAdaptivePolling.mockImplementation((opts) => {
        capturedCallback = opts.callback as () => Promise<void>;
      });

      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ firmware_version: '2.4.62', connected_sensors: 3, is_reachable: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ total_sensors: 3, open_count: 0, offline_count: 0, low_battery_count: 2, is_stale: false }),
        }) as jest.Mock;

      const { result } = renderHook(() => useDirigeraData());

      await act(async () => {
        await capturedCallback?.();
      });

      expect(result.current.health).toBe('warning');
    });
  });

  // ---------------------------------------------------------------------------
  // WebSocket primary channel
  // ---------------------------------------------------------------------------

  describe('WebSocket primary channel', () => {
    beforeEach(() => {
      // Override: WS connected
      mockUseWebSocketContext.mockReturnValue({
        subscribe: mockSubscribe,
        unsubscribe: mockUnsubscribe,
        readyState: ReadyState.OPEN,
      });
    });

    it('subscribes to dirigera topic when WS is OPEN', () => {
      renderHook(() => useDirigeraData());

      expect(mockSubscribe).toHaveBeenCalledWith('dirigera', expect.any(Function));
    });

    it('does not subscribe when WS is CLOSED', () => {
      // Override: WS disconnected
      mockUseWebSocketContext.mockReturnValue({
        subscribe: mockSubscribe,
        unsubscribe: mockUnsubscribe,
        readyState: ReadyState.CLOSED,
      });

      renderHook(() => useDirigeraData());

      expect(mockSubscribe).not.toHaveBeenCalled();
    });

    it('derives summary from WS sensors array with correct counts', async () => {
      const { result } = renderHook(() => useDirigeraData());

      // Capture the handleMessage from subscribe mock
      const handleMessage = mockSubscribe.mock.calls[0]?.[1] as (raw: unknown) => void;
      expect(handleMessage).toBeDefined();

      await act(async () => {
        handleMessage(mockWsPayload);
      });

      expect(result.current.data?.summary.total_sensors).toBe(3);
      expect(result.current.data?.summary.open_count).toBe(1); // only Door is open
      expect(result.current.data?.summary.offline_count).toBe(1); // only Hall is offline
      expect(result.current.data?.summary.low_battery_count).toBe(1); // Window at 15%
      expect(result.current.data?.summary.is_stale).toBe(false);
    });

    it('sets stale to false on WS message', async () => {
      const { result } = renderHook(() => useDirigeraData());

      const handleMessage = mockSubscribe.mock.calls[0]?.[1] as (raw: unknown) => void;

      await act(async () => {
        handleMessage(mockWsPayload);
      });

      expect(result.current.stale).toBe(false);
    });

    it('fires health side-fetch after WS data update', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ firmware_version: '2.4.62', connected_sensors: 3, is_reachable: true }),
      }) as jest.Mock;

      renderHook(() => useDirigeraData());

      const handleMessage = mockSubscribe.mock.calls[0]?.[1] as (raw: unknown) => void;

      await act(async () => {
        handleMessage(mockWsPayload);
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/dirigera/health');
      });
    });

    it('suppresses polling when WS is connected (interval: null)', () => {
      renderHook(() => useDirigeraData());

      const pollingCall = mockUseAdaptivePolling.mock.calls[0]?.[0];
      expect(pollingCall?.interval).toBeNull();
    });

    it('cleans up subscription on unmount', () => {
      const { unmount } = renderHook(() => useDirigeraData());

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalledWith('dirigera', expect.any(Function));
    });

    it('computeDirigeraHealth returns error for WS-derived summary with offline sensor', async () => {
      const { result } = renderHook(() => useDirigeraData());

      const handleMessage = mockSubscribe.mock.calls[0]?.[1] as (raw: unknown) => void;

      await act(async () => {
        handleMessage(mockWsPayload);
      });

      // mockWsPayload has 1 offline sensor → health should be 'error'
      expect(result.current.health).toBe('error');
    });

    it('handles empty sensors array from WS without errors', async () => {
      const { result } = renderHook(() => useDirigeraData());

      const handleMessage = mockSubscribe.mock.calls[0]?.[1] as (raw: unknown) => void;

      await act(async () => {
        handleMessage({ sensors: [], data_freshness: 'LIVE' } as DirigeraData);
      });

      expect(result.current.data?.summary.total_sensors).toBe(0);
      expect(result.current.data?.summary.offline_count).toBe(0);
      expect(result.current.data?.summary.low_battery_count).toBe(0);
      expect(result.current.data?.summary.open_count).toBe(0);
      expect(result.current.health).toBe('ok');
    });
  });

  // ---------------------------------------------------------------------------
  // computeDirigeraHealth utility
  // ---------------------------------------------------------------------------

  describe('computeDirigeraHealth', () => {
    it('returns ok when no issues', () => {
      expect(computeDirigeraHealth({ total_sensors: 5, open_count: 0, offline_count: 0, low_battery_count: 0, is_stale: false })).toBe('ok');
    });

    it('returns error when offline sensors present', () => {
      expect(computeDirigeraHealth({ total_sensors: 5, open_count: 0, offline_count: 1, low_battery_count: 0, is_stale: false })).toBe('error');
    });

    it('returns warning when low battery sensors present but none offline', () => {
      expect(computeDirigeraHealth({ total_sensors: 5, open_count: 0, offline_count: 0, low_battery_count: 2, is_stale: false })).toBe('warning');
    });

    it('returns error (priority) when both offline and low battery', () => {
      expect(computeDirigeraHealth({ total_sensors: 5, open_count: 0, offline_count: 1, low_battery_count: 2, is_stale: false })).toBe('error');
    });
  });
});
