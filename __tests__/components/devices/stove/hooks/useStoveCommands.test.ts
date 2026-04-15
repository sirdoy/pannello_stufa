/**
 * Tests for useStoveCommands hook
 *
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';
import { useStoveCommands } from '@/app/components/devices/stove/hooks/useStoveCommands';
import * as logService from '@/lib/logService';
import * as schedulerApiClient from '@/lib/scheduler/schedulerApiClient';
import * as schedulerService from '@/lib/scheduler/schedulerService';
import * as maintenanceService from '@/lib/maintenance/maintenanceService';
import { useRetryableCommand } from '@/lib/hooks/useRetryableCommand';
import type { UseStoveDataReturn } from '@/app/components/devices/stove/hooks/useStoveData';
import type { ThermorossiCommandResponse } from '@/types/thermorossiProxy';

// Mock dependencies
jest.mock('@/lib/logService');
jest.mock('@/lib/scheduler/schedulerApiClient');
jest.mock('@/lib/scheduler/schedulerService');
jest.mock('@/lib/maintenance/maintenanceService');
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

  // Standard 202 command response
  const mockCommandResponse: ThermorossiCommandResponse = {
    command: 'ignite',
    status: 'accepted',
    previous_state: 'off',
    suggested_poll_delay_s: 15,
    poll_endpoint: '/api/v1/thermorossi/status',
    requested_value: null,
  };

  const mockResponse202 = {
    ok: true,
    status: 202,
    json: jest.fn().mockResolvedValue(mockCommandResponse),
  } as unknown as Response;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

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
    jest.mocked(schedulerApiClient.clearSemiManualMode).mockResolvedValue({ success: true } as any);
    jest.mocked(schedulerService.getNextScheduledAction).mockResolvedValue(null);

    // Mock maintenance
    jest.mocked(maintenanceService.confirmCleaning).mockResolvedValue(true);

    // Mock global fetch
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({}),
    });

    // Reset fetchStatusAndUpdate mock
    (mockStoveData.fetchStatusAndUpdate as jest.Mock).mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
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
      status: 202,
      json: jest.fn().mockResolvedValue(mockCommandResponse),
    });

    const { result } = renderHook(() =>
      useStoveCommands({
        stoveData: mockStoveData,
        router: mockRouter,
        user: mockUser,
      })
    );

    await act(async () => {
      const p = result.current.handleIgnite();
      await jest.runAllTimersAsync();
      await p;
    });

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/thermorossi/commands/ignit'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ source: 'manual' }),
      })
    );
  });

  it('handleIgnite delays fetchStatusAndUpdate by suggested_poll_delay_s', async () => {
    mockExecute.mockResolvedValue({
      ok: true,
      status: 202,
      json: jest.fn().mockResolvedValue(mockCommandResponse),
    });

    const { result } = renderHook(() =>
      useStoveCommands({
        stoveData: mockStoveData,
        router: mockRouter,
        user: mockUser,
      })
    );

    await act(async () => {
      const p = result.current.handleIgnite();
      await jest.runAllTimersAsync();
      await p;
    });

    // After advancing timers, fetchStatusAndUpdate should have been called once
    expect(mockStoveData.fetchStatusAndUpdate).toHaveBeenCalledTimes(1);
  });

  it('handleShutdown calls execute with correct endpoint', async () => {
    const shutdownResponse: ThermorossiCommandResponse = {
      ...mockCommandResponse,
      command: 'shutdown',
    };
    mockExecute.mockResolvedValue({
      ok: true,
      status: 202,
      json: jest.fn().mockResolvedValue(shutdownResponse),
    });

    const { result } = renderHook(() =>
      useStoveCommands({
        stoveData: mockStoveData,
        router: mockRouter,
        user: mockUser,
      })
    );

    await act(async () => {
      const p = result.current.handleShutdown();
      await jest.runAllTimersAsync();
      await p;
    });

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/thermorossi/commands/shutdown'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ source: 'manual' }),
      })
    );
  });

  it('handleFanChange calls execute with correct level', async () => {
    const fanResponse: ThermorossiCommandResponse = {
      command: 'setFan',
      status: 'accepted',
      previous_state: 'working',
      suggested_poll_delay_s: 5,
      poll_endpoint: '/api/v1/thermorossi/status',
      requested_value: 4,
    };
    mockExecute.mockResolvedValue({
      ok: true,
      status: 202,
      json: jest.fn().mockResolvedValue(fanResponse),
    });

    const { result } = renderHook(() =>
      useStoveCommands({
        stoveData: mockStoveData,
        router: mockRouter,
        user: mockUser,
      })
    );

    await act(async () => {
      const p = result.current.handleFanChange({ target: { value: '4' } });
      await jest.runAllTimersAsync();
      await p;
    });

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/thermorossi/settings/fan-level'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ value: 4, source: 'manual' }),
      })
    );
  });

  it('handleFanChange does not call setSemiManualMode directly', async () => {
    const fanResponse: ThermorossiCommandResponse = {
      command: 'setFan',
      status: 'accepted',
      previous_state: 'working',
      suggested_poll_delay_s: 5,
      poll_endpoint: '/api/v1/thermorossi/status',
      requested_value: 4,
    };
    mockExecute.mockResolvedValue({
      ok: true,
      status: 202,
      json: jest.fn().mockResolvedValue(fanResponse),
    });

    const { result } = renderHook(() =>
      useStoveCommands({
        stoveData: mockStoveData,
        router: mockRouter,
        user: mockUser,
      })
    );

    await act(async () => {
      const p = result.current.handleFanChange({ target: { value: '4' } });
      await jest.runAllTimersAsync();
      await p;
    });

    // setSemiManualMode must NOT be called by handleFanChange (no modeChanged reading)
    expect(mockStoveData.setSemiManualMode).not.toHaveBeenCalled();
  });

  it('handlePowerChange calls execute with correct level', async () => {
    const powerResponse: ThermorossiCommandResponse = {
      command: 'setPower',
      status: 'accepted',
      previous_state: 'working',
      suggested_poll_delay_s: 5,
      poll_endpoint: '/api/v1/thermorossi/status',
      requested_value: 3,
    };
    mockExecute.mockResolvedValue({
      ok: true,
      status: 202,
      json: jest.fn().mockResolvedValue(powerResponse),
    });

    const { result } = renderHook(() =>
      useStoveCommands({
        stoveData: mockStoveData,
        router: mockRouter,
        user: mockUser,
      })
    );

    await act(async () => {
      const p = result.current.handlePowerChange({ target: { value: '3' } });
      await jest.runAllTimersAsync();
      await p;
    });

    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/thermorossi/settings/power'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ value: 3, source: 'manual' }),
      })
    );
  });

  it('handlePowerChange does not call setSemiManualMode directly', async () => {
    const powerResponse: ThermorossiCommandResponse = {
      command: 'setPower',
      status: 'accepted',
      previous_state: 'working',
      suggested_poll_delay_s: 5,
      poll_endpoint: '/api/v1/thermorossi/status',
      requested_value: 3,
    };
    mockExecute.mockResolvedValue({
      ok: true,
      status: 202,
      json: jest.fn().mockResolvedValue(powerResponse),
    });

    const { result } = renderHook(() =>
      useStoveCommands({
        stoveData: mockStoveData,
        router: mockRouter,
        user: mockUser,
      })
    );

    await act(async () => {
      const p = result.current.handlePowerChange({ target: { value: '3' } });
      await jest.runAllTimersAsync();
      await p;
    });

    // setSemiManualMode must NOT be called by handlePowerChange (no modeChanged reading)
    expect(mockStoveData.setSemiManualMode).not.toHaveBeenCalled();
  });

  it('handleIgnite throws on 409 Conflict', async () => {
    mockExecute.mockResolvedValue({
      ok: false,
      status: 409,
      json: jest.fn().mockResolvedValue({}),
    } as unknown as Response);

    const { result } = renderHook(() =>
      useStoveCommands({
        stoveData: mockStoveData,
        router: mockRouter,
        user: mockUser,
      })
    );

    await act(async () => {
      await expect(result.current.handleIgnite()).rejects.toThrow('Command not allowed in current state');
    });
  });

  it('handleShutdown throws on 409 Conflict', async () => {
    mockExecute.mockResolvedValue({
      ok: false,
      status: 409,
      json: jest.fn().mockResolvedValue({}),
    } as unknown as Response);

    const { result } = renderHook(() =>
      useStoveCommands({
        stoveData: mockStoveData,
        router: mockRouter,
        user: mockUser,
      })
    );

    await act(async () => {
      await expect(result.current.handleShutdown()).rejects.toThrow('Command not allowed in current state');
    });
  });

  it('handleFanChange throws on 409 Conflict', async () => {
    mockExecute.mockResolvedValue({
      ok: false,
      status: 409,
      json: jest.fn().mockResolvedValue({}),
    } as unknown as Response);

    const { result } = renderHook(() =>
      useStoveCommands({
        stoveData: mockStoveData,
        router: mockRouter,
        user: mockUser,
      })
    );

    await act(async () => {
      await expect(result.current.handleFanChange({ target: { value: '3' } })).rejects.toThrow('Command not allowed in current state');
    });
  });

  it('handlePowerChange throws on 409 Conflict', async () => {
    mockExecute.mockResolvedValue({
      ok: false,
      status: 409,
      json: jest.fn().mockResolvedValue({}),
    } as unknown as Response);

    const { result } = renderHook(() =>
      useStoveCommands({
        stoveData: mockStoveData,
        router: mockRouter,
        user: mockUser,
      })
    );

    await act(async () => {
      await expect(result.current.handlePowerChange({ target: { value: '3' } })).rejects.toThrow('Command not allowed in current state');
    });
  });

  it('handleIgnite does not call fetchStatusAndUpdate when response is null (deduplicated)', async () => {
    mockExecute.mockResolvedValue(null);

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

    expect(mockStoveData.fetchStatusAndUpdate).not.toHaveBeenCalled();
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
      status: 202,
      json: jest.fn().mockResolvedValue(mockCommandResponse),
    });

    const { result } = renderHook(() =>
      useStoveCommands({
        stoveData: mockStoveData,
        router: mockRouter,
        user: mockUser,
      })
    );

    await act(async () => {
      const p = result.current.handleIgnite();
      await jest.runAllTimersAsync();
      await p;
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
