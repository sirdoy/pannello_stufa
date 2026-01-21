import { withAuthAndErrorHandler, success, parseJsonOrThrow } from '@/lib/core';
import { validateSetFanInput } from '@/lib/validators';
import { getStoveService } from '@/lib/services/StoveService';

/**
 * POST /api/stove/setFan
 * Sets the fan level
 * Supports sandbox mode in localhost
 * Protected: Requires Auth0 authentication
 */
export const POST = withAuthAndErrorHandler(async (request) => {
  const body = await parseJsonOrThrow(request);
  const { level, source } = validateSetFanInput(body);

  const stoveService = getStoveService();
  const result = await stoveService.setFan(level, source);

  // Maintain backward-compatible response format
  if (result.modeChanged) {
    return success({
      ...result,
      newMode: 'semi-manual',
    });
  }

  return success(result);
}, 'Stove/SetFan');
