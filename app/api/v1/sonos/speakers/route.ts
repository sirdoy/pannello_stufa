/**
 * API Route: Sonos Speakers List
 *
 * GET /api/v1/sonos/speakers
 *
 * Same shape as the backend: { success, speakers, count, is_stale, fetched_at, data_freshness }.
 *
 * Protected: Requires an authenticated session
 */

import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getSpeakers } from '@/lib/sonos/sonosProxy';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async () => {
  const data = await getSpeakers();
  return success(data as unknown as Record<string, unknown>);
}, 'Sonos/Speakers');
