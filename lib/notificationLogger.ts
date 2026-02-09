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

import { getAdminFirestore } from './firebaseAdmin';
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
export async function logNotification(data: {
  userId?: string;
  type?: string;
  title?: string;
  body?: string;
  status?: string;
  deviceCount?: number;
  successCount?: number;
  failureCount?: number;
  fcmErrors?: Array<{ tokenPrefix: string; errorCode: string; errorMessage: string }>;
  metadata?: Record<string, unknown>;
}) {
  try {
    const db = getAdminFirestore();

    const logEntry = {
      timestamp: Timestamp.now(),
      type: data.type || 'generic',
      status: data.status || ((data.successCount ?? 0) > 0 ? 'sent' : 'failed'),
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
export async function shouldSendRateAlert(currentRate: number) {
  try {
    if (currentRate >= RATE_THRESHOLD) {
      return { shouldAlert: false, reason: 'Rate above threshold' };
    }

    const db = getAdminFirestore();
    const alertDoc = await db.collection('systemConfig').doc('rateAlert').get();

    if (!alertDoc.exists) {
      return { shouldAlert: true, reason: 'First alert check' };
    }

    const data = alertDoc.data();
    const lastAlert = data?.lastAlertSent?.toDate();
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
export async function recordRateAlert(rate: number) {
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
      lastAlertSent: data?.lastAlertSent?.toDate(),
      deliveryRate: data?.deliveryRate,
    };
  } catch (error) {
    console.error('❌ Error getting rate alert info:', error);
    return null;
  }
}
