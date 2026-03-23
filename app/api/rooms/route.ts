import { NextResponse } from 'next/server';
import { withErrorHandler, withAuthAndErrorHandler, created } from '@/lib/core';
import { roomsProxy } from '@/lib/rooms';
import type { RoomCreate } from '@/types/rooms';

export const dynamic = 'force-dynamic';

/**
 * GET /api/rooms
 * Returns all rooms. Public — no auth required.
 * Returns raw array — success() would spread array into object.
 */
export const GET = withErrorHandler(async () => {
  const data = await roomsProxy.getRooms();
  return NextResponse.json(data);
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
