/**
 * Tests for Netatmo Proxy Camera Convenience Wrappers
 *
 * Tests cover:
 * - getProxyCameraStatus    → GET /api/v1/netatmo/camera/status
 * - getProxyCameraStream    → GET /api/v1/netatmo/camera/{cameraId}/stream
 * - getProxyCameraSnapshot  → GET /api/v1/netatmo/camera/{cameraId}/snapshot
 * - proxySetCameraMonitoring → POST /api/v1/netatmo/camera/{cameraId}/monitoring
 * - getProxyCameraEvents    → GET /api/v1/netatmo/camera/events (with and without hours param)
 * - getProxyCameraEventSnapshot → raw binary fetch (returns Response, not JSON)
 */

import {
  getProxyCameraStatus,
  getProxyCameraStream,
  getProxyCameraSnapshot,
  proxySetCameraMonitoring,
  getProxyCameraEvents,
  getProxyCameraEventSnapshot,
} from '@/lib/netatmoProxy';

// Mock global fetch (used by all wrappers — both JSON wrappers via haGet/haPost
// and the binary wrapper directly)
const mockFetch = jest.fn();
global.fetch = mockFetch;

const TEST_PROXY_URL = 'https://proxy.example.com';
const TEST_API_KEY = 'test-api-key-12345';

// Helper to create a mock JSON response
function mockJsonResponse(data: unknown, status = 200): Partial<Response> {
  return {
    ok: true,
    status,
    json: async () => data,
  };
}

