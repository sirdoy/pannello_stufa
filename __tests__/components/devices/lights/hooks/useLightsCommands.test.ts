/**
 * Tests for useLightsCommands hook
 *
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';
import { useLightsCommands } from '@/app/components/devices/lights/hooks/useLightsCommands';
import { useRetryableCommand } from '@/lib/hooks/useRetryableCommand';
import type { UseLightsDataReturn } from '@/app/components/devices/lights/hooks/useLightsData';

// Mock dependencies
jest.mock('@/lib/hooks/useRetryableCommand');

describe('useLightsCommands', () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
  } as any;

  const mockLightsData: Pick<
    UseLightsDataReturn,
    | 'setRefreshing'
    | 'setLoadingMessage'
    | 'setError'
    | 'fetchData'
    | 'rooms'
    | 'setPairing'
    | 'setPairingStep'
    | 'setDiscoveredBridges'
    | 'setSelectedBridge'
    | 'setPairingCountdown'
    | 'setPairingError'
    | 'pairingTimerRef'
    | 'selectedBridge'
    | 'checkConnection'
    | 'connected'
  > = {
    setRefreshing: jest.fn(),
    setLoadingMessage: jest.fn(),
    setError: jest.fn(),
    fetchData: jest.fn(),
    rooms: [
      {
        id: 'room1',
        services: [{ rid: 'grouped_light_1', rtype: 'grouped_light' }]
      },
      {
        id: 'room2',
        services: [{ rid: 'grouped_light_2', rtype: 'grouped_light' }]
      }
    ],
    setPairing: jest.fn(),
    setPairingStep: jest.fn(),
    setDiscoveredBridges: jest.fn(),
    setSelectedBridge: jest.fn(),
    setPairingCountdown: jest.fn(),
    setPairingError: jest.fn(),
    pairingTimerRef: { current: null },
    selectedBridge: null,
    checkConnection: jest.fn(),
    connected: true,
  };

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

    // Mock global fetch
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({}),
    });

    // Mock window.location
    delete (window as any).location;
    (window as any).location = { href: '' };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns all command handlers', () => {
    const { result } = renderHook(() =>
      useLightsCommands({
        lightsData: mockLightsData,
        router: mockRouter,
      })
    );

    expect(typeof result.current.handleRoomToggle).toBe('function');
    expect(typeof result.current.handleBrightnessChange).toBe('function');
    expect(typeof result.current.handleSceneActivate).toBe('function');
    expect(typeof result.current.handleAllLightsToggle).toBe('function');
    expect(typeof result.current.handleRemoteAuth).toBe('function');
    expect(typeof result.current.handleDisconnectRemote).toBe('function');
    expect(typeof result.current.handleStartPairing).toBe('function');
    expect(typeof result.current.handlePairWithBridge).toBe('function');
    expect(typeof result.current.handleConfirmButtonPressed).toBe('function');
    expect(typeof result.current.handleSelectBridge).toBe('function');
    expect(typeof result.current.handleRetryPairing).toBe('function');
    expect(typeof result.current.handleCancelPairing).toBe('function');
  });

  it('returns retryable command objects', () => {
    const { result } = renderHook(() =>
      useLightsCommands({
        lightsData: mockLightsData,
        router: mockRouter,
      })
    );

    expect(result.current.hueRoomCmd).toBeDefined();
    expect(result.current.hueSceneCmd).toBeDefined();
  });

  it('handleRoomToggle calls execute with correct URL and body', async () => {
    mockExecute.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({}),
    });

    const { result } = renderHook(() =>
      useLightsCommands({
        lightsData: mockLightsData,
        router: mockRouter,
      })
    );

    await act(async () => {
      await result.current.handleRoomToggle('grouped_light_1', true);
    });

    expect(mockExecute).toHaveBeenCalledWith(
      '/api/hue/rooms/grouped_light_1',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ on: { on: true } }),
      })
    );
    expect(mockLightsData.fetchData).toHaveBeenCalled();
    expect(mockLightsData.setRefreshing).toHaveBeenCalledWith(false);
  });

  it('handleBrightnessChange calls execute with dimming body', async () => {
    mockExecute.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({}),
    });

    const { result } = renderHook(() =>
      useLightsCommands({
        lightsData: mockLightsData,
        router: mockRouter,
      })
    );

    await act(async () => {
      await result.current.handleBrightnessChange('grouped_light_1', '75');
    });

    expect(mockExecute).toHaveBeenCalledWith(
      '/api/hue/rooms/grouped_light_1',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ dimming: { brightness: 75 } }),
      })
    );
    expect(mockLightsData.fetchData).toHaveBeenCalled();
  });

  it('handleSceneActivate calls execute with activate URL', async () => {
    mockExecute.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({}),
    });

    const { result } = renderHook(() =>
      useLightsCommands({
        lightsData: mockLightsData,
        router: mockRouter,
      })
    );

    await act(async () => {
      await result.current.handleSceneActivate('scene123');
    });

    expect(mockExecute).toHaveBeenCalledWith(
      '/api/hue/scenes/scene123/activate',
      expect.objectContaining({
        method: 'PUT',
      })
    );
    expect(mockLightsData.fetchData).toHaveBeenCalled();
  });

  it('handleAllLightsToggle calls execute for all rooms', async () => {
    mockExecute.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({}),
    });

    const { result } = renderHook(() =>
      useLightsCommands({
        lightsData: mockLightsData,
        router: mockRouter,
      })
    );

    await act(async () => {
      await result.current.handleAllLightsToggle(true);
    });

    // Should be called twice (once for each room)
    expect(mockExecute).toHaveBeenCalledTimes(2);
    expect(mockExecute).toHaveBeenCalledWith(
      '/api/hue/rooms/grouped_light_1',
      expect.objectContaining({
        body: JSON.stringify({ on: { on: true } }),
      })
    );
    expect(mockExecute).toHaveBeenCalledWith(
      '/api/hue/rooms/grouped_light_2',
      expect.objectContaining({
        body: JSON.stringify({ on: { on: true } }),
      })
    );
    expect(mockLightsData.fetchData).toHaveBeenCalled();
  });

  it('handleRemoteAuth clears errors and triggers redirect', () => {
    const { result } = renderHook(() =>
      useLightsCommands({
        lightsData: mockLightsData,
        router: mockRouter,
      })
    );

    act(() => {
      result.current.handleRemoteAuth();
    });

    // Check that error states were cleared (main functionality)
    expect(mockLightsData.setPairingError).toHaveBeenCalledWith(null);
    expect(mockLightsData.setError).toHaveBeenCalledWith(null);
    // window.location.href assignment happens, but jsdom doesn't navigate
  });

  it('handleDisconnectRemote calls disconnect endpoint', async () => {
    const { result } = renderHook(() =>
      useLightsCommands({
        lightsData: mockLightsData,
        router: mockRouter,
      })
    );

    await act(async () => {
      await result.current.handleDisconnectRemote();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/hue/remote/disconnect',
      expect.objectContaining({
        method: 'POST',
      })
    );
    expect(mockLightsData.checkConnection).toHaveBeenCalled();
  });

  it('handleStartPairing fetches bridges and sets step', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        bridges: [{ id: 'bridge1', internalipaddress: '192.168.1.2' }]
      }),
    });

    const { result } = renderHook(() =>
      useLightsCommands({
        lightsData: mockLightsData,
        router: mockRouter,
      })
    );

    await act(async () => {
      await result.current.handleStartPairing();
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/hue/discover');
    expect(mockLightsData.setPairing).toHaveBeenCalledWith(true);
    expect(mockLightsData.setPairingStep).toHaveBeenCalledWith('discovering');
    expect(mockLightsData.setDiscoveredBridges).toHaveBeenCalledWith([
      { id: 'bridge1', internalipaddress: '192.168.1.2' }
    ]);
    expect(mockLightsData.setSelectedBridge).toHaveBeenCalled();
    expect(mockLightsData.setPairingStep).toHaveBeenCalledWith('waitingForButtonPress');
  });

  it('handleStartPairing sets noLocalBridge step when no bridges found', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        bridges: []
      }),
    });

    const { result } = renderHook(() =>
      useLightsCommands({
        lightsData: mockLightsData,
        router: mockRouter,
      })
    );

    await act(async () => {
      await result.current.handleStartPairing();
    });

    expect(mockLightsData.setPairingStep).toHaveBeenCalledWith('noLocalBridge');
  });

  it('handlePairWithBridge attempts pairing with bridge', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ success: true }),
    });

    const { result } = renderHook(() =>
      useLightsCommands({
        lightsData: mockLightsData,
        router: mockRouter,
      })
    );

    const bridge = { id: 'bridge1', internalipaddress: '192.168.1.2' };

    await act(async () => {
      await result.current.handlePairWithBridge(bridge);
    });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/hue/pair',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          bridgeIp: '192.168.1.2',
          bridgeId: 'bridge1',
        }),
      })
    );
    expect(mockLightsData.setPairingStep).toHaveBeenCalledWith('success');
  });

  it('handlePairWithBridge handles LINK_BUTTON_NOT_PRESSED error', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ error: 'LINK_BUTTON_NOT_PRESSED' }),
    });

    const { result } = renderHook(() =>
      useLightsCommands({
        lightsData: mockLightsData,
        router: mockRouter,
      })
    );

    const bridge = { id: 'bridge1', internalipaddress: '192.168.1.2' };

    await act(async () => {
      await result.current.handlePairWithBridge(bridge);
    });

    expect(mockLightsData.setPairingError).toHaveBeenCalledWith(
      expect.stringContaining('Pulsante bridge non premuto')
    );
  });

  it('handleConfirmButtonPressed calls handlePairWithBridge', async () => {
    const bridge = { id: 'bridge1', internalipaddress: '192.168.1.2' };
    const lightsDataWithBridge = { ...mockLightsData, selectedBridge: bridge };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ success: true }),
    });

    const { result } = renderHook(() =>
      useLightsCommands({
        lightsData: lightsDataWithBridge,
        router: mockRouter,
      })
    );

    await act(async () => {
      result.current.handleConfirmButtonPressed();
    });

    // Wait for async operations
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/hue/pair',
      expect.objectContaining({
        method: 'POST',
      })
    );
  });

  it('handleSelectBridge sets bridge and step', () => {
    const { result } = renderHook(() =>
      useLightsCommands({
        lightsData: mockLightsData,
        router: mockRouter,
      })
    );

    const bridge = { id: 'bridge1', internalipaddress: '192.168.1.2' };

    act(() => {
      result.current.handleSelectBridge(bridge);
    });

    expect(mockLightsData.setSelectedBridge).toHaveBeenCalledWith(bridge);
    expect(mockLightsData.setPairingStep).toHaveBeenCalledWith('waitingForButtonPress');
  });

  it('handleRetryPairing resets pairing error when bridge selected', () => {
    const bridge = { id: 'bridge1', internalipaddress: '192.168.1.2' };
    const lightsDataWithBridge = { ...mockLightsData, selectedBridge: bridge };

    const { result } = renderHook(() =>
      useLightsCommands({
        lightsData: lightsDataWithBridge,
        router: mockRouter,
      })
    );

    act(() => {
      result.current.handleRetryPairing();
    });

    expect(mockLightsData.setPairingError).toHaveBeenCalledWith(null);
    expect(mockLightsData.setPairingStep).toHaveBeenCalledWith('waitingForButtonPress');
  });

  it('handleCancelPairing clears all pairing state', () => {
    const { result } = renderHook(() =>
      useLightsCommands({
        lightsData: mockLightsData,
        router: mockRouter,
      })
    );

    act(() => {
      result.current.handleCancelPairing();
    });

    expect(mockLightsData.setPairing).toHaveBeenCalledWith(false);
    expect(mockLightsData.setPairingStep).toHaveBeenCalledWith(null);
    expect(mockLightsData.setPairingError).toHaveBeenCalledWith(null);
    expect(mockLightsData.setSelectedBridge).toHaveBeenCalledWith(null);
    expect(mockLightsData.setDiscoveredBridges).toHaveBeenCalledWith([]);
  });

  it('handles errors in command execution', async () => {
    mockExecute.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ error: 'Command failed' }),
    });

    const { result } = renderHook(() =>
      useLightsCommands({
        lightsData: mockLightsData,
        router: mockRouter,
      })
    );

    await act(async () => {
      await result.current.handleRoomToggle('grouped_light_1', true);
    });

    expect(mockLightsData.setError).toHaveBeenCalledWith('Command failed');
    expect(mockLightsData.setRefreshing).toHaveBeenCalledWith(false);
  });

  it('handles null response from deduplicated request', async () => {
    mockExecute.mockResolvedValue(null);

    const { result } = renderHook(() =>
      useLightsCommands({
        lightsData: mockLightsData,
        router: mockRouter,
      })
    );

    await act(async () => {
      await result.current.handleRoomToggle('grouped_light_1', true);
    });

    // Should not throw error, should not call fetchData, but should clean up
    expect(mockLightsData.fetchData).not.toHaveBeenCalled();
    expect(mockLightsData.setRefreshing).toHaveBeenCalledWith(false);
  });
});
