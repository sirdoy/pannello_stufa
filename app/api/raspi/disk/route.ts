import { withAuthAndErrorHandler, success } from '@/lib/core';
import { raspiClient } from '@/lib/raspi';

export const dynamic = 'force-dynamic';

/**
 * GET /api/raspi/disk
 * Returns disk usage for root partition
 * Protected: Requires Auth0 authentication
 */
export const GET = withAuthAndErrorHandler(async () => {
  const data = await raspiClient.getDisk();
  return success(data as unknown as Record<string, unknown>);
}, 'Raspi/Disk');
