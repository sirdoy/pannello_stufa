/**
 * Philips Hue Token Helper (OAuth 2.0 - Remote API)
 *
 * 🚧 FUTURE: Remote API support
 *
 * This file implements OAuth 2.0 token management for Philips Hue Remote API.
 * Currently DISABLED in favor of Local API (hueLocalHelper.js).
 *
 * When implementing Remote API (Opzione 3 - Hybrid):
 * 1. Uncomment the implementation below
 * 2. Setup OAuth credentials in .env (CLIENT_ID, CLIENT_SECRET)
 * 3. Implement Strategy pattern to switch between Local/Remote
 * 4. Enable callback route (app/api/hue/callback/route.js)
 *
 * For now, all functions throw "Not implemented" errors.
 */

/* ============================================================================
 * FUTURE: Uncomment below for Remote API support
 * ============================================================================

import { ref, get, update, set } from 'firebase/database';
import { db } from '../firebase';
import { refreshAccessToken } from './hueApi';
import { getEnvironmentPath } from '../environmentHelper';

const HUE_BASE_REF = 'hue';

export async function getValidAccessToken() {
  try {
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

    try {
      const tokens = await refreshAccessToken(
        refresh_token,
        process.env.HUE_CLIENT_ID,
        process.env.HUE_CLIENT_SECRET
      );

      if (tokens.refresh_token && tokens.refresh_token !== refresh_token) {
        await saveRefreshToken(tokens.refresh_token, username);
      }

      return {
        accessToken: tokens.access_token,
        error: null,
      };

    } catch (refreshError) {
      console.error('❌ Hue token refresh failed:', refreshError.message);

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

export async function isHueConnected() {
  const hueRef = ref(db, getEnvironmentPath(HUE_BASE_REF));
  const snapshot = await get(hueRef);
  return snapshot.exists() && snapshot.val().refresh_token;
}

export async function clearHueData() {
  const hueRef = ref(db, getEnvironmentPath(HUE_BASE_REF));
  await set(hueRef, {
    connected: false,
    disconnected_at: new Date().toISOString(),
  });
}

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

============================================================================ */

// Stub exports (prevent build errors)
export async function getValidAccessToken() {
  throw new Error('Remote API not implemented yet. Using Local API (hueLocalHelper).');
}

export async function saveRefreshToken() {
  throw new Error('Remote API not implemented yet. Using Local API (hueLocalHelper).');
}

export async function saveInitialTokens() {
  throw new Error('Remote API not implemented yet. Using Local API (hueLocalHelper).');
}

export async function isHueConnected() {
  throw new Error('Remote API not implemented yet. Using Local API (hueLocalHelper).');
}

export async function clearHueData() {
  throw new Error('Remote API not implemented yet. Using Local API (hueLocalHelper).');
}

export async function getHueStatus() {
  throw new Error('Remote API not implemented yet. Using Local API (hueLocalHelper).');
}
