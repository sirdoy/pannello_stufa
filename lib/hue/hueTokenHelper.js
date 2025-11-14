/**
 * Philips Hue Token Helper
 * Manages OAuth 2.0 token lifecycle with auto-refresh and Firebase persistence
 * Uses environment-specific namespaces (dev/ for localhost, root for production)
 * Pattern: Same as netatmoTokenHelper for consistency
 */

import { ref, get, update, set } from 'firebase/database';
import { db } from '../firebase';
import { refreshAccessToken } from './hueApi';
import { getEnvironmentPath } from '../environmentHelper';

const HUE_BASE_REF = 'hue';

/**
 * Get valid access token (auto-refresh if needed)
 * @returns {Promise<{ accessToken: string, error: null } | { accessToken: null, error: string, message: string, reconnect?: boolean }>}
 */
export async function getValidAccessToken() {
  try {
    // 1. Fetch refresh_token from Firebase
    const hueRef = ref(db, getEnvironmentPath(HUE_BASE_REF));
    const snapshot = await get(hueRef);

    if (!snapshot.exists() || !snapshot.val().refresh_token) {
      return {
        accessToken: null,
        error: 'NOT_CONNECTED',
        message: 'Hue non connesso. Effettua il login.',
        reconnect: true,
      };
    }

    const { refresh_token, username } = snapshot.val();

    // 2. Exchange refresh_token for new access_token
    try {
      const tokens = await refreshAccessToken(
        refresh_token,
        process.env.HUE_CLIENT_ID,
        process.env.HUE_CLIENT_SECRET
      );

      console.log('✅ Hue token refreshed successfully');
      console.log('🔍 Access token (first 20 chars):', tokens.access_token?.substring(0, 20) + '...');

      // 3. If new refresh_token returned, save to Firebase
      if (tokens.refresh_token && tokens.refresh_token !== refresh_token) {
        await saveRefreshToken(tokens.refresh_token, username);
      }

      return {
        accessToken: tokens.access_token,
        error: null,
      };

    } catch (refreshError) {
      console.error('❌ Hue token refresh failed:', refreshError.message);

      // If refresh fails, token is likely expired/invalid → clear data
      if (refreshError.message.includes('invalid') || refreshError.message.includes('expired')) {
        await clearHueData();
        return {
          accessToken: null,
          error: 'TOKEN_EXPIRED',
          message: 'Sessione Hue scaduta. Riconnetti.',
          reconnect: true,
        };
      }

      return {
        accessToken: null,
        error: 'REFRESH_ERROR',
        message: refreshError.message,
      };
    }

  } catch (error) {
    console.error('❌ Hue getValidAccessToken error:', error);
    return {
      accessToken: null,
      error: 'UNKNOWN_ERROR',
      message: error.message,
    };
  }
}

/**
 * Save refresh token to Firebase
 */
export async function saveRefreshToken(refreshToken, username = null) {
  const hueRef = ref(db, getEnvironmentPath(HUE_BASE_REF));
  const data = {
    refresh_token: refreshToken,
    updated_at: new Date().toISOString(),
  };

  if (username) {
    data.username = username;
  }

  await update(hueRef, data);
}

/**
 * Save initial OAuth tokens (called from callback route)
 */
export async function saveInitialTokens(accessToken, refreshToken, username = null) {
  const hueRef = ref(db, getEnvironmentPath(HUE_BASE_REF));
  await set(hueRef, {
    refresh_token: refreshToken,
    username: username || 'hue_user',
    connected: true,
    connected_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
}

/**
 * Check if Hue is connected
 */
export async function isHueConnected() {
  const hueRef = ref(db, getEnvironmentPath(HUE_BASE_REF));
  const snapshot = await get(hueRef);
  return snapshot.exists() && snapshot.val().refresh_token;
}

/**
 * Clear all Hue data from Firebase (disconnect)
 */
export async function clearHueData() {
  const hueRef = ref(db, getEnvironmentPath(HUE_BASE_REF));
  await set(hueRef, {
    connected: false,
    disconnected_at: new Date().toISOString(),
  });
}

/**
 * Get Hue connection status
 */
export async function getHueStatus() {
  const hueRef = ref(db, getEnvironmentPath(HUE_BASE_REF));
  const snapshot = await get(hueRef);

  if (!snapshot.exists()) {
    return { connected: false };
  }

  const data = snapshot.val();
  return {
    connected: !!data.refresh_token,
    username: data.username || null,
    connected_at: data.connected_at || null,
    updated_at: data.updated_at || null,
  };
}
