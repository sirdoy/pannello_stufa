import { withErrorHandler, withAuthAndErrorHandler, created, success } from '@/lib/core';
import { roomsProxy } from '@/lib/rooms';
import type { RoomCreate } from '@/types/rooms';

export const dynamic = 'force-dynamic';

/**
 * GET /api/rooms
 * Returns all rooms. Public — no auth required.
 * Array wrapped under `rooms` — success() would spread a bare array into an object.
 */
export const GET = withErrorHandler(async () => {
  const data = await roomsProxy.getRooms();
  return success({ rooms: data });
}, 'Rooms');

/**
 * POST /api/rooms
 * Creates a new room. Requires authentication.
 */
export const POST = withAuthAndErrorHandler(async (request) => {
  const body = (await request.json()) as RoomCreate;
  const data = await roomsProxy.createRoom(body);
  return created(data as unknown as Record<string, unknown>);
}, 'Rooms/Create');
