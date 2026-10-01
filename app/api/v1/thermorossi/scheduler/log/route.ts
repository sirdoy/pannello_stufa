import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getExecutionLog } from '@/lib/stove/schedulerProxy';

export const dynamic = 'force-dynamic';

const FORWARDED = ['limit', 'offset', 'from', 'to'];

/** GET /api/v1/thermorossi/scheduler/log — forwards limit, offset, from, to. */
export const GET = withAuthAndErrorHandler(async (request) => {
  const query = new URLSearchParams();
  for (const key of FORWARDED) {
    const value = request.nextUrl.searchParams.get(key);
    if (value !== null && /^\d+$/.test(value)) query.set(key, value);
  }
  const data = await getExecutionLog(query.toString());
  return success(data as unknown as Record<string, unknown>);
}, 'Scheduler/Log');
