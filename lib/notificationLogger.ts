/**
 * Notification Logging Service (Server-side only)
 *
 * Logs all notification attempts to Firestore for monitoring and analytics.
 *
 * Collection: notificationLogs
 * Structure: {
 *   timestamp: Firestore Timestamp,
 *   type: 'scheduler' | 'error' | 'maintenance' | 'test' | 'generic',
 *   status: 'sent' | 'delivered' | 'failed',
 *   userId: string,
 *   deviceCount: number,
 *   successCount: number,
 *   failureCount: number,
 *   title: string,
 *   body: string (truncated to 200 chars),
 *   fcmErrors: [{ tokenPrefix, errorCode, errorMessage }],
 *   metadata: { source, isTest }
 * }
 *
 * NOTE: No 'use server' directive needed - this is a service module
 * imported by API routes and firebaseAdmin.js, which are already server-side.
 */

import { getAdminFirestore } from './firebaseAdmin.js';
import { Timestamp, Query, DocumentData } from 'firebase-admin/firestore';
import { subHours } from 'date-fns';

/**
 * Notification log filter options
 */
interface NotificationLogFilter {
  startDate?: Date;
  endDate?: Date;
  status?: string;
  type?: string;
  limit?: number;
}

/**
 * Log a notification send attempt
 *
 * @param {Object} data - Notification data
 * @param {string} data.userId - User ID
 * @param {string} data.type - Notification type
 * @param {string} data.title - Notification title
 * @param {string} data.body - Notification body
 * @param {string} [data.status] - 'sent' | 'delivered' | 'failed' (default: 'sent')
 * @param {number} data.deviceCount - Number of devices targeted
 * @param {number} data.successCount - Number of successful sends
 * @param {number} data.failureCount - Number of failed sends
 * @param {Array} [data.fcmErrors] - Array of FCM errors
 * @param {Object} [data.metadata] - Additional metadata
 * @returns {Promise<string>} Document ID
 */
export async function logNotification(data) {
  try {
    const db = getAdminFirestore();

    const logEntry = {
      timestamp: Timestamp.now(),
      type: data.type || 'generic',
      status: data.status || (data.successCount > 0 ? 'sent' : 'failed'),
      userId: data.userId || 'unknown',
      deviceCount: data.deviceCount || 0,
      successCount: data.successCount || 0,
      failureCount: data.failureCount || 0,
      title: data.title || '',
      body: data.body ? data.body.substring(0, 200) : '', // Truncate to 200 chars
      fcmErrors: data.fcmErrors || [],
      metadata: data.metadata || {},
    };

    const docRef = await db.collection('notificationLogs').add(logEntry);

    console.log(`📝 Logged notification: ${logEntry.type} - ${logEntry.status} (${docRef.id})`);

    return docRef.id;
  } catch (error) {
    console.error('❌ Error logging notification:', error);
    // Don't throw - logging failures shouldn't break notification flow
    return null;
  }
}

/**
 * Log a notification error
 * Convenience wrapper for failed notifications
 *
 * @param {Object} data - Error data
 * @param {string} data.userId - User ID
 * @param {string} data.type - Notification type
 * @param {string} data.title - Notification title
 * @param {string} data.body - Notification body
 * @param {string} data.errorCode - FCM error code
 * @param {string} data.errorMessage - Error message
 * @param {string} data.tokenPrefix - First 20 chars of token
 * @param {Object} [data.metadata] - Additional metadata
 * @returns {Promise<string>} Document ID
 */
export async function logNotificationError(data) {
  return logNotification({
    userId: data.userId || 'unknown',
    type: data.type || 'generic',
    title: data.title || '',
    body: data.body || '',
    status: 'failed',
    deviceCount: 1,
    successCount: 0,
    failureCount: 1,
    fcmErrors: [
      {
        tokenPrefix: data.tokenPrefix || 'unknown',
        errorCode: data.errorCode || 'unknown',
        errorMessage: data.errorMessage || '',
      },
    ],
    metadata: data.metadata || {},
  });
}

/**
 * Get notification logs with filters
 *
 * @param {Object} [options] - Query options
 * @param {Date} [options.startDate] - Start date filter
 * @param {Date} [options.endDate] - End date filter
 * @param {string} [options.status] - Status filter ('sent' | 'delivered' | 'failed')
 * @param {string} [options.type] - Type filter
 * @param {number} [options.limit=100] - Maximum number of logs to return
 * @returns {Promise<Array>} Array of log documents
 */
