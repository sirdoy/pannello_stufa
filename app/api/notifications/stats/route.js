/**
 * Notifications Stats API
 *
 * GET /api/notifications/stats
 *
 * Provides comprehensive statistics about notification delivery, errors, and devices.
 *
 * Query parameters:
 * - hours: number (default 24, max 168 for 7 days)
 *
 * Response:
 * {
 *   success: true,
 *   stats: {
 *     period: { hours, start, end },
 *     notifications: { total, sent, failed, deliveryRate },
 *     errors: { total, byCode },
 *     devices: { total, active, stale, byPlatform }
 *   },
 *   generatedAt: ISO timestamp
 * }
 */

import { NextResponse } from 'next/server';
import { getDeliveryStats, getLastRateAlertInfo } from '@/lib/notificationLogger';
import { adminDbGet } from '@/lib/firebaseAdmin';
import { subHours, subDays } from 'date-fns';

export const dynamic = 'force-dynamic';

/**
 * Get notification statistics
 */
export async function GET(request) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const hours = Math.min(parseInt(searchParams.get('hours') || '24', 10), 168);

    // Calculate period
    const now = new Date();
    const start = subHours(now, hours);
    const period = {
      hours,
      start: start.toISOString(),
      end: now.toISOString(),
    };

    // Get notification stats from Firestore
    const deliveryStats = await getDeliveryStats(hours);

    // Get error stats from Firebase RTDB
    const allErrors = await adminDbGet('notificationErrors') || {};
    const recentErrors = Object.entries(allErrors)
      .filter(([, error]) => {
        const errorTime = new Date(error.timestamp);
        return errorTime >= start;
      });

    const errorsByCode = {};
    recentErrors.forEach(([, error]) => {
      const code = error.errorCode || 'unknown';
      errorsByCode[code] = (errorsByCode[code] || 0) + 1;
    });

    const errorStats = {
      total: recentErrors.length,
      byCode: errorsByCode,
    };

    // Get device stats from Firebase RTDB
    const usersData = await adminDbGet('users') || {};
    let totalDevices = 0;
    let activeDevices = 0;
    let staleDevices = 0;
    const devicesByPlatform = {
      ios: 0,
      android: 0,
      web: 0,
    };

    const sevenDaysAgo = subDays(now, 7);
    const thirtyDaysAgo = subDays(now, 30);

    Object.values(usersData).forEach(userData => {
      const tokens = userData.fcmTokens || {};

      Object.values(tokens).forEach(tokenData => {
        totalDevices++;

        // Count by platform
        const platform = tokenData.deviceInfo?.platform || 'web';
        if (platform === 'ios' || platform === 'iOS') {
          devicesByPlatform.ios++;
        } else if (platform === 'android' || platform === 'Android') {
          devicesByPlatform.android++;
        } else {
          devicesByPlatform.web++;
        }

        // Count active vs stale
        if (tokenData.lastUsed) {
          const lastUsed = new Date(tokenData.lastUsed);
          if (lastUsed >= sevenDaysAgo) {
            activeDevices++;
          } else if (lastUsed < thirtyDaysAgo) {
            staleDevices++;
          }
        }
      });
    });

    const deviceStats = {
      total: totalDevices,
      active: activeDevices,
      stale: staleDevices,
      byPlatform: devicesByPlatform,
    };

    // Get rate alert info
    const alertInfo = await getLastRateAlertInfo();

    // Build response
    const stats = {
      period,
      notifications: {
        total: deliveryStats.total,
        sent: deliveryStats.sent + deliveryStats.delivered,
        failed: deliveryStats.failed,
        deliveryRate: deliveryStats.deliveryRate,
      },
      errors: errorStats,
      devices: deviceStats,
      alerting: alertInfo ? {
        lastAlertSent: alertInfo.lastAlertSent?.toISOString() || null,
        lastAlertRate: alertInfo.deliveryRate || null,
      } : null,
    };

    return NextResponse.json({
      success: true,
      stats,
      generatedAt: now.toISOString(),
    });
  } catch (error) {
    console.error('❌ Error fetching notification stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch notification stats',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