describe('Camera convenience wrappers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.HA_API_URL = TEST_PROXY_URL;
    process.env.HA_API_KEY = TEST_API_KEY;
  });

  afterEach(() => {
    delete process.env.HA_API_URL;
    delete process.env.HA_API_KEY;
  });

  // ---------------------------------------------------------------------------
  // getProxyCameraStatus
  // ---------------------------------------------------------------------------

  describe('getProxyCameraStatus', () => {
    it('calls GET /api/v1/netatmo/camera/status', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({ cameras: [], data_freshness: 'LIVE' }));

      await getProxyCameraStatus();

      const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${TEST_PROXY_URL}/api/v1/netatmo/camera/status`);
    });

    it('returns CameraStatusResponse', async () => {
      const responseData = {
        cameras: [
          {
            camera_id: '70:ee:50:aa:bb:cc',
            name: 'Ingresso',
            device_type: 'NOC',
            status: 'on',
            sd_status: 'on',
            alim_status: 'on',
            firmware: '174',
            is_local: true,
          },
        ],
        data_freshness: 'LIVE',
      };
      mockFetch.mockResolvedValueOnce(mockJsonResponse(responseData));

      const result = await getProxyCameraStatus();

      expect(result.cameras).toHaveLength(1);
      expect(result.cameras[0]?.camera_id).toBe('70:ee:50:aa:bb:cc');
      expect(result.data_freshness).toBe('LIVE');
    });
  });

  // ---------------------------------------------------------------------------
  // getProxyCameraStream
  // ---------------------------------------------------------------------------

  describe('getProxyCameraStream', () => {
    const cameraId = '70:ee:50:aa:bb:cc';

    it('calls GET /api/v1/netatmo/camera/{cameraId}/stream with correct path', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({
        camera_id: cameraId,
        vpn_streams: { high: 'https://h.m3u8', medium: 'https://m.m3u8', low: 'https://l.m3u8' },
        is_local: false,
      }));

      await getProxyCameraStream(cameraId);

      const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${TEST_PROXY_URL}/api/v1/netatmo/camera/${cameraId}/stream`);
    });

    it('returns CameraStreamResponse with local_streams when is_local=true', async () => {
      const responseData = {
        camera_id: cameraId,
        vpn_streams: {
          high: 'https://v.netatmo.com/high.m3u8',
          medium: 'https://v.netatmo.com/medium.m3u8',
          low: 'https://v.netatmo.com/low.m3u8',
        },
        is_local: true,
        local_streams: {
          high: 'http://192.168.1.1/high.m3u8',
          medium: 'http://192.168.1.1/medium.m3u8',
          low: 'http://192.168.1.1/low.m3u8',
        },
      };
      mockFetch.mockResolvedValueOnce(mockJsonResponse(responseData));

      const result = await getProxyCameraStream(cameraId);

      expect(result.camera_id).toBe(cameraId);
      expect(result.is_local).toBe(true);
      expect(result.local_streams?.high).toBe('http://192.168.1.1/high.m3u8');
    });
  });

  // ---------------------------------------------------------------------------
  // getProxyCameraSnapshot
  // ---------------------------------------------------------------------------

  describe('getProxyCameraSnapshot', () => {
    const cameraId = '70:ee:50:aa:bb:cc';

    it('calls GET /api/v1/netatmo/camera/{cameraId}/snapshot with correct path', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({
        camera_id: cameraId,
        snapshot_url: 'https://v.netatmo.com/snapshot_720.jpg',
      }));

      await getProxyCameraSnapshot(cameraId);

      const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${TEST_PROXY_URL}/api/v1/netatmo/camera/${cameraId}/snapshot`);
    });

    it('returns CameraSnapshotUrlResponse', async () => {
      const responseData = {
        camera_id: cameraId,
        snapshot_url: 'https://v.netatmo.com/snapshot_720.jpg',
      };
      mockFetch.mockResolvedValueOnce(mockJsonResponse(responseData));

      const result = await getProxyCameraSnapshot(cameraId);

      expect(result.camera_id).toBe(cameraId);
      expect(result.snapshot_url).toBe('https://v.netatmo.com/snapshot_720.jpg');
    });
  });

  // ---------------------------------------------------------------------------
  // proxySetCameraMonitoring
  // ---------------------------------------------------------------------------

  describe('proxySetCameraMonitoring', () => {
    const cameraId = '70:ee:50:aa:bb:cc';

    it('calls POST /api/v1/netatmo/camera/{cameraId}/monitoring with correct path', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({
        camera_id: cameraId,
        monitoring: 'on',
        status: 'applied',
      }));

      await proxySetCameraMonitoring(cameraId, { monitoring: 'on' });

      const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${TEST_PROXY_URL}/api/v1/netatmo/camera/${cameraId}/monitoring`);
      expect(options.method).toBe('POST');
    });

    it('sends monitoring field in request body', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({
        camera_id: cameraId,
        monitoring: 'off',
        status: 'applied',
      }));

      await proxySetCameraMonitoring(cameraId, { monitoring: 'off' });

      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(options.body as string) as Record<string, unknown>;
      expect(body['monitoring']).toBe('off');
    });

    it('returns SetMonitoringResponse', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({
        camera_id: cameraId,
        monitoring: 'off',
        status: 'applied',
      }));

      const result = await proxySetCameraMonitoring(cameraId, { monitoring: 'off' });

      expect(result.camera_id).toBe(cameraId);
      expect(result.monitoring).toBe('off');
      expect(result.status).toBe('applied');
    });
  });

  // ---------------------------------------------------------------------------
  // getProxyCameraEvents
  // ---------------------------------------------------------------------------

  describe('getProxyCameraEvents', () => {
    it('calls GET /api/v1/netatmo/camera/events without query param when no hours provided', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({ events: [], count: 0 }));

      await getProxyCameraEvents();

      const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${TEST_PROXY_URL}/api/v1/netatmo/camera/events`);
    });

    it('calls GET /api/v1/netatmo/camera/events?hours=N when hours is provided', async () => {
      mockFetch.mockResolvedValueOnce(mockJsonResponse({ events: [], count: 0 }));

      await getProxyCameraEvents(72);

      const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${TEST_PROXY_URL}/api/v1/netatmo/camera/events?hours=72`);
    });

    it('returns CameraEventsResponse', async () => {
      const responseData = {
        events: [
          {
            event_id: 'abc123',
            camera_id: '70:ee:50:aa:bb:cc',
            event_type: 'movement',
            timestamp: 1773330000,
            message: 'Movement detected',
            snapshot_url: 'https://netatmomedia.com/snap.jpg',
            person_id: null,
          },
        ],
        count: 1,
      };
      mockFetch.mockResolvedValueOnce(mockJsonResponse(responseData));

      const result = await getProxyCameraEvents(24);

      expect(result.count).toBe(1);
      expect(result.events[0]?.event_id).toBe('abc123');
      expect(result.events[0]?.event_type).toBe('movement');
    });
  });

  // ---------------------------------------------------------------------------
  // getProxyCameraEventSnapshot (binary endpoint — raw fetch)
  // ---------------------------------------------------------------------------

  describe('getProxyCameraEventSnapshot', () => {
    const eventId = 'abc123def456';

    it('calls fetch directly with correct URL and X-API-Key header', async () => {
      const mockResponse = { ok: true, status: 200 } as Response;
      mockFetch.mockResolvedValueOnce(mockResponse);

      await getProxyCameraEventSnapshot(eventId);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${TEST_PROXY_URL}/api/v1/netatmo/camera/events/${eventId}/snapshot`);
      expect((options.headers as Record<string, string>)['X-API-Key']).toBe(TEST_API_KEY);
    });

    it('returns the raw Response object (not parsed JSON)', async () => {
      const mockResponse = { ok: true, status: 200, headers: new Headers() } as Response;
      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await getProxyCameraEventSnapshot(eventId);

      // Must return the Response itself, not parsed data
      expect(result).toBe(mockResponse);
    });

    it('uses a GET request (no method specified defaults to GET)', async () => {
      const mockResponse = { ok: true, status: 200 } as Response;
      mockFetch.mockResolvedValueOnce(mockResponse);

      await getProxyCameraEventSnapshot(eventId);

      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      // No 'method' specified means GET (fetch default)
      expect(options.method).toBeUndefined();
    });
  });
});
