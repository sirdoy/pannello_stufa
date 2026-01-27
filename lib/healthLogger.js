/**
 * Health Logger Service (Server-side only)
 *
 * Logs stove health monitoring events to Firestore for audit trail and dashboard queries.
 * Uses parent/subcollection structure: one parent doc per cron run with individual checks as subcollection.
 *
 * Collection: healthMonitoring
 * Structure: {
 *   timestamp: Firestore Timestamp,
 *   checkedCount: number,
 *   successCount: number,
 *   failureCount: number,
 *   hasStateMismatch: boolean,
 *   duration: number (ms),
 * }
 *
 * Subcollection: checks
 * Structure: {
 *   userId: string,
 *   status: 'fulfilled' | 'rejected',
 *   connectionStatus: 'online' | 'offline' | 'error' | null,
 *   stoveStatus: string | null,
 *   expectedState: 'ON' | 'OFF' | null,
 *   netatmoDemand: 'heating' | 'idle' | null,
 *   stateMismatch: { detected, expected, actual, reason } | null,
 *   error: string | null,
 * }
 *
 * NOTE: Fire-and-forget pattern - logging failures don't throw (don't block health check flow)
 */

import { getAdminFirestore } from './firebaseAdmin.js';
import { Timestamp } from 'firebase-admin/firestore';
import { subDays } from 'date-fns';

/**
 * Log health check run results to Firestore
 * Creates parent document with aggregated stats and subcollection with individual checks
 *
 * @param {Array} results - Array of Promise.allSettled results from checkUserStoveHealth
 * @param {Object} [options={}] - Optional metadata
 * @param {number} [options.duration] - Execution duration in milliseconds
 * @returns {Promise<string|null>} Parent document ID or null on error
 */
export async function logHealthCheckRun(results, options = {}) {
  try {
    const db = getAdminFirestore();

    // Calculate aggregated stats
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const failureCount = results.filter(r => r.status === 'rejected').length;
    const hasStateMismatch = results.some(r =>
      r.status === 'fulfilled' && r.value?.stateMismatch?.detected
    );

    // Create parent document
    const parentDoc = await db.collection('healthMonitoring').add({
      timestamp: Timestamp.now(),
      checkedCount: results.length,
      successCount,
      failureCount,
      hasStateMismatch,
      duration: options.duration || 0,
    });

    console.log(`📝 Logged health check run: ${parentDoc.id} (${successCount}/${results.length} successful)`);

    // Create subcollection documents for individual checks (batch writes for efficiency)
    if (results.length > 0) {
      const batch = db.batch();

      results.forEach((result, idx) => {
        const checkDoc = parentDoc.collection('checks').doc();

        if (result.status === 'fulfilled') {
          // Successful check
          const health = result.value;

          batch.set(checkDoc, {
            userId: health.userId || 'unknown',
            status: 'fulfilled',
            connectionStatus: health.connectionStatus || null,
            stoveStatus: health.stoveStatus?.StatusDescription || null,
            expectedState: health.expectedState || null,
            netatmoDemand: health.netatmoDemand || null,
            stateMismatch: health.stateMismatch || null,
            error: null,
          });
        } else {
          // Failed check
          batch.set(checkDoc, {
            userId: 'unknown', // Can't determine userId from rejected promise
            status: 'rejected',
            connectionStatus: null,
            stoveStatus: null,
            expectedState: null,
            netatmoDemand: null,
            stateMismatch: null,
            error: result.reason?.message || 'Unknown error',
          });
        }
      });

      await batch.commit();
      console.log(`✅ Logged ${results.length} individual health checks to subcollection`);
    }

    return parentDoc.id;

  } catch (error) {
    console.error('❌ Error logging health check run:', error);
    // Don't throw - logging failures shouldn't break health check flow (fire-and-forget)
    return null;
  }
}

/**
 * Get recent health check logs with filters
 *
 * @param {Object} [options={}] - Query options
 * @param {Date} [options.startDate] - Start date filter (default: 24 hours ago)
 * @param {Date} [options.endDate] - End date filter (default: now)
 * @param {boolean} [options.hasStateMismatch] - Filter by state mismatch flag
 * @param {number} [options.limit=100] - Maximum number of logs to return
 * @returns {Promise<Array>} Array of log documents with converted timestamps
 */
export async function getRecentHealthLogs(options = {}) {
  try {
    const db = getAdminFirestore();

    let query = db.collection('healthMonitoring');

    // Apply date filters (default to last 24 hours)
    const startDate = options.startDate || subDays(new Date(), 1);
    const endDate = options.endDate || new Date();

    query = query.where('timestamp', '>=', Timestamp.fromDate(startDate));
    query = query.where('timestamp', '<=', Timestamp.fromDate(endDate));

    // Apply state mismatch filter if specified
    if (options.hasStateMismatch !== undefined) {
      query = query.where('hasStateMismatch', '==', options.hasStateMismatch);
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
    console.error('❌ Error getting recent health logs:', error);
    throw error;
  }
}

/**
 * Get individual health checks for a specific run
 * Fetches subcollection documents for a parent health check run
 *
 * @param {string} runId - Parent document ID
 * @returns {Promise<Array>} Array of individual check documents
 */
export async function getHealthCheckDetails(runId) {
  try {
    const db = getAdminFirestore();

    const snapshot = await db
      .collection('healthMonitoring')
      .doc(runId)
      .collection('checks')
      .get();

    const checks = [];
    snapshot.forEach(doc => {
      checks.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return checks;

  } catch (error) {
    console.error('❌ Error getting health check details:', error);
    throw error;
  }
}

/**
 * Get health monitoring statistics for last N days
 * Useful for dashboard summary cards
 *
 * @param {number} [days=7] - Number of days to analyze
 * @returns {Promise<Object>} Statistics { totalRuns, totalChecks, successRate, mismatchCount }
 */
export async function getHealthStats(days = 7) {
  try {
    const db = getAdminFirestore();

    const startDate = subDays(new Date(), days);

    const snapshot = await db
      .collection('healthMonitoring')
      .where('timestamp', '>=', Timestamp.fromDate(startDate))
      .get();

    const stats = {
      totalRuns: 0,
      totalChecks: 0,
      successfulChecks: 0,
      failedChecks: 0,
      mismatchCount: 0,
      successRate: 0,
    };

    snapshot.forEach(doc => {
      const data = doc.data();
      stats.totalRuns++;
      stats.totalChecks += data.checkedCount || 0;
      stats.successfulChecks += data.successCount || 0;
      stats.failedChecks += data.failureCount || 0;

      if (data.hasStateMismatch) {
        stats.mismatchCount++;
      }
    });

    // Calculate success rate
    if (stats.totalChecks > 0) {
      stats.successRate = ((stats.successfulChecks / stats.totalChecks) * 100).toFixed(1);
    }

    return stats;

  } catch (error) {
    console.error('❌ Error getting health stats:', error);
    throw error;
  }
}
