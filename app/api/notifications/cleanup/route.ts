/**
 * API Route: Cleanup Stale FCM Tokens
 *
 * POST /api/notifications/cleanup
 *
 * Removes FCM tokens that haven't been used in >90 days.
 * Designed to be called by cron-job.org daily.
 *
 * Authentication: Bearer token via CRON_SECRET env var
 *
 * Response:
 * {
 *   success: true,
 *   removed: 5,
 *   scanned: 100,
 *   timestamp: "2026-01-23T12:00:00Z"
 * }
 */

import { getAdminDatabase } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

// Tokens inactive for >90 days are considered stale
const STALE_THRESHOLD_MS = 90 * 24 * 60 * 60 * 1000;

/**
 * POST /api/notifications/cleanup
 * Remove stale FCM tokens
 * Protected: Requires CRON_SECRET bearer token
 */
export async function POST(request) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error('CRON_SECRET not configured');
      return Response.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.warn('Unauthorized cleanup attempt');
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🧹 Starting token cleanup...');

    const db = getAdminDatabase();
    const usersRef = db.ref('users');
    const snapshot = await usersRef.once('value');

    if (!snapshot.exists()) {
      return Response.json({
        success: true,
        removed: 0,
        scanned: 0,
        timestamp: new Date().toISOString(),
        message: 'No users found',
      });
    }

    const now = Date.now();
    const updates = {};
    let scanned = 0;
    let removed = 0;

    snapshot.forEach(userSnap => {
      const userId = userSnap.key;
      const tokens = userSnap.child('fcmTokens').val() || {};

      Object.entries(tokens).forEach(([tokenKey, tokenData]) => {
        scanned++;

        // Use lastUsed if available, otherwise fall back to createdAt
        const lastActivity = tokenData.lastUsed || tokenData.createdAt;

        if (!lastActivity) {
          // No timestamp - consider stale
          updates[`users/${userId}/fcmTokens/${tokenKey}`] = null;
          removed++;
          console.log(`🗑️ Removing token without timestamp (user ${userId})`);
          return;
        }

        const lastActivityTime = new Date(lastActivity).getTime();
        const age = now - lastActivityTime;

        if (age > STALE_THRESHOLD_MS) {
          updates[`users/${userId}/fcmTokens/${tokenKey}`] = null;
          removed++;
          const ageDays = Math.floor(age / (24 * 60 * 60 * 1000));
          console.log(`🗑️ Removing stale token (${ageDays} days old, user ${userId})`);
        }
      });
    });

    // Apply all deletions in single batch update
    if (Object.keys(updates).length > 0) {
      await db.ref().update(updates);
    }

    console.log(`✅ Token cleanup complete: removed ${removed} of ${scanned} tokens`);

    // Cleanup old error logs (30 days retention per 02-CONTEXT.md)
    const ERROR_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
    const errorCutoff = new Date(now - ERROR_RETENTION_MS).toISOString();

    const errorsRef = db.ref('notificationErrors');
    const errorsSnapshot = await errorsRef.once('value');

    let errorsRemoved = 0;
    if (errorsSnapshot.exists()) {
      const errorUpdates = {};
      errorsSnapshot.forEach(errorSnap => {
        const error = errorSnap.val();
        if (error.timestamp && error.timestamp < errorCutoff) {
          errorUpdates[`notificationErrors/${errorSnap.key}`] = null;
          errorsRemoved++;
        }
      });

      if (Object.keys(errorUpdates).length > 0) {
        await db.ref().update(errorUpdates);
      }
    }

    console.log(`✅ Error cleanup complete: removed ${errorsRemoved} old error logs`);
    console.log(`✅ Cleanup complete: removed ${removed} tokens and ${errorsRemoved} error logs`);

    return Response.json({
      success: true,
      removed,
      scanned,
      errorsRemoved,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Cleanup error:', error);
    return Response.json(
      { error: 'Cleanup failed', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/notifications/cleanup
 * Health check endpoint (no auth required)
 */
export async function GET() {
  return Response.json({
    endpoint: '/api/notifications/cleanup',
    method: 'POST',
    auth: 'Bearer token required (CRON_SECRET)',
    purpose: 'Remove stale FCM tokens (>90 days inactive)',
    schedule: 'Daily via cron-job.org',
  });
}
