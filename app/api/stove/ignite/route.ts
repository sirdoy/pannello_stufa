import { withAuthAndErrorHandler, success, parseJson } from '@/lib/core';
import { validateIgniteInput } from '@/lib/validators';
import { getStoveService } from '@/lib/services/StoveService';

/**
 * POST /api/stove/ignite
 * Ignites the stove
 * Supports sandbox mode in localhost
 * Protected: Requires Auth0 authentication
 */
export const POST = withAuthAndErrorHandler(async (request) => {
  const body = await parseJson(request);
  const { power, source } = validateIgniteInput(body);

  const stoveService = getStoveService();
  const result = await stoveService.ignite(power, source);

  return success(result as Record<string, unknown>);
}, 'Stove/Ignite');
