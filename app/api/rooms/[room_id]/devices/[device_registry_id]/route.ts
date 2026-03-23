import { withAuthAndErrorHandler, noContent } from '@/lib/core';
import { roomsProxy } from '@/lib/rooms';

export const dynamic = 'force-dynamic';

/**
 * DELETE /api/rooms/[room_id]/devices/[device_registry_id]
 * Removes a device from a room. Requires authentication.
 */
export const DELETE = withAuthAndErrorHandler(async (_request, context) => {
  const params = await context.params;
  const room_id = params['room_id'] ?? '';
  const device_registry_id = params['device_registry_id'] ?? '';
  await roomsProxy.removeDevice(Number(room_id), Number(device_registry_id));
  return noContent();
}, 'Rooms/Devices/Remove');
