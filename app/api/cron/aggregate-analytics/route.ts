/**
 * API Route: Analytics Aggregation Cron
 *
 * GET /api/cron/aggregate-analytics?secret=xxx
 *
 * Cron job endpoint for daily analytics aggregation:
 * - Aggregates yesterday's raw events into daily stats
 * - Saves stats to Firebase RTDB
 * - Cleans up old raw events (7-day retention)
 * - Logs execution for monitoring dashboard
 *
 * Protected: Requires CRON_SECRET
 * Scheduled: Daily at 01:00 UTC (via external cron)
 */

import { withCronSecret, success } from '@/lib/core';
import { aggregateDailyStats, saveDailyStats } from '@/lib/analyticsAggregationService';
import { cleanupOldAnalyticsEvents } from '@/lib/analyticsEventLogger';
import { logCronExecution } from '@/lib/cronExecutionLogger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cron/aggregate-analytics
 * Main handler for daily analytics aggregation
 */
export const GET = withCronSecret(async (_request) => {
  const startTime = Date.now();

  try {
    // Calculate yesterday's date (cron runs at 01:00 UTC)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateKey = yesterday.toISOString().split('T')[0]!; // YYYY-MM-DD (always defined)

    // Aggregate yesterday's raw events into daily stats
    const stats = await aggregateDailyStats(dateKey);

    // Save aggregated stats to Firebase
    await saveDailyStats(stats);

    // Cleanup raw events older than 7 days
    await cleanupOldAnalyticsEvents(7);

    const duration = Date.now() - startTime;

    // Log successful execution
    await logCronExecution({
      status: 'success',
      mode: 'analytics_aggregation',
      duration,
      details: {
        dateKey,
        totalHours: stats.totalHours,
        ignitionCount: stats.ignitionCount,
        pelletKg: stats.pelletEstimate.totalKg,
      },
    });

    return success({
      aggregated: true,
      dateKey,
      stats: {
        totalHours: stats.totalHours,
        ignitionCount: stats.ignitionCount,
        pelletKg: stats.pelletEstimate.totalKg,
      },
    } as const);

  } catch (error) {
    const duration = Date.now() - startTime;

    // Log failed execution
    await logCronExecution({
      status: 'error',
      mode: 'analytics_aggregation',
      duration,
      details: { error: error instanceof Error ? error.message : String(error) },
    });

    // Return success response (don't 500 from cron)
    return success({
      error: error instanceof Error ? error.message : 'Unknown error',
      aggregated: false,
    } as const);
  }
}, 'AnalyticsAggregation');
