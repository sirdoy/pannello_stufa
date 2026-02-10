/**
 * Coordination Event Logger Service (Server-side only)
 *
 * Logs coordination events to Firestore for audit trail and dashboard queries.
 * Follows fire-and-forget pattern from healthLogger.js - logging failures don't block coordination.
 *
 * Collection: coordinationEvents
 * Structure: {
 *   timestamp: Firestore Timestamp,
 *   userId: string,
 *   eventType: string,          // 'boost_applied', 'setpoints_restored', 'automation_paused', etc.
 *   stoveStatus: string,        // Current stove status
 *   action: string,             // 'applied', 'restored', 'paused', 'skipped', 'debouncing'
 *   details: {
 *     // Varies by event type
 *     rooms: [{ roomId, roomName, setpoint, previous, capped }],
 *     pausedUntil: number,
 *     pauseReason: string,
 *     throttleWaitSeconds: number,
 *     // etc.
 *   },
 *   notificationSent: boolean,  // Whether notification was actually sent
 *   cronRunId: string | null,   // Links to cron run for correlation
 * }
 *
 * NOTE: Fire-and-forget pattern - logging failures don't throw (don't block coordination flow)
 */

import { getAdminFirestore } from './firebaseAdmin';
import { Timestamp, Query, DocumentData } from 'firebase-admin/firestore';
import { subDays } from 'date-fns';

/**
 * Coordination event type
 */
type CoordinationEventType =
  | 'boost_applied'
  | 'setpoints_restored'
  | 'automation_paused'
  | 'user_intent_detected'
  | 'max_setpoint_capped'
  | 'notification_sent'
  | 'notification_throttled'
  | 'coordination_error'
  | 'coordination_debouncing';

/**
 * Coordination action
 */
type CoordinationAction = 'applied' | 'restored' | 'paused' | 'skipped' | 'debouncing' | 'no_change' | 'capped' | 'retry_timer' | 'throttled' | 'error';

/**
 * Coordination event data
 */
interface CoordinationEvent {
  userId: string;
  eventType: CoordinationEventType;
  stoveStatus: string;
  action: CoordinationAction;
  details?: Record<string, unknown>;
  notificationSent?: boolean;
  cronRunId?: string | null;
}

/**
 * Query options for coordination events
 */
interface QueryOptions {
  userId?: string;
  eventType?: CoordinationEventType;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

/**
 * Coordination statistics
 */
interface CoordinationStats {
  totalEvents: number;
  byEventType: Record<string, number>;
  notificationsSent: number;
  notificationsThrottled: number;
  pauseCount: number;
  totalPauseDurationMinutes: number;
  averagePauseDurationMinutes: number;
}

/**
 * Log coordination event to Firestore
 * Fire-and-forget: catches errors, returns null on failure
 */
export async function logCoordinationEvent(event: CoordinationEvent): Promise<string | null> {
  try {
    const db = getAdminFirestore();

    // Validate required fields
    if (!event.userId || !event.eventType || !event.stoveStatus || !event.action) {
      console.error('❌ Missing required fields for coordination event:', event);
      return null;
    }

    // Create event document with timestamp
    const eventDoc = {
      timestamp: Timestamp.now(),
      userId: event.userId,
      eventType: event.eventType,
      stoveStatus: event.stoveStatus,
      action: event.action,
      details: event.details || {},
      notificationSent: event.notificationSent || false,
      cronRunId: event.cronRunId || null,
    };

    const docRef = await db.collection('coordinationEvents').add(eventDoc);


    return docRef.id;

  } catch (error) {
    console.error('❌ Error logging coordination event:', error);
    // Don't throw - logging failures shouldn't break coordination flow (fire-and-forget)
    return null;
  }
}

/**
 * Get recent coordination events with filters
 */
export async function getRecentCoordinationEvents(
  options: QueryOptions = {}
): Promise<Array<Record<string, unknown>>> {
  try {
    const db = getAdminFirestore();

    let query: Query<DocumentData, DocumentData> = db.collection('coordinationEvents');

    // Apply user filter if specified
    if (options.userId) {
      query = query.where('userId', '==', options.userId);
    }

    // Apply event type filter if specified
    if (options.eventType) {
      query = query.where('eventType', '==', options.eventType);
    }

    // Apply date filters (default to last 7 days)
    const startDate = options.startDate || subDays(new Date(), 7);
    const endDate = options.endDate || new Date();

    query = query.where('timestamp', '>=', Timestamp.fromDate(startDate));
    query = query.where('timestamp', '<=', Timestamp.fromDate(endDate));

    // Order by timestamp descending (newest first)
    query = query.orderBy('timestamp', 'desc');

    // Apply limit
    const limit = options.limit || 100;
    query = query.limit(limit);

    const snapshot = await query.get();

    const events: Array<Record<string, unknown>> = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      events.push({
        id: doc.id,
        ...data,
        // Convert Firestore Timestamp to ISO string for client
        timestamp: (data.timestamp as Timestamp).toDate().toISOString(),
      });
    });

    return events;

  } catch (error) {
    console.error('❌ Error getting recent coordination events:', error);
    throw error;
  }
}

/**
 * Get coordination statistics for last N days
 * Useful for dashboard summary cards
 */
export async function getCoordinationStats(
  userId: string,
  days = 7
): Promise<CoordinationStats> {
  try {
    const db = getAdminFirestore();

    const startDate = subDays(new Date(), days);

    let query = db
      .collection('coordinationEvents')
      .where('userId', '==', userId)
      .where('timestamp', '>=', Timestamp.fromDate(startDate));

    const snapshot = await query.get();

    const stats: CoordinationStats = {
      totalEvents: 0,
      byEventType: {},
      notificationsSent: 0,
      notificationsThrottled: 0,
      pauseCount: 0,
      totalPauseDurationMinutes: 0,
      averagePauseDurationMinutes: 0,
    };

    const pauseDurations: number[] = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      stats.totalEvents++;

      // Count by event type
      stats.byEventType[data.eventType] = (stats.byEventType[data.eventType] || 0) + 1;

      // Count notifications sent
      if (data.notificationSent) {
        stats.notificationsSent++;
      }

      // Count throttled notifications
      if (data.eventType === 'notification_throttled') {
        stats.notificationsThrottled++;
      }

      // Track pause durations
      if (data.eventType === 'automation_paused' && data.details?.pausedUntil) {
        stats.pauseCount++;
        const pauseStart = (data.timestamp as Timestamp).toDate().getTime();
        const pauseEnd = data.details.pausedUntil as number;
        const durationMinutes = (pauseEnd - pauseStart) / (60 * 1000);
        pauseDurations.push(durationMinutes);
      }
    });

    // Calculate average pause duration
    if (pauseDurations.length > 0) {
      stats.totalPauseDurationMinutes = pauseDurations.reduce((sum, d) => sum + d, 0);
      stats.averagePauseDurationMinutes = Math.round(
        stats.totalPauseDurationMinutes / pauseDurations.length
      );
    } else {
      stats.averagePauseDurationMinutes = 0;
    }

    return stats;

  } catch (error) {
    console.error('❌ Error getting coordination stats:', error);
    throw error;
  }
}

