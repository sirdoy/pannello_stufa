/**
 * API Route: Netatmo GetRoomMeasure
 *
 * GET /api/v1/netatmo/getroommeasure
 *
 * Returns room measurement data from the HA proxy.
 * Forwards query params (home_id, room_id, scale, type required) to the proxy.
 *
 * Protected: Requires Auth0 authentication
 */

import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getProxyRoomMeasure } from '@/lib/netatmo/netatmoProxy';
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const data = await getProxyRoomMeasure(searchParams);
  return success(data as unknown as Record<string, unknown>);
}, 'Netatmo/GetRoomMeasure');
