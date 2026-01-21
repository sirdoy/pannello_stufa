import { withAuthAndErrorHandler, success, parseJsonOrThrow } from '@/lib/core';
import { validateSetPowerInput } from '@/lib/validators';
import { getStoveService } from '@/lib/services/StoveService';

/**
 * POST /api/stove/setPower
 * Sets the power level
 * Supports sandbox mode in localhost
 * Protected: Requires Auth0 authentication
 */
export const POST = withAuthAndErrorHandler(async (request) => {
  const body = await parseJsonOrThrow(request);
  const { level, source } = validateSetPowerInput(body);

  const stoveService = getStoveService();
  const result = await stoveService.setPower(level, source);

  // Maintain backward-compatible response format
  if (result.modeChanged) {
    return success({
      ...result,
      newMode: 'semi-manual',
    });
  }

  return success(result);
}, 'Stove/SetPower');
