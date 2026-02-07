/**
 * API Route: Health Monitoring Logs
 *
 * GET /api/health-monitoring/logs
 *
 * Returns paginated health monitoring event logs for authenticated users.
 * Supports cursor-based pagination and filtering by type/severity.
 */

import {
  withAuthAndErrorHandler,
  success,
  error as errorResponse,
  ERROR_CODES,
  HTTP_STATUS,
} from '@/lib/core';
import { getAdminFirestore } from '@/lib/firebaseAdmin';
import { Timestamp, Query, DocumentData } from 'firebase-admin/firestore';
import { subDays } from 'date-fns';

export const dynamic = 'force-dynamic';

/**
 * GET /api/health-monitoring/logs
 *
 * Query parameters:
 * - limit: Max events to return (default: 50, max: 100)
 * - cursor: Document ID for cursor-based pagination (optional)
 * - type: Filter by type (optional: 'mismatch' for hasStateMismatch=true)
 * - severity: Filter by severity (optional: 'error' for failureCount>0, 'warning' for hasStateMismatch=true)
 *
 * Response:
 * {
 *   events: Array<HealthEvent>,
 *   cursor: string | null,
 *   hasMore: boolean
 * }
 *
 * Protected: Requires Auth0 authentication
 */
export const GET = withAuthAndErrorHandler(async (request, context, session) => {
  // Parse query parameters
  const { searchParams } = new URL(request.url);

  const limitParam = searchParams.get('limit');
  const cursor = searchParams.get('cursor');
  const type = searchParams.get('type');
  const severity = searchParams.get('severity');

  // Validate limit parameter
  let limit = 50; // Default
  if (limitParam) {
    const parsedLimit = parseInt(limitParam, 10);
    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
      return errorResponse('Invalid limit parameter (must be 1-100)', ERROR_CODES.INVALID_INPUT, HTTP_STATUS.BAD_REQUEST);
    }
    limit = parsedLimit;
  }

  // Validate type filter
  if (type && type !== 'mismatch') {
    return errorResponse(
      `Invalid type parameter (valid: mismatch)`,
      ERROR_CODES.INVALID_INPUT,
      HTTP_STATUS.BAD_REQUEST
    );
  }

  // Validate severity filter
  if (severity && !['error', 'warning'].includes(severity)) {
    return errorResponse(
      `Invalid severity parameter (valid: error, warning)`,
      ERROR_CODES.INVALID_INPUT,
      HTTP_STATUS.BAD_REQUEST
    );
  }

  // Fetch health monitoring logs
  try {
    const db = getAdminFirestore();
    let query: Query<DocumentData, DocumentData> = db.collection('healthMonitoring');

    // Apply 7-day date filter
    const startDate = subDays(new Date(), 7);
    query = query.where('timestamp', '>=', Timestamp.fromDate(startDate));

    // Apply type filter (mismatch = hasStateMismatch)
    if (type === 'mismatch') {
      query = query.where('hasStateMismatch', '==', true);
    }

    // Apply severity filter
    if (severity === 'error') {
      query = query.where('failureCount', '>', 0);
    } else if (severity === 'warning') {
      query = query.where('hasStateMismatch', '==', true);
    }

    // Order by timestamp descending (newest first)
    query = query.orderBy('timestamp', 'desc');

    // Apply cursor if provided (start after document)
    if (cursor) {
      const cursorDoc = await db.collection('healthMonitoring').doc(cursor).get();
      if (!cursorDoc.exists) {
        return errorResponse('Invalid cursor', ERROR_CODES.INVALID_INPUT, HTTP_STATUS.BAD_REQUEST);
      }
      query = query.startAfter(cursorDoc);
    }

    // Apply limit
    query = query.limit(limit);

    const snapshot = await query.get();

    // Convert documents to event objects
    interface HealthEvent {
      id: string;
      timestamp: string;
      checkedCount: number;
      successCount: number;
      failureCount: number;
      hasStateMismatch: boolean;
      duration: number;
    }

    const events: HealthEvent[] = [];
    snapshot.forEach(doc => {
      const data = doc.data() as {
        timestamp: Timestamp;
        checkedCount: number;
        successCount: number;
        failureCount: number;
        hasStateMismatch: boolean;
        duration: number;
      };
      events.push({
        id: doc.id,
        timestamp: data.timestamp.toDate().toISOString(),
        checkedCount: data.checkedCount,
        successCount: data.successCount,
        failureCount: data.failureCount,
        hasStateMismatch: data.hasStateMismatch,
        duration: data.duration,
      });
    });

    // Determine next cursor and hasMore flag
    const nextCursor = events.length === limit ? events[events.length - 1].id : null;
    const hasMore = events.length === limit;

    return success({
      events,
      cursor: nextCursor,
      hasMore,
    });

  } catch (error) {
    console.error('❌ Error fetching health monitoring logs:', error);

    // Handle specific errors
    if (error instanceof Error && error.message?.includes('cursor')) {
      return errorResponse('Invalid cursor', ERROR_CODES.INVALID_INPUT, HTTP_STATUS.BAD_REQUEST);
    }

    // Generic error
    throw error;
  }

}, 'HealthMonitoring/Logs');
