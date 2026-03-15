import {
  withAuthAndErrorHandler,
  success,
  badRequest,
  parseJsonOrThrow,
  validateRequired,
  validateEnum,
} from '@/lib/core';
import { adminDbPush } from '@/lib/firebaseAdmin';
import { proxySetRoomThermpoint } from '@/lib/netatmoProxy';
import { DEVICE_TYPES } from '@/lib/devices/deviceTypes';
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

const VALID_MODES = ['manual', 'home'];

interface SetRoomThermPointBody {
  home_id?: string;
  room_id?: string;
  mode?: string;
  temp?: number;
  endtime?: number;
}

/**
 * POST /api/netatmo/setroomthermpoint
 * Sets temperature setpoint for a specific room via proxy.
 * Body: { home_id, room_id, mode, temp?, endtime? }
 * Mode: manual, home
 * Protected: Requires Auth0 authentication
 */
export const POST = withAuthAndErrorHandler(async (request: NextRequest, _context: unknown, session?: any) => {
  const user = session?.user;
  const body = await parseJsonOrThrow(request) as SetRoomThermPointBody;
  const { home_id, room_id, mode, temp, endtime } = body;

  // Validate inputs
  validateRequired(home_id, 'home_id');
  validateRequired(room_id, 'room_id');
  validateRequired(mode, 'mode');
  validateEnum(mode, VALID_MODES, 'mode');

  // Validate temp for manual mode
  if (mode === 'manual' && (temp === undefined || temp === null)) {
    return badRequest('temp e obbligatorio per mode=manual');
  }

  // Build proxy request body
  const proxyBody: { home_id: string; room_id: string; mode: 'manual' | 'home'; temp?: number; endtime?: number } = {
    home_id: home_id!,
    room_id: room_id!,
    mode: mode as 'manual' | 'home',
    ...(mode === 'manual' && { temp }),
    ...(endtime ? { endtime } : {}),
  };

  try {
    await proxySetRoomThermpoint(proxyBody);
    return success({});
  } catch (error) {
    // Log failure to Firebase
    const logEntry = {
      action: 'Modifica temperatura stanza',
      device: DEVICE_TYPES.THERMOSTAT,
      value: temp ? `${temp}°C` : mode,
      room_id,
      mode,
      temp: temp ?? null,
      endtime: endtime ?? null,
      timestamp: Date.now(),
      user: user ? {
        email: user.email,
        name: user.name,
        picture: user.picture,
        sub: user.sub,
      } : null,
      source: 'manual',
      error: error instanceof Error ? error.message : String(error),
    };
    await adminDbPush('log', logEntry);
    throw error;
  }
}, 'Netatmo/SetRoomThermpoint');
