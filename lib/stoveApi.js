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
 * @type {string}
 */
export const API_KEY = 'bdb58f63-117e-4753-bb0f-0487f2f14e52';

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
 * Thermorossi Cloud API endpoints
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
