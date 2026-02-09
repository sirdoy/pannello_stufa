/**
 * Netatmo Service Layer
 * Manages Netatmo state in Firebase and provides high-level functions
 * Uses environment-specific namespaces (dev/ for localhost, root for production)
 */

import { db } from '@/lib/firebase';
import { ref, get, set, update } from 'firebase/database';
import { getEnvironmentPath } from '@/lib/environmentHelper';

// ============================================================================
// FIREBASE STATE MANAGEMENT
// ============================================================================

/**
 * Get refresh token from Firebase
 */
export async function getRefreshToken(): Promise<string | null> {
  const snapshot = await get(ref(db, getEnvironmentPath('netatmo/refresh_token')));
  return snapshot.exists() ? snapshot.val() : null;
}

/**
 * Save refresh token to Firebase
 */
export async function saveRefreshToken(token: string): Promise<void> {
  await set(ref(db, getEnvironmentPath('netatmo/refresh_token')), token);
}

/**
 * Get home_id from Firebase
 */
export async function getHomeId(): Promise<string | null> {
  const snapshot = await get(ref(db, getEnvironmentPath('netatmo/home_id')));
  return snapshot.exists() ? snapshot.val() : null;
}

/**
 * Save home_id to Firebase
 */
export async function saveHomeId(homeId: string): Promise<void> {
  await set(ref(db, getEnvironmentPath('netatmo/home_id')), homeId);
}

/**
 * Get topology from Firebase
 */
export async function getTopology(): Promise<unknown> {
  const snapshot = await get(ref(db, getEnvironmentPath('netatmo/topology')));
  return snapshot.exists() ? snapshot.val() : null;
}

/**
 * Save complete topology to Firebase
 */
export async function saveTopology(topology: any) {
  await set(ref(db, getEnvironmentPath('netatmo/topology')), {
    ...topology,
    updated_at: Date.now(),
  });
}

/**
 * Get current status from Firebase
 */
export async function getCurrentStatus(): Promise<any> {
  const snapshot = await get(ref(db, getEnvironmentPath('netatmo/currentStatus')));
  return snapshot.exists() ? snapshot.val() : null;
}

/**
 * Save current status to Firebase
 */
export async function saveCurrentStatus(status: any) {
  await set(ref(db, getEnvironmentPath('netatmo/currentStatus')), {
    ...status,
    updated_at: Date.now(),
  });
}

/**
 * Get device config (device_id, module_id) from Firebase
 */
export async function getDeviceConfig(): Promise<any> {
  const snapshot = await get(ref(db, getEnvironmentPath('netatmo/deviceConfig')));
  return snapshot.exists() ? snapshot.val() : null;
}

/**
 * Save device config to Firebase
 */
export async function saveDeviceConfig(deviceId: string, moduleId: string) {
  await set(ref(db, getEnvironmentPath('netatmo/deviceConfig')), {
    device_id: deviceId,
    module_id: moduleId,
  });
}

// ============================================================================
// AUTOMATION RULES
// ============================================================================

/**
 * Get automation rules from Firebase
 */
export async function getAutomationRules(): Promise<any> {
  const snapshot = await get(ref(db, getEnvironmentPath('netatmo/automation')));
  return snapshot.exists() ? snapshot.val() : null;
}

/**
 * Save automation rule
 * Rule structure: {
 *   id, name, enabled, trigger, conditions, actions
 * }
 */
export async function saveAutomationRule(ruleId: string, rule: any) {
  await set(ref(db, getEnvironmentPath(`netatmo/automation/${ruleId}`)), {
    ...rule,
    updated_at: Date.now(),
  });
}

/**
 * Delete automation rule
 */
export async function deleteAutomationRule(ruleId: string) {
  await set(ref(db, getEnvironmentPath(`netatmo/automation/${ruleId}`)), null);
}

/**
 * Toggle automation rule
 */
