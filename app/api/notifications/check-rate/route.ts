/**
 * API Route: Check Delivery Rate and Send Alerts
 *
 * POST /api/notifications/check-rate
 *
 * Checks notification delivery rate and sends alerts if below threshold.
 * Designed to be called by cron-job.org for automated monitoring.
 *
 * Authentication: Bearer token via CRON_SECRET env var
 *
 * Response:
 * {
 *   success: true,
 *   check: {
 *     timestamp: "2026-01-24T12:00:00Z",
 *     period: "1 hour",
 *     deliveryRate: 82.5,
 *     threshold: 85,
 *     belowThreshold: true,
 *     alertSent: true,
 *     alertReason: "Rate below threshold"
 *   }
 * }
 */

import { getDeliveryStats, shouldSendRateAlert, recordRateAlert } from '@/lib/notificationLogger';
import { sendNotificationToUser, getAdminDatabase } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

const RATE_THRESHOLD = 85; // Alert if below 85%
const CHECK_PERIOD_HOURS = 1; // Check last hour (per 02-CONTEXT.md)

/**
 * POST /api/notifications/check-rate
 * Check delivery rate and send alert if needed
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
      console.warn('Unauthorized rate check attempt');
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('📊 Starting delivery rate check...');

    // Get delivery stats for last hour
    const stats = await getDeliveryStats(CHECK_PERIOD_HOURS);
    const deliveryRate = stats.deliveryRate;
    const belowThreshold = deliveryRate < RATE_THRESHOLD;

    console.log(`📊 Delivery rate: ${deliveryRate.toFixed(1)}% (${stats.sent + stats.delivered}/${stats.total})`);

    // Check if alert should be sent
    const alertCheck = await shouldSendRateAlert(deliveryRate);
    let alertSent = false;

    if (alertCheck.shouldAlert) {
      // Get admin user ID from environment or first user
      const adminUserId = process.env.ADMIN_USER_ID;

      let targetUserId;
      if (adminUserId) {
        targetUserId = adminUserId;
      } else {
        // Fallback: get first user (single-user app)
        const db = getAdminDatabase();
        const usersSnapshot = await db.ref('users').limitToFirst(1).once('value');

        if (usersSnapshot.exists()) {
          const firstUserId = Object.keys(usersSnapshot.val())[0];
          targetUserId = firstUserId;
        }
      }

      if (targetUserId) {
        // Send alert notification
        const notification = {
          title: 'Delivery Rate Alert',
          body: `Notification delivery rate dropped to ${deliveryRate.toFixed(1)}% (threshold: ${RATE_THRESHOLD}%). Check dashboard for details.`,
          icon: '/icons/icon-192.png',
          priority: 'high',
          data: {
            type: 'system_alert',
            url: '/debug/notifications',
            timestamp: new Date().toISOString(),
            deliveryRate: deliveryRate.toFixed(1),
          },
        };

        const result = await sendNotificationToUser(targetUserId, notification);

        if (result.success) {
          console.log(`🚨 Alert sent to admin (user: ${targetUserId})`);
          await recordRateAlert(deliveryRate);
          alertSent = true;
        } else {
          console.error('❌ Failed to send alert notification:', result.message);
        }
      } else {
        console.warn('⚠️ No admin user found to send alert');
      }
    } else {
      console.log(`✅ No alert needed: ${alertCheck.reason}`);
    }

    const checkResult = {
      success: true,
      check: {
        timestamp: new Date().toISOString(),
        period: `${CHECK_PERIOD_HOURS} hour`,
        deliveryRate: parseFloat(deliveryRate.toFixed(1)),
        threshold: RATE_THRESHOLD,
        belowThreshold,
        alertSent,
        alertReason: alertCheck.reason,
        stats: {
          total: stats.total,
          sent: stats.sent,
          delivered: stats.delivered,
          failed: stats.failed,
        },
      },
    };

    console.log(`✅ Rate check complete: ${deliveryRate.toFixed(1)}% - Alert sent: ${alertSent}`);

    return Response.json(checkResult);

  } catch (error) {
    console.error('❌ Rate check error:', error);
    return Response.json(
      { error: 'Rate check failed', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/notifications/check-rate
 * Health check endpoint (no auth required)
 */
export async function GET() {
  return Response.json({
    endpoint: '/api/notifications/check-rate',
    method: 'POST',
    auth: 'Bearer token required (CRON_SECRET)',
    purpose: 'Check delivery rate and send alerts if below 85%',
    schedule: 'Every 15-60 minutes via cron-job.org (recommended: 30min)',
    threshold: `${RATE_THRESHOLD}%`,
    cooldown: '1 hour between alerts',
  });
}
