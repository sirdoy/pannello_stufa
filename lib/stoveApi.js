/**
 * Thermorossi WiNetStove Cloud API
 *
 * Base URL: https://wsthermorossi.cloudwinet.it/WiNetStove.svc/json
 *
 * Available Endpoints:
 * - GetRoomControlTemperature/[apikey] - Get target room temperature setpoint
 * - GetFanLevel/[apikey] - Get current fan level (1-6)
 * - GetPower/[apikey] - Get current power level (0-5)
 * - GetStatus/[apikey] - Get stove operational status
 * - SetFanLevel/[apikey];[1-6] - Set fan level
 * - SetPower/[apikey];[0-5] - Set power level
 * - Ignit/[apikey] - Turn on the stove
 * - Shutdown/[apikey] - Turn off the stove
 *
 * SANDBOX MODE:
 * In localhost, se sandbox è abilitato, tutte le chiamate API vengono
 * intercettate e reindirizzate al sandboxService per simulazione locale.
 *
 * @type {string}
 */
export const API_KEY = 'bdb58f63-117e-4753-bb0f-0487f2f14e52';

// Import sandbox service per intercettazione chiamate in localhost
import {
  isSandboxEnabled,
  getSandboxStoveState,
  sandboxIgnite,
  sandboxShutdown,
  sandboxSetPower,
  sandboxSetFan,
  isLocalEnvironment,
} from './sandboxService';

const BASE_URL = 'https://wsthermorossi.cloudwinet.it/WiNetStove.svc/json';

/**
 * Default timeout for stove API requests (10 seconds)
 */
export const DEFAULT_TIMEOUT = 10000;

/**
 * Fetch with timeout
 * @param {string} url - URL to fetch
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<Response>}
 */
export async function fetchWithTimeout(url, timeout = DEFAULT_TIMEOUT) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('STOVE_TIMEOUT');
    }
    throw error;
  }
}

/**
 * Thermorossi Cloud API endpoints (URL diretti - usare le wrapper functions sotto)
 */
export const STUFA_API = {
  // Control endpoints
  ignite: `${BASE_URL}/Ignit/${API_KEY}`,
  shutdown: `${BASE_URL}/Shutdown/${API_KEY}`,

  // Getter endpoints
  getStatus: `${BASE_URL}/GetStatus/${API_KEY}`,
  getFan: `${BASE_URL}/GetFanLevel/${API_KEY}`,
  getPower: `${BASE_URL}/GetPower/${API_KEY}`,
  getRoomTemperature: `${BASE_URL}/GetRoomControlTemperature/${API_KEY}`,

  // Setter endpoints (function-based for parameters)
  setFan: (level) => `${BASE_URL}/SetFanLevel/${API_KEY};${level}`,
  setPower: (level) => `${BASE_URL}/SetPower/${API_KEY};${level}`,
};

/**
 * WRAPPER FUNCTIONS - Con supporto Sandbox Mode
 *
 * Queste funzioni intercettano le chiamate e le reindirizzano al sandbox
 * se abilitato in localhost, altrimenti chiamano le API reali.
 */

/**
 * Get stove status - con supporto sandbox
 */
export async function getStoveStatus() {
  // Check sandbox mode
  if (isLocalEnvironment()) {
    const sandboxEnabled = await isSandboxEnabled();
    if (sandboxEnabled) {
      const state = await getSandboxStoveState();

      // Converti formato sandbox in formato API Thermorossi
      const response = {
        StatusDescription: state.status,
        isSandbox: true,
      };

      // Aggiungi errore se presente
      if (state.error) {
        response.Error = parseInt(state.error.code.replace('AL', '')) || 1;
        response.ErrorDescription = state.error.description;
      } else {
        response.Error = 0;
        response.ErrorDescription = '';
      }

      return response;
    }
  }

  // Chiamata API reale
  const response = await fetchWithTimeout(STUFA_API.getStatus);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  return { ...data, isSandbox: false };
}

/**
 * Ignite stove - con supporto sandbox
 */
export async function igniteStove(power = 3) {
  // Check sandbox mode
  if (isLocalEnvironment()) {
    const sandboxEnabled = await isSandboxEnabled();
    if (sandboxEnabled) {
      return await sandboxIgnite(power);
    }
  }

  // Chiamata API reale
  const response = await fetchWithTimeout(STUFA_API.ignite);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}

/**
 * Shutdown stove - con supporto sandbox
 */
export async function shutdownStove() {
  // Check sandbox mode
  if (isLocalEnvironment()) {
    const sandboxEnabled = await isSandboxEnabled();
    if (sandboxEnabled) {
      return await sandboxShutdown();
    }
  }

  // Chiamata API reale
  const response = await fetchWithTimeout(STUFA_API.shutdown);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}

/**
 * Set power level - con supporto sandbox
 */
export async function setPowerLevel(level) {
  if (level < 1 || level > 5) {
    throw new Error('Potenza deve essere tra 1 e 5');
  }

  // Check sandbox mode
  if (isLocalEnvironment()) {
    const sandboxEnabled = await isSandboxEnabled();
    if (sandboxEnabled) {
      return await sandboxSetPower(level);
    }
  }

  // Chiamata API reale
  const response = await fetchWithTimeout(STUFA_API.setPower(level));
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}

/**
 * Set fan level - con supporto sandbox
 */
export async function setFanLevel(level) {
  if (level < 0 || level > 5) {
    throw new Error('Ventola deve essere tra 0 e 5');
  }

  // Check sandbox mode
  if (isLocalEnvironment()) {
    const sandboxEnabled = await isSandboxEnabled();
    if (sandboxEnabled) {
      return await sandboxSetFan(level);
    }
  }

  // Chiamata API reale
  const response = await fetchWithTimeout(STUFA_API.setFan(level));
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}

/**
 * Get fan level - con supporto sandbox
 */
export async function getFanLevel() {
  // Check sandbox mode
  if (isLocalEnvironment()) {
    const sandboxEnabled = await isSandboxEnabled();
    if (sandboxEnabled) {
      const state = await getSandboxStoveState();
      return {
        Result: state.fan,
        isSandbox: true,
      };
    }
  }

  // Chiamata API reale
  const response = await fetchWithTimeout(STUFA_API.getFan);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  return { ...data, isSandbox: false };
}

/**
 * Get power level - con supporto sandbox
 */
export async function getPowerLevel() {
  // Check sandbox mode
  if (isLocalEnvironment()) {
    const sandboxEnabled = await isSandboxEnabled();
    if (sandboxEnabled) {
      const state = await getSandboxStoveState();
      return {
        Result: state.power,
        isSandbox: true,
      };
    }
  }

  // Chiamata API reale
  const response = await fetchWithTimeout(STUFA_API.getPower);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  return { ...data, isSandbox: false };
}
