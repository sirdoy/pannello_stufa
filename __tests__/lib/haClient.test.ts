/**
 * Tests for Shared HomeAssistant Proxy Client
 *
 * Tests cover:
 * - X-API-Key header sent on every request (GET and POST)
 * - Successful JSON parsing on 200
 * - RFC 9457 error detail extraction on 4xx/5xx
 * - ApiError UNAUTHORIZED on 401
 * - ApiError SERVICE_UNAVAILABLE on 503
 * - ApiError RATE_LIMITED on 429
 * - ApiError EXTERNAL_API_ERROR on other non-ok responses
 * - ApiError TIMEOUT on AbortError
 * - ApiError on missing env vars (HA_API_URL, HA_API_KEY)
 * - ApiError on network errors
 * - haPost sends JSON body with Content-Type: application/json
 */

import { haGet, haPost } from '@/lib/haClient';
import { ApiError, ERROR_CODES } from '@/lib/core/apiErrors';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

const TEST_HA_URL = 'https://ha.example.com';
const TEST_API_KEY = 'test-key-123';

// ─────────────────────────────────────────────────────────────────────────────
// haGet
// ─────────────────────────────────────────────────────────────────────────────

describe('haGet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.HA_API_URL = TEST_HA_URL;
    process.env.HA_API_KEY = TEST_API_KEY;
  });

  afterEach(() => {
    delete process.env.HA_API_URL;
    delete process.env.HA_API_KEY;
  });

  // ---------------------------------------------------------------------------
  // Auth headers
  // ---------------------------------------------------------------------------

  it('sends X-API-Key header from HA_API_KEY env var', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ result: 'ok' }),
    });

    await haGet('/api/test');

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [_url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect((options.headers as Record<string, string>)['X-API-Key']).toBe(TEST_API_KEY);
  });

  it('builds URL from HA_API_URL + endpoint path', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    await haGet('/api/data');

    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${TEST_HA_URL}/api/data`);
  });

  // ---------------------------------------------------------------------------
  // Successful responses
  // ---------------------------------------------------------------------------

  it('returns parsed JSON response typed as T on 200', async () => {
    const responseData = { devices: [{ id: 'dev1', name: 'Sensor' }] };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => responseData,
    });

    const result = await haGet<typeof responseData>('/api/devices');
    expect(result).toEqual(responseData);
  });

  // ---------------------------------------------------------------------------
  // Missing env var errors
  // ---------------------------------------------------------------------------

  it('throws ApiError EXTERNAL_API_ERROR when HA_API_URL is missing', async () => {
    delete process.env.HA_API_URL;

    let caught: ApiError | undefined;
    try {
      await haGet('/api/test');
    } catch (e) {
      caught = e as ApiError;
    }

    expect(caught).toBeInstanceOf(ApiError);
    expect(caught?.code).toBe(ERROR_CODES.EXTERNAL_API_ERROR);
    expect(caught?.message).toContain('HA_API_URL');
  });

  it('throws ApiError EXTERNAL_API_ERROR when HA_API_KEY is missing', async () => {
    delete process.env.HA_API_KEY;

    let caught: ApiError | undefined;
    try {
      await haGet('/api/test');
    } catch (e) {
      caught = e as ApiError;
    }

    expect(caught).toBeInstanceOf(ApiError);
    expect(caught?.code).toBe(ERROR_CODES.EXTERNAL_API_ERROR);
    expect(caught?.message).toContain('HA_API_KEY');
  });

  // ---------------------------------------------------------------------------
  // HTTP error status mapping
  // ---------------------------------------------------------------------------

  it('throws ApiError UNAUTHORIZED on 401 response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({
        type: 'about:blank',
        title: 'Unauthorized',
        status: 401,
        detail: 'Invalid API key',
      }),
    });

    let caught: ApiError | undefined;
    try {
      await haGet('/api/test');
    } catch (e) {
      caught = e as ApiError;
    }

    expect(caught).toBeInstanceOf(ApiError);
    expect(caught?.code).toBe(ERROR_CODES.UNAUTHORIZED);
    expect(caught?.message).toBe('Invalid API key');
  });

  it('throws ApiError SERVICE_UNAVAILABLE on 503 response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
      json: async () => ({
        type: 'about:blank',
        title: 'Service Unavailable',
        status: 503,
        detail: 'HA proxy unavailable',
      }),
    });

    let caught: ApiError | undefined;
    try {
      await haGet('/api/test');
    } catch (e) {
      caught = e as ApiError;
    }

    expect(caught).toBeInstanceOf(ApiError);
    expect(caught?.code).toBe(ERROR_CODES.SERVICE_UNAVAILABLE);
  });

  it('throws ApiError RATE_LIMITED on 429 response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
      json: async () => ({
        type: 'about:blank',
        title: 'Too Many Requests',
        status: 429,
        detail: 'Rate limit exceeded',
      }),
    });

    let caught: ApiError | undefined;
    try {
      await haGet('/api/test');
    } catch (e) {
      caught = e as ApiError;
    }

    expect(caught).toBeInstanceOf(ApiError);
    expect(caught?.code).toBe(ERROR_CODES.RATE_LIMITED);
  });

  it('throws ApiError EXTERNAL_API_ERROR on other non-ok responses', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => ({ type: 'about:blank', title: 'Error', status: 500, detail: 'Server crash' }),
    });

    let caught: ApiError | undefined;
    try {
      await haGet('/api/test');
    } catch (e) {
      caught = e as ApiError;
    }

    expect(caught).toBeInstanceOf(ApiError);
    expect(caught?.code).toBe(ERROR_CODES.EXTERNAL_API_ERROR);
  });

  it('parses RFC 9457 detail field from error response body', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: async () => ({
        type: 'about:blank',
        title: 'Bad Request',
        status: 400,
        detail: 'Invalid parameter',
      }),
    });

    let caught: ApiError | undefined;
    try {
      await haGet('/api/test');
    } catch (e) {
      caught = e as ApiError;
    }

    expect(caught).toBeInstanceOf(ApiError);
    expect(caught?.message).toBe('Invalid parameter');
  });

  // ---------------------------------------------------------------------------
  // Timeout and network errors
  // ---------------------------------------------------------------------------

  it('throws ApiError TIMEOUT on AbortError (timeout exceeded)', async () => {
    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';
    mockFetch.mockRejectedValueOnce(abortError);

    let caught: ApiError | undefined;
    try {
      await haGet('/api/test', { timeout: 100 });
    } catch (e) {
      caught = e as ApiError;
    }

    expect(caught).toBeInstanceOf(ApiError);
    expect(caught?.code).toBe(ERROR_CODES.TIMEOUT);
  });

  it('throws ApiError EXTERNAL_API_ERROR on unknown network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network failure'));

    let caught: ApiError | undefined;
    try {
      await haGet('/api/test');
    } catch (e) {
      caught = e as ApiError;
    }

    expect(caught).toBeInstanceOf(ApiError);
    expect(caught?.code).toBe(ERROR_CODES.EXTERNAL_API_ERROR);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// haPost
// ─────────────────────────────────────────────────────────────────────────────

describe('haPost', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.HA_API_URL = TEST_HA_URL;
    process.env.HA_API_KEY = TEST_API_KEY;
  });

  afterEach(() => {
    delete process.env.HA_API_URL;
    delete process.env.HA_API_KEY;
  });

  it('sends X-API-Key header and Content-Type: application/json', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok' }),
    });

    await haPost('/api/command', { action: 'turn_on' });

    const [_url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    const headers = options.headers as Record<string, string>;
    expect(headers['X-API-Key']).toBe(TEST_API_KEY);
    expect(headers['Content-Type']).toBe('application/json');
  });

  it('sends JSON.stringify(body) as request body', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok' }),
    });

    const body = { action: 'turn_on', entity_id: 'light.living' };
    await haPost('/api/command', body);

    const [_url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(options.body).toBe(JSON.stringify(body));
    expect(options.method).toBe('POST');
  });

  it('returns parsed JSON response on 200', async () => {
    const responseData = { status: 'applied', result: 'success' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => responseData,
    });

    const result = await haPost<typeof responseData>('/api/command', { action: 'do' });
    expect(result).toEqual(responseData);
  });

  it('throws ApiError UNAUTHORIZED on 401 response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({ type: 'about:blank', title: 'Unauthorized', status: 401, detail: 'Invalid key' }),
    });

    let caught: ApiError | undefined;
    try {
      await haPost('/api/command', {});
    } catch (e) {
      caught = e as ApiError;
    }

    expect(caught).toBeInstanceOf(ApiError);
    expect(caught?.code).toBe(ERROR_CODES.UNAUTHORIZED);
  });

  it('throws ApiError TIMEOUT on AbortError (timeout exceeded)', async () => {
    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';
    mockFetch.mockRejectedValueOnce(abortError);

    let caught: ApiError | undefined;
    try {
      await haPost('/api/command', {}, { timeout: 100 });
    } catch (e) {
      caught = e as ApiError;
    }

    expect(caught).toBeInstanceOf(ApiError);
    expect(caught?.code).toBe(ERROR_CODES.TIMEOUT);
  });

  it('throws ApiError EXTERNAL_API_ERROR when HA_API_URL is missing', async () => {
    delete process.env.HA_API_URL;

    let caught: ApiError | undefined;
    try {
      await haPost('/api/command', {});
    } catch (e) {
      caught = e as ApiError;
    }

    expect(caught).toBeInstanceOf(ApiError);
    expect(caught?.code).toBe(ERROR_CODES.EXTERNAL_API_ERROR);
    expect(caught?.message).toContain('HA_API_URL');
  });
});
