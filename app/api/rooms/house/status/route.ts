import { withAuthAndErrorHandler, success } from '@/lib/core';
import { roomsProxy } from '@/lib/rooms';
import { stripSignedUrls } from '@/lib/netatmo/stripSignedUrls';

export const dynamic = 'force-dynamic';

/**
 * GET /api/rooms/house/status
 * Returns whole-house status. Public — no auth required.
 */
export const GET = withAuthAndErrorHandler(async () => {
  const data = await roomsProxy.getHouseStatus();
  // S11: camera entries carry the signed vpn_url
  return success(stripSignedUrls(data) as unknown as Record<string, unknown>);
}, 'Rooms/House/Status');
