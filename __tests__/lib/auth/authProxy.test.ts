/**
 * @jest-environment node
 *
 * Tests for lib/auth/authProxy.ts
 *
 * Covers: login, createApiKey, listApiKeys, deleteApiKey
 */

import { login, createApiKey, listApiKeys, deleteApiKey } from '@/lib/auth/authProxy';
import { ApiError, ERROR_CODES } from '@/lib/core/apiErrors';

// =============================================================================
// MOCK SETUP
// =============================================================================

const mockFetch = jest.fn();
global.fetch = mockFetch;

function mockOkResponse(body: unknown, status = 200): Response {
  return {
    ok: true,
    status,
    statusText: 'OK',
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as unknown as Response;
}

function mockErrorResponse(status: number, body?: unknown): Response {
  return {
    ok: false,
    status,
    statusText: 'Error',
    json: () => Promise.resolve(body ?? { detail: `Error ${status}`, status }),
    text: () => Promise.resolve(JSON.stringify(body ?? {})),
  } as unknown as Response;
}

// =============================================================================
// TESTS
// =============================================================================

describe('authProxy', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, HA_API_URL: 'http://localhost:8000' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  // ---------------------------------------------------------------------------
  // login()
  // ---------------------------------------------------------------------------

  describe('login()', () => {
    it('Test 1: sends POST to ${HA_API_URL}/auth/login with form-encoded body', async () => {
      const token = { access_token: 'eyJhbGci...', token_type: 'bearer' };
      mockFetch.mockResolvedValueOnce(mockOkResponse(token));

      await login('admin', 'secret');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit & { body: URLSearchParams }];
      expect(url).toBe('http://localhost:8000/auth/login');
      expect(options.method).toBe('POST');
      const headers = options.headers as Record<string, string>;
      expect(headers['Content-Type']).toBe('application/x-www-form-urlencoded');
      // body should be URLSearchParams
      expect(options.body).toBeInstanceOf(URLSearchParams);
      const params = options.body as unknown as URLSearchParams;
      expect(params.get('username')).toBe('admin');
      expect(params.get('password')).toBe('secret');
    });

    it('Test 2: returns Token object { access_token, token_type } on 200 response', async () => {
      const token = { access_token: 'eyJhbGci...', token_type: 'bearer' };
      mockFetch.mockResolvedValueOnce(mockOkResponse(token));

      const result = await login('admin', 'secret');

      expect(result).toEqual(token);
      expect(result.access_token).toBe('eyJhbGci...');
      expect(result.token_type).toBe('bearer');
    });

    it('Test 3: throws ApiError(UNAUTHORIZED) on 401 response', async () => {
      mockFetch.mockResolvedValue(
        mockErrorResponse(401, { detail: 'Invalid username or password', status: 401 })
      );

      await expect(login('admin', 'wrong')).rejects.toThrow(ApiError);
      await expect(login('admin', 'wrong')).rejects.toMatchObject({
        code: ERROR_CODES.UNAUTHORIZED,
      });
    });

    it('Test 4: throws ApiError(EXTERNAL_API_ERROR) when HA_API_URL is not set', async () => {
      delete process.env.HA_API_URL;

      await expect(login('admin', 'secret')).rejects.toThrow(ApiError);
      await expect(login('admin', 'secret')).rejects.toMatchObject({
        code: ERROR_CODES.EXTERNAL_API_ERROR,
      });
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // createApiKey()
  // ---------------------------------------------------------------------------

  describe('createApiKey()', () => {
    it('Test 5: sends POST to ${HA_API_URL}/auth/api-keys with Authorization: Bearer header and JSON body { name }', async () => {
      const apiKeyResponse = {
        id: 1,
        name: 'Test Key',
        api_key: 'ha_live_abc123',
        created_at: '2026-04-08T00:00:00Z',
      };
      mockFetch.mockResolvedValueOnce(mockOkResponse(apiKeyResponse, 201));

      await createApiKey('my-bearer-token', 'Test Key');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe('http://localhost:8000/auth/api-keys');
      expect(options.method).toBe('POST');
      const headers = options.headers as Record<string, string>;
      expect(headers['Authorization']).toBe('Bearer my-bearer-token');
      expect(headers['Content-Type']).toBe('application/json');
      expect(JSON.parse(options.body as string)).toEqual({ name: 'Test Key' });
    });

    it('Test 6: returns APIKeyResponse on 201 response', async () => {
      const apiKeyResponse = {
        id: 1,
        name: 'Test Key',
        api_key: 'ha_live_abc123',
        created_at: '2026-04-08T00:00:00Z',
      };
      mockFetch.mockResolvedValueOnce(mockOkResponse(apiKeyResponse, 201));

      const result = await createApiKey('my-bearer-token', 'Test Key');

      expect(result).toEqual(apiKeyResponse);
      expect(result.id).toBe(1);
      expect(result.api_key).toBe('ha_live_abc123');
    });
  });

  // ---------------------------------------------------------------------------
  // listApiKeys()
  // ---------------------------------------------------------------------------

  describe('listApiKeys()', () => {
    it('Test 7: sends GET to ${HA_API_URL}/auth/api-keys with Authorization: Bearer header', async () => {
      const listResponse = {
        keys: [],
        count: 0,
      };
      mockFetch.mockResolvedValueOnce(mockOkResponse(listResponse));

      await listApiKeys('my-bearer-token');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe('http://localhost:8000/auth/api-keys');
      expect(options.method).toBeUndefined(); // GET has no method
      const headers = options.headers as Record<string, string>;
      expect(headers['Authorization']).toBe('Bearer my-bearer-token');
    });

    it('Test 8: returns APIKeyListResponse on 200 response', async () => {
      const listResponse = {
        keys: [
          {
            id: 1,
            name: 'Test Key',
            created_at: '2026-04-08T00:00:00Z',
            last_used_at: null,
            is_active: true,
          },
        ],
        count: 1,
      };
      mockFetch.mockResolvedValueOnce(mockOkResponse(listResponse));

      const result = await listApiKeys('my-bearer-token');

      expect(result).toEqual(listResponse);
      expect(result.count).toBe(1);
      expect(result.keys).toHaveLength(1);
    });
  });

  // ---------------------------------------------------------------------------
  // deleteApiKey()
  // ---------------------------------------------------------------------------

  describe('deleteApiKey()', () => {
    it('Test 9: sends DELETE to ${HA_API_URL}/auth/api-keys/{keyId} with Authorization: Bearer header', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        statusText: 'No Content',
        json: () => Promise.reject(new Error('No body')),
      } as unknown as Response);

      await deleteApiKey('my-bearer-token', 42);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe('http://localhost:8000/auth/api-keys/42');
      expect(options.method).toBe('DELETE');
      const headers = options.headers as Record<string, string>;
      expect(headers['Authorization']).toBe('Bearer my-bearer-token');
    });

    it('Test 10: throws ApiError(NOT_FOUND) on 404 response', async () => {
      mockFetch.mockResolvedValue(
        mockErrorResponse(404, { detail: 'API key not found', status: 404 })
      );

      await expect(deleteApiKey('my-bearer-token', 999)).rejects.toThrow(ApiError);
      await expect(deleteApiKey('my-bearer-token', 999)).rejects.toMatchObject({
        code: ERROR_CODES.NOT_FOUND,
      });
    });

    it('Test 11: resolves void on 204 response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        statusText: 'No Content',
        json: () => Promise.reject(new Error('No body')),
      } as unknown as Response);

      const result = await deleteApiKey('my-bearer-token', 1);

      expect(result).toBeUndefined();
    });
  });
});
