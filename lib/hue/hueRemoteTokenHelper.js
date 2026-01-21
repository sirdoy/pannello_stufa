/**
 * Philips Hue Remote API Token Helper (OAuth 2.0)
 * Manages OAuth 2.0 tokens for Philips Hue Remote API (cloud access)
 * Pattern: Similar to netatmoTokenHelper.js
 */

import { ref, get, update } from 'firebase/database';
import { db } from '../firebase';
import { getEnvironmentPath } from '../environmentHelper';

const HUE_BASE_REF = 'hue';
const HUE_TOKEN_ENDPOINT = 'https://api.meethue.com/oauth2/token';
// Note: Philips Hue uses the same token endpoint for refresh (standard OAuth2)
const HUE_REFRESH_ENDPOINT = 'https://api.meethue.com/oauth2/token';

// In-memory cache for access token to avoid concurrent refresh requests
// Philips Hue refresh tokens can only be used ONCE - concurrent refreshes cause failures
let tokenCache = {
  accessToken: null,
  expiresAt: null,
  refreshPromise: null, // Lock to prevent concurrent refreshes
};

// Token validity buffer (refresh 5 minutes before expiration)
const TOKEN_EXPIRY_BUFFER = 5 * 60 * 1000;

// Flag to track if we've already tried a refresh in this request (prevent infinite loops)
let refreshAttempted = false;

/**
 * Generate Basic Auth header for Hue OAuth
 * @param {string} clientId
 * @param {string} clientSecret
 * @returns {string} Base64-encoded "Basic {credentials}"
 */
function generateBasicAuthHeader(clientId, clientSecret) {
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  return `Basic ${credentials}`;
}

/**
 * Get valid access token (retrieves from Firebase and refreshes if needed)
 * This is the main function that all Remote API routes should use
 * Implements caching and locking to prevent concurrent refresh requests
 *
 * On serverless (Vercel), we also store access_token in Firebase to share
 * across instances and prevent multiple refreshes with single-use refresh tokens.
 *
 * Returns: { accessToken, error, message }
 */
export async function getValidRemoteAccessToken(forceRefresh = false) {
  try {
    // Reset refresh flag at the start of each token request
    refreshAttempted = false;

    const firebasePath = getEnvironmentPath(HUE_BASE_REF);

    // Check if we have a valid in-memory cached token (same instance)
    if (!forceRefresh && tokenCache.accessToken && tokenCache.expiresAt && Date.now() < tokenCache.expiresAt) {
      return {
        accessToken: tokenCache.accessToken,
        error: null,
      };
    }

    // Check Firebase for a valid access_token (cross-instance cache)
    if (!forceRefresh) {
      const hueRef = ref(db, firebasePath);
      const snapshot = await get(hueRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
        const firebaseTokenExpires = data.access_token_expires_at;

        // Use Firebase cached token if it's still valid (with buffer)
        if (data.access_token && firebaseTokenExpires && Date.now() < (firebaseTokenExpires - TOKEN_EXPIRY_BUFFER)) {
          // Update in-memory cache from Firebase
          tokenCache.accessToken = data.access_token;
          tokenCache.expiresAt = firebaseTokenExpires - TOKEN_EXPIRY_BUFFER;

          return {
            accessToken: data.access_token,
            error: null,
          };
        }
      }
    }

    // If another refresh is in progress, wait for it
    if (tokenCache.refreshPromise) {
      return await tokenCache.refreshPromise;
    }

    // Start a new refresh and store the promise
    tokenCache.refreshPromise = performTokenRefresh();
    const result = await tokenCache.refreshPromise;
    tokenCache.refreshPromise = null;
    refreshAttempted = true;
    return result;
  } catch (err) {
    tokenCache.refreshPromise = null;
    console.error('❌ [Hue Token] Error:', err.message);
    return {
      accessToken: null,
      error: 'NETWORK_ERROR',
      message: err.message || 'Errore di rete durante il recupero del token Hue.',
    };
  }
}

/**
 * Force refresh the token (call when 401 error received)
 * Only refreshes if we haven't already tried in this request
 */
export async function forceTokenRefresh() {
  if (refreshAttempted) {
    return { accessToken: null, error: 'ALREADY_REFRESHED', message: 'Token already refreshed, still invalid' };
  }

  clearTokenCache();
  return getValidRemoteAccessToken(true);
}

/**
 * Perform the actual token refresh (internal function)
 */
