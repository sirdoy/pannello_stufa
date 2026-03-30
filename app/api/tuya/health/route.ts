import { withErrorHandler, success } from '@/lib/core';
import { getHealth } from '@/lib/tuya/tuyaProxy';

export const dynamic = 'force-dynamic';

/**
 * GET /api/tuya/health
 * Returns per-device connectivity status and data freshness.
 * No authentication required (per D-04).
 */
export const GET = withErrorHandler(async () => {
  const data = await getHealth();
  return success(data as unknown as Record<string, unknown>);
}, 'Tuya/Health');
