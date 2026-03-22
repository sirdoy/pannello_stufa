/**
 * Tests for useStoveData hook
 *
 * @jest-environment jsdom
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useStoveData } from '@/app/components/devices/stove/hooks/useStoveData';
import * as schedulerService from '@/lib/scheduler/schedulerService';
import * as maintenanceService from '@/lib/maintenance/maintenanceService';
import * as errorMonitor from '@/lib/errorMonitor';
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus';
import { useBackgroundSync } from '@/lib/hooks/useBackgroundSync';
import { useAdaptivePolling } from '@/lib/hooks/useAdaptivePolling';

// Mock all external dependencies
jest.mock('@/lib/scheduler/schedulerService');
jest.mock('@/lib/maintenance/maintenanceService');
jest.mock('@/lib/errorMonitor');
jest.mock('@/lib/hooks/useOnlineStatus');
jest.mock('@/lib/hooks/useBackgroundSync');
jest.mock('@/lib/hooks/useAdaptivePolling', () => ({
  useAdaptivePolling: jest.fn((opts: any) => {
    // Call callback immediately to simulate immediate:true
    if (opts.immediate !== false && opts.interval !== null) {
      opts.callback();
    }
  }),
}));

describe('useStoveData', () => {
  const mockCheckVersion = jest.fn().mockResolvedValue(undefined);
  const mockUserId = 'user123';

  beforeEach(() => {
    jest.clearAllMocks();

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

    jest.mocked(errorMonitor.logError).mockResolvedValue(undefined);
    jest.mocked(errorMonitor.shouldNotify).mockReturnValue(false);
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
        checkVersion: mockCheckVersion,
        userId: mockUserId,
      })
    );

    expect(result.current.initialLoading).toBe(true);
  });

  it('calls fetch for status on mount', async () => {
    renderHook(() =>
      useStoveData({
        checkVersion: mockCheckVersion,
        userId: mockUserId,
      })
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/stove/status'));
    });
  });

  it('does not call /stove/getFan or /stove/getPower endpoints', async () => {
    renderHook(() =>
      useStoveData({
        checkVersion: mockCheckVersion,
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
        checkVersion: mockCheckVersion,
        userId: mockUserId,
      })
    );

    await waitFor(() => {
      expect(result.current.status).toBe('working');
      expect(result.current.initialLoading).toBe(false);
    });
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
        checkVersion: mockCheckVersion,
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
        checkVersion: mockCheckVersion,
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
        checkVersion: mockCheckVersion,
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
        checkVersion: mockCheckVersion,
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

    jest.mocked(errorMonitor.shouldNotify).mockReturnValue(false);

    const { result } = renderHook(() =>
      useStoveData({
        checkVersion: mockCheckVersion,
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
        checkVersion: mockCheckVersion,
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
        checkVersion: mockCheckVersion,
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
        checkVersion: mockCheckVersion,
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
        checkVersion: mockCheckVersion,
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
        checkVersion: mockCheckVersion,
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

    jest.mocked(errorMonitor.shouldNotify).mockReturnValue(false);

    const { result } = renderHook(() =>
      useStoveData({
        checkVersion: mockCheckVersion,
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
        checkVersion: mockCheckVersion,
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
        checkVersion: mockCheckVersion,
        userId: mockUserId,
      })
    );

    expect(typeof result.current.fetchStatusAndUpdate).toBe('function');
  });

  it('logs errors when stove_state is alarm with non-zero error_code', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        stove_state: 'alarm',
        power_level: null,
        fan_level: null,
        data_freshness: 'LIVE',
        last_poll_at: '2026-03-19T12:00:00Z',
        error_code: 5,
        error_description: 'Test error',
      }),
    });

    jest.mocked(errorMonitor.shouldNotify).mockReturnValue(false);

    renderHook(() =>
      useStoveData({
        checkVersion: mockCheckVersion,
        userId: mockUserId,
      })
    );

    await waitFor(() => {
      expect(errorMonitor.logError).toHaveBeenCalledWith(
        5,
        'Test error',
        expect.objectContaining({
          status: 'alarm',
          source: 'status_monitor',
        })
      );
    });
  });

  it('calls checkVersion on status fetch', async () => {
    renderHook(() =>
      useStoveData({
        checkVersion: mockCheckVersion,
        userId: mockUserId,
      })
    );

    await waitFor(() => {
      expect(mockCheckVersion).toHaveBeenCalled();
    });
  });
});
