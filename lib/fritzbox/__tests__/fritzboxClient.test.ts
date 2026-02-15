/**
 * Tests for FritzBoxClient
 *
 * Tests JWT authentication with auto-login, response transformation,
 * and error handling for HomeAssistant Network API
 */

import { ERROR_CODES } from '@/lib/core/apiErrors';

const mockEnv = {
  HOMEASSISTANT_API_URL: 'https://pdupun8zpr7exw43.myfritz.net',
  HOMEASSISTANT_USER: 'admin',
  HOMEASSISTANT_PASSWORD: 'secret123',
};

const MOCK_JWT = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbiJ9.mock';

describe('FritzBoxClient', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let mockFetch: jest.Mock;

  beforeEach(() => {
    originalEnv = process.env;
    mockFetch = jest.fn();
    global.fetch = mockFetch;
    jest.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  /** Helper: mock login + data call sequence */
  function mockLoginThenData(dataResponse: unknown) {
    mockFetch
      // First call: login
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ access_token: MOCK_JWT, token_type: 'bearer' }),
      })
      // Second call: data endpoint
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => dataResponse,
      });
  }

  describe('with valid configuration', () => {
    beforeEach(() => {
      process.env.HOMEASSISTANT_API_URL = mockEnv.HOMEASSISTANT_API_URL;
      process.env.HOMEASSISTANT_USER = mockEnv.HOMEASSISTANT_USER;
      process.env.HOMEASSISTANT_PASSWORD = mockEnv.HOMEASSISTANT_PASSWORD;
    });

    it('ping() calls /health without auth (no login)', async () => {
      const { fritzboxClient } = await import('../fritzboxClient');

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ status: 'ok', cache_age_seconds: 25, providers: { fritzbox: 'ok' } }),
      });

      await fritzboxClient.ping();

      // Only 1 fetch (no login call)
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        `${mockEnv.HOMEASSISTANT_API_URL}/health`,
        expect.objectContaining({ headers: {} })
      );
    });

    it('getDevices() logs in with JWT then fetches /api/v1/devices', async () => {
      const { fritzboxClient } = await import('../fritzboxClient');

      mockLoginThenData({
        devices: [{ ip: '192.168.178.25', name: 'iPhone', mac: 'AA:BB:CC:DD:EE:FF', status: 1 }],
        is_stale: false,
        fetched_at: '2026-02-13T14:00:00Z',
      });

      await fritzboxClient.getDevices();

      // 2 calls: login + data
      expect(mockFetch).toHaveBeenCalledTimes(2);
      // Login call
      expect(mockFetch.mock.calls[0]?.[0]).toBe(`${mockEnv.HOMEASSISTANT_API_URL}/auth/login`);
      // Data call with Bearer token
      expect(mockFetch.mock.calls[1]?.[0]).toBe(`${mockEnv.HOMEASSISTANT_API_URL}/api/v1/devices`);
      expect(mockFetch.mock.calls[1]?.[1]?.headers).toEqual(
        expect.objectContaining({ Authorization: `Bearer ${MOCK_JWT}` })
      );
    });

    it('getDevices() transforms response (status→active, mac→id)', async () => {
      const { fritzboxClient } = await import('../fritzboxClient');

      mockLoginThenData({
        devices: [
          { ip: '192.168.178.25', name: 'iPhone', mac: 'AA:BB:CC:DD:EE:FF', status: 1 },
          { ip: '192.168.178.30', name: 'Printer', mac: '11:22:33:44:55:66', status: 0 },
        ],
        is_stale: false,
        fetched_at: '2026-02-13T14:00:00Z',
      });

      const result = await fritzboxClient.getDevices();

      expect(result).toEqual([
        { id: 'AA:BB:CC:DD:EE:FF', name: 'iPhone', ip: '192.168.178.25', mac: 'AA:BB:CC:DD:EE:FF', active: true },
        { id: '11:22:33:44:55:66', name: 'Printer', ip: '192.168.178.30', mac: '11:22:33:44:55:66', active: false },
      ]);
    });

    it('getBandwidth() transforms bps to Mbps', async () => {
      const { fritzboxClient } = await import('../fritzboxClient');

      mockLoginThenData({
        upstream_bps: 50_000_000,
        downstream_bps: 250_000_000,
        bytes_sent: 123,
        bytes_received: 456,
        is_stale: false,
        fetched_at: '2026-02-13T14:00:00Z',
      });

      const result = await fritzboxClient.getBandwidth();

      expect(result.download).toBe(250);
      expect(result.upload).toBe(50);
      expect(result.timestamp).toBe(new Date('2026-02-13T14:00:00Z').getTime());
    });

    it('getWanStatus() transforms API response', async () => {
      const { fritzboxClient } = await import('../fritzboxClient');

      mockLoginThenData({
        external_ip: '93.219.123.45',
        is_connected: true,
        is_linked: true,
        uptime: 345678,
        max_upstream_bps: 50_000_000,
        max_downstream_bps: 250_000_000,
        is_stale: false,
        fetched_at: '2026-02-13T14:00:00Z',
      });

      const result = await fritzboxClient.getWanStatus();

      expect(result).toEqual({
        connected: true,
        uptime: 345678,
        externalIp: '93.219.123.45',
        linkSpeed: 250,
        timestamp: new Date('2026-02-13T14:00:00Z').getTime(),
      });
    });

    it('caches JWT token across calls', async () => {
      const { fritzboxClient } = await import('../fritzboxClient');

      // Login + first data call
      mockLoginThenData({
        upstream_bps: 100, downstream_bps: 200, is_stale: false, fetched_at: '2026-02-13T14:00:00Z',
      });

      await fritzboxClient.getBandwidth();
      expect(mockFetch).toHaveBeenCalledTimes(2); // login + data

      // Second call should reuse cached token (no login)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          external_ip: '1.2.3.4', is_connected: true, is_linked: true,
          uptime: 100, max_downstream_bps: 100, max_upstream_bps: 50,
          is_stale: false, fetched_at: '2026-02-13T14:00:00Z',
        }),
      });

      await fritzboxClient.getWanStatus();
      expect(mockFetch).toHaveBeenCalledTimes(3); // no extra login
    });

    it('throws FRITZBOX_TIMEOUT on 503 status', async () => {
      const { fritzboxClient } = await import('../fritzboxClient');

      mockFetch
        .mockResolvedValueOnce({
          ok: true, status: 200,
          json: async () => ({ access_token: MOCK_JWT, token_type: 'bearer' }),
        })
        .mockResolvedValueOnce({
          ok: false, status: 503, statusText: 'Service Unavailable',
        });

      await expect(fritzboxClient.getDevices()).rejects.toMatchObject({
        code: ERROR_CODES.FRITZBOX_TIMEOUT,
      });
    });

    it('throws FRITZBOX_TIMEOUT on request timeout', async () => {
      const { fritzboxClient } = await import('../fritzboxClient');

      mockFetch.mockResolvedValueOnce({
        ok: true, status: 200,
        json: async () => ({ access_token: MOCK_JWT, token_type: 'bearer' }),
      });

      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      mockFetch.mockRejectedValueOnce(abortError);

      await expect(fritzboxClient.getDevices()).rejects.toMatchObject({
        code: ERROR_CODES.FRITZBOX_TIMEOUT,
      });
    });

    it('throws RATE_LIMITED on 429 status', async () => {
      const { fritzboxClient } = await import('../fritzboxClient');

      mockFetch
        .mockResolvedValueOnce({
          ok: true, status: 200,
          json: async () => ({ access_token: MOCK_JWT, token_type: 'bearer' }),
        })
        .mockResolvedValueOnce({
          ok: false, status: 429, statusText: 'Too Many Requests',
        });

      await expect(fritzboxClient.getBandwidth()).rejects.toMatchObject({
        code: ERROR_CODES.RATE_LIMITED,
      });
    });
  });

  describe('with missing configuration', () => {
    it('throws FRITZBOX_NOT_CONFIGURED when API_URL missing', async () => {
      delete process.env.HOMEASSISTANT_API_URL;
      delete process.env.HOMEASSISTANT_USER;
      delete process.env.HOMEASSISTANT_PASSWORD;

      await jest.isolateModules(async () => {
        const { fritzboxClient } = await import('../fritzboxClient');
        await expect(fritzboxClient.ping()).rejects.toMatchObject({
          code: ERROR_CODES.FRITZBOX_NOT_CONFIGURED,
        });
      });
    });

    it('throws FRITZBOX_NOT_CONFIGURED when credentials missing for auth endpoint', async () => {
      process.env.HOMEASSISTANT_API_URL = mockEnv.HOMEASSISTANT_API_URL;
      delete process.env.HOMEASSISTANT_USER;
      delete process.env.HOMEASSISTANT_PASSWORD;

      await jest.isolateModules(async () => {
        const { fritzboxClient } = await import('../fritzboxClient');
        await expect(fritzboxClient.getDevices()).rejects.toMatchObject({
          code: ERROR_CODES.FRITZBOX_NOT_CONFIGURED,
        });
      });
    });

    it('allows ping() with only API_URL (no credentials needed)', async () => {
      process.env.HOMEASSISTANT_API_URL = mockEnv.HOMEASSISTANT_API_URL;
      delete process.env.HOMEASSISTANT_USER;
      delete process.env.HOMEASSISTANT_PASSWORD;

      await jest.isolateModules(async () => {
        const { fritzboxClient } = await import('../fritzboxClient');
        mockFetch.mockResolvedValue({
          ok: true, status: 200,
          json: async () => ({ status: 'ok', cache_age_seconds: null, providers: {} }),
        });
        const result = await fritzboxClient.ping();
        expect(result).toBeDefined();
      });
    });
  });
});