export async function toggleAutomationRule(ruleId: string, enabled: boolean) {
  await update(ref(db, getEnvironmentPath(`netatmo/automation/${ruleId}`)), {
    enabled,
    updated_at: Date.now(),
  });
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if Netatmo is connected
 */
export async function isConnected(): Promise<boolean> {
  const refreshToken = await getRefreshToken();
  const homeId = await getHomeId();
  return !!(refreshToken && homeId);
}

/**
 * Firebase Netatmo home data shape
 */
interface NetatmoHomeData {
  rooms?: Array<Record<string, unknown>>;
  modules?: Array<Record<string, unknown>>;
}

/**
 * Get room by ID from topology
 */
export async function getRoomById(roomId: string) {
  const topology = await getTopology() as NetatmoHomeData | null;
  if (!topology?.rooms) return null;
  return topology.rooms.find((r: any) => r.id === roomId);
}

/**
 * Get module by ID from topology
 */
export async function getModuleById(moduleId: string) {
  const topology = await getTopology() as NetatmoHomeData | null;
  if (!topology?.modules) return null;
  return topology.modules.find((m: any) => m.id === moduleId);
}

/**
 * Get all rooms with current temperatures
 */
export async function getRoomsWithTemperatures() {
  const topology = await getTopology() as NetatmoHomeData | null;
  const status = await getCurrentStatus() as NetatmoHomeData | null;

  if (!topology?.rooms || !status?.rooms) return [];

  return topology.rooms.map((room: any) => {
    const roomStatus = status.rooms?.find((r: any) => r.room_id === room.id);
    return {
      ...room,
      temperature: roomStatus?.temperature as number | undefined,
      setpoint: roomStatus?.setpoint as number | undefined,
      mode: roomStatus?.mode,
      heating: roomStatus?.heating,
    };
  });
}

/**
 * Get rooms that need heating (temperature < setpoint)
 */
export async function getRoomsNeedingHeating() {
  const rooms = await getRoomsWithTemperatures();
  return rooms.filter((room: any) => {
    if (!room.temperature || !room.setpoint) return false;
    return room.temperature < room.setpoint - 0.5; // 0.5°C threshold
  });
}

/**
 * Check if any room is actively heating
 */
export async function isAnyRoomHeating() {
  const status = await getCurrentStatus();
  if (!status?.rooms) return false;
  return status.rooms.some((room: any) => room.heating);
}

/**
 * Get average temperature across all rooms
 */
export async function getAverageTemperature() {
  const rooms = await getRoomsWithTemperatures();
  const temps = rooms.map((r: any) => r.temperature as number | undefined).filter((t): t is number => t !== undefined);
  if (temps.length === 0) return null;
  return temps.reduce((sum, t) => sum + t, 0) / temps.length;
}

// ============================================================================
// LOGGING HELPERS
// ============================================================================

/**
 * Log Netatmo action to Firebase
 */
export async function logNetatmoAction(action: string, details: any, user: any) {
  const { push, ref: dbRef } = await import('firebase/database');

  const logEntry = {
    action: `netatmo_${action}`,
    ...details,
    timestamp: Date.now(),
    user: user ? {
      email: user.email,
      name: user.name,
      picture: user.picture,
      sub: user.sub,
    } : null,
    source: 'manual',
  };

  await push(dbRef(db, 'log'), logEntry);
}

// ============================================================================
// EXPORTS
// ============================================================================

const NETATMO_SERVICE = {
  // State
  getRefreshToken,
  saveRefreshToken,
  getHomeId,
  saveHomeId,
  getTopology,
  saveTopology,
  getCurrentStatus,
  saveCurrentStatus,
  getDeviceConfig,
  saveDeviceConfig,

  // Automation
  getAutomationRules,
  saveAutomationRule,
  deleteAutomationRule,
  toggleAutomationRule,

  // Helpers
  isConnected,
  getRoomById,
  getModuleById,
  getRoomsWithTemperatures,
  getRoomsNeedingHeating,
  isAnyRoomHeating,
  getAverageTemperature,

  // Logging
  logNetatmoAction,
};

export default NETATMO_SERVICE;
