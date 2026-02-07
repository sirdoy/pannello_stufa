/**
 * API Route: Coordination Enforcement Cron
 *
 * GET /api/coordination/enforce?secret=xxx
 *
 * Cron job endpoint for automated stove-thermostat coordination:
 * - Validates cron secret (HMAC security)
 * - Gets current stove status
 * - Executes coordination cycle via processCoordinationCycle
 * - Logs events to Firestore (fire-and-forget)
 * - Returns action summary with timing
 *
 * Protected: Requires CRON_SECRET (query param or Authorization header)
 * Frequency: Every minute (recommended)
 */

import { withCronSecret, success } from '@/lib/core';
import { processCoordinationCycle } from '@/lib/coordinationOrchestrator';
import { getStoveStatus } from '@/lib/stoveApi';
import { adminDbGet } from '@/lib/firebaseAdmin';
import { logCoordinationEvent } from '@/lib/coordinationEventLogger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface CoordinationResponse {
  success: boolean;
  action: string;
  details: Record<string, any>;
  timestamp: number;
  duration: number;
}

/**
 * GET /api/coordination/enforce
 * Main cron handler for coordination enforcement
 * Protected: Requires CRON_SECRET
 */
export const GET = withCronSecret(async (request) => {
  const startTime = Date.now();

  // 1. Get ADMIN_USER_ID from environment
  const userId = process.env.ADMIN_USER_ID;

  if (!userId) {
    console.warn('⚠️ ADMIN_USER_ID not configured');
    return success({
      success: false,
      action: 'error',
      details: {
        error: 'ADMIN_USER_ID not configured',
      },
      timestamp: Date.now(),
      duration: Date.now() - startTime,
    });
  }

  // 2. Get current stove status
  let stoveStatus: string;
  let stoveStatusDescription: string;

  try {
    const stoveData = await getStoveStatus();
    stoveStatusDescription = stoveData?.StatusDescription || 'UNKNOWN';
    stoveStatus = stoveStatusDescription;
  } catch (error) {
    console.error('❌ [Coordination] Failed to get stove status:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Log error to Firestore (fire-and-forget)
    logCoordinationEvent({
      userId,
      eventType: 'coordination_error',
      stoveStatus: 'ERROR',
      action: 'error',
      details: {
        error: errorMessage,
        source: 'stove_api',
      },
      notificationSent: false,
    }).catch(() => {});

    return success({
      success: false,
      action: 'error',
      details: {
        error: 'Failed to get stove status',
        message: errorMessage,
      },
      timestamp: Date.now(),
      duration: Date.now() - startTime,
    });
  }

  // 3. Get home_id from Firebase
  let homeId: string;

  try {
    const fetchedHomeId = (await adminDbGet(`users/${userId}/home_id`)) as string | null;

    if (!fetchedHomeId) {
      console.warn('⚠️ [Coordination] No home_id found for user');

      // Log error to Firestore (fire-and-forget)
      logCoordinationEvent({
        userId,
        eventType: 'coordination_error',
        stoveStatus,
        action: 'error',
        details: {
          error: 'No home_id configured',
        },
        notificationSent: false,
      }).catch(() => {});

      return success({
        success: false,
        action: 'error',
        details: {
          error: 'No home_id configured for user',
        },
        timestamp: Date.now(),
        duration: Date.now() - startTime,
      });
    }

    homeId = fetchedHomeId;
  } catch (error) {
    console.error('❌ [Coordination] Failed to get home_id:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Log error to Firestore (fire-and-forget)
    logCoordinationEvent({
      userId,
      eventType: 'coordination_error',
      stoveStatus,
      action: 'error',
      details: {
        error: errorMessage,
        source: 'firebase',
      },
      notificationSent: false,
    }).catch(() => {});

    return success({
      success: false,
      action: 'error',
      details: {
        error: 'Failed to get home_id',
        message: errorMessage,
      },
      timestamp: Date.now(),
      duration: Date.now() - startTime,
    });
  }

  // 4. Execute coordination cycle
  let result: any;

  try {
    result = await processCoordinationCycle(userId, stoveStatus, homeId);
  } catch (error) {
    console.error('❌ [Coordination] Cycle execution error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Log error to Firestore (fire-and-forget)
    logCoordinationEvent({
      userId,
      eventType: 'coordination_error',
      stoveStatus,
      action: 'error',
      details: {
        error: errorMessage,
        source: 'orchestrator',
      },
      notificationSent: false,
    }).catch(() => {});

    return success({
      success: false,
      action: 'error',
      details: {
        error: 'Coordination cycle failed',
        message: errorMessage,
        stoveStatus,
      },
      timestamp: Date.now(),
      duration: Date.now() - startTime,
    });
  }

  // 5. Calculate execution duration
  const duration = Date.now() - startTime;

  // 6. Build response based on action
  const response = {
    success: true,
    action: result.action,
    details: {
      stoveStatus,
      ...result,
    },
    timestamp: Date.now(),
    duration,
  };

  // Log to Firestore based on action (fire-and-forget)
  if (result.action === 'applied' || result.action === 'restored') {
    logCoordinationEvent({
      userId,
      eventType: result.action === 'applied' ? 'boost_applied' : 'setpoints_restored',
      stoveStatus,
      action: result.action,
      details: {
        rooms: result.appliedRooms || result.restoredRooms || [],
      },
      notificationSent: true,
    }).catch(() => {});
  } else if (result.action === 'paused') {
    logCoordinationEvent({
      userId,
      eventType: 'automation_paused',
      stoveStatus,
      action: 'paused',
      details: {
        pausedUntil: result.pausedUntil,
        reason: result.reason,
      },
      notificationSent: true,
    }).catch(() => {});
  } else if (result.action === 'debouncing') {
    logCoordinationEvent({
      userId,
      eventType: 'coordination_debouncing',
      stoveStatus,
      action: 'debouncing',
      details: {
        remainingMs: result.remainingMs,
        reason: result.reason,
      },
      notificationSent: false,
    }).catch(() => {});
  }

  console.log(`✅ [Coordination] Cycle complete: ${result.action} (${duration}ms)`);

  return success(response);
}, 'Coordination/Enforce');
