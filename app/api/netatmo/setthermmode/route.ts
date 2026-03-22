import {
  withAuthAndErrorHandler,
  success,
  badRequest,
  parseJsonOrThrow,
  validateRequired,
  validateEnum,
} from '@/lib/core';
import { adminDbPush } from '@/lib/firebaseAdmin';
import { proxySetThermMode } from '@/lib/netatmo/netatmoProxy';
import { DEVICE_TYPES } from '@/lib/devices/deviceTypes';
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

const VALID_MODES = ['schedule', 'away', 'hg'];

interface SetThermModeBody {
  home_id?: string;
  mode?: string;
  endtime?: number;
}

/**
 * POST /api/netatmo/setthermmode
 * Sets heating mode for entire home via proxy.
 * Body: { home_id, mode, endtime? }
 * Mode: schedule, away, hg (frost guard)
 * Protected: Requires Auth0 authentication
 */
export const POST = withAuthAndErrorHandler(async (request: NextRequest, _context: unknown, session?: any) => {
  const user = session?.user;
  const body = await parseJsonOrThrow(request) as SetThermModeBody;
  const { home_id, mode, endtime } = body;

  // Validate inputs
  validateRequired(home_id, 'home_id');
  validateRequired(mode, 'mode');
  validateEnum(mode, VALID_MODES, 'mode');

  // Build proxy request body
  const proxyBody: { home_id: string; mode: 'schedule' | 'away' | 'hg'; endtime?: number } = {
    home_id: home_id!,
    mode: mode as 'schedule' | 'away' | 'hg',
    ...(endtime && (mode === 'away' || mode === 'hg') ? { endtime } : {}),
  };

  try {
    await proxySetThermMode(proxyBody);
    return success({});
  } catch (error) {
    // Log failure to Firebase
    const logEntry = {
      action: 'Cambio modalita termostato',
      device: DEVICE_TYPES.THERMOSTAT,
      value: mode,
      mode,
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
}, 'Netatmo/SetThermMode');