async function performTokenRefresh() {
  try {
    // Get refresh token from Firebase (environment-aware)
    const hueRef = ref(db, getEnvironmentPath(HUE_BASE_REF));
    const snapshot = await get(hueRef);

    if (!snapshot.exists() || !snapshot.val().refresh_token) {
      return {
        accessToken: null,
        error: 'NOT_CONNECTED',
        message: 'Hue Remote non connesso. Effettua il login OAuth.',
        reconnect: true,
      };
    }

    const { refresh_token } = snapshot.val();

    // Exchange refresh token for access token
    const authHeader = generateBasicAuthHeader(
      process.env.NEXT_PUBLIC_HUE_CLIENT_ID,
      process.env.HUE_CLIENT_SECRET
    );

    const response = await fetch(HUE_REFRESH_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token,
      }),
    });

    // Get response text first to handle non-JSON responses
    const responseText = await response.text();

    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      console.error('❌ [Hue Token] Invalid JSON response:', response.status);
      return {
        accessToken: null,
        error: 'INVALID_RESPONSE',
        message: `Risposta non valida da Hue OAuth (status ${response.status}). Riprova o riconnetti.`,
        reconnect: response.status === 401 || response.status === 403,
      };
    }

    // Handle errors from Hue OAuth API
    if (data.error || !response.ok) {
      // Token is invalid/expired - clear from Firebase
      // Also treat 500 errors and "unrecognizable" errors as token invalidation
      const isTokenInvalid =
        data.error === 'invalid_grant' ||
        data.error === 'invalid_token' ||
        response.status === 500 ||
        (data.error_description && data.error_description.includes('unrecognizable'));

      if (isTokenInvalid) {
        console.error('❌ [Hue Token] Token invalid, clearing...');
        await clearRemoteTokens();
        return {
          accessToken: null,
          error: 'TOKEN_EXPIRED',
          message: 'Token Hue Remote scaduto o invalido. Riconnetti tramite OAuth.',
          reconnect: true,
        };
      }

      return {
        accessToken: null,
        error: 'TOKEN_ERROR',
        message: `Errore token Hue: ${data.error_description || data.error}`,
      };
    }

    if (!data.access_token) {
      return {
        accessToken: null,
        error: 'NO_ACCESS_TOKEN',
        message: 'Hue OAuth non ha ritornato un access token valido.',
      };
    }

    // Calculate expiration time (expires_in is in seconds)
    const expiresIn = data.expires_in || 604800; // 7 days default
    const expiresAt = Date.now() + (expiresIn * 1000);

    // ✅ IMPORTANT: Save both tokens to Firebase for cross-instance caching
    const firebaseUpdate = {
      access_token: data.access_token,
      access_token_expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    };

    // Update refresh token if Hue returns a new one (extends 112-day window)
    if (data.refresh_token && data.refresh_token !== refresh_token) {
      firebaseUpdate.refresh_token = data.refresh_token;
    }

    await update(hueRef, firebaseUpdate);

    // Also update in-memory cache
    tokenCache.accessToken = data.access_token;
    tokenCache.expiresAt = expiresAt - TOKEN_EXPIRY_BUFFER;

    return {
      accessToken: data.access_token,
      error: null,
    };
  } catch (err) {
    console.error('❌ [Hue Token] Refresh error:', err.message);
    return {
      accessToken: null,
      error: 'NETWORK_ERROR',
      message: err.message || 'Errore di rete durante il recupero del token Hue.',
    };
  }
}

/**
 * Clear the in-memory token cache (call when tokens are invalidated)
 */
export function clearTokenCache() {
  tokenCache.accessToken = null;
  tokenCache.expiresAt = null;
  tokenCache.refreshPromise = null;
}

/**
 * Exchange authorization code for initial tokens (OAuth callback)
 * @param {string} code - Authorization code from OAuth callback
 * @returns {Promise<{access_token, refresh_token, expires_in}>}
 */
export async function exchangeCodeForTokens(code) {
  const clientId = process.env.NEXT_PUBLIC_HUE_CLIENT_ID;
  const clientSecret = process.env.HUE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Missing HUE_CLIENT_ID or HUE_CLIENT_SECRET');
  }

  try {
    const authHeader = generateBasicAuthHeader(clientId, clientSecret);

    const response = await fetch(HUE_TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
      }),
    });

    const data = await response.json();

    if (data.error || !response.ok) {
      throw new Error(data.error_description || data.error || 'Token exchange failed');
    }

    if (!data.access_token || !data.refresh_token) {
      throw new Error('Missing tokens in Hue OAuth response');
    }

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in || 604800, // 7 days default
    };
  } catch (err) {
    console.error('❌ [Hue Token] Exchange error:', err.message);
    throw err;
  }
}

/**
 * Save refresh token to Firebase (used by OAuth callback)
 * @param {string} refreshToken
 */
