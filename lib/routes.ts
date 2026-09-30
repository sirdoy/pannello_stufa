/**
 * Centralized routes configuration
 * Provides consistent route definitions across the application
 */

// Base API path
const API_BASE = '/api';

// ========================================
// UI ROUTES (Pages)
// ========================================

// ========================================
// API ROUTES
// ========================================

// Stove control endpoints
export const STOVE_ROUTES = {
  status: `${API_BASE}/v1/thermorossi/status`,
  ignite: `${API_BASE}/v1/thermorossi/commands/ignit`,
  shutdown: `${API_BASE}/v1/thermorossi/commands/shutdown`,
  getFan: `${API_BASE}/v1/thermorossi/fan-level`,
  getPower: `${API_BASE}/v1/thermorossi/power`,
  setFan: `${API_BASE}/v1/thermorossi/settings/fan-level`,
  setPower: `${API_BASE}/v1/thermorossi/settings/power`,
} as const;

// Netatmo endpoints
export const NETATMO_ROUTES = {
  // Topology
  homesData: `${API_BASE}/v1/netatmo/homesdata`,

  // Status & data
  homeStatus: `${API_BASE}/v1/netatmo/homestatus`,
  // schedules key removed — v1 schedules are embedded in homesdata.body.homes[0].schedules
  // (see lib/hooks/useScheduleData.ts rewrite in Phase 168 Plan 02)
  switchHomeSchedule: `${API_BASE}/v1/netatmo/switchhomeschedule`,

  // Control
  setRoomThermpoint: `${API_BASE}/v1/netatmo/setroomthermpoint`,
  setThermMode: `${API_BASE}/v1/netatmo/setthermmode`,
} as const;

// Camera endpoints (Netatmo Security)
export const CAMERA_ROUTES = {
  status: `${API_BASE}/v1/netatmo/camera/status`,
  allEvents: `${API_BASE}/v1/netatmo/camera/events`,
  // monitoring now requires cameraId in path (v1 shape) — CONSUMERS MUST CALL IT AS A FUNCTION
  // Previously: monitoring: string (bare constant). Now: monitoring(cameraId).
  monitoring: (cameraId: string): string =>
    `${API_BASE}/v1/netatmo/camera/${encodeURIComponent(cameraId)}/monitoring`,
  // stream + snapshot: path-segment shape (query-param legacy was a Turbopack workaround that v1 does NOT require).
  stream: (cameraId: string): string =>
    `${API_BASE}/v1/netatmo/camera/${encodeURIComponent(cameraId)}/stream`,
  snapshot: (cameraId: string): string =>
    `${API_BASE}/v1/netatmo/camera/${encodeURIComponent(cameraId)}/snapshot`,
  eventSnapshot: (eventId: string): string =>
    `${API_BASE}/v1/netatmo/camera/events/${encodeURIComponent(eventId)}/snapshot`,
} as const;

// Logging endpoints
export const LOG_ROUTES = {
  add: `${API_BASE}/log/add`,
} as const;
