/**
 * Centralized routes configuration
 * Provides consistent route definitions across the application
 */

// Base API path
const API_BASE = '/api';

// ========================================
// UI ROUTES (Pages)
// ========================================

// Stove UI pages
export const STOVE_UI_ROUTES = {
  main: '/stove',
  scheduler: '/stove/scheduler',
  maintenance: '/stove/maintenance',
  errors: '/stove/errors',
} as const;

// Thermostat UI pages
export const THERMOSTAT_UI_ROUTES = {
  main: '/thermostat',
  authorized: '/thermostat/authorized',
} as const;

// Camera UI pages
export const CAMERA_UI_ROUTES = {
  main: '/camera',
} as const;

// Global UI pages
export const GLOBAL_UI_ROUTES = {
  home: '/',
  log: '/log',
  changelog: '/changelog',
  debug: '/debug',
  offline: '/offline',
} as const;

// ========================================
// API ROUTES
// ========================================

// Stove control endpoints
export const STOVE_ROUTES = {
  status: `${API_BASE}/stove/status`,
  ignite: `${API_BASE}/stove/ignite`,
  shutdown: `${API_BASE}/stove/shutdown`,
  getFan: `${API_BASE}/stove/getFan`,
  getPower: `${API_BASE}/stove/getPower`,
  getRoomTemperature: `${API_BASE}/stove/getRoomTemperature`,
  setFan: `${API_BASE}/stove/setFan`,
  setPower: `${API_BASE}/stove/setPower`,
  getSettings: `${API_BASE}/stove/settings`,
  setSettings: `${API_BASE}/stove/setSettings`,
} as const;

// Scheduler endpoints
export const SCHEDULER_ROUTES = {
  check: (secret: string): string => `${API_BASE}/scheduler/check?secret=${secret}`,
} as const;

// Netatmo endpoints
export const NETATMO_ROUTES = {
  // Auth & topology
  callback: `${API_BASE}/netatmo/callback`,
  disconnect: `${API_BASE}/netatmo/disconnect`,
  homesData: `${API_BASE}/netatmo/homesdata`,
  devices: `${API_BASE}/netatmo/devices`,

  // Status & data
  homeStatus: `${API_BASE}/netatmo/homestatus`,
  temperature: `${API_BASE}/netatmo/temperature`,
  devicesTemperatures: `${API_BASE}/netatmo/devices-temperatures`,
  schedules: `${API_BASE}/netatmo/schedules`,

  // Control
  setRoomThermpoint: `${API_BASE}/netatmo/setroomthermpoint`,
  setThermMode: `${API_BASE}/netatmo/setthermmode`,
  calibrate: `${API_BASE}/netatmo/calibrate`,

  // Stove-valve sync
  stoveSync: `${API_BASE}/netatmo/stove-sync`,
} as const;

// Camera endpoints (Netatmo Security)
export const CAMERA_ROUTES = {
  list: `${API_BASE}/netatmo/camera`,
  allEvents: `${API_BASE}/netatmo/camera/events`,
  snapshot: (cameraId: string): string => `${API_BASE}/netatmo/camera/${encodeURIComponent(cameraId)}/snapshot`,
  events: (cameraId: string): string => `${API_BASE}/netatmo/camera/${encodeURIComponent(cameraId)}/events`,
} as const;

// Logging endpoints
export const LOG_ROUTES = {
  add: `${API_BASE}/log/add`,
} as const;

// User endpoints
export const USER_ROUTES = {
  me: `${API_BASE}/user`,
} as const;

// Auth endpoints (Auth0 v4 - mounted by middleware)
export const AUTH_ROUTES = {
  login: '/auth/login',
  logout: '/auth/logout',
  callback: '/auth/callback',
  me: '/auth/me',
} as const;

// All routes combined for easy export
export const API_ROUTES = {
  stove: STOVE_ROUTES,
  scheduler: SCHEDULER_ROUTES,
  netatmo: NETATMO_ROUTES,
  camera: CAMERA_ROUTES,
  log: LOG_ROUTES,
  user: USER_ROUTES,
  auth: AUTH_ROUTES,
} as const;

export default API_ROUTES;
