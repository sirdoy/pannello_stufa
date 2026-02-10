/**
 * Netatmo Token Helper
 * Centralizes token management with automatic refresh and error handling
 * Uses environment-specific namespaces (dev/ for localhost, root for production)
 *
 * ✅ Includes token caching to prevent race conditions when multiple API calls
 *    happen simultaneously (e.g., ThermostatCard and CameraCard on home page)
 *
 * ⚠️ SERVER-SIDE ONLY - Uses Admin SDK to bypass Firebase Security Rules
 */

import { adminDbGet, adminDbSet } from '@/lib/firebaseAdmin';
import { getEnvironmentPath } from '@/lib/environmentHelper';
import { getNetatmoCredentials } from '@/lib/netatmoCredentials';

const NETATMO_OAUTH_URL = 'https://api.netatmo.com/oauth2/token';

// Token buffer: refresh 5 minutes before expiration
const TOKEN_EXPIRY_BUFFER_MS = 5 * 60 * 1000;

/** OAuth token data from Netatmo */
interface TokenData {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

/** Cached token data in Firebase */
interface CachedTokenData {
  access_token: string;
  expires_at: number;
  cached_at: number;
}

/** Token result - success */
interface TokenSuccess {
  accessToken: string;
  error: null;
}

/** Token result - error */
interface TokenError {
  accessToken: null;
  error: 'NOT_CONNECTED' | 'TOKEN_EXPIRED' | 'TOKEN_ERROR' | 'NO_ACCESS_TOKEN' | 'NETWORK_ERROR';
  message: string;
}

/** Token result */
export type TokenResult = TokenSuccess | TokenError;

/** Error types */
export type TokenErrorType = TokenError['error'];

/** Error handling result */
export interface TokenErrorHandling {
  status: number;
  reconnect: boolean;
}

// In-memory cache for current refresh operation to prevent race conditions
let refreshPromise: Promise<TokenResult> | null = null;

/**
 * Get valid access token (retrieves from Firebase and refreshes if needed)
 * This is the main function that all API routes should use
 *
 * ✅ Now includes caching to prevent race conditions:
 * - Caches access_token with expiration time in Firebase
 * - Only refreshes when token is expired or about to expire
 * - Prevents concurrent refresh operations
 *
 * @param forceRefresh - If true, bypass cache and force a token refresh
 */
export async function getValidAccessToken(forceRefresh = false): Promise<TokenResult> {
  try {
    // If a refresh is already in progress, wait for it
    if (refreshPromise) {
      return await refreshPromise;
    }

    // Check for cached access token first (unless force refresh)
    if (!forceRefresh) {
      const cachedData = await adminDbGet(getEnvironmentPath('netatmo/access_token_cache')) as CachedTokenData | null;

      // If we have a valid cached token, use it
      if (cachedData?.access_token && cachedData?.expires_at) {
        const now = Date.now();
        // Check if token is still valid (with buffer)
        if (cachedData.expires_at > now + TOKEN_EXPIRY_BUFFER_MS) {
          return {
            accessToken: cachedData.access_token,
            error: null,
          };
        }
      }
    }

    // Need to refresh - create a promise to prevent concurrent refreshes
    refreshPromise = doTokenRefresh();

    try {
      const result = await refreshPromise;
      return result;
    } finally {
      // Clear the promise when done
      refreshPromise = null;
    }
  } catch (err) {
    console.error('Error in getValidAccessToken:', err);
    refreshPromise = null;
    return {
      accessToken: null,
      error: 'NETWORK_ERROR',
      message: (err as Error).message || 'Errore di rete durante il recupero del token.',
    };
  }
}

/**
 * Internal function to perform the actual token refresh
 * Separated to allow for promise-based concurrency control
 */
async function doTokenRefresh(): Promise<TokenResult> {
  // Get refresh token from Firebase (environment-aware)
  const refreshToken = await adminDbGet(getEnvironmentPath('netatmo/refresh_token')) as string | null;

  if (!refreshToken) {
    return {
      accessToken: null,
      error: 'NOT_CONNECTED',
      message: 'Nessun refresh token trovato. Effettua il login con Netatmo.',
    };
  }

  // Get environment-specific credentials
  const credentials = getNetatmoCredentials();

  // Exchange refresh token for access token
  const response = await fetch(NETATMO_OAUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
    }),
  });

  const data = await response.json() as TokenData;

  // Handle errors from Netatmo API
  if (data.error) {
    // Token is invalid/expired - clear from Firebase
    if (data.error === 'invalid_grant' || data.error === 'invalid_token') {
      await adminDbSet(getEnvironmentPath('netatmo/refresh_token'), null);
      await adminDbSet(getEnvironmentPath('netatmo/access_token_cache'), null);
      return {
        accessToken: null,
        error: 'TOKEN_EXPIRED',
        message: 'Token scaduto o invalido. Effettua nuovamente il login con Netatmo.',
      };
    }

    return {
      accessToken: null,
      error: 'TOKEN_ERROR',
      message: `Errore token: ${data.error_description || data.error}`,
    };
  }

  if (!data.access_token) {
    return {
      accessToken: null,
      error: 'NO_ACCESS_TOKEN',
      message: 'Netatmo non ha ritornato un access token valido.',
    };
  }

  // ✅ Cache the access token with expiration time
  // Netatmo tokens typically expire in 3 hours (10800 seconds)
  const expiresIn = data.expires_in || 10800;
  const expiresAt = Date.now() + (expiresIn * 1000);

  await adminDbSet(getEnvironmentPath('netatmo/access_token_cache'), {
    access_token: data.access_token,
    expires_at: expiresAt,
    cached_at: Date.now(),
  });

  // ✅ Update refresh token if Netatmo returns a new one
  // This ensures the token remains valid long-term
  if (data.refresh_token && data.refresh_token !== refreshToken) {
    await adminDbSet(getEnvironmentPath('netatmo/refresh_token'), data.refresh_token);
  }

  return {
    accessToken: data.access_token,
    error: null,
  };
}

