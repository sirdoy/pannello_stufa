/**
 * Netatmo Valve Calibration Service
 *
 * Server-side service for triggering valve calibration.
 * Called directly from cron jobs without HTTP overhead.
 *
 * Calibration is triggered by switching schedules, which forces
 * Netatmo valves to recalibrate automatically.
 */

import { adminDbGet, adminDbPush, adminDbSet } from '@/lib/firebaseAdmin';
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

  const home = homesData[0]!;
  const schedules = home.schedules || [];

  // BUGFIX: Restore to user's manually selected schedule (if available) instead of API's current schedule
  // This preserves user intent across calibration cycles
  const userSchedulePath = getEnvironmentPath('netatmo/userSelectedScheduleId');
  const userSelectedId = await adminDbGet(userSchedulePath) as string | null;

  // Find the target schedule to restore after calibration
  let targetSchedule;
  if (userSelectedId) {
    // Try to use user's manually selected schedule
    targetSchedule = schedules.find(s => s.id === userSelectedId);
    if (!targetSchedule) {
      // User's schedule no longer exists (deleted?) - fall back to current
      targetSchedule = schedules.find(s => s.selected === true);
    }
  } else {
    // No user selection stored yet - use current
    targetSchedule = schedules.find(s => s.selected === true);
  }

  if (!targetSchedule) {
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

  // Find alternative schedule (different from target)
  const alternativeSchedule = schedules.find(s => s.id !== targetSchedule.id);

  if (!alternativeSchedule) {
    return {
      calibrated: false,
      reason: 'no_schedule',
      error: 'Nessuno schedule alternativo trovato',
    };
  }


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

  const homeAfter = homesDataAfter[0]!;
  const schedulesAfter = homeAfter.schedules || [];
  const currentScheduleAfter = schedulesAfter.find(s => s.selected === true);

  // If schedule changed during calibration, don't switch back (respect user's choice)
  if (currentScheduleAfter && currentScheduleAfter.id !== alternativeSchedule.id) {
    // User changed it manually - update stored selection and keep their choice
    await adminDbSet(userSchedulePath, currentScheduleAfter.id);
    return {
      calibrated: true,
      schedule_name: currentScheduleAfter.name || 'Unknown',
      timestamp: Date.now(),
      note: 'User changed schedule during calibration - kept new selection',
    };
  }


  // Switch back to target schedule (user's last manual selection or current)
  const switched2 = await NETATMO_API.switchHomeSchedule(accessToken, homeId, targetSchedule.id);
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
    schedule_id: targetSchedule.id,
    schedule_name: targetSchedule.name || 'Unknown',
    triggered_by: 'cron',
    status: 'success',
  };
  await adminDbPush('netatmo/calibrations', calibrationEntry);

  return {
    calibrated: true,
    schedule_name: targetSchedule.name || 'Unknown',
    timestamp: Date.now(),
  };
}

// Note: calibrateValvesServer is the only export from this module (already exported inline above)
