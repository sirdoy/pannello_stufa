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
 * - GetActualWaterTemperature/[apikey] - Get actual water temperature (for boilers)
 * - GetWaterSetTemperature/[apikey] - Get water temperature setpoint (for boilers)
 * - SetFanLevel/[apikey];[1-6] - Set fan level
 * - SetPower/[apikey];[0-5] - Set power level
 * - SetWaterTemperature/[apikey];[temp] - Set water temperature setpoint
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
 * Default timeout for stove API requests (20 seconds)
 * Increased to handle slow Thermorossi cloud responses
 */
export const DEFAULT_TIMEOUT = 20000;

/**
 * Maximum retry attempts for failed requests
 * Total attempts = 1 initial + MAX_RETRIES (e.g., 2 retries = 3 total attempts)
 */
export const MAX_RETRIES = 2;

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
 * Fetch with timeout and retry logic
 * @param {string} url - URL to fetch
 * @param {number} timeout - Timeout in milliseconds
 * @param {number} maxRetries - Maximum number of retry attempts
 * @returns {Promise<Response>}
 */
export async function fetchWithRetry(url, timeout = DEFAULT_TIMEOUT, maxRetries = MAX_RETRIES) {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`[Stove API] Retry attempt ${attempt}/${maxRetries} for ${url}`);
      }

      const response = await fetchWithTimeout(url, timeout);

      // Success - return response
      if (attempt > 0) {
        console.log(`[Stove API] Success on attempt ${attempt + 1}`);
      }
      return response;

    } catch (error) {
      lastError = error;

      // Don't retry if it's not a timeout error
      if (error.message !== 'STOVE_TIMEOUT') {
        throw error;
      }

      // Log retry info
      if (attempt < maxRetries) {
        console.log(`[Stove API] Timeout on attempt ${attempt + 1}, retrying...`);
      }
    }
  }

  // All retries failed
  console.error(`[Stove API] All ${maxRetries + 1} attempts failed`);
  throw lastError;
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
  getActualWaterTemperature: `${BASE_URL}/GetActualWaterTemperature/${API_KEY}`,
  getWaterSetTemperature: `${BASE_URL}/GetWaterSetTemperature/${API_KEY}`,

  // Setter endpoints (function-based for parameters)
  setFan: (level) => `${BASE_URL}/SetFanLevel/${API_KEY};${level}`,
  setPower: (level) => `${BASE_URL}/SetPower/${API_KEY};${level}`,
  setWaterTemperature: (temp) => `${BASE_URL}/SetWaterTemperature/${API_KEY};${temp}`,
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

  // Chiamata API reale con retry
  const response = await fetchWithRetry(STUFA_API.getStatus);
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

  // Chiamata API reale con retry
  const response = await fetchWithRetry(STUFA_API.ignite);
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

  // Chiamata API reale con retry
  const response = await fetchWithRetry(STUFA_API.shutdown);
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

  // Chiamata API reale con retry
  const response = await fetchWithRetry(STUFA_API.setPower(level));
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}

/**
 * Set fan level - con supporto sandbox
 */
export async function setFanLevel(level) {
  if (level < 1 || level > 6) {
    throw new Error('Ventola deve essere tra 1 e 6');
  }

  // Check sandbox mode
  if (isLocalEnvironment()) {
    const sandboxEnabled = await isSandboxEnabled();
    if (sandboxEnabled) {
      return await sandboxSetFan(level);
    }
  }

  // Chiamata API reale con retry
  const response = await fetchWithRetry(STUFA_API.setFan(level));
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

  // Chiamata API reale con retry
  const response = await fetchWithRetry(STUFA_API.getFan);
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

  // Chiamata API reale con retry
  const response = await fetchWithRetry(STUFA_API.getPower);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  return { ...data, isSandbox: false };
}

/**
 * Get actual water temperature - for boiler/hydronic stoves
 * Returns current water temperature reading
 */
export async function getActualWaterTemperature() {
  // No sandbox support for water temperature (uncommon feature)
  const response = await fetchWithRetry(STUFA_API.getActualWaterTemperature);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  return { ...data, isSandbox: false };
}

/**
 * Get water temperature setpoint - for boiler/hydronic stoves
 * Returns target water temperature setting
 */
export async function getWaterSetTemperature() {
  // No sandbox support for water temperature (uncommon feature)
  const response = await fetchWithRetry(STUFA_API.getWaterSetTemperature);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  return { ...data, isSandbox: false };
}

/**
 * Set water temperature setpoint - for boiler/hydronic stoves
 * @param {number} temperature - Target water temperature
 */
export async function setWaterTemperature(temperature) {
  if (temperature < 30 || temperature > 80) {
    throw new Error('Water temperature must be between 30 and 80°C');
  }

  // No sandbox support for water temperature (uncommon feature)
  const response = await fetchWithRetry(STUFA_API.setWaterTemperature(temperature));
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}
