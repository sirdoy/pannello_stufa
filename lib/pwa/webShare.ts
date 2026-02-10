/**
 * Web Share Service
 *
 * Share stove status, logs, or app with others.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Web_Share_API
 */

interface StoveData {
  status?: string;
  temperature?: number;
  power?: number;
  mode?: string;
}

interface ThermostatData {
  temperature?: number;
  setpoint?: number;
  humidity?: number;
}

interface DeviceSummaryData {
  stove?: StoveData;
  thermostat?: ThermostatData;
}

interface ErrorData {
  code?: string;
  message?: string;
  timestamp?: string;
}

/**
 * Check if Web Share API is supported
 * @returns {boolean}
 */
export function isShareSupported(): boolean {
  return 'share' in navigator;
}

/**
 * Check if sharing files is supported
 * @returns {boolean}
 */
function isFileShareSupported(): boolean {
  return 'canShare' in navigator;
}

/**
 * Share content using Web Share API
 * @param {Object} data - Share data
 * @param {string} [data.title] - Share title
 * @param {string} [data.text] - Share text
 * @param {string} [data.url] - Share URL
 * @returns {Promise<boolean>} True if shared successfully
 */
export async function share(data: ShareData): Promise<boolean> {
  if (!isShareSupported()) {
    console.warn('[WebShare] API not supported');
    return false;
  }

  try {
    await navigator.share(data);
    return true;
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      // User cancelled - not an error
      return false;
    }
    console.error('[WebShare] Error:', error);
    return false;
  }
}

/**
 * Share stove status
 * @param {Object} stoveData - Stove status data
 * @param {string} [stoveData.status] - Stove status
 * @param {number} [stoveData.temperature] - Temperature
 * @param {number} [stoveData.power] - Power level
 * @param {string} [stoveData.mode] - Operating mode
 * @returns {Promise<boolean>}
 */
export async function shareStoveStatus(stoveData: StoveData): Promise<boolean> {
  const statusText = stoveData.status === 'on' ? 'Accesa' : 'Spenta';
  const tempText = stoveData.temperature ? `${stoveData.temperature}°C` : 'N/D';
  const powerText = stoveData.power ? `Potenza ${stoveData.power}` : '';

  const text = [
    `🔥 Stufa: ${statusText}`,
    `🌡️ Temperatura: ${tempText}`,
    powerText && `⚡ ${powerText}`,
  ].filter(Boolean).join('\n');

  return share({
    title: 'Stato Stufa - Pannello Stufa',
    text,
    url: window.location.origin,
  });
}

/**
 * Share thermostat status
 * @param {Object} thermostatData - Thermostat data
 * @returns {Promise<boolean>}
 */
export async function shareThermostatStatus(thermostatData: ThermostatData): Promise<boolean> {
  const tempText = thermostatData.temperature ? `${thermostatData.temperature}°C` : 'N/D';
  const setpointText = thermostatData.setpoint ? `${thermostatData.setpoint}°C` : 'N/D';
  const humidityText = thermostatData.humidity ? `${thermostatData.humidity}%` : '';

  const text = [
    `🏠 Termostato`,
    `🌡️ Temperatura: ${tempText}`,
    `🎯 Setpoint: ${setpointText}`,
    humidityText && `💧 Umidità: ${humidityText}`,
  ].filter(Boolean).join('\n');

  return share({
    title: 'Stato Termostato - Pannello Stufa',
    text,
    url: window.location.origin,
  });
}

/**
 * Share device summary (stove + thermostat)
 * @param {Object} data - Device data
 * @param {Object} data.stove - Stove data
 * @param {Object} data.thermostat - Thermostat data
 * @returns {Promise<boolean>}
 */
async function shareDeviceSummary(data: DeviceSummaryData): Promise<boolean> {
  const { stove, thermostat } = data;

  const lines = ['📊 Riepilogo Dispositivi', ''];

  if (stove) {
    const stoveStatus = stove.status === 'on' ? 'Accesa' : 'Spenta';
    lines.push(`🔥 Stufa: ${stoveStatus}`);
    if (stove.temperature) {
      lines.push(`   Temperatura: ${stove.temperature}°C`);
    }
  }

  if (thermostat) {
    lines.push(`🏠 Termostato: ${thermostat.temperature || 'N/D'}°C`);
    if (thermostat.setpoint) {
      lines.push(`   Setpoint: ${thermostat.setpoint}°C`);
    }
  }

  return share({
    title: 'Pannello Stufa - Riepilogo',
    text: lines.join('\n'),
    url: window.location.origin,
  });
}

/**
 * Share the app itself
 * @returns {Promise<boolean>}
 */
export async function shareApp(): Promise<boolean> {
  return share({
    title: 'Pannello Stufa',
    text: 'Controllo remoto della stufa Thermorossi con pianificazione automatica e monitoraggio temperatura',
    url: window.location.origin,
  });
}

/**
 * Share error log
 * @param {Object} error - Error data
 * @param {string} error.code - Error code
 * @param {string} error.message - Error message
 * @param {string} [error.timestamp] - When error occurred
 * @returns {Promise<boolean>}
 */
async function shareErrorLog(error: ErrorData): Promise<boolean> {
  const timestamp = error.timestamp
    ? new Date(error.timestamp).toLocaleString('it-IT')
    : new Date().toLocaleString('it-IT');

  const text = [
    '⚠️ Errore Stufa',
    `Codice: ${error.code || 'N/D'}`,
    `Messaggio: ${error.message || 'Errore sconosciuto'}`,
    `Data: ${timestamp}`,
  ].join('\n');

  return share({
    title: 'Errore Stufa - Pannello Stufa',
    text,
  });
}

