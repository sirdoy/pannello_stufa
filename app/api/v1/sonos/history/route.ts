/**
 * API Route: Sonos History
 *
 * GET /api/v1/sonos/history
 *
 * Returns volume or playback history for Sonos devices.
 * Query params (all optional): type, speaker_uid, group_id, start, end, limit, offset
 *
 * Protected: Requires Auth0 authentication
 */

import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getHistory } from '@/lib/sonos/sonosProxy';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async (request) => {
  const { searchParams } = request.nextUrl;
  const data = await getHistory({
    type: searchParams.get('type') ?? undefined,
    speaker_uid: searchParams.get('speaker_uid') ?? undefined,
    group_id: searchParams.get('group_id') ?? undefined,
    start: searchParams.get('start') ?? undefined,
    end: searchParams.get('end') ?? undefined,
    limit: searchParams.get('limit') ?? undefined,
    offset: searchParams.get('offset') ?? undefined,
  });
  return success(data as unknown as Record<string, unknown>);
}, 'Sonos/History');
