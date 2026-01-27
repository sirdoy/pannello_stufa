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

import { getAdminFirestore } from './firebaseAdmin.js';
import { Timestamp } from 'firebase-admin/firestore';
import { subDays } from 'date-fns';

/**
 * Log coordination event to Firestore
 * Fire-and-forget: catches errors, returns null on failure
 *
 * @param {Object} event - Event data
 * @param {string} event.userId - User ID (Auth0 sub)
 * @param {string} event.eventType - Event type: 'boost_applied', 'setpoints_restored', 'automation_paused', 'user_intent_detected', 'max_setpoint_capped', 'notification_sent', 'notification_throttled'
 * @param {string} event.stoveStatus - Current stove status
 * @param {string} event.action - Action taken: 'applied', 'restored', 'paused', 'skipped', 'debouncing'
 * @param {Object} [event.details={}] - Event-specific details
 * @param {boolean} [event.notificationSent=false] - Whether notification was sent
 * @param {string} [event.cronRunId=null] - Optional cron run ID for correlation
 * @returns {Promise<string|null>} Document ID or null on error
 */
export async function logCoordinationEvent(event) {
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

    console.log(`📝 Logged coordination event: ${event.eventType}/${event.action} (${docRef.id})`);

    return docRef.id;

  } catch (error) {
    console.error('❌ Error logging coordination event:', error);
    // Don't throw - logging failures shouldn't break coordination flow (fire-and-forget)
    return null;
  }
}

/**
 * Get recent coordination events with filters
 *
 * @param {Object} [options={}] - Query options
 * @param {string} [options.userId] - Filter by user ID
 * @param {string} [options.eventType] - Filter by event type
 * @param {Date} [options.startDate] - Start date filter (default: 7 days ago)
 * @param {Date} [options.endDate] - End date filter (default: now)
 * @param {number} [options.limit=100] - Maximum number of events to return
 * @returns {Promise<Array>} Array of event documents with converted timestamps
 */
export async function getRecentCoordinationEvents(options = {}) {
  try {
    const db = getAdminFirestore();

    let query = db.collection('coordinationEvents');

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

    const events = [];
    snapshot.forEach(doc => {
      events.push({
        id: doc.id,
        ...doc.data(),
        // Convert Firestore Timestamp to ISO string for client
        timestamp: doc.data().timestamp.toDate().toISOString(),
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
 *
 * @param {string} userId - User ID to get stats for
 * @param {number} [days=7] - Number of days to analyze
 * @returns {Promise<Object>} Statistics
 */
export async function getCoordinationStats(userId, days = 7) {
  try {
    const db = getAdminFirestore();

    const startDate = subDays(new Date(), days);

    let query = db
      .collection('coordinationEvents')
      .where('userId', '==', userId)
      .where('timestamp', '>=', Timestamp.fromDate(startDate));

    const snapshot = await query.get();

    const stats = {
      totalEvents: 0,
      byEventType: {},
      notificationsSent: 0,
      notificationsThrottled: 0,
      pauseCount: 0,
      totalPauseDurationMinutes: 0,
    };

    const pauseDurations = [];

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
        const pauseStart = data.timestamp.toDate().getTime();
        const pauseEnd = data.details.pausedUntil;
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

export default {
  logCoordinationEvent,
  getRecentCoordinationEvents,
  getCoordinationStats,
};
