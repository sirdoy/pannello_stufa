/**
 * Device Fingerprint - Unique device identification for multi-device support
 *
 * Generates stable device IDs from user agent to prevent duplicate token
 * accumulation when same device re-registers.
 */

import UAParser from 'ua-parser-js';

/**
 * Parse user agent string into structured device info
 * @param {string} userAgent - Navigator.userAgent string
 * @returns {Object} Parsed device information
 */
export function parseUserAgent(userAgent) {
  if (!userAgent) {
    return {
      browser: { name: 'Unknown', version: '' },
      os: { name: 'Unknown', version: '' },
      device: { type: 'desktop', vendor: '', model: '' },
    };
  }

  const parser = new UAParser(userAgent);
  const result = parser.getResult();

  return {
    browser: {
      name: result.browser.name || 'Unknown',
      version: result.browser.version || '',
      major: result.browser.major || '',
    },
    os: {
      name: result.os.name || 'Unknown',
      version: result.os.version || '',
    },
    device: {
      type: result.device.type || 'desktop',
      vendor: result.device.vendor || '',
      model: result.device.model || '',
    },
    engine: {
      name: result.engine.name || '',
      version: result.engine.version || '',
    },
    cpu: {
      architecture: result.cpu.architecture || '',
    },
  };
}

/**
 * Generate simple hash from string (for deviceId)
 * Using simple hash to avoid crypto dependency in browser
 * @param {string} str - String to hash
 * @returns {string} 16-character hex hash
 */
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  // Convert to positive hex and pad to 8 chars
  const hex1 = Math.abs(hash).toString(16).padStart(8, '0');

  // Generate second hash for more uniqueness
  let hash2 = 5381;
  for (let i = 0; i < str.length; i++) {
    hash2 = ((hash2 << 5) + hash2) + str.charCodeAt(i);
  }
  const hex2 = Math.abs(hash2).toString(16).padStart(8, '0');

  return (hex1 + hex2).substring(0, 16);
}

/**
 * Generate unique device fingerprint from user agent
 *
 * Uses browser NAME + OS NAME (without versions) for stability.
 * Same browser on same OS will produce same deviceId even after updates.
 *
 * @param {string} userAgent - Navigator.userAgent string
 * @returns {Object} Device fingerprint with deviceId and metadata
 */
export function generateDeviceFingerprint(userAgent) {
  const parsed = parseUserAgent(userAgent);

  // Use only browser name + OS name for stable ID
  // This means Chrome 120 and Chrome 121 on same OS = same device
  const deviceString = `${parsed.browser.name}-${parsed.os.name}`.toLowerCase();
  const deviceId = simpleHash(deviceString);

  // Generate human-readable display name
  const displayName = `${parsed.browser.name} on ${parsed.os.name}`;

  // Full device info for debugging and display
  const deviceInfo = {
    browser: parsed.browser.name,
    browserVersion: parsed.browser.version,
    os: parsed.os.name,
    osVersion: parsed.os.version,
    deviceType: parsed.device.type,
    screenWidth: typeof window !== 'undefined' ? window.screen?.width : null,
    screenHeight: typeof window !== 'undefined' ? window.screen?.height : null,
    timezone: typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : null,
  };

  return {
    deviceId,
    displayName,
    deviceInfo,
    userAgent,
  };
}

/**
 * Get current device fingerprint (browser context)
 * @returns {Object|null} Device fingerprint or null if SSR
 */
export function getCurrentDeviceFingerprint() {
  if (typeof navigator === 'undefined') {
    return null;
  }

  return generateDeviceFingerprint(navigator.userAgent);
}

/**
 * Check if two fingerprints represent the same device
 * @param {Object} fp1 - First fingerprint
 * @param {Object} fp2 - Second fingerprint
 * @returns {boolean} True if same device
 */
export function isSameDevice(fp1, fp2) {
  if (!fp1?.deviceId || !fp2?.deviceId) return false;
  return fp1.deviceId === fp2.deviceId;
}

/**
 * Format device info for display in UI
 * @param {Object} deviceInfo - Device info from fingerprint
 * @returns {string} Formatted string
 */
export function formatDeviceInfo(deviceInfo) {
  if (!deviceInfo) return 'Unknown device';

  const parts = [];

  if (deviceInfo.browser) {
    parts.push(deviceInfo.browser);
    if (deviceInfo.browserVersion) {
      // Show only major version
      const major = deviceInfo.browserVersion.split('.')[0];
      parts[parts.length - 1] += ` ${major}`;
    }
  }

  if (deviceInfo.os) {
    parts.push(`on ${deviceInfo.os}`);
  }

  if (deviceInfo.deviceType && deviceInfo.deviceType !== 'desktop') {
    parts.push(`(${deviceInfo.deviceType})`);
  }

  return parts.join(' ') || 'Unknown device';
}
