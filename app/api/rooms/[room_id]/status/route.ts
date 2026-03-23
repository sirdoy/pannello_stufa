import { withErrorHandler, success } from '@/lib/core';
import { roomsProxy } from '@/lib/rooms';

export const dynamic = 'force-dynamic';

/**
 * GET /api/rooms/[room_id]/status
 * Returns device status for a room. Public — no auth required.
 */
export const GET = withErrorHandler(async (_request, context) => {
  const params = await context.params;
  const room_id = params['room_id'] ?? '';
  const data = await roomsProxy.getRoomStatus(Number(room_id));
  return success(data as unknown as Record<string, unknown>);
}, 'Rooms/Status');
