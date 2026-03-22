/**
 * Tests for Netatmo Proxy Client
 *
 * Tests cover:
 * - X-API-Key header sent on every request (via haGet transport)
 * - Successful JSON parsing on 200
 * - RFC 9457 error detail extraction on 4xx
 * - ApiError SERVICE_UNAVAILABLE on 503
 * - ApiError TIMEOUT on AbortError
 * - ApiError on missing env vars
 * - Convenience wrapper endpoints
 */

import { getProxyHomestatus, getProxyHomesdata } from '@/lib/netatmo/netatmoProxy';
import { ApiError, ERROR_CODES } from '@/lib/core/apiErrors';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

const TEST_PROXY_URL = 'https://proxy.example.com';
const TEST_API_KEY = 'test-api-key-12345';

describe('haGet transport (via getProxyHomestatus)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.HA_API_URL = TEST_PROXY_URL;
    process.env.HA_API_KEY = TEST_API_KEY;
  });

  afterEach(() => {
    delete process.env.HA_API_URL;
    delete process.env.HA_API_KEY;
  });

  describe('request headers', () => {
    it('sends X-API-Key header on every request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: 'test' }),
      });

      await getProxyHomestatus();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [_url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect((options.headers as Record<string, string>)['X-API-Key']).toBe(TEST_API_KEY);
    });

    it('calls the correct full URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await getProxyHomestatus();

      const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${TEST_PROXY_URL}/api/v1/netatmo/homestatus`);
    });
  });

  describe('successful responses', () => {
    it('returns parsed JSON body on 200', async () => {
      const responseData = { rooms: [], data_freshness: 'LIVE' as const };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => responseData,
      });

      const result = await getProxyHomestatus();
      expect(result).toEqual(responseData);
    });
  });

  describe('error handling', () => {
    it('throws ApiError with RFC 9457 detail on 401', async () => {
      const problemDetail = {
        type: 'about:blank',
        title: 'Unauthorized',
        status: 401,
        detail: 'Not authenticated',
      };
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => problemDetail,
      });

      await expect(getProxyHomestatus()).rejects.toThrow(ApiError);

      // Verify error properties
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => problemDetail,
      });

      let caught: ApiError | undefined;
      try {
        await getProxyHomestatus();
      } catch (e) {
        caught = e as ApiError;
      }

      expect(caught).toBeInstanceOf(ApiError);
      expect(caught?.code).toBe(ERROR_CODES.UNAUTHORIZED);
      expect(caught?.message).toBe('Not authenticated');
    });

    it('throws ApiError SERVICE_UNAVAILABLE on 503', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        json: async () => ({ type: 'about:blank', title: 'Service Unavailable', status: 503, detail: 'Proxy unavailable' }),
      });

      let caught: ApiError | undefined;
      try {
        await getProxyHomestatus();
      } catch (e) {
        caught = e as ApiError;
      }

      expect(caught).toBeInstanceOf(ApiError);
      expect(caught?.code).toBe(ERROR_CODES.SERVICE_UNAVAILABLE);
    });

    it('throws ApiError EXTERNAL_API_ERROR on non-RFC9457 error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => { throw new Error('not JSON'); },
      });

      let caught: ApiError | undefined;
      try {
        await getProxyHomestatus();
      } catch (e) {
        caught = e as ApiError;
      }

      expect(caught).toBeInstanceOf(ApiError);
      expect(caught?.code).toBe(ERROR_CODES.EXTERNAL_API_ERROR);
    });

    it('throws ApiError TIMEOUT on AbortError', async () => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      mockFetch.mockRejectedValueOnce(abortError);

      let caught: ApiError | undefined;
      try {
        await getProxyHomestatus();
      } catch (e) {
        caught = e as ApiError;
      }

      expect(caught).toBeInstanceOf(ApiError);
      expect(caught?.code).toBe(ERROR_CODES.TIMEOUT);
    });

    it('throws ApiError when HA_API_URL is missing', async () => {
      delete process.env.HA_API_URL;

      let caught: ApiError | undefined;
      try {
        await getProxyHomestatus();
      } catch (e) {
        caught = e as ApiError;
      }

      expect(caught).toBeInstanceOf(ApiError);
      expect(caught?.code).toBe(ERROR_CODES.EXTERNAL_API_ERROR);
      expect(caught?.message).toContain('HA_API_URL');
    });

    it('throws ApiError when HA_API_KEY is missing', async () => {
      delete process.env.HA_API_KEY;

      let caught: ApiError | undefined;
      try {
        await getProxyHomestatus();
      } catch (e) {
        caught = e as ApiError;
      }

      expect(caught).toBeInstanceOf(ApiError);
      expect(caught?.code).toBe(ERROR_CODES.EXTERNAL_API_ERROR);
      expect(caught?.message).toContain('HA_API_KEY');
    });
  });
});

describe('getProxyHomestatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.HA_API_URL = TEST_PROXY_URL;
    process.env.HA_API_KEY = TEST_API_KEY;
  });

  afterEach(() => {
    delete process.env.HA_API_URL;
    delete process.env.HA_API_KEY;
  });

  it('calls the /api/v1/netatmo/homestatus endpoint', async () => {
    const responseData = { rooms: [], data_freshness: 'LIVE' as const };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => responseData,
    });

    await getProxyHomestatus();

    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${TEST_PROXY_URL}/api/v1/netatmo/homestatus`);
  });

  it('returns typed homestatus response', async () => {
    const responseData = {
      rooms: [
        {
          home_id: 'home1',
          room_id: 'room1',
          room_name: 'Living Room',
          temperature: 21.5,
          therm_setpoint_temperature: 20.0,
          heating_power_request: 0,
          timestamp: 1773330000,
        },
      ],
      data_freshness: 'LIVE' as const,
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => responseData,
    });

    const result = await getProxyHomestatus();
    expect(result.rooms).toHaveLength(1);
    expect(result.data_freshness).toBe('LIVE');
    expect(result.rooms[0]?.temperature).toBe(21.5);
  });
});

describe('getProxyHomesdata', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.HA_API_URL = TEST_PROXY_URL;
    process.env.HA_API_KEY = TEST_API_KEY;
  });

  afterEach(() => {
    delete process.env.HA_API_URL;
    delete process.env.HA_API_KEY;
  });

  it('calls the /api/v1/netatmo/homesdata endpoint', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ body: { homes: [] }, status: 'ok', time_exec: 0.1, time_server: 1773330200 }),
    });

    await getProxyHomesdata();

    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${TEST_PROXY_URL}/api/v1/netatmo/homesdata`);
  });

  it('returns typed homesdata response', async () => {
    const responseData = {
      body: { homes: [{ id: 'home1', name: 'My Home', rooms: [], modules: [], schedules: [] }] },
      status: 'ok',
      time_exec: 0.043,
      time_server: 1773330200,
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => responseData,
    });

    const result = await getProxyHomesdata();
    expect(result.body.homes).toHaveLength(1);
    expect(result.status).toBe('ok');
    expect(result.body.homes[0]?.id).toBe('home1');
  });
});
