/**
 * Auth Proxy Client
 *
 * Direct fetch wrappers for HA proxy auth endpoints (/auth/*).
 * These functions use direct fetch() — NOT haGet/haPost/haDelete — because:
 *   - login() requires application/x-www-form-urlencoded (haPost sends JSON)
 *   - API key endpoints require Authorization: Bearer (haClient hardcodes X-API-Key)
 *
 * Configuration (env vars):
 *   HA_API_URL    — Base URL of the HA proxy (e.g. https://ha.example.com)
 *   HA_ADMIN_USER — Admin username for server-side JWT login (route-layer concern)
 *   HA_ADMIN_PASSWORD — Admin password for server-side JWT login (route-layer concern)
 *
 * Security (D-03):
 *   The JWT access_token obtained by login() must NEVER be forwarded to the browser.
 *   Route handlers call login() server-side and discard the token after use.
 *
 * Error handling:
 *   - RFC 9457 error responses parsed and mapped to ApiError instances
 *   - AbortError (timeout) → ApiError(TIMEOUT)
 *   - 401 → ApiError(UNAUTHORIZED)
 *   - 404 → ApiError(NOT_FOUND)
 *   - 429 → ApiError(RATE_LIMITED)
 *   - 503 → ApiError(SERVICE_UNAVAILABLE)
 *   - Other non-ok → ApiError(EXTERNAL_API_ERROR)
 */

import { ApiError, ERROR_CODES, HTTP_STATUS } from '@/lib/core/apiErrors';
import type { RFC9457ProblemDetail } from '@/types/haClient';
import type { Token, APIKeyResponse, APIKeyListResponse } from '@/types/authProxy';

const DEFAULT_TIMEOUT_MS = 15_000;

// =============================================================================
// INTERNAL HELPERS
// =============================================================================

/**
 * Validates HA_API_URL env var.
 * Throws ApiError(EXTERNAL_API_ERROR) if missing.
 */
function getHaBaseUrl(): string {
  const baseUrl = process.env.HA_API_URL;

  if (!baseUrl) {
    throw new ApiError(
      ERROR_CODES.EXTERNAL_API_ERROR,
      'HA proxy not configured: missing HA_API_URL',
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }

  return baseUrl;
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

  if (parsedStatus === HTTP_STATUS.NOT_FOUND) {
    throw new ApiError(
      ERROR_CODES.NOT_FOUND,
      detail ?? 'Not found',
      HTTP_STATUS.NOT_FOUND
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
 * Authenticate with the HA proxy using admin credentials.
 * Calls POST /auth/login with form-encoded body (OAuth2 PasswordRequestForm).
 *
 * IMPORTANT (D-03): The returned Token must NEVER be forwarded to the browser.
 * Use the access_token server-side only.
 *
 * @param username - Admin username (HA_ADMIN_USER)
 * @param password - Admin password (HA_ADMIN_PASSWORD)
 * @returns Token with access_token and token_type
 * @throws ApiError(UNAUTHORIZED) on invalid credentials
 * @throws ApiError(EXTERNAL_API_ERROR) when HA_API_URL is missing
 */
export async function login(username: string, password: string): Promise<Token> {
  const baseUrl = getHaBaseUrl();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ username, password }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return await mapResponseError(response);
    }

    return (await response.json()) as Token;
  } catch (error) {
    clearTimeout(timeoutId);
    return mapCaughtError(error);
  }
}

/**
 * Create a new API key via the HA proxy.
 * Calls POST /auth/api-keys with JWT Bearer authentication.
 *
 * @param bearerToken - JWT access token obtained from login()
 * @param name - Human-readable name for the new key (1-100 characters)
 * @returns APIKeyResponse with the full plaintext key (shown only once)
 * @throws ApiError(UNAUTHORIZED) if token is invalid
 */
export async function createApiKey(bearerToken: string, name: string): Promise<APIKeyResponse> {
  const baseUrl = getHaBaseUrl();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl}/auth/api-keys`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return await mapResponseError(response);
    }

    return (await response.json()) as APIKeyResponse;
  } catch (error) {
    clearTimeout(timeoutId);
    return mapCaughtError(error);
  }
}

/**
 * List all API keys via the HA proxy.
 * Calls GET /auth/api-keys with JWT Bearer authentication.
 * Plaintext key values are never returned by this endpoint.
 *
 * @param bearerToken - JWT access token obtained from login()
 * @returns APIKeyListResponse with keys array and count
 * @throws ApiError(UNAUTHORIZED) if token is invalid
 */
export async function listApiKeys(bearerToken: string): Promise<APIKeyListResponse> {
  const baseUrl = getHaBaseUrl();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl}/auth/api-keys`, {
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return await mapResponseError(response);
    }

    return (await response.json()) as APIKeyListResponse;
  } catch (error) {
    clearTimeout(timeoutId);
    return mapCaughtError(error);
  }
}

/**
 * Revoke an API key via the HA proxy.
 * Calls DELETE /auth/api-keys/{keyId} with JWT Bearer authentication.
 * The key becomes immediately unusable after deletion.
 *
 * @param bearerToken - JWT access token obtained from login()
 * @param keyId - Numeric ID of the API key to revoke
 * @returns void on success (204 No Content)
 * @throws ApiError(NOT_FOUND) if keyId does not exist
 * @throws ApiError(UNAUTHORIZED) if token is invalid
 */
export async function deleteApiKey(bearerToken: string, keyId: number): Promise<void> {
  const baseUrl = getHaBaseUrl();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl}/auth/api-keys/${keyId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
      },
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
