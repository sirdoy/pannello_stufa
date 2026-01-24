/**
 * API Route: Notification Error Logs
 *
 * GET /api/notifications/errors
 * Query notification errors logged during FCM send failures
 *
 * POST /api/notifications/errors
 * Mark notification error as resolved
 *
 * Authentication: Required via Auth0
 */

import { getAdminDatabase } from '@/lib/firebaseAdmin';
import { withAuthAndErrorHandler } from '@/lib/core/middleware';
import { success, badRequest } from '@/lib/core/apiResponse';

export const dynamic = 'force-dynamic';

/**
 * GET /api/notifications/errors
 * Query notification errors with filtering
 *
 * Query parameters:
 * - limit: number (default 50, max 200)
 * - errorCode: string (filter by specific FCM error code)
 * - since: ISO timestamp (filter errors after this time)
 * - resolved: boolean (filter by resolved status)
 *
 * Response:
 * {
 *   success: true,
 *   errors: [{
 *     id: string,
 *     timestamp: string,
 *     userId: string,
 *     tokenPrefix: string,
 *     deviceId: string | null,
 *     errorCode: string,
 *     errorMessage: string,
 *     notificationType: string,
 *     notificationTitle: string,
 *     resolved: boolean
 *   }],
 *   count: number,
 *   filters: { errorCode, since, resolved, limit }
 * }
 */
export const GET = withAuthAndErrorHandler(async (request) => {
  const { searchParams } = new URL(request.url);

  // Parse query parameters
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
  const errorCode = searchParams.get('errorCode') || null;
  const since = searchParams.get('since') || null;
  const resolvedParam = searchParams.get('resolved');
  const resolved = resolvedParam !== null ? resolvedParam === 'true' : null;

  console.log('🔍 Querying notification errors:', { limit, errorCode, since, resolved });

  const db = getAdminDatabase();
  const errorsRef = db.ref('notificationErrors');
  const snapshot = await errorsRef.once('value');

  if (!snapshot.exists()) {
    return success({
      errors: [],
      count: 0,
      filters: { errorCode, since, resolved, limit },
    });
  }

  // Convert to array and apply filters
  let errors = [];
  snapshot.forEach(errorSnap => {
    const error = errorSnap.val();
    errors.push({
      id: errorSnap.key,
      ...error,
    });
  });

  // Apply filters in memory (Firebase RTDB has limited query capabilities)
  if (errorCode) {
    errors = errors.filter(e => e.errorCode === errorCode);
  }

  if (since) {
    errors = errors.filter(e => e.timestamp >= since);
  }

  if (resolved !== null) {
    errors = errors.filter(e => e.resolved === resolved);
  }

  // Sort by timestamp descending (most recent first)
  errors.sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
    return timeB - timeA;
  });

  // Apply limit
  const limitedErrors = errors.slice(0, limit);

  console.log(`✅ Found ${limitedErrors.length} errors (total: ${errors.length})`);

  return success({
    errors: limitedErrors,
    count: limitedErrors.length,
    filters: { errorCode, since, resolved, limit },
  });
}, 'GetNotificationErrors');

/**
 * POST /api/notifications/errors
 * Mark notification error as resolved
 *
 * Request body:
 * {
 *   errorId: string
 * }
 *
 * Response:
 * {
 *   success: true,
 *   resolved: string (errorId)
 * }
 */
export const POST = withAuthAndErrorHandler(async (request) => {
  const body = await request.json();
  const { errorId } = body;

  if (!errorId) {
    return badRequest('Missing errorId');
  }

  console.log('✅ Marking error as resolved:', errorId);

  const db = getAdminDatabase();
  const errorRef = db.ref(`notificationErrors/${errorId}`);

  // Check if error exists
  const snapshot = await errorRef.once('value');
  if (!snapshot.exists()) {
    return badRequest('Error not found');
  }

  // Update resolved status
  await errorRef.update({ resolved: true });

  console.log('✅ Error marked as resolved:', errorId);

  return success({
    resolved: errorId,
  });
}, 'ResolveNotificationError');
