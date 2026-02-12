/**
 * Tests for useStoveData hook
 *
 * @jest-environment jsdom
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useStoveData } from '@/app/components/devices/stove/hooks/useStoveData';
import * as schedulerService from '@/lib/schedulerService';
import * as maintenanceService from '@/lib/maintenanceService';
import * as sandboxService from '@/lib/sandboxService';
import * as errorMonitor from '@/lib/errorMonitor';
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus';
import { useBackgroundSync } from '@/lib/hooks/useBackgroundSync';
import { useDeviceStaleness } from '@/lib/hooks/useDeviceStaleness';
import { useVisibility } from '@/lib/hooks/useVisibility';

// Mock all external dependencies
jest.mock('@/lib/schedulerService');
jest.mock('@/lib/maintenanceService');
jest.mock('@/lib/sandboxService');
jest.mock('@/lib/errorMonitor');
jest.mock('@/lib/hooks/useOnlineStatus');
jest.mock('@/lib/hooks/useBackgroundSync');
jest.mock('@/lib/hooks/useDeviceStaleness');
jest.mock('@/lib/hooks/useVisibility');
jest.mock('firebase/database', () => ({
  ref: jest.fn(),
  onValue: jest.fn(() => jest.fn()),
}));
jest.mock('@/lib/firebase', () => ({
  db: {},
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

    jest.mocked(useDeviceStaleness).mockReturnValue(null);
    jest.mocked(useVisibility).mockReturnValue(true);

    jest.mocked(sandboxService.isLocalEnvironment).mockReturnValue(false);
    jest.mocked(errorMonitor.logError).mockResolvedValue(undefined);
    jest.mocked(errorMonitor.shouldNotify).mockReturnValue(false);
    jest.mocked(schedulerService.getFullSchedulerMode).mockResolvedValue({
      enabled: false,
      semiManual: false,
    });
    jest.mocked(maintenanceService.getMaintenanceStatus).mockResolvedValue({
      needsCleaning: false,
      currentHours: 10,
    });

    // Mock fetch globally
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        StatusDescription: 'OFF',
        Error: 0,
        ErrorDescription: '',
        Result: 3,
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

  it('sets status from API response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        StatusDescription: 'WORK PHASE 1',
        Error: 0,
        ErrorDescription: '',
      }),
    });

    const { result } = renderHook(() =>
      useStoveData({
        checkVersion: mockCheckVersion,
        userId: mockUserId,
      })
    );

    await waitFor(() => {
      expect(result.current.status).toBe('WORK PHASE 1');
      expect(result.current.initialLoading).toBe(false);
    });
  });

  it('returns isAccesa true when status includes WORK', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        StatusDescription: 'WORK PHASE 2',
        Error: 0,
        ErrorDescription: '',
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

  it('returns isSpenta true when status includes OFF', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        StatusDescription: 'OFF',
        Error: 0,
        ErrorDescription: '',
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

  it('logs errors when error code is non-zero', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        StatusDescription: 'ERROR CODE 5',
        Error: 5,
        ErrorDescription: 'Test error',
      }),
    });

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
          status: 'ERROR CODE 5',
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
