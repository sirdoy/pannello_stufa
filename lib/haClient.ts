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
 *   - 3 consecutive network errors/timeouts → circuit open: ApiError(SERVICE_UNAVAILABLE) for 30 s
 *   - 401 → ApiError(UNAUTHORIZED)
 *   - 429 → ApiError(RATE_LIMITED)
 *   - 503 → ApiError(SERVICE_UNAVAILABLE)
 *   - Other non-ok → ApiError(EXTERNAL_API_ERROR)
 */

import { ApiError, ERROR_CODES, HTTP_STATUS } from '@/lib/core/apiErrors';
import type { RFC9457ProblemDetail, HaRequestOptions } from '@/types/haClient';

// Reads get a shorter default than mutations: a healthy Pi answers in well under
// a second, and every waiting second is billed as function duration.
const DEFAULT_GET_TIMEOUT_MS = 8_000;
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

const PROBLEM_STANDARD_MEMBERS = new Set(['type', 'title', 'status', 'detail', 'instance']);

/** Backend reason extensions (`error` member, kept as `reason`) that map to a dedicated ApiError code. */
const PROBLEM_REASON_CODES: Partial<Record<string, ApiError['code']>> = {
  maintenance_required: ERROR_CODES.MAINTENANCE_REQUIRED,
};

/**
 * Maps a non-ok HTTP response to an ApiError.
 * Attempts to parse RFC 9457 problem detail from the response body. Extension
 * members (`errors[]`, `command`, ...) are kept in `ApiError.details`; the backend
 * `error` reason is stored as `reason`, since `error` is the message key of the
 * Next.js error envelope that spreads these details.
 */
