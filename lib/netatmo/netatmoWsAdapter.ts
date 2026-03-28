/**
 * Netatmo WebSocket Payload Adapter
 *
 * Standalone pure function that normalises the raw `Record<string, unknown>`
 * WS payload from the `netatmo` topic into the existing NetatmoStatus shape
 * used by useThermostatData.
 *
 * Decision D-19: adapter is a standalone module (not inlined in the hook)
 * so it can be independently unit-tested.
 */

import type {
  NetatmoStatus,
  RoomStatus,
  ModuleStatus,
  NetatmoModule,
} from '@/app/components/devices/thermostat/hooks/useThermostatData';

/**
 * Adapts a raw Netatmo WS payload (homestatus envelope) to NetatmoStatus.
 *
 * Field mapping (D-05):
 *   therm_measured_temperature -> temperature
 *   therm_setpoint_temperature -> setpoint
 *   therm_setpoint_mode        -> mode
 *   heating_power_request > 0  -> heating (boolean)
 *   id (room)                  -> room_id
 *
 * @param raw - Raw WS message data (Record<string, unknown> or null/undefined)
 * @returns NetatmoStatus if payload is valid, null otherwise (D-06)
 */
export function adaptNetatmoWsPayload(raw: Record<string, unknown>): NetatmoStatus | null {
  // D-06: null/falsy payload guard
  if (!raw || typeof raw !== 'object') return null;

  const body = raw['body'] as Record<string, unknown> | undefined;
  if (!body || typeof body !== 'object') return null;

  const home = body['home'] as Record<string, unknown> | undefined;
  if (!home || typeof home !== 'object') return null;

  const wsRooms = Array.isArray(home['rooms'])
    ? (home['rooms'] as Record<string, unknown>[])
    : [];
  const wsModules = Array.isArray(home['modules'])
    ? (home['modules'] as Record<string, unknown>[])
    : [];

  // D-05: field mapping for rooms
  const rooms: RoomStatus[] = wsRooms.map(r => ({
    room_id: String(r['id'] ?? ''),
    temperature: r['therm_measured_temperature'] as number | undefined,
    setpoint: r['therm_setpoint_temperature'] as number | undefined,
    mode: r['therm_setpoint_mode'] as string | undefined,
    heating: ((r['heating_power_request'] as number | undefined) ?? 0) > 0,
  }));

  // Module fields pass through with normalised types
  const modules: ModuleStatus[] = wsModules.map(m => ({
    id: String(m['id'] ?? ''),
    type: m['type'] as string | undefined,
    name: m['name'] as string | undefined,
    battery_state: m['battery_state'] as string | undefined,
    battery_level: m['battery_level'] as number | undefined,
    reachable: m['reachable'] as boolean | undefined,
    rf_strength: m['rf_strength'] as number | undefined,
  }));

  // Battery health flags
  const lowBatteryModules: NetatmoModule[] = modules
    .filter(m => m.battery_state === 'low' || m.battery_state === 'very_low')
    .map(m => ({
      id: m.id,
      type: m.type ?? '',
      name: m.name,
      battery_state: m.battery_state,
      battery_level: m.battery_level,
      reachable: m.reachable,
      rf_strength: m.rf_strength,
    }));

  return {
    rooms,
    modules,
    hasLowBattery: lowBatteryModules.length > 0,
    hasCriticalBattery: modules.some(m => m.battery_state === 'very_low'),
    lowBatteryModules,
  };
}
