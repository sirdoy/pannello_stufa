import { withAuthAndErrorHandler, success } from '@/lib/core';
import { roomsProxy } from '@/lib/rooms';
import { stripSignedUrls } from '@/lib/netatmo/stripSignedUrls';

export const dynamic = 'force-dynamic';

/**
 * GET /api/rooms/[room_id]/status
 * Returns device status for a room. Public — no auth required.
 */
export const GET = withAuthAndErrorHandler(async (_request, context) => {
  const params = await context.params;
  const room_id = params['room_id'] ?? '';
  const data = await roomsProxy.getRoomStatus(Number(room_id));
  // S11: camera entries carry the signed vpn_url
  return success(stripSignedUrls(data) as unknown as Record<string, unknown>);
}, 'Rooms/Status');
