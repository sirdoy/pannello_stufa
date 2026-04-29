/**
 * Tests for useThermostatCommands Hook (CONTEXT D-16)
 *
 * Validates per-room setpoint, home-mode and per-room-mode write commands wrapped
 * by the Phase 7.0 retry/idempotency infrastructure. Mirrors useStoveCommands /
 * useLightsCommands / useSonosCommands convention.
 *
 * Pitfall 5 (RESEARCH §): `setthermmode` does NOT accept 'manual'. The TypeScript
 * union enforces 'schedule' | 'away' | 'hg' at compile time.
 */

import { renderHook, act } from '@testing-library/react';

// Mock useRetryableCommand BEFORE the hook import (memory pattern: parallel mocks bleed).
jest.mock('@/lib/hooks/useRetryableCommand');

import { useRetryableCommand } from '@/lib/hooks/useRetryableCommand';

const mockUseRetryableCommand = useRetryableCommand as jest.MockedFunction<
  typeof useRetryableCommand
>;

function makeMockCommand(executeMock?: jest.Mock) {
  return {
    execute: executeMock ?? jest.fn().mockResolvedValue({ ok: true } as Response),
    isRetrying: false,
    attemptCount: 0,
    lastError: null,
    isExecuting: false,
    retry: jest.fn(),
    clearError: jest.fn(),
  };
}

describe('useThermostatCommands (CONTEXT D-16)', () => {
  let mockTempCmd: ReturnType<typeof makeMockCommand>;
  let mockModeCmd: ReturnType<typeof makeMockCommand>;
  let refetch: jest.Mock<Promise<void>, []>;
  let setError: jest.Mock<void, [string | null]>;

  beforeEach(() => {
    jest.resetAllMocks();

    mockTempCmd = makeMockCommand();
    mockModeCmd = makeMockCommand();
    refetch = jest.fn().mockResolvedValue(undefined);
    setError = jest.fn();

    // First call → temp cmd, second call → mode cmd (mirrors hook order).
    let callCount = 0;
    mockUseRetryableCommand.mockImplementation(() => {
      callCount++;
      if (callCount % 2 === 1) {
        return mockTempCmd as ReturnType<typeof useRetryableCommand>;
      }
      return mockModeCmd as ReturnType<typeof useRetryableCommand>;
    });
  });

  let useThermostatCommands: typeof import('../useThermostatCommands').useThermostatCommands;

  beforeAll(async () => {
    const mod = await import('../useThermostatCommands');
    useThermostatCommands = mod.useThermostatCommands;
  });

  it('Test 1: setRoomSetpoint POSTs the correct body to /setroomthermpoint and refetches', async () => {
    const { result } = renderHook(() =>
      useThermostatCommands({ homeId: 'home-1', refetch, setError }),
    );

    await act(async () => {
      await result.current.setRoomSetpoint('room-A', 21);
    });

    expect(mockTempCmd.execute).toHaveBeenCalledWith(
      '/api/v1/netatmo/setroomthermpoint',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          home_id: 'home-1',
          room_id: 'room-A',
          mode: 'manual',
          temp: 21,
        }),
      }),
    );
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it.each(['schedule', 'away', 'hg'] as const)(
    'Test 2-4: setHomeMode POSTs mode=%s to /setthermmode',
    async (mode) => {
      const { result } = renderHook(() =>
        useThermostatCommands({ homeId: 'home-1', refetch, setError }),
      );

      await act(async () => {
        await result.current.setHomeMode(mode);
      });

      expect(mockModeCmd.execute).toHaveBeenCalledWith(
        '/api/v1/netatmo/setthermmode',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ home_id: 'home-1', mode }),
        }),
      );
      expect(refetch).toHaveBeenCalledTimes(1);
    },
  );

  it('Test 5: setRoomMode(manual) POSTs {home_id, room_id, mode} without temp', async () => {
    const { result } = renderHook(() =>
      useThermostatCommands({ homeId: 'home-1', refetch, setError }),
    );

    await act(async () => {
      await result.current.setRoomMode('room-A', 'manual');
    });

    expect(mockTempCmd.execute).toHaveBeenCalledWith(
      '/api/v1/netatmo/setroomthermpoint',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          home_id: 'home-1',
          room_id: 'room-A',
          mode: 'manual',
        }),
      }),
    );
  });

  it('Test 6: setRoomMode(home) POSTs {home_id, room_id, mode: home}', async () => {
    const { result } = renderHook(() =>
      useThermostatCommands({ homeId: 'home-1', refetch, setError }),
    );

    await act(async () => {
      await result.current.setRoomMode('room-A', 'home');
    });

    const calls = mockTempCmd.execute.mock.calls;
    const lastCallBody = calls[calls.length - 1]?.[1]?.body;
    expect(lastCallBody).toBe(
      JSON.stringify({ home_id: 'home-1', room_id: 'room-A', mode: 'home' }),
    );
  });

  it('Test 7: skips refetch when res.ok is false', async () => {
    mockModeCmd.execute.mockResolvedValueOnce({ ok: false } as Response);

    const { result } = renderHook(() =>
      useThermostatCommands({ homeId: 'home-1', refetch, setError }),
    );

    await act(async () => {
      await result.current.setHomeMode('schedule');
    });

    expect(refetch).not.toHaveBeenCalled();
  });

  it('Test 8: routes thrown errors to params.setError with the message', async () => {
    mockTempCmd.execute.mockRejectedValueOnce(new Error('boom'));

    const { result } = renderHook(() =>
      useThermostatCommands({ homeId: 'home-1', refetch, setError }),
    );

    await act(async () => {
      await result.current.setRoomSetpoint('room-A', 21);
    });

    expect(setError).toHaveBeenCalledWith('boom');
  });

  it('Test 9: non-Error throws are coerced via String(err) on setError', async () => {
    mockModeCmd.execute.mockRejectedValueOnce('string-error');

    const { result } = renderHook(() =>
      useThermostatCommands({ homeId: 'home-1', refetch, setError }),
    );

    await act(async () => {
      await result.current.setHomeMode('away');
    });

    expect(setError).toHaveBeenCalledWith('string-error');
  });

  it('Test 10: exposes netatmoTempCmd and netatmoModeCmd for UI integration', () => {
    const { result } = renderHook(() =>
      useThermostatCommands({ homeId: 'home-1', refetch, setError }),
    );

    expect(result.current.netatmoTempCmd).toBeDefined();
    expect(result.current.netatmoModeCmd).toBeDefined();
    expect(result.current.netatmoTempCmd).toBe(mockTempCmd);
    expect(result.current.netatmoModeCmd).toBe(mockModeCmd);
  });

  it('Test 11: setRoomSetpoint without setError does not crash on rejection', async () => {
    mockTempCmd.execute.mockRejectedValueOnce(new Error('silent'));

    const { result } = renderHook(() =>
      useThermostatCommands({ homeId: 'home-1', refetch }),
    );

    await act(async () => {
      await result.current.setRoomSetpoint('room-A', 21);
    });

    expect(refetch).not.toHaveBeenCalled();
  });
});
