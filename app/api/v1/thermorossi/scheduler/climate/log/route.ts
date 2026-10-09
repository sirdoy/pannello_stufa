import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getClimateLog } from '@/lib/stove/schedulerProxy';

export const dynamic = 'force-dynamic';

/** GET /api/v1/thermorossi/scheduler/climate/log — forwards limit (ROADMAP D16). */
export const GET = withAuthAndErrorHandler(async (request) => {
  const query = new URLSearchParams();
  const limit = request.nextUrl.searchParams.get('limit');
  if (limit !== null && /^\d+$/.test(limit)) query.set('limit', limit);
  const data = await getClimateLog(query.toString());
  return success(data as unknown as Record<string, unknown>);
}, 'Scheduler/ClimateLog');
