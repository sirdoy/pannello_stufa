/**
 * Shared HomeAssistant Proxy Client
 *
 * Generic GET and POST helpers for the HomeAssistant network API proxy.
 * All providers (Fritz!Box, Netatmo, Raspberry Pi) use this as their transport.
 *
 * Configuration (env vars):
 *   HA_API_URL — Base URL of the HA proxy (e.g. https://ha.example.com)
 *   HA_API_KEY — Shared API key for X-API-Key header authentication
 *
 * Error handling:
 *   - RFC 9457 error responses parsed and mapped to ApiError instances
 *   - AbortError (timeout) → ApiError(TIMEOUT)
 *   - 401 → ApiError(UNAUTHORIZED)
 *   - 429 → ApiError(RATE_LIMITED)
 *   - 503 → ApiError(SERVICE_UNAVAILABLE)
 *   - Other non-ok → ApiError(EXTERNAL_API_ERROR)
 */

import { ApiError, ERROR_CODES, HTTP_STATUS } from '@/lib/core/apiErrors';
import type { RFC9457ProblemDetail, HaRequestOptions } from '@/types/haClient';

const DEFAULT_TIMEOUT_MS = 15_000;

// =============================================================================
// INTERNAL HELPERS
// =============================================================================

/**
 * Validates HA_API_URL and HA_API_KEY env vars.
 * Throws ApiError(EXTERNAL_API_ERROR) if either is missing.
 */
function getEnvConfig(): { baseUrl: string; apiKey: string } {
  const baseUrl = process.env.HA_API_URL;
  const apiKey = process.env.HA_API_KEY;

  if (!baseUrl) {
    throw new ApiError(
      ERROR_CODES.EXTERNAL_API_ERROR,
      'HA proxy not configured: missing HA_API_URL',
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }

  if (!apiKey) {
    throw new ApiError(
      ERROR_CODES.EXTERNAL_API_ERROR,
      'HA proxy not configured: missing HA_API_KEY',
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }

  return { baseUrl, apiKey };
}

/**
 * Maps a non-ok HTTP response to an ApiError.
 * Attempts to parse RFC 9457 problem detail from the response body.
 */
async function mapResponseError(response: Response): Promise<never> {
  let detail: string | undefined;
  let parsedStatus = response.status;

  try {
    const body = (await response.json()) as RFC9457ProblemDetail;
    if (body.detail) detail = body.detail;
    if (body.status) parsedStatus = body.status;
  } catch {
    // Not a JSON body — use statusText as fallback
    detail = response.statusText;
  }

  if (parsedStatus === HTTP_STATUS.UNAUTHORIZED) {
    throw new ApiError(
      ERROR_CODES.UNAUTHORIZED,
      detail ?? 'Unauthorized',
      HTTP_STATUS.UNAUTHORIZED
    );
  }

  if (parsedStatus === HTTP_STATUS.TOO_MANY_REQUESTS) {
    throw new ApiError(
      ERROR_CODES.RATE_LIMITED,
      detail ?? 'Rate limit exceeded',
      HTTP_STATUS.TOO_MANY_REQUESTS
    );
  }

  if (parsedStatus === HTTP_STATUS.SERVICE_UNAVAILABLE) {
    throw new ApiError(
      ERROR_CODES.SERVICE_UNAVAILABLE,
      detail ?? 'HA proxy unavailable',
      HTTP_STATUS.SERVICE_UNAVAILABLE
    );
  }

  if (parsedStatus === HTTP_STATUS.CONFLICT) {
    throw new ApiError(
      ERROR_CODES.CONFLICT,
      detail ?? 'Conflict',
      HTTP_STATUS.CONFLICT
    );
  }

  throw new ApiError(
    ERROR_CODES.EXTERNAL_API_ERROR,
    detail ?? `HA proxy error: ${response.statusText}`,
    HTTP_STATUS.BAD_GATEWAY
  );
}

/**
 * Maps a caught error (from fetch) to an ApiError.
 * Re-throws ApiError as-is; maps AbortError to TIMEOUT; maps unknown to EXTERNAL_API_ERROR.
 */
function mapCaughtError(error: unknown): never {
  if (error instanceof ApiError) throw error;

  if (error instanceof Error && error.name === 'AbortError') {
    throw ApiError.timeout('HA proxy timeout');
  }

  throw new ApiError(
    ERROR_CODES.EXTERNAL_API_ERROR,
    `HA proxy request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    HTTP_STATUS.BAD_GATEWAY
  );
}

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Generic GET request to the HA proxy.
 *
 * @param endpoint - Path relative to HA_API_URL (e.g. '/api/devices')
 * @param options  - Optional { timeout } in milliseconds (default 15000)
 * @returns Parsed JSON response as T
 * @throws ApiError on any failure
 */
export async function haGet<T>(
  endpoint: string,
  options: HaRequestOptions = {}
): Promise<T> {
  const { baseUrl, apiKey } = getEnvConfig();
  const { timeout = DEFAULT_TIMEOUT_MS } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      headers: { 'X-API-Key': apiKey },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return await mapResponseError(response);
    }

    return (await response.json()) as T;
  } catch (error) {
    clearTimeout(timeoutId);
    return mapCaughtError(error);
  }
}

/**
 * Generic POST request to the HA proxy.
 *
 * @param endpoint - Path relative to HA_API_URL (e.g. '/api/command')
 * @param body     - Request body; serialized as JSON
 * @param options  - Optional { timeout } in milliseconds (default 15000)
 * @returns Parsed JSON response as T
 * @throws ApiError on any failure
 */
export async function haPost<T>(
  endpoint: string,
  body: Record<string, unknown>,
  options: HaRequestOptions = {}
): Promise<T> {
  const { baseUrl, apiKey } = getEnvConfig();
  const { timeout = DEFAULT_TIMEOUT_MS } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return await mapResponseError(response);
    }

    return (await response.json()) as T;
  } catch (error) {
    clearTimeout(timeoutId);
    return mapCaughtError(error);
  }
}

/**
 * Generic PUT request to the HA proxy.
 *
 * @param endpoint - Path relative to HA_API_URL (e.g. '/api/v1/hue/lights/1/state')
 * @param body     - Request body; serialized as JSON
 * @param options  - Optional { timeout } in milliseconds (default 15000)
 * @returns Parsed JSON response as T
 * @throws ApiError on any failure
 */
export async function haPut<T>(
  endpoint: string,
  body: Record<string, unknown>,
  options: HaRequestOptions = {}
): Promise<T> {
  const { baseUrl, apiKey } = getEnvConfig();
  const { timeout = DEFAULT_TIMEOUT_MS } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return await mapResponseError(response);
    }

    return (await response.json()) as T;
  } catch (error) {
    clearTimeout(timeoutId);
    return mapCaughtError(error);
  }
}

/**
 * Generic DELETE request to the HA proxy.
 *
 * @param endpoint - Path relative to HA_API_URL (e.g. '/api/v1/registry/types/custom_sensor')
 * @param options  - Optional { timeout } in milliseconds (default 15000)
 * @returns void (204 No Content on success)
 * @throws ApiError on any failure
 */
export async function haDelete(
  endpoint: string,
  options: HaRequestOptions = {}
): Promise<void> {
  const { baseUrl, apiKey } = getEnvConfig();
  const { timeout = DEFAULT_TIMEOUT_MS } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: { 'X-API-Key': apiKey },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return await mapResponseError(response);
    }

    // 204 No Content — no JSON body to parse
  } catch (error) {
    clearTimeout(timeoutId);
    return mapCaughtError(error);
  }
}
