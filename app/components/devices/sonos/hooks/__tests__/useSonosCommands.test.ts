/**
 * Tests for useSonosCommands Hook
 *
 * Validates transport command handlers (play/pause/stop/next/previous),
 * volume/mute command handlers, 202+poll pattern, and error handling.
 */

import { renderHook, act } from '@testing-library/react';

// Mock useRetryableCommand
jest.mock('@/lib/hooks/useRetryableCommand');

import { useRetryableCommand } from '@/lib/hooks/useRetryableCommand';

const mockUseRetryableCommand = useRetryableCommand as jest.MockedFunction<typeof useRetryableCommand>;

function makeMockCommand(responseOverride?: Partial<Response> | null) {
  const mockExecute = jest.fn();

  if (responseOverride === null) {
    // null means deduplicated
    mockExecute.mockResolvedValue(null);
  } else {
    mockExecute.mockResolvedValue({
      ok: true,
      status: 202,
      json: () => Promise.resolve({ status: 'ok', suggested_poll_delay_s: 0 }),
      ...responseOverride,
    } as Response);
  }

  return {
    execute: mockExecute,
    isRetrying: false,
    attemptCount: 0,
    lastError: null,
    isExecuting: false,
    retry: jest.fn(),
    clearError: jest.fn(),
  };
}

describe('useSonosCommands', () => {
  let mockTransportCmd: ReturnType<typeof makeMockCommand>;
  let mockVolumeCmd: ReturnType<typeof makeMockCommand>;
  let mockFetchData: jest.Mock;
  let mockSetError: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockTransportCmd = makeMockCommand();
    mockVolumeCmd = makeMockCommand();
    mockFetchData = jest.fn().mockResolvedValue(undefined);
    mockSetError = jest.fn();

    let callCount = 0;
    mockUseRetryableCommand.mockImplementation(() => {
      callCount++;
      if (callCount % 2 === 1) return mockTransportCmd as ReturnType<typeof useRetryableCommand>;
      return mockVolumeCmd as ReturnType<typeof useRetryableCommand>;
    });
  });

  let useSonosCommands: typeof import('../useSonosCommands').useSonosCommands;

  beforeAll(async () => {
    const mod = await import('../useSonosCommands');
    useSonosCommands = mod.useSonosCommands;
  });

  it('Test 1: handlePlay calls POST /api/sonos/zones/{groupId}/play, polls after delay', async () => {
    const { result } = renderHook(() =>
      useSonosCommands({ fetchData: mockFetchData, setError: mockSetError })
    );

    await act(async () => {
      await result.current.handlePlay('RINCON_A');
    });

    expect(mockTransportCmd.execute).toHaveBeenCalledWith(
      '/api/sonos/zones/RINCON_A/play',
      expect.objectContaining({ method: 'POST' })
    );
    expect(mockFetchData).toHaveBeenCalled();
  });

  it('Test 2: handlePause calls POST /api/sonos/zones/{groupId}/pause', async () => {
    const { result } = renderHook(() =>
      useSonosCommands({ fetchData: mockFetchData, setError: mockSetError })
    );

    await act(async () => {
      await result.current.handlePause('RINCON_A');
    });

    expect(mockTransportCmd.execute).toHaveBeenCalledWith(
      '/api/sonos/zones/RINCON_A/pause',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('Test 3: handleStop calls POST /api/sonos/zones/{groupId}/stop', async () => {
    const { result } = renderHook(() =>
      useSonosCommands({ fetchData: mockFetchData, setError: mockSetError })
    );

    await act(async () => {
      await result.current.handleStop('RINCON_A');
    });

    expect(mockTransportCmd.execute).toHaveBeenCalledWith(
      '/api/sonos/zones/RINCON_A/stop',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('Test 4: handleNext calls POST /api/sonos/zones/{groupId}/next', async () => {
    const { result } = renderHook(() =>
      useSonosCommands({ fetchData: mockFetchData, setError: mockSetError })
    );

    await act(async () => {
      await result.current.handleNext('RINCON_A');
    });

    expect(mockTransportCmd.execute).toHaveBeenCalledWith(
      '/api/sonos/zones/RINCON_A/next',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('Test 5: handlePrevious calls POST /api/sonos/zones/{groupId}/previous', async () => {
    const { result } = renderHook(() =>
      useSonosCommands({ fetchData: mockFetchData, setError: mockSetError })
    );

    await act(async () => {
      await result.current.handlePrevious('RINCON_A');
    });

    expect(mockTransportCmd.execute).toHaveBeenCalledWith(
      '/api/sonos/zones/RINCON_A/previous',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('Test 6: handleSetVolume calls PUT /api/sonos/speakers/{uid}/volume with body { volume: N }', async () => {
    const { result } = renderHook(() =>
      useSonosCommands({ fetchData: mockFetchData, setError: mockSetError })
    );

    await act(async () => {
      await result.current.handleSetVolume('RINCON_A', 75);
    });

    expect(mockVolumeCmd.execute).toHaveBeenCalledWith(
      '/api/sonos/speakers/RINCON_A/volume',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ volume: 75 }),
      })
    );
    expect(mockFetchData).toHaveBeenCalled();
  });

  it('Test 7: handleSetMute calls PUT /api/sonos/speakers/{uid}/mute with body { mute: boolean }', async () => {
    const { result } = renderHook(() =>
      useSonosCommands({ fetchData: mockFetchData, setError: mockSetError })
    );

    await act(async () => {
      await result.current.handleSetMute('RINCON_A', true);
    });

    expect(mockVolumeCmd.execute).toHaveBeenCalledWith(
      '/api/sonos/speakers/RINCON_A/mute',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ mute: true }),
      })
    );
  });

  it('Test 8: on command error (non-ok response), calls setError', async () => {
    mockTransportCmd.execute.mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'Internal error' }),
    } as unknown as Response);

    const { result } = renderHook(() =>
      useSonosCommands({ fetchData: mockFetchData, setError: mockSetError })
    );

    await act(async () => {
      await result.current.handlePlay('RINCON_A');
    });

    expect(mockSetError).toHaveBeenCalledWith(expect.stringContaining('500'));
  });

  it('Test 9: when response is null (deduplicated), no fetchData call', async () => {
    mockTransportCmd.execute.mockResolvedValue(null);

    const { result } = renderHook(() =>
      useSonosCommands({ fetchData: mockFetchData, setError: mockSetError })
    );

    await act(async () => {
      await result.current.handlePlay('RINCON_A');
    });

    // null response means deduplicated — should not call fetchData or setError
    expect(mockFetchData).not.toHaveBeenCalled();
    expect(mockSetError).not.toHaveBeenCalledWith(expect.stringContaining('Error'));
  });
});
