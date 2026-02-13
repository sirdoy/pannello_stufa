/**
 * Tests for FritzBoxClient
 */

import { ApiError, ERROR_CODES } from '@/lib/core/apiErrors';

// Mock environment variables before importing fritzboxClient
const mockEnv = {
  FRITZBOX_URL: 'http://fritz.box',
  FRITZBOX_USER: 'admin',
  FRITZBOX_PASSWORD: 'secret123',
};

describe('FritzBoxClient', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let mockFetch: jest.Mock;

  beforeEach(() => {
    // Save original env
    originalEnv = process.env;

    // Mock fetch
    mockFetch = jest.fn();
    global.fetch = mockFetch;

    // Clear module cache to re-read env vars
    jest.resetModules();
  });

  afterEach(() => {
    // Restore original env
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  describe('with valid configuration', () => {
    beforeEach(() => {
      // Set env vars
      process.env.FRITZBOX_URL = mockEnv.FRITZBOX_URL;
      process.env.FRITZBOX_USER = mockEnv.FRITZBOX_USER;
      process.env.FRITZBOX_PASSWORD = mockEnv.FRITZBOX_PASSWORD;
    });

    it('ping() calls /api/v1/health with 10s timeout', async () => {
      // Dynamically import after env is set
      const { fritzboxClient } = await import('../fritzboxClient');

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ status: 'ok' }),
      });

      await fritzboxClient.ping();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://fritz.box/api/v1/health',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expect.stringMatching(/^Basic /),
          }),
          signal: expect.any(AbortSignal),
        })
      );
    });

    it('getDevices() calls /api/v1/devices with Basic Auth', async () => {
      const { fritzboxClient } = await import('../fritzboxClient');

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ devices: [] }),
      });

      await fritzboxClient.getDevices();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://fritz.box/api/v1/devices',
        expect.objectContaining({
          headers: {
            Authorization: 'Basic YWRtaW46c2VjcmV0MTIz', // base64(admin:secret123)
          },
        })
      );
    });

    it('throws TR064_NOT_ENABLED on 403 status', async () => {
      const { fritzboxClient } = await import('../fritzboxClient');

      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
      });

      await expect(fritzboxClient.ping()).rejects.toMatchObject({
        code: ERROR_CODES.TR064_NOT_ENABLED,
        details: {
          setupGuideUrl: '/docs/fritzbox-setup',
          tr064Enabled: false,
        },
      });
    });

    it('throws EXTERNAL_API_ERROR on non-ok status (not 403)', async () => {
      const { fritzboxClient } = await import('../fritzboxClient');

      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(fritzboxClient.getDevices()).rejects.toMatchObject({
        code: ERROR_CODES.EXTERNAL_API_ERROR,
        message: expect.stringContaining('Internal Server Error'),
      });
    });

    it('throws FRITZBOX_TIMEOUT on request timeout', async () => {
      const { fritzboxClient } = await import('../fritzboxClient');

      // Mock AbortError
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      mockFetch.mockRejectedValue(abortError);

      await expect(fritzboxClient.ping()).rejects.toMatchObject({
        code: ERROR_CODES.FRITZBOX_TIMEOUT,
      });
    });
  });

  describe('with missing configuration', () => {
    it('throws FRITZBOX_NOT_CONFIGURED when env vars missing', async () => {
      // Don't set any env vars
      delete process.env.FRITZBOX_URL;
      delete process.env.FRITZBOX_USER;
      delete process.env.FRITZBOX_PASSWORD;

      // Use jest.isolateModules to get fresh import with missing env
      await jest.isolateModules(async () => {
        const { fritzboxClient } = await import('../fritzboxClient');

        await expect(fritzboxClient.ping()).rejects.toMatchObject({
          code: ERROR_CODES.FRITZBOX_NOT_CONFIGURED,
        });
      });
    });
  });
});
