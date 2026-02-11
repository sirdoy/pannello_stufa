/**
 * PID Automation Service
 *
 * Client-side Firebase operations for per-user PID automation configuration.
 * Stores configuration at users/${userId}/pidAutomation.
 *
 * Usage:
 *   import { getPidConfig, setPidConfig, subscribeToPidConfig } from '@/lib/services/pidAutomationService';
 *
 *   const config = await getPidConfig(userId);
 *   await setPidConfig(userId, { enabled: true, targetRoomId: 'room123' });
 */

import { ref, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';

/**
 * PID configuration interface
 */
export interface PIDConfig {
  enabled: boolean;
  targetRoomId: string | null;
  manualSetpoint: number;
  kp: number;
  ki: number;
  kd: number;
}

/**
 * Default PID configuration for new users
 */
export const DEFAULT_PID_CONFIG: PIDConfig = {
  enabled: false,
  targetRoomId: null,
  manualSetpoint: 20, // Manual setpoint temperature (15-25°C)
  kp: 0.5,
  ki: 0.1,
  kd: 0.05,
};

/**
 * Get Firebase path for user's PID automation config
 */
const getPidPath = (userId: string): string => `users/${userId}/pidAutomation`;

/**
 * Get PID automation config for a user (read once)
 */
export async function getPidConfig(userId: string | undefined): Promise<PIDConfig> {
  // Return defaults if no userId provided
  if (!userId) {
    return { ...DEFAULT_PID_CONFIG };
  }

  const pidRef = ref(db, getPidPath(userId));

  return new Promise((resolve) => {
    onValue(
      pidRef,
      (snapshot) => {
        const data = snapshot.val();
        // Merge with defaults to ensure all fields exist
        resolve({ ...DEFAULT_PID_CONFIG, ...data });
      },
      { onlyOnce: true }
    );
  });
}

/**
 * Set PID automation config for a user via server-side API route.
 * Uses Admin SDK on the server to bypass client-side Firebase rules.
 *
 * @param {string} _userId - Auth0 user ID (kept for API compatibility, auth handled by session)
 * @param {Object} config - Configuration to save
 * @param {boolean} config.enabled - Whether PID automation is enabled
 * @param {string|null} config.targetRoomId - Netatmo room ID to monitor
 * @param {number} config.manualSetpoint - Manual setpoint temperature (optional)
 * @param {number} config.kp - Proportional gain (optional)
 * @param {number} config.ki - Integral gain (optional)
 * @param {number} config.kd - Derivative gain (optional)
 * @returns {Promise<void>}
 * @throws {Error} If save fails
 *
 * @example
 * await setPidConfig(session.user.sub, {
 *   enabled: true,
 *   targetRoomId: '1234567890',
 *   kp: 0.5,
 *   ki: 0.1,
 *   kd: 0.05,
 * });
 */
export async function setPidConfig(_userId: string, config: Partial<PIDConfig>): Promise<void> {
  const response = await fetch('/api/user/pid-config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || `Failed to save PID config: ${response.status}`);
  }
}

/**
 * Subscribe to PID automation config (real-time updates)
 *
 * @param {string} userId - Auth0 user ID (required)
 * @param {Function} callback - Called with config on each update
 * @returns {Function} - Unsubscribe function (noop if no userId)
 *
 * @example
 * const unsubscribe = subscribeToPidConfig(session.user.sub, (config) => {
 * });
 *
 * // Later: unsubscribe()
 */
export function subscribeToPidConfig(userId: string, callback: (config: PIDConfig) => void): () => void {
  // Return noop unsubscribe if no userId
  if (!userId) {
    callback({ ...DEFAULT_PID_CONFIG });
    return () => {};
  }

  const pidRef = ref(db, getPidPath(userId));

  const unsubscribe = onValue(pidRef, (snapshot) => {
    const data = snapshot.val();
    // Merge with defaults to ensure all fields exist
    callback({ ...DEFAULT_PID_CONFIG, ...data });
  });

  return unsubscribe;
}
