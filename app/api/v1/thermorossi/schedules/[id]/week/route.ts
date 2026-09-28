import { withAuthAndErrorHandler, success, badRequest, parseJson } from '@/lib/core';
import { replaceWeek } from '@/lib/stove/schedulerProxy';
import { parseId, weekBody, zodMessage } from '@/lib/stove/schedulerRequestSchemas';

export const dynamic = 'force-dynamic';

/** PUT /api/v1/thermorossi/schedules/[id]/week — replace the whole week (missing days emptied). */
export const PUT = withAuthAndErrorHandler(async (request, context) => {
  const id = parseId((await context.params)['id']);
  if (id === null) return badRequest('id non valido');
  const parsed = weekBody.safeParse(await parseJson(request));
  if (!parsed.success) return badRequest(zodMessage(parsed.error));
  const data = await replaceWeek(id, parsed.data.days);
  return success(data as unknown as Record<string, unknown>);
}, 'Scheduler/ReplaceWeek');
