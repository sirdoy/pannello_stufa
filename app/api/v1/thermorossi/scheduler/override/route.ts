import { withAuthAndErrorHandler, success, badRequest, parseJson } from '@/lib/core';
import { clearOverride, setOverride } from '@/lib/stove/schedulerProxy';
import { overrideBody, zodMessage } from '@/lib/stove/schedulerRequestSchemas';

export const dynamic = 'force-dynamic';

/** POST /api/v1/thermorossi/scheduler/override — semi-manual until return_to_auto_at. */
export const POST = withAuthAndErrorHandler(async (request) => {
  const parsed = overrideBody.safeParse(await parseJson(request));
  if (!parsed.success) return badRequest(zodMessage(parsed.error));
  const data = await setOverride(parsed.data.return_to_auto_at);
  return success(data as unknown as Record<string, unknown>);
}, 'Scheduler/SetOverride');

/** DELETE /api/v1/thermorossi/scheduler/override — back to automatic; returns the mode. */
export const DELETE = withAuthAndErrorHandler(async () => {
  const data = await clearOverride();
  return success(data as unknown as Record<string, unknown>);
}, 'Scheduler/ClearOverride');
