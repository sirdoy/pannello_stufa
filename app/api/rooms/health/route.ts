import { withErrorHandler, success } from '@/lib/core';
import { roomsProxy } from '@/lib/rooms';

export const dynamic = 'force-dynamic';

/**
 * GET /api/rooms/health
 * Returns rooms health stats. Public — no auth required.
 */
export const GET = withErrorHandler(async () => {
  const data = await roomsProxy.getHealth();
  return success(data as unknown as Record<string, unknown>);
}, 'Rooms/Health');
