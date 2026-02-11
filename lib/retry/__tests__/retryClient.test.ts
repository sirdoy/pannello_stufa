/**
 * Tests for retryClient - Retry logic with exponential backoff
 */

import { retryFetch, isTransientError, RetryError } from '../retryClient';
import { ERROR_CODES } from '@/lib/core/apiErrors';

// Polyfill Response for Node.js test environment
if (typeof Response === 'undefined') {
  global.Response = class Response {
    private _body: string;
    public status: number;
    public ok: boolean;
    public statusText: string;
    public headers: Map<string, string>;

    constructor(body: string, init?: { status?: number; statusText?: string; headers?: Record<string, string> }) {
      this._body = body;
      this.status = init?.status ?? 200;
      this.ok = this.status >= 200 && this.status < 300;
      this.statusText = init?.statusText ?? '';
      this.headers = new Map(Object.entries(init?.headers || {}));
    }

    async json() {
      return JSON.parse(this._body);
    }

    async text() {
      return this._body;
    }

    clone() {
      return new Response(this._body, {
        status: this.status,
        statusText: this.statusText,
        headers: Object.fromEntries(this.headers),
      });
    }
  } as any;
}

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch as typeof fetch;

describe('retryClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('retryFetch', () => {
    it('returns response on first success (no retry)', async () => {
      const mockResponse = new Response(JSON.stringify({ data: 'success' }), {
        status: 200,
      });
      mockFetch.mockResolvedValueOnce(mockResponse);

      const promise = retryFetch('https://api.example.com/test', {});

      // No timers should be needed for immediate success
      const response = await promise;

      expect(response.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('retries up to 3 times on transient errors', async () => {
      // First 2 calls fail with transient error, 3rd succeeds
      mockFetch
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ code: ERROR_CODES.NETWORK_ERROR, error: 'Network failure' }), {
            status: 503,
          })
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ code: ERROR_CODES.TIMEOUT, error: 'Request timeout' }), {
            status: 504,
          })
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ data: 'success' }), {
            status: 200,
          })
        );

      const promise = retryFetch('https://api.example.com/test', {});

      // Run all pending timers to complete retries
      await jest.runAllTimersAsync();

      const response = await promise;

      expect(response.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('throws immediately on non-retryable errors', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ code: ERROR_CODES.VALIDATION_ERROR, error: 'Invalid input' }), {
          status: 400,
        })
      );

      await expect(retryFetch('https://api.example.com/test', {})).rejects.toThrow();
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('throws immediately on UNAUTHORIZED', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ code: ERROR_CODES.UNAUTHORIZED, error: 'Not authenticated' }), {
          status: 401,
        })
      );

      await expect(retryFetch('https://api.example.com/test', {})).rejects.toThrow();
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('throws immediately on STOVE_OFFLINE', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ code: ERROR_CODES.STOVE_OFFLINE, error: 'Stove offline' }), {
          status: 504,
        })
      );

      await expect(retryFetch('https://api.example.com/test', {})).rejects.toThrow();
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('throws immediately on MAINTENANCE_REQUIRED', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ code: ERROR_CODES.MAINTENANCE_REQUIRED, error: 'Needs cleaning' }), {
          status: 403,
        })
      );

      await expect(retryFetch('https://api.example.com/test', {})).rejects.toThrow();
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('throws immediately on HUE_NOT_CONNECTED', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ code: ERROR_CODES.HUE_NOT_CONNECTED, error: 'Hue offline' }), {
          status: 401,
        })
      );

      await expect(retryFetch('https://api.example.com/test', {})).rejects.toThrow();
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('throws immediately on NETATMO_NOT_CONNECTED', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ code: ERROR_CODES.NETATMO_NOT_CONNECTED, error: 'Netatmo offline' }), {
          status: 401,
        })
      );

      await expect(retryFetch('https://api.example.com/test', {})).rejects.toThrow();
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('applies exponential backoff with jitter tolerance', async () => {
      // Track setTimeout calls to verify backoff
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout');

      // All 3 attempts fail with transient error
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify({ code: ERROR_CODES.NETWORK_ERROR, error: 'Network failure' }), {
          status: 503,
        })
      );

      retryFetch('https://api.example.com/test', {}, { maxAttempts: 3 }).catch(() => {});

      // Run all timers
      await jest.runAllTimersAsync();

      expect(mockFetch).toHaveBeenCalledTimes(3);

      // Verify exponential backoff was applied
      // Should have 2 setTimeout calls (no delay after last attempt)
      const timeoutCalls = setTimeoutSpy.mock.calls.filter(call => typeof call[1] === 'number');
      expect(timeoutCalls.length).toBeGreaterThanOrEqual(2);

      // First delay should be around 1000ms (with 30% jitter)
      const delay1 = timeoutCalls[0]?.[1] as number;
      expect(delay1).toBeGreaterThanOrEqual(700);
      expect(delay1).toBeLessThanOrEqual(1300);

      // Second delay should be around 2000ms (with 30% jitter)
      const delay2 = timeoutCalls[1]?.[1] as number;
      expect(delay2).toBeGreaterThanOrEqual(1400);
      expect(delay2).toBeLessThanOrEqual(2600);

      setTimeoutSpy.mockRestore();
    });

    it('caps delay at maxDelay', async () => {
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout');

      mockFetch.mockResolvedValue(
        new Response(JSON.stringify({ code: ERROR_CODES.NETWORK_ERROR, error: 'Network failure' }), {
          status: 503,
        })
      );

      retryFetch('https://api.example.com/test', {}, {
        maxAttempts: 5,
        initialDelay: 8000,
        maxDelay: 10000,
      }).catch(() => {});

      await jest.runAllTimersAsync();

      // First retry should be capped at 10000ms (8000 * 2 = 16000, but capped)
      const timeoutCalls = setTimeoutSpy.mock.calls.filter(call => typeof call[1] === 'number');
      const delay1 = timeoutCalls[0]?.[1] as number;

      // Verify delay is capped at maxDelay (with jitter tolerance)
      expect(delay1).toBeLessThanOrEqual(13000); // 10000ms + 30% jitter

      setTimeoutSpy.mockRestore();
    });

    it('calls onRetry callback with attempt number and error', async () => {
      const onRetry = jest.fn();

      mockFetch
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ code: ERROR_CODES.NETWORK_ERROR, error: 'Network failure' }), {
            status: 503,
          })
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ data: 'success' }), {
            status: 200,
          })
        );

      const promise = retryFetch('https://api.example.com/test', {}, { onRetry });

      await jest.runAllTimersAsync();
      await promise;

      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(0, expect.any(Error));
    });

    it('respects custom maxAttempts', async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify({ code: ERROR_CODES.NETWORK_ERROR, error: 'Network failure' }), {
          status: 503,
        })
      );

      retryFetch('https://api.example.com/test', {}, { maxAttempts: 2 }).catch(() => {});

      await jest.runAllTimersAsync();

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('respects custom initialDelay', async () => {
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout');

      mockFetch.mockResolvedValue(
        new Response(JSON.stringify({ code: ERROR_CODES.NETWORK_ERROR, error: 'Network failure' }), {
          status: 503,
        })
      );

      retryFetch('https://api.example.com/test', {}, {
        maxAttempts: 2,
        initialDelay: 500,
      }).catch(() => {});

      await jest.runAllTimersAsync();

      // Verify first delay is around 500ms (with jitter)
      const timeoutCalls = setTimeoutSpy.mock.calls.filter(call => typeof call[1] === 'number');
      const delay = timeoutCalls[0]?.[1] as number;
      expect(delay).toBeGreaterThanOrEqual(350); // 500ms - 30%
      expect(delay).toBeLessThanOrEqual(650); // 500ms + 30%

      setTimeoutSpy.mockRestore();
    });

    it('throws RetryError with attempt count after exhausting retries', async () => {
      mockFetch.mockResolvedValue(
        new Response(JSON.stringify({ code: ERROR_CODES.NETWORK_ERROR, error: 'Network failure' }), {
          status: 503,
        })
      );

      let thrownError: any;
      const promise = retryFetch('https://api.example.com/test', {}, { maxAttempts: 3 }).catch(e => {
        thrownError = e;
      });

      await jest.runAllTimersAsync();
      await promise;

      expect(thrownError).toBeInstanceOf(RetryError);
      expect(thrownError.attempts).toBe(3);
    });

    it('retries on network TypeError (fetch fails entirely)', async () => {
      mockFetch
        .mockRejectedValueOnce(new TypeError('Failed to fetch'))
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ data: 'success' }), {
            status: 200,
          })
        );

      const promise = retryFetch('https://api.example.com/test', {});

      await jest.runAllTimersAsync();
      const response = await promise;

      expect(response.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('isTransientError', () => {
    it('correctly classifies NETWORK_ERROR as transient', () => {
      expect(isTransientError(ERROR_CODES.NETWORK_ERROR)).toBe(true);
    });

    it('correctly classifies TIMEOUT as transient', () => {
      expect(isTransientError(ERROR_CODES.TIMEOUT)).toBe(true);
    });

    it('correctly classifies SERVICE_UNAVAILABLE as transient', () => {
      expect(isTransientError(ERROR_CODES.SERVICE_UNAVAILABLE)).toBe(true);
    });

    it('correctly classifies STOVE_TIMEOUT as transient', () => {
      expect(isTransientError(ERROR_CODES.STOVE_TIMEOUT)).toBe(true);
    });

    it('correctly classifies EXTERNAL_API_ERROR as transient', () => {
      expect(isTransientError(ERROR_CODES.EXTERNAL_API_ERROR)).toBe(true);
    });

    it('correctly classifies VALIDATION_ERROR as non-transient', () => {
      expect(isTransientError(ERROR_CODES.VALIDATION_ERROR)).toBe(false);
    });

    it('correctly classifies UNAUTHORIZED as non-transient', () => {
      expect(isTransientError(ERROR_CODES.UNAUTHORIZED)).toBe(false);
    });

    it('correctly classifies STOVE_OFFLINE as non-transient', () => {
      expect(isTransientError(ERROR_CODES.STOVE_OFFLINE)).toBe(false);
    });

    it('correctly classifies MAINTENANCE_REQUIRED as non-transient', () => {
      expect(isTransientError(ERROR_CODES.MAINTENANCE_REQUIRED)).toBe(false);
    });

    it('correctly classifies HUE_NOT_CONNECTED as non-transient', () => {
      expect(isTransientError(ERROR_CODES.HUE_NOT_CONNECTED)).toBe(false);
    });

    it('correctly classifies NETATMO_NOT_CONNECTED as non-transient', () => {
      expect(isTransientError(ERROR_CODES.NETATMO_NOT_CONNECTED)).toBe(false);
    });

    it('correctly classifies unknown error codes as non-transient', () => {
      expect(isTransientError('UNKNOWN_ERROR')).toBe(false);
    });
  });
});
