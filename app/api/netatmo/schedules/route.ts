import { withAuthAndErrorHandler, success, badRequest } from '@/lib/core';
import { requireNetatmoToken } from '@/lib/core/netatmoHelpers';
import { adminDbGet } from '@/lib/firebaseAdmin';
import { getEnvironmentPath } from '@/lib/environmentHelper';
import { getCached, invalidateCache } from '@/lib/netatmoCacheService';
import { checkNetatmoRateLimit, trackNetatmoApiCall } from '@/lib/netatmoRateLimiter';
import NETATMO_API from '@/lib/netatmoApi';
import { clearCachedAccessToken, getValidAccessToken } from '@/lib/netatmoTokenHelper';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Session } from '@auth0/nextjs-auth0';

export const dynamic = 'force-dynamic';

interface ScheduleSwitchBody {
  scheduleId?: string;
}

/**
 * GET /api/netatmo/schedules
 * Returns list of all schedules with active indicator
 * Cached for 5 minutes to reduce API calls
 */
export const GET = withAuthAndErrorHandler(async (req: NextRequest, session?: Session) => {
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

  let accessToken = await requireNetatmoToken();

  // Get schedules with cache - with retry logic for invalid tokens
  let retryCount = 0;
  const MAX_RETRIES = 1;

  while (retryCount <= MAX_RETRIES) {
    try {
      const result = await getCached('schedules', async () => {
        // Track API call (only for actual API calls, not cache hits)
        trackNetatmoApiCall(userId);

        const homeId = await adminDbGet(getEnvironmentPath('netatmo/home_id')) as string | null;
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

    } catch (error) {
      // Check if this is an "Invalid access token" error from Netatmo API
      const isInvalidTokenError =
        error instanceof Error &&
        error.message &&
        (error.message.includes('Invalid access token') || error.message.includes('Access token expired'));

      if (isInvalidTokenError && retryCount < MAX_RETRIES) {
        console.warn(`⚠️ Invalid access token detected, clearing cache and retrying (attempt ${retryCount + 1}/${MAX_RETRIES})`);

        // Clear the cached token and schedule cache
        await clearCachedAccessToken();
        await invalidateCache('schedules');

        // Get a fresh token with force refresh
        const tokenResult = await getValidAccessToken(true);
        if (tokenResult.error) {
          // Token refresh failed - throw the original error
          throw error;
        }

        accessToken = tokenResult.accessToken;
        retryCount++;
        continue; // Retry with new token
      }

      // Not an invalid token error, or we've exhausted retries
      throw error;
    }
  }

  // Should never reach here, but TypeScript needs this
  throw new Error('Unexpected: exceeded retry loop');
}, 'Netatmo/Schedules');

/**
 * POST /api/netatmo/schedules
 * Switch to a different schedule
 * Body: { scheduleId: string }
 * Control operations are NEVER cached
 */
export const POST = withAuthAndErrorHandler(async (req: NextRequest, session?: Session) => {
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
  const body = await req.json() as ScheduleSwitchBody;
  const { scheduleId } = body;

  if (!scheduleId) {
    return badRequest('scheduleId richiesto');
  }

  const accessToken = await requireNetatmoToken();

  // Get home_id
  const homeId = await adminDbGet(getEnvironmentPath('netatmo/home_id')) as string | null;
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
