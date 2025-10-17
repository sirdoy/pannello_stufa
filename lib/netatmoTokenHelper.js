/**
 * Netatmo Token Helper
 * Centralizes token management with automatic refresh and error handling
 */

import { db } from '@/lib/firebase';
import { ref, get, set } from 'firebase/database';

const NETATMO_OAUTH_URL = 'https://api.netatmo.com/oauth2/token';

/**
 * Get valid access token (retrieves from Firebase and refreshes if needed)
 * This is the main function that all API routes should use
 *
 * Returns: { accessToken, error }
 */
export async function getValidAccessToken() {
  try {
    // Get refresh token from Firebase
    const refreshTokenSnap = await get(ref(db, 'netatmo/refresh_token'));

    if (!refreshTokenSnap.exists()) {
      return {
        accessToken: null,
        error: 'NOT_CONNECTED',
        message: 'Nessun refresh token trovato. Effettua il login con Netatmo.',
      };
    }

    const refreshToken = refreshTokenSnap.val();

    // Exchange refresh token for access token
    const response = await fetch(NETATMO_OAUTH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: process.env.NETATMO_CLIENT_ID,
        client_secret: process.env.NETATMO_CLIENT_SECRET,
      }),
    });

    const data = await response.json();

    // Handle errors from Netatmo API
    if (data.error) {
      // Token is invalid/expired - clear from Firebase
      if (data.error === 'invalid_grant' || data.error === 'invalid_token') {
        await set(ref(db, 'netatmo/refresh_token'), null);
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

    // ✅ IMPORTANT: Update refresh token if Netatmo returns a new one
    // This ensures the token remains valid long-term
    if (data.refresh_token && data.refresh_token !== refreshToken) {
      await set(ref(db, 'netatmo/refresh_token'), data.refresh_token);
    }

    return {
      accessToken: data.access_token,
      error: null,
    };
  } catch (err) {
    console.error('Error in getValidAccessToken:', err);
    return {
      accessToken: null,
      error: 'NETWORK_ERROR',
      message: err.message || 'Errore di rete durante il recupero del token.',
    };
  }
}

/**
 * Check if Netatmo is connected (has valid refresh token)
 */
export async function isNetatmoConnected() {
  try {
    const refreshTokenSnap = await get(ref(db, 'netatmo/refresh_token'));
    return refreshTokenSnap.exists() && refreshTokenSnap.val() !== null;
  } catch (err) {
    console.error('Error checking Netatmo connection:', err);
    return false;
  }
}

/**
 * Save refresh token to Firebase (used by OAuth callback)
 */
export async function saveRefreshToken(token) {
  await set(ref(db, 'netatmo/refresh_token'), token);
}

/**
 * Clear all Netatmo data (logout)
 */
export async function clearNetatmoData() {
  await set(ref(db, 'netatmo'), null);
}

/**
 * Handle API errors and return standardized error response
 */
export function handleTokenError(error) {
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

export default {
  getValidAccessToken,
  isNetatmoConnected,
  saveRefreshToken,
  clearNetatmoData,
  handleTokenError,
};
