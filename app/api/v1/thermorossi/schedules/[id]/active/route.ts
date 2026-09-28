import { withAuthAndErrorHandler, success, badRequest } from '@/lib/core';
import { activateSchedule } from '@/lib/stove/schedulerProxy';
import { parseId } from '@/lib/stove/schedulerRequestSchemas';

export const dynamic = 'force-dynamic';

/** PUT /api/v1/thermorossi/schedules/[id]/active — make it the active schedule. */
export const PUT = withAuthAndErrorHandler(async (_request, context) => {
  const id = parseId((await context.params)['id']);
  if (id === null) return badRequest('id non valido');
  const data = await activateSchedule(id);
  return success(data as unknown as Record<string, unknown>);
}, 'Scheduler/ActivateSchedule');
