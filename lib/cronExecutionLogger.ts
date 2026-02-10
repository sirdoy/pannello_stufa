/**
 * Cron Execution Logger
 *
 * Logs scheduler check execution details to Firebase RTDB for monitoring dashboard.
 * Provides visibility into cron execution history with timestamp, status, mode, and duration.
 *
 * Pattern: Fire-and-forget logging (errors logged but never thrown)
 * Storage: Firebase RTDB at cronExecutions/{timestamp-key}
 * Cleanup: Automatically removes entries older than 24 hours
 */

import { adminDbGet, adminDbSet } from './firebaseAdmin';

/**
 * Cron execution log entry
 */
interface CronExecutionLog {
  timestamp: string;
  status: string;
  mode: string;
  duration: number;
  details?: Record<string, unknown>;
}

/**
 * Input parameters for logging cron execution
 */
interface CronExecutionInput {
  status: string;
  mode: string;
  duration: number;
  details?: Record<string, unknown>;
}

/**
 * Log cron execution to Firebase RTDB
 *
 * Writes execution details to cronExecutions/ with timestamp-based key.
 * Automatically cleans up entries older than 24 hours.
 * Fire-and-forget: errors logged but never thrown.
 *
 * @param result - Execution result with status, mode, duration, and optional details
 */
export async function logCronExecution(result: CronExecutionInput): Promise<void> {
  try {
    const timestamp = new Date().toISOString();

    // Create RTDB-compatible key (replace invalid characters)
    const key = timestamp.replace(/[:.]/g, '-');

    // Build log entry
    const logEntry: CronExecutionLog = {
      timestamp,
      status: result.status,
      mode: result.mode,
      duration: result.duration,
    };

    // Add optional details if provided
    if (result.details) {
      logEntry.details = result.details;
    }

    // Write to Firebase
    await adminDbSet(`cronExecutions/${key}`, logEntry);
    console.log(`✅ Cron execution logged: ${result.status} (${result.mode}, ${result.duration}ms)`);

    // Cleanup old entries (fire-and-forget)
    cleanupOldEntries().catch(error => {
      console.error('❌ Cleanup error (non-blocking):', error);
    });

  } catch (error) {
    console.error('❌ Failed to log cron execution:', error);
    // Don't throw - this is fire-and-forget
  }
}

/**
 * Get recent cron execution logs
 *
 * Reads recent execution logs from Firebase RTDB, sorted by timestamp descending.
 * Returns empty array on error (never throws).
 *
 * @param limit - Maximum number of entries to return (default 20)
 * @returns Array of execution logs, newest first
 */
export async function getRecentCronExecutions(limit = 20): Promise<CronExecutionLog[]> {
  try {
    const data = await adminDbGet('cronExecutions') as Record<string, CronExecutionLog> | null;

    if (!data) {
      return [];
    }

    // Convert to array and sort by timestamp descending (newest first)
    const entries = Object.values(data);
    entries.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeB - timeA; // Descending order
    });

    // Apply limit
    return entries.slice(0, limit);

  } catch (error) {
    console.error('❌ Failed to get recent cron executions:', error);
    return []; // Never throw - return empty array
  }
}

/**
 * Cleanup execution logs older than 24 hours
 * Fire-and-forget: called asynchronously, doesn't block main flow
 */
async function cleanupOldEntries(): Promise<void> {
  try {
    const data = await adminDbGet('cronExecutions') as Record<string, CronExecutionLog> | null;

    if (!data) {
      return; // No entries to clean
    }

    const now = Date.now();
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

    // Find entries older than 24 hours
    const entriesToDelete: string[] = [];

    Object.entries(data).forEach(([key, entry]) => {
      const entryTime = new Date(entry.timestamp).getTime();
      const age = now - entryTime;

      if (age > TWENTY_FOUR_HOURS) {
        entriesToDelete.push(key);
      }
    });

    // Delete old entries
    if (entriesToDelete.length > 0) {
      for (const key of entriesToDelete) {
        await adminDbSet(`cronExecutions/${key}`, null);
      }
      console.log(`🧹 Cleaned up ${entriesToDelete.length} old cron execution log(s)`);
    }

  } catch (error) {
    console.error('❌ Cleanup old entries failed:', error);
    // Don't throw - this is fire-and-forget
  }
}
