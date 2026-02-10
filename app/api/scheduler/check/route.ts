/**
 * API Route: Scheduler Check
 *
 * GET /api/scheduler/check?secret=xxx
 *
 * Cron job endpoint for automated stove control:
 * - Checks scheduler mode (manual/auto/semi-manual)
 * - Gets current stove status
 * - Applies scheduled ignition/shutdown
 * - Tracks maintenance hours
 * - Syncs Netatmo valves
 * - Sends notifications
 *
 * Protected: Requires CRON_SECRET
 */

import {
  withCronSecret,
  success,
} from '@/lib/core';
import { adminDbGet, adminDbSet, adminDbUpdate, getAdminDatabase } from '@/lib/firebaseAdmin';
import { canIgnite, trackUsageHours } from '@/lib/maintenanceServiceAdmin';
import { getEnvironmentPath } from '@/lib/environmentHelper';
import {
  triggerStoveStatusWorkServer,
  triggerStoveUnexpectedOffServer,
  triggerSchedulerActionServer,
  triggerMaintenanceAlertServer,
} from '@/lib/notificationTriggersServer';
import {
  getStoveStatus,
  getFanLevel,
  getPowerLevel,
  igniteStove,
  shutdownStove,
  setPowerLevel,
  setFanLevel,
} from '@/lib/stoveApi';
import { updateStoveState } from '@/lib/stoveStateService';
import { syncLivingRoomWithStove, enforceStoveSyncSetpoints } from '@/lib/netatmoStoveSync';
import { calibrateValvesServer } from '@/lib/netatmoCalibrationService';
import { proactiveTokenRefresh } from '@/lib/hue/hueRemoteTokenHelper';
import { fetchWeatherForecast } from '@/lib/openMeteo';
import { saveWeatherToCache } from '@/lib/weatherCacheService';
import { PIDController } from '@/lib/utils/pidController';
import { logCronExecution } from '@/lib/cronExecutionLogger';

export const dynamic = 'force-dynamic';

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Send scheduler notification using Phase 3 notification system
 */
async function sendSchedulerNotification(action: string, details: string = ''): Promise<void> {
  try {
    const adminUserId = process.env.ADMIN_USER_ID;

    if (!adminUserId) {
      console.log('⚠️ ADMIN_USER_ID non configurato - notifiche scheduler disabilitate');
      return;
    }

    // Map action to notification trigger
    // IGNITE → scheduler_ignition, SHUTDOWN → scheduler_shutdown
    // Both map to 'scheduler_success' type in Phase 3 schema
    const actionType = action === 'IGNITE' ? 'ignition' : 'shutdown';

    // Use Phase 3 trigger system (checks preferences, rate limits, DND)
    const result = await triggerSchedulerActionServer(adminUserId, actionType, {
      message: details || `La stufa è stata ${action === 'IGNITE' ? 'accesa' : 'spenta'} automaticamente`,
    });

    if (result.skipped) {
      console.log(`⏭️ Scheduler notification skipped: ${result.reason}`);
    } else if (result.success) {
      console.log(`✅ Notifica scheduler inviata: ${action}`);
    } else {
      console.error(`❌ Errore invio notifica scheduler: ${result.error}`);
    }

  } catch (error) {
    console.error('❌ Errore invio notifica scheduler:', error);
  }
}

