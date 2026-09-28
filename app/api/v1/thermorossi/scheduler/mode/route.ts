import { withAuthAndErrorHandler, success, badRequest, parseJson } from '@/lib/core';
import { getMode, setMode } from '@/lib/stove/schedulerProxy';
import { modeBody, zodMessage } from '@/lib/stove/schedulerRequestSchemas';

export const dynamic = 'force-dynamic';

/** GET /api/v1/thermorossi/scheduler/mode */
export const GET = withAuthAndErrorHandler(async () => {
  const data = await getMode();
  return success(data as unknown as Record<string, unknown>);
}, 'Scheduler/GetMode');

/** POST /api/v1/thermorossi/scheduler/mode — enable (automatic) / disable (manual). */
export const POST = withAuthAndErrorHandler(async (request) => {
  const parsed = modeBody.safeParse(await parseJson(request));
  if (!parsed.success) return badRequest(zodMessage(parsed.error));
  const data = await setMode(parsed.data.enabled);
  return success(data as unknown as Record<string, unknown>);
}, 'Scheduler/SetMode');
