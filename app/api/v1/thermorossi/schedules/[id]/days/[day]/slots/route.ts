import { withAuthAndErrorHandler, success, badRequest, parseJson } from '@/lib/core';
import { replaceDaySlots } from '@/lib/stove/schedulerProxy';
import { daySlotsBody, parseDay, parseId, zodMessage } from '@/lib/stove/schedulerRequestSchemas';

export const dynamic = 'force-dynamic';

/** PUT /api/v1/thermorossi/schedules/[id]/days/[day]/slots — replace one day (0 = Monday). */
export const PUT = withAuthAndErrorHandler(async (request, context) => {
  const params = await context.params;
  const id = parseId(params['id']);
  const day = parseDay(params['day']);
  if (id === null || day === null) return badRequest('id o giorno non validi');
  const parsed = daySlotsBody.safeParse(await parseJson(request));
  if (!parsed.success) return badRequest(zodMessage(parsed.error));
  const data = await replaceDaySlots(id, day, parsed.data.slots);
  return success(data as unknown as Record<string, unknown>);
}, 'Scheduler/ReplaceDaySlots');
