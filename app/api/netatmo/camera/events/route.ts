import { withAuthAndErrorHandler, success, parseQuery } from '@/lib/core';
import { getProxyCameraEvents } from '@/lib/netatmo/netatmoProxy';
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/netatmo/camera/events?hours=N
 * Returns camera events from proxy.
 * Query params:
 * - hours: Number of hours to look back (optional, 1-168)
 * Protected: Requires Auth0 authentication
 */
export const GET = withAuthAndErrorHandler(async (request: NextRequest) => {
  const hoursParam = parseQuery(request).get('hours');
  let hours: number | undefined;

  if (hoursParam) {
    const parsed = parseInt(hoursParam, 10);
    if (!isNaN(parsed)) {
      hours = Math.min(168, Math.max(1, parsed));
    }
  }

  const result = await getProxyCameraEvents(hours);
  return success(result as unknown as Record<string, unknown>);
}, 'Netatmo/CameraEvents');
