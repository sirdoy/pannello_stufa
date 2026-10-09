/**
 * Device Registry Service
 * Helper functions for device management and navigation
 */

import type { DeviceConfig, DeviceTypeId, DeviceColor } from './deviceTypes';
import { DEVICE_TYPES, DEVICE_CONFIG, GLOBAL_SECTIONS, SETTINGS_MENU } from './deviceTypes';

/** Navigation item */
interface NavItem {
  label: string;
  route: string;
  items?: { label: string; route: string }[];
}

/** Device navigation structure */
interface DeviceNav {
  id: DeviceTypeId;
  name: string;
  color: DeviceColor;
  items: NavItem[];
}

/** Settings menu item with optional submenu */
interface SettingsMenuItemOutput {
  id: string;
  label: string;
  route: string;
  description: string;
  submenu?: SettingsMenuItemOutput[];
}

/** Complete navigation structure */
interface NavigationStructure {
  devices: DeviceNav[];
  global: NavItem[];
  settings: SettingsMenuItemOutput[];
}

/**
 * Get device configuration by ID
 * @param deviceId - Device ID (from DEVICE_TYPES)
 * @returns Device config or null if not found
 */
function getDeviceConfig(deviceId: string): DeviceConfig | null {
  return DEVICE_CONFIG[deviceId as DeviceTypeId] || null;
}

/**
 * Get device navigation items (routes)
 * @param deviceId - Device ID
 * @returns Array of navigation items with { label, route }
 */
function getDeviceNavItems(deviceId: string): NavItem[] {
  const device = getDeviceConfig(deviceId);
  if (!device) return [];

  const navItems: NavItem[] = [
    { label: 'Controllo', route: device.routes.main! },
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
    if (route) {
      const label = key.charAt(0).toUpperCase() + key.slice(1);
      const validRoute: string = route;
      navItems.push({ label, route: validRoute });
    }
  });

  return navItems;
}

/**
 * Get global navigation sections (Log, Changelog, etc.)
 * @returns Array of global nav items
 */
function getGlobalNavItems(): NavItem[] {
  return Object.values(GLOBAL_SECTIONS).map(section => ({
    label: section.name,
    route: section.route,
    ...(section.items ? { items: section.items } : {}),
  }));
}

/**
 * Get settings menu items
 * @returns Array of settings menu items (with optional submenu)
 */
function getSettingsMenuItems(): SettingsMenuItemOutput[] {
  return Object.values(SETTINGS_MENU).map(item => {
    const menuItem: SettingsMenuItemOutput = {
      id: item.id,
      label: item.name,
      route: item.route,
      description: item.description,
    };

    // Include submenu if present
    if (item.submenu) {
      menuItem.submenu = item.submenu.map(subitem => ({
        id: subitem.id,
        label: subitem.name,
        route: subitem.route,
        description: subitem.description,
      }));
    }

    return menuItem;
  });
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
    color: device.color,
    items: getDeviceNavItems(device.id),
  }));

  const global = getGlobalNavItems();
  const settings = getSettingsMenuItems();

  return { devices, global, settings };
}

