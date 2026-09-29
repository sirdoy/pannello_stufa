/**
 * API Route: Scheduler Check (housekeeping cron)
 *
 * GET /api/scheduler/check?secret=xxx   (or Authorization: Bearer CRON_SECRET)
 *
 * Since workspace ROADMAP D2 the stove schedule, maintenance hours, ignition /
 * shutdown and their notifications run on the Pi. This external cron only does the
 * frontend-side housekeeping that used to piggyback on it:
 * - weather cache refresh every 30 min
 * - stale FCM token cleanup every 7 days
 *
 * Protected: Requires CRON_SECRET
 */

import { withCronSecret, success } from '@/lib/core';
import { adminDbGet, adminDbSet } from '@/lib/firebaseAdmin';
import { getEnvironmentPath } from '@/lib/environmentHelper';
import { cleanupStaleTokens } from '@/lib/services/tokenCleanupService';
import { fetchWeatherForecast } from '@/lib/weather/openMeteo';
import { saveWeatherToCache } from '@/lib/weather/weatherCacheService';

export const dynamic = 'force-dynamic';

const THIRTY_MINUTES = 30 * 60 * 1000;
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

type TaskResult = Record<string, unknown>;

/** Runs `task` when `interval` has passed since the timestamp stored at `path`. */
async function everyInterval(
  path: string,
  interval: number,
  task: () => Promise<{ done: boolean; result: TaskResult }>
): Promise<TaskResult> {
  const statePath = getEnvironmentPath(path);
  const last = await adminDbGet<number>(statePath);
  const now = Date.now();
  if (last && now - last < interval) {
    return { ran: false, reason: 'too_soon', next: new Date(last + interval).toISOString() };
  }
  const { done, result } = await task();
  if (done) await adminDbSet(statePath, now);
  return { ran: true, ...result };
}

async function refreshWeather(): Promise<{ done: boolean; result: TaskResult }> {
  const location = await adminDbGet<{ latitude: number; longitude: number; name?: string }>(
    getEnvironmentPath('config/location')
  );
  if (!location?.latitude || !location?.longitude) {
    return { done: false, result: { refreshed: false, reason: 'no_location' } };
  }
  const { latitude, longitude, name } = location;
  await saveWeatherToCache(latitude, longitude, await fetchWeatherForecast(latitude, longitude));
  return { done: true, result: { refreshed: true, location: { latitude, longitude, name } } };
}

async function cleanupTokens(): Promise<{ done: boolean; result: TaskResult }> {
  const result = await cleanupStaleTokens();
  return { done: Boolean(result.cleaned), result: { ...result } };
}

/** A failing task never fails the others (nor the heartbeat). */
async function safely(name: string, run: () => Promise<TaskResult>): Promise<TaskResult> {
  try {
    return await run();
  } catch (error) {
    console.error(`❌ Cron task ${name} failed:`, error);
    return { ran: false, reason: 'exception', error: error instanceof Error ? error.message : String(error) };
  }
}

// Moved to the Pi: the heartbeat `cronHealth/lastCall` (the UI watches the stove
// engine, ROADMAP V8) and the 12 h valve calibration (ROADMAP V9,
// GET /api/v1/netatmo/valves/calibration-status).
export const GET = withCronSecret(async () => {
  const [weather, tokenCleanup] = await Promise.all([
    safely('weather', () => everyInterval('cron/lastWeatherRefresh', THIRTY_MINUTES, refreshWeather)),
    safely('tokenCleanup', () => everyInterval('cron/lastTokenCleanup', SEVEN_DAYS, cleanupTokens)),
  ]);

  return success({ status: 'OK', weather, tokenCleanup });
}, 'Scheduler/Check');
