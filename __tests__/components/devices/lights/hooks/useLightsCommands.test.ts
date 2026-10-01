/**
 * Tests for useLightsCommands hook
 *
 * Tests v1 body format (flat keys), 202 Accepted + suggested_poll_delay_s pattern,
 * scene activation via POST /groups/{gid}/scenes/{sid}, and absence of pairing handlers.
 *
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';
import { useLightsCommands } from '@/app/components/devices/lights/hooks/useLightsCommands';
import { useRetryableCommand } from '@/lib/hooks/useRetryableCommand';
import type { UseLightsDataReturn } from '@/app/components/devices/lights/hooks/useLightsData';
import type { HueGroup, HueCommandResponse } from '@/types/hueProxy';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

// Mock dependencies
jest.mock('@/lib/hooks/useRetryableCommand');

describe('useLightsCommands', () => {
  const mockRouter: AppRouterInstance = {
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
  };

  const mockGroups: HueGroup[] = [
    {
      group_id: '1',
      name: 'Soggiorno',
      type: 'Room',
      group_class: 'Living room',
      lights: ['light1'],
      any_on: true,
      all_on: true,
      brightness: 200,
      color_temp: 300,
      colormode: 'ct',
    },
    {
      group_id: '2',
      name: 'Camera',
      type: 'Room',
      group_class: 'Bedroom',
      lights: ['light2'],
      any_on: false,
      all_on: false,
      brightness: 0,
      color_temp: null,
      colormode: null,
    },
  ];

  const mockCommandResponse: HueCommandResponse = {
    group_id: '1',
    name: 'Soggiorno',
    type: 'Room',
    group_class: 'Living room',
    lights: ['1'],
    any_on: true,
    all_on: true,
    brightness: 254,
    color_temp: null,
    colormode: null,
    data_confirmed: true,
  };

  const mockLightsData: Pick<
    UseLightsDataReturn,
    | 'setRefreshing'
    | 'setLoadingMessage'
    | 'setError'
    | 'fetchData'
    | 'groups'
    | 'checkConnection'
    | 'connected'
  > = {
    setRefreshing: jest.fn(),
    setLoadingMessage: jest.fn(),
    setError: jest.fn(),
    fetchData: jest.fn(),
    groups: mockGroups,
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

    // Mock setTimeout to resolve immediately so tests don't need to wait actual delays
    jest.spyOn(global, 'setTimeout').mockImplementation((fn: (...args: unknown[]) => void) => {
      fn();
      return 0 as unknown as NodeJS.Timeout;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns room command handlers and retry objects', () => {
    const { result } = renderHook(() =>
      useLightsCommands({
        lightsData: mockLightsData,
        router: mockRouter,
      })
    );

    expect(typeof result.current.handleRoomToggle).toBe('function');
    expect(typeof result.current.handleLightToggle).toBe('function');
    expect(typeof result.current.handleBrightnessChange).toBe('function');
    expect(typeof result.current.handleSceneActivate).toBe('function');
    expect(typeof result.current.handleAllLightsToggle).toBe('function');
    expect(result.current.hueRoomCmd).toBeDefined();
    expect(result.current.hueLightCmd).toBeDefined();
    expect(result.current.hueSceneCmd).toBeDefined();
  });

  it('does NOT have pairing handlers in return object', () => {
    const { result } = renderHook(() =>
      useLightsCommands({
        lightsData: mockLightsData,
        router: mockRouter,
      })
    );

    const current: Record<string, unknown> = { ...result.current };
    expect(current.handleRemoteAuth).toBeUndefined();
    expect(current.handleStartPairing).toBeUndefined();
    expect(current.handlePairWithBridge).toBeUndefined();
    expect(current.handleCancelPairing).toBeUndefined();
    expect(current.handleConfirmButtonPressed).toBeUndefined();
    expect(current.handleSelectBridge).toBeUndefined();
    expect(current.handleRetryPairing).toBeUndefined();
    expect(current.handleDisconnectRemote).toBeUndefined();
  });

  it('handleRoomToggle sends v1 flat body { on: true } (not { on: { on: true } })', async () => {
    mockExecute.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockCommandResponse),
    });

    const { result } = renderHook(() =>
      useLightsCommands({
        lightsData: mockLightsData,
        router: mockRouter,
      })
    );

    await act(async () => {
      await result.current.handleRoomToggle('1', true);
    });

    expect(mockExecute).toHaveBeenCalledWith(
      '/api/v1/hue/groups/1/action',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ on: true }),  // v1 flat key, NOT { on: { on: true } }
      })
    );
    expect(mockLightsData.fetchData).toHaveBeenCalled();
    expect(mockLightsData.setRefreshing).toHaveBeenCalledWith(false);
  });

  it('handleRoomToggle waits 2 s before refetching when data_confirmed is false', async () => {
    const responseWithDelay: HueCommandResponse = { ...mockCommandResponse, data_confirmed: false };
    mockExecute.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(responseWithDelay),
    });

    const { result } = renderHook(() =>
      useLightsCommands({
        lightsData: mockLightsData,
        router: mockRouter,
      })
    );

    await act(async () => {
      await result.current.handleRoomToggle('1', true);
    });

    expect(global.setTimeout).toHaveBeenCalledWith(expect.any(Function), 2000);
    expect(mockLightsData.fetchData).toHaveBeenCalled();
  });

  it('handleBrightnessChange sends bri=191 for brightness "75" (Math.round(75*254/100))', async () => {
    mockExecute.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockCommandResponse),
    });

    const { result } = renderHook(() =>
      useLightsCommands({
        lightsData: mockLightsData,
        router: mockRouter,
      })
    );

    await act(async () => {
      await result.current.handleBrightnessChange('1', '75');
    });

    expect(mockExecute).toHaveBeenCalledWith(
      '/api/v1/hue/groups/1/action',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ bri: 191 }),  // Math.round(75 * 254 / 100) = 191; v1 flat, NOT { dimming: { brightness: 75 } }
      })
    );
    expect(mockLightsData.fetchData).toHaveBeenCalled();
  });

  it('handleSceneActivate calls POST to /api/hue/groups/{groupId}/scenes/{sceneId}', async () => {
    const sceneResponse = {
      command: 'activate_scene',
      status: 'accepted',
      scene_id: 'scene1',
      group_id: '1',
      suggested_poll_delay_s: 2,
      poll_endpoint: '/api/hue/rooms/1',
    } as unknown as HueCommandResponse; // legacy 202 contract
    mockExecute.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(sceneResponse),
    });

    const { result } = renderHook(() =>
      useLightsCommands({
        lightsData: mockLightsData,
        router: mockRouter,
      })
    );

    await act(async () => {
      await result.current.handleSceneActivate('scene1', '1');
    });

    expect(mockExecute).toHaveBeenCalledWith(
      '/api/v1/hue/groups/1/scenes/scene1',  // POST /groups/{gid}/scenes/{sid}
      expect.objectContaining({
        method: 'POST',  // not PUT
      })
    );
    expect(mockLightsData.fetchData).toHaveBeenCalled();
  });

  it('handleAllLightsToggle iterates groups by group_id (not grouped_light service)', async () => {
    mockExecute.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockCommandResponse),
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

    // Should be called twice — once for each group (group_id '1' and '2')
    expect(mockExecute).toHaveBeenCalledTimes(2);
    expect(mockExecute).toHaveBeenCalledWith(
      '/api/v1/hue/groups/1/action',
      expect.objectContaining({
        body: JSON.stringify({ on: true }),
      })
    );
    expect(mockExecute).toHaveBeenCalledWith(
      '/api/v1/hue/groups/2/action',
      expect.objectContaining({
        body: JSON.stringify({ on: true }),
      })
    );
    expect(mockLightsData.fetchData).toHaveBeenCalled();
  });

  it('handleLightToggle targets the single light, not its group (M14)', async () => {
    mockExecute.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockCommandResponse),
    });

    const { result } = renderHook(() =>
      useLightsCommands({
        lightsData: mockLightsData,
        router: mockRouter,
      })
    );

    await act(async () => {
      await result.current.handleLightToggle('5', false);
    });

    expect(mockExecute).toHaveBeenCalledTimes(1);
    expect(mockExecute).toHaveBeenCalledWith(
      '/api/v1/hue/lights/5/state',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ on: false }),
      })
    );
    expect(mockLightsData.fetchData).toHaveBeenCalled();
    expect(mockLightsData.setRefreshing).toHaveBeenCalledWith(false);
  });

  it('handleLightToggle sets error "Luce non raggiungibile" on 409', async () => {
    mockExecute.mockResolvedValue({
      ok: false,
      status: 409,
      json: jest.fn().mockResolvedValue({}),
    });

    const { result } = renderHook(() =>
      useLightsCommands({
        lightsData: mockLightsData,
        router: mockRouter,
      })
    );

    await act(async () => {
      await result.current.handleLightToggle('5', true);
    });

    expect(mockLightsData.setError).toHaveBeenCalledWith('Luce non raggiungibile');
    expect(mockLightsData.fetchData).not.toHaveBeenCalled();
  });

  it('handleRoomToggle sets error "Luce non raggiungibile" on 409', async () => {
    mockExecute.mockResolvedValue({
      ok: false,
      status: 409,
      json: jest.fn().mockResolvedValue({}),
    });

    const { result } = renderHook(() =>
      useLightsCommands({
        lightsData: mockLightsData,
        router: mockRouter,
      })
    );

    await act(async () => {
      await result.current.handleRoomToggle('1', true);
    });

    expect(mockLightsData.setError).toHaveBeenCalledWith('Luce non raggiungibile');
    expect(mockLightsData.setRefreshing).toHaveBeenCalledWith(false);
  });

  it('handleBrightnessChange sets error "Luce non raggiungibile" on 409', async () => {
    mockExecute.mockResolvedValue({
      ok: false,
      status: 409,
      json: jest.fn().mockResolvedValue({}),
    });

    const { result } = renderHook(() =>
      useLightsCommands({
        lightsData: mockLightsData,
        router: mockRouter,
      })
    );

    await act(async () => {
      await result.current.handleBrightnessChange('1', '50');
    });

    expect(mockLightsData.setError).toHaveBeenCalledWith('Luce non raggiungibile');
    expect(mockLightsData.setRefreshing).toHaveBeenCalledWith(false);
  });

  it('handles null response from deduplicated request without error', async () => {
    mockExecute.mockResolvedValue(null);

    const { result } = renderHook(() =>
      useLightsCommands({
        lightsData: mockLightsData,
        router: mockRouter,
      })
    );

    await act(async () => {
      await result.current.handleRoomToggle('1', true);
    });

    // Should not throw error, should not call fetchData, but should clean up
    expect(mockLightsData.fetchData).not.toHaveBeenCalled();
    // setError(null) is called at start to clear previous errors — should NOT be called with an error message
    expect(mockLightsData.setError).toHaveBeenCalledWith(null);
    expect(mockLightsData.setError).toHaveBeenCalledTimes(1); // Only the initial clear, no error set
    expect(mockLightsData.setRefreshing).toHaveBeenCalledWith(false);
  });

  it('handleSceneActivate sets error on non-ok non-409 response', async () => {
    mockExecute.mockResolvedValue({
      ok: false,
      status: 500,
      json: jest.fn().mockResolvedValue({}),
    });

    const { result } = renderHook(() =>
      useLightsCommands({
        lightsData: mockLightsData,
        router: mockRouter,
      })
    );

    await act(async () => {
      await result.current.handleSceneActivate('scene1', '1');
    });

    expect(mockLightsData.setError).toHaveBeenCalledWith('Comando fallito: 500');
    expect(mockLightsData.setRefreshing).toHaveBeenCalledWith(false);
  });
});
