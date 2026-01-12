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
const HUE_REFRESH_ENDPOINT = 'https://api.meethue.com/oauth2/refresh';

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
 *
 * Returns: { accessToken, error, message }
 */
export async function getValidRemoteAccessToken() {
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

    const data = await response.json();

    // Handle errors from Hue OAuth API
    if (data.error || !response.ok) {
      console.error('❌ Hue token refresh failed:', data);

      // Token is invalid/expired - clear from Firebase
      if (data.error === 'invalid_grant' || data.error === 'invalid_token') {
        await clearRemoteTokens();
        return {
          accessToken: null,
          error: 'TOKEN_EXPIRED',
          message: 'Token Hue Remote scaduto o invalido. Riconnetti.',
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

    // ✅ IMPORTANT: Update refresh token if Hue returns a new one
    // This ensures the token remains valid long-term (extends 112-day window)
    if (data.refresh_token && data.refresh_token !== refresh_token) {
      await update(hueRef, {
        refresh_token: data.refresh_token,
        updated_at: new Date().toISOString(),
      });
    }

    return {
      accessToken: data.access_token,
      error: null,
    };
  } catch (err) {
    console.error('❌ Error in getValidRemoteAccessToken:', err);
    return {
      accessToken: null,
      error: 'NETWORK_ERROR',
      message: err.message || 'Errore di rete durante il recupero del token Hue.',
    };
  }
}

/**
 * Exchange authorization code for initial tokens (OAuth callback)
 * @param {string} code - Authorization code from OAuth callback
 * @returns {Promise<{access_token, refresh_token, expires_in}>}
 */
export async function exchangeCodeForTokens(code) {
  try {
    const authHeader = generateBasicAuthHeader(
      process.env.NEXT_PUBLIC_HUE_CLIENT_ID,
      process.env.HUE_CLIENT_SECRET
    );

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
      console.error('❌ Hue code exchange failed:', data);
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
    console.error('❌ Error in exchangeCodeForTokens:', err);
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
    const hueRef = ref(db, getEnvironmentPath(HUE_BASE_REF));
    await update(hueRef, {
      refresh_token: null,
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

const hueRemoteTokenHelper = {
  getValidRemoteAccessToken,
  exchangeCodeForTokens,
  saveRemoteTokens,
  setConnectionMode,
  isRemoteConnected,
  clearRemoteTokens,
  getRemoteStatus,
  handleRemoteTokenError,
};

export default hueRemoteTokenHelper;
