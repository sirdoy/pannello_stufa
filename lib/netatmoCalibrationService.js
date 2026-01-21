/**
 * Netatmo Valve Calibration Service
 *
 * Server-side service for triggering valve calibration.
 * Called directly from cron jobs without HTTP overhead.
 *
 * Calibration is triggered by switching schedules, which forces
 * Netatmo valves to recalibrate automatically.
 */

import { adminDbGet, adminDbSet, adminDbPush } from '@/lib/firebaseAdmin';
import NETATMO_API from '@/lib/netatmoApi';
import { getValidAccessToken } from '@/lib/netatmoTokenHelper';
import { getEnvironmentPath } from '@/lib/environmentHelper';

/**
 * Calibrate Netatmo valves by switching schedules
 * This is the server-side version that can be called directly from cron
 *
 * @returns {Promise<Object>} Calibration result
 */
export async function calibrateValvesServer() {
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
  const homeId = await adminDbGet(homeIdPath);
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
  const calibrationEntry = {
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
