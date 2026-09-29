/**
 * API Route: Scheduler Check (legacy housekeeping cron, now a no-op)
 *
 * GET /api/scheduler/check?secret=xxx   (or Authorization: Bearer CRON_SECRET)
 *
 * Every task this external cron used to run has moved (workspace ROADMAP V5):
 * - stove schedule, maintenance, notifications → Pi (D2)
 * - heartbeat → Pi stove engine health (V8)
 * - 12 h valve calibration → Pi (V9)
 * - weather refresh → on read in /api/weather/forecast (V10)
 * - stale FCM token cleanup → maybeCleanupStaleTokens() after
 *   /api/internal/stove-events and /api/notifications/register (V11)
 *
 * Kept only so the external cron gets a 200 until it is switched off and the
 * route removed (V12).
 *
 * Protected: Requires CRON_SECRET
 */

import { withCronSecret, success } from '@/lib/core';

export const dynamic = 'force-dynamic';

export const GET = withCronSecret(async () => success({ status: 'OK', tasks: [] }), 'Scheduler/Check');
