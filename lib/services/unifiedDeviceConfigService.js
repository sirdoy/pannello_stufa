/**
 * Unified Device Config Service
 *
 * Single source of truth for device configuration:
 * - visible: device is shown (navbar for hardware, homepage for all)
 * - order: position in homepage
 *
 * Firebase Path: users/{userId}/deviceConfig
 *
 * Schema:
 * {
 *   devices: [
 *     { id: 'stove', visible: true, order: 0 },
 *     { id: 'thermostat', visible: true, order: 1 },
 *     { id: 'weather', visible: true, order: 2 },
 *     ...
 *   ],
 *   updatedAt: 1707145200000,
 *   version: 3
 * }
 *
 * Behavior:
 * - Hardware devices (stove, thermostat, etc.): visible controls navbar AND homepage
 * - Display-only devices (weather): visible controls only homepage (no navbar entry)
 */

import { ref, get } from 'firebase/database';
import { db } from '@/lib/firebase';
import { adminDbGet, adminDbSet } from '@/lib/firebaseAdmin';
import { DEVICE_CONFIG, DISPLAY_ITEMS, DEFAULT_DEVICE_ORDER } from '@/lib/devices/deviceTypes';

const CONFIG_VERSION = 3;

/**
 * Get device metadata (name, icon, etc.) from registry
 */
function getDeviceMetadata(deviceId) {
  return DEVICE_CONFIG[deviceId] || DISPLAY_ITEMS[deviceId] || null;
}

/**
 * Check if device is display-only (no navbar, no hardware)
 */
export function isDisplayOnly(deviceId) {
  return !!DISPLAY_ITEMS[deviceId];
}

/**
 * Check if device has a homepage card
 * All devices have homepage cards except those not in CARD_COMPONENTS (sonos for now)
 */
export function hasHomepageCard(deviceId) {
  // Sonos doesn't have a homepage card yet
  return deviceId !== 'sonos';
}

/**
 * Get default device configuration for new users
 * @returns {Object} Default config with all devices
 */
export function getDefaultDeviceConfig() {
  const devices = DEFAULT_DEVICE_ORDER.map((id, index) => ({
    id,
    visible: true,
    order: index,
  }));

  return {
    devices,
    updatedAt: Date.now(),
    version: CONFIG_VERSION,
  };
}

/**
 * Get unified device config (CLIENT-SIDE - uses client SDK)
 * @param {string} userId - Auth0 user ID
 * @returns {Promise<Object>} Device configuration
 */
export async function getUnifiedDeviceConfig(userId) {
  if (!userId) {
    console.warn('getUnifiedDeviceConfig: no userId provided');
    return getDefaultDeviceConfig();
  }

  try {
    const configRef = ref(db, `users/${userId}/deviceConfig`);
    const snapshot = await get(configRef);

    if (snapshot.exists()) {
      return snapshot.val();
    }

    return getDefaultDeviceConfig();
  } catch (error) {
    console.error('Error getting unified device config:', error);
    return getDefaultDeviceConfig();
  }
}

/**
 * Get unified device config (SERVER-SIDE - uses Admin SDK)
 * Includes on-demand migration from old data structures
 * @param {string} userId - Auth0 user ID
 * @returns {Promise<Object>} Device configuration
 */
export async function getUnifiedDeviceConfigAdmin(userId) {
  if (!userId) {
    console.warn('getUnifiedDeviceConfigAdmin: no userId provided');
    return getDefaultDeviceConfig();
  }

  try {
    const existingConfig = await adminDbGet(`users/${userId}/deviceConfig`);

    if (existingConfig && existingConfig.version >= CONFIG_VERSION) {
      return existingConfig;
    }

    // Migration needed
    const config = await migrateFromOldFormat(userId, existingConfig);
    await adminDbSet(`users/${userId}/deviceConfig`, config);

    return config;
  } catch (error) {
    console.error('Error getting unified device config (admin):', error);
    return getDefaultDeviceConfig();
  }
}

/**
 * Save unified device config (SERVER-SIDE - uses Admin SDK)
 * @param {string} userId - Auth0 user ID
 * @param {Object} config - Device configuration to save
 * @returns {Promise<void>}
 */
export async function saveUnifiedDeviceConfigAdmin(userId, config) {
  if (!userId) {
    throw new Error('userId is required');
  }

  const configToSave = {
    ...config,
    updatedAt: Date.now(),
    version: CONFIG_VERSION,
  };

  await adminDbSet(`users/${userId}/deviceConfig`, configToSave);
}

/**
 * Migrate from old data format to unified config
 * Handles both v2 (enabled + dashboardVisible) and v1 (separate stores)
 * @param {string} userId - Auth0 user ID
 * @param {Object|null} existingConfig - Existing config if any
 * @returns {Promise<Object>} Migrated config
 */
