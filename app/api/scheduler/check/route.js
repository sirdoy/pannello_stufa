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
import { adminDbGet, adminDbSet, sendNotificationToUser } from '@/lib/firebaseAdmin';
import { canIgnite, trackUsageHours } from '@/lib/maintenanceServiceAdmin';
import { getEnvironmentPath } from '@/lib/environmentHelper';
import { NETATMO_ROUTES } from '@/lib/routes';
import {
  shouldSendSchedulerNotification,
  shouldSendMaintenanceNotification,
} from '@/lib/notificationPreferencesService';
import {
  triggerStoveStatusWorkServer,
  triggerStoveUnexpectedOffServer,
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
import { syncLivingRoomWithStove, getStoveSyncConfig } from '@/lib/netatmoStoveSync';

export const dynamic = 'force-dynamic';

/**
 * Timeout for internal API calls (8 seconds)
 */
const INTERNAL_API_TIMEOUT = 8000;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

async function fetchWithTimeout(url, options = {}, timeout = INTERNAL_API_TIMEOUT) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('INTERNAL_API_TIMEOUT');
    }
    throw error;
  }
}

async function sendSchedulerNotification(action, details = '') {
  try {
    const adminUserId = process.env.ADMIN_USER_ID;

    if (!adminUserId) {
      console.log('⚠️ ADMIN_USER_ID non configurato - notifiche scheduler disabilitate');
      return;
    }

    const actionType = action === 'IGNITE' ? 'ignition' : 'shutdown';
    const shouldSend = await shouldSendSchedulerNotification(adminUserId, actionType);

    if (!shouldSend) {
      console.log(`⏭️ Scheduler notification skipped (user preferences): ${action}`);
      return;
    }

    const emoji = action === 'IGNITE' ? '🔥' : action === 'SHUTDOWN' ? '🌙' : '⚙️';
    const actionText = action === 'IGNITE' ? 'Accensione' :
                       action === 'SHUTDOWN' ? 'Spegnimento' :
                       action === 'POWER_CHANGE' ? 'Cambio potenza' :
                       action === 'FAN_CHANGE' ? 'Cambio ventola' : 'Modifica';

    const notification = {
      title: `${emoji} ${actionText} Automatica`,
      body: details || `La stufa è stata ${action === 'IGNITE' ? 'accesa' : 'spenta'} automaticamente`,
      icon: '/icons/icon-192.png',
      priority: 'normal',
      data: {
        type: 'scheduler_action',
        action,
        url: '/stove/scheduler',
      },
    };

    await sendNotificationToUser(adminUserId, notification);
    console.log(`✅ Notifica scheduler inviata: ${action}`);

  } catch (error) {
    console.error('❌ Errore invio notifica scheduler:', error);
  }
}

