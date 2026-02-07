/**
 * POST /api/stove/setWaterTemperature
 *
 * Sets the water temperature setpoint on the stove.
 * Used for hydronic/boiler stoves only (not applicable to air stoves).
 *
 * Request body:
 * {
 *   "temperature": 30-80 (degrees Celsius)
 * }
 */

import { withAuthAndErrorHandler, success, badRequest, parseJsonOrThrow, validateRange } from '@/lib/core';
import { setWaterTemperature } from '@/lib/stoveApi';

export const dynamic = 'force-dynamic';

export const POST = withAuthAndErrorHandler(async (request) => {
  const body = await parseJsonOrThrow(request);
  const { temperature } = body;

  // Validate temperature
  const validatedTemp = validateRange(temperature, 30, 80, 'temperature');

  // Call API
  const data = await setWaterTemperature(validatedTemp);
  return success(data);
}, 'Stove/SetWaterTemperature');