/**
 * Check if Netatmo is connected (has valid refresh token)
 */
export async function isNetatmoConnected(): Promise<boolean> {
  try {
    const refreshToken = await adminDbGet(getEnvironmentPath('netatmo/refresh_token'));
    return refreshToken !== null;
  } catch (err) {
    console.error('Error checking Netatmo connection:', err);
    return false;
  }
}

/**
 * Save refresh token to Firebase (used by OAuth callback)
 * Also clears any cached access token to force a fresh token exchange
 */
export async function saveRefreshToken(token: string): Promise<void> {
  await adminDbSet(getEnvironmentPath('netatmo/refresh_token'), token);
  // Clear cached access token to force refresh on next call
  await adminDbSet(getEnvironmentPath('netatmo/access_token_cache'), null);
}

/**
 * Clear cached access token (force refresh on next request)
 * Used when an API call fails with "Invalid access token" despite having a cached token
 */
export async function clearCachedAccessToken(): Promise<void> {
  await adminDbSet(getEnvironmentPath('netatmo/access_token_cache'), null);
}

/**
 * Clear all Netatmo data (logout)
 * Used internally only
 */
async function clearNetatmoData(): Promise<void> {
  await adminDbSet(getEnvironmentPath('netatmo'), null);
}

/**
 * Handle API errors and return standardized error response
 */
export function handleTokenError(error: TokenErrorType): TokenErrorHandling {
  const statusCode: Record<TokenErrorType, number> = {
    'NOT_CONNECTED': 401,
    'TOKEN_EXPIRED': 401,
    'TOKEN_ERROR': 500,
    'NO_ACCESS_TOKEN': 500,
    'NETWORK_ERROR': 500,
  };

  return {
    status: statusCode[error] || 500,
    reconnect: error === 'NOT_CONNECTED' || error === 'TOKEN_EXPIRED',
  };
}

// Note: Functions exported inline above. clearNetatmoData removed (was not used in codebase).
