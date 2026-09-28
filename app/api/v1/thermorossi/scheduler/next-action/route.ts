import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getNextAction } from '@/lib/stove/schedulerProxy';

export const dynamic = 'force-dynamic';

/** GET /api/v1/thermorossi/scheduler/next-action */
export const GET = withAuthAndErrorHandler(async () => {
  const data = await getNextAction();
  return success(data as unknown as Record<string, unknown>);
}, 'Scheduler/NextAction');