async function mapResponseError(response: Response): Promise<never> {
  let detail: string | undefined;
  let parsedStatus = response.status;
  let details: Record<string, unknown> | null = null;

  try {
    const body = (await response.json()) as RFC9457ProblemDetail;
    if (body.detail) detail = body.detail;
    if (body.status) parsedStatus = body.status;
    const extensions = Object.fromEntries(
      Object.entries(body)
        .filter(([key]) => !PROBLEM_STANDARD_MEMBERS.has(key))
        .map(([key, value]) => [key === 'error' ? 'reason' : key, value])
    );
    if (Object.keys(extensions).length > 0) details = extensions;
  } catch {
    // Not a JSON body — use statusText as fallback
    detail = response.statusText;
  }

  const reasonCode = typeof details?.['reason'] === 'string' ? PROBLEM_REASON_CODES[details['reason']] : undefined;
  if (reasonCode) {
    throw new ApiError(reasonCode, undefined, parsedStatus as ApiError['status'], details);
  }

  if (parsedStatus === HTTP_STATUS.UNAUTHORIZED) {
    throw new ApiError(
      ERROR_CODES.UNAUTHORIZED,
      detail ?? 'Unauthorized',
      HTTP_STATUS.UNAUTHORIZED,
      details
    );
  }

  if (parsedStatus === HTTP_STATUS.TOO_MANY_REQUESTS) {
    throw new ApiError(
      ERROR_CODES.RATE_LIMITED,
      detail ?? 'Rate limit exceeded',
      HTTP_STATUS.TOO_MANY_REQUESTS,
      details
    );
  }

  if (parsedStatus === HTTP_STATUS.SERVICE_UNAVAILABLE) {
    throw new ApiError(
      ERROR_CODES.SERVICE_UNAVAILABLE,
      detail ?? 'HA proxy unavailable',
      HTTP_STATUS.SERVICE_UNAVAILABLE,
      details
    );
  }

  if (parsedStatus === HTTP_STATUS.CONFLICT) {
    throw new ApiError(
      ERROR_CODES.CONFLICT,
      detail ?? 'Conflict',
      HTTP_STATUS.CONFLICT,
      details
    );
  }

  // Client errors keep their status so route/UI branches (e.g. 404 room not found,
  // 422 invalid rule) can react; they are not upstream failures (502).
  if (parsedStatus === HTTP_STATUS.NOT_FOUND) {
    throw new ApiError(ERROR_CODES.NOT_FOUND, detail ?? 'Not found', HTTP_STATUS.NOT_FOUND, details);
  }

  if (parsedStatus === HTTP_STATUS.FORBIDDEN) {
    throw new ApiError(ERROR_CODES.FORBIDDEN, detail ?? 'Forbidden', HTTP_STATUS.FORBIDDEN, details);
  }

  if (parsedStatus === HTTP_STATUS.BAD_REQUEST || parsedStatus === HTTP_STATUS.UNPROCESSABLE_ENTITY) {
    throw new ApiError(
      ERROR_CODES.VALIDATION_ERROR,
      detail ?? 'Invalid request',
      parsedStatus,
      details
    );
  }

  throw new ApiError(
    ERROR_CODES.EXTERNAL_API_ERROR,
    detail ?? `HA proxy error: ${response.statusText}`,
    HTTP_STATUS.BAD_GATEWAY,
    details
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

function authHeaders(apiKey: string, bearer?: string): Record<string, string> {
  return bearer ? { 'X-API-Key': apiKey, Authorization: `Bearer ${bearer}` } : { 'X-API-Key': apiKey };
}

// =============================================================================
// CIRCUIT BREAKER
// =============================================================================
// When the Pi is unreachable every proxied request would otherwise wait for the
// full timeout, burning serverless function duration (billed wall time) for
// nothing. After CIRCUIT_FAILURE_THRESHOLD consecutive transport failures
// (network error or timeout — not HTTP error responses) the circuit opens and
// requests fail fast with 503 for CIRCUIT_OPEN_MS; the first request after
// that window probes the backend again. State is per function instance.

const CIRCUIT_FAILURE_THRESHOLD = 3;
const CIRCUIT_OPEN_MS = 30_000;

let consecutiveFailures = 0;
let circuitOpenUntil = 0;

function recordTransportFailure(): void {
  consecutiveFailures += 1;
  if (consecutiveFailures >= CIRCUIT_FAILURE_THRESHOLD) {
    circuitOpenUntil = Date.now() + CIRCUIT_OPEN_MS;
  }
}

function recordTransportSuccess(): void {
  consecutiveFailures = 0;
  circuitOpenUntil = 0;
}

/** Resets the circuit breaker state. Exported for tests. */
export function resetHaCircuit(): void {
  recordTransportSuccess();
}

// =============================================================================
// REQUEST
// =============================================================================

type HaMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

async function haRequest(
  method: HaMethod,
  endpoint: string,
  body: Record<string, unknown> | object | undefined,
  options: HaRequestOptions
): Promise<Response> {
  const { baseUrl, apiKey } = getEnvConfig();
  const defaultTimeout = method === 'GET' ? DEFAULT_GET_TIMEOUT_MS : DEFAULT_TIMEOUT_MS;
  const { timeout = defaultTimeout, bearer } = options;

  if (Date.now() < circuitOpenUntil) {
    throw ApiError.serviceUnavailable('HA proxy unreachable (circuit open)');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${endpoint}`, {
      ...(method === 'GET' ? {} : { method }),
      headers:
        body === undefined
          ? authHeaders(apiKey, bearer)
          : { ...authHeaders(apiKey, bearer), 'Content-Type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: controller.signal,
    });
  } catch (error) {
    recordTransportFailure();
    return mapCaughtError(error);
  } finally {
    clearTimeout(timeoutId);
  }

  recordTransportSuccess();

  if (!response.ok) {
    return await mapResponseError(response);
  }
  return response;
}

async function parseJson<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch (error) {
    return mapCaughtError(error);
  }
}

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Generic GET request to the HA proxy.
 *
 * @param endpoint - Path relative to HA_API_URL (e.g. '/api/devices')
 * @param options  - Optional { timeout } in milliseconds (default 8000)
 * @returns Parsed JSON response as T
 * @throws ApiError on any failure
 */
export async function haGet<T>(
  endpoint: string,
  options: HaRequestOptions = {}
): Promise<T> {
  return parseJson<T>(await haRequest('GET', endpoint, undefined, options));
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
  body: Record<string, unknown> | object,
  options: HaRequestOptions = {}
): Promise<T> {
  return parseJson<T>(await haRequest('POST', endpoint, body, options));
}

/**
 * POST to an endpoint that answers 204 No Content.
 *
 * @param endpoint - Path relative to HA_API_URL
 * @param body     - Request body; serialized as JSON
 * @param options  - Optional { timeout } in milliseconds (default 15000)
 * @throws ApiError on any failure
 */
export async function haPostNoContent(
  endpoint: string,
  body: Record<string, unknown> | object,
  options: HaRequestOptions = {}
): Promise<void> {
  await haRequest('POST', endpoint, body, options);
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
  body: Record<string, unknown> | object,
  options: HaRequestOptions = {}
): Promise<T> {
  return parseJson<T>(await haRequest('PUT', endpoint, body, options));
}

/**
 * Generic PATCH request to the HA proxy.
 *
 * @param endpoint - Path relative to HA_API_URL (e.g. '/api/v1/automations/123')
 * @param body     - JSON body to send
 * @param options  - Optional { timeout } in milliseconds (default 15000)
 * @returns Parsed JSON response typed as T
 * @throws ApiError on any failure
 */
export async function haPatch<T>(
  endpoint: string,
  body: Record<string, unknown> | object,
  options: HaRequestOptions = {}
): Promise<T> {
  return parseJson<T>(await haRequest('PATCH', endpoint, body, options));
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
  await haRequest('DELETE', endpoint, undefined, options);
}
