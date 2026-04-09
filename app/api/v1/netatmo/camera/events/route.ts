import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getProxyCameraEvents } from '@/lib/netatmo/netatmoProxy';
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/netatmo/camera/events?hours=N
 * Returns camera events from proxy.
 * Query params:
 * - hours: Number of hours to look back (optional)
 * Protected: Requires Auth0 authentication
 */
export const GET = withAuthAndErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const hoursParam = searchParams.get('hours');
  const hours = hoursParam ? Number(hoursParam) : undefined;
  const data = await getProxyCameraEvents(hours);
  return success(data as unknown as Record<string, unknown>);
}, 'Netatmo/Camera/Events');
