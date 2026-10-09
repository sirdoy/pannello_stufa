import { withAuthAndErrorHandler, success, badRequest, parseJson } from '@/lib/core';
import { getClimate, patchClimate } from '@/lib/stove/schedulerProxy';
import { climatePatchBody, zodMessage } from '@/lib/stove/schedulerRequestSchemas';

export const dynamic = 'force-dynamic';

/** GET /api/v1/thermorossi/scheduler/climate — settings and live inputs (ROADMAP D16). */
export const GET = withAuthAndErrorHandler(async () => {
  const data = await getClimate();
  return success(data as unknown as Record<string, unknown>);
}, 'Scheduler/GetClimate');

/** PATCH /api/v1/thermorossi/scheduler/climate — only the fields sent change. */
export const PATCH = withAuthAndErrorHandler(async (request) => {
  const parsed = climatePatchBody.safeParse(await parseJson(request));
  if (!parsed.success) return badRequest(zodMessage(parsed.error));
  const data = await patchClimate(parsed.data);
  return success(data as unknown as Record<string, unknown>);
}, 'Scheduler/PatchClimate');