async function calibrateValvesIfNeeded(): Promise<any> {
  try {
    const calibrationPath = getEnvironmentPath('netatmo/lastAutoCalibration');
    const lastCalibration = await adminDbGet(calibrationPath) as number | null;

    const now = Date.now();
    const TWELVE_HOURS = 12 * 60 * 60 * 1000;

    if (lastCalibration && (now - lastCalibration) < TWELVE_HOURS) {
      return {
        calibrated: false,
        reason: 'too_soon',
        nextCalibration: new Date(lastCalibration + TWELVE_HOURS).toISOString(),
      };
    }

    console.log('🔧 Avvio calibrazione automatica valvole Netatmo (ogni 12h)...');

    // Call service directly instead of HTTP request
    const result = await calibrateValvesServer() as any;

    if (!result.calibrated) {
      console.error('❌ Calibrazione automatica fallita:', result.error || result.reason);
      return result;
    }

    await adminDbSet(calibrationPath, now);
    console.log('✅ Calibrazione automatica valvole completata');

    return {
      calibrated: true,
      timestamp: now,
      nextCalibration: new Date(now + TWELVE_HOURS).toISOString(),
    };

  } catch (error) {
    console.error('❌ Errore calibrazione automatica valvole:', error);
    return {
      calibrated: false,
      reason: 'exception',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Refresh weather data if interval has passed (every 30 minutes)
 * Following same pattern as calibrateValvesIfNeeded()
 */
async function refreshWeatherIfNeeded(): Promise<any> {
  try {
    const lastRefreshPath = getEnvironmentPath('cron/lastWeatherRefresh');
    const lastRefresh = await adminDbGet(lastRefreshPath) as number | null;

    const now = Date.now();
    const THIRTY_MINUTES = 30 * 60 * 1000;

    if (lastRefresh && (now - lastRefresh) < THIRTY_MINUTES) {
      return {
        refreshed: false,
        reason: 'too_soon',
        nextRefresh: new Date(lastRefresh + THIRTY_MINUTES).toISOString(),
      };
    }

    console.log('🌤️ Avvio refresh automatico weather (ogni 30 min)...');

    // Read location from Firebase
    const locationPath = getEnvironmentPath('config/location');
    const location = await adminDbGet(locationPath) as { latitude: number; longitude: number; name?: string } | null;

    if (!location || !location.latitude || !location.longitude) {
      console.warn('⚠️ Weather refresh skipped: location not configured');
      return {
        refreshed: false,
        reason: 'no_location',
      };
    }

    const { latitude, longitude, name } = location;

    // Fetch weather forecast from Open-Meteo
    const weatherData = await fetchWeatherForecast(latitude, longitude);

    // Save to Firebase cache
    await saveWeatherToCache(latitude, longitude, weatherData);

    // Update last refresh timestamp
    await adminDbSet(lastRefreshPath, now);

    console.log(`✅ Weather refresh completato per ${name || 'Unknown'}`);

    return {
      refreshed: true,
      timestamp: now,
      location: { latitude, longitude, name },
      nextRefresh: new Date(now + THIRTY_MINUTES).toISOString(),
    };

  } catch (error) {
    console.error('❌ Errore refresh weather:', error);
    return {
      refreshed: false,
      reason: 'exception',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Cleanup stale FCM tokens if interval has passed (every 7 days)
 * Following same pattern as calibrateValvesIfNeeded()
 */
async function cleanupTokensIfNeeded(): Promise<any> {
  try {
    const lastCleanupPath = getEnvironmentPath('cron/lastTokenCleanup');
    const lastCleanup = await adminDbGet(lastCleanupPath) as number | null;

    const now = Date.now();
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

    if (lastCleanup && (now - lastCleanup) < SEVEN_DAYS) {
      return {
        cleaned: false,
        reason: 'too_soon',
        nextCleanup: new Date(lastCleanup + SEVEN_DAYS).toISOString(),
      };
    }

    console.log('🧹 Avvio cleanup automatico token FCM (ogni 7 giorni)...');

    const db = getAdminDatabase();

    // Constants
    const STALE_THRESHOLD_MS = 90 * 24 * 60 * 60 * 1000; // 90 days
    const ERROR_RETENTION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

    // Step 1: Cleanup stale FCM tokens
    const usersRef = db.ref('users');
    const snapshot = await usersRef.once('value');

    let tokensScanned = 0;
    let tokensRemoved = 0;
    const tokenUpdates: Record<string, unknown> = {};

    if (snapshot.exists()) {
      snapshot.forEach(userSnap => {
        const userId = userSnap.key;
        const tokens = userSnap.child('fcmTokens').val() || {};

        Object.entries(tokens).forEach(([tokenKey, tokenData]) => {
          tokensScanned++;
          const data = tokenData as { lastUsed?: string; createdAt?: string };

          // Use lastUsed if available, otherwise fall back to createdAt
          const lastActivity = data.lastUsed || data.createdAt;

          if (!lastActivity) {
            // No timestamp - consider stale
            tokenUpdates[`users/${userId}/fcmTokens/${tokenKey}`] = null;
            tokensRemoved++;
            console.log(`[Cleanup] Removing token without timestamp (user ${userId})`);
            return;
          }

          const lastActivityTime = new Date(lastActivity).getTime();
          const age = now - lastActivityTime;

          if (age > STALE_THRESHOLD_MS) {
            tokenUpdates[`users/${userId}/fcmTokens/${tokenKey}`] = null;
            tokensRemoved++;
            const ageDays = Math.floor(age / (24 * 60 * 60 * 1000));
            console.log(`[Cleanup] Removing stale token (${ageDays} days old, user ${userId})`);
          }
        });
      });

      // Apply token deletions in single batch update
      if (Object.keys(tokenUpdates).length > 0) {
        await db.ref().update(tokenUpdates);
      }
    }

    // Step 2: Cleanup old error logs (30 days retention)
    const errorCutoff = new Date(now - ERROR_RETENTION_MS).toISOString();
    const errorsRef = db.ref('notificationErrors');
    const errorsSnapshot = await errorsRef.once('value');

    let errorsRemoved = 0;
    const errorUpdates: Record<string, unknown> = {};

    if (errorsSnapshot.exists()) {
      errorsSnapshot.forEach(errorSnap => {
        const error = errorSnap.val();
        if (error?.timestamp && error.timestamp < errorCutoff) {
          errorUpdates[`notificationErrors/${errorSnap.key}`] = null;
          errorsRemoved++;
        }
      });

      // Apply error deletions in single batch update
      if (Object.keys(errorUpdates).length > 0) {
        await db.ref().update(errorUpdates);
      }
    }

    // Update last cleanup timestamp
    await adminDbSet(lastCleanupPath, now);

    console.log(`✅ Token cleanup completato: ${tokensRemoved}/${tokensScanned} tokens, ${errorsRemoved} errors rimossi`);

    return {
      cleaned: true,
      timestamp: now,
      tokensRemoved,
      tokensScanned,
      errorsRemoved,
      nextCleanup: new Date(now + SEVEN_DAYS).toISOString(),
    };

  } catch (error) {
    console.error('❌ Errore cleanup token:', error);
    return {
      cleaned: false,
      reason: 'exception',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send maintenance notification using Phase 3 notification system
 */
async function sendMaintenanceNotificationIfNeeded(notificationData: {
  notificationLevel: number;
  percentage: number;
  remainingHours: number;
}): Promise<void> {
  const { notificationLevel, percentage, remainingHours } = notificationData;

  const adminUserId = process.env.ADMIN_USER_ID;
  if (!adminUserId) {
    console.log('⚠️ ADMIN_USER_ID non configurato - notifiche manutenzione disabilitate');
    return;
  }

  // Build message based on threshold
  let message;
  if (notificationLevel >= 100) {
    message = 'Manutenzione richiesta! L\'accensione è bloccata fino alla pulizia.';
  } else if (notificationLevel >= 90) {
    message = `Solo ${remainingHours.toFixed(1)}h rimanenti prima della pulizia richiesta`;
  } else {
    message = `${remainingHours.toFixed(1)}h rimanenti prima della manutenzione (${percentage.toFixed(0)}%)`;
  }

  // Use Phase 3 trigger system (checks preferences, rate limits, DND)
  try {
    const result = await triggerMaintenanceAlertServer(adminUserId, notificationLevel, {
      remainingHours,
      message,
    });

    if (result.skipped) {
      console.log(`⏭️ Maintenance notification skipped: ${result.reason}`);
    } else if (result.success) {
      console.log(`✅ Notifica manutenzione inviata: ${notificationLevel}%`);
    } else {
      console.error(`❌ Errore invio notifica manutenzione: ${result.error}`);
    }
  } catch (error) {
    console.error('❌ Errore invio notifica manutenzione:', error);
  }
}

/**
 * Send stove status WORK notification if conditions are met
 * - Sends when stove enters WORK state
 * - Prevents spam by checking if already notified in last 30 minutes
 */
async function sendStoveStatusWorkNotification(currentStatus: string): Promise<void> {
  const adminUserId = process.env.ADMIN_USER_ID;
  if (!adminUserId) return;

  // Only notify when status is WORK (not START, which is transitional)
  if (!currentStatus.includes('WORK')) return;

  try {
    // Check if we already notified recently (30 min cooldown)
    const lastNotifyPath = getEnvironmentPath('scheduler/lastWorkNotification');
    const lastNotify = await adminDbGet(lastNotifyPath) as number | null;
    const now = Date.now();
    const THIRTY_MINUTES = 30 * 60 * 1000;

    if (lastNotify && (now - lastNotify) < THIRTY_MINUTES) {
      return; // Already notified recently
    }

    // Send notification
    await triggerStoveStatusWorkServer(adminUserId, {
      message: 'La stufa e ora in funzione (stato WORK)',
    });
    console.log('✅ Notifica stove_status_work inviata');

    // Save notification timestamp
    await adminDbSet(lastNotifyPath, now);

  } catch (error) {
    console.error('❌ Errore invio notifica stove_status_work:', error instanceof Error ? error.message : 'Unknown error');
  }
}

/**
 * Check for unexpected stove shutdown and send notification
 * - Detects when stove goes OFF during an active schedule interval
 * - Only triggers if scheduler previously ignited during this interval
 */
async function checkAndNotifyUnexpectedOff(active: any, isOn: boolean, statusFetchFailed: boolean): Promise<void> {
  const adminUserId = process.env.ADMIN_USER_ID;
  if (!adminUserId) return;

  // Skip if no active schedule or stove is on or status fetch failed
  if (!active || isOn || statusFetchFailed) return;

  try {
    // Check if we ignited during this schedule interval
    const ignitionTrackPath = getEnvironmentPath('scheduler/lastIgnitionInterval');
    const lastIgnition = await adminDbGet(ignitionTrackPath) as { interval: string } | null;

    if (!lastIgnition) return; // No previous ignition tracked

    // Check if the last ignition was for the current interval
    const currentInterval = `${active.start}-${active.end}`;
    if (lastIgnition.interval !== currentInterval) return; // Different interval

    // Check if we already notified for this unexpected off (1 hour cooldown)
    const unexpectedOffPath = getEnvironmentPath('scheduler/lastUnexpectedOffNotification');
    const lastUnexpectedNotify = await adminDbGet(unexpectedOffPath) as number | null;
    const now = Date.now();
    const ONE_HOUR = 60 * 60 * 1000;

    if (lastUnexpectedNotify && (now - lastUnexpectedNotify) < ONE_HOUR) {
      return; // Already notified recently
    }

    // Stove was ignited in this interval but is now OFF - unexpected!
    await triggerStoveUnexpectedOffServer(adminUserId, {
      message: `La stufa si e spenta durante l'orario programmato (${active.start}-${active.end})`,
    });
    console.log('⚠️ Notifica stove_unexpected_off inviata');

    // Save notification timestamp
    await adminDbSet(unexpectedOffPath, now);

  } catch (error) {
    console.error('❌ Errore invio notifica stove_unexpected_off:', error instanceof Error ? error.message : 'Unknown error');
  }
}

/**
 * Track ignition for unexpected off detection
 */
async function trackIgnitionForInterval(active: any): Promise<void> {
  if (!active) return;

  try {
    const ignitionTrackPath = getEnvironmentPath('scheduler/lastIgnitionInterval');
    await adminDbSet(ignitionTrackPath, {
      interval: `${active.start}-${active.end}`,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('❌ Errore tracking ignition interval:', error instanceof Error ? error.message : 'Unknown error');
  }
}

async function fetchStoveData(): Promise<any> {
  let currentStatus = 'unknown';
  let isOn = false;
  let currentFanLevel = 3;
  let currentPowerLevel = 2;
  let statusFetchFailed = false;

  try {
    const [statusData, fanData, powerData] = await Promise.all([
      getStoveStatus().catch((err: any) => {
        console.error('❌ Status fetch failed:', err.message);
        return null;
      }),
      getFanLevel().catch((err: any) => {
        console.error('❌ Fan fetch failed:', err.message);
        return null;
      }),
      getPowerLevel().catch((err: any) => {
        console.error('❌ Power fetch failed:', err.message);
        return null;
      })
    ]);

    if (statusData) {
      currentStatus = statusData.StatusDescription || 'unknown';
      isOn = currentStatus.includes('WORK') || currentStatus.includes('START');
    } else {
      console.warn('⚠️ Status unavailable - will skip state-changing actions for safety');
      statusFetchFailed = true;
    }

    if (fanData) {
      currentFanLevel = fanData.Result ?? 3;
    } else {
      console.warn('⚠️ Fan level unavailable - using default: 3');
    }

    if (powerData) {
      currentPowerLevel = powerData.Result ?? 2;
    } else {
      console.warn('⚠️ Power level unavailable - using default: 2');
    }

  } catch (error) {
    console.error('❌ Critical error fetching stove data:', error instanceof Error ? error.message : String(error));
    statusFetchFailed = true;
  }

  return { currentStatus, isOn, currentFanLevel, currentPowerLevel, statusFetchFailed };
}

async function handleIgnition(active: any, ora: string): Promise<any> {
  try {
    const confirmStatusData = await getStoveStatus();
    if (confirmStatusData) {
      const confirmStatus = confirmStatusData.StatusDescription || 'unknown';
      if (confirmStatus.includes('WORK') || confirmStatus.includes('START')) {
        console.log('⚠️ Race condition detected: Stove already on (confirmed) - skipping ignition');
        return { skipped: true, reason: 'ALREADY_ON' };
      }
    }
  } catch (confirmError) {
    console.error('❌ Confirmation status fetch failed:', confirmError instanceof Error ? confirmError.message : 'Unknown error');
    return { skipped: true, reason: 'CONFIRMATION_FAILED' };
  }

  try {
    await igniteStove(active.power);

    await updateStoveState({
      status: 'START',
      statusDescription: 'Avvio automatico',
      fanLevel: active.fan,
      powerLevel: active.power,
      source: 'scheduler',
    });

    await sendSchedulerNotification('IGNITE', `Stufa accesa automaticamente alle ${ora} (P${active.power}, V${active.fan})`);

    syncLivingRoomWithStove(true).then((result: any) => {
      if (result.synced) {
        console.log(`✅ Netatmo stove sync: ${result.roomNames || 'Rooms'} set to ${result.temperature}°C`);
      }
    }).catch((err: any) => console.error('❌ Netatmo stove sync error:', err));

    return { success: true };
  } catch (error) {
    console.error('❌ Failed to ignite stove:', error instanceof Error ? error.message : 'Unknown error');
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function handleShutdown(ora: string): Promise<any> {
  try {
    await shutdownStove();

    await updateStoveState({
      status: 'STANDBY',
      statusDescription: 'Spegnimento automatico',
      source: 'scheduler',
    });

    await sendSchedulerNotification('SHUTDOWN', `Stufa spenta automaticamente alle ${ora}`);

    syncLivingRoomWithStove(false).then((result: any) => {
      if (result.synced) {
        console.log(`✅ Netatmo stove sync: ${result.roomNames || 'Rooms'} returned to schedule`);
      }
    }).catch((err: any) => console.error('❌ Netatmo stove sync error:', err));

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Failed to shutdown stove:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

async function handleLevelChanges(active: any, currentPowerLevel: number, currentFanLevel: number): Promise<any> {
  let changeApplied = false;

  if (currentPowerLevel !== active.power) {
    try {
      await setPowerLevel(active.power);
      await updateStoveState({ powerLevel: active.power, source: 'scheduler' });
      changeApplied = true;
    } catch (error) {
      console.error('❌ Failed to set power:', error instanceof Error ? error.message : String(error));
    }
  }

  if (currentFanLevel !== active.fan) {
    try {
      await setFanLevel(active.fan);
      await updateStoveState({ fanLevel: active.fan, source: 'scheduler' });
      changeApplied = true;
    } catch (error) {
      console.error('❌ Failed to set fan:', error instanceof Error ? error.message : String(error));
    }
  }

  return changeApplied;
}

/**
 * Run PID automation if enabled
 *
 * Adjusts stove power level based on living room temperature vs thermostat setpoint
 * using a PID controller algorithm.
 *
 * @param {boolean} isOn - Whether stove is currently ON
 * @param {number} currentPowerLevel - Current stove power level (1-5)
 * @param {boolean} semiManual - Whether scheduler is in semi-manual mode
 * @param {boolean} schedulerEnabled - Whether scheduler is enabled
 * @returns {Object} - { skipped, reason } or { adjusted, from, to, temperature, setpoint }
 */
async function runPidAutomationIfEnabled(isOn: boolean, currentPowerLevel: number, semiManual: boolean, schedulerEnabled: boolean): Promise<any> {
  try {
    // Skip if stove is not ON
    if (!isOn) {
      return { skipped: true, reason: 'stove_off' };
    }

    // Skip if not in automatic mode (semi-manual or manual)
    if (semiManual || !schedulerEnabled) {
      return { skipped: true, reason: 'not_auto_mode' };
    }

    // Get admin user ID for single-user system
    const adminUserId = process.env.ADMIN_USER_ID;
    if (!adminUserId) {
      return { skipped: true, reason: 'no_admin_user' };
    }

    // Read PID config from Firebase
    const pidConfig = await adminDbGet(`users/${adminUserId}/pidAutomation`) as any;
    if (!pidConfig || !pidConfig.enabled) {
      return { skipped: true, reason: 'pid_disabled' };
    }

    // Read Netatmo current status from Firebase cache
    const netatmoStatus = await adminDbGet('netatmo/currentStatus') as any;
    if (!netatmoStatus || !netatmoStatus.rooms) {
      return { skipped: true, reason: 'no_netatmo_data' };
    }

    // Find target room
    const targetRoomId = pidConfig.targetRoomId;
    if (!targetRoomId) {
      return { skipped: true, reason: 'no_target_room' };
    }

    const rooms = Object.values(netatmoStatus.rooms) as any[];
    // Note: netatmo/currentStatus saves rooms with room_id field, not id
    const targetRoom = rooms.find((r: any) => String(r.room_id) === String(targetRoomId));
    if (!targetRoom) {
      return { skipped: true, reason: 'room_not_found' };
    }

    // Get measured temperature and manual setpoint from config
    const measured = targetRoom.temperature;
    const setpoint = pidConfig.manualSetpoint ?? 20; // Use manual setpoint from config

    if (typeof measured !== 'number') {
      return { skipped: true, reason: 'no_temperature_data' };
    }

    if (typeof setpoint !== 'number' || setpoint < 15 || setpoint > 25) {
      return { skipped: true, reason: 'invalid_setpoint' };
    }

    // Read PID state from Firebase (integral, prevError, lastRun)
    const pidStatePath = getEnvironmentPath('pidAutomation/state');
    const pidState = await adminDbGet(pidStatePath) as any;

    // Calculate time delta in minutes
    const now = Date.now();
    let dt = 5; // Default 5 minutes (cron interval)
    if (pidState && pidState.lastRun) {
      dt = (now - pidState.lastRun) / 60000; // Convert ms to minutes
      // Clamp dt to reasonable range (1-30 minutes)
      dt = Math.max(1, Math.min(30, dt));
    }

    // Instantiate PID controller with config gains
    const pid = new PIDController({
      kp: pidConfig.kp ?? 0.5,
      ki: pidConfig.ki ?? 0.1,
      kd: pidConfig.kd ?? 0.05,
      outputMin: 1,
      outputMax: 5,
      integralMax: 10,
    });

    // Restore state from previous run
    if (pidState) {
      pid.setState({
        integral: pidState.integral ?? 0,
        prevError: pidState.prevError ?? 0,
        initialized: pidState.initialized ?? false,
      });
    }

    // Compute target power level
    const targetPower = pid.compute(setpoint, measured, dt);

    // Save updated PID state
    const newState = pid.getState();
    await adminDbSet(pidStatePath, {
      integral: newState.integral,
      prevError: newState.prevError,
      initialized: newState.initialized,
      lastRun: now,
    });

    // Check if power level needs adjustment
    if (targetPower !== currentPowerLevel) {
      console.log(`🎯 PID: ${measured.toFixed(1)}°C -> ${setpoint.toFixed(1)}°C target, power ${currentPowerLevel} -> ${targetPower}`);

      // Apply new power level
      await setPowerLevel(targetPower as any);
      await updateStoveState({ powerLevel: targetPower, source: 'pid_automation' as any });

      return {
        adjusted: true,
        from: currentPowerLevel,
        to: targetPower,
        temperature: measured,
        setpoint: setpoint,
        roomName: targetRoom.name,
      };
    }

    return {
      adjusted: false,
      reason: 'no_change_needed',
      currentPower: currentPowerLevel,
      targetPower,
      temperature: measured,
      setpoint: setpoint,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ PID automation error:', errorMessage);
    return { skipped: true, reason: 'exception', error: errorMessage };
  }
}

// =============================================================================
// MAIN ROUTE HANDLER
// =============================================================================

/**
 * GET /api/scheduler/check
 * Main cron handler for scheduler automation
 * Protected: Requires CRON_SECRET
 */
export const GET = withCronSecret(async (_request) => {
  // Save cron health timestamp
  const cronHealthTimestamp = new Date().toISOString();
  console.log(`🔄 Tentativo salvataggio Firebase cronHealth/lastCall: ${cronHealthTimestamp}`);

  await adminDbSet('cronHealth/lastCall', cronHealthTimestamp);
  console.log(`✅ Cron health updated: ${cronHealthTimestamp}`);

  // Record start time for execution logging
  const startTime = Date.now();

  // Check if scheduler mode is enabled
  const modeData = ((await adminDbGet('schedules-v2/mode')) as any) || { enabled: false, semiManual: false };
  const schedulerEnabled = modeData.enabled;

  if (!schedulerEnabled) {
    const duration = Date.now() - startTime;
    logCronExecution({
      status: 'MODALITA_MANUALE',
      mode: 'manual',
      duration,
    }).catch(err => console.error('❌ Cron execution log error:', err));

    return success({
      status: 'MODALITA_MANUALE',
      message: 'Scheduler disattivato - modalità manuale attiva'
    });
  }

  // Check if in semi-manual mode
  if (modeData.semiManual) {
    const returnToAutoAt = modeData.returnToAutoAt ? new Date(modeData.returnToAutoAt) : null;
    const now = new Date();

    if (!returnToAutoAt || now < returnToAutoAt) {
      const duration = Date.now() - startTime;
      logCronExecution({
        status: 'MODALITA_SEMI_MANUALE',
        mode: 'semi-manual',
        duration,
        details: { returnToAutoAt: modeData.returnToAutoAt },
      }).catch(err => console.error('❌ Cron execution log error:', err));

      return success({
        status: 'MODALITA_SEMI_MANUALE',
        message: 'Modalità semi-manuale attiva - in attesa del prossimo cambio scheduler',
        returnToAutoAt: modeData.returnToAutoAt
      });
    }
    console.log('Ritorno in modalità automatica dallo stato semi-manuale');
  }

  // Parse current time in Rome timezone
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('it-IT', {
    timeZone: 'Europe/Rome',
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(now);
  const dayPart = parts.find(p => p.type === 'weekday')?.value || '';
  const hourPart = parts.find(p => p.type === 'hour')?.value || '00';
  const minutePart = parts.find(p => p.type === 'minute')?.value || '00';

  const giorno = capitalize(dayPart);
  const ora = `${hourPart}:${minutePart}`;
  const currentMinutes = parseInt(hourPart) * 60 + parseInt(minutePart);

  // Get active schedule
  const activeScheduleId = (await adminDbGet('schedules-v2/activeScheduleId') as string | null) || 'default';
  const intervals = (await adminDbGet(`schedules-v2/schedules/${activeScheduleId}/slots/${giorno}`) as any[] | null);

  if (!intervals) {
    const duration = Date.now() - startTime;
    logCronExecution({
      status: 'NO_SCHEDULE',
      mode: 'auto',
      duration,
      details: { giorno, ora },
    }).catch(err => console.error('❌ Cron execution log error:', err));

    return success({ message: 'Nessuno scheduler', giorno, ora });
  }

  const active = intervals.find(({ start, end }: any) => {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const startMin = sh * 60 + sm;
    const endMin = eh * 60 + em;
    return currentMinutes >= startMin && currentMinutes < endMin;
  });

  // Fetch stove data in parallel
  const { currentStatus, isOn, currentFanLevel, currentPowerLevel, statusFetchFailed } = await fetchStoveData();

  // Send stove status WORK notification if conditions are met (async, don't block)
  sendStoveStatusWorkNotification(currentStatus).catch((err: any) =>
    console.error('❌ Errore notifica stove_status_work:', err.message)
  );

  // Check for unexpected off and notify (async, don't block)
  checkAndNotifyUnexpectedOff(active, isOn, statusFetchFailed).catch(err =>
    console.error('❌ Errore check unexpected off:', err.message)
  );

  // Auto-calibrate Netatmo valves every 12h (async, don't wait)
  calibrateValvesIfNeeded().then((result) => {
    if (result.calibrated) {
      console.log(`✅ Calibrazione automatica completata - prossima: ${result.nextCalibration}`);
    }
  }).catch(err => console.error('❌ Errore calibrazione:', err));

  // Weather refresh every 30 minutes (async, don't wait)
  refreshWeatherIfNeeded().then((result) => {
    if (result.refreshed) {
      console.log(`✅ Weather refresh completato - prossimo: ${result.nextRefresh}`);
    }
  }).catch(err => console.error('❌ Errore weather refresh:', err.message));

  // Token cleanup every 7 days (async, don't wait)
  cleanupTokensIfNeeded().then((result) => {
    if (result.cleaned) {
      console.log(`✅ Token cleanup completato - prossimo: ${result.nextCleanup}`);
    }
  }).catch(err => console.error('❌ Errore token cleanup:', err.message));

  // Proactive Hue token refresh (async, don't wait)
  // Refreshes token if expiring within 24 hours to avoid manual reconnection
  proactiveTokenRefresh().then((result) => {
    if (result.refreshed) {
      console.log('✅ Hue token refreshed proactively');
    }
  }).catch(err => console.error('❌ Hue token refresh error:', err.message));

  // Track maintenance hours
  const maintenanceTrack = await trackUsageHours(currentStatus);
  if (maintenanceTrack.tracked) {
    console.log(`✅ Maintenance tracked: +${maintenanceTrack.elapsedMinutes}min → ${(maintenanceTrack.newCurrentHours ?? 0).toFixed(2)}h total`);

    if (maintenanceTrack.notificationData) {
      await sendMaintenanceNotificationIfNeeded(maintenanceTrack.notificationData as any);
    }
  }

  // Continuous stove sync enforcement - verify actual Netatmo setpoints, not just Firebase stoveMode
  // This handles both state mismatches AND setpoint expiration (8-hour manual setpoints)
  try {
    console.log(`🔥 Stove sync check: isOn=${isOn}, status=${currentStatus}`);
    const enforcementResult = await enforceStoveSyncSetpoints(isOn) as any;
    if (enforcementResult.enforced || enforcementResult.synced) {
      if (enforcementResult.action === 'setpoint_enforcement') {
        console.log(`✅ Stove sync enforcement: ${enforcementResult.fixedCount} room(s) re-synced (setpoints had drifted)`);
      } else {
        console.log(`✅ Stove sync enforced: ${enforcementResult.roomNames} ${isOn ? `set to ${enforcementResult.temperature}°C` : 'returned to schedule'}`);
      }
    } else {
      console.log(`🔥 Stove sync: no action needed (reason: ${enforcementResult.reason})`);
    }
  } catch (syncError) {
    console.error('❌ Stove sync enforcement error:', syncError instanceof Error ? syncError.message : String(syncError));
  }

  let changeApplied = false;

  if (active) {
    if (!isOn) {
      // Safety check - skip ignition if status fetch failed
      if (statusFetchFailed) {
        console.log('⚠️ Accensione schedulata saltata - stato stufa sconosciuto (safety)');
        const duration = Date.now() - startTime;
        logCronExecution({
          status: 'STATUS_UNAVAILABLE',
          mode: 'auto',
          duration,
          details: { giorno, ora },
        }).catch(err => console.error('❌ Cron execution log error:', err));

        return success({
          status: 'STATUS_UNAVAILABLE',
          message: 'Accensione schedulata saltata per sicurezza - stato stufa non disponibile',
          schedulerEnabled: true,
          giorno,
          ora
        });
      }

      // Check maintenance before scheduled ignition
      const maintenanceAllowed = await canIgnite();
      if (!maintenanceAllowed) {
        console.log('⚠️ Accensione schedulata bloccata - manutenzione richiesta');
        const duration = Date.now() - startTime;
        logCronExecution({
          status: 'MANUTENZIONE_RICHIESTA',
          mode: 'auto',
          duration,
          details: { giorno, ora },
        }).catch(err => console.error('❌ Cron execution log error:', err));

        return success({
          status: 'MANUTENZIONE_RICHIESTA',
          message: 'Accensione schedulata bloccata - manutenzione stufa richiesta',
          schedulerEnabled: true,
          giorno,
          ora
        });
      }

      const ignitionResult = await handleIgnition(active, ora);
      if (ignitionResult.skipped) {
        const duration = Date.now() - startTime;
        logCronExecution({
          status: ignitionResult.reason,
          mode: 'auto',
          duration,
          details: { giorno, ora },
        }).catch(err => console.error('❌ Cron execution log error:', err));

        return success({
          status: ignitionResult.reason,
          message: ignitionResult.reason === 'ALREADY_ON'
            ? 'Stufa già accesa - race condition evitato'
            : 'Accensione schedulata saltata - impossibile confermare stato stufa',
          schedulerEnabled: true,
          giorno,
          ora
        });
      }
      if (ignitionResult.success) {
        changeApplied = true;
        // Track this ignition for unexpected off detection
        await trackIgnitionForInterval(active);
      }
    }

    // Handle power/fan level changes (from schedule)
    const levelsChanged = await handleLevelChanges(active, currentPowerLevel, currentFanLevel);
    changeApplied = changeApplied || levelsChanged;

    // Run PID automation if enabled (async, don't block main flow)
    // This may override the scheduled power level based on temperature feedback
    runPidAutomationIfEnabled(isOn, currentPowerLevel, modeData.semiManual, schedulerEnabled)
      .then((result) => {
        if (result.adjusted) {
          console.log(`🎯 PID automation: adjusted power from ${result.from} to ${result.to} (${result.roomName}: ${result.temperature}°C -> ${result.setpoint}°C)`);
        } else if (result.skipped) {
          console.log(`🎯 PID automation: skipped (${result.reason})`);
        } else {
          console.log(`🎯 PID automation: no change needed (power=${result.currentPower}, temp=${result.temperature}°C, setpoint=${result.setpoint}°C)`);
        }
      })
      .catch((err: any) => console.error('❌ PID automation error:', err.message));

  } else {
    // No active schedule - turn off if on
    if (isOn) {
      const shutdownResult = await handleShutdown(ora);
      if (shutdownResult.success) {
        changeApplied = true;
      }
    }
  }

  // If change was applied and we were in semi-manual, return to automatic
  if (changeApplied && modeData.semiManual) {
    await adminDbSet('schedules-v2/mode', {
      enabled: modeData.enabled || false,
      semiManual: false,
      lastUpdated: new Date().toISOString()
    });
    console.log('Cambio scheduler applicato - modalità semi-manuale disattivata');
  }

  const duration = Date.now() - startTime;
  logCronExecution({
    status: active ? 'ACCESA' : 'SPENTA',
    mode: 'auto',
    duration,
    details: { giorno, ora, activeSchedule: active || null },
  }).catch(err => console.error('❌ Cron execution log error:', err));

  return success({
    status: active ? 'ACCESA' : 'SPENTA',
    schedulerEnabled: true,
    giorno,
    ora,
    activeSchedule: active || null,
  });
}, 'Scheduler/Check');
