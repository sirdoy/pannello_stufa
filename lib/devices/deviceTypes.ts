/**
 * Device Types & Configuration
 * Centralized device registry for the Smart Home Hub
 */

/**
 * Device type constants
 */
export const DEVICE_TYPES = {
  STOVE: 'stove',
  THERMOSTAT: 'thermostat',
  CAMERA: 'camera',
  LIGHTS: 'lights',
  SONOS: 'sonos',
};

/**
 * Display-only items (no routes, no navbar entry)
 * These appear only in dashboard cards, not in navigation
 */
export const DISPLAY_ITEMS = {
  weather: {
    id: 'weather',
    name: 'Meteo',
    icon: '☀️',
    color: 'info',
    type: 'display',
  },
};

/**
 * Device configuration registry
 * Each device has: id, name, icon, color (Tailwind palette), routes, enabled flag
 */
export const DEVICE_CONFIG = {
  [DEVICE_TYPES.STOVE]: {
    id: 'stove',
    name: 'Stufa',
    icon: '🔥',
    color: 'primary',
    enabled: true,
    routes: {
      main: '/stove',
      scheduler: '/stove/scheduler',
      maintenance: '/stove/maintenance',
      errors: '/stove/errors',
    },
    features: {
      hasScheduler: true,
      hasMaintenance: true,
      hasErrors: true,
    },
  },
  [DEVICE_TYPES.THERMOSTAT]: {
    id: 'thermostat',
    name: 'Termostato',
    icon: '🌡️',
    color: 'info',
    enabled: true,
    routes: {
      main: '/thermostat',
      schedule: '/thermostat/schedule',
    },
    features: {
      hasScheduler: true,
      hasMaintenance: false,
      hasErrors: false,
    },
  },
  [DEVICE_TYPES.CAMERA]: {
    id: 'camera',
    name: 'Videocamera',
    icon: '📹',
    color: 'ocean',
    enabled: true,
    routes: {
      main: '/camera',
      events: '/camera/events',
    },
    features: {
      hasScheduler: false,
      hasMaintenance: false,
      hasErrors: false,
      hasSnapshot: true,
      hasEvents: true,
    },
  },
  [DEVICE_TYPES.LIGHTS]: {
    id: 'lights',
    name: 'Luci',
    icon: '💡',
    color: 'warning',
    enabled: true,
    routes: {
      main: '/lights',
      scenes: '/lights/scenes',
      automation: '/lights/automation',
    },
    features: {
      hasScheduler: true,
      hasMaintenance: false,
      hasErrors: false,
      hasColors: true,
      hasBrightness: true,
      hasScenes: true,
      hasRooms: true,
    },
  },
  [DEVICE_TYPES.SONOS]: {
    id: 'sonos',
    name: 'Sonos',
    icon: '🎵',
    color: 'success',
    enabled: true,
    routes: {
      main: '/sonos',
      spotify: '/sonos/spotify',
      zones: '/sonos/zones',
    },
    features: {
      hasScheduler: false,
      hasMaintenance: false,
      hasErrors: false,
      hasSpotify: true,
      hasPlayback: true,
      hasZones: true,
      hasSearch: true,
    },
  },
};

/**
 * Unified registry combining hardware devices and display items
 * Used for dashboard cards configuration
 */
export const ALL_DASHBOARD_ITEMS = {
  ...DEVICE_CONFIG,
  ...DISPLAY_ITEMS,
};

/**
 * Default order for dashboard items (new users)
 * Defines initial order and visibility
 */
export const DEFAULT_DEVICE_ORDER = ['stove', 'thermostat', 'weather', 'lights', 'camera', 'sonos'];

/**
 * Tailwind color mappings for device types
 */
export const DEVICE_COLORS = {
  primary: {
    bg: 'bg-primary-50',
    text: 'text-primary-600',
    border: 'border-primary-200',
    hover: 'hover:bg-primary-100',
    badge: 'bg-primary-500 text-white',
  },
  info: {
    bg: 'bg-info-50',
    text: 'text-info-600',
    border: 'border-info-200',
    hover: 'hover:bg-info-100',
    badge: 'bg-info-500 text-white',
  },
  ocean: {
    bg: 'bg-ocean-50',
    text: 'text-ocean-600',
    border: 'border-ocean-200',
    hover: 'hover:bg-ocean-100',
    badge: 'bg-ocean-500 text-white',
  },
  warning: {
    bg: 'bg-warning-50',
    text: 'text-warning-600',
    border: 'border-warning-200',
    hover: 'hover:bg-warning-100',
    badge: 'bg-warning-500 text-white',
  },
  success: {
    bg: 'bg-success-50',
    text: 'text-success-600',
    border: 'border-success-200',
    hover: 'hover:bg-success-100',
    badge: 'bg-success-500 text-white',
  },
};

/**
 * Global navigation sections
 * Rimosso LOG e CHANGELOG - ora sono nel dropdown Impostazioni
 */
export const GLOBAL_SECTIONS = {
  MONITORING: {
    id: 'monitoring',
    name: 'Monitoring',
    icon: '📊',
    route: '/monitoring',
  },
};

/**
 * Settings menu items (for settings dropdown in navbar)
 */
export const SETTINGS_MENU = {
  SETTINGS: {
    id: 'settings',
    name: 'Impostazioni',
    icon: '⚙️',
    route: '/settings',
    description: 'Aspetto, posizione e dispositivi',
  },
  NOTIFICATIONS: {
    id: 'notifications',
    name: 'Notifiche',
    icon: '🔔',
    route: '/settings/notifications',
    description: 'Preferenze e dispositivi registrati',
  },
  THERMOSTAT: {
    id: 'thermostat',
    name: 'Automazione Stufa',
    icon: '🔥',
    route: '/settings/thermostat',
    description: 'Controllo PID stufa-termostato',
  },
  LOG: {
    id: 'log',
    name: 'Storico',
    icon: '📊',
    route: '/log',
    description: 'Visualizza storico azioni',
  },
  CHANGELOG: {
    id: 'changelog',
    name: 'Changelog',
    icon: 'ℹ️',
    route: '/changelog',
    description: 'Versioni e aggiornamenti',
  },
  DEBUG: {
    id: 'debug',
    name: 'Debug',
    icon: '🐛',
    route: '/debug',
    description: 'Stufa, log, notifiche, transizioni, meteo',
  },
  DESIGN_SYSTEM: {
    id: 'design-system',
    name: 'Design System',
    icon: '🎨',
    route: '/debug/design-system',
    description: 'Documentazione componenti UI',
  },
};
