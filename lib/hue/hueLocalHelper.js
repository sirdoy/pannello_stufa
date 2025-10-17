/**
 * Philips Hue Local API Helper
 * Manages bridge connection and application key with Firebase persistence
 */

import { ref, get, set } from 'firebase/database';
import { db } from '../firebase';

const HUE_REF = 'hue';

/**
 * Get Hue connection data from Firebase
 * @returns {Promise<{bridgeIp: string, username: string, clientkey: string} | null>}
 */
export async function getHueConnection() {
  try {
    const hueRef = ref(db, HUE_REF);
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
    const hueRef = ref(db, HUE_REF);
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
    console.log('✅ Hue connection saved to Firebase');
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
    const hueRef = ref(db, HUE_REF);
    await set(hueRef, {
      connected: false,
      disconnected_at: new Date().toISOString(),
    });
    console.log('✅ Hue connection cleared from Firebase');
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
    const hueRef = ref(db, HUE_REF);
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
