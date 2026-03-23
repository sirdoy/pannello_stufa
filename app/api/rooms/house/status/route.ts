import { withErrorHandler, success } from '@/lib/core';
import { roomsProxy } from '@/lib/rooms';

export const dynamic = 'force-dynamic';

/**
 * GET /api/rooms/house/status
 * Returns whole-house status. Public — no auth required.
 */
export const GET = withErrorHandler(async () => {
  const data = await roomsProxy.getHouseStatus();
  return success(data as unknown as Record<string, unknown>);
}, 'Rooms/House/Status');
