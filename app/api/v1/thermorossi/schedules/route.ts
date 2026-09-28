import { withAuthAndErrorHandler, success, created, badRequest, parseJson } from '@/lib/core';
import { createSchedule, listSchedules } from '@/lib/stove/schedulerProxy';
import { createScheduleBody, zodMessage } from '@/lib/stove/schedulerRequestSchemas';

export const dynamic = 'force-dynamic';

/** GET /api/v1/thermorossi/schedules — list schedules + active id (backend 1:1). */
export const GET = withAuthAndErrorHandler(async () => {
  const data = await listSchedules();
  return success(data as unknown as Record<string, unknown>);
}, 'Scheduler/ListSchedules');

/** POST /api/v1/thermorossi/schedules — create (optionally copying another schedule). */
export const POST = withAuthAndErrorHandler(async (request) => {
  const parsed = createScheduleBody.safeParse(await parseJson(request));
  if (!parsed.success) return badRequest(zodMessage(parsed.error));
  const data = await createSchedule(parsed.data);
  return created(data as unknown as Record<string, unknown>);
}, 'Scheduler/CreateSchedule');
