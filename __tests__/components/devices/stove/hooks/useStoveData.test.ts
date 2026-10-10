/**
 * Tests for useStoveData hook
 *
 * @jest-environment jsdom
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import { useStoveData } from '@/app/components/devices/stove/hooks/useStoveData';
import * as schedulerService from '@/lib/scheduler/schedulerService';
import * as maintenanceService from '@/lib/maintenance/maintenanceService';
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus';
import { useBackgroundSync } from '@/lib/hooks/useBackgroundSync';
import { useAdaptivePolling } from '@/lib/hooks/useAdaptivePolling';
import { useWebSocketContext } from '@/app/context/WebSocketContext';
import { ReadyState } from 'react-use-websocket';
import type { UseAdaptivePollingOptions } from '@/lib/hooks/useAdaptivePolling';

// Mock all external dependencies
jest.mock('@/lib/scheduler/schedulerService');
jest.mock('@/lib/maintenance/maintenanceService');
jest.mock('@/lib/hooks/useOnlineStatus');
jest.mock('@/lib/hooks/useBackgroundSync');
jest.mock('@/app/context/WebSocketContext');

// Capture polling opts for WS fallback assertions
let lastPollingOpts: UseAdaptivePollingOptions | null = null;
jest.mock('@/lib/hooks/useAdaptivePolling', () => ({
  useAdaptivePolling: jest.fn((opts: UseAdaptivePollingOptions) => {
    lastPollingOpts = opts;
    // Call callback immediately to simulate immediate:true
    if (opts.immediate !== false && opts.interval !== null) {
      opts.callback();
    }
  }),
}));

describe('useStoveData', () => {
  const mockUserId = 'user123';

  let mockSubscribe: jest.Mock;
  let mockUnsubscribe: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    lastPollingOpts = null;

    mockSubscribe = jest.fn();
    mockUnsubscribe = jest.fn();

    // Default: WS disconnected — existing HTTP polling tests unaffected
    jest.mocked(useWebSocketContext).mockReturnValue({
      subscribe: mockSubscribe,
      unsubscribe: mockUnsubscribe,
      readyState: ReadyState.CLOSED,
    });

    // Setup default mocks
    jest.mocked(useOnlineStatus).mockReturnValue({
      isOnline: true,
      wasOffline: false,
      lastOnlineAt: null,
      offlineSince: null,
      checkConnection: jest.fn(),
    });

    jest.mocked(useBackgroundSync).mockReturnValue({
      pendingCommands: [],
      failedCommands: [],
      pendingCount: 0,
      isProcessing: false,
      lastSyncedCommand: null,
      hasPendingCommands: false,
      hasFailedCommands: false,
      queueStoveCommand: jest.fn(),
      refreshCommands: jest.fn(),
      retryCommand: jest.fn(),
      cancelCommand: jest.fn(),
      clearFailedCommands: jest.fn(),
      triggerSync: jest.fn(),
    });

    jest.mocked(schedulerService.getFullSchedulerMode).mockResolvedValue({
      enabled: false,
      semiManual: false,
      lastUpdated: '2026-03-19T12:00:00Z',
    });
    jest.mocked(maintenanceService.getMaintenanceStatus).mockResolvedValue({
      needsCleaning: false,
      currentHours: 10,
      targetHours: 1000,
      lastCleanedAt: null,
      lastUpdatedAt: null,
      percentage: 1,
      remainingHours: 990,
      isNearLimit: false,
    });

    // Mock fetch globally with proxy-shaped response
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        stove_state: 'off',
        power_level: null,
        fan_level: null,
        data_freshness: 'LIVE',
        last_poll_at: '2026-03-19T12:00:00Z',
        error_code: null,
        error_description: null,
      }),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns initialLoading true on first render', () => {
    const { result } = renderHook(() =>
      useStoveData({
        userId: mockUserId,
      })
    );

    expect(result.current.initialLoading).toBe(true);
  });

  it('calls fetch for status on mount', async () => {
    renderHook(() =>
      useStoveData({
        userId: mockUserId,
      })
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/v1/thermorossi/status'));
    });
  });

  it('does not call /stove/getFan or /stove/getPower endpoints', async () => {
    renderHook(() =>
      useStoveData({
        userId: mockUserId,
      })
    );

    await waitFor(() => {
      expect(global.fetch).not.toHaveBeenCalledWith(expect.stringContaining('/stove/getFan'));
      expect(global.fetch).not.toHaveBeenCalledWith(expect.stringContaining('/stove/getPower'));
    });
  });

  it('sets status from proxy stove_state field', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        stove_state: 'working',
        power_level: 3,
        fan_level: 4,
        data_freshness: 'LIVE',
        last_poll_at: '2026-03-19T12:00:00Z',
        error_code: null,
        error_description: null,
      }),
    });

    const { result } = renderHook(() =>
      useStoveData({
        userId: mockUserId,
      })
    );

    await waitFor(() => {
      expect(result.current.status).toBe('working');
      expect(result.current.initialLoading).toBe(false);
    });
  });

  it.each([
    [true, true],
    [false, false],
    [null, false],
    [undefined, false],
  ])('maps pellet_low %p to pelletLow %p (ROADMAP D11)', async (pelletLow, expected) => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        stove_state: 'working',
        power_level: 1,
        fan_level: 1,
        data_freshness: 'LIVE',
        last_poll_at: '2026-10-08T06:00:00Z',
        error_code: null,
        error_description: null,
        pellet_low: pelletLow,
      }),
    });

    const { result } = renderHook(() => useStoveData({ userId: mockUserId }));

    await waitFor(() => {
      expect(result.current.status).toBe('working');
    });
    expect(result.current.pelletLow).toBe(expected);
  });

  it('sets power_level and fan_level from single status response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        stove_state: 'working',
        power_level: 3,
        fan_level: 4,
        data_freshness: 'LIVE',
        last_poll_at: '2026-03-19T12:00:00Z',
        error_code: null,
        error_description: null,
      }),
    });

    const { result } = renderHook(() =>
      useStoveData({
        userId: mockUserId,
      })
    );

    await waitFor(() => {
      expect(result.current.powerLevel).toBe(3);
      expect(result.current.fanLevel).toBe(4);
    });
  });

  it('sets staleness to { isStale: true, cachedAt } when data_freshness is STALE', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        stove_state: 'working',
        power_level: 3,
        fan_level: 4,
        data_freshness: 'STALE',
        last_poll_at: '2026-03-19T11:00:00Z',
        error_code: null,
        error_description: null,
      }),
    });

    const { result } = renderHook(() =>
      useStoveData({
        userId: mockUserId,
      })
    );

    await waitFor(() => {
      expect(result.current.staleness?.isStale).toBe(true);
      expect(result.current.staleness?.cachedAt).toEqual(new Date('2026-03-19T11:00:00Z'));
    });
  });

  it('sets staleness.isStale to false with cachedAt when data_freshness is LIVE', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        stove_state: 'working',
        power_level: 3,
        fan_level: 4,
        data_freshness: 'LIVE',
        last_poll_at: '2026-03-19T12:00:00Z',
        error_code: null,
        error_description: null,
      }),
    });

    const { result } = renderHook(() =>
      useStoveData({
        userId: mockUserId,
      })
    );

    await waitFor(() => {
      expect(result.current.staleness?.isStale).toBe(false);
      expect(result.current.staleness?.cachedAt).toEqual(new Date('2026-03-19T12:00:00Z'));
    });
  });

  it('sets staleness to null when last_poll_at is null and data is LIVE', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        stove_state: 'working',
        power_level: 3,
        fan_level: 4,
        data_freshness: 'LIVE',
        last_poll_at: null,
        error_code: null,
        error_description: null,
      }),
    });

    const { result } = renderHook(() =>
      useStoveData({
        userId: mockUserId,
      })
    );

    await waitFor(() => {
      expect(result.current.staleness).toBeNull();
    });
  });

  it('populates errorCode and errorDescription when stove_state is alarm', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        stove_state: 'alarm',
        power_level: null,
        fan_level: null,
        data_freshness: 'LIVE',
        last_poll_at: '2026-03-19T12:00:00Z',
        error_code: 7,
        error_description: 'Sonda fumi',
      }),
    });


    const { result } = renderHook(() =>
      useStoveData({
        userId: mockUserId,
      })
    );

    await waitFor(() => {
      expect(result.current.errorCode).toBe(7);
      expect(result.current.errorDescription).toBe('Sonda fumi');
    });
  });

  it('clears errorCode to 0 when stove_state is not alarm', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        stove_state: 'working',
        power_level: 3,
        fan_level: 4,
        data_freshness: 'LIVE',
        last_poll_at: '2026-03-19T12:00:00Z',
        error_code: null,
        error_description: null,
      }),
    });

    const { result } = renderHook(() =>
      useStoveData({
        userId: mockUserId,
      })
    );

    await waitFor(() => {
      expect(result.current.errorCode).toBe(0);
    });
  });

  it('returns isAccesa true for working status', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        stove_state: 'working',
        power_level: 3,
        fan_level: 4,
        data_freshness: 'LIVE',
        last_poll_at: '2026-03-19T12:00:00Z',
        error_code: null,
        error_description: null,
      }),
    });

    const { result } = renderHook(() =>
      useStoveData({
        userId: mockUserId,
      })
    );

    await waitFor(() => {
      expect(result.current.isAccesa).toBe(true);
    });
  });

  it('returns isAccesa true for igniting status', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        stove_state: 'igniting',
        power_level: null,
        fan_level: null,
        data_freshness: 'LIVE',
        last_poll_at: '2026-03-19T12:00:00Z',
        error_code: null,
        error_description: null,
      }),
    });

    const { result } = renderHook(() =>
      useStoveData({
        userId: mockUserId,
      })
    );

    await waitFor(() => {
      expect(result.current.isAccesa).toBe(true);
    });
  });

  it('returns isAccesa true for modulating status', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        stove_state: 'modulating',
        power_level: 2,
        fan_level: 3,
        data_freshness: 'LIVE',
        last_poll_at: '2026-03-19T12:00:00Z',
        error_code: null,
        error_description: null,
      }),
    });

    const { result } = renderHook(() =>
      useStoveData({
        userId: mockUserId,
      })
    );

    await waitFor(() => {
      expect(result.current.isAccesa).toBe(true);
    });
  });

  it('returns isSpenta true for off status', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        stove_state: 'off',
        power_level: null,
        fan_level: null,
        data_freshness: 'LIVE',
        last_poll_at: '2026-03-19T12:00:00Z',
        error_code: null,
        error_description: null,
      }),
    });

    const { result } = renderHook(() =>
      useStoveData({
        userId: mockUserId,
      })
    );

    await waitFor(() => {
      expect(result.current.isSpenta).toBe(true);
    });
  });

  it('returns isSpenta true for alarm status', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        stove_state: 'alarm',
        power_level: null,
        fan_level: null,
        data_freshness: 'LIVE',
        last_poll_at: '2026-03-19T12:00:00Z',
        error_code: 7,
        error_description: 'Test error',
      }),
    });


    const { result } = renderHook(() =>
      useStoveData({
        userId: mockUserId,
      })
    );

    await waitFor(() => {
      expect(result.current.isSpenta).toBe(true);
    });
  });

  it('returns isSpenta true for standby status', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        stove_state: 'standby',
        power_level: null,
        fan_level: null,
        data_freshness: 'LIVE',
        last_poll_at: '2026-03-19T12:00:00Z',
        error_code: null,
        error_description: null,
      }),
    });

    const { result } = renderHook(() =>
      useStoveData({
        userId: mockUserId,
      })
    );

    await waitFor(() => {
      expect(result.current.isSpenta).toBe(true);
    });
  });

  it('exposes fetchStatusAndUpdate function', () => {
    const { result } = renderHook(() =>
      useStoveData({
        userId: mockUserId,
      })
    );

    expect(typeof result.current.fetchStatusAndUpdate).toBe('function');
  });

  // ROADMAP D22: a stove still running keeps its state, the alarm is the error_code.
  it('reports the alarm of a stove that is still running', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        stove_state: 'working',
        power_level: 1,
        fan_level: 1,
        data_freshness: 'LIVE',
        last_poll_at: '2026-03-19T12:00:00Z',
        error_code: 8192,
        error_description: 'Cassetto cenere pieno',
        alarm_codes: ['ash_drawer_full'],
      }),
    });

    const { result } = renderHook(() =>
      useStoveData({
        userId: mockUserId,
      })
    );

    await waitFor(() => {
      expect(result.current.errorCode).toBe(8192);
      expect(result.current.errorDescription).toBe('Cassetto cenere pieno');
    });
    expect(result.current.status).toBe('working');
  });

  // ROADMAP M78: a failed read used to set the state to "off" while the stove could be burning.
  describe('unreachable stove (M78)', () => {
    const working = {
      ok: true,
      json: jest.fn().mockResolvedValue({
        stove_state: 'working',
        power_level: 3,
        fan_level: 4,
        data_freshness: 'LIVE',
        last_poll_at: '2026-03-19T12:00:00Z',
        error_code: null,
        error_description: null,
      }),
    };

    beforeEach(() => {
      jest.spyOn(console, 'error').mockImplementation(() => undefined);
    });

    it('first read fails: state unknown, not off', async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 503 });

      const { result } = renderHook(() => useStoveData({ userId: mockUserId }));

      await waitFor(() => expect(result.current.initialLoading).toBe(false));
      expect(result.current.unreachable).toBe(true);
      expect(result.current.status).toBe('unknown');
      expect(result.current.isSpenta).toBe(false);
      expect(result.current.isAccesa).toBe(false);
      // Mode and maintenance are still read: they do not need the stove.
      expect(schedulerService.getFullSchedulerMode).toHaveBeenCalled();
      expect(maintenanceService.getMaintenanceStatus).toHaveBeenCalled();
    });

    // The polling mock runs the callback on every render: switch the answer with a flag
    // instead of queueing one-shot responses.
    it('a later read fails: last known state and levels are kept', async () => {
      let down = false;
      global.fetch = jest.fn(() => Promise.resolve(down ? { ok: false, status: 503 } : working)) as never;

      const { result } = renderHook(() => useStoveData({ userId: mockUserId }));
      await waitFor(() => expect(result.current.status).toBe('working'));
      expect(result.current.unreachable).toBe(false);

      down = true;
      await act(async () => {
        await result.current.fetchStatusAndUpdate();
      });

      expect(result.current.unreachable).toBe(true);
      expect(result.current.status).toBe('working');
      expect(result.current.isAccesa).toBe(true);
      expect(result.current.powerLevel).toBe(3);
    });

    it('the next successful read clears the flag', async () => {
      let down = true;
      global.fetch = jest.fn(() => Promise.resolve(down ? { ok: false, status: 503 } : working)) as never;

      const { result, unmount } = renderHook(() => useStoveData({ userId: mockUserId }));
      await waitFor(() => expect(result.current.unreachable).toBe(true));

      down = false;
      // Not awaited inside act: each successful read re-renders and the polling mock reads again.
      act(() => {
        void result.current.fetchStatusAndUpdate();
      });

      await waitFor(() => expect(result.current.unreachable).toBe(false));
      expect(result.current.status).toBe('working');
      unmount();
    });
  });

  it('refetches once after a background-synced command, not in a loop (M32)', async () => {
    // WS open: polling suppressed, so every status fetch comes from the sync effect
    jest.mocked(useWebSocketContext).mockReturnValue({
      subscribe: mockSubscribe,
      unsubscribe: mockUnsubscribe,
      readyState: ReadyState.OPEN,
    });
    jest.mocked(useBackgroundSync).mockReturnValue({
      ...jest.mocked(useBackgroundSync)(),
      lastSyncedCommand: { id: 1, endpoint: 'ignite' } as never,
    });
    const statusCalls = () =>
      jest.mocked(global.fetch).mock.calls.filter(([url]) => String(url).includes('status')).length;

    renderHook(() => useStoveData({ userId: mockUserId }));

    await waitFor(() => expect(statusCalls()).toBeGreaterThan(0));
    const settled = statusCalls();
    // Let several render/update cycles pass: the count must not keep growing
    for (let i = 0; i < 5; i++) {
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });
    }
    expect(statusCalls()).toBe(settled);
    expect(settled).toBeLessThanOrEqual(2);
  });

  describe('WebSocket integration', () => {
    it('subscribes to thermorossi topic when readyState is OPEN', () => {
      jest.mocked(useWebSocketContext).mockReturnValue({
        subscribe: mockSubscribe,
        unsubscribe: mockUnsubscribe,
        readyState: ReadyState.OPEN,
      });

      renderHook(() =>
        useStoveData({ userId: mockUserId })
      );

      expect(mockSubscribe).toHaveBeenCalled();
      expect(mockSubscribe).toHaveBeenCalledWith('thermorossi', expect.any(Function));
    });

    it('suppresses polling (interval=null) when readyState is OPEN', () => {
      jest.mocked(useWebSocketContext).mockReturnValue({
        subscribe: mockSubscribe,
        unsubscribe: mockUnsubscribe,
        readyState: ReadyState.OPEN,
      });

      renderHook(() =>
        useStoveData({ userId: mockUserId })
      );

      expect(lastPollingOpts).not.toBeNull();
      expect(lastPollingOpts?.interval).toBeNull();
    });

    it('activates polling (interval=60000) when readyState is CLOSED', () => {
      // Default mock is CLOSED
      renderHook(() =>
        useStoveData({ userId: mockUserId })
      );

      expect(lastPollingOpts).not.toBeNull();
      expect(lastPollingOpts?.interval).toBe(60000);
    });

    it('always sets alwaysActive:true regardless of readyState (MIG-03)', () => {
      // Test with OPEN
      jest.mocked(useWebSocketContext).mockReturnValue({
        subscribe: mockSubscribe,
        unsubscribe: mockUnsubscribe,
        readyState: ReadyState.OPEN,
      });

      const { unmount } = renderHook(() =>
        useStoveData({ userId: mockUserId })
      );
      expect(lastPollingOpts?.alwaysActive).toBe(true);
      unmount();

      // Test with CLOSED
      jest.mocked(useWebSocketContext).mockReturnValue({
        subscribe: mockSubscribe,
        unsubscribe: mockUnsubscribe,
        readyState: ReadyState.CLOSED,
      });

      renderHook(() =>
        useStoveData({ userId: mockUserId })
      );
      expect(lastPollingOpts?.alwaysActive).toBe(true);
    });

    it('bootstraps one HTTP fetch when WS is OPEN at mount and no snapshot arrives (M15)', async () => {
      jest.useFakeTimers();
      try {
        jest.mocked(useWebSocketContext).mockReturnValue({
          subscribe: mockSubscribe,
          unsubscribe: mockUnsubscribe,
          readyState: ReadyState.OPEN,
        });
        renderHook(() => useStoveData({ userId: mockUserId }));
        expect(global.fetch).not.toHaveBeenCalledWith(expect.stringContaining('/api/v1/thermorossi/status'));
        await act(async () => {
          jest.advanceTimersByTime(1500);
        });
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/v1/thermorossi/status'));
      } finally {
        jest.useRealTimers();
      }
    });

    it('skips the bootstrap fetch when the WS snapshot arrives first (M15)', async () => {
      jest.useFakeTimers();
      try {
        let capturedCallback: ((data: unknown) => void) | null = null;
        mockSubscribe.mockImplementation((_topic: string, cb: (data: unknown) => void) => {
          capturedCallback = cb;
        });
        jest.mocked(useWebSocketContext).mockReturnValue({
          subscribe: mockSubscribe,
          unsubscribe: mockUnsubscribe,
          readyState: ReadyState.OPEN,
        });
        renderHook(() => useStoveData({ userId: mockUserId }));
        await act(async () => {
          capturedCallback?.({
            stove_state: 'working',
            power_level: 3,
            fan_level: 4,
            data_freshness: 'LIVE',
            last_poll_at: '2026-03-19T12:00:00Z',
            error_code: null,
            error_description: null,
          });
        });
        await act(async () => {
          jest.advanceTimersByTime(1500);
        });
        expect(global.fetch).not.toHaveBeenCalledWith(expect.stringContaining('/api/v1/thermorossi/status'));
      } finally {
        jest.useRealTimers();
      }
    });

    it('maps WS message fields to hook state: status, fanLevel, powerLevel', async () => {
      let capturedCallback: ((data: unknown) => void) | null = null;
      mockSubscribe.mockImplementation((_topic: string, cb: (data: unknown) => void) => {
        capturedCallback = cb;
      });

      jest.mocked(useWebSocketContext).mockReturnValue({
        subscribe: mockSubscribe,
        unsubscribe: mockUnsubscribe,
        readyState: ReadyState.OPEN,
      });

      const { result } = renderHook(() =>
        useStoveData({ userId: mockUserId })
      );

      await act(async () => {
        capturedCallback?.({
          stove_state: 'working',
          power_level: 3,
          fan_level: 4,
          data_freshness: 'LIVE',
          last_poll_at: '2026-03-19T12:00:00Z',
          error_code: null,
          error_description: null,
        });
      });

      expect(result.current.status).toBe('working');
      expect(result.current.powerLevel).toBe(3);
      expect(result.current.fanLevel).toBe(4);
    });

    it('sets isStale=false when WS message arrives', async () => {
      let capturedCallback: ((data: unknown) => void) | null = null;
      mockSubscribe.mockImplementation((_topic: string, cb: (data: unknown) => void) => {
        capturedCallback = cb;
      });

      jest.mocked(useWebSocketContext).mockReturnValue({
        subscribe: mockSubscribe,
        unsubscribe: mockUnsubscribe,
        readyState: ReadyState.OPEN,
      });

      const { result } = renderHook(() =>
        useStoveData({ userId: mockUserId })
      );

      await act(async () => {
        capturedCallback?.({
          stove_state: 'working',
          power_level: 3,
          fan_level: 4,
          data_freshness: 'LIVE',
          last_poll_at: '2026-03-19T12:00:00Z',
          error_code: null,
          error_description: null,
        });
      });

      expect(result.current.staleness?.isStale).toBe(false);
    });

    it('sets initialLoading=false when WS message arrives', async () => {
      let capturedCallback: ((data: unknown) => void) | null = null;
      mockSubscribe.mockImplementation((_topic: string, cb: (data: unknown) => void) => {
        capturedCallback = cb;
      });

      // Make WS the only active data source (OPEN + polling suppressed)
      jest.mocked(useWebSocketContext).mockReturnValue({
        subscribe: mockSubscribe,
        unsubscribe: mockUnsubscribe,
        readyState: ReadyState.OPEN,
      });

      // Don't auto-invoke callback since polling is suppressed — override mock
      jest.mocked(useAdaptivePolling).mockImplementation((opts) => {
        lastPollingOpts = opts;
        // interval=null means polling is suppressed, don't call callback
      });

      const { result } = renderHook(() =>
        useStoveData({ userId: mockUserId })
      );

      // Initially still loading (no data yet)
      expect(result.current.initialLoading).toBe(true);

      await act(async () => {
        capturedCallback?.({
          stove_state: 'off',
          power_level: null,
          fan_level: null,
          data_freshness: 'LIVE',
          last_poll_at: null,
          error_code: null,
          error_description: null,
        });
      });

      expect(result.current.initialLoading).toBe(false);
    });

    it('triggers side-fetches (scheduler, maintenance) on WS message', async () => {
      let capturedCallback: ((data: unknown) => void) | null = null;
      mockSubscribe.mockImplementation((_topic: string, cb: (data: unknown) => void) => {
        capturedCallback = cb;
      });

      jest.mocked(useWebSocketContext).mockReturnValue({
        subscribe: mockSubscribe,
        unsubscribe: mockUnsubscribe,
        readyState: ReadyState.OPEN,
      });

      // Suppress polling to isolate WS path
      jest.mocked(useAdaptivePolling).mockImplementation((opts) => {
        lastPollingOpts = opts;
      });

      renderHook(() =>
        useStoveData({ userId: mockUserId })
      );

      // Clear mocks from any previous calls
      jest.clearAllMocks();
      mockSubscribe = jest.fn();
      jest.mocked(schedulerService.getFullSchedulerMode).mockResolvedValue({
        enabled: false,
        semiManual: false,
        lastUpdated: '2026-03-19T12:00:00Z',
      });
      jest.mocked(maintenanceService.getMaintenanceStatus).mockResolvedValue({
        needsCleaning: false,
        currentHours: 10,
        targetHours: 1000,
        lastCleanedAt: null,
        lastUpdatedAt: null,
        percentage: 1,
        remainingHours: 990,
        isNearLimit: false,
      });

      await act(async () => {
        capturedCallback?.({
          stove_state: 'working',
          power_level: 3,
          fan_level: 4,
          data_freshness: 'LIVE',
          last_poll_at: '2026-03-19T12:00:00Z',
          error_code: null,
          error_description: null,
        });
      });

      await waitFor(() => {
        expect(schedulerService.getFullSchedulerMode).toHaveBeenCalled();
        expect(maintenanceService.getMaintenanceStatus).toHaveBeenCalled();
        });
    });

    it('handles alarm state from WS message: sets errorCode and errorDescription', async () => {
      let capturedCallback: ((data: unknown) => void) | null = null;
      mockSubscribe.mockImplementation((_topic: string, cb: (data: unknown) => void) => {
        capturedCallback = cb;
      });

      jest.mocked(useWebSocketContext).mockReturnValue({
        subscribe: mockSubscribe,
        unsubscribe: mockUnsubscribe,
        readyState: ReadyState.OPEN,
      });

      const { result } = renderHook(() =>
        useStoveData({ userId: mockUserId })
      );

      await act(async () => {
        capturedCallback?.({
          stove_state: 'alarm',
          power_level: null,
          fan_level: null,
          data_freshness: 'LIVE',
          last_poll_at: '2026-03-19T12:00:00Z',
          error_code: 7,
          error_description: 'Sonda fumi',
        });
      });

      expect(result.current.errorCode).toBe(7);
      expect(result.current.errorDescription).toBe('Sonda fumi');
    });

    it('calls unsubscribe on unmount', () => {
      jest.mocked(useWebSocketContext).mockReturnValue({
        subscribe: mockSubscribe,
        unsubscribe: mockUnsubscribe,
        readyState: ReadyState.OPEN,
      });

      const { unmount } = renderHook(() =>
        useStoveData({ userId: mockUserId })
      );

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalledWith('thermorossi', expect.any(Function));
    });
  });
});
