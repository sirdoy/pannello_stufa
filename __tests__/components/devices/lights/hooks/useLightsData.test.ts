/**
 * Tests for useLightsData hook
 *
 * Tests proxy-native shapes: flat HueLight.on boolean, HueGroup.group_id,
 * HueGroup.lights array membership, brightness 0-254 to 0-100% conversion,
 * and data_freshness-based staleness.
 *
 * @jest-environment jsdom
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { useLightsData } from '@/app/components/devices/lights/hooks/useLightsData';
import { useAdaptivePolling } from '@/lib/hooks/useAdaptivePolling';
import * as colorUtils from '@/lib/hue/colorUtils';
import type { HueLight, HueGroup, HueScene } from '@/types/hueProxy';

// Mock dependencies
jest.mock('@/lib/hooks/useAdaptivePolling');
jest.mock('@/lib/hue/colorUtils');

describe('useLightsData', () => {
  const mockLight: HueLight = {
    light_id: '1',
    name: 'Lampada Soggiorno',
    on: true,
    brightness: 200,
    ct_mirek: 300,
    ct_kelvin: 3333,
    hue: null,
    saturation: null,
    colormode: 'ct',
    reachable: true,
    capability_tier: 'ambiance',
    room_id: '1',
    room_name: 'Soggiorno',
    model_id: 'LCT015',
    light_type: 'Color temperature light',
  };

  const mockLightOff: HueLight = {
    light_id: '2',
    name: 'Lampada Camera',
    on: false,
    brightness: 100,
    ct_mirek: 370,
    ct_kelvin: 2702,
    hue: null,
    saturation: null,
    colormode: 'ct',
    reachable: true,
    capability_tier: 'white',
    room_id: '2',
    room_name: 'Camera',
    model_id: 'LWB010',
    light_type: 'Dimmable light',
  };

  const mockGroup: HueGroup = {
    group_id: '1',
    name: 'Soggiorno',
    type: 'Room',
    group_class: 'Living room',
    lights: ['1'],
    any_on: true,
    all_on: true,
    brightness: 200,
    color_temp: 300,
    colormode: 'ct',
  };

  const mockGroupCasa: HueGroup = {
    group_id: '0',
    name: 'Casa',
    type: 'Room',
    group_class: 'Other',
    lights: ['1', '2'],
    any_on: true,
    all_on: false,
    brightness: 150,
    color_temp: 300,
    colormode: 'ct',
  };

  const mockScene: HueScene = {
    scene_id: 'abc123',
    name: 'Relax',
    group_id: '1',
    group_name: 'Soggiorno',
    lights: ['1'],
    type: 'GroupScene',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock useAdaptivePolling
    jest.mocked(useAdaptivePolling).mockImplementation(({ callback, immediate }) => {
      if (immediate) {
        setTimeout(() => callback(), 0);
      }
    });

    // Mock color utilities
    jest.mocked(colorUtils.supportsColor).mockReturnValue(false);
    jest.mocked(colorUtils.getCurrentColorHex).mockReturnValue(null);

    // Mock fetch globally — proxy-wrapped responses
    (global as any).fetch = jest.fn((url: string) => {
      if (url.includes('/api/hue/status')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            connected: true,
            data_freshness: 'LIVE',
          }),
        }) as any;
      }
      if (url.includes('/api/hue/rooms')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, groups: [mockGroup, mockGroupCasa] }),
        }) as any;
      }
      if (url.includes('/api/hue/lights')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, lights: [mockLight, mockLightOff] }),
        }) as any;
      }
      if (url.includes('/api/hue/scenes')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, scenes: [mockScene] }),
        }) as any;
      }
      return Promise.reject(new Error('Unknown URL')) as any;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns initial state values', () => {
    const { result } = renderHook(() => useLightsData());

    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe(null);
    expect(result.current.connected).toBe(false);
    expect(result.current.stale).toBe(false);
    expect(result.current.groups).toEqual([]);
    expect(result.current.lights).toEqual([]);
    expect(result.current.scenes).toEqual([]);
    expect(result.current.selectedGroupId).toBe(null);
  });

  it('does NOT have pairing state in return object', () => {
    const { result } = renderHook(() => useLightsData());

    expect((result.current as any).pairing).toBeUndefined();
    expect((result.current as any).pairingStep).toBeUndefined();
    expect((result.current as any).discoveredBridges).toBeUndefined();
    expect((result.current as any).selectedBridge).toBeUndefined();
    expect((result.current as any).pairingCountdown).toBeUndefined();
    expect((result.current as any).pairingError).toBeUndefined();
    expect((result.current as any).connectionMode).toBeUndefined();
    expect((result.current as any).remoteConnected).toBeUndefined();
  });

  it('calls checkConnection on mount (fetches /api/hue/status)', async () => {
    renderHook(() => useLightsData());

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/hue/status');
    });
  });

  it('sets connected=true and stale=false when data_freshness is LIVE', async () => {
    const { result } = renderHook(() => useLightsData());

    await waitFor(() => {
      expect(result.current.connected).toBe(true);
      expect(result.current.stale).toBe(false);
      expect(result.current.loading).toBe(false);
    });
  });

  it('sets stale=true when data_freshness is STALE', async () => {
    (global as any).fetch = jest.fn((url: string) => {
      if (url.includes('/api/hue/status')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, connected: true, data_freshness: 'STALE' }),
        }) as any;
      }
      return Promise.reject(new Error('Unknown URL')) as any;
    });

    const { result } = renderHook(() => useLightsData());

    await waitFor(() => {
      expect(result.current.connected).toBe(true);
      expect(result.current.stale).toBe(true);
    });
  });

  it('sets connected=false on 503 (Bridge UNREACHABLE)', async () => {
    (global as any).fetch = jest.fn((url: string) => {
      if (url.includes('/api/hue/status')) {
        return Promise.resolve({
          ok: false,
          status: 503,
          json: () => Promise.resolve({}),
        }) as any;
      }
      return Promise.reject(new Error('Unknown URL')) as any;
    });

    const { result } = renderHook(() => useLightsData());

    await waitFor(() => {
      expect(result.current.connected).toBe(false);
      expect(result.current.stale).toBe(false);
    });
  });

  it('fetchData sets groups, lights, scenes from wrapped proxy response', async () => {
    const { result } = renderHook(() => useLightsData());

    await waitFor(() => {
      expect(result.current.groups.length).toBe(2);
      expect(result.current.lights.length).toBe(2);
      expect(result.current.scenes.length).toBe(1);
    });
  });

  it('sorts groups with Casa first, then alphabetical', async () => {
    const { result } = renderHook(() => useLightsData());

    await waitFor(() => {
      expect(result.current.groups[0]?.name).toBe('Casa');
      expect(result.current.groups[1]?.name).toBe('Soggiorno');
    });
  });

  it('auto-selects first group (Casa) after sort', async () => {
    const { result } = renderHook(() => useLightsData());

    await waitFor(() => {
      // Casa (group_id '0') is sorted first
      expect(result.current.selectedGroupId).toBe('0');
    });
  });

  it('roomLights filters by group.lights.includes(light.light_id)', async () => {
    const { result } = renderHook(() => useLightsData());

    // Wait for data to load and Casa to be selected
    await waitFor(() => {
      expect(result.current.selectedGroupId).toBe('0');
    });

    // Casa.lights = ['1', '2'] — both mockLight and mockLightOff should be in roomLights
    await waitFor(() => {
      expect(result.current.roomLights.length).toBe(2);
      const lightIds = result.current.roomLights.map(l => l.light_id);
      expect(lightIds).toContain('1');
      expect(lightIds).toContain('2');
    });
  });

  it('avgBrightness converts from 0-254 to 0-100%', async () => {
    // Override to select Soggiorno (group_id '1') — has only light_id '1' with brightness 200
    const { result } = renderHook(() => useLightsData());

    await waitFor(() => {
      expect(result.current.groups.length).toBe(2);
    });

    act(() => {
      result.current.setSelectedGroupId('1');
    });

    await waitFor(() => {
      // light brightness 200 → Math.round(200 / 254 * 100) = 79
      expect(result.current.avgBrightness).toBe(79);
    });
  });

  it('lightsOnCount uses light.on boolean (not light.on?.on)', async () => {
    const { result } = renderHook(() => useLightsData());

    // Select Soggiorno (group_id '1') — has light '1' which has on: true
    await waitFor(() => {
      expect(result.current.groups.length).toBe(2);
    });

    act(() => {
      result.current.setSelectedGroupId('1');
    });

    await waitFor(() => {
      expect(result.current.lightsOnCount).toBe(1);
      expect(result.current.lightsOffCount).toBe(0);
    });
  });

  it('totalLightsOn counts all on lights across all groups', async () => {
    const { result } = renderHook(() => useLightsData());

    await waitFor(() => {
      // mockLight.on = true, mockLightOff.on = false → totalLightsOn = 1
      expect(result.current.totalLightsOn).toBe(1);
      expect(result.current.totalLightsOff).toBe(1);
    });
  });

  it('allLightsOn is true when all effectiveLights are on', async () => {
    const { result } = renderHook(() => useLightsData());

    // Select Soggiorno — only one light (light_id '1') which is on
    await waitFor(() => {
      expect(result.current.groups.length).toBe(2);
    });

    act(() => {
      result.current.setSelectedGroupId('1');
    });

    await waitFor(() => {
      expect(result.current.allLightsOn).toBe(true);
      expect(result.current.allLightsOff).toBe(false);
    });
  });

  it('isRoomOn checks if any effectiveLight.on is true', async () => {
    const { result } = renderHook(() => useLightsData());

    act(() => {
      result.current.setSelectedGroupId('1');
    });

    await waitFor(() => {
      expect(result.current.isRoomOn).toBe(true);
    });
  });

  it('hasColorLights uses supportsColor from colorUtils', async () => {
    jest.mocked(colorUtils.supportsColor).mockReturnValue(true);
    const { result } = renderHook(() => useLightsData());

    act(() => {
      result.current.setSelectedGroupId('1');
    });

    await waitFor(() => {
      expect(result.current.hasColorLights).toBe(true);
    });
  });

  it('hasAnyLights is true when lights exist', async () => {
    const { result } = renderHook(() => useLightsData());

    await waitFor(() => {
      expect(result.current.hasAnyLights).toBe(true);
    });
  });

  it('calls useAdaptivePolling with correct params', () => {
    renderHook(() => useLightsData());

    expect(useAdaptivePolling).toHaveBeenCalledWith(
      expect.objectContaining({
        interval: null, // Initially not connected
        alwaysActive: false,
        immediate: true,
      })
    );
  });

  it('handles checkConnection error gracefully', async () => {
    (global as any).fetch = jest.fn().mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useLightsData());

    await waitFor(() => {
      expect(result.current.connected).toBe(false);
      expect(result.current.stale).toBe(false);
      expect(result.current.error).toBe('Network error');
    });
  });

  it('handles fetchData error from groups response', async () => {
    (global as any).fetch = jest.fn((url: string) => {
      if (url.includes('/api/hue/status')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, connected: true, data_freshness: 'LIVE' }),
        }) as any;
      }
      if (url.includes('/api/hue/rooms')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ error: 'Rooms fetch failed' }),
        }) as any;
      }
      if (url.includes('/api/hue/lights')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, lights: [mockLight] }),
        }) as any;
      }
      if (url.includes('/api/hue/scenes')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, scenes: [mockScene] }),
        }) as any;
      }
      return Promise.reject(new Error('Unknown URL')) as any;
    });

    const { result } = renderHook(() => useLightsData());

    await waitFor(() => {
      expect(result.current.error).toBe('Rooms fetch failed');
    });
  });

  it('handles reconnect flag in fetchData response', async () => {
    (global as any).fetch = jest.fn((url: string) => {
      if (url.includes('/api/hue/status')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, connected: true, data_freshness: 'LIVE' }),
        }) as any;
      }
      if (url.includes('/api/hue/rooms')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ reconnect: true }),
        }) as any;
      }
      return Promise.reject(new Error('Unknown URL')) as any;
    });

    const { result } = renderHook(() => useLightsData());

    await waitFor(() => {
      expect(result.current.connected).toBe(false);
    });
  });

  it('handleRefresh calls checkConnection and fetchData', async () => {
    const { result } = renderHook(() => useLightsData());

    await waitFor(() => {
      expect(result.current.connected).toBe(true);
    });

    const fetchSpy = jest.spyOn(global, 'fetch');

    await act(async () => {
      await result.current.handleRefresh();
    });

    expect(fetchSpy).toHaveBeenCalledWith('/api/hue/status');
    expect(result.current.refreshing).toBe(false);
  });

  it('setters update state correctly', async () => {
    const { result } = renderHook(() => useLightsData());

    await waitFor(() => {
      expect(result.current.connected).toBe(true);
    });

    act(() => {
      result.current.setSelectedGroupId('1');
      result.current.setLocalBrightness(75);
      result.current.setError('Test error');
      result.current.setRefreshing(true);
      result.current.setLoadingMessage('Testing...');
    });

    expect(result.current.selectedGroupId).toBe('1');
    expect(result.current.localBrightness).toBe(75);
    expect(result.current.error).toBe('Test error');
    expect(result.current.refreshing).toBe(true);
    expect(result.current.loadingMessage).toBe('Testing...');
  });

  it('returns adaptive classes for light contrast mode', async () => {
    jest.mocked(colorUtils.getCurrentColorHex).mockReturnValue('#FFFF00');
    jest.mocked(colorUtils.supportsColor).mockReturnValue(true);

    const brightLight: HueLight = {
      ...mockLight,
      light_id: '1',
      on: true,
      brightness: 229, // ~90%
      hue: 10922,
      saturation: 254,
      colormode: 'hs',
      capability_tier: 'color',
    };

    (global as any).fetch = jest.fn((url: string) => {
      if (url.includes('/api/hue/status')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, connected: true, data_freshness: 'LIVE' }),
        }) as any;
      }
      if (url.includes('/api/hue/rooms')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, groups: [mockGroup] }),
        }) as any;
      }
      if (url.includes('/api/hue/lights')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, lights: [brightLight] }),
        }) as any;
      }
      if (url.includes('/api/hue/scenes')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, scenes: [] }),
        }) as any;
      }
      return Promise.reject(new Error('Unknown URL')) as any;
    });

    const { result } = renderHook(() => useLightsData());

    await waitFor(() => {
      // With bright yellow light at ~90% brightness, contrastMode should be 'light'
      expect(result.current.contrastMode).toBe('light');
      expect(result.current.adaptive.heading).toBe('text-slate-900');
    });
  });

  it('returns default adaptive classes when no lights are on', async () => {
    // Use a group where all lights are off
    const groupAllOff: HueGroup = {
      group_id: '99',
      name: 'Dark Room',
      type: 'Room',
      group_class: 'Bedroom',
      lights: ['2'], // mockLightOff
      any_on: false,
      all_on: false,
      brightness: 0,
      color_temp: null,
      colormode: null,
    };

    (global as any).fetch = jest.fn((url: string) => {
      if (url.includes('/api/hue/status')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, connected: true, data_freshness: 'LIVE' }),
        }) as any;
      }
      if (url.includes('/api/hue/rooms')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, groups: [groupAllOff] }),
        }) as any;
      }
      if (url.includes('/api/hue/lights')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, lights: [mockLightOff] }),
        }) as any;
      }
      if (url.includes('/api/hue/scenes')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, scenes: [] }),
        }) as any;
      }
      return Promise.reject(new Error('Unknown URL')) as any;
    });

    const { result } = renderHook(() => useLightsData());

    await waitFor(() => {
      // groupAllOff has light_id '2' (on=false) — isRoomOn=false → no dynamic style → default
      expect(result.current.contrastMode).toBe('default');
      expect(result.current.adaptive.heading).toBe('');
    });
  });
});
