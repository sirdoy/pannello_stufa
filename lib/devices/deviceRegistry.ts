/**
 * Device Registry Service
 * Helper functions for device management and navigation
 */

import type { DeviceConfig, DeviceTypeId, DeviceColor } from './deviceTypes';
import { DEVICE_TYPES, DEVICE_CONFIG, DEVICE_COLORS, GLOBAL_SECTIONS, SETTINGS_MENU } from './deviceTypes';

/** Navigation item */
interface NavItem {
  label: string;
  route: string;
  icon?: string;
}

/** Device navigation structure */
interface DeviceNav {
  id: DeviceTypeId;
  name: string;
  icon: string;
  color: DeviceColor;
  items: NavItem[];
}

/** Settings menu item with optional submenu */
interface SettingsMenuItemOutput {
  id: string;
  label: string;
  route: string;
  icon: string;
  description: string;
  submenu?: SettingsMenuItemOutput[];
}

/** Complete navigation structure */
interface NavigationStructure {
  devices: DeviceNav[];
  global: NavItem[];
  settings: SettingsMenuItemOutput[];
}

/** Device badge configuration */
interface DeviceBadge {
  text: string;
  variant: 'success' | 'danger' | 'warning' | 'neutral';
  pulse: boolean;
}

/**
 * Get all enabled devices
 * @returns Array of enabled device configs
 */
export function getEnabledDevices(): DeviceConfig[] {
  return Object.values(DEVICE_CONFIG).filter(device => device.enabled);
}

/**
 * Get device configuration by ID
 * @param deviceId - Device ID (from DEVICE_TYPES)
 * @returns Device config or null if not found
 */
export function getDeviceConfig(deviceId: string): DeviceConfig | null {
  return DEVICE_CONFIG[deviceId as DeviceTypeId] || null;
}

/**
 * Get device color classes
 * @param deviceId - Device ID
 * @returns Tailwind color classes object
 */
export function getDeviceColors(deviceId: string): { bg: string; text: string; border: string; hover: string; badge: string } {
  const device = getDeviceConfig(deviceId);
  if (!device) return DEVICE_COLORS.primary; // Default fallback
  return DEVICE_COLORS[device.color] || DEVICE_COLORS.primary;
}

/**
 * Check if device has specific feature
 * @param deviceId - Device ID
 * @param feature - Feature name (hasScheduler, hasMaintenance, hasErrors)
 * @returns Boolean indicating feature presence
 */
export function deviceHasFeature(deviceId: string, feature: string): boolean {
  const device = getDeviceConfig(deviceId);
  return device?.features?.[feature as keyof DeviceConfig['features']] || false;
}

/**
 * Get device navigation items (routes)
 * @param deviceId - Device ID
 * @returns Array of navigation items with { label, route }
 */
export function getDeviceNavItems(deviceId: string): NavItem[] {
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
 * @returns Array of global nav items
 */
export function getGlobalNavItems(): NavItem[] {
  return Object.values(GLOBAL_SECTIONS).map(section => ({
    label: section.name,
    route: section.route,
    icon: section.icon,
  }));
}

/**
 * Get settings menu items
 * @returns Array of settings menu items (with optional submenu)
 */
export function getSettingsMenuItems(): SettingsMenuItemOutput[] {
  return Object.values(SETTINGS_MENU).map(item => {
    const menuItem: SettingsMenuItemOutput = {
      id: item.id,
      label: item.name,
      route: item.route,
      icon: item.icon,
      description: item.description,
    };

    // Include submenu if present
    if (item.submenu) {
      menuItem.submenu = item.submenu.map(subitem => ({
        id: subitem.id,
        label: subitem.name,
        route: subitem.route,
        icon: subitem.icon,
        description: subitem.description,
      }));
    }

    return menuItem;
  });
}

/**
 * Build complete navigation structure for navbar
 * @returns Navigation structure { devices: [...], global: [...], settings: [...] }
 */
export function getNavigationStructure(): NavigationStructure {
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
 * @param preferences - User device preferences { deviceId: boolean }
 * @returns Navigation structure { devices: [...], global: [...], settings: [...] }
 */
export function getNavigationStructureWithPreferences(preferences: Record<string, boolean>): NavigationStructure {
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
 * @param pathname - Current route pathname
 * @param deviceId - Device ID to check
 * @returns Boolean indicating if route belongs to device
 */
export function isDeviceRoute(pathname: string, deviceId: string): boolean {
  const device = getDeviceConfig(deviceId);
  if (!device) return false;

  return Object.values(device.routes).some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  );
}

/**
 * Get active device from current pathname
 * @param pathname - Current route pathname
 * @returns Active device ID or null
 */
export function getActiveDevice(pathname: string): string | null {
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
 * @param deviceId - Device ID
 * @param status - Device status object
 * @returns Badge config { text, variant, pulse } or null
 */
export function getDeviceBadge(deviceId: string, status?: Record<string, unknown>): DeviceBadge | null {
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
