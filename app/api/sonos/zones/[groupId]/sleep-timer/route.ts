import { withAuthAndErrorHandler, success, getPathParam, parseJson, HTTP_STATUS } from '@/lib/core';
import { getSleepTimer, setSleepTimer } from '@/lib/sonos/sonosProxy';
import type { SetSleepTimerRequest } from '@/types/sonosProxy';

export const dynamic = 'force-dynamic';

/**
 * GET /api/sonos/zones/[groupId]/sleep-timer
 * Returns the current sleep timer state for a zone.
 * Protected: Requires Auth0 authentication
 *
 * PUT /api/sonos/zones/[groupId]/sleep-timer
 * Sets a sleep timer for a zone.
 * Body: SetSleepTimerRequest — { duration: number } (seconds, 0 to cancel)
 * Returns: 202 Accepted with suggested_poll_delay_s
 */
export const GET = withAuthAndErrorHandler(async (_request, context) => {
  const groupId = await getPathParam(context, 'groupId');
  const data = await getSleepTimer(groupId);
  return success(data as unknown as Record<string, unknown>);
}, 'Sonos/Zones/SleepTimer/Get');

export const PUT = withAuthAndErrorHandler(async (request, context) => {
  const groupId = await getPathParam(context, 'groupId');
  const body = await parseJson(request) as SetSleepTimerRequest;
  const data = await setSleepTimer(groupId, body);
  return success(
    { ...data, suggested_poll_delay_s: 1 } as unknown as Record<string, unknown>,
    null,
    HTTP_STATUS.ACCEPTED
  );
}, 'Sonos/Zones/SleepTimer/Set');
