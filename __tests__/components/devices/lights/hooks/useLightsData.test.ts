/**
 * Tests for useLightsData hook
 *
 * @jest-environment jsdom
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { useLightsData } from '@/app/components/devices/lights/hooks/useLightsData';
import { useAdaptivePolling } from '@/lib/hooks/useAdaptivePolling';
import * as colorUtils from '@/lib/hue/colorUtils';

// Mock dependencies
jest.mock('@/lib/hooks/useAdaptivePolling');
jest.mock('@/lib/hue/colorUtils');

describe('useLightsData', () => {
  const mockRoomsData = {
    rooms: [
      {
        id: 'room1',
        metadata: { name: 'Camera' },
        children: [{ rid: 'light1', rtype: 'light' }],
        services: [
          { rid: 'grouped_light_1', rtype: 'grouped_light' },
          { rid: 'light1', rtype: 'light' }
        ]
      },
      {
        id: 'room2',
        metadata: { name: 'Casa' },
        children: [{ rid: 'light2', rtype: 'light' }],
        services: [
          { rid: 'grouped_light_2', rtype: 'grouped_light' },
          { rid: 'light2', rtype: 'light' }
        ]
      }
    ]
  };

  const mockLightsData = {
    lights: [
      { id: 'light1', on: { on: true }, dimming: { brightness: 80 }, owner: { rid: 'device1' } },
      { id: 'light2', on: { on: false }, dimming: { brightness: 50 }, owner: { rid: 'device2' } }
    ]
  };

  const mockScenesData = {
    scenes: [
      { id: 'scene1', metadata: { name: 'Relax' }, group: { rid: 'room1' } },
      { id: 'scene2', metadata: { name: 'Energize' }, group: { rid: 'room2' } }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock useAdaptivePolling
    jest.mocked(useAdaptivePolling).mockImplementation(({ callback, immediate }) => {
      if (immediate) {
        // Call immediately on mount
        setTimeout(() => callback(), 0);
      }
    });

    // Mock color utilities
    jest.mocked(colorUtils.supportsColor).mockReturnValue(true);
    jest.mocked(colorUtils.getCurrentColorHex).mockReturnValue('#FFE4B5');

    // Mock fetch globally
    global.fetch = jest.fn((url: string) => {
      if (url.includes('/api/hue/status')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            connected: true,
            connection_mode: 'local',
            remote_connected: false
          })
        }) as any;
      }
      if (url.includes('/api/hue/rooms')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockRoomsData)
        }) as any;
      }
      if (url.includes('/api/hue/lights')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockLightsData)
        }) as any;
      }
      if (url.includes('/api/hue/scenes')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockScenesData)
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
    expect(result.current.rooms).toEqual([]);
    expect(result.current.lights).toEqual([]);
    expect(result.current.scenes).toEqual([]);
    expect(result.current.selectedRoomId).toBe(null);
    expect(result.current.pairing).toBe(false);
    expect(result.current.pairingStep).toBe(null);
  });

  it('calls checkConnection on mount', async () => {
    renderHook(() => useLightsData());

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/hue/status');
    });
  });

  it('sets connected state from API response', async () => {
    const { result } = renderHook(() => useLightsData());

    await waitFor(() => {
      expect(result.current.connected).toBe(true);
      expect(result.current.connectionMode).toBe('local');
      expect(result.current.remoteConnected).toBe(false);
      expect(result.current.loading).toBe(false);
    });
  });

  it('fetches rooms, lights, and scenes data', async () => {
    const { result } = renderHook(() => useLightsData());

    await waitFor(() => {
      expect(result.current.rooms.length).toBe(2);
      expect(result.current.lights.length).toBe(2);
      expect(result.current.scenes.length).toBe(2);
    });
  });

  it('sorts rooms with Casa first', async () => {
    const { result } = renderHook(() => useLightsData());

    await waitFor(() => {
      expect(result.current.rooms[0].metadata.name).toBe('Casa');
      expect(result.current.rooms[1].metadata.name).toBe('Camera');
    });
  });

  it('auto-selects first room', async () => {
    const { result } = renderHook(() => useLightsData());

    await waitFor(() => {
      expect(result.current.selectedRoomId).toBe('room2'); // Casa is first after sorting
    });
  });

  it('computes selectedRoom based on selectedRoomId', async () => {
    const { result } = renderHook(() => useLightsData());

    await waitFor(() => {
      expect(result.current.selectedRoom?.metadata?.name).toBe('Casa');
    });
  });

  it('extracts grouped_light ID from room services', async () => {
    const { result } = renderHook(() => useLightsData());

    await waitFor(() => {
      expect(result.current.selectedRoomGroupedLightId).toBe('grouped_light_2');
    });
  });

  it('filters roomLights based on selectedRoom children', async () => {
    const { result } = renderHook(() => useLightsData());

    await waitFor(() => {
      expect(result.current.roomLights.length).toBe(1);
      expect(result.current.roomLights[0].id).toBe('light2');
    });
  });

  it('filters roomScenes based on selectedRoom group', async () => {
    const { result } = renderHook(() => useLightsData());

    await waitFor(() => {
      expect(result.current.roomScenes.length).toBe(1);
      expect(result.current.roomScenes[0].id).toBe('scene2');
    });
  });

  it('calculates hasColorLights from roomLights', async () => {
    jest.mocked(colorUtils.supportsColor).mockReturnValue(true);

    const { result } = renderHook(() => useLightsData());

    await waitFor(() => {
      expect(result.current.hasColorLights).toBe(true);
    });
  });

  it('calculates lightsOnCount and lightsOffCount', async () => {
    const { result } = renderHook(() => useLightsData());

    await waitFor(() => {
      // room2 (Casa) has light2 which is off
      expect(result.current.lightsOnCount).toBe(0);
      expect(result.current.lightsOffCount).toBe(1);
    });
  });

  it('calculates allLightsOn correctly', async () => {
    const { result } = renderHook(() => useLightsData());

    await waitFor(() => {
      expect(result.current.allLightsOn).toBe(false);
    });
  });

  it('calculates allLightsOff correctly', async () => {
    const { result } = renderHook(() => useLightsData());

    await waitFor(() => {
      expect(result.current.allLightsOff).toBe(true);
    });
  });

  it('calculates isRoomOn based on services', async () => {
    const { result } = renderHook(() => useLightsData());

    await waitFor(() => {
      // room2 has light2 which is off
      expect(result.current.isRoomOn).toBe(false);
    });
  });

  it('calculates totalLightsOn and totalLightsOff', async () => {
    const { result } = renderHook(() => useLightsData());

    await waitFor(() => {
      expect(result.current.totalLightsOn).toBe(1); // light1 is on
      expect(result.current.totalLightsOff).toBe(1); // light2 is off
    });
  });

  it('calculates allHouseLightsOn correctly', async () => {
    const { result } = renderHook(() => useLightsData());

    await waitFor(() => {
      expect(result.current.allHouseLightsOn).toBe(false);
    });
  });

  it('calculates allHouseLightsOff correctly', async () => {
    const { result } = renderHook(() => useLightsData());

    await waitFor(() => {
      expect(result.current.allHouseLightsOff).toBe(false);
    });
  });

  it('calculates hasAnyLights correctly', async () => {
    const { result } = renderHook(() => useLightsData());

    await waitFor(() => {
      expect(result.current.hasAnyLights).toBe(true);
    });
  });

  it('calculates avgBrightness for selected room', async () => {
    const { result } = renderHook(() => useLightsData());

    await waitFor(() => {
      // room2 has light2 with brightness 50
      expect(result.current.avgBrightness).toBe(50);
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
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useLightsData());

    await waitFor(() => {
      expect(result.current.connected).toBe(false);
      expect(result.current.connectionMode).toBe('disconnected');
      expect(result.current.error).toBe('Network error');
    });
  });

  it('handles fetchData error gracefully', async () => {
    global.fetch = jest.fn((url: string) => {
      if (url.includes('/api/hue/status')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ connected: true, connection_mode: 'local' })
        }) as any;
      }
      if (url.includes('/api/hue/rooms')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ error: 'Rooms fetch failed' })
        }) as any;
      }
      if (url.includes('/api/hue/lights')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockLightsData)
        }) as any;
      }
      if (url.includes('/api/hue/scenes')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockScenesData)
        }) as any;
      }
      return Promise.reject(new Error('Unknown URL')) as any;
    });

    const { result } = renderHook(() => useLightsData());

    await waitFor(() => {
      expect(result.current.error).toBe('Rooms fetch failed');
    });
  });

  it('handles reconnect flag in fetchData', async () => {
    global.fetch = jest.fn((url: string) => {
      if (url.includes('/api/hue/status')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ connected: true, connection_mode: 'local' })
        }) as any;
      }
      if (url.includes('/api/hue/rooms')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ reconnect: true })
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
      result.current.setSelectedRoomId('room1');
      result.current.setLocalBrightness(75);
      result.current.setError('Test error');
      result.current.setPairingError('Pairing error');
      result.current.setRefreshing(true);
      result.current.setLoadingMessage('Testing...');
      result.current.setPairing(true);
      result.current.setPairingStep('discovering');
      result.current.setDiscoveredBridges([{ id: 'bridge1' }]);
      result.current.setSelectedBridge({ id: 'bridge1' });
      result.current.setPairingCountdown(25);
    });

    expect(result.current.selectedRoomId).toBe('room1');
    expect(result.current.localBrightness).toBe(75);
    expect(result.current.error).toBe('Test error');
    expect(result.current.pairingError).toBe('Pairing error');
    expect(result.current.refreshing).toBe(true);
    expect(result.current.loadingMessage).toBe('Testing...');
    expect(result.current.pairing).toBe(true);
    expect(result.current.pairingStep).toBe('discovering');
    expect(result.current.discoveredBridges).toEqual([{ id: 'bridge1' }]);
    expect(result.current.selectedBridge).toEqual({ id: 'bridge1' });
    expect(result.current.pairingCountdown).toBe(25);
  });

  it('cleans up pairing timer on unmount', () => {
    const { result, unmount } = renderHook(() => useLightsData());

    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

    // Set a timer
    result.current.pairingTimerRef.current = setInterval(() => {}, 1000);

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  it('returns adaptive classes for light contrast mode', async () => {
    // Mock to return bright color
    jest.mocked(colorUtils.getCurrentColorHex).mockReturnValue('#FFFF00');

    global.fetch = jest.fn((url: string) => {
      if (url.includes('/api/hue/status')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ connected: true, connection_mode: 'local' })
        }) as any;
      }
      if (url.includes('/api/hue/rooms')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockRoomsData)
        }) as any;
      }
      if (url.includes('/api/hue/lights')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            lights: [
              { id: 'light2', on: { on: true }, dimming: { brightness: 90 }, owner: { rid: 'device2' } }
            ]
          })
        }) as any;
      }
      if (url.includes('/api/hue/scenes')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockScenesData)
        }) as any;
      }
      return Promise.reject(new Error('Unknown URL')) as any;
    });

    const { result } = renderHook(() => useLightsData());

    await waitFor(() => {
      // With bright yellow light at 90% brightness, contrastMode should be 'light'
      expect(result.current.contrastMode).toBe('light');
      expect(result.current.adaptive.heading).toBe('text-slate-900');
    });
  });

  it('returns default adaptive classes when no dynamic style', async () => {
    const { result } = renderHook(() => useLightsData());

    await waitFor(() => {
      // room2 lights are off, so no dynamic style
      expect(result.current.contrastMode).toBe('default');
      expect(result.current.adaptive.heading).toBe('');
    });
  });
});
