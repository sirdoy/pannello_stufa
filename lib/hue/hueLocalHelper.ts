/**
 * Philips Hue Local API Helper
 * Manages bridge connection and application key with Firebase persistence
 * Uses environment-specific namespaces (dev/ for localhost, root for production)
 */

import { ref, get, set } from 'firebase/database';
import { db } from '../firebase';
import { getEnvironmentPath } from '../environmentHelper';

const HUE_BASE_REF = 'hue';

/**
 * Get Hue connection data from Firebase
 * @returns {Promise<{bridgeIp: string, username: string, clientkey: string} | null>}
 */
export async function getHueConnection() {
  try {
    const hueRef = ref(db, getEnvironmentPath(HUE_BASE_REF));
    const snapshot = await get(hueRef);

    if (!snapshot.exists()) {
      return null;
    }

    const data = snapshot.val();

    if (!data.bridge_ip || !data.username) {
      return null;
    }

    return {
      bridgeIp: data.bridge_ip,
      username: data.username,
      clientkey: data.clientkey || null,
    };
  } catch (error) {
    console.error('❌ Get Hue connection error:', error);
    return null;
  }
}

/**
 * Save Hue connection to Firebase
 */
export async function saveHueConnection(bridgeIp, username, clientkey = null, bridgeId = null) {
  try {
    const hueRef = ref(db, getEnvironmentPath(HUE_BASE_REF));
    const data = {
      bridge_ip: bridgeIp,
      username,
      connected: true,
      connected_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (clientkey) {
      data.clientkey = clientkey;
    }

    if (bridgeId) {
      data.bridge_id = bridgeId;
    }

    await set(hueRef, data);
  } catch (error) {
    console.error('❌ Save Hue connection error:', error);
    throw error;
  }
}

/**
 * Check if Hue is connected
 */
export async function isHueConnected() {
  const connection = await getHueConnection();
  return connection !== null;
}

/**
 * Clear Hue connection from Firebase (disconnect)
 */
export async function clearHueConnection() {
  try {
    const hueRef = ref(db, getEnvironmentPath(HUE_BASE_REF));
    await set(hueRef, {
      connected: false,
      disconnected_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Clear Hue connection error:', error);
    throw error;
  }
}

/**
 * Get Hue connection status
 */
export async function getHueStatus() {
  try {
    const hueRef = ref(db, getEnvironmentPath(HUE_BASE_REF));
    const snapshot = await get(hueRef);

    if (!snapshot.exists()) {
      return { connected: false };
    }

    const data = snapshot.val();
    return {
      connected: !!data.bridge_ip && !!data.username,
      bridge_ip: data.bridge_ip || null,
      bridge_id: data.bridge_id || null,
      connected_at: data.connected_at || null,
      updated_at: data.updated_at || null,
    };
  } catch (error) {
    console.error('❌ Get Hue status error:', error);
    return { connected: false, error: error.message };
  }
}

/**
 * Get connection mode from Firebase
 * @returns {Promise<'local' | 'remote' | 'hybrid' | 'disconnected' | null>}
 */
export async function getConnectionMode() {
  try {
    const hueRef = ref(db, getEnvironmentPath(HUE_BASE_REF));
    const snapshot = await get(hueRef);

    if (!snapshot.exists()) {
      return null;
    }

    return snapshot.val().connection_mode || null;
  } catch (error) {
    console.error('❌ Get connection mode error:', error);
    return null;
  }
}

/**
 * Set connection mode in Firebase
 * @param {'local' | 'remote' | 'hybrid' | 'disconnected'} mode
 */
export async function setConnectionMode(mode) {
  try {
    const hueRef = ref(db, getEnvironmentPath(HUE_BASE_REF));
    const { update } = await import('firebase/database');
    await update(hueRef, {
      connection_mode: mode,
      last_connection_check: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Set connection mode error:', error);
    throw error;
  }
}

/**
 * Get bridge username (used by both Local and Remote API)
 * @returns {Promise<string | null>}
 */
export async function getUsername() {
  try {
    const hueRef = ref(db, getEnvironmentPath(HUE_BASE_REF));
    const snapshot = await get(hueRef);

    if (!snapshot.exists()) {
      return null;
    }

    return snapshot.val().username || null;
  } catch (error) {
    console.error('❌ Get username error:', error);
    return null;
  }
}

/**
 * Check if remote tokens exist
 * @returns {Promise<boolean>}
 */
export async function hasRemoteTokens() {
  try {
    const hueRef = ref(db, getEnvironmentPath(HUE_BASE_REF));
    const snapshot = await get(hueRef);

    if (!snapshot.exists()) {
      return false;
    }

    const data = snapshot.val();
    return !!data.refresh_token;
  } catch (error) {
    console.error('❌ Check remote tokens error:', error);
    return false;
  }
}
