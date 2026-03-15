import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getProxyHomesdata } from '@/lib/netatmoProxy';
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/netatmo/schedules
 * Returns list of all schedules for the first home, extracted from homesdata proxy.
 * No OAuth, no cache service, no rate limiter — proxy handles all of that.
 */
export const GET = withAuthAndErrorHandler(async (_request: NextRequest) => {
  const homesdataResponse = await getProxyHomesdata();
  const schedules = homesdataResponse.body.homes[0]?.schedules ?? [];
  return success({ schedules });
}, 'Netatmo/Schedules');
