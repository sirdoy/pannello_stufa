/**
 * API Route: Dead Man's Switch Status
 *
 * GET /api/health-monitoring/dead-man-switch
 *
 * Returns current dead man's switch status for health monitoring cron.
 * Frontend polls this endpoint to verify cron execution health.
 */

import {
  withAuthAndErrorHandler,
  success,
} from '@/lib/core';
import { checkDeadManSwitch } from '@/lib/healthDeadManSwitch';

export const dynamic = 'force-dynamic';

/**
 * GET /api/health-monitoring/dead-man-switch
 *
 * No query parameters needed.
 *
 * Response:
 * Healthy:
 * {
 *   stale: false,
 *   elapsed: number (ms),
 *   lastCheck: string (ISO timestamp)
 * }
 *
 * Never run:
 * {
 *   stale: true,
 *   reason: 'never_run'
 * }
 *
 * Timeout (> 10 minutes):
 * {
 *   stale: true,
 *   elapsed: number (ms),
 *   reason: 'timeout',
 *   lastCheck: string (ISO timestamp)
 * }
 *
 * Error:
 * {
 *   stale: true,
 *   reason: 'error',
 *   error: string
 * }
 *
 * Protected: Requires Auth0 authentication
 */
export const GET = withAuthAndErrorHandler(async (request, context, session) => {
  try {
    const status = await checkDeadManSwitch();

    return success(status);

  } catch (error) {
    console.error('❌ Error checking dead man\'s switch:', error);
    throw error;
  }

}, 'HealthMonitoring/DeadManSwitch');
