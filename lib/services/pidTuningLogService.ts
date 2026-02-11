/**
 * PID Tuning Log Service
 *
 * Server-side Firebase operations for PID automation tuning logs.
 * Stores time-series data at pidAutomation/tuningLog/{timestamp}.
 *
 * Usage:
 *   import { logPidTuningEntry, cleanupOldLogs } from '@/lib/services/pidTuningLogService';
 *
 *   await logPidTuningEntry(userId, { roomTemp, powerLevel, setpoint, ... });
 *   await cleanupOldLogs(userId); // Remove entries older than 14 days
 */

import { adminDbSet, adminDbGet, adminDbRemove } from '@/lib/firebaseAdmin';
import type { PIDTuningLogEntry } from '@/types/firebase/stove';

/**
 * Get Firebase path for user's PID tuning logs
 */
function getTuningLogPath(userId: string): string {
  return `users/${userId}/pidAutomation/tuningLog`;
}

/**
 * Log a PID tuning entry to Firebase
 *
 * @param userId - Auth0 user ID
 * @param entry - Tuning data to log (timestamp auto-added if not provided)
 * @returns Promise that resolves when log is saved
 *
 * @example
 * await logPidTuningEntry('auth0|123', {
 *   roomTemp: 19.5,
 *   powerLevel: 3,
 *   setpoint: 20,
 *   pidOutput: 4,
 *   error: 0.5,
 *   integral: 2.3,
 *   derivative: 0.1,
 *   roomId: '1234567890',
 *   roomName: 'Living Room'
 * });
 */
export async function logPidTuningEntry(
  userId: string,
  entry: Omit<PIDTuningLogEntry, 'timestamp'> & { timestamp?: number }
): Promise<void> {
  const timestamp = entry.timestamp ?? Date.now();
  const logPath = `${getTuningLogPath(userId)}/${timestamp}`;

  const logEntry: PIDTuningLogEntry = {
    ...entry,
    timestamp,
  };

  await adminDbSet(logPath, logEntry);
}

/**
 * Clean up old PID tuning logs (keeps last 14 days)
 *
 * @param userId - Auth0 user ID
 * @param retentionDays - Number of days to retain (default: 14)
 * @returns Promise that resolves with number of entries deleted
 *
 * @example
 * const deleted = await cleanupOldLogs('auth0|123');
 * console.log(`Deleted ${deleted} old log entries`);
 */
export async function cleanupOldLogs(userId: string, retentionDays: number = 14): Promise<number> {
  const logPath = getTuningLogPath(userId);
  const logs = await adminDbGet(logPath) as Record<string, PIDTuningLogEntry> | null;

  if (!logs) {
    return 0;
  }

  const cutoffTime = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);
  const timestamps = Object.keys(logs);
  const toDelete = timestamps.filter(ts => parseInt(ts, 10) < cutoffTime);

  // Delete old entries in parallel
  await Promise.all(
    toDelete.map(ts => adminDbRemove(`${logPath}/${ts}`))
  );

  return toDelete.length;
}
