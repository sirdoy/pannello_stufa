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
