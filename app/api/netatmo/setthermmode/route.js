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

const VALID_MODES = ['schedule', 'away', 'hg', 'off'];

/**
 * POST /api/netatmo/setthermmode
 * Sets heating mode for entire home
 * Body: { mode, endtime? }
 * Mode: schedule, away, hg (frost guard), off
 * Protected: Requires Auth0 authentication
 */
export const POST = withAuthAndErrorHandler(async (request, context, session) => {
  const user = session.user;
  const body = await parseJsonOrThrow(request);
  const { mode, endtime } = body;

  // Validate inputs
  validateRequired(mode, 'mode');
  validateEnum(mode, VALID_MODES, 'mode');

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
    mode,
  };

  if (endtime && (mode === 'away' || mode === 'hg')) {
    params.endtime = endtime;
  }

  // Set thermostat mode
  const result = await NETATMO_API.setThermMode(accessToken, params);

  if (!result) {
    return serverError('Comando non riuscito');
  }

  // Log action using Admin SDK
  const logEntry = {
    action: 'Cambio modalita termostato',
    device: DEVICE_TYPES.THERMOSTAT,
    value: mode,
    mode,
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
}, 'Netatmo/SetThermMode');
