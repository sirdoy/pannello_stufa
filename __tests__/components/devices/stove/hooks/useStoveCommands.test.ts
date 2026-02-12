/**
 * Tests for useStoveCommands hook
 *
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';
import { useStoveCommands } from '@/app/components/devices/stove/hooks/useStoveCommands';
import * as logService from '@/lib/logService';
import * as schedulerApiClient from '@/lib/schedulerApiClient';
import * as schedulerService from '@/lib/schedulerService';
import * as maintenanceService from '@/lib/maintenanceService';
import { useRetryableCommand } from '@/lib/hooks/useRetryableCommand';
import type { UseStoveDataReturn } from '@/app/components/devices/stove/hooks/useStoveData';

// Mock dependencies
jest.mock('@/lib/logService');
jest.mock('@/lib/schedulerApiClient');
jest.mock('@/lib/schedulerService');
jest.mock('@/lib/maintenanceService');
jest.mock('@/lib/hooks/useRetryableCommand');

describe('useStoveCommands', () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
  } as any;

  const mockStoveData: Pick<
    UseStoveDataReturn,
    | 'setLoading'
    | 'setLoadingMessage'
    | 'fetchStatusAndUpdate'
    | 'setSchedulerEnabled'
    | 'setSemiManualMode'
    | 'setReturnToAutoAt'
    | 'setNextScheduledAction'
    | 'setCleaningInProgress'
    | 'fetchMaintenanceStatus'
    | 'semiManualMode'
  > = {
    setLoading: jest.fn(),
    setLoadingMessage: jest.fn(),
    fetchStatusAndUpdate: jest.fn(),
    setSchedulerEnabled: jest.fn(),
    setSemiManualMode: jest.fn(),
    setReturnToAutoAt: jest.fn(),
    setNextScheduledAction: jest.fn(),
    setCleaningInProgress: jest.fn(),
    fetchMaintenanceStatus: jest.fn(),
    semiManualMode: false,
  };

  const mockUser = { sub: 'user123', name: 'Test User' };

  const mockExecute = jest.fn();
  const mockRetry = jest.fn();
  const mockClearError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock useRetryableCommand to return command objects
    jest.mocked(useRetryableCommand).mockReturnValue({
      execute: mockExecute,
      retry: mockRetry,
      clearError: mockClearError,
      isExecuting: false,
      isRetrying: false,
      attemptCount: 0,
      lastError: null,
    });

    // Mock logService (logStoveAction and logSchedulerAction are objects, not functions)
    (logService.logStoveAction as any) = {
      ignite: jest.fn().mockResolvedValue(undefined),
      shutdown: jest.fn().mockResolvedValue(undefined),
      setFan: jest.fn().mockResolvedValue(undefined),
      setPower: jest.fn().mockResolvedValue(undefined),
    };

    (logService.logSchedulerAction as any) = {
      clearSemiManual: jest.fn().mockResolvedValue(undefined),
    };

    // Mock scheduler functions
    jest.mocked(schedulerApiClient.clearSemiManualMode).mockResolvedValue(undefined);
    jest.mocked(schedulerService.getNextScheduledAction).mockResolvedValue(null);

    // Mock maintenance
    jest.mocked(maintenanceService.confirmCleaning).mockResolvedValue(undefined);

    // Mock global fetch
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({}),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns all command handlers', () => {
    const { result } = renderHook(() =>
      useStoveCommands({
        stoveData: mockStoveData,
        router: mockRouter,
        user: mockUser,
      })
    );

    expect(typeof result.current.handleIgnite).toBe('function');
    expect(typeof result.current.handleShutdown).toBe('function');
    expect(typeof result.current.handleFanChange).toBe('function');
    expect(typeof result.current.handlePowerChange).toBe('function');
    expect(typeof result.current.handleClearSemiManual).toBe('function');
    expect(typeof result.current.handleSetManualMode).toBe('function');
    expect(typeof result.current.handleSetAutomaticMode).toBe('function');
    expect(typeof result.current.handleConfirmCleaning).toBe('function');
    expect(typeof result.current.handleManualRefresh).toBe('function');
  });

  it('returns retryable command objects', () => {
    const { result } = renderHook(() =>
      useStoveCommands({
        stoveData: mockStoveData,
        router: mockRouter,
        user: mockUser,
      })
    );

    expect(result.current.igniteCmd).toBeDefined();
    expect(result.current.shutdownCmd).toBeDefined();
    expect(result.current.setFanCmd).toBeDefined();
    expect(result.current.setPowerCmd).toBeDefined();
  });

  it('handleIgnite calls execute with correct endpoint', async () => {
    mockExecute.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({}),
    });

    const { result } = renderHook(() =>
      useStoveCommands({
        stoveData: mockStoveData,
        router: mockRouter,
        user: mockUser,
      })
    );

    await act(async () => {
      await result.current.handleIgnite();
    });

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('/api/stove/ignite'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ source: 'manual' }),
      })
    );
  });

  it('handleShutdown calls execute with correct endpoint', async () => {
    mockExecute.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({}),
    });

    const { result } = renderHook(() =>
      useStoveCommands({
        stoveData: mockStoveData,
        router: mockRouter,
        user: mockUser,
      })
    );

    await act(async () => {
      await result.current.handleShutdown();
    });

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('/api/stove/shutdown'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ source: 'manual' }),
      })
    );
  });

  it('handleFanChange calls execute with correct level', async () => {
    mockExecute.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ modeChanged: false }),
    });

    const { result } = renderHook(() =>
      useStoveCommands({
        stoveData: mockStoveData,
        router: mockRouter,
        user: mockUser,
      })
    );

    await act(async () => {
      await result.current.handleFanChange({ target: { value: '4' } });
    });

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('/api/stove/setFan'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ level: 4, source: 'manual' }),
      })
    );
  });

  it('handlePowerChange calls execute with correct level', async () => {
    mockExecute.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ modeChanged: false }),
    });

    const { result } = renderHook(() =>
      useStoveCommands({
        stoveData: mockStoveData,
        router: mockRouter,
        user: mockUser,
      })
    );

    await act(async () => {
      await result.current.handlePowerChange({ target: { value: '3' } });
    });

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('/api/stove/setPower'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ level: 3, source: 'manual' }),
      })
    );
  });

  it('handleSetManualMode calls scheduler API with enabled false', async () => {
    const { result } = renderHook(() =>
      useStoveCommands({
        stoveData: mockStoveData,
        router: mockRouter,
        user: mockUser,
      })
    );

    await act(async () => {
      await result.current.handleSetManualMode();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/scheduler/update',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          operation: 'setSchedulerMode',
          data: { enabled: false },
        }),
      })
    );
  });

  it('handleSetAutomaticMode calls scheduler API with enabled true', async () => {
    const { result } = renderHook(() =>
      useStoveCommands({
        stoveData: mockStoveData,
        router: mockRouter,
        user: mockUser,
      })
    );

    await act(async () => {
      await result.current.handleSetAutomaticMode();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/scheduler/update',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          operation: 'setSchedulerMode',
          data: { enabled: true },
        }),
      })
    );
  });

  it('command handlers set loading state', async () => {
    mockExecute.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({}),
    });

    const { result } = renderHook(() =>
      useStoveCommands({
        stoveData: mockStoveData,
        router: mockRouter,
        user: mockUser,
      })
    );

    await act(async () => {
      await result.current.handleIgnite();
    });

    expect(mockStoveData.setLoading).toHaveBeenCalledWith(true);
    expect(mockStoveData.setLoadingMessage).toHaveBeenCalledWith('Accensione stufa...');
    expect(mockStoveData.setLoading).toHaveBeenCalledWith(false);
  });

  it('handleConfirmCleaning calls confirmCleaning with user', async () => {
    const { result } = renderHook(() =>
      useStoveCommands({
        stoveData: mockStoveData,
        router: mockRouter,
        user: mockUser,
      })
    );

    await act(async () => {
      await result.current.handleConfirmCleaning();
    });

    expect(maintenanceService.confirmCleaning).toHaveBeenCalledWith(mockUser);
    expect(mockStoveData.fetchMaintenanceStatus).toHaveBeenCalled();
  });
});
