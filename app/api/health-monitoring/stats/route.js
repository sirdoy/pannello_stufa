/**
 * API Route: Health Monitoring Stats
 *
 * GET /api/health-monitoring/stats
 *
 * Returns aggregated health monitoring statistics for authenticated users.
 * Useful for dashboard summary cards.
 */

import {
  withAuthAndErrorHandler,
  success,
  error as errorResponse,
} from '@/lib/core';
import { getHealthStats } from '@/lib/healthLogger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/health-monitoring/stats
 *
 * Query parameters:
 * - days: Number of days to analyze (default: 7, max: 30)
 *
 * Response:
 * {
 *   totalRuns: number,
 *   totalChecks: number,
 *   successfulChecks: number,
 *   failedChecks: number,
 *   mismatchCount: number,
 *   successRate: string (e.g., "99.5")
 * }
 *
 * Protected: Requires Auth0 authentication
 */
export const GET = withAuthAndErrorHandler(async (request, context, session) => {
  // Parse query parameters
  const { searchParams } = new URL(request.url);

  const daysParam = searchParams.get('days');

  // Validate days parameter
  let days = 7; // Default
  if (daysParam) {
    const parsedDays = parseInt(daysParam, 10);
    if (isNaN(parsedDays) || parsedDays < 1 || parsedDays > 30) {
      return errorResponse('Invalid days parameter (must be 1-30)', 400);
    }
    days = parsedDays;
  }

  // Fetch health statistics
  try {
    const stats = await getHealthStats(days);

    return success(stats);

  } catch (error) {
    console.error('❌ Error fetching health monitoring stats:', error);
    throw error;
  }

}, 'HealthMonitoring/Stats');
