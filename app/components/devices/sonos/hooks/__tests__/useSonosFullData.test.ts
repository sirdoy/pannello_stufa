/**
 * Tests for useSonosFullData Hook
 *
 * Validates loading state, data fetching (zones + playback + volumes),
 * Promise.allSettled resilience, error handling, stale state, and fetchData exposure.
 */

import { renderHook, waitFor } from '@testing-library/react';
import type { SonosZoneResponse, SonosPlaybackResponse, SonosVolumeResponse } from '@/types/sonosProxy';

// Mock dependencies
jest.mock('@/lib/hooks/useAdaptivePolling');
jest.mock('@/lib/hooks/useVisibility');

// Import mocked modules
import { useAdaptivePolling } from '@/lib/hooks/useAdaptivePolling';
import { useVisibility } from '@/lib/hooks/useVisibility';

const mockUseVisibility = useVisibility as jest.MockedFunction<typeof useVisibility>;
const mockUseAdaptivePolling = useAdaptivePolling as jest.MockedFunction<typeof useAdaptivePolling>;

// Fixture data
const mockZone1: SonosZoneResponse = {
  group_id: 'RINCON_A',
  label: 'Living Room',
  coordinator_uid: 'RINCON_A',
  coordinator_name: 'Beam',
  member_count: 2,
  members: [
    { uid: 'RINCON_A', name: 'Beam', ip: '192.168.1.10', role: 'soundbar' },
    { uid: 'RINCON_B', name: 'Sub', ip: '192.168.1.11', role: 'sub' },
  ],
};

const mockZone2: SonosZoneResponse = {
  group_id: 'RINCON_C',
  label: 'Kitchen',
  coordinator_uid: 'RINCON_C',
  coordinator_name: 'One',
  member_count: 1,
  members: [
    { uid: 'RINCON_C', name: 'One', ip: '192.168.1.12', role: 'speaker' },
  ],
};

const mockPlayback1: SonosPlaybackResponse = {
  group_id: 'RINCON_A',
  transport_state: 'PLAYING',
  title: 'Test Song',
  artist: 'Test Artist',
  album: 'Test Album',
  album_art_url: null,
  position: '0:01:23',
  duration: '0:03:45',
  source_type: 'streaming',
};

const mockPlayback2: SonosPlaybackResponse = {
  group_id: 'RINCON_C',
  transport_state: 'STOPPED',
  title: null,
  artist: null,
  album: null,
  album_art_url: null,
  position: null,
  duration: null,
  source_type: null,
};

const mockVolume1: SonosVolumeResponse = { uid: 'RINCON_A', volume: 40, mute: false };
const mockVolume2: SonosVolumeResponse = { uid: 'RINCON_B', volume: 0, mute: true };
const mockVolume3: SonosVolumeResponse = { uid: 'RINCON_C', volume: 25, mute: false };

function makeFetchMock(overrides?: {
  zonesOk?: boolean;
  playback1Ok?: boolean;
  playback2Ok?: boolean;
  volumeOk?: boolean;
}) {
  const opts = {
    zonesOk: true,
    playback1Ok: true,
    playback2Ok: true,
    volumeOk: true,
    ...overrides,
  };

  return (url: string) => {
    if (url === '/api/sonos/zones') {
      return Promise.resolve({
        ok: opts.zonesOk,
        json: () => Promise.resolve({ zones: [mockZone1, mockZone2] }),
      });
    }
    if (url === '/api/sonos/zones/RINCON_A/playback') {
      return Promise.resolve({
        ok: opts.playback1Ok,
        json: () => Promise.resolve(mockPlayback1),
      });
    }
    if (url === '/api/sonos/zones/RINCON_C/playback') {
      return Promise.resolve({
        ok: opts.playback2Ok,
        json: () => Promise.resolve(mockPlayback2),
      });
    }
    if (url === '/api/sonos/speakers/RINCON_A/volume') {
      return Promise.resolve({
        ok: opts.volumeOk,
        json: () => Promise.resolve(mockVolume1),
      });
    }
    if (url === '/api/sonos/speakers/RINCON_B/volume') {
      return Promise.resolve({
        ok: opts.volumeOk,
        json: () => Promise.resolve(mockVolume2),
      });
    }
    if (url === '/api/sonos/speakers/RINCON_C/volume') {
      return Promise.resolve({
        ok: opts.volumeOk,
        json: () => Promise.resolve(mockVolume3),
      });
    }
    return Promise.reject(new Error(`Unexpected URL: ${url as string}`));
  };
}

