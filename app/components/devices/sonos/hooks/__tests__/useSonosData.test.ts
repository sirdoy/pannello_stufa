/**
 * Tests for useSonosData Hook
 *
 * Validates loading state, data fetching from health+zones+playback endpoints,
 * error handling, stale state, and "most interesting zone" selection logic.
 */

import { renderHook, waitFor } from '@testing-library/react';
import type { SonosHealthResponse, SonosZoneResponse, SonosPlaybackResponse } from '@/types/sonosProxy';

// Mock dependencies
jest.mock('@/lib/hooks/useAdaptivePolling');
jest.mock('@/lib/hooks/useVisibility');

// Import mocked modules
import { useAdaptivePolling } from '@/lib/hooks/useAdaptivePolling';
import { useVisibility } from '@/lib/hooks/useVisibility';

const mockUseVisibility = useVisibility as jest.MockedFunction<typeof useVisibility>;
const mockUseAdaptivePolling = useAdaptivePolling as jest.MockedFunction<typeof useAdaptivePolling>;

// Fixture data
const mockHealth: SonosHealthResponse = {
  connected: true,
  data_freshness: 'LIVE',
  device_count: 3,
  last_poll_at: '2026-03-24T10:00:00Z',
  last_success_at: '2026-03-24T10:00:00Z',
};

const mockZone1: SonosZoneResponse = {
  group_id: 'RINCON_A',
  label: 'Salotto',
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
  label: 'Cucina',
  coordinator_uid: 'RINCON_C',
  coordinator_name: 'One',
  member_count: 1,
  members: [{ uid: 'RINCON_C', name: 'One', ip: '192.168.1.12', role: 'speaker' }],
};

const mockPlaybackPlaying: SonosPlaybackResponse = {
  group_id: 'RINCON_A',
  transport_state: 'PLAYING',
  title: 'Bohemian Rhapsody',
  artist: 'Queen',
  album: 'A Night at the Opera',
  album_art_url: null,
  position: '0:01:30',
  duration: '0:05:54',
  source_type: 'streaming',
};

const mockPlaybackStopped: SonosPlaybackResponse = {
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

function makeSuccessFetch(opts?: {
  health?: SonosHealthResponse;
  zones?: SonosZoneResponse[];
  playbacks?: Record<string, SonosPlaybackResponse>;
}) {
  const health = opts?.health ?? mockHealth;
  const zones = opts?.zones ?? [mockZone1, mockZone2];
  const playbacks = opts?.playbacks ?? {
    RINCON_A: mockPlaybackPlaying,
    RINCON_C: mockPlaybackStopped,
  };

  return (url: string) => {
    if (url === '/api/sonos/health') {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(health) });
    }
    if (url === '/api/sonos/zones') {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ zones }) });
    }
    // Match playback URLs like /api/sonos/zones/RINCON_A/playback
    const playbackMatch = (url as string).match(/\/api\/sonos\/zones\/([^/]+)\/playback/);
    if (playbackMatch) {
      const groupId = playbackMatch[1];
      const pb = groupId ? playbacks[groupId] : undefined;
      if (pb) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(pb) });
      }
      return Promise.resolve({ ok: false, json: () => Promise.resolve({}) });
    }
    return Promise.reject(new Error(`Unexpected URL: ${url as string}`));
  };
}

describe('useSonosData', () => {
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

  // Import hook lazily after mocks are set up
  let useSonosData: typeof import('../useSonosData').useSonosData;

  beforeAll(async () => {
    const mod = await import('../useSonosData');
    useSonosData = mod.useSonosData;
  });

  it('Test 1: returns { data: null, loading: true, error: null, stale: false } initially', () => {
    // Mock fetch but delay resolution
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));
    mockUseAdaptivePolling.mockImplementation(() => {
      // don't call callback immediately
    });

    const { result } = renderHook(() => useSonosData());

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
    expect(result.current.stale).toBe(false);
  });

  it('Test 2: after successful fetch, data contains health, zones, nowPlaying, speakerCount, zoneCount', async () => {
    (global.fetch as jest.Mock).mockImplementation(makeSuccessFetch());

    const { result } = renderHook(() => useSonosData());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).not.toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.stale).toBe(false);

    const data = result.current.data!;
    expect(data.health).toEqual(mockHealth);
    expect(data.zones).toHaveLength(2);
    expect(data.zoneCount).toBe(2);
    expect(data.speakerCount).toBe(mockHealth.device_count);
    expect(data.nowPlaying).not.toBeNull();
  });

  it('Test 3: on fetch failure with no prior data, error is set to "Sonos non raggiungibile"', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useSonosData());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('Sonos non raggiungibile');
    expect(result.current.data).toBeNull();
  });

  it('Test 4: on fetch failure with prior data, stale is true and data preserved', async () => {
    // First fetch succeeds
    (global.fetch as jest.Mock).mockImplementation(makeSuccessFetch());

    const { result } = renderHook(() => useSonosData());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).not.toBeNull();

    // Second fetch fails
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    // Manually invoke the callback again
    const callbackArg = mockUseAdaptivePolling.mock.calls[0]?.[0];
    if (callbackArg) {
      await callbackArg.callback();
    }

    await waitFor(() => expect(result.current.stale).toBe(true));

    // Data should still be present (not cleared)
    expect(result.current.data).not.toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('Test 5: "Most interesting zone" picks first zone with transport_state PLAYING', async () => {
    // Zone2 plays, zone1 is stopped
    (global.fetch as jest.Mock).mockImplementation(makeSuccessFetch({
      playbacks: {
        RINCON_A: { ...mockPlaybackPlaying, transport_state: 'STOPPED', group_id: 'RINCON_A' },
        RINCON_C: { ...mockPlaybackStopped, transport_state: 'PLAYING', title: 'Cucina Song', group_id: 'RINCON_C' },
      },
    }));

    const { result } = renderHook(() => useSonosData());
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Should pick the PLAYING zone (RINCON_C)
    expect(result.current.data?.nowPlaying?.transport_state).toBe('PLAYING');
    expect(result.current.data?.nowPlaying?.title).toBe('Cucina Song');
  });

  it('Test 6: zones endpoint response is unwrapped from { zones: [...] } wrapper', async () => {
    const singleZone = [mockZone1];
    (global.fetch as jest.Mock).mockImplementation(makeSuccessFetch({ zones: singleZone }));

    const { result } = renderHook(() => useSonosData());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data?.zones).toHaveLength(1);
    expect(result.current.data?.zones[0]?.group_id).toBe('RINCON_A');
  });

  it('Test 7: playback endpoint response is used directly (not wrapped)', async () => {
    (global.fetch as jest.Mock).mockImplementation(makeSuccessFetch({
      playbacks: {
        RINCON_A: mockPlaybackPlaying,
        RINCON_C: mockPlaybackStopped,
      },
    }));

    const { result } = renderHook(() => useSonosData());
    await waitFor(() => expect(result.current.loading).toBe(false));

    // The nowPlaying should come directly from the SonosPlaybackResponse
    const nowPlaying = result.current.data?.nowPlaying;
    expect(nowPlaying).toHaveProperty('group_id');
    expect(nowPlaying).toHaveProperty('transport_state');
    expect(nowPlaying).toHaveProperty('title');
  });
});
