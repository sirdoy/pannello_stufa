/**
 * Device Registry Service
 * Helper functions for device management and navigation
 */

import { DEVICE_TYPES, DEVICE_CONFIG, DEVICE_COLORS, GLOBAL_SECTIONS, SETTINGS_MENU } from './deviceTypes';

/**
 * Get all enabled devices
 * @returns {Array} Array of enabled device configs
 */
export function getEnabledDevices() {
  return Object.values(DEVICE_CONFIG).filter(device => device.enabled);
}

/**
 * Get device configuration by ID
 * @param {string} deviceId - Device ID (from DEVICE_TYPES)
 * @returns {object|null} Device config or null if not found
 */
export function getDeviceConfig(deviceId) {
  return DEVICE_CONFIG[deviceId] || null;
}

/**
 * Get device color classes
 * @param {string} deviceId - Device ID
 * @returns {object} Tailwind color classes object
 */
export function getDeviceColors(deviceId) {
  const device = getDeviceConfig(deviceId);
  if (!device) return DEVICE_COLORS.primary; // Default fallback
  return DEVICE_COLORS[device.color] || DEVICE_COLORS.primary;
}

/**
 * Check if device has specific feature
 * @param {string} deviceId - Device ID
 * @param {string} feature - Feature name (hasScheduler, hasMaintenance, hasErrors)
 * @returns {boolean}
 */
export function deviceHasFeature(deviceId, feature) {
  const device = getDeviceConfig(deviceId);
  return device?.features?.[feature] || false;
}

/**
 * Get device navigation items (routes)
 * @param {string} deviceId - Device ID
 * @returns {Array} Array of navigation items with { label, route }
 */
export function getDeviceNavItems(deviceId) {
  const device = getDeviceConfig(deviceId);
  if (!device) return [];

  const navItems = [
    { label: 'Controllo', route: device.routes.main },
  ];

  // Add conditional nav items based on features
  if (device.features.hasScheduler) {
    const schedulerRoute = device.routes.scheduler || device.routes.schedule;
    if (schedulerRoute) {
      navItems.push({
        label: deviceId === DEVICE_TYPES.STOVE ? 'Pianificazione' : 'Programmazione',
        route: schedulerRoute
      });
    }
  }

  if (device.features.hasMaintenance && device.routes.maintenance) {
    navItems.push({ label: 'Manutenzione', route: device.routes.maintenance });
  }

  if (device.features.hasErrors && device.routes.errors) {
    navItems.push({ label: 'Allarmi', route: device.routes.errors });
  }

  // Add other device-specific routes
  Object.entries(device.routes).forEach(([key, route]) => {
    // Skip already added routes
    if (['main', 'scheduler', 'schedule', 'maintenance', 'errors'].includes(key)) {
      return;
    }
    // Add custom routes (e.g., scenes, zones, spotify, etc.)
    const label = key.charAt(0).toUpperCase() + key.slice(1);
    navItems.push({ label, route });
  });

  return navItems;
}

/**
 * Get global navigation sections (Log, Changelog, etc.)
 * @returns {Array} Array of global nav items
 */
export function getGlobalNavItems() {
  return Object.values(GLOBAL_SECTIONS).map(section => ({
    label: section.name,
    route: section.route,
    icon: section.icon,
  }));
}

/**
 * Get settings menu items
 * @returns {Array} Array of settings menu items
 */
export function getSettingsMenuItems() {
  return Object.values(SETTINGS_MENU).map(item => ({
    id: item.id,
    label: item.name,
    route: item.route,
    icon: item.icon,
    description: item.description,
  }));
}

/**
 * Build complete navigation structure for navbar
 * @returns {object} Navigation structure { devices: [...], global: [...], settings: [...] }
 */
export function getNavigationStructure() {
  const devices = getEnabledDevices().map(device => ({
    id: device.id,
    name: device.name,
    icon: device.icon,
    color: device.color,
    items: getDeviceNavItems(device.id),
  }));

  const global = getGlobalNavItems();
  const settings = getSettingsMenuItems();

  return { devices, global, settings };
}

/**
 * Build complete navigation structure for navbar with user preferences
 * @param {object} preferences - User device preferences { deviceId: boolean }
 * @returns {object} Navigation structure { devices: [...], global: [...], settings: [...] }
 */
export function getNavigationStructureWithPreferences(preferences) {
  // Filter devices based on user preferences
  const enabledDevices = Object.values(DEVICE_CONFIG).filter(device => {
    return preferences[device.id] === true;
  });

  const devices = enabledDevices.map(device => ({
    id: device.id,
    name: device.name,
    icon: device.icon,
    color: device.color,
    items: getDeviceNavItems(device.id),
  }));

  const global = getGlobalNavItems();
  const settings = getSettingsMenuItems();

  return { devices, global, settings };
}

/**
 * Check if a route belongs to a specific device
 * @param {string} pathname - Current route pathname
 * @param {string} deviceId - Device ID to check
 * @returns {boolean}
 */
export function isDeviceRoute(pathname, deviceId) {
  const device = getDeviceConfig(deviceId);
  if (!device) return false;

  return Object.values(device.routes).some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  );
}

/**
 * Get active device from current pathname
 * @param {string} pathname - Current route pathname
 * @returns {string|null} Active device ID or null
 */
export function getActiveDevice(pathname) {
  const devices = getEnabledDevices();
  for (const device of devices) {
    if (isDeviceRoute(pathname, device.id)) {
      return device.id;
    }
  }
  return null;
}

/**
 * Get device badge display (for homepage cards)
 * @param {string} deviceId - Device ID
 * @param {object} status - Device status object
 * @returns {object|null} Badge config { text, variant, pulse } or null
 */
export function getDeviceBadge(deviceId, status) {
  // Device-specific badge logic
  switch (deviceId) {
    case DEVICE_TYPES.STOVE:
      if (status?.error && status.error !== 0) {
        return { text: 'Errore', variant: 'danger', pulse: true };
      }
      if (status?.isOn) {
        return { text: 'Accesa', variant: 'success', pulse: false };
      }
      return { text: 'Spenta', variant: 'neutral', pulse: false };

    case DEVICE_TYPES.THERMOSTAT:
      if (status?.isConnected === false) {
        return { text: 'Offline', variant: 'danger', pulse: false };
      }
      if (status?.heating) {
        return { text: 'Riscaldamento', variant: 'warning', pulse: true };
      }
      return { text: 'Connesso', variant: 'success', pulse: false };

    default:
      return null;
  }
}

export { DEVICE_TYPES, DEVICE_CONFIG, GLOBAL_SECTIONS };
