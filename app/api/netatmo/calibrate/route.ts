import {
  withAuthAndErrorHandler,
  success,
  badRequest,
  notFound,
  serverError,
  requireNetatmoToken,
} from '@/lib/core';
import { adminDbGet, adminDbPush } from '@/lib/firebaseAdmin';
import NETATMO_API from '@/lib/netatmoApi';
import { getEnvironmentPath } from '@/lib/environmentHelper';
import { DEVICE_TYPES } from '@/lib/devices/deviceTypes';
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

interface Schedule {
  id: string;
  name?: string;
  selected?: boolean;
  zones?: unknown[];
  timetable?: unknown[];
  [key: string]: unknown;
}

interface Home {
  schedules?: Schedule[];
  [key: string]: unknown;
}

/**
 * POST /api/netatmo/calibrate
 * Triggers valve calibration by syncing the current schedule
 * This forces all valves in the system to recalibrate
 *
 * The Netatmo API doesn't have a dedicated calibration endpoint.
 * Calibration is triggered automatically when:
 * 1. A valve is installed
 * 2. The schedule is synced via synchomeschedule
 *
 * This endpoint uses method #2 to force calibration on demand.
 * Protected: Requires Auth0 authentication
 */
export const POST = withAuthAndErrorHandler(async (request: NextRequest, _context: unknown, session?: any) => {
  const user = session?.user;
  const accessToken = await requireNetatmoToken();

  // Get home_id from Firebase (use environment-aware path)
  const homeIdPath = getEnvironmentPath('netatmo/home_id');
  const homeId = await adminDbGet(homeIdPath) as string | null;
  if (!homeId) {
    return badRequest('home_id non trovato. Chiama prima /api/netatmo/homesdata');
  }

  // Get homes data directly from Netatmo API to get complete schedule structure
  const homesData = await NETATMO_API.getHomesData(accessToken) as unknown as Home[];

  if (!homesData || homesData.length === 0) {
    return notFound('Nessuna casa trovata nell\'account Netatmo');
  }

  const home = homesData[0]; // Usually single home
  if (!home) {
    return notFound('No home data available');
  }
  const schedules = home.schedules ?? [];

  // Find the currently selected schedule
  const currentSchedule = schedules.find(s => s.selected === true);

  if (!currentSchedule) {
    return badRequest('Nessuno schedule attivo trovato');
  }


  // Validate that zones and timetable exist
  if (!currentSchedule.zones || !Array.isArray(currentSchedule.zones)) {
    return badRequest('Schedule zones non valido', {
      details: `zones is ${typeof currentSchedule.zones}`,
    });
  }

  if (!currentSchedule.timetable || !Array.isArray(currentSchedule.timetable)) {
    return badRequest('Schedule timetable non valido', {
      details: `timetable is ${typeof currentSchedule.timetable}`,
    });
  }

  // ALTERNATIVE APPROACH: Force calibration by switching schedules
  // Netatmo valves calibrate automatically when schedule configuration changes
  // We'll switch to a different schedule (if available) and back to trigger recalibration


  if (schedules.length < 2) {
    return badRequest('Calibrazione automatica richiede almeno 2 schedule configurati', {
      details: 'Crea uno schedule secondario in Netatmo app per permettere la calibrazione',
    });
  }

  // Find another schedule (not the current one)
  const alternativeSchedule = schedules.find(s => s.id !== currentSchedule.id);

  if (!alternativeSchedule) {
    return badRequest('Nessuno schedule alternativo trovato');
  }


  // Switch to alternative schedule
  const switched1 = await NETATMO_API.switchHomeSchedule(accessToken, homeId, alternativeSchedule.id);

  if (!switched1) {
    return serverError('Errore durante cambio schedule');
  }

  // Wait 2 seconds
  await new Promise(resolve => setTimeout(resolve, 2000));


  // Switch back to original schedule - this triggers calibration
  const switched2 = await NETATMO_API.switchHomeSchedule(accessToken, homeId, currentSchedule.id);

  if (!switched2) {
    return serverError('Errore durante ripristino schedule');
  }


  // Log action
  const logEntry = {
    action: 'Calibrazione valvole',
    device: DEVICE_TYPES.THERMOSTAT,
    value: currentSchedule.name || 'Unknown',
    schedule_id: currentSchedule.id,
    schedule_name: currentSchedule.name || 'Unknown',
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

  // Track calibration in Firebase
  const calibrationEntry = {
    timestamp: Date.now(),
    schedule_id: currentSchedule.id,
    schedule_name: currentSchedule.name || 'Unknown',
    triggered_by: user?.email || 'unknown',
    status: 'success',
  };
  await adminDbPush('netatmo/calibrations', calibrationEntry);

  return success({
    message: 'Calibrazione valvole avviata con successo',
    schedule_name: currentSchedule.name || 'Unknown',
    timestamp: Date.now(),
  });
}, 'Netatmo/Calibrate');
