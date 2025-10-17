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
};

// Thermostat UI pages
export const THERMOSTAT_UI_ROUTES = {
  main: '/thermostat',
  authorized: '/thermostat/authorized',
};

// Global UI pages
export const GLOBAL_UI_ROUTES = {
  home: '/',
  log: '/log',
  changelog: '/changelog',
  debug: '/debug',
  offline: '/offline',
};

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
};

// Scheduler endpoints
export const SCHEDULER_ROUTES = {
  check: (secret) => `${API_BASE}/scheduler/check?secret=${secret}`,
};

// Netatmo endpoints
export const NETATMO_ROUTES = {
  // Auth & topology
  callback: `${API_BASE}/netatmo/callback`,
  homesData: `${API_BASE}/netatmo/homesdata`,
  devices: `${API_BASE}/netatmo/devices`,

  // Status & data
  homeStatus: `${API_BASE}/netatmo/homestatus`,
  temperature: `${API_BASE}/netatmo/temperature`,
  devicesTemperatures: `${API_BASE}/netatmo/devices-temperatures`,

  // Control
  setRoomThermpoint: `${API_BASE}/netatmo/setroomthermpoint`,
  setThermMode: `${API_BASE}/netatmo/setthermmode`,
};

// Logging endpoints
export const LOG_ROUTES = {
  add: `${API_BASE}/log/add`,
};

// User endpoints
export const USER_ROUTES = {
  me: `${API_BASE}/user`,
};

// Auth endpoints
export const AUTH_ROUTES = {
  login: '/api/auth/login',
  logout: '/api/auth/logout',
  callback: '/api/auth/callback',
  me: '/api/auth/me',
};

// All routes combined for easy export
export const API_ROUTES = {
  stove: STOVE_ROUTES,
  scheduler: SCHEDULER_ROUTES,
  netatmo: NETATMO_ROUTES,
  log: LOG_ROUTES,
  user: USER_ROUTES,
  auth: AUTH_ROUTES,
};

export default API_ROUTES;