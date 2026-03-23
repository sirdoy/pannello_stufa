import { withErrorHandler, withAuthAndErrorHandler, success, noContent } from '@/lib/core';
import { roomsProxy } from '@/lib/rooms';
import type { RoomUpdate } from '@/types/rooms';

export const dynamic = 'force-dynamic';

/**
 * GET /api/rooms/[room_id]
 * Returns a single room. Public — no auth required.
 */
export const GET = withErrorHandler(async (_request, context) => {
  const params = await context.params;
  const room_id = params['room_id'] ?? '';
  const data = await roomsProxy.getRoom(Number(room_id));
  return success(data as unknown as Record<string, unknown>);
}, 'Rooms/Get');

/**
 * PUT /api/rooms/[room_id]
 * Updates a room. Requires authentication.
 */
export const PUT = withAuthAndErrorHandler(async (request, context) => {
  const params = await context.params;
  const room_id = params['room_id'] ?? '';
  const body = (await request.json()) as RoomUpdate;
  const data = await roomsProxy.updateRoom(Number(room_id), body);
  return success(data as unknown as Record<string, unknown>);
}, 'Rooms/Update');

/**
 * DELETE /api/rooms/[room_id]
 * Deletes a room. Requires authentication.
 */
export const DELETE = withAuthAndErrorHandler(async (_request, context) => {
  const params = await context.params;
  const room_id = params['room_id'] ?? '';
  await roomsProxy.deleteRoom(Number(room_id));
  return noContent();
}, 'Rooms/Delete');
