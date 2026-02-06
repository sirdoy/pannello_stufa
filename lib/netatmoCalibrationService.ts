/**
 * Netatmo Valve Calibration Service
 *
 * Server-side service for triggering valve calibration.
 * Called directly from cron jobs without HTTP overhead.
 *
 * Calibration is triggered by switching schedules, which forces
 * Netatmo valves to recalibrate automatically.
 */

import { adminDbGet, adminDbPush } from '@/lib/firebaseAdmin';
import NETATMO_API from '@/lib/netatmoApi';
import { getValidAccessToken } from '@/lib/netatmoTokenHelper';
import { getEnvironmentPath } from '@/lib/environmentHelper';

/** Calibration result - success */
interface CalibrationSuccess {
  calibrated: true;
  schedule_name: string;
  timestamp: number;
  note?: string;
}

/** Calibration result - failure */
interface CalibrationFailure {
  calibrated: false;
  reason: 'auth_error' | 'no_home_id' | 'no_homes' | 'no_schedule' | 'insufficient_schedules' | 'switch_failed' | 'no_homes_after' | 'restore_failed';
  error: string;
}

/** Calibration result */
export type CalibrationResult = CalibrationSuccess | CalibrationFailure;

/** Calibration log entry */
interface CalibrationEntry {
  timestamp: number;
  schedule_id: string;
  schedule_name: string;
  triggered_by: string;
  status: string;
}

/**
 * Calibrate Netatmo valves by switching schedules
 * This is the server-side version that can be called directly from cron
 */
export async function calibrateValvesServer(): Promise<CalibrationResult> {
  // Get valid access token
  const { accessToken, error: tokenError } = await getValidAccessToken();
  if (tokenError) {
    return {
      calibrated: false,
      reason: 'auth_error',
      error: tokenError,
    };
  }

  // Get home_id from Firebase
  const homeIdPath = getEnvironmentPath('netatmo/home_id');
  const homeId = await adminDbGet(homeIdPath) as string | null;
  if (!homeId) {
    return {
      calibrated: false,
      reason: 'no_home_id',
      error: 'home_id non trovato. Chiama prima /api/netatmo/homesdata',
    };
  }

  // Get homes data from Netatmo API
  const homesData = await NETATMO_API.getHomesData(accessToken);
  if (!homesData || homesData.length === 0) {
    return {
      calibrated: false,
      reason: 'no_homes',
      error: 'Nessuna casa trovata nell\'account Netatmo',
    };
  }

  const home = homesData[0];
  const schedules = home.schedules || [];

  // Find the currently selected schedule
  const currentSchedule = schedules.find(s => s.selected === true);
  if (!currentSchedule) {
    return {
      calibrated: false,
      reason: 'no_schedule',
      error: 'Nessuno schedule attivo trovato',
    };
  }

  // Need at least 2 schedules to trigger calibration
  if (schedules.length < 2) {
    return {
      calibrated: false,
      reason: 'insufficient_schedules',
      error: 'Calibrazione richiede almeno 2 schedule configurati',
    };
  }

  // Find alternative schedule
  const alternativeSchedule = schedules.find(s => s.id !== currentSchedule.id);

  if (!alternativeSchedule) {
    return {
      calibrated: false,
      reason: 'no_schedule',
      error: 'Nessuno schedule alternativo trovato',
    };
  }

  console.log(`🔄 Switching to schedule: ${alternativeSchedule.name}`);

  // Switch to alternative schedule
  const switched1 = await NETATMO_API.switchHomeSchedule(accessToken, homeId, alternativeSchedule.id);
  if (!switched1) {
    return {
      calibrated: false,
      reason: 'switch_failed',
      error: 'Errore durante cambio schedule',
    };
  }

  // Wait 2 seconds
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Re-read current schedule to check if user changed it manually during calibration
  const homesDataAfter = await NETATMO_API.getHomesData(accessToken);
  if (!homesDataAfter || homesDataAfter.length === 0) {
    return {
      calibrated: false,
      reason: 'no_homes_after',
      error: 'Impossibile verificare schedule dopo cambio',
    };
  }

  const homeAfter = homesDataAfter[0];
  const schedulesAfter = homeAfter.schedules || [];
  const currentScheduleAfter = schedulesAfter.find(s => s.selected === true);

  // If schedule changed during calibration, don't switch back (respect user's choice)
  if (currentScheduleAfter && currentScheduleAfter.id !== alternativeSchedule.id) {
    console.log(`⚠️ Schedule changed during calibration (now: ${currentScheduleAfter.name}). Keeping user's selection.`);
    return {
      calibrated: true,
      schedule_name: currentScheduleAfter.name || 'Unknown',
      timestamp: Date.now(),
      note: 'User changed schedule during calibration - kept new selection',
    };
  }

  console.log(`🔄 Switching back to schedule: ${currentSchedule.name}`);

  // Switch back to original schedule
  const switched2 = await NETATMO_API.switchHomeSchedule(accessToken, homeId, currentSchedule.id);
  if (!switched2) {
    return {
      calibrated: false,
      reason: 'restore_failed',
      error: 'Errore durante ripristino schedule',
    };
  }

  // Log calibration
  const calibrationEntry: CalibrationEntry = {
    timestamp: Date.now(),
    schedule_id: currentSchedule.id,
    schedule_name: currentSchedule.name || 'Unknown',
    triggered_by: 'cron',
    status: 'success',
  };
  await adminDbPush('netatmo/calibrations', calibrationEntry);

  return {
    calibrated: true,
    schedule_name: currentSchedule.name || 'Unknown',
    timestamp: Date.now(),
  };
}

export default {
  calibrateValvesServer,
};
