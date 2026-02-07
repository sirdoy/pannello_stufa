import { withAuthAndErrorHandler, success, parseJson } from '@/lib/core';
import { validateShutdownInput } from '@/lib/validators';
import { getStoveService } from '@/lib/services/StoveService';

/**
 * POST /api/stove/shutdown
 * Shuts down the stove
 * Supports sandbox mode in localhost
 * Protected: Requires Auth0 authentication
 */
export const POST = withAuthAndErrorHandler(async (request) => {
  const body = await parseJson(request);
  const { source } = validateShutdownInput(body);

  const stoveService = getStoveService();
  const result = await stoveService.shutdown(source);

  return success(result);
}, 'Stove/Shutdown');
