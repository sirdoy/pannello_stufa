/**
 * Device Preferences Service
 * Manages user device enable/disable preferences in Firebase
 *
 * Firebase Schema:
 * devicePreferences/{userId}/{deviceId}: boolean
 *
 * Example:
 * devicePreferences/auth0|123/stove: true
 * devicePreferences/auth0|123/thermostat: true
 * devicePreferences/auth0|123/lights: false
 * devicePreferences/auth0|123/sonos: false
 *
 * IMPORTANT:
 * - READ operations use client SDK (lib/firebase) - works from browser
 * - WRITE operations use Admin SDK (lib/firebaseAdmin) - requires server-side (API routes)
 * - This is because Firebase security rules block client writes (.write: false)
 */

import { ref, get } from 'firebase/database';
import { db } from './firebase';
import { adminDbUpdate, adminDbSet, adminDbGet } from './firebaseAdmin';
import { DEVICE_CONFIG, DEVICE_TYPES } from './devices/deviceTypes';

/** Device preferences object */
export type DevicePreferences = Record<string, boolean>;

/**
 * Get device preferences for a user (CLIENT-SIDE - uses client SDK)
 */
export async function getDevicePreferences(userId: string): Promise<DevicePreferences> {
  if (!userId) {
    console.warn('getDevicePreferences: no userId provided');
    return getDefaultPreferences();
  }

  try {
    const prefsRef = ref(db, `devicePreferences/${userId}`);
    const snapshot = await get(prefsRef);

    if (snapshot.exists()) {
      return snapshot.val();
    }

    // First time: return defaults (don't try to write from client)
    // The write will happen when user saves preferences via API
    return getDefaultPreferences();
  } catch (error) {
    console.error('Error getting device preferences:', error);
    return getDefaultPreferences();
  }
}

/**
 * Get device preferences for a user (SERVER-SIDE - uses Admin SDK)
 * Use this from API routes to bypass security rules
 * @param {string} userId - Auth0 user ID
 * @returns {Promise<Object>} Device preferences object { deviceId: boolean }
 */
export async function getDevicePreferencesAdmin(userId: string): Promise<DevicePreferences> {
  if (!userId) {
    console.warn('getDevicePreferencesAdmin: no userId provided');
    return getDefaultPreferences();
  }

  try {
    const data = await adminDbGet(`devicePreferences/${userId}`) as DevicePreferences | null;

    if (data) {
      return data;
    }

    // First time: initialize with defaults using Admin SDK
    const defaults = getDefaultPreferences();
    await adminDbSet(`devicePreferences/${userId}`, defaults);
    return defaults;
  } catch (error) {
    console.error('Error getting device preferences (admin):', error);
    return getDefaultPreferences();
  }
}

/**
 * Update device preferences for a user (SERVER-SIDE - uses Admin SDK)
 * MUST be called from API routes only - Admin SDK bypasses security rules
 * @param {string} userId - Auth0 user ID
 * @param {Object} preferences - Device preferences { deviceId: boolean }
 * @returns {Promise<boolean>} Success status
 */
export async function updateDevicePreferences(userId: string, preferences: Partial<DevicePreferences>): Promise<boolean> {
  if (!userId) {
    throw new Error('userId is required');
  }

  try {
    await adminDbUpdate(`devicePreferences/${userId}`, preferences);
    return true;
  } catch (error) {
    console.error('Error updating device preferences:', error);
    throw error;
  }
}

/**
 * Toggle a single device preference (SERVER-SIDE - uses Admin SDK)
 * MUST be called from API routes only
 * @param {string} userId - Auth0 user ID
 * @param {string} deviceId - Device ID to toggle
 * @returns {Promise<boolean>} New enabled state
 */
export async function toggleDevicePreference(userId: string, deviceId: string): Promise<boolean> {
  // Use Admin SDK since this is a write operation
  const prefs = await getDevicePreferencesAdmin(userId);
  const newState = !prefs[deviceId];

  await updateDevicePreferences(userId, {
    [deviceId]: newState
  });

  return newState;
}

/**
 * Get default device preferences
 * All devices enabled by default except future ones (lights, sonos)
 */
function getDefaultPreferences(): DevicePreferences {
  const defaults: Record<string, boolean> = {};

  Object.values(DEVICE_CONFIG).forEach(device => {
    // Enable stove and thermostat by default, disable others
    defaults[device.id] = ([DEVICE_TYPES.STOVE, DEVICE_TYPES.THERMOSTAT] as string[]).includes(device.id);
  });

  return defaults;
}

/**
 * Get enabled devices for a user (based on preferences)
 * @param {string} userId - Auth0 user ID
 * @returns {Promise<Array>} Array of enabled device configs
 */
export async function getEnabledDevicesForUser(userId: string): Promise<unknown[]> {
  const preferences = await getDevicePreferences(userId);

  return Object.values(DEVICE_CONFIG).filter(device => {
    return preferences[device.id] === true;
  });
}

/**
 * Check if a specific device is enabled for a user
 * @param {string} userId - Auth0 user ID
 * @param {string} deviceId - Device ID
 * @returns {Promise<boolean>} Whether device is enabled
 */
export async function isDeviceEnabled(userId: string, deviceId: string): Promise<boolean> {
  const preferences = await getDevicePreferences(userId);
  return preferences[deviceId] === true;
}
