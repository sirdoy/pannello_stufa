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

import { cleanupStaleTokens } from '@/lib/services/tokenCleanupService';

export const dynamic = 'force-dynamic';

/**
 * POST /api/notifications/cleanup
 * Remove stale FCM tokens
 * Protected: Requires CRON_SECRET bearer token
 */
export async function POST(request: Request): Promise<Response> {
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

    // Delegate to shared service
    const result = await cleanupStaleTokens();

    if (!result.cleaned) {
      return Response.json(
        {
          error: 'Cleanup failed',
          reason: result.reason,
          message: result.error,
        },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      removed: result.tokensRemoved,
      scanned: result.tokensScanned,
      errorsRemoved: result.errorsRemoved,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Cleanup error:', error);
    return Response.json(
      { error: 'Cleanup failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/notifications/cleanup
 * Health check endpoint (no auth required)
 */
export async function GET(): Promise<Response> {
  return Response.json({
    endpoint: '/api/notifications/cleanup',
    method: 'POST',
    auth: 'Bearer token required (CRON_SECRET)',
    purpose: 'Remove stale FCM tokens (>90 days inactive)',
    schedule: 'Daily via cron-job.org',
  });
}
