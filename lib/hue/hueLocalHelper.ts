/**
 * Philips Hue Local API Helper
 * Manages bridge connection and application key with Firebase persistence
 * Uses environment-specific namespaces (dev/ for localhost, root for production)
 */

import { ref, get, set, update } from 'firebase/database';
import { db } from '../firebase';
import { getEnvironmentPath } from '../environmentHelper';

const HUE_BASE_REF = 'hue';

export interface HueConnection {
  bridgeIp: string;
  username: string;
  clientkey: string | null;
}

export interface HueStatus {
  connected: boolean;
  bridge_ip?: string | null;
  bridge_id?: string | null;
  connected_at?: string | null;
  updated_at?: string | null;
  error?: string;
}

export type ConnectionMode = 'local' | 'remote' | 'hybrid' | 'disconnected';

/**
 * Get Hue connection data from Firebase
 * @returns Connection data or null if not connected
 */
export async function getHueConnection(): Promise<HueConnection | null> {
  try {
    const hueRef = ref(db, getEnvironmentPath(HUE_BASE_REF));
    const snapshot = await get(hueRef);

    if (!snapshot.exists()) {
      return null;
    }

    const data = snapshot.val() as Record<string, unknown>;

    if (!data.bridge_ip || !data.username) {
      return null;
    }

    return {
      bridgeIp: data.bridge_ip as string,
      username: data.username as string,
      clientkey: (data.clientkey as string | null) || null,
    };
  } catch (error) {
    console.error('❌ Get Hue connection error:', error);
    return null;
  }
}

/**
 * Save Hue connection to Firebase
 */
export async function saveHueConnection(bridgeIp: string, username: string, clientkey: string | null = null, bridgeId: string | null = null): Promise<void> {
  try {
    const hueRef = ref(db, getEnvironmentPath(HUE_BASE_REF));
    const data: Record<string, unknown> = {
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
export async function isHueConnected(): Promise<boolean> {
  const connection = await getHueConnection();
  return connection !== null;
}

/**
 * Clear Hue connection from Firebase (disconnect)
 */
export async function clearHueConnection(): Promise<void> {
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
export async function getHueStatus(): Promise<HueStatus> {
  try {
    const hueRef = ref(db, getEnvironmentPath(HUE_BASE_REF));
    const snapshot = await get(hueRef);

    if (!snapshot.exists()) {
      return { connected: false };
    }

    const data = snapshot.val() as Record<string, unknown>;
    return {
      connected: !!data.bridge_ip && !!data.username,
      bridge_ip: (data.bridge_ip as string | null) || null,
      bridge_id: (data.bridge_id as string | null) || null,
      connected_at: (data.connected_at as string | null) || null,
      updated_at: (data.updated_at as string | null) || null,
    };
  } catch (error) {
    console.error('❌ Get Hue status error:', error);
    return { connected: false, error: (error as Error).message };
  }
}

/**
 * Get connection mode from Firebase
 * @returns Connection mode or null if not set
 */
export async function getConnectionMode(): Promise<ConnectionMode | null> {
  try {
    const hueRef = ref(db, getEnvironmentPath(HUE_BASE_REF));
    const snapshot = await get(hueRef);

    if (!snapshot.exists()) {
      return null;
    }

    return (snapshot.val() as Record<string, unknown>).connection_mode as ConnectionMode || null;
  } catch (error) {
    console.error('❌ Get connection mode error:', error);
    return null;
  }
}

/**
 * Set connection mode in Firebase
 * @param mode - Connection mode
 */
export async function setConnectionMode(mode: ConnectionMode): Promise<void> {
  try {
    const hueRef = ref(db, getEnvironmentPath(HUE_BASE_REF));
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
 * @returns Username or null if not set
 */
export async function getUsername(): Promise<string | null> {
  try {
    const hueRef = ref(db, getEnvironmentPath(HUE_BASE_REF));
    const snapshot = await get(hueRef);

    if (!snapshot.exists()) {
      return null;
    }

    return (snapshot.val() as Record<string, unknown>).username as string || null;
  } catch (error) {
    console.error('❌ Get username error:', error);
    return null;
  }
}

/**
 * Check if remote tokens exist
 * @returns True if refresh token exists
 */
export async function hasRemoteTokens(): Promise<boolean> {
  try {
    const hueRef = ref(db, getEnvironmentPath(HUE_BASE_REF));
    const snapshot = await get(hueRef);

    if (!snapshot.exists()) {
      return false;
    }

    const data = snapshot.val() as Record<string, unknown>;
    return !!data.refresh_token;
  } catch (error) {
    console.error('❌ Check remote tokens error:', error);
    return false;
  }
}
