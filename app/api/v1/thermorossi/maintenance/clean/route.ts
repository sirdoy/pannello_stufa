import { withAuthAndErrorHandler, success } from '@/lib/core';
import { confirmMaintenanceCleaning } from '@/lib/stove/schedulerProxy';

export const dynamic = 'force-dynamic';

/** POST /api/v1/thermorossi/maintenance/clean — counter to 0, ignition unblocked. */
export const POST = withAuthAndErrorHandler(async () => {
  const data = await confirmMaintenanceCleaning();
  return success(data as unknown as Record<string, unknown>);
}, 'Maintenance/Clean');
