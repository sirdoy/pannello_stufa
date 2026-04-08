/**
 * TypeScript types for Auth Proxy API.
 *
 * Covers JWT login and API key management endpoints
 * via the HA proxy auth module (mounted at /auth, not /api/v1).
 *
 * See docs/api/auth.md for the authoritative spec.
 */

// =============================================================================
// TOKEN
// =============================================================================

/**
 * Response from POST /auth/login.
 * Contains the JWT access token for subsequent authenticated requests.
 *
 * IMPORTANT (D-03): The access_token must never be forwarded to the browser.
 * It is for server-side use only within Next.js API routes.
 */
export interface Token {
  access_token: string;
  token_type: 'bearer';
}

// =============================================================================
// API KEY MANAGEMENT
// =============================================================================

/**
 * Request body for POST /auth/api-keys.
 * Creates a new API key with the given name.
 */
export interface APIKeyCreate {
  name: string; // 1-100 characters
}

/**
 * Response from POST /auth/api-keys.
 * Contains the full plaintext API key — shown only at creation time.
 */
export interface APIKeyResponse {
  id: number;
  name: string;
  api_key: string;      // Full plaintext — shown only at creation
  created_at: string;   // ISO 8601
}

/**
 * A single API key entry from GET /auth/api-keys.
 * Plaintext key values are never returned by the list endpoint.
 */
export interface APIKeyInfo {
  id: number;
  name: string;
  created_at: string;         // ISO 8601
  last_used_at: string | null; // ISO 8601, null if never used
  is_active: boolean;
}

/**
 * Response from GET /auth/api-keys.
 * Returns all API keys for the authenticated admin.
 */
export interface APIKeyListResponse {
  keys: APIKeyInfo[];
  count: number;
}
