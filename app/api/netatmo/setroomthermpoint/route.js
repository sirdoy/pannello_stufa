import {
  withAuthAndErrorHandler,
  success,
  badRequest,
  serverError,
  requireNetatmoToken,
  parseJsonOrThrow,
  validateRequired,
  validateEnum,
} from '@/lib/core';
import { adminDbGet, adminDbPush } from '@/lib/firebaseAdmin';
import NETATMO_API from '@/lib/netatmoApi';
import { getEnvironmentPath } from '@/lib/environmentHelper';
import { DEVICE_TYPES } from '@/lib/devices/deviceTypes';

export const dynamic = 'force-dynamic';

const VALID_MODES = ['manual', 'home', 'max', 'off'];

/**
 * POST /api/netatmo/setroomthermpoint
 * Sets temperature setpoint for a specific room
 * Body: { room_id, mode, temp?, endtime? }
 * Mode: manual, home, max, off
 * Protected: Requires Auth0 authentication
 */
export const POST = withAuthAndErrorHandler(async (request, _context, session) => {
  const user = session.user;
  const body = await parseJsonOrThrow(request);
  const { room_id, mode, temp, endtime } = body;

  // Validate inputs
  validateRequired(room_id, 'room_id');
  validateRequired(mode, 'mode');
  validateEnum(mode, VALID_MODES, 'mode');

  // Validate temp for manual mode
  if (mode === 'manual' && (temp === undefined || temp === null)) {
    return badRequest('temp e obbligatorio per mode=manual');
  }

  const accessToken = await requireNetatmoToken();

  // Get home_id from Firebase (use environment-aware path)
  const homeIdPath = getEnvironmentPath('netatmo/home_id');
  const homeId = await adminDbGet(homeIdPath);
  if (!homeId) {
    return badRequest('home_id non trovato. Chiama prima /api/netatmo/homesdata');
  }

  // Build request params
  const params = {
    home_id: homeId,
    room_id,
    mode,
  };

  if (mode === 'manual') {
    params.temp = temp;
    if (endtime) {
      params.endtime = endtime;
    }
  }

  // Set room thermpoint
  const result = await NETATMO_API.setRoomThermpoint(accessToken, params);

  if (!result) {
    return serverError('Comando non riuscito');
  }

  // Log action using Admin SDK
  const logEntry = {
    action: 'Modifica temperatura stanza',
    device: DEVICE_TYPES.THERMOSTAT,
    value: temp ? `${temp}°C` : mode,
    room_id,
    mode,
    temp: temp || null,
    endtime: endtime || null,
    timestamp: Date.now(),
    user: {
      email: user.email,
      name: user.name,
      picture: user.picture,
      sub: user.sub,
    },
    source: 'manual',
  };

  await adminDbPush('log', logEntry);

  return success({});
}, 'Netatmo/SetRoomThermpoint');
