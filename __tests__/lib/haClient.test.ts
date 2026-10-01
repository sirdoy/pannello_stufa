/**
 * Tests for Shared HomeAssistant Proxy Client
 *
 * Tests cover:
 * - X-API-Key header sent on every request (GET and POST)
 * - Successful JSON parsing on 200
 * - RFC 9457 error detail extraction on 4xx/5xx (extension members kept in details)
 * - 409 maintenance_required → ApiError MAINTENANCE_REQUIRED
 * - ApiError UNAUTHORIZED on 401
 * - ApiError SERVICE_UNAVAILABLE on 503
 * - ApiError RATE_LIMITED on 429
 * - ApiError EXTERNAL_API_ERROR on other non-ok responses
 * - ApiError TIMEOUT on AbortError
 * - ApiError on missing env vars (HA_API_URL, HA_API_KEY)
 * - ApiError on network errors
 * - haPost sends JSON body with Content-Type: application/json
 * - Default timeouts (GET 8 s, mutations 15 s)
 * - Circuit breaker: fail fast after consecutive transport failures
 */

import { haGet, haPost, haPatch, haDelete, resetHaCircuit } from '@/lib/haClient';
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
    resetHaCircuit();
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

  it('adds Authorization: Bearer only when a user token is given', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });

    await haGet('/auth/users', { bearer: 'user-token' });
    await haPatch('/auth/users/1', { role: 'user' }, { bearer: 'user-token' });
    await haGet('/api/test');

    const headersOf = (i: number) =>
      (mockFetch.mock.calls[i] as [string, RequestInit])[1].headers as Record<string, string>;
    expect(headersOf(0)).toMatchObject({ 'X-API-Key': TEST_API_KEY, Authorization: 'Bearer user-token' });
    expect(headersOf(1)).toMatchObject({ Authorization: 'Bearer user-token', 'Content-Type': 'application/json' });
    expect(headersOf(2).Authorization).toBeUndefined();
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

  it.each([
    [404, 'Not Found', ERROR_CODES.NOT_FOUND],
    [403, 'Forbidden', ERROR_CODES.FORBIDDEN],
    [422, 'Unprocessable Entity', ERROR_CODES.VALIDATION_ERROR],
    [400, 'Bad Request', ERROR_CODES.VALIDATION_ERROR],
  ])('keeps backend client error %s (%s) instead of mapping it to 502', async (status, title, code) => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status,
      statusText: title,
      json: async () => ({ type: 'about:blank', title, status, detail: 'Room 7 not found' }),
    });

    let caught: ApiError | undefined;
    try {
      await haGet('/api/test');
    } catch (e) {
      caught = e as ApiError;
    }

    expect(caught).toBeInstanceOf(ApiError);
    expect(caught?.code).toBe(code);
    expect(caught?.status).toBe(status);
    expect(caught?.message).toBe('Room 7 not found');
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
    resetHaCircuit();
    process.env.HA_API_URL = TEST_HA_URL;
    process.env.HA_API_KEY = TEST_API_KEY;
  });

  afterEach(() => {
    delete process.env.HA_API_URL;
    delete process.env.HA_API_KEY;
  });

  it('maps 409 maintenance_required to MAINTENANCE_REQUIRED, keeping extensions in details', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 409,
      statusText: 'Conflict',
      json: async () => ({
        type: 'about:blank',
        title: 'Conflict',
        status: 409,
        detail: 'Cleaning is due: confirm the cleaning before igniting the stove.',
        error: 'maintenance_required',
        command: 'ignite',
      }),
    });

    const err = await haPost('/api/v1/thermorossi/commands/ignite', {}).catch((e: unknown) => e);

    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).code).toBe(ERROR_CODES.MAINTENANCE_REQUIRED);
    expect((err as ApiError).status).toBe(409);
    expect((err as ApiError).details).toEqual({ reason: 'maintenance_required', command: 'ignite' });
  });

  it('keeps 409 state_conflict as CONFLICT with the error extension as details.reason', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 409,
      statusText: 'Conflict',
      json: async () => ({
        type: 'about:blank', title: 'Conflict', status: 409, detail: 'Stove is not off', error: 'state_conflict',
      }),
    });

    const err = await haPost('/api/v1/thermorossi/commands/ignite', {}).catch((e: unknown) => e);

    expect((err as ApiError).code).toBe(ERROR_CODES.CONFLICT);
    expect((err as ApiError).message).toBe('Stove is not off');
    expect((err as ApiError).details).toEqual({ reason: 'state_conflict' });
  });

  it('keeps 422 errors[] in details', async () => {
    const errors = [{ type: 'missing', loc: ['body', 'name'], msg: 'Field required', input: {} }];
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 422,
      statusText: 'Unprocessable Content',
      json: async () => ({
        type: 'about:blank', title: 'Unprocessable Content', status: 422, detail: 'Request validation failed', errors,
      }),
    });

    const err = await haPost('/api/v1/rooms', {}).catch((e: unknown) => e);

    expect((err as ApiError).code).toBe(ERROR_CODES.VALIDATION_ERROR);
    expect((err as ApiError).status).toBe(422);
    expect((err as ApiError).details).toEqual({ errors });
  });

  it('leaves details null when the problem has no extension members', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: async () => ({ type: 'about:blank', title: 'Not Found', status: 404, detail: 'Room not found' }),
    });

    const err = await haPost('/api/v1/rooms/x', {}).catch((e: unknown) => e);

    expect((err as ApiError).code).toBe(ERROR_CODES.NOT_FOUND);
    expect((err as ApiError).details).toBeNull();
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

