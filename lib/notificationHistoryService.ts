/**
 * Notification History Service (Server-side only)
 *
 * Provides cursor-based pagination for notification history.
 * Used by /api/notifications/history endpoint.
 *
 * Key features:
 * - Firestore cursor-based pagination (efficient, O(1) per page)
 * - 90-day GDPR filter (always applied per RESEARCH.md Pitfall #1)
 * - Optional type and status filters
 * - Returns serializable cursor for client state
 *
 * NOTE: No 'use server' directive needed - this is a service module
 * imported by API routes, which are already server-side.
 */

import { getAdminFirestore } from './firebaseAdmin';
import { Timestamp, QueryDocumentSnapshot, DocumentData } from 'firebase-admin/firestore';

/**
 * Notification history filter options
 */
interface NotificationHistoryFilter {
  limit?: number;
  cursor?: string | null;
  type?: string | null;
  status?: string | null;
}

/**
 * Get notification history for a user with pagination
 *
 * @param {string} userId - User ID (Auth0 sub)
 * @param {Object} [options] - Query options
 * @param {number} [options.limit=50] - Max notifications to return (default: 50, max: 100)
 * @param {string} [options.cursor=null] - Base64 encoded cursor from previous page
 * @param {string} [options.type=null] - Filter by type (scheduler, error, maintenance, test, generic)
 * @param {string} [options.status=null] - Filter by status (sent, delivered, failed)
 * @returns {Promise<Object>} { notifications: Array, cursor: string|null, hasMore: boolean }
 */
export async function getNotificationHistory(userId: string, options: NotificationHistoryFilter = {}) {
  try {
    const db = getAdminFirestore();

    const {
      limit = 50,
      cursor = null,
      type = null,
      status = null
    } = options;

    // Enforce max limit
    const effectiveLimit = Math.min(limit, 100);

    // Build base query
    let query = db.collection('notificationLogs')
      .where('userId', '==', userId);

    // CRITICAL: Apply 90-day filter ALWAYS (GDPR safeguard per RESEARCH.md Pitfall #1)
    // Firestore TTL deletes within 24 hours, so expired docs may still appear in queries
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const timestampFilter = Timestamp.fromDate(ninetyDaysAgo);

    // Use >= to include records from exactly 90 days ago (not > which excludes boundary)
    query = query.where('timestamp', '>=', timestampFilter);

    // Apply optional type filter
    if (type) {
      query = query.where('type', '==', type);
    }

    // Apply optional status filter
    if (status) {
      query = query.where('status', '==', status);
    }

    // Order by timestamp descending (newest first)
    query = query.orderBy('timestamp', 'desc');

    // Apply cursor pagination if provided
    if (cursor) {
      try {
        // Decode cursor: base64 encoded JSON with docPath and timestamp
        const decodedCursor = JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'));
        const { docId, timestamp: cursorTimestamp } = decodedCursor;

        // Reconstruct document reference for startAfter
        const cursorDoc = await db.collection('notificationLogs').doc(docId).get();

        if (cursorDoc.exists) {
          query = query.startAfter(cursorDoc);
        } else {
          console.warn(`⚠️ Cursor document not found: ${docId}, ignoring cursor`);
        }
      } catch (error) {
        console.error('❌ Error parsing cursor:', error);
        throw new Error('Invalid cursor format');
      }
    }

    // Apply limit (fetch one extra to determine hasMore)
    query = query.limit(effectiveLimit + 1);

    // Execute query
    const snapshot = await query.get();

    // Extract notifications
    const notifications: Array<{
      id: string;
      userId: string;
      type: string;
      status: string;
      title: string;
      body: string;
      deviceCount: number;
      successCount: number;
      failureCount: number;
      fcmErrors: Array<unknown>;
      metadata: Record<string, unknown>;
      timestamp: string;
    }> = [];
    let lastDoc: QueryDocumentSnapshot<DocumentData, DocumentData> | null = null;

    snapshot.forEach((doc: QueryDocumentSnapshot<DocumentData, DocumentData>) => {
      const index = notifications.length;
      // Only include up to effectiveLimit (extra doc is just for hasMore check)
      if (index < effectiveLimit) {
        const data = doc.data();
        notifications.push({
          id: doc.id,
          userId: data.userId,
          type: data.type,
          status: data.status,
          title: data.title,
          body: data.body,
          deviceCount: data.deviceCount,
          successCount: data.successCount,
          failureCount: data.failureCount,
          fcmErrors: data.fcmErrors || [],
          metadata: data.metadata || {},
          timestamp: data.timestamp.toDate().toISOString(), // Convert Firestore Timestamp to ISO string
        });

        // Track last document for cursor generation
        if (index === effectiveLimit - 1) {
          lastDoc = doc;
        }
      }
    });

    // Determine if there are more results
    const hasMore = snapshot.size > effectiveLimit;

    // Generate cursor for next page
    let nextCursor: string | null = null;
    if (hasMore) {
      // lastDoc is guaranteed to be non-null here because we only set hasMore
      // when we have more documents than effectiveLimit, and lastDoc is set
      // when index === effectiveLimit - 1
      if (lastDoc) {
        const doc = lastDoc as QueryDocumentSnapshot<DocumentData, DocumentData>;
        const lastDocData = doc.data();
        const cursorData = {
          docId: doc.id,
          timestamp: lastDocData.timestamp.toDate().toISOString(),
        };
        nextCursor = Buffer.from(JSON.stringify(cursorData)).toString('base64');
      }
    }

    return {
      notifications,
      cursor: nextCursor,
      hasMore,
    };

  } catch (error) {
    console.error('❌ Error fetching notification history:', error);
    throw error;
  }
}
