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
import { triggerHealthMonitoringAlertServer } from '@/lib/notificationTriggersServer';
import {
  shouldSendCoordinationNotification,
  recordNotificationSent,
} from '@/lib/coordinationNotificationThrottle';

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
    users.map((userId: string) => checkUserStoveHealth(userId))
  );

  // 5. Log results to Firestore (fire-and-forget)
  const duration = Date.now() - startTime;
  logHealthCheckRun(results, { duration }).catch(err =>
    console.error('Failed to log health check:', err)
  );

  // 6. Trigger notifications for critical issues (with throttling)
  const notificationPromises = [];

  for (const result of results) {
    if (result.status !== 'fulfilled') continue;

    const { userId, connectionStatus, stateMismatch } = result.value as {
      userId: string;
      connectionStatus: string;
      stateMismatch?: {
        detected: boolean;
        reason: string;
        expected: string;
        actual: string;
        errorDescription?: string;
      };
    };

    // Check throttle BEFORE attempting to send
    const throttleCheck = await shouldSendCoordinationNotification(userId);
    if (!throttleCheck.allowed) {
      console.log(`⏱️ Health alert throttled for ${userId} (wait ${throttleCheck.waitSeconds}s)`);
      continue;
    }

    // Connection lost (offline or error status)
    if (connectionStatus === 'offline' || connectionStatus === 'error') {
      notificationPromises.push(
        triggerHealthMonitoringAlertServer(userId, 'connection_lost', {
          message: connectionStatus === 'offline'
            ? 'La stufa non risponde (timeout). Verifica la connessione.'
            : 'Errore di connessione alla stufa. Verifica il sistema.',
        }).then(async () => await recordNotificationSent(userId))
      );
      continue; // Don't send multiple notifications per user
    }

    // State mismatch detected
    if (stateMismatch?.detected) {
      if (stateMismatch.reason === 'stove_error') {
        // Stove error (AL code)
        notificationPromises.push(
          triggerHealthMonitoringAlertServer(userId, 'stove_error', {
            errorCode: stateMismatch.actual.replace('ERROR (AL', '').replace(')', ''),
            errorDescription: stateMismatch.errorDescription,
            message: `Errore stufa: ${stateMismatch.actual}`,
          }).then(async () => await recordNotificationSent(userId))
        );
      } else {
        // State mismatch (should_be_on, should_be_off, netatmo_heating_stove_off)
        notificationPromises.push(
          triggerHealthMonitoringAlertServer(userId, 'state_mismatch', {
            expected: stateMismatch.expected,
            actual: stateMismatch.actual,
            reason: stateMismatch.reason,
            message: `Anomalia: stufa dovrebbe essere ${stateMismatch.expected} ma e ${stateMismatch.actual}`,
          }).then(async () => await recordNotificationSent(userId))
        );
      }
    }
  }

  // Fire-and-forget notifications (don't block response)
  if (notificationPromises.length > 0) {
    Promise.allSettled(notificationPromises).then(results => {
      const sent = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      console.log(`📬 Health alerts sent: ${sent} success, ${failed} failed`);
    });
  }

  // 7. Prepare response
  const successCount = results.filter(r => r.status === 'fulfilled').length;
  const failureCount = results.filter(r => r.status === 'rejected').length;
  const mismatches = results
    .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled' && (r.value?.stateMismatch?.detected ?? false))
    .map(r => ({
      userId: r.value.userId,
      expected: r.value.stateMismatch.expected,
      actual: r.value.stateMismatch.actual,
    }));

  // 8. Log summary
  console.log(`✅ Health check complete: ${successCount}/${users.length} users, ${mismatches.length} mismatches, ${notificationPromises.length} alerts triggered`);

  return success({
    checked: users.length,
    successCount,
    failureCount,
    mismatches,
    timestamp: Date.now(),
    duration,
  });
}, 'HealthMonitoring/Check');
