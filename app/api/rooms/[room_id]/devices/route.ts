import { withErrorHandler, withAuthAndErrorHandler, success } from '@/lib/core';
import { roomsProxy } from '@/lib/rooms';

export const dynamic = 'force-dynamic';

/**
 * GET /api/rooms/[room_id]/devices
 * Returns devices assigned to a room. Public — no auth required.
 */
export const GET = withErrorHandler(async (_request, context) => {
  const params = await context.params;
  const room_id = params['room_id'] ?? '';
  const data = await roomsProxy.getRoomDevices(Number(room_id));
  return success(data as unknown as Record<string, unknown>);
}, 'Rooms/Devices');

/**
 * POST /api/rooms/[room_id]/devices
 * Assigns a device to a room. Returns 200 (not 201 — this is an assignment operation, not creation).
 * Requires authentication.
 */
export const POST = withAuthAndErrorHandler(async (request, context) => {
  const params = await context.params;
  const room_id = params['room_id'] ?? '';
  const body = (await request.json()) as { device_registry_id: number };
  const data = await roomsProxy.assignDevice(Number(room_id), body);
  return success(data as unknown as Record<string, unknown>);
}, 'Rooms/Devices/Assign');
