/**
 * Analytics Event Logger
 *
 * Fire-and-forget logging of stove analytics events to Firebase RTDB.
 * Provides event writing, date-filtered reading, and automatic cleanup.
 *
 * IMPORTANT:
 * - Server-side only (uses adminDbSet/adminDbGet)
 * - Fire-and-forget pattern: errors logged but never thrown
 * - Consent enforcement is CALLER responsibility:
 *   - API routes check X-Analytics-Consent header
 *   - Scheduler logs unconditionally (server-initiated events)
 * - Does NOT import consent service (client-side only)
 *
 * Storage: Firebase RTDB at {env}/analyticsEvents/{timestamp-key}
 * Pattern: Same as cronExecutionLogger (timestamp key, fire-and-forget)
 */

import { adminDbSet, adminDbGet } from './firebaseAdmin';
import { getEnvironmentPath } from './environmentHelper';
import type { AnalyticsEvent, AnalyticsEventType, AnalyticsEventSource } from '@/types/analytics';

/**
 * Log analytics event to Firebase RTDB
 *
 * Fire-and-forget pattern: writes event to RTDB with timestamp-based key.
 * Errors are logged but never thrown to avoid blocking caller.
 *
 * NOTE: This function does NOT check consent. Callers must enforce consent:
 * - API routes: check X-Analytics-Consent header
 * - Scheduler: logs unconditionally (server-initiated)
 *
 * @param event - Analytics event without timestamp (added automatically)
 */
export async function logAnalyticsEvent(
  event: Omit<AnalyticsEvent, 'timestamp'>
): Promise<void> {
  try {
    // Create ISO timestamp
    const timestamp = new Date().toISOString();

    // Generate RTDB-compatible key (replace invalid characters)
    const key = timestamp.replace(/[:.]/g, '-');

    // Build complete event
    const completeEvent: AnalyticsEvent = {
      timestamp,
      eventType: event.eventType,
      source: event.source,
      ...(event.powerLevel !== undefined && { powerLevel: event.powerLevel }),
      ...(event.userId && { userId: event.userId }),
      ...(event.component && { component: event.component }),
      ...(event.errorMessage && { errorMessage: event.errorMessage }),
      ...(event.errorStack && { errorStack: event.errorStack }),
      ...(event.device && { device: event.device }),
    };

    // Write to Firebase RTDB (environment-specific path)
    const path = getEnvironmentPath(`analyticsEvents/${key}`);
    await adminDbSet(path, completeEvent);

  } catch (error) {
    console.error('❌ Failed to log analytics event (non-blocking):', error);
    // Don't throw - this is fire-and-forget
  }
}

/**
 * Get analytics events for a specific date
 *
 * Reads all events and filters by date prefix (YYYY-MM-DD).
 * Returns empty array on error (never throws).
 *
 * @param dateKey - Date in YYYY-MM-DD format
 * @returns Array of events for that date
 */
export async function getAnalyticsEventsForDate(dateKey: string): Promise<AnalyticsEvent[]> {
  try {
    const path = getEnvironmentPath('analyticsEvents');
    const data = await adminDbGet(path) as Record<string, AnalyticsEvent> | null;

    if (!data) {
      return [];
    }

    // Filter events by date prefix
    const events = Object.values(data);
    const filtered = events.filter(event => event.timestamp.startsWith(dateKey));

    return filtered;

  } catch (error) {
    console.error('❌ Failed to get analytics events for date (returning empty):', error);
    return []; // Never throw - return empty array
  }
}

/**
 * Log component error to Firebase RTDB
 *
 * Fire-and-forget pattern: logs component errors for monitoring and debugging.
 * Used by error boundaries to track component failures.
 * Errors are logged but never thrown to avoid blocking caller.
 *
 * NOTE: This function does NOT check consent. Error logging is operational,
 * not analytics tracking per GDPR (logging errors is necessary for app function).
 *
 * @param params - Error details (device, component, message, stack)
 */
export async function logComponentError(params: {
  device?: string;
  component: string;
  message: string;
  stack?: string;
}): Promise<void> {
  try {
    await logAnalyticsEvent({
      eventType: 'component_error',
      source: 'error_boundary',
      component: params.component,
      errorMessage: params.message,
      errorStack: params.stack,
      device: params.device,
    });
  } catch (error) {
    console.error('❌ Failed to log component error (non-blocking):', error);
    // Don't throw - this is fire-and-forget
  }
}

/**
 * Cleanup analytics events older than retention period
 *
 * Fire-and-forget pattern: removes old entries to prevent unbounded growth.
 * Errors are logged but never thrown.
 *
 * @param retentionDays - Number of days to retain (default 7)
 */
export async function cleanupOldAnalyticsEvents(retentionDays: number = 7): Promise<void> {
  try {
    const path = getEnvironmentPath('analyticsEvents');
    const data = await adminDbGet(path) as Record<string, AnalyticsEvent> | null;

    if (!data) {
      return; // No entries to clean
    }

    const now = Date.now();
    const retentionMs = retentionDays * 24 * 60 * 60 * 1000;

    // Find entries older than retention period
    const entriesToDelete: string[] = [];

    Object.entries(data).forEach(([key, event]) => {
      const eventTime = new Date(event.timestamp).getTime();
      const age = now - eventTime;

      if (age > retentionMs) {
        entriesToDelete.push(key);
      }
    });

    // Delete old entries
    if (entriesToDelete.length > 0) {
      for (const key of entriesToDelete) {
        const deletePath = getEnvironmentPath(`analyticsEvents/${key}`);
        await adminDbSet(deletePath, null);
      }
    }

  } catch (error) {
    console.error('❌ Cleanup old analytics events failed (non-blocking):', error);
    // Don't throw - this is fire-and-forget
  }
}