// ─────────────────────────────────────────────────────────────────────────────
// Default timeouts
// ─────────────────────────────────────────────────────────────────────────────

describe('default timeouts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetHaCircuit();
    process.env.HA_API_URL = TEST_HA_URL;
    process.env.HA_API_KEY = TEST_API_KEY;
    jest.spyOn(global, 'setTimeout');
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.HA_API_URL;
    delete process.env.HA_API_KEY;
  });

  it('uses 8 s for GET and 15 s for mutations', async () => {
    await haGet('/api/test');
    expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 8_000);

    await haPost('/api/command', {});
    expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 15_000);
  });

  it('honours an explicit timeout', async () => {
    await haGet('/api/test', { timeout: 30_000 });
    expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 30_000);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Circuit breaker
// ─────────────────────────────────────────────────────────────────────────────

describe('circuit breaker', () => {
  const networkDown = () => mockFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'));
  const ok = () => mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true }) });

  async function codeOf(p: Promise<unknown>): Promise<string | undefined> {
    try {
      await p;
      return undefined;
    } catch (e) {
      return (e as ApiError).code;
    }
  }

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
    resetHaCircuit();
    process.env.HA_API_URL = TEST_HA_URL;
    process.env.HA_API_KEY = TEST_API_KEY;
  });

  afterEach(() => {
    jest.useRealTimers();
    delete process.env.HA_API_URL;
    delete process.env.HA_API_KEY;
  });

  it('opens after 3 consecutive transport failures and fails fast without calling fetch', async () => {
    networkDown();
    networkDown();
    networkDown();
    for (let i = 0; i < 3; i++) {
      expect(await codeOf(haGet('/api/test'))).toBe(ERROR_CODES.EXTERNAL_API_ERROR);
    }

    expect(await codeOf(haGet('/api/test'))).toBe(ERROR_CODES.SERVICE_UNAVAILABLE);
    expect(await codeOf(haDelete('/api/test'))).toBe(ERROR_CODES.SERVICE_UNAVAILABLE);
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('counts timeouts as transport failures', async () => {
    const abortError = new Error('aborted');
    abortError.name = 'AbortError';
    mockFetch.mockRejectedValue(abortError);
    for (let i = 0; i < 3; i++) {
      expect(await codeOf(haGet('/api/test'))).toBe(ERROR_CODES.TIMEOUT);
    }

    expect(await codeOf(haGet('/api/test'))).toBe(ERROR_CODES.SERVICE_UNAVAILABLE);
  });

  it('does not open on HTTP error responses (backend reachable)', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => ({ detail: 'boom' }),
    });
    for (let i = 0; i < 5; i++) {
      expect(await codeOf(haGet('/api/test'))).toBe(ERROR_CODES.EXTERNAL_API_ERROR);
    }
    expect(mockFetch).toHaveBeenCalledTimes(5);
  });

  it('a success resets the failure count', async () => {
    networkDown();
    networkDown();
    ok();
    networkDown();
    networkDown();
    ok();
    for (let i = 0; i < 6; i++) {
      await codeOf(haGet('/api/test'));
    }
    expect(mockFetch).toHaveBeenCalledTimes(6);
  });

  it('probes the backend again after 30 s and closes on success', async () => {
    jest.useFakeTimers({ now: new Date('2026-09-28T10:00:00Z') });
    networkDown();
    networkDown();
    networkDown();
    for (let i = 0; i < 3; i++) {
      await codeOf(haGet('/api/test'));
    }
    expect(await codeOf(haGet('/api/test'))).toBe(ERROR_CODES.SERVICE_UNAVAILABLE);

    jest.setSystemTime(new Date('2026-09-28T10:00:31Z'));
    ok();
    ok();
    expect(await codeOf(haGet('/api/test'))).toBeUndefined();
    expect(await codeOf(haGet('/api/test'))).toBeUndefined();
    expect(mockFetch).toHaveBeenCalledTimes(5);
  });
});