export async function getNotificationLogs(options: NotificationLogFilter = {}) {
  try {
    const db = getAdminFirestore();

    let query: Query<DocumentData, DocumentData> = db.collection('notificationLogs');

    // Apply filters
    if (options.startDate) {
      query = query.where('timestamp', '>=', Timestamp.fromDate(options.startDate));
    }

    if (options.endDate) {
      query = query.where('timestamp', '<=', Timestamp.fromDate(options.endDate));
    }

    if (options.status) {
      query = query.where('status', '==', options.status);
    }

    if (options.type) {
      query = query.where('type', '==', options.type);
    }

    // Order by timestamp descending (newest first)
    query = query.orderBy('timestamp', 'desc');

    // Apply limit
    const limit = options.limit || 100;
    query = query.limit(limit);

    const snapshot = await query.get();

    const logs = [];
    snapshot.forEach(doc => {
      logs.push({
        id: doc.id,
        ...doc.data(),
        // Convert Firestore Timestamp to ISO string for client
        timestamp: doc.data().timestamp.toDate().toISOString(),
      });
    });

    return logs;
  } catch (error) {
    console.error('❌ Error getting notification logs:', error);
    throw error;
  }
}

/**
 * Get delivery statistics for last N hours
 *
 * @param {number} [hours=24] - Number of hours to look back
 * @returns {Promise<Object>} Statistics { total, sent, delivered, failed, deliveryRate }
 */
export async function getDeliveryStats(hours = 24) {
  try {
    const db = getAdminFirestore();

    const startDate = subHours(new Date(), hours);

    const snapshot = await db
      .collection('notificationLogs')
      .where('timestamp', '>=', Timestamp.fromDate(startDate))
      .get();

    const stats = {
      total: 0,
      sent: 0,
      delivered: 0,
      failed: 0,
      deliveryRate: 0,
    };

    snapshot.forEach(doc => {
      const data = doc.data();
      stats.total++;

      if (data.status === 'sent') stats.sent++;
      else if (data.status === 'delivered') stats.delivered++;
      else if (data.status === 'failed') stats.failed++;
    });

    // Calculate delivery rate
    if (stats.total > 0) {
      stats.deliveryRate = ((stats.sent + stats.delivered) / stats.total) * 100;
    }

    return stats;
  } catch (error) {
    console.error('❌ Error getting delivery stats:', error);
    throw error;
  }
}

/**
 * Rate Alert Tracking
 * Used for automated alerting when delivery rate drops below threshold
 */

const RATE_THRESHOLD = 85; // Alert if below 85%
const ALERT_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour between alerts

/**
 * Check if a rate alert should be sent
 *
 * @param {number} currentRate - Current delivery rate percentage
 * @returns {Promise<Object>} { shouldAlert: boolean, reason: string }
 */
export async function shouldSendRateAlert(currentRate) {
  try {
    if (currentRate >= RATE_THRESHOLD) {
      return { shouldAlert: false, reason: 'Rate above threshold' };
    }

    const db = getAdminFirestore();
    const alertDoc = await db.collection('systemConfig').doc('rateAlert').get();

    if (!alertDoc.exists) {
      return { shouldAlert: true, reason: 'First alert check' };
    }

    const lastAlert = alertDoc.data().lastAlertSent?.toDate();
    if (!lastAlert) {
      return { shouldAlert: true, reason: 'No previous alert' };
    }

    const elapsed = Date.now() - lastAlert.getTime();
    if (elapsed < ALERT_COOLDOWN_MS) {
      const remaining = Math.ceil((ALERT_COOLDOWN_MS - elapsed) / 60000);
      return { shouldAlert: false, reason: `Alert cooldown (${remaining}min remaining)` };
    }

    return { shouldAlert: true, reason: 'Cooldown expired' };
  } catch (error) {
    console.error('❌ Error checking rate alert:', error);
    // On error, don't send alert (fail safe)
    return { shouldAlert: false, reason: 'Error checking cooldown' };
  }
}

/**
 * Record that a rate alert was sent
 *
 * @param {number} rate - Delivery rate at time of alert
 * @returns {Promise<void>}
 */
export async function recordRateAlert(rate) {
  try {
    const db = getAdminFirestore();

    await db.collection('systemConfig').doc('rateAlert').set({
      lastAlertSent: Timestamp.now(),
      deliveryRate: rate,
    });

    console.log(`🚨 Recorded rate alert: ${rate}%`);
  } catch (error) {
    console.error('❌ Error recording rate alert:', error);
    // Don't throw - recording failures shouldn't break alert flow
  }
}

/**
 * Get last rate alert information
 *
 * @returns {Promise<Object|null>} { lastAlertSent: Date, deliveryRate: number } or null
 */
export async function getLastRateAlertInfo() {
  try {
    const db = getAdminFirestore();
    const alertDoc = await db.collection('systemConfig').doc('rateAlert').get();

    if (!alertDoc.exists) {
      return null;
    }

    const data = alertDoc.data();
    return {
      lastAlertSent: data.lastAlertSent?.toDate(),
      deliveryRate: data.deliveryRate,
    };
  } catch (error) {
    console.error('❌ Error getting rate alert info:', error);
    return null;
  }
}
