/**
 * API Route: Health Monitoring Check
 *
 * GET /api/health-monitoring/check?secret=xxx
 *
 * Cron job endpoint for automated health monitoring:
 * - Updates dead man's switch timestamp (before any processing)
 * - Validates environment configuration
 * - Checks user stove health (status, expected state, Netatmo coordination)
 * - Logs results to Firestore
 * - Returns summary with duration
 *
 * Protected: Requires CRON_SECRET (query param or Authorization header)
 * Frequency: Every minute (recommended)
 */

import {
  withCronSecret,
  success,
} from '@/lib/core';
import { updateDeadManSwitch } from '@/lib/healthDeadManSwitch';
import { checkUserStoveHealth } from '@/lib/healthMonitoring';
import { logHealthCheckRun } from '@/lib/healthLogger';
import { validateHealthMonitoringEnv } from '@/lib/envValidator';

export const dynamic = 'force-dynamic';

/**
 * GET /api/health-monitoring/check
 * Main cron handler for health monitoring
 * Protected: Requires CRON_SECRET
 */
export const GET = withCronSecret(async (request) => {
  const startTime = Date.now();

  // 1. Update dead man's switch FIRST (before any logic that could fail)
  await updateDeadManSwitch();

  // 2. Validate environment (log warnings but continue)
  const envValidation = validateHealthMonitoringEnv();
  if (!envValidation.valid) {
    console.warn('⚠️ Health monitoring env validation failed:', envValidation.missing);
    // Continue anyway - might still partially work
  }

  // 3. Get users to check (for now, just admin user)
  const users = process.env.ADMIN_USER_ID ? [process.env.ADMIN_USER_ID] : [];

  if (users.length === 0) {
    console.warn('⚠️ No users to check (ADMIN_USER_ID not set)');
    return success({
      checked: 0,
      timestamp: Date.now(),
      duration: Date.now() - startTime,
      warning: 'ADMIN_USER_ID not configured',
    });
  }

  // 4. Check each user's stove health in parallel
  const results = await Promise.allSettled(
    users.map(userId => checkUserStoveHealth(userId))
  );

  // 5. Log results to Firestore (fire-and-forget)
  const duration = Date.now() - startTime;
  logHealthCheckRun(results, { duration }).catch(err =>
    console.error('Failed to log health check:', err)
  );

  // 6. Prepare response
  const successCount = results.filter(r => r.status === 'fulfilled').length;
  const failureCount = results.filter(r => r.status === 'rejected').length;
  const mismatches = results
    .filter(r => r.status === 'fulfilled' && r.value?.stateMismatch?.detected)
    .map(r => ({
      userId: r.value.userId,
      expected: r.value.stateMismatch.expected,
      actual: r.value.stateMismatch.actual,
    }));

  // 7. Log summary
  console.log(`✅ Health check complete: ${successCount}/${users.length} users, ${mismatches.length} mismatches`);

  return success({
    checked: users.length,
    successCount,
    failureCount,
    mismatches,
    timestamp: Date.now(),
    duration,
  });
}, 'HealthMonitoring/Check');
