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
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

const VALID_MODES = ['schedule', 'away', 'hg', 'off'];

interface SetThermModeBody {
  mode?: string;
  endtime?: number;
}

interface ThermModeParams {
  home_id: string;
  mode: string;
  endtime?: number;
}

/**
 * POST /api/netatmo/setthermmode
 * Sets heating mode for entire home
 * Body: { mode, endtime? }
 * Mode: schedule, away, hg (frost guard), off
 * Protected: Requires Auth0 authentication
 */
export const POST = withAuthAndErrorHandler(async (request: NextRequest, _context: unknown, session?: any) => {
  const user = session?.user;
  const body = await parseJsonOrThrow(request) as SetThermModeBody;
  const { mode, endtime } = body;

  // Validate inputs
  validateRequired(mode, 'mode');
  validateEnum(mode, VALID_MODES, 'mode');

  const accessToken = await requireNetatmoToken();

  // Get home_id from Firebase (use environment-aware path)
  const homeIdPath = getEnvironmentPath('netatmo/home_id');
  const homeId = await adminDbGet(homeIdPath) as string | null;
  if (!homeId) {
    return badRequest('home_id non trovato. Chiama prima /api/netatmo/homesdata');
  }

  // Build request params
  const params: ThermModeParams = {
    home_id: homeId,
    mode: mode!,
  };

  if (endtime && (mode === 'away' || mode === 'hg')) {
    params.endtime = endtime;
  }

  // Set thermostat mode
  const result = await NETATMO_API.setThermMode(accessToken, params as any);

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
    user: user ? {
      email: user.email,
      name: user.name,
      picture: user.picture,
      sub: user.sub,
    } : null,
    source: 'manual',
  };

  await adminDbPush('log', logEntry);

  return success({});
}, 'Netatmo/SetThermMode');