describe('useSonosFullData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();

    mockUseVisibility.mockReturnValue(true);

    mockUseAdaptivePolling.mockImplementation(({ callback, immediate }) => {
      if (immediate) {
        setTimeout(() => void callback(), 0);
      }
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  let useSonosFullData: typeof import('../useSonosFullData').useSonosFullData;

  beforeAll(async () => {
    const mod = await import('../useSonosFullData');
    useSonosFullData = mod.useSonosFullData;
  });

  it('Test 1: returns loading=true initially, then loading=false after fetch resolves', async () => {
    (global.fetch as jest.Mock).mockImplementation(makeFetchMock());

    const { result } = renderHook(() => useSonosFullData());

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).not.toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('Test 2: data contains zones array, playback map, and volumes map', async () => {
    (global.fetch as jest.Mock).mockImplementation(makeFetchMock());

    const { result } = renderHook(() => useSonosFullData());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).not.toBeNull();
    expect(result.current.data!.zones).toHaveLength(2);
    expect(result.current.data!.playback['RINCON_A']).toBeDefined();
    expect(result.current.data!.playback['RINCON_A']!.transport_state).toBe('PLAYING');
    expect(result.current.data!.volumes['RINCON_A']).toBeDefined();
    expect(result.current.data!.volumes['RINCON_A']!.volume).toBe(40);
    expect(result.current.data!.volumes['RINCON_B']).toBeDefined();
    expect(result.current.data!.volumes['RINCON_C']).toBeDefined();
  });

  it('Test 3: uses Promise.allSettled for playback — tolerates 404 for a zone', async () => {
    (global.fetch as jest.Mock).mockImplementation(makeFetchMock({ playback2Ok: false }));

    const { result } = renderHook(() => useSonosFullData());

    await waitFor(() => expect(result.current.loading).toBe(false));

    // Zone 1 playback should still be present
    expect(result.current.data).not.toBeNull();
    expect(result.current.data!.playback['RINCON_A']).toBeDefined();
    // Zone 2 playback failed, should be absent
    expect(result.current.data!.playback['RINCON_C']).toBeUndefined();
    // No overall error
    expect(result.current.error).toBeNull();
  });

  it('Test 4: uses Promise.allSettled for volumes — tolerates individual volume failures', async () => {
    (global.fetch as jest.Mock).mockImplementation(makeFetchMock({ volumeOk: false }));

    const { result } = renderHook(() => useSonosFullData());

    await waitFor(() => expect(result.current.loading).toBe(false));

    // Data still returned (zones + playback succeeded)
    expect(result.current.data).not.toBeNull();
    // Volumes map should be empty (all failed)
    expect(Object.keys(result.current.data!.volumes)).toHaveLength(0);
    // No overall error
    expect(result.current.error).toBeNull();
  });

  it('Test 5: sets error and stale on total failure (zones fetch fails)', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useSonosFullData());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('Sonos non raggiungibile');
    expect(result.current.data).toBeNull();
    expect(result.current.stale).toBe(true);
  });

  it('Test 6: exposes fetchData for command hook consumption', async () => {
    (global.fetch as jest.Mock).mockImplementation(makeFetchMock());

    const { result } = renderHook(() => useSonosFullData());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(typeof result.current.fetchData).toBe('function');
  });

  it('Test 7: stale=true but data preserved when fetch fails after initial success', async () => {
    (global.fetch as jest.Mock).mockImplementation(makeFetchMock());

    const { result } = renderHook(() => useSonosFullData());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).not.toBeNull();

    // Second fetch fails
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    const callbackArg = mockUseAdaptivePolling.mock.calls[0]?.[0];
    if (callbackArg) {
      await callbackArg.callback();
    }

    await waitFor(() => expect(result.current.stale).toBe(true));

    expect(result.current.data).not.toBeNull();
    expect(result.current.error).toBeNull();
  });
});