async function calibrateValvesIfNeeded(baseUrl) {
  try {
    const calibrationPath = getEnvironmentPath('netatmo/lastAutoCalibration');
    const lastCalibration = await adminDbGet(calibrationPath);

    const now = Date.now();
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

    if (lastCalibration && (now - lastCalibration) < TWENTY_FOUR_HOURS) {
      return {
        calibrated: false,
        reason: 'too_soon',
        nextCalibration: new Date(lastCalibration + TWENTY_FOUR_HOURS).toISOString(),
      };
    }

    console.log('🔧 Avvio calibrazione automatica giornaliera valvole Netatmo...');

    const response = await fetchWithTimeout(`${baseUrl}${NETATMO_ROUTES.calibrate}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      console.error('❌ Calibrazione automatica fallita:', data.error || response.statusText);
      return {
        calibrated: false,
        reason: 'error',
        error: data.error || response.statusText,
      };
    }

    await adminDbSet(calibrationPath, now);
    console.log('✅ Calibrazione automatica giornaliera valvole completata');

    return {
      calibrated: true,
      timestamp: now,
      nextCalibration: new Date(now + TWENTY_FOUR_HOURS).toISOString(),
    };

  } catch (error) {
    console.error('❌ Errore calibrazione automatica valvole:', error);
    return {
      calibrated: false,
      reason: 'exception',
      error: error.message,
    };
  }
}

async function sendMaintenanceNotificationIfNeeded(notificationData) {
  const { notificationLevel, percentage, remainingHours } = notificationData;

  let emoji, urgency, body, priority;

  if (notificationLevel >= 100) {
    emoji = '🚨';
    urgency = 'URGENTE';
    body = 'Manutenzione richiesta! L\'accensione è bloccata fino alla pulizia.';
    priority = 'high';
  } else if (notificationLevel >= 90) {
    emoji = '⚠️';
    urgency = 'Attenzione';
    body = `Solo ${remainingHours.toFixed(1)}h rimanenti prima della pulizia richiesta`;
    priority = 'high';
  } else {
    emoji = 'ℹ️';
    urgency = 'Promemoria';
    body = `${remainingHours.toFixed(1)}h rimanenti prima della manutenzione (${percentage.toFixed(0)}%)`;
    priority = 'normal';
  }

  const notification = {
    title: `${emoji} ${urgency} Manutenzione`,
    body,
    icon: '/icons/icon-192.png',
    priority,
    data: {
      type: 'maintenance',
      percentage: String(percentage),
      remainingHours: String(remainingHours),
      url: '/stove/maintenance',
    },
  };

  const adminUserId = process.env.ADMIN_USER_ID;
  if (adminUserId) {
    try {
      const shouldSend = await shouldSendMaintenanceNotification(adminUserId, notificationLevel);

      if (shouldSend) {
        await sendNotificationToUser(adminUserId, notification);
        console.log(`✅ Notifica manutenzione inviata: ${notificationLevel}%`);
      } else {
        console.log(`⏭️ Maintenance notification skipped (user preferences): ${notificationLevel}%`);
      }
    } catch (error) {
      console.error('❌ Errore invio notifica manutenzione:', error);
    }
  }
}

/**
 * Send stove status WORK notification if conditions are met
 * - Sends when stove enters WORK state
 * - Prevents spam by checking if already notified in last 30 minutes
 */
async function sendStoveStatusWorkNotification(currentStatus) {
  const adminUserId = process.env.ADMIN_USER_ID;
  if (!adminUserId) return;

  // Only notify when status is WORK (not START, which is transitional)
  if (!currentStatus.includes('WORK')) return;

  try {
    // Check if we already notified recently (30 min cooldown)
    const lastNotifyPath = getEnvironmentPath('scheduler/lastWorkNotification');
    const lastNotify = await adminDbGet(lastNotifyPath);
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
    console.error('❌ Errore invio notifica stove_status_work:', error.message);
  }
}

/**
 * Check for unexpected stove shutdown and send notification
 * - Detects when stove goes OFF during an active schedule interval
 * - Only triggers if scheduler previously ignited during this interval
 */
async function checkAndNotifyUnexpectedOff(active, isOn, statusFetchFailed) {
  const adminUserId = process.env.ADMIN_USER_ID;
  if (!adminUserId) return;

  // Skip if no active schedule or stove is on or status fetch failed
  if (!active || isOn || statusFetchFailed) return;

  try {
    // Check if we ignited during this schedule interval
    const ignitionTrackPath = getEnvironmentPath('scheduler/lastIgnitionInterval');
    const lastIgnition = await adminDbGet(ignitionTrackPath);

    if (!lastIgnition) return; // No previous ignition tracked

    // Check if the last ignition was for the current interval
    const currentInterval = `${active.start}-${active.end}`;
    if (lastIgnition.interval !== currentInterval) return; // Different interval

    // Check if we already notified for this unexpected off (1 hour cooldown)
    const unexpectedOffPath = getEnvironmentPath('scheduler/lastUnexpectedOffNotification');
    const lastUnexpectedNotify = await adminDbGet(unexpectedOffPath);
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
    console.error('❌ Errore invio notifica stove_unexpected_off:', error.message);
  }
}

/**
 * Track ignition for unexpected off detection
 */
async function trackIgnitionForInterval(active) {
  if (!active) return;

  try {
    const ignitionTrackPath = getEnvironmentPath('scheduler/lastIgnitionInterval');
    await adminDbSet(ignitionTrackPath, {
      interval: `${active.start}-${active.end}`,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('❌ Errore tracking ignition interval:', error.message);
  }
}

async function fetchStoveData() {
  let currentStatus = 'unknown';
  let isOn = false;
  let currentFanLevel = 3;
  let currentPowerLevel = 2;
  let statusFetchFailed = false;

  try {
    const [statusData, fanData, powerData] = await Promise.all([
      getStoveStatus().catch(err => {
        console.error('❌ Status fetch failed:', err.message);
        return null;
      }),
      getFanLevel().catch(err => {
        console.error('❌ Fan fetch failed:', err.message);
        return null;
      }),
      getPowerLevel().catch(err => {
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
    console.error('❌ Critical error fetching stove data:', error.message);
    statusFetchFailed = true;
  }

  return { currentStatus, isOn, currentFanLevel, currentPowerLevel, statusFetchFailed };
}

async function handleIgnition(active, ora) {
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
    console.error('❌ Confirmation status fetch failed:', confirmError.message);
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

    syncLivingRoomWithStove(true).then((result) => {
      if (result.synced) {
        console.log(`✅ Netatmo stove sync: ${result.roomNames || 'Rooms'} set to ${result.temperature}°C`);
      }
    }).catch(err => console.error('❌ Netatmo stove sync error:', err));

    return { success: true };
  } catch (error) {
    console.error('❌ Failed to ignite stove:', error.message);
    return { success: false, error: error.message };
  }
}

async function handleShutdown(ora) {
  try {
    await shutdownStove();

    await updateStoveState({
      status: 'STANDBY',
      statusDescription: 'Spegnimento automatico',
      source: 'scheduler',
    });

    await sendSchedulerNotification('SHUTDOWN', `Stufa spenta automaticamente alle ${ora}`);

    syncLivingRoomWithStove(false).then((result) => {
      if (result.synced) {
        console.log(`✅ Netatmo stove sync: ${result.roomNames || 'Rooms'} returned to schedule`);
      }
    }).catch(err => console.error('❌ Netatmo stove sync error:', err));

    return { success: true };
  } catch (error) {
    console.error('❌ Failed to shutdown stove:', error.message);
    return { success: false, error: error.message };
  }
}

async function handleLevelChanges(active, currentPowerLevel, currentFanLevel) {
  let changeApplied = false;

  if (currentPowerLevel !== active.power) {
    try {
      await setPowerLevel(active.power);
      await updateStoveState({ powerLevel: active.power, source: 'scheduler' });
      changeApplied = true;
    } catch (error) {
      console.error('❌ Failed to set power:', error.message);
    }
  }

  if (currentFanLevel !== active.fan) {
    try {
      await setFanLevel(active.fan);
      await updateStoveState({ fanLevel: active.fan, source: 'scheduler' });
      changeApplied = true;
    } catch (error) {
      console.error('❌ Failed to set fan:', error.message);
    }
  }

  return changeApplied;
}

// =============================================================================
// MAIN ROUTE HANDLER
// =============================================================================

/**
 * GET /api/scheduler/check
 * Main cron handler for scheduler automation
 * Protected: Requires CRON_SECRET
 */
export const GET = withCronSecret(async (request) => {
  // Save cron health timestamp
  const cronHealthTimestamp = new Date().toISOString();
  console.log(`🔄 Tentativo salvataggio Firebase cronHealth/lastCall: ${cronHealthTimestamp}`);

  await adminDbSet('cronHealth/lastCall', cronHealthTimestamp);
  console.log(`✅ Cron health updated: ${cronHealthTimestamp}`);

  // Check if scheduler mode is enabled
  const modeData = (await adminDbGet('schedules-v2/mode')) || { enabled: false, semiManual: false };
  const schedulerEnabled = modeData.enabled;

  if (!schedulerEnabled) {
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
  const activeScheduleId = await adminDbGet('schedules-v2/activeScheduleId') || 'default';
  const intervals = await adminDbGet(`schedules-v2/schedules/${activeScheduleId}/slots/${giorno}`);

  if (!intervals) {
    return success({ message: 'Nessuno scheduler', giorno, ora });
  }

  const active = intervals.find(({ start, end }) => {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const startMin = sh * 60 + sm;
    const endMin = eh * 60 + em;
    return currentMinutes >= startMin && currentMinutes < endMin;
  });

  const baseUrl = `${request.nextUrl.protocol}//${request.headers.get('host')}`;

  // Fetch stove data in parallel
  const { currentStatus, isOn, currentFanLevel, currentPowerLevel, statusFetchFailed } = await fetchStoveData();

  // Send stove status WORK notification if conditions are met (async, don't block)
  sendStoveStatusWorkNotification(currentStatus).catch(err =>
    console.error('❌ Errore notifica stove_status_work:', err.message)
  );

  // Check for unexpected off and notify (async, don't block)
  checkAndNotifyUnexpectedOff(active, isOn, statusFetchFailed).catch(err =>
    console.error('❌ Errore check unexpected off:', err.message)
  );

  // Auto-calibrate Netatmo valves (async, don't wait)
  calibrateValvesIfNeeded(baseUrl).then((result) => {
    if (result.calibrated) {
      console.log(`✅ Calibrazione automatica completata - prossima: ${result.nextCalibration}`);
    }
  }).catch(err => console.error('❌ Errore calibrazione:', err));

  // Track maintenance hours
  const maintenanceTrack = await trackUsageHours(currentStatus);
  if (maintenanceTrack.tracked) {
    console.log(`✅ Maintenance tracked: +${maintenanceTrack.elapsedMinutes}min → ${maintenanceTrack.newCurrentHours.toFixed(2)}h total`);

    if (maintenanceTrack.notificationData) {
      await sendMaintenanceNotificationIfNeeded(maintenanceTrack.notificationData);
    }
  }

  // Continuous stove sync check - enforce valve temperatures based on stove state
  // This runs on every scheduler check, not just on state changes
  try {
    const stoveSyncConfig = await getStoveSyncConfig();
    if (stoveSyncConfig.enabled && stoveSyncConfig.rooms?.length > 0) {
      // If stove is ON but stoveMode is false, or stove is OFF but stoveMode is true
      // → sync to correct state
      if (isOn !== stoveSyncConfig.stoveMode) {
        console.log(`🔥 Stove sync enforcement: stove ${isOn ? 'ON' : 'OFF'}, stoveMode was ${stoveSyncConfig.stoveMode}`);
        const syncResult = await syncLivingRoomWithStove(isOn);
        if (syncResult.synced) {
          console.log(`✅ Stove sync enforced: ${syncResult.roomNames} ${isOn ? `set to ${syncResult.temperature}°C` : 'returned to schedule'}`);
        }
      }
    }
  } catch (syncError) {
    console.error('❌ Stove sync enforcement error:', syncError.message);
  }

  let changeApplied = false;

  if (active) {
    if (!isOn) {
      // Safety check - skip ignition if status fetch failed
      if (statusFetchFailed) {
        console.log('⚠️ Accensione schedulata saltata - stato stufa sconosciuto (safety)');
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

    // Handle power/fan level changes
    const levelsChanged = await handleLevelChanges(active, currentPowerLevel, currentFanLevel);
    changeApplied = changeApplied || levelsChanged;

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

  return success({
    status: active ? 'ACCESA' : 'SPENTA',
    schedulerEnabled: true,
    giorno,
    ora,
    activeSchedule: active || null,
  });
}, 'Scheduler/Check');
