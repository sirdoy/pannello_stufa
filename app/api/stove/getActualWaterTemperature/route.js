/**
 * GET /api/stove/getActualWaterTemperature
 *
 * Returns the actual water temperature reading from the stove.
 * Used for hydronic/boiler stoves only (not applicable to air stoves).
 */

import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getActualWaterTemperature } from '@/lib/stoveApi';

export const dynamic = 'force-dynamic';

export const GET = withAuthAndErrorHandler(async () => {
  const data = await getActualWaterTemperature();
  return success(data);
}, 'Stove/GetActualWaterTemperature');
