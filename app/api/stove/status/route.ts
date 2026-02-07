import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getStoveStatus } from '@/lib/stoveApi';

/**
 * GET /api/stove/status
 * Returns the current operational status of the stove
 * Supports sandbox mode in localhost
 * Protected: Requires Auth0 authentication
 */
export const GET = withAuthAndErrorHandler(async () => {
  const data = await getStoveStatus();
  return success(data as unknown as Record<string, unknown>);
}, 'Stove/Status');
