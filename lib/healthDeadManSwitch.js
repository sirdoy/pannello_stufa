/**
 * Health Monitoring Dead Man's Switch
 *
 * Tracks cron execution health by maintaining a heartbeat timestamp.
 * Alerts admin if cron hasn't run within expected interval.
 *
 * Pattern: Dead man's switch (fail-safe mechanism)
 * - updateDeadManSwitch() called at START of every cron execution
 * - checkDeadManSwitch() verifies cron is running regularly (10-minute threshold)
 * - alertDeadManSwitch() sends notification when cron becomes stale
 */

import { adminDbSet, adminDbGet } from './firebaseAdmin.js';
import { triggerMaintenanceAlertServer } from './notificationTriggersServer.js';

// RTDB path for dead man's switch timestamp
const DEAD_MAN_SWITCH_PATH = 'healthMonitoring/lastCheck';

// Threshold: 10 minutes without cron execution = stale
const STALE_THRESHOLD_MS = 10 * 60 * 1000; // 600000 ms

/**
 * Update dead man's switch timestamp
 * Called at START of every cron execution (before any other processing)
 *
 * @returns {Promise<boolean>} true on success, false on error (never throws)
 */
export async function updateDeadManSwitch() {
  try {
    const timestamp = new Date().toISOString();
    await adminDbSet(DEAD_MAN_SWITCH_PATH, timestamp);
    console.log(`✅ Dead man's switch updated: ${timestamp}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to update dead man\'s switch:', error);
    return false;
  }
}

/**
 * Check if cron is stale (hasn't run recently)
 *
 * @returns {Promise<Object>} Status object:
 *   - { stale: false, elapsed, lastCheck } - Cron is healthy
 *   - { stale: true, reason: 'never_run' } - No timestamp recorded
 *   - { stale: true, elapsed, reason: 'timeout' } - Cron hasn't run in 10+ min
 */
export async function checkDeadManSwitch() {
  try {
    const lastCheck = await adminDbGet(DEAD_MAN_SWITCH_PATH);

    // Never run - no timestamp recorded
    if (!lastCheck) {
      return {
        stale: true,
        reason: 'never_run',
      };
    }

    // Calculate elapsed time
    const now = Date.now();
    const lastCheckTime = new Date(lastCheck).getTime();
    const elapsed = now - lastCheckTime;

    // Check if stale (> 10 minutes)
    if (elapsed > STALE_THRESHOLD_MS) {
      return {
        stale: true,
        elapsed,
        reason: 'timeout',
        lastCheck,
      };
    }

    // Healthy - cron running regularly
    return {
      stale: false,
      elapsed,
      lastCheck,
    };
  } catch (error) {
    console.error('❌ Error checking dead man\'s switch:', error);
    // Treat errors as stale (fail-safe)
    return {
      stale: true,
      reason: 'error',
      error: error.message,
    };
  }
}

/**
 * Send alert when cron is stale
 * Fire-and-forget: logs result but doesn't throw
 *
 * @param {string} reason - 'never_run' | 'timeout'
 * @param {Object} context - Additional context (elapsed time, etc.)
 * @returns {Promise<void>}
 */
export async function alertDeadManSwitch(reason, context = {}) {
  try {
    const adminUserId = process.env.ADMIN_USER_ID;

    if (!adminUserId) {
      console.log('⚠️ ADMIN_USER_ID not configured - cannot send dead man\'s switch alert');
      return;
    }

    // Build message based on reason
    let message;
    if (reason === 'never_run') {
      message = 'Health monitoring cron has never executed';
    } else if (reason === 'timeout') {
      const elapsedMinutes = Math.floor(context.elapsed / 60000);
      message = `Health monitoring cron hasn't run in ${elapsedMinutes} minutes`;
    } else {
      message = `Health monitoring cron issue: ${reason}`;
    }

    // Use maintenance alert (100% threshold = critical)
    const result = await triggerMaintenanceAlertServer(adminUserId, 100, {
      message,
      remainingHours: 0,
    });

    if (result.success) {
      console.log(`✅ Dead man's switch alert sent: ${reason}`);
    } else {
      console.error(`❌ Failed to send dead man's switch alert: ${result.error}`);
    }
  } catch (error) {
    console.error('❌ Error alerting dead man\'s switch:', error);
    // Don't throw - this is fire-and-forget
  }
}
