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
 * Per CONTEXT.MD:
 * - Full command set: Navigation + Global actions + Device commands
 * - Device command format: Claude's discretion on organization
 * - No recent commands section (per CMDK-05 deferral)
 */

/** Command group */
export interface CommandGroup {
  heading: string;
  items: CommandItem[];
}

/** Command item */
export interface CommandItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
  onSelect: () => void | Promise<void>;
}

/**
 * Execute stove action with error handling
 */
async function executeStoveAction(
  path: string,
  method: string = 'POST',
  body: Record<string, unknown> = {}
): Promise<unknown> {
  try {
    const response = await fetch(path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      ...(method !== 'GET' && {
        body: JSON.stringify({ ...body, source: 'command_palette' }),
      }),
    });
    const data = await response.json();
    if (data.error) console.error(`[CommandPalette] Stove ${path} error:`, data.error);
    return data;
  } catch (err) {
    console.error(`[CommandPalette] Stove ${path} failed:`, err);
  }
}

/**
 * Execute thermostat action with error handling
 */
async function executeThermostatAction(endpoint: string, body: Record<string, unknown> = {}): Promise<unknown> {
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
async function executeLightsAction(endpoint: string, method: string = 'PUT', body: Record<string, unknown> = {}): Promise<unknown> {
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
function getStoveCommands(): CommandGroup {
  return {
    heading: 'Stufa',
    items: [
      {
        id: 'stove-ignite',
        label: 'Accendi Stufa',
        icon: <Power className="w-4 h-4" />,
        shortcut: '⌘⇧S',
        onSelect: async () => { await executeStoveAction('/api/v1/thermorossi/commands/ignit'); },
      },
      {
        id: 'stove-shutdown',
        label: 'Spegni Stufa',
        icon: <PowerOff className="w-4 h-4" />,
        onSelect: async () => { await executeStoveAction('/api/v1/thermorossi/commands/shutdown'); },
      },
      {
        id: 'stove-power-up',
        label: 'Aumenta Potenza Stufa',
        icon: <Plus className="w-4 h-4" />,
        onSelect: async () => {
          try {
            const statusRes = await fetch('/api/v1/thermorossi/power');
            if (!statusRes.ok) return;
            const statusData = await statusRes.json();
            const currentPower = statusData?.power_level ?? 3;
            if (currentPower < 5) {
              await executeStoveAction(
                '/api/v1/thermorossi/settings/power',
                'POST',
                { value: currentPower + 1 }
              );
            }
          } catch (err) {
            console.error('[CommandPalette] stove-power-up failed:', err);
          }
        },
      },
      {
        id: 'stove-power-down',
        label: 'Diminuisci Potenza Stufa',
        icon: <Minus className="w-4 h-4" />,
        onSelect: async () => {
          try {
            const statusRes = await fetch('/api/v1/thermorossi/power');
            if (!statusRes.ok) return;
            const statusData = await statusRes.json();
            const currentPower = statusData?.power_level ?? 3;
            if (currentPower > 1) {
              await executeStoveAction(
                '/api/v1/thermorossi/settings/power',
                'POST',
                { value: currentPower - 1 }
              );
            }
          } catch (err) {
            console.error('[CommandPalette] stove-power-down failed:', err);
          }
        },
      },
      {
        id: 'stove-fan-up',
        label: 'Aumenta Ventola Stufa',
        icon: <Fan className="w-4 h-4" />,
        onSelect: async () => {
          try {
            const statusRes = await fetch('/api/v1/thermorossi/fan-level');
            if (!statusRes.ok) return;
            const statusData = await statusRes.json();
            const currentFan = statusData?.fan_level ?? 3;
            if (currentFan < 6) {
              await executeStoveAction(
                '/api/v1/thermorossi/settings/fan-level',
                'POST',
                { value: currentFan + 1 }
              );
            }
          } catch (err) {
            console.error('[CommandPalette] stove-fan-up failed:', err);
          }
        },
      },
      {
        id: 'stove-fan-down',
        label: 'Diminuisci Ventola Stufa',
        icon: <Fan className="w-4 h-4" />,
        onSelect: async () => {
          try {
            const statusRes = await fetch('/api/v1/thermorossi/fan-level');
            if (!statusRes.ok) return;
            const statusData = await statusRes.json();
            const currentFan = statusData?.fan_level ?? 3;
            if (currentFan > 1) {
              await executeStoveAction(
                '/api/v1/thermorossi/settings/fan-level',
                'POST',
                { value: currentFan - 1 }
              );
            }
          } catch (err) {
            console.error('[CommandPalette] stove-fan-down failed:', err);
          }
        },
      },
    ],
  };
}

/**
 * Get thermostat commands
 */
function getThermostatCommands(): CommandGroup {
  return {
    heading: 'Termostato',
    items: [
      {
        id: 'thermo-mode-schedule',
        label: 'Modalita Automatica',
        icon: <Calendar className="w-4 h-4" />,
        onSelect: async () => { await executeThermostatAction('set-therm-mode', { mode: 'schedule' }); },
      },
      {
        id: 'thermo-mode-away',
        label: 'Modalita Away',
        icon: <Home className="w-4 h-4" />,
        onSelect: async () => { await executeThermostatAction('set-therm-mode', { mode: 'away' }); },
      },
      {
        id: 'thermo-mode-hg',
        label: 'Modalita Antigelo',
        icon: <Snowflake className="w-4 h-4" />,
        onSelect: async () => { await executeThermostatAction('set-therm-mode', { mode: 'hg' }); },
      },
      {
        id: 'thermo-temp-up',
        label: 'Aumenta Temperatura (+0.5C)',
        icon: <Plus className="w-4 h-4" />,
        shortcut: '⌘↑',
        // Note: This requires knowing which room is selected - show info toast
        onSelect: () => {
          window.location.href = '/thermostat';
        },
      },
      {
        id: 'thermo-temp-down',
        label: 'Diminuisci Temperatura (-0.5C)',
        icon: <Minus className="w-4 h-4" />,
        shortcut: '⌘↓',
        onSelect: () => {
          window.location.href = '/thermostat';
        },
      },
    ],
  };
}

/**
 * Get lights commands
 */
function getLightsCommands(): CommandGroup {
  return {
    heading: 'Luci',
    items: [
      {
        id: 'lights-all-on',
        label: 'Accendi Tutte le Luci',
        icon: <Lightbulb className="w-4 h-4" />,
        shortcut: '⌘⇧L',
        onSelect: async () => {
          try {
            // Get all rooms and toggle each
            const roomsRes = await fetch('/api/hue/rooms');
            if (!roomsRes.ok) return;
            const roomsData = await roomsRes.json();
            const rooms = roomsData.rooms || [];

            for (const room of rooms) {
              const groupedLightId = room.services?.find((s: { rtype?: string; rid?: string }) => s.rtype === 'grouped_light')?.rid;
              if (groupedLightId) {
                await executeLightsAction(`rooms/${groupedLightId}`, 'PUT', { on: { on: true } });
              }
            }
          } catch (err) {
            console.error('[CommandPalette] lights-all-on failed:', err);
          }
        },
      },
      {
        id: 'lights-all-off',
        label: 'Spegni Tutte le Luci',
        icon: <Moon className="w-4 h-4" />,
        onSelect: async () => {
          try {
            const roomsRes = await fetch('/api/hue/rooms');
            if (!roomsRes.ok) return;
            const roomsData = await roomsRes.json();
            const rooms = roomsData.rooms || [];

            for (const room of rooms) {
              const groupedLightId = room.services?.find((s: { rtype?: string; rid?: string }) => s.rtype === 'grouped_light')?.rid;
              if (groupedLightId) {
                await executeLightsAction(`rooms/${groupedLightId}`, 'PUT', { on: { on: false } });
              }
            }
          } catch (err) {
            console.error('[CommandPalette] lights-all-off failed:', err);
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
export function getDeviceCommands(): CommandGroup[] {
  return [
    getStoveCommands(),
    getThermostatCommands(),
    getLightsCommands(),
  ];
}
