/**
 * @jest-environment node
 *
 * Tests for GET /api/netatmo/health
 */

import { GET } from '@/app/api/netatmo/health/route';
import { getProxyHealth } from '@/lib/netatmoProxy';
import { ApiError, ERROR_CODES, HTTP_STATUS } from '@/lib/core/apiErrors';
import type { NetatmoHealthResponse } from '@/types/netatmoProxy';

// Mock dependencies
jest.mock('@/lib/netatmoProxy');
jest.mock('@/lib/core', () => ({
  withAuthAndErrorHandler: (fn: Function) => fn,
  success: (data: unknown) => ({ ok: true, data }),
}));

// GET is the inner handler (no request arg needed due to mock above)
const callGET = () => (GET as unknown as () => Promise<unknown>)();

const mockGetProxyHealth = getProxyHealth as jest.MockedFunction<typeof getProxyHealth>;

const mockHealthResponse: NetatmoHealthResponse = {
  token_status: 'valid',
  expires_at: 1700100000,
  last_refresh_at: 1700000000,
  consecutive_failures: 0,
  last_error: null,
  provider_status: 'ok',
  data_freshness: 'LIVE',
  token_source: 'sqlite',
  requests_this_hour: 12,
  rate_limit_ceiling: 500,
  last_poll_at: 1700090000,
};

describe('GET /api/netatmo/health', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return proxy health data on success', async () => {
    mockGetProxyHealth.mockResolvedValue(mockHealthResponse);

    const result = await callGET() as any;

    expect(mockGetProxyHealth).toHaveBeenCalledTimes(1);
    expect(result.ok).toBe(true);
    expect(result.data).toEqual(mockHealthResponse);
    expect(result.data.token_status).toBe('valid');
    expect(result.data.provider_status).toBe('ok');
    expect(result.data.data_freshness).toBe('LIVE');
    expect(result.data.requests_this_hour).toBe(12);
    expect(result.data.rate_limit_ceiling).toBe(500);
  });

  it('should propagate ApiError when proxy /health fails', async () => {
    const apiError = new ApiError(
      ERROR_CODES.SERVICE_UNAVAILABLE,
      'Netatmo proxy unavailable',
      HTTP_STATUS.SERVICE_UNAVAILABLE
    );
    mockGetProxyHealth.mockRejectedValue(apiError);

    await expect(callGET()).rejects.toThrow(ApiError);
    await expect(callGET()).rejects.toThrow('Netatmo proxy unavailable');
  });

  it('should include all health fields in response', async () => {
    const degradedHealth: NetatmoHealthResponse = {
      token_status: 'expiring',
      expires_at: 1700000100,
      last_refresh_at: null,
      consecutive_failures: 3,
      last_error: 'Connection timeout',
      provider_status: 'degraded',
      data_freshness: 'STALE',
      token_source: 'secrets_toml',
      requests_this_hour: 480,
      rate_limit_ceiling: 500,
      last_poll_at: null,
    };
    mockGetProxyHealth.mockResolvedValue(degradedHealth);

    const result = await callGET() as any;

    expect(result.ok).toBe(true);
    expect(result.data.token_status).toBe('expiring');
    expect(result.data.consecutive_failures).toBe(3);
    expect(result.data.last_error).toBe('Connection timeout');
    expect(result.data.provider_status).toBe('degraded');
    expect(result.data.data_freshness).toBe('STALE');
    expect(result.data.last_refresh_at).toBeNull();
    expect(result.data.last_poll_at).toBeNull();
  });
});
