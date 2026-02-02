/**
 * Weather Helper Utilities
 *
 * Temperature formatting and comparison utilities for weather UI components.
 * All functions return strings ready for display.
 */

/**
 * Format temperature with exactly one decimal precision
 * @param {number} temp - Temperature value
 * @returns {string} Formatted temperature (e.g., "18.5", "20.0")
 *
 * @example
 * formatTemperature(18.456) // "18.5"
 * formatTemperature(20) // "20.0"
 * formatTemperature(-5.123) // "-5.1"
 */
export function formatTemperature(temp) {
  if (temp === null || temp === undefined || isNaN(temp)) {
    return '--';
  }
  return Number(temp).toFixed(1);
}

/**
 * Compare outdoor and indoor temperatures with Italian description
 * @param {number} outdoorTemp - Outdoor temperature
 * @param {number} indoorTemp - Indoor temperature
 * @returns {string} Italian comparison text
 *
 * @example
 * getTemperatureComparison(25, 20) // "5.0° piu caldo di casa"
 * getTemperatureComparison(15, 20) // "5.0° piu freddo di casa"
 * getTemperatureComparison(20.3, 20.5) // "Stessa temperatura di casa"
 */
export function getTemperatureComparison(outdoorTemp, indoorTemp) {
  if (outdoorTemp === null || indoorTemp === null || isNaN(outdoorTemp) || isNaN(indoorTemp)) {
    return '';
  }

  const diff = Math.abs(outdoorTemp - indoorTemp);

  // If difference is less than 1 degree, consider it the same
  if (diff < 1) {
    return 'Stessa temperatura di casa';
  }

  // Format difference with one decimal
  const diffFormatted = diff.toFixed(1);

  if (outdoorTemp > indoorTemp) {
    return `${diffFormatted}° piu caldo di casa`;
  } else {
    return `${diffFormatted}° piu freddo di casa`;
  }
}

/**
 * Format wind speed with unit
 * @param {number} speed - Wind speed in km/h
 * @returns {string} Formatted wind speed (e.g., "15 km/h")
 *
 * @example
 * formatWindSpeed(15.3) // "15 km/h"
 * formatWindSpeed(8.7) // "9 km/h"
 */
export function formatWindSpeed(speed) {
  if (speed === null || speed === undefined || isNaN(speed)) {
    return '-- km/h';
  }
  return `${Math.round(speed)} km/h`;
}

/**
 * Get Italian UV index severity label
 * @param {number} uvIndex - UV index value (0-11+)
 * @returns {string} Italian severity label
 *
 * @example
 * getUVIndexLabel(1) // "Basso"
 * getUVIndexLabel(5) // "Moderato"
 * getUVIndexLabel(8) // "Molto alto"
 * getUVIndexLabel(12) // "Estremo"
 */
export function getUVIndexLabel(uvIndex) {
  if (uvIndex === null || uvIndex === undefined || isNaN(uvIndex)) {
    return '';
  }

  if (uvIndex <= 2) {
    return 'Basso';
  } else if (uvIndex <= 5) {
    return 'Moderato';
  } else if (uvIndex <= 7) {
    return 'Alto';
  } else if (uvIndex <= 10) {
    return 'Molto alto';
  } else {
    return 'Estremo';
  }
}

/**
 * Get precipitation chance description in Italian
 * @param {number} percent - Precipitation probability (0-100)
 * @returns {string|null} Italian description or null if too low to mention
 *
 * @example
 * getPrecipitationLabel(5) // null
 * getPrecipitationLabel(30) // "Possibile pioggia"
 * getPrecipitationLabel(60) // "Probabile pioggia"
 * getPrecipitationLabel(85) // "Pioggia prevista"
 */
export function getPrecipitationLabel(percent) {
  if (percent === null || percent === undefined || isNaN(percent)) {
    return null;
  }

  if (percent <= 10) {
    return null; // Don't show for very low probability
  } else if (percent <= 40) {
    return 'Possibile pioggia';
  } else if (percent <= 70) {
    return 'Probabile pioggia';
  } else {
    return 'Pioggia prevista';
  }
}

/**
 * Get Italian Air Quality Index (AQI) severity label
 * Uses European AQI scale (0-100+)
 * @param {number} aqi - Air Quality Index value
 * @returns {string} Italian severity label
 *
 * @example
 * getAirQualityLabel(15) // "Buona"
 * getAirQualityLabel(35) // "Discreta"
 * getAirQualityLabel(55) // "Moderata"
 * getAirQualityLabel(75) // "Scarsa"
 * getAirQualityLabel(90) // "Molto scarsa"
 */
export function getAirQualityLabel(aqi) {
  if (aqi === null || aqi === undefined || isNaN(aqi)) {
    return '';
  }

  if (aqi <= 20) {
    return 'Buona';
  } else if (aqi <= 40) {
    return 'Discreta';
  } else if (aqi <= 60) {
    return 'Moderata';
  } else if (aqi <= 80) {
    return 'Scarsa';
  } else if (aqi <= 100) {
    return 'Molto scarsa';
  } else {
    return 'Pessima';
  }
}
