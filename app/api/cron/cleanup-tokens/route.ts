/**
 * API Route: HMAC-Secured Cron Webhook for Token Cleanup
 *
 * POST /api/cron/cleanup-tokens
 *
 * Webhook endpoint for cron-job.org to trigger automated cleanup of stale FCM tokens (>90 days).
 * Authentication: HMAC-SHA256 signature in x-cron-signature header
 *
 * Response:
 * {
 *   success: true,
 *   tokensRemoved: 5,
 *   tokensScanned: 100,
 *   errorsRemoved: 2,
 *   executionMs: 1234,
 *   timestamp: "2026-01-26T12:00:00Z"
 * }
 */

import { createHmac, timingSafeEqual } from 'crypto';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { getAdminDatabase } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds for cleanup operation

/**
 * GET /api/cron/cleanup-tokens
 * Health check endpoint (no auth required)
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/cron/cleanup-tokens',
    method: 'POST',
    auth: 'HMAC-SHA256 signature in x-cron-signature header',
    purpose: 'Weekly automated token cleanup (>90 days stale)',
    schedule: 'Sunday 3:00 AM via cron-job.org',
    config: {
      secret: 'CRON_WEBHOOK_SECRET environment variable',
      bodyExample: '{}',
      headerExample: 'x-cron-signature: computed_hmac_hex'
    }
  });
}

/**
 * POST /api/cron/cleanup-tokens
 * Execute token cleanup with HMAC signature verification
 */
export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    // Read raw body for signature verification
    const rawBody = await request.text();
    const headersList = await headers();
    const signature = headersList.get('x-cron-signature');

    // Verify signature exists
    if (!signature) {
      console.warn('⛔ Token cleanup rejected: missing signature');
      return NextResponse.json(
        { error: 'Missing x-cron-signature header' },
        { status: 401 }
      );
    }

    // Verify CRON_WEBHOOK_SECRET is configured
    const secret = process.env.CRON_WEBHOOK_SECRET;
    if (!secret) {
      console.error('⛔ CRON_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Compute HMAC-SHA256 signature
    const hmac = createHmac('sha256', secret);
    hmac.update(rawBody);
    const computedSignature = hmac.digest('hex');

    // Convert both signatures to buffers for timing-safe comparison
    const signatureBuffer = Buffer.from(signature, 'hex');
    const computedBuffer = Buffer.from(computedSignature, 'hex');

    // Timing-safe comparison to prevent timing attacks
    if (
      signatureBuffer.length !== computedBuffer.length ||
      !timingSafeEqual(signatureBuffer, computedBuffer)
    ) {
      console.warn('⛔ Token cleanup rejected: invalid signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    console.log('🧹 Starting automated token cleanup (cron trigger)...');

    // Execute cleanup
    const result = await cleanupStaleTokens();

    const executionMs = Date.now() - startTime;

    console.log(
      `✅ Token cleanup complete: ${result.tokensRemoved}/${result.tokensScanned} tokens, ${result.errorsRemoved} errors (${executionMs}ms)`
    );

    return NextResponse.json(
      {
        success: true,
        tokensRemoved: result.tokensRemoved,
        tokensScanned: result.tokensScanned,
        errorsRemoved: result.errorsRemoved,
        executionMs,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    const executionMs = Date.now() - startTime;
    console.error('❌ Token cleanup error:', error);
    return NextResponse.json(
      {
        error: 'Cleanup failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        executionMs,
      },
      { status: 500 }
    );
  }
}

/**
 * Cleanup stale FCM tokens (>90 days) and old error logs (>30 days)
 * Reuses logic from /api/notifications/cleanup with TypeScript typing
 */
async function cleanupStaleTokens(): Promise<{
  tokensRemoved: number;
  tokensScanned: number;
  errorsRemoved: number;
}> {
  const db = getAdminDatabase();
  const now = Date.now();

  // Constants from plan specifications
  const STALE_THRESHOLD_MS = 90 * 24 * 60 * 60 * 1000; // 90 days
  const ERROR_RETENTION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

  // Step 1: Cleanup stale FCM tokens
  const usersRef = db.ref('users');
  const snapshot = await usersRef.once('value');

  let tokensScanned = 0;
  let tokensRemoved = 0;
  const tokenUpdates: Record<string, null> = {};

  if (snapshot.exists()) {
    snapshot.forEach(userSnap => {
      const userId = userSnap.key;
      const tokens = userSnap.child('fcmTokens').val() || {};

      Object.entries(tokens).forEach(([tokenKey, tokenData]: [string, any]) => {
        tokensScanned++;

        // Use lastUsed if available, otherwise fall back to createdAt
        const lastActivity = tokenData.lastUsed || tokenData.createdAt;

        if (!lastActivity) {
          // No timestamp - consider stale
          tokenUpdates[`users/${userId}/fcmTokens/${tokenKey}`] = null;
          tokensRemoved++;
          console.log(`🗑️ Removing token without timestamp (user ${userId})`);
          return;
        }

        const lastActivityTime = new Date(lastActivity).getTime();
        const age = now - lastActivityTime;

        if (age > STALE_THRESHOLD_MS) {
          tokenUpdates[`users/${userId}/fcmTokens/${tokenKey}`] = null;
          tokensRemoved++;
          const ageDays = Math.floor(age / (24 * 60 * 60 * 1000));
          console.log(
            `🗑️ Removing stale token (${ageDays} days old, user ${userId})`
          );
        }
      });
    });

    // Apply token deletions in single batch update
    if (Object.keys(tokenUpdates).length > 0) {
      await db.ref().update(tokenUpdates);
    }
  }

  // Step 2: Cleanup old error logs (30 days retention per 02-CONTEXT.md)
  const errorCutoff = new Date(now - ERROR_RETENTION_MS).toISOString();
  const errorsRef = db.ref('notificationErrors');
  const errorsSnapshot = await errorsRef.once('value');

  let errorsRemoved = 0;
  const errorUpdates: Record<string, null> = {};

  if (errorsSnapshot.exists()) {
    errorsSnapshot.forEach(errorSnap => {
      const error = errorSnap.val();
      if (error?.timestamp && error.timestamp < errorCutoff) {
        errorUpdates[`notificationErrors/${errorSnap.key}`] = null;
        errorsRemoved++;
      }
    });

    // Apply error deletions in single batch update
    if (Object.keys(errorUpdates).length > 0) {
      await db.ref().update(errorUpdates);
    }
  }

  console.log(
    `✅ Cleanup summary: ${tokensRemoved}/${tokensScanned} tokens, ${errorsRemoved} error logs`
  );

  return {
    tokensRemoved,
    tokensScanned,
    errorsRemoved,
  };
}
