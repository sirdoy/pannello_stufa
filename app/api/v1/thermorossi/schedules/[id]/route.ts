import { withAuthAndErrorHandler, success, badRequest, noContent, parseJson } from '@/lib/core';
import { deleteSchedule, getSchedule, patchSchedule } from '@/lib/stove/schedulerProxy';
import { parseId, patchScheduleBody, zodMessage } from '@/lib/stove/schedulerRequestSchemas';

export const dynamic = 'force-dynamic';

/** GET /api/v1/thermorossi/schedules/[id] — schedule with its weekly grid. */
export const GET = withAuthAndErrorHandler(async (_request, context) => {
  const id = parseId((await context.params)['id']);
  if (id === null) return badRequest('id non valido');
  const data = await getSchedule(id);
  return success(data as unknown as Record<string, unknown>);
}, 'Scheduler/GetSchedule');

/** PATCH /api/v1/thermorossi/schedules/[id] — rename / enable. */
export const PATCH = withAuthAndErrorHandler(async (request, context) => {
  const id = parseId((await context.params)['id']);
  if (id === null) return badRequest('id non valido');
  const parsed = patchScheduleBody.safeParse(await parseJson(request));
  if (!parsed.success) return badRequest(zodMessage(parsed.error));
  const data = await patchSchedule(id, parsed.data);
  return success(data as unknown as Record<string, unknown>);
}, 'Scheduler/PatchSchedule');

/** DELETE /api/v1/thermorossi/schedules/[id] — 409 from the backend if active or last. */
export const DELETE = withAuthAndErrorHandler(async (_request, context) => {
  const id = parseId((await context.params)['id']);
  if (id === null) return badRequest('id non valido');
  await deleteSchedule(id);
  return noContent();
}, 'Scheduler/DeleteSchedule');
