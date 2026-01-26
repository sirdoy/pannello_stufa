/**
 * API Route: Notification History
 *
 * GET /api/notifications/history
 *
 * Returns paginated notification history for authenticated user.
 * Supports cursor-based pagination and filtering by type/status.
 */

import {
  withAuthAndErrorHandler,
  success,
  error as errorResponse,
} from '@/lib/core';
import { getNotificationHistory } from '@/lib/notificationHistoryService';
import {
  isValidNotificationType,
  isValidNotificationStatus,
} from '@/lib/notificationValidation';

export const dynamic = 'force-dynamic';

/**
 * GET /api/notifications/history
 *
 * Query parameters:
 * - limit: Max notifications to return (default: 50, max: 100)
 * - cursor: Base64 encoded cursor from previous page (optional)
 * - type: Filter by notification type (optional: scheduler, error, maintenance, test, generic)
 * - status: Filter by status (optional: sent, delivered, failed)
 *
 * Response:
 * {
 *   notifications: Array<Notification>,
 *   cursor: string | null,
 *   hasMore: boolean,
 *   count: number
 * }
 *
 * Protected: Requires Auth0 authentication
 */
export const GET = withAuthAndErrorHandler(async (request, context, session) => {
  const user = session.user;

  // Parse query parameters
  const { searchParams } = new URL(request.url);

  const limitParam = searchParams.get('limit');
  const cursor = searchParams.get('cursor');
  const type = searchParams.get('type');
  const status = searchParams.get('status');

  // Validate limit parameter
  let limit = 50; // Default
  if (limitParam) {
    const parsedLimit = parseInt(limitParam, 10);
    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
      return errorResponse('Invalid limit parameter (must be 1-100)', 400);
    }
    limit = parsedLimit;
  }

  // Validate type filter
  if (type && !isValidNotificationType(type)) {
    return errorResponse(
      `Invalid type parameter (valid: scheduler, error, maintenance, test, generic)`,
      400
    );
  }

  // Validate status filter
  if (status && !isValidNotificationStatus(status)) {
    return errorResponse(
      `Invalid status parameter (valid: sent, delivered, failed)`,
      400
    );
  }

  // Validate cursor if provided
  if (cursor) {
    try {
      // Test base64 decode
      Buffer.from(cursor, 'base64').toString('utf-8');
    } catch (err) {
      return errorResponse('Invalid cursor format', 400);
    }
  }

  // Fetch notification history
  try {
    const result = await getNotificationHistory(user.sub, {
      limit,
      cursor,
      type,
      status,
    });

    return success({
      notifications: result.notifications,
      cursor: result.cursor,
      hasMore: result.hasMore,
      count: result.notifications.length,
    });

  } catch (error) {
    console.error('❌ Error fetching notification history:', error);

    // Handle specific errors
    if (error.message === 'Invalid cursor format') {
      return errorResponse('Invalid cursor', 400);
    }

    // Generic error
    throw error;
  }

}, 'Notifications/History');
