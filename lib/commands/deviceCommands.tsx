'use client';

import {
  Power,
  PowerOff,
  Plus,
  Minus,
  Calendar,
  Home,
  Snowflake,
  Lightbulb,
  Sun,
  Moon,
  Fan,
} from 'lucide-react';

/**
 * Device Commands for Command Palette
 *
 * Per CONTEXT.md:
 * - Full command set: Navigation + Global actions + Device commands
 * - Device command format: Claude's discretion on organization
 * - No recent commands section (per CMDK-05 deferral)
 */

/**
 * Execute stove action with error handling
 */
async function executeStoveAction(endpoint, body = {}) {
  try {
    const response = await fetch(`/api/stove/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, source: 'command_palette' }),
    });
    const data = await response.json();
    if (data.error) {
      console.error(`[CommandPalette] Stove ${endpoint} error:`, data.error);
    }
    return data;
  } catch (err) {
    console.error(`[CommandPalette] Stove ${endpoint} failed:`, err);
  }
}

/**
 * Execute thermostat action with error handling
 */
async function executeThermostatAction(endpoint, body = {}) {
  try {
    const response = await fetch(`/api/netatmo/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (data.error) {
      console.error(`[CommandPalette] Thermostat ${endpoint} error:`, data.error);
    }
    return data;
  } catch (err) {
    console.error(`[CommandPalette] Thermostat ${endpoint} failed:`, err);
  }
}

/**
 * Execute lights action with error handling
 */
async function executeLightsAction(endpoint, method = 'PUT', body = {}) {
  try {
    const response = await fetch(`/api/hue/${endpoint}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      ...(method !== 'GET' && { body: JSON.stringify(body) }),
    });
    const data = await response.json();
    if (data.error) {
      console.error(`[CommandPalette] Lights ${endpoint} error:`, data.error);
    }
    return data;
  } catch (err) {
    console.error(`[CommandPalette] Lights ${endpoint} failed:`, err);
  }
}

/**
 * Get stove commands
 */
export function getStoveCommands() {
  return {
    heading: 'Stufa',
    items: [
      {
        id: 'stove-ignite',
        label: 'Accendi Stufa',
        icon: <Power className="w-4 h-4" />,
        shortcut: '⌘⇧S',
        onSelect: () => executeStoveAction('ignite'),
      },
      {
        id: 'stove-shutdown',
        label: 'Spegni Stufa',
        icon: <PowerOff className="w-4 h-4" />,
        onSelect: () => executeStoveAction('shutdown'),
      },
      {
        id: 'stove-power-up',
        label: 'Aumenta Potenza Stufa',
        icon: <Plus className="w-4 h-4" />,
        onSelect: async () => {
          // Get current power level first
          const statusRes = await fetch('/api/stove/get-power');
          const statusData = await statusRes.json();
          const currentPower = statusData?.Result ?? 3;
          if (currentPower < 5) {
            await executeStoveAction('set-power', { level: currentPower + 1 });
          }
        },
      },
      {
        id: 'stove-power-down',
        label: 'Diminuisci Potenza Stufa',
        icon: <Minus className="w-4 h-4" />,
        onSelect: async () => {
          const statusRes = await fetch('/api/stove/get-power');
          const statusData = await statusRes.json();
          const currentPower = statusData?.Result ?? 3;
          if (currentPower > 1) {
            await executeStoveAction('set-power', { level: currentPower - 1 });
          }
        },
      },
      {
        id: 'stove-fan-up',
        label: 'Aumenta Ventola Stufa',
        icon: <Fan className="w-4 h-4" />,
        onSelect: async () => {
          const statusRes = await fetch('/api/stove/get-fan');
          const statusData = await statusRes.json();
          const currentFan = statusData?.Result ?? 3;
          if (currentFan < 6) {
            await executeStoveAction('set-fan', { level: currentFan + 1 });
          }
        },
      },
      {
        id: 'stove-fan-down',
        label: 'Diminuisci Ventola Stufa',
        icon: <Fan className="w-4 h-4" />,
        onSelect: async () => {
          const statusRes = await fetch('/api/stove/get-fan');
          const statusData = await statusRes.json();
          const currentFan = statusData?.Result ?? 3;
          if (currentFan > 1) {
            await executeStoveAction('set-fan', { level: currentFan - 1 });
          }
        },
      },
    ],
  };
}

/**
 * Get thermostat commands
 */
export function getThermostatCommands() {
  return {
    heading: 'Termostato',
    items: [
      {
        id: 'thermo-mode-schedule',
        label: 'Modalita Automatica',
        icon: <Calendar className="w-4 h-4" />,
        onSelect: () => executeThermostatAction('set-therm-mode', { mode: 'schedule' }),
      },
      {
        id: 'thermo-mode-away',
        label: 'Modalita Away',
        icon: <Home className="w-4 h-4" />,
        onSelect: () => executeThermostatAction('set-therm-mode', { mode: 'away' }),
      },
      {
        id: 'thermo-mode-hg',
        label: 'Modalita Antigelo',
        icon: <Snowflake className="w-4 h-4" />,
        onSelect: () => executeThermostatAction('set-therm-mode', { mode: 'hg' }),
      },
      {
        id: 'thermo-temp-up',
        label: 'Aumenta Temperatura (+0.5C)',
        icon: <Plus className="w-4 h-4" />,
        shortcut: '⌘↑',
        // Note: This requires knowing which room is selected - show info toast
        onSelect: () => {
          console.log('[CommandPalette] Temperature adjustment requires room selection - navigate to thermostat page');
          window.location.href = '/thermostat';
        },
      },
      {
        id: 'thermo-temp-down',
        label: 'Diminuisci Temperatura (-0.5C)',
        icon: <Minus className="w-4 h-4" />,
        shortcut: '⌘↓',
        onSelect: () => {
          console.log('[CommandPalette] Temperature adjustment requires room selection - navigate to thermostat page');
          window.location.href = '/thermostat';
        },
      },
    ],
  };
}

/**
 * Get lights commands
 */
export function getLightsCommands() {
  return {
    heading: 'Luci',
    items: [
      {
        id: 'lights-all-on',
        label: 'Accendi Tutte le Luci',
        icon: <Lightbulb className="w-4 h-4" />,
        shortcut: '⌘⇧L',
        onSelect: async () => {
          // Get all rooms and toggle each
          const roomsRes = await fetch('/api/hue/rooms');
          const roomsData = await roomsRes.json();
          const rooms = roomsData.rooms || [];

          for (const room of rooms) {
            const groupedLightId = room.services?.find(s => s.rtype === 'grouped_light')?.rid;
            if (groupedLightId) {
              await executeLightsAction(`rooms/${groupedLightId}`, 'PUT', { on: { on: true } });
            }
          }
        },
      },
      {
        id: 'lights-all-off',
        label: 'Spegni Tutte le Luci',
        icon: <Moon className="w-4 h-4" />,
        onSelect: async () => {
          const roomsRes = await fetch('/api/hue/rooms');
          const roomsData = await roomsRes.json();
          const rooms = roomsData.rooms || [];

          for (const room of rooms) {
            const groupedLightId = room.services?.find(s => s.rtype === 'grouped_light')?.rid;
            if (groupedLightId) {
              await executeLightsAction(`rooms/${groupedLightId}`, 'PUT', { on: { on: false } });
            }
          }
        },
      },
      {
        id: 'lights-brightness-up',
        label: 'Aumenta Luminosita',
        icon: <Sun className="w-4 h-4" />,
        onSelect: () => {
          // Room-specific - navigate
          window.location.href = '/lights';
        },
      },
    ],
  };
}

/**
 * Get all device commands combined
 */
export function getDeviceCommands() {
  return [
    getStoveCommands(),
    getThermostatCommands(),
    getLightsCommands(),
  ];
}

export default getDeviceCommands;
