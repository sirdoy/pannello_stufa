import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getEngineHealth } from '@/lib/stove/schedulerProxy';

export const dynamic = 'force-dynamic';

/** GET /api/v1/thermorossi/scheduler/engine — stove engine heartbeat on the Pi (ROADMAP V8). */
export const GET = withAuthAndErrorHandler(async () => {
  const data = await getEngineHealth();
  return success(data as unknown as Record<string, unknown>);
}, 'Scheduler/GetEngine');
