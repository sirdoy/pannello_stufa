import { withAuthAndErrorHandler, success, badRequest } from '@/lib/core';
import { requireNetatmoToken } from '@/lib/core/netatmoHelpers';
import { adminDbGet } from '@/lib/firebaseAdmin';
import { getEnvironmentPath } from '@/lib/environmentHelper';
import { getCached, invalidateCache } from '@/lib/netatmoCacheService';
import { checkNetatmoRateLimit, trackNetatmoApiCall } from '@/lib/netatmoRateLimiter';
import NETATMO_API from '@/lib/netatmoApi';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/netatmo/schedules
 * Returns list of all schedules with active indicator
 * Cached for 5 minutes to reduce API calls
 */
export const GET = withAuthAndErrorHandler(async (req, session) => {
  const userId = session?.user?.sub || 'anonymous';

  // Rate limit check
  const rateCheck = checkNetatmoRateLimit(userId);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      {
        error: 'RATE_LIMIT_EXCEEDED',
        message: `Limite API Netatmo raggiunto. Riprova tra ${rateCheck.resetInSeconds}s`,
        retryAfter: rateCheck.resetInSeconds,
      },
      {
        status: 429,
        headers: { 'Retry-After': String(rateCheck.resetInSeconds) },
      }
    );
  }

  const accessToken = await requireNetatmoToken();

  // Get schedules with cache
  const result = await getCached('schedules', async () => {
    // Track API call (only for actual API calls, not cache hits)
    trackNetatmoApiCall(userId);

    const homeId = await adminDbGet(getEnvironmentPath('netatmo/home_id'));
    if (!homeId) {
      throw new Error('home_id non trovato. Chiama prima /api/netatmo/homesdata');
    }

    const homesData = await NETATMO_API.getHomesData(accessToken);
    return NETATMO_API.parseSchedules(homesData);
  });

  return success({
    schedules: result.data,
    _source: result.source,
    _age_seconds: result.age_seconds || 0,
  });
}, 'Netatmo/Schedules');

/**
 * POST /api/netatmo/schedules
 * Switch to a different schedule
 * Body: { scheduleId: string }
 * Control operations are NEVER cached
 */
export const POST = withAuthAndErrorHandler(async (req, session) => {
  const userId = session?.user?.sub || 'anonymous';

  // Rate limit check
  const rateCheck = checkNetatmoRateLimit(userId);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      {
        error: 'RATE_LIMIT_EXCEEDED',
        message: `Limite API Netatmo raggiunto. Riprova tra ${rateCheck.resetInSeconds}s`,
        retryAfter: rateCheck.resetInSeconds,
      },
      {
        status: 429,
        headers: { 'Retry-After': String(rateCheck.resetInSeconds) },
      }
    );
  }

  // Parse request body
  const body = await req.json();
  const { scheduleId } = body;

  if (!scheduleId) {
    return badRequest('scheduleId richiesto');
  }

  const accessToken = await requireNetatmoToken();

  // Get home_id
  const homeId = await adminDbGet(getEnvironmentPath('netatmo/home_id'));
  if (!homeId) {
    return badRequest('home_id non trovato. Chiama prima /api/netatmo/homesdata');
  }

  // Track API call
  trackNetatmoApiCall(userId);

  // Switch schedule
  const switched = await NETATMO_API.switchHomeSchedule(accessToken, homeId, scheduleId);

  if (!switched) {
    return badRequest('Impossibile cambiare schedule');
  }

  // Invalidate cache after successful switch
  await invalidateCache('schedules');

  console.log(`✅ Schedule switched to ${scheduleId} by ${userId}`);

  return success({
    success: true,
    scheduleId,
    message: 'Schedule cambiato con successo',
  });
}, 'Netatmo/Schedules');
