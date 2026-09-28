import { withAuthAndErrorHandler, success, badRequest, parseJson } from '@/lib/core';
import { getMaintenance, patchMaintenance } from '@/lib/stove/schedulerProxy';
import { maintenancePatchBody, zodMessage } from '@/lib/stove/schedulerRequestSchemas';

export const dynamic = 'force-dynamic';

/** GET /api/v1/thermorossi/maintenance — working hours and cleaning status. */
export const GET = withAuthAndErrorHandler(async () => {
  const data = await getMaintenance();
  return success(data as unknown as Record<string, unknown>);
}, 'Maintenance/Get');

/** PATCH /api/v1/thermorossi/maintenance — target hours / counter correction. */
export const PATCH = withAuthAndErrorHandler(async (request) => {
  const parsed = maintenancePatchBody.safeParse(await parseJson(request));
  if (!parsed.success) return badRequest(zodMessage(parsed.error));
  const data = await patchMaintenance(parsed.data);
  return success(data as unknown as Record<string, unknown>);
}, 'Maintenance/Patch');
