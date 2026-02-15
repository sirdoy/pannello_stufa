/**
 * Network Health Algorithm with Hysteresis
 *
 * Computes network health status based on:
 * - WAN connection state
 * - WAN uptime
 * - Bandwidth saturation
 *
 * Includes 2-reading hysteresis to prevent flapping between states.
 * Exception: WAN disconnect triggers immediate 'poor' status.
 */

import type { NetworkHealthStatus, DeviceCardHealthStatus } from './types';

export interface ComputeNetworkHealthParams {
  wanConnected: boolean;
  wanUptime: number;         // seconds
  downloadMbps: number;
  uploadMbps: number;
  linkSpeedMbps?: number;    // max capacity
  previousHealth: NetworkHealthStatus;
  consecutiveReadings: number;  // how many consecutive readings of current previousHealth
}

export interface ComputeNetworkHealthResult {
  health: NetworkHealthStatus;
  consecutiveReadings: number;
}

/**
 * Compute network health status with hysteresis
 *
 * Algorithm:
 * 1. WAN disconnected → immediate 'poor' (no hysteresis)
 * 2. Calculate saturation: max(download, upload) / linkSpeed
 * 3. Score based on uptime and saturation thresholds
 * 4. Apply hysteresis: require 2 consecutive readings to change status
 *
 * @param params - Network metrics and previous state
 * @returns New health status and consecutive reading count
 */
export function computeNetworkHealth(params: ComputeNetworkHealthParams): ComputeNetworkHealthResult {
  const {
    wanConnected,
    wanUptime,
    downloadMbps,
    uploadMbps,
    linkSpeedMbps = 100, // Default 100 Mbps if unknown
    previousHealth,
    consecutiveReadings,
  } = params;

  // Rule 1: WAN disconnected → immediate 'poor' (bypass hysteresis)
  if (!wanConnected) {
    return { health: 'poor', consecutiveReadings: 0 };
  }

  // Rule 2: Calculate bandwidth saturation
  const maxBandwidth = Math.max(downloadMbps, uploadMbps);
  const saturation = maxBandwidth / linkSpeedMbps;

  // Rule 3: Compute raw health status based on thresholds
  let computedHealth: NetworkHealthStatus;

  if (wanUptime >= 24 * 3600 && saturation < 0.7) {
    // Uptime >= 24h AND saturation < 70%
    computedHealth = 'excellent';
  } else if (wanUptime >= 3600 && saturation < 0.85) {
    // Uptime >= 1h AND saturation < 85%
    computedHealth = 'good';
  } else if (wanUptime >= 600 && saturation < 0.95) {
    // Uptime >= 10min AND saturation < 95%
    computedHealth = 'degraded';
  } else {
    computedHealth = 'poor';
  }

  // Rule 4: Apply hysteresis
  // Only change health if new status has been computed for 2+ consecutive readings
  if (computedHealth === previousHealth) {
    // Same status as before - we're stable, increment counter
    return { health: previousHealth, consecutiveReadings: consecutiveReadings + 1 };
  } else {
    // Different status computed
    if (consecutiveReadings >= 1) {
      // We've seen this new computed status for 2 readings now (consecutiveReadings was 1, this is the 2nd)
      // Switch to new status and reset counter
      return { health: computedHealth, consecutiveReadings: 0 };
    } else {
      // First time seeing this new status (consecutiveReadings was 0)
      // Don't switch yet, but start tracking this candidate change
      return { health: previousHealth, consecutiveReadings: 1 };
    }
  }
}

/**
 * Map NetworkHealthStatus to DeviceCard health prop
 *
 * @param health - Network health status
 * @returns DeviceCard health status
 */
export function mapHealthToDeviceCard(health: NetworkHealthStatus): DeviceCardHealthStatus {
  switch (health) {
    case 'excellent':
      return 'ok';
    case 'good':
      return 'ok';
    case 'degraded':
      return 'warning';
    case 'poor':
      return 'critical';
  }
}
