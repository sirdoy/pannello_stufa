/**
 * Tests for Thermorossi Proxy Client
 *
 * Tests cover:
 * - X-API-Key header sent on every request (via haGet transport)
 * - Correct URL paths for all convenience wrappers
 * - getHistory with and without URLSearchParams
 * - ApiError on missing env vars
 * - ApiError SERVICE_UNAVAILABLE on 503
 * - ApiError TIMEOUT on AbortError
 */

import { getStatus, getPower, getFan, getHealth, getHistory, sendIgnit, sendShutdown, setPower, setFan, setWaterTemp } from '@/lib/thermorossiProxy';
import { ApiError, ERROR_CODES } from '@/lib/core/apiErrors';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

const TEST_PROXY_URL = 'https://proxy.example.com';
const TEST_API_KEY = 'test-api-key-12345';

describe('haGet transport (via getStatus)', () => {
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
        json: async () => ({ stove_state: 'off', power_level: null, fan_level: null, data_freshness: 'LIVE', last_poll_at: null, error_code: null, error_description: null }),
      });

      await getStatus();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [_url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect((options.headers as Record<string, string>)['X-API-Key']).toBe(TEST_API_KEY);
    });

    it('calls the correct full URL for getStatus', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await getStatus();

      const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${TEST_PROXY_URL}/api/v1/thermorossi/status`);
    });
  });
});

describe('convenience wrapper endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.HA_API_URL = TEST_PROXY_URL;
    process.env.HA_API_KEY = TEST_API_KEY;
  });

  afterEach(() => {
    delete process.env.HA_API_URL;
    delete process.env.HA_API_KEY;
  });

  it('getPower() calls /api/v1/thermorossi/power', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ power_level: 3, data_freshness: 'LIVE', last_poll_at: null }),
    });

    await getPower();

    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${TEST_PROXY_URL}/api/v1/thermorossi/power`);
  });

  it('getFan() calls /api/v1/thermorossi/fan-level', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ fan_level: 2, data_freshness: 'LIVE', last_poll_at: null }),
    });

    await getFan();

    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${TEST_PROXY_URL}/api/v1/thermorossi/fan-level`);
  });

  it('getHealth() calls /api/v1/thermorossi/health', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', data_freshness: 'LIVE', last_poll_at: null }),
    });

    await getHealth();

    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${TEST_PROXY_URL}/api/v1/thermorossi/health`);
  });

  it('getHistory() with no params calls /api/v1/thermorossi/history', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [], total_count: 0, limit: 100, offset: 0, granularity: 'raw' }),
    });

    await getHistory();

    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${TEST_PROXY_URL}/api/v1/thermorossi/history`);
  });
});

describe('getHistory with query params', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.HA_API_URL = TEST_PROXY_URL;
    process.env.HA_API_KEY = TEST_API_KEY;
  });

  afterEach(() => {
    delete process.env.HA_API_URL;
    delete process.env.HA_API_KEY;
  });

  it('appends URLSearchParams as query string', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [], total_count: 0, limit: 50, offset: 0, granularity: 'hourly' }),
    });

    const params = new URLSearchParams({ granularity: 'hourly', limit: '50' });
    await getHistory(params);

    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${TEST_PROXY_URL}/api/v1/thermorossi/history?granularity=hourly&limit=50`);
  });
});

describe('error handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.HA_API_URL = TEST_PROXY_URL;
    process.env.HA_API_KEY = TEST_API_KEY;
  });

  afterEach(() => {
    delete process.env.HA_API_URL;
    delete process.env.HA_API_KEY;
  });

  it('throws ApiError when HA_API_URL is missing', async () => {
    delete process.env.HA_API_URL;

    let caught: ApiError | undefined;
    try {
      await getStatus();
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
      await getStatus();
    } catch (e) {
      caught = e as ApiError;
    }

    expect(caught).toBeInstanceOf(ApiError);
    expect(caught?.code).toBe(ERROR_CODES.EXTERNAL_API_ERROR);
    expect(caught?.message).toContain('HA_API_KEY');
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
      await getStatus();
    } catch (e) {
      caught = e as ApiError;
    }

    expect(caught).toBeInstanceOf(ApiError);
    expect(caught?.code).toBe(ERROR_CODES.SERVICE_UNAVAILABLE);
  });

  it('throws ApiError TIMEOUT on AbortError', async () => {
    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';
    mockFetch.mockRejectedValueOnce(abortError);

    let caught: ApiError | undefined;
    try {
      await getStatus();
    } catch (e) {
      caught = e as ApiError;
    }

    expect(caught).toBeInstanceOf(ApiError);
    expect(caught?.code).toBe(ERROR_CODES.TIMEOUT);
  });
});

describe('command wrappers', () => {
  const MOCK_COMMAND_RESPONSE = {
    command: 'ignit',
    status: 'accepted' as const,
    previous_state: 'off' as const,
    suggested_poll_delay_s: 10,
    poll_endpoint: '/api/v1/thermorossi/status',
    requested_value: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.HA_API_URL = TEST_PROXY_URL;
    process.env.HA_API_KEY = TEST_API_KEY;
  });

  afterEach(() => {
    delete process.env.HA_API_URL;
    delete process.env.HA_API_KEY;
  });

  it('sendIgnit() POSTs to /api/v1/thermorossi/commands/ignit with empty body', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => MOCK_COMMAND_RESPONSE });
    await sendIgnit();
    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${TEST_PROXY_URL}/api/v1/thermorossi/commands/ignit`);
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body as string)).toEqual({});
    expect((options.headers as Record<string, string>)['X-API-Key']).toBe(TEST_API_KEY);
    expect((options.headers as Record<string, string>)['Content-Type']).toBe('application/json');
  });

  it('sendShutdown() POSTs to /api/v1/thermorossi/commands/shutdown with empty body', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ ...MOCK_COMMAND_RESPONSE, command: 'shutdown' }) });
    await sendShutdown();
    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${TEST_PROXY_URL}/api/v1/thermorossi/commands/shutdown`);
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body as string)).toEqual({});
  });

  it('setPower(3) POSTs to /api/v1/thermorossi/settings/power with { value: 3 }', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ ...MOCK_COMMAND_RESPONSE, command: 'set_power', requested_value: 3 }) });
    await setPower(3);
    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${TEST_PROXY_URL}/api/v1/thermorossi/settings/power`);
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body as string)).toEqual({ value: 3 });
  });

  it('setFan(4) POSTs to /api/v1/thermorossi/settings/fan-level with { value: 4 }', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ ...MOCK_COMMAND_RESPONSE, command: 'set_fan', requested_value: 4 }) });
    await setFan(4);
    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${TEST_PROXY_URL}/api/v1/thermorossi/settings/fan-level`);
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body as string)).toEqual({ value: 4 });
  });

  it('setWaterTemp(55) POSTs to /api/v1/thermorossi/settings/temperature/water with { value: 55 }', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ ...MOCK_COMMAND_RESPONSE, command: 'set_water_temp', requested_value: 55 }) });
    await setWaterTemp(55);
    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${TEST_PROXY_URL}/api/v1/thermorossi/settings/temperature/water`);
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body as string)).toEqual({ value: 55 });
  });
});
