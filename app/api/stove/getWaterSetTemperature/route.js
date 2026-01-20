/**
 * GET /api/stove/getWaterSetTemperature
 *
 * Returns the water temperature setpoint (target temperature) from the stove.
 * Used for hydronic/boiler stoves only (not applicable to air stoves).
 */

import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getWaterSetTemperature } from '@/lib/stoveApi';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async () => {
  const data = await getWaterSetTemperature();
  return success(data);
}, 'Stove/GetWaterSetTemperature');