export async function saveRemoteTokens(refreshToken) {
  try {
    const hueRef = ref(db, getEnvironmentPath(HUE_BASE_REF));
    await update(hueRef, {
      refresh_token: refreshToken,
      remote_connected_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('❌ Error saving remote tokens:', err);
    throw err;
  }
}

/**
 * Update connection mode in Firebase
 * @param {'local' | 'remote' | 'hybrid' | 'disconnected'} mode
 */
export async function setConnectionMode(mode) {
  try {
    const hueRef = ref(db, getEnvironmentPath(HUE_BASE_REF));
    await update(hueRef, {
      connection_mode: mode,
      last_connection_check: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('❌ Error setting connection mode:', err);
    throw err;
  }
}

/**
 * Check if Hue Remote is connected (has valid refresh token)
 */
export async function isRemoteConnected() {
  try {
    const hueRef = ref(db, getEnvironmentPath(HUE_BASE_REF));
    const snapshot = await get(hueRef);
    return snapshot.exists() && snapshot.val().refresh_token !== null && snapshot.val().refresh_token !== undefined;
  } catch (err) {
    console.error('❌ Error checking remote connection:', err);
    return false;
  }
}

/**
 * Clear all Hue Remote OAuth data (logout)
 */
export async function clearRemoteTokens() {
  try {
    // Clear in-memory cache first
    clearTokenCache();

    const hueRef = ref(db, getEnvironmentPath(HUE_BASE_REF));
    await update(hueRef, {
      refresh_token: null,
      access_token: null,
      access_token_expires_at: null,
      remote_connected_at: null,
      connection_mode: 'local', // Fallback to local if available
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('❌ Error clearing remote tokens:', err);
    throw err;
  }
}

/**
 * Get Hue Remote status
 */
export async function getRemoteStatus() {
  try {
    const hueRef = ref(db, getEnvironmentPath(HUE_BASE_REF));
    const snapshot = await get(hueRef);

    if (!snapshot.exists()) {
      return { connected: false };
    }

    const data = snapshot.val();
    return {
      connected: !!data.refresh_token,
      remote_connected_at: data.remote_connected_at || null,
      connection_mode: data.connection_mode || null,
      last_connection_check: data.last_connection_check || null,
      updated_at: data.updated_at || null,
    };
  } catch (err) {
    console.error('❌ Error getting remote status:', err);
    return { connected: false, error: err.message };
  }
}

/**
 * Handle Remote API errors and return standardized error response
 * @param {string} error - Error code
 * @returns {{status: number, reconnect: boolean}}
 */
export function handleRemoteTokenError(error) {
  const statusCode = {
    'NOT_CONNECTED': 401,
    'TOKEN_EXPIRED': 401,
    'TOKEN_ERROR': 500,
    'NO_ACCESS_TOKEN': 500,
    'NETWORK_ERROR': 500,
  }[error] || 500;

  return {
    status: statusCode,
    reconnect: error === 'NOT_CONNECTED' || error === 'TOKEN_EXPIRED',
  };
}

/**
 * Proactively refresh token if it's about to expire (called by cron)
 * Refreshes if token expires within threshold (default: 1 day)
 * @param {number} thresholdMs - Threshold in milliseconds (default: 24 hours)
 * @returns {Promise<{refreshed: boolean, reason: string}>}
 */
export async function proactiveTokenRefresh(thresholdMs = 24 * 60 * 60 * 1000) {
  try {
    const firebasePath = getEnvironmentPath(HUE_BASE_REF);
    const hueRef = ref(db, firebasePath);
    const snapshot = await get(hueRef);

    if (!snapshot.exists()) {
      return { refreshed: false, reason: 'not_connected' };
    }

    const data = snapshot.val();
    if (!data.refresh_token) {
      return { refreshed: false, reason: 'no_refresh_token' };
    }

    const expiresAt = data.access_token_expires_at;
    if (!expiresAt) {
      // No expiration info, refresh to be safe
      const result = await getValidRemoteAccessToken(true);
      return {
        refreshed: !result.error,
        reason: result.error || 'no_expiration_info',
      };
    }

    const now = Date.now();
    const timeUntilExpiry = expiresAt - now;

    // Token is still valid beyond threshold
    if (timeUntilExpiry > thresholdMs) {
      return {
        refreshed: false,
        reason: 'not_expiring_soon',
        expiresIn: Math.round(timeUntilExpiry / 1000 / 60 / 60) + 'h',
      };
    }

    // Token expires within threshold - refresh it
    const result = await getValidRemoteAccessToken(true);
    return {
      refreshed: !result.error,
      reason: result.error || 'refreshed_proactively',
    };
  } catch (err) {
    console.error('❌ [Hue Token] Proactive refresh error:', err.message);
    return { refreshed: false, reason: 'error', error: err.message };
  }
}

const hueRemoteTokenHelper = {
  getValidRemoteAccessToken,
  forceTokenRefresh,
  proactiveTokenRefresh,
  exchangeCodeForTokens,
  saveRemoteTokens,
  setConnectionMode,
  isRemoteConnected,
  clearRemoteTokens,
  clearTokenCache,
  getRemoteStatus,
  handleRemoteTokenError,
};

export default hueRemoteTokenHelper;
