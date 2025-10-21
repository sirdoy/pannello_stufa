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
 */

import { ref, get, set, update } from 'firebase/database';
import { db } from './firebase';
import { DEVICE_CONFIG, DEVICE_TYPES } from './devices/deviceTypes';

/**
 * Get device preferences for a user
 * @param {string} userId - Auth0 user ID
 * @returns {Promise<Object>} Device preferences object { deviceId: boolean }
 */
export async function getDevicePreferences(userId) {
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

    // First time: initialize with defaults
    const defaults = getDefaultPreferences();
    await set(prefsRef, defaults);
    return defaults;
  } catch (error) {
    console.error('Error getting device preferences:', error);
    return getDefaultPreferences();
  }
}

/**
 * Update device preferences for a user
 * @param {string} userId - Auth0 user ID
 * @param {Object} preferences - Device preferences { deviceId: boolean }
 * @returns {Promise<boolean>} Success status
 */
export async function updateDevicePreferences(userId, preferences) {
  if (!userId) {
    throw new Error('userId is required');
  }

  try {
    const prefsRef = ref(db, `devicePreferences/${userId}`);
    await update(prefsRef, preferences);
    return true;
  } catch (error) {
    console.error('Error updating device preferences:', error);
    throw error;
  }
}

/**
 * Toggle a single device preference
 * @param {string} userId - Auth0 user ID
 * @param {string} deviceId - Device ID to toggle
 * @returns {Promise<boolean>} New enabled state
 */
export async function toggleDevicePreference(userId, deviceId) {
  const prefs = await getDevicePreferences(userId);
  const newState = !prefs[deviceId];

  await updateDevicePreferences(userId, {
    [deviceId]: newState
  });

  return newState;
}

/**
 * Get default device preferences
 * All devices enabled by default except future ones (lights, sonos)
 * @returns {Object} Default preferences
 */
function getDefaultPreferences() {
  const defaults = {};

  Object.values(DEVICE_CONFIG).forEach(device => {
    // Enable stove and thermostat by default, disable others
    defaults[device.id] = [DEVICE_TYPES.STOVE, DEVICE_TYPES.THERMOSTAT].includes(device.id);
  });

  return defaults;
}

/**
 * Get enabled devices for a user (based on preferences)
 * @param {string} userId - Auth0 user ID
 * @returns {Promise<Array>} Array of enabled device configs
 */
export async function getEnabledDevicesForUser(userId) {
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
export async function isDeviceEnabled(userId, deviceId) {
  const preferences = await getDevicePreferences(userId);
  return preferences[deviceId] === true;
}
