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
import { logPidTuningEntry, cleanupOldLogs } from '@/lib/services/pidTuningLogService';
import { cleanupStaleTokens } from '@/lib/services/tokenCleanupService';
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
import { logAnalyticsEvent } from '@/lib/analyticsEventLogger';

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
    } else if (result.success) {
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


    // Call service directly instead of HTTP request
    const result = await calibrateValvesServer() as any;

    if (!result.calibrated) {
      console.error('❌ Calibrazione automatica fallita:', result.error || result.reason);
      return result;
    }

    await adminDbSet(calibrationPath, now);

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
 * Delegates to shared tokenCleanupService (TOKEN-01)
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

    // Delegate to shared service
    const result = await cleanupStaleTokens();

    if (result.cleaned) {
      await adminDbSet(lastCleanupPath, now);
    }

    return result;

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
    } else if (result.success) {
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

    // Analytics: log scheduler-initiated ignite event (fire-and-forget, no consent needed)
    logAnalyticsEvent({
      eventType: 'stove_ignite',
      powerLevel: active.power,
      source: 'scheduler',
    }).catch(() => {});

    await sendSchedulerNotification('IGNITE', `Stufa accesa automaticamente alle ${ora} (P${active.power}, V${active.fan})`);

    syncLivingRoomWithStove(true).then((result: any) => {
      if (result.synced) {
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

    // Analytics: log scheduler-initiated shutdown event (fire-and-forget, no consent needed)
    logAnalyticsEvent({
      eventType: 'stove_shutdown',
      source: 'scheduler',
    }).catch(() => {});

    await sendSchedulerNotification('SHUTDOWN', `Stufa spenta automaticamente alle ${ora}`);

    syncLivingRoomWithStove(false).then((result: any) => {
      if (result.synced) {
      }
    }).catch((err: any) => console.error('❌ Netatmo stove sync error:', err));

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Failed to shutdown stove:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

async function handleLevelChanges(active: any, currentPowerLevel: number, currentFanLevel: number, skipPower = false): Promise<any> {
  let changeApplied = false;

  if (!skipPower && currentPowerLevel !== active.power) {
    try {
      await setPowerLevel(active.power);
      await updateStoveState({ powerLevel: active.power, source: 'scheduler' });

      // Analytics: log scheduler-initiated power change (fire-and-forget, no consent needed)
      logAnalyticsEvent({
        eventType: 'power_change',
        powerLevel: active.power,
        source: 'scheduler',
      }).catch(() => {});

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
 * @param {string} currentStatus - Current stove status description
 * @param {number} currentPowerLevel - Current stove power level (1-5)
 * @param {boolean} semiManual - Whether scheduler is in semi-manual mode
 * @param {boolean} schedulerEnabled - Whether scheduler is enabled
 * @returns {Object} - { skipped, reason } or { adjusted, from, to, temperature, setpoint }
 */
async function runPidAutomationIfEnabled(currentStatus: string, currentPowerLevel: number, semiManual: boolean, schedulerEnabled: boolean, scheduledPower: number): Promise<any> {
  const pidBoostPath = getEnvironmentPath('pidAutomation/boost');

  try {
    // Skip if stove is not in WORK state (not during START or other states)
    if (!currentStatus.includes('WORK')) {
      await adminDbSet(pidBoostPath, { active: false });
      return { skipped: true, reason: 'stove_not_in_work' };
    }

    // Skip if not in automatic mode (semi-manual or manual)
    if (semiManual || !schedulerEnabled) {
      await adminDbSet(pidBoostPath, { active: false });
      return { skipped: true, reason: 'not_auto_mode' };
    }

    // Get admin user ID for single-user system
    const adminUserId = process.env.ADMIN_USER_ID;
    if (!adminUserId) {
      await adminDbSet(pidBoostPath, { active: false });
      return { skipped: true, reason: 'no_admin_user' };
    }

    // Read PID config from Firebase
    const pidConfig = await adminDbGet(`users/${adminUserId}/pidAutomation`) as any;
    if (!pidConfig || !pidConfig.enabled) {
      await adminDbSet(pidBoostPath, { active: false });
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

    // Log tuning data for analysis
    try {
      await logPidTuningEntry(adminUserId, {
        roomTemp: measured,
        powerLevel: currentPowerLevel,
        setpoint: setpoint,
        pidOutput: targetPower,
        error: setpoint - measured,
        integral: newState.integral,
        derivative: newState.prevError, // prevError represents derivative term
        roomId: targetRoomId,
        roomName: targetRoom.name,
      });
    } catch (logError) {
      // Don't fail PID automation if logging fails
      console.error('Failed to log PID tuning data:', logError instanceof Error ? logError.message : String(logError));
    }

    // Cleanup old logs once per day (check if last cleanup was >24h ago)
    const lastCleanup = pidState?.lastCleanup ?? 0;
    if (now - lastCleanup > 24 * 60 * 60 * 1000) {
      cleanupOldLogs(adminUserId).catch(err =>
        console.error('Failed to cleanup old PID logs:', err)
      );
      // Update lastCleanup timestamp in pidState (will be saved next run)
      await adminDbSet(`${pidStatePath}/lastCleanup`, now);
    }

    // Check if power level needs adjustment
    if (targetPower !== currentPowerLevel) {

      // Apply new power level
      await setPowerLevel(targetPower as any);
      await updateStoveState({ powerLevel: targetPower, source: 'pid_automation' as any });

      // Analytics: log PID-initiated power change (fire-and-forget, no consent needed)
      logAnalyticsEvent({
        eventType: 'power_change',
        powerLevel: targetPower,
        source: 'automation',
      }).catch(() => {});

      // Save boost state: PID is overriding scheduled power
      await adminDbSet(pidBoostPath, {
        active: true,
        powerLevel: targetPower,
        scheduledPower,
        appliedAt: now,
      });

      return {
        adjusted: true,
        from: currentPowerLevel,
        to: targetPower,
        temperature: measured,
        setpoint: setpoint,
        roomName: targetRoom.name,
      };
    }

    // No change needed — if PID agrees with schedule, clear boost
    if (targetPower === scheduledPower) {
      await adminDbSet(pidBoostPath, { active: false });
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

  await adminDbSet('cronHealth/lastCall', cronHealthTimestamp);

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
    }
  }).catch(err => console.error('❌ Errore calibrazione:', err));

  // Weather refresh every 30 minutes (async, don't wait)
  refreshWeatherIfNeeded().then((result) => {
    if (result.refreshed) {
    }
  }).catch(err => console.error('❌ Errore weather refresh:', err.message));

  // Token cleanup every 7 days (async, don't wait)
  cleanupTokensIfNeeded().then((result) => {
    if (result.cleaned) {
    }
  }).catch(err => console.error('❌ Errore token cleanup:', err.message));

  // Proactive Hue token refresh (async, don't wait)
  // Refreshes token if expiring within 24 hours to avoid manual reconnection
  proactiveTokenRefresh().then((result) => {
    if (result.refreshed) {
    }
  }).catch(err => console.error('❌ Hue token refresh error:', err.message));

  // Track maintenance hours
  const maintenanceTrack = await trackUsageHours(currentStatus);
  if (maintenanceTrack.tracked) {

    if (maintenanceTrack.notificationData) {
      await sendMaintenanceNotificationIfNeeded(maintenanceTrack.notificationData as any);
    }
  }

  // Continuous stove sync enforcement - verify actual Netatmo setpoints, not just Firebase stoveMode
  // This handles both state mismatches AND setpoint expiration (8-hour manual setpoints)
  try {
    const enforcementResult = await enforceStoveSyncSetpoints(isOn) as any;
    if (enforcementResult.enforced || enforcementResult.synced) {
      if (enforcementResult.action === 'setpoint_enforcement') {
      } else {
      }
    } else {
    }
  } catch (syncError) {
    console.error('❌ Stove sync enforcement error:', syncError instanceof Error ? syncError.message : String(syncError));
  }

  let changeApplied = false;

  if (active) {
    if (!isOn) {
      // Safety check - skip ignition if status fetch failed
      if (statusFetchFailed) {
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

    // Read PID boost state from Firebase
    const pidBoostPath = getEnvironmentPath('pidAutomation/boost');
    const pidBoost = await adminDbGet(pidBoostPath) as { active?: boolean; powerLevel?: number } | null;
    const pidBoostActive = !!(pidBoost?.active && pidBoost?.powerLevel);

    // Handle power/fan level changes (from schedule)
    // Skip power change if PID boost is active — PID manages power
    const levelsChanged = await handleLevelChanges(active, currentPowerLevel, currentFanLevel, pidBoostActive);
    changeApplied = changeApplied || levelsChanged;

    // When boost is active, stove is at PID-set power (currentPowerLevel from fetch).
    // When no boost, scheduler just applied active.power.
    const effectivePower = pidBoostActive ? currentPowerLevel : active.power;

    // Run PID automation if enabled (awaited to ensure power change completes in serverless)
    // This may override the scheduled power level based on temperature feedback
    const pidResult = await runPidAutomationIfEnabled(
      currentStatus,
      effectivePower,
      modeData.semiManual,
      schedulerEnabled,
      active.power   // scheduledPower — always from schedule
    );

  } else {
    // Clear PID boost when no active schedule
    const pidBoostPath = getEnvironmentPath('pidAutomation/boost');
    await adminDbSet(pidBoostPath, { active: false });

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
