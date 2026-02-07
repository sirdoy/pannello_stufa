/**
 * Philips Hue Rooms Route
 * GET: Fetch all rooms with their grouped lights
 *
 * Uses Strategy Pattern (automatic local/remote fallback)
 */

import { withHueHandler, success } from '@/lib/core';
import { HueConnectionStrategy } from '@/lib/hue/hueConnectionStrategy';

export const dynamic = 'force-dynamic';

export const GET = withHueHandler(async () => {
  const provider = await HueConnectionStrategy.getProvider();

  const [roomsResponse, zonesResponse] = await Promise.all([
    provider.getRooms() as any,
    provider.getZones() as any,
  ]);

  // Combine rooms and zones
  const rooms = [
    ...(roomsResponse.data || []),
    ...(zonesResponse.data || []),
  ];

  return success({
    rooms,
  });
}, 'Hue/Rooms');
