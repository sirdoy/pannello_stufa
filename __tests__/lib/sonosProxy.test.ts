/**
 * Tests for Sonos Proxy Client
 *
 * Tests cover:
 * - Correct URL paths for all 11 new proxy functions
 * - HTTP method (GET, POST, PUT) for each wrapper
 * - Request body for POST/PUT wrappers
 * - X-API-Key header sent on every request (via haGet/haPost/haPut transport)
 */

import {
  getPlayback,
  getSpeakerVolume,
  play,
  pause,
  stop,
  next,
  previous,
  setSpeakerVolume,
  setSpeakerMute,
  setZoneVolume,
  seek,
} from '@/lib/sonos/sonosProxy';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

const TEST_PROXY_URL = 'https://proxy.example.com';
const TEST_API_KEY = 'test-api-key-12345';

const MOCK_OK_RESPONSE = { ok: true, json: async () => ({ status: 'ok' }) };

describe('sonosProxy — monitoring wrappers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.HA_API_URL = TEST_PROXY_URL;
    process.env.HA_API_KEY = TEST_API_KEY;
  });

  afterEach(() => {
    delete process.env.HA_API_URL;
    delete process.env.HA_API_KEY;
  });

  it('getPlayback(groupId) calls GET /api/v1/sonos/zones/{groupId}/playback', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        group_id: 'RINCON_123',
        transport_state: 'PLAYING',
        title: null,
        artist: null,
        album: null,
        album_art_url: null,
        position: null,
        duration: null,
        source_type: null,
      }),
    });

    await getPlayback('RINCON_123');

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${TEST_PROXY_URL}/api/v1/sonos/zones/RINCON_123/playback`);
    expect(options.method).toBeUndefined(); // GET has no explicit method
    expect((options.headers as Record<string, string>)['X-API-Key']).toBe(TEST_API_KEY);
  });

  it('getSpeakerVolume(uid) calls GET /api/v1/sonos/speakers/{uid}/volume', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ uid: 'RINCON_123', volume: 50, mute: false }),
    });

    await getSpeakerVolume('RINCON_123');

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${TEST_PROXY_URL}/api/v1/sonos/speakers/RINCON_123/volume`);
    expect(options.method).toBeUndefined();
    expect((options.headers as Record<string, string>)['X-API-Key']).toBe(TEST_API_KEY);
  });
});

describe('sonosProxy — transport command wrappers (haPost with empty body)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.HA_API_URL = TEST_PROXY_URL;
    process.env.HA_API_KEY = TEST_API_KEY;
  });

  afterEach(() => {
    delete process.env.HA_API_URL;
    delete process.env.HA_API_KEY;
  });

  it('play(groupId) POSTs to /api/v1/sonos/zones/{groupId}/play with empty body', async () => {
    mockFetch.mockResolvedValueOnce(MOCK_OK_RESPONSE);

    await play('RINCON_123');

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${TEST_PROXY_URL}/api/v1/sonos/zones/RINCON_123/play`);
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body as string)).toEqual({});
    expect((options.headers as Record<string, string>)['X-API-Key']).toBe(TEST_API_KEY);
    expect((options.headers as Record<string, string>)['Content-Type']).toBe('application/json');
  });

  it('pause(groupId) POSTs to /api/v1/sonos/zones/{groupId}/pause with empty body', async () => {
    mockFetch.mockResolvedValueOnce(MOCK_OK_RESPONSE);

    await pause('RINCON_123');

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${TEST_PROXY_URL}/api/v1/sonos/zones/RINCON_123/pause`);
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body as string)).toEqual({});
  });

  it('stop(groupId) POSTs to /api/v1/sonos/zones/{groupId}/stop with empty body', async () => {
    mockFetch.mockResolvedValueOnce(MOCK_OK_RESPONSE);

    await stop('RINCON_123');

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${TEST_PROXY_URL}/api/v1/sonos/zones/RINCON_123/stop`);
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body as string)).toEqual({});
  });

  it('next(groupId) POSTs to /api/v1/sonos/zones/{groupId}/next with empty body', async () => {
    mockFetch.mockResolvedValueOnce(MOCK_OK_RESPONSE);

    await next('RINCON_123');

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${TEST_PROXY_URL}/api/v1/sonos/zones/RINCON_123/next`);
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body as string)).toEqual({});
  });

  it('previous(groupId) POSTs to /api/v1/sonos/zones/{groupId}/previous with empty body', async () => {
    mockFetch.mockResolvedValueOnce(MOCK_OK_RESPONSE);

    await previous('RINCON_123');

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${TEST_PROXY_URL}/api/v1/sonos/zones/RINCON_123/previous`);
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body as string)).toEqual({});
  });
});

describe('sonosProxy — volume/mute/seek command wrappers (haPut with typed body)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.HA_API_URL = TEST_PROXY_URL;
    process.env.HA_API_KEY = TEST_API_KEY;
  });

  afterEach(() => {
    delete process.env.HA_API_URL;
    delete process.env.HA_API_KEY;
  });

  it('setSpeakerVolume(uid, 50) PUTs to /api/v1/sonos/speakers/{uid}/volume with { volume: 50 }', async () => {
    mockFetch.mockResolvedValueOnce(MOCK_OK_RESPONSE);

    await setSpeakerVolume('RINCON_123', 50);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${TEST_PROXY_URL}/api/v1/sonos/speakers/RINCON_123/volume`);
    expect(options.method).toBe('PUT');
    expect(JSON.parse(options.body as string)).toEqual({ volume: 50 });
    expect((options.headers as Record<string, string>)['X-API-Key']).toBe(TEST_API_KEY);
    expect((options.headers as Record<string, string>)['Content-Type']).toBe('application/json');
  });

  it('setSpeakerMute(uid, true) PUTs to /api/v1/sonos/speakers/{uid}/mute with { mute: true }', async () => {
    mockFetch.mockResolvedValueOnce(MOCK_OK_RESPONSE);

    await setSpeakerMute('RINCON_123', true);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${TEST_PROXY_URL}/api/v1/sonos/speakers/RINCON_123/mute`);
    expect(options.method).toBe('PUT');
    expect(JSON.parse(options.body as string)).toEqual({ mute: true });
  });

  it('setZoneVolume(groupId, 75) PUTs to /api/v1/sonos/zones/{groupId}/volume with { volume: 75 }', async () => {
    mockFetch.mockResolvedValueOnce(MOCK_OK_RESPONSE);

    await setZoneVolume('RINCON_123', 75);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${TEST_PROXY_URL}/api/v1/sonos/zones/RINCON_123/volume`);
    expect(options.method).toBe('PUT');
    expect(JSON.parse(options.body as string)).toEqual({ volume: 75 });
  });

  it("seek(groupId, '00:01:30') PUTs to /api/v1/sonos/zones/{groupId}/seek with { position: '00:01:30' }", async () => {
    mockFetch.mockResolvedValueOnce(MOCK_OK_RESPONSE);

    await seek('RINCON_123', '00:01:30');

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${TEST_PROXY_URL}/api/v1/sonos/zones/RINCON_123/seek`);
    expect(options.method).toBe('PUT');
    expect(JSON.parse(options.body as string)).toEqual({ position: '00:01:30' });
  });
});