async function migrateFromOldFormat(userId, existingConfig) {
  // If we have v2 config, just merge enabled + dashboardVisible into visible
  if (existingConfig && existingConfig.version === 2) {
    const devices = (existingConfig.devices || []).map((d, index) => ({
      id: d.id,
      visible: d.enabled && d.dashboardVisible,
      order: d.dashboardOrder ?? index,
    }));

    // Add any missing devices
    const existingIds = new Set(devices.map(d => d.id));
    DEFAULT_DEVICE_ORDER.forEach(id => {
      if (!existingIds.has(id)) {
        devices.push({ id, visible: false, order: devices.length });
      }
    });

    return {
      devices,
      updatedAt: Date.now(),
      version: CONFIG_VERSION,
    };
  }

  // Migrate from v1 (separate Firebase paths)
  const oldDevicePrefs = await adminDbGet(`devicePreferences/${userId}`) || {};
  const oldDashboardPrefs = await adminDbGet(`users/${userId}/dashboardPreferences`) || {};
  const oldCardOrder = oldDashboardPrefs.cardOrder || [];

  const devices = [];
  const processedIds = new Set();

  // First, process cards from old dashboard order (preserves order)
  oldCardOrder.forEach((card, index) => {
    const deviceId = card.id;
    if (!getDeviceMetadata(deviceId)) return;

    const isDisplay = isDisplayOnly(deviceId);
    const isEnabledInNavbar = isDisplay ? true : (oldDevicePrefs[deviceId] ?? true);
    const isVisibleInDashboard = card.visible !== false;

    devices.push({
      id: deviceId,
      visible: isEnabledInNavbar && isVisibleInDashboard,
      order: index,
    });
    processedIds.add(deviceId);
  });

  // Add devices from preferences not in dashboard
  Object.keys(oldDevicePrefs).forEach(deviceId => {
    if (processedIds.has(deviceId)) return;
    if (!getDeviceMetadata(deviceId)) return;

    devices.push({
      id: deviceId,
      visible: oldDevicePrefs[deviceId] ?? false,
      order: devices.length,
    });
    processedIds.add(deviceId);
  });

  // Add missing devices from DEFAULT_DEVICE_ORDER
  DEFAULT_DEVICE_ORDER.forEach(deviceId => {
    if (processedIds.has(deviceId)) return;

    devices.push({
      id: deviceId,
      visible: false, // New devices hidden by default during migration
      order: devices.length,
    });
    processedIds.add(deviceId);
  });

  return {
    devices,
    updatedAt: Date.now(),
    version: CONFIG_VERSION,
  };
}

/**
 * Get enabled devices for navbar (hardware only, visible: true)
 * @param {Object} config - Unified device config
 * @returns {Array} Array of device IDs for navbar
 */
export function getEnabledDevicesFromConfig(config) {
  if (!config || !config.devices) return [];

  return config.devices
    .filter(d => d.visible && !isDisplayOnly(d.id))
    .map(d => d.id);
}

/**
 * Get visible dashboard cards with full metadata
 * @param {Object} config - Unified device config
 * @returns {Array} Array of { id, label, icon, visible }
 */
export function getVisibleDashboardCards(config) {
  if (!config || !config.devices) return [];

  return config.devices
    .filter(d => d.visible && hasHomepageCard(d.id))
    .sort((a, b) => a.order - b.order)
    .map(d => {
      const meta = getDeviceMetadata(d.id);
      return {
        id: d.id,
        label: meta?.name || d.id,
        icon: meta?.icon || '❓',
        visible: true,
      };
    });
}

/**
 * Get all devices with full metadata for settings UI
 * @param {Object} config - Unified device config
 * @returns {Array} Array of device objects with metadata
 */
export function getAllDevicesForSettings(config) {
  if (!config || !config.devices) {
    config = getDefaultDeviceConfig();
  }

  return config.devices
    .sort((a, b) => a.order - b.order)
    .map(d => {
      const meta = getDeviceMetadata(d.id);
      return {
        id: d.id,
        name: meta?.name || d.id,
        icon: meta?.icon || '❓',
        color: meta?.color || 'neutral',
        visible: d.visible,
        order: d.order,
        isDisplayOnly: isDisplayOnly(d.id),
        hasHomepageCard: hasHomepageCard(d.id),
        description: getDeviceDescription(d.id),
      };
    });
}

/**
 * Get device description for UI
 */
function getDeviceDescription(deviceId) {
  const descriptions = {
    stove: 'Stufa a pellet Thermorossi',
    thermostat: 'Termostato Netatmo Energy',
    weather: 'Previsioni meteo locali (solo homepage)',
    lights: 'Luci Philips Hue',
    camera: 'Videocamera di sorveglianza',
    sonos: 'Sistema audio Sonos (solo menu)',
  };

  return descriptions[deviceId] || 'Dispositivo smart home';
}
