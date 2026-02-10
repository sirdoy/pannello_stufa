/**
 * API Route: Cron Executions
 *
 * GET /api/health-monitoring/cron-executions?limit=20
 *
 * Returns recent cron execution logs for health monitoring dashboard.
 * Provides visibility into scheduler check execution history with status, mode, and duration.
 */

import {
  withAuthAndErrorHandler,
  success,
} from '@/lib/core';
import { getRecentCronExecutions } from '@/lib/cronExecutionLogger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/health-monitoring/cron-executions
 *
 * Query Parameters:
 * - limit: Maximum number of executions to return (default: 20, max: 50)
 *
 * Response:
 * {
 *   executions: CronExecutionLog[],
 *   count: number
 * }
 *
 * CronExecutionLog structure:
 * {
 *   timestamp: string (ISO),
 *   status: string,
 *   mode: string,
 *   duration: number (ms),
 *   details?: Record<string, unknown>
 * }
 *
 * Protected: Requires Auth0 authentication
 */
export const GET = withAuthAndErrorHandler(async (request, context, session) => {
  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get('limit');
  const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10) || 20, 1), 50) : 20;

  const executions = await getRecentCronExecutions(limit);

  return success({ executions, count: executions.length });
}, 'HealthMonitoring/CronExecutions');
