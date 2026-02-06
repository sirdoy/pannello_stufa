/**
 * Coordination Orchestrator Service
 *
 * Main coordination logic that ties all coordination services together.
 * Implements the complete workflow: state check → user intent detection →
 * debounce → action execution → throttled notifications.
 *
 * This is the "brain" of stove-thermostat coordination.
 *
 * Entry point: processCoordinationCycle (called by cron every minute)
 */

import { getCoordinationPreferences } from './coordinationPreferences.js';
import { getCoordinationState, updateCoordinationState } from './coordinationState.js';
import { handleStoveStateChange } from './coordinationDebounce.js';
import { detectUserIntent } from './coordinationUserIntent.js';
import { calculatePauseUntil } from './coordinationPauseCalculator.js';
import { shouldSendCoordinationNotification, recordNotificationSent } from './coordinationNotificationThrottle.js';
import { setRoomsToBoostMode, restoreRoomSetpoints } from './netatmoStoveSync.js';
import { getValidAccessToken } from './netatmoTokenHelper.js';
import { triggerNotificationServer } from './notificationTriggersServer.js';
import NETATMO_API from './netatmoApi.js';
import { logCoordinationEvent } from './coordinationEventLogger.js';

/**
 * Coordination cycle result
 */
interface CoordinationResult {
  action: 'skipped' | 'paused' | 'debouncing' | 'applied' | 'restored' | 'no_change';
  reason: string;
  pausedUntil?: number;
  remainingMs?: number;
  delayMs?: number;
  rooms?: Array<Record<string, unknown>>;
  notificationSent?: boolean;
  [key: string]: unknown;
}

/**
 * Main coordination cycle - called by cron every minute
 *
 * Orchestrates: state check → user intent → debounce → action → notification
 */
export async function processCoordinationCycle(
  userId: string,
  stoveStatus: string,
  homeId: string
): Promise<CoordinationResult> {
  console.log(`🔄 [Coordination] Starting cycle for ${userId}, stove: ${stoveStatus}`);

  // Step 1: Get coordination preferences
  const preferences = await getCoordinationPreferences(userId);

  if (!preferences.enabled) {
    console.log(`⏭️ [Coordination] Skipped: coordination disabled for ${userId}`);
    return {
      action: 'skipped',
      reason: 'disabled',
    };
  }

  // Step 2: Get current coordination state
  const state = await getCoordinationState();

  // Step 3: Check if automation is paused
  const now = Date.now();
  if (state.automationPaused) {
    if (state.pausedUntil && now > state.pausedUntil) {
      // Pause expired - clear it
      console.log(`✅ [Coordination] Pause expired, resuming automation`);
      await updateCoordinationState({
        automationPaused: false,
        pausedUntil: null,
        pauseReason: null,
      });
    } else {
      // Still paused
      const remainingMs = state.pausedUntil - now;
      console.log(`⏸️ [Coordination] Automation paused until ${new Date(state.pausedUntil).toISOString()}`);
      return {
        action: 'skipped',
        reason: 'paused',
        pausedUntil: state.pausedUntil,
        remainingMs,
      };
    }
  }

  // Step 4: Determine stove state (ON = WORK/MODULATION/STARTING, OFF = others)
  const stoveOn = ['WORK', 'MODULATION', 'STARTING'].includes(stoveStatus) ||
                  stoveStatus?.includes('WORK') ||
                  stoveStatus?.includes('MODULATION');

  // Step 5: Detect user intent (only if stove is ON)
  if (stoveOn) {
    const { accessToken } = await getValidAccessToken();
    if (accessToken) {
      // Build expected setpoints from state
      const expectedSetpoints = state.previousSetpoints || {};
      const roomIds = preferences.zones.filter(z => z.enabled).map(z => z.roomId);

      const intentResult = await detectUserIntent(homeId, roomIds, expectedSetpoints, accessToken);

      if (intentResult.manualChange) {
        console.log(`🚫 [Coordination] Manual change detected:`, intentResult.reason);

        // Get schedule for pause calculation
        let pauseUntil = Date.now() + (60 * 60 * 1000); // Default: 1 hour
        try {
          const schedules = await NETATMO_API.getThermSchedules(accessToken, homeId);
          const activeSchedule = schedules?.find(s => s.selected);
          if (activeSchedule) {
            const pauseResult = calculatePauseUntil(Date.now(), activeSchedule);
            pauseUntil = pauseResult.pauseUntil;
          }
        } catch (err) {
          console.error(`⚠️ [Coordination] Failed to get schedule for pause calculation:`, err);
        }

        // Update state: pause automation
        await updateCoordinationState({
          automationPaused: true,
          pausedUntil: pauseUntil,
          pauseReason: intentResult.reason,
        });

        // Send notification (if throttle allows)
        const notificationResult = await sendCoordinationNotification(userId, 'automation_paused', {
          reason: intentResult.reason,
          pausedUntil: pauseUntil,
        });

        // Log automation paused event (fire-and-forget)
        logCoordinationEvent({
          userId,
          eventType: 'automation_paused',
          stoveStatus,
          action: 'paused',
          details: {
            pausedUntil: pauseUntil,
            pauseReason: intentResult.reason,
            changes: intentResult.changes,
          },
          notificationSent: notificationResult.sent,
        }).catch(() => {});

        return {
          action: 'paused',
          reason: 'user_intent',
          pausedUntil: pauseUntil,
          changes: intentResult.changes,
        };
      }
    }
  }

  // Step 6: Handle stove state transitions
  const stoveStateChanged = stoveOn !== state.stoveOn;

  if (stoveStateChanged || state.pendingDebounce) {
    const newState = stoveOn ? 'ON' : 'OFF';

    // Create callback for debounce completion
    const callback = async () => {
      if (stoveOn) {
        // Stove ON: Apply boost
        console.log(`🔥 [Coordination] Applying setpoint boost`);
        const result = await applySetpointBoost(userId, homeId, preferences);

        if (result.success) {
          await updateCoordinationState({
            stoveOn: true,
            pendingDebounce: false,
          });

          // Send notification (if throttle allows)
          const notificationResult = await sendCoordinationNotification(userId, 'coordination_applied', {
            appliedRooms: result.appliedRooms,
          });

          // Log boost applied event (fire-and-forget)
          logCoordinationEvent({
            userId,
            eventType: 'boost_applied',
            stoveStatus,
            action: 'applied',
            details: {
              rooms: result.appliedRooms,
              boost: preferences.defaultBoost,
            },
            notificationSent: notificationResult.sent,
          }).catch(() => {});

          // Send additional notification for capped rooms
          if (result.cappedRooms.length > 0) {
            const cappedNotification = await sendCoordinationNotification(userId, 'max_setpoint_reached', {
              cappedRooms: result.cappedRooms,
            });

            // Log max setpoint capped event (fire-and-forget)
            logCoordinationEvent({
              userId,
              eventType: 'max_setpoint_capped',
              stoveStatus,
              action: 'capped',
              details: {
                rooms: result.cappedRooms.map(name => ({ roomName: name })),
                cappedAt: 30,
              },
              notificationSent: cappedNotification.sent,
            }).catch(() => {});
          }
        }
      } else {
        // Stove OFF: Restore setpoints
        console.log(`❄️ [Coordination] Restoring previous setpoints`);
        const result = await restorePreviousSetpoints(userId, homeId);

        if (result.success) {
          await updateCoordinationState({
            stoveOn: false,
            previousSetpoints: null,
          });

          // Send notification (if throttle allows)
          const notificationResult = await sendCoordinationNotification(userId, 'coordination_restored', {
            restoredRooms: result.restoredRooms,
          });

          // Log setpoints restored event (fire-and-forget)
          logCoordinationEvent({
            userId,
            eventType: 'setpoints_restored',
            stoveStatus,
            action: 'restored',
            details: {
              rooms: result.restoredRooms,
            },
            notificationSent: notificationResult.sent,
          }).catch(() => {});
        }
      }
    };

    // Handle state change with debouncing
    const debounceResult = await handleStoveStateChange(userId, newState, callback);

    if (debounceResult.action === 'timer_started') {
      return {
        action: 'debouncing',
        reason: 'stove_on_debounce',
        remainingMs: debounceResult.delayMs,
      };
    } else if (debounceResult.action === 'retry_started') {
      return {
        action: 'retry_timer',
        reason: 'early_shutoff',
        remainingMs: debounceResult.delayMs,
      };
    } else if (debounceResult.action === 'executed_immediately') {
      return {
        action: 'restored',
        reason: 'stove_off_immediate',
      };
    }
  }

  // No state change
  return {
    action: 'no_change',
    stoveOn,
  };
}

/**
 * Apply setpoint boost to configured zones
 *
 * Orchestrates boost application via netatmoStoveSync.js with state management
 *
 * @param {string} userId - User ID
 * @param {string} homeId - Netatmo home ID
 * @param {Object} preferences - User coordination preferences
 * @returns {Promise<Object>} Result:
 *   - success: boolean
 *   - appliedRooms: array of applied room info
 *   - cappedRooms: array of room names that hit 30°C cap
 *   - previousSetpoints: object mapping roomId to previous setpoint
 */
export async function applySetpointBoost(userId, homeId, preferences) {
  console.log(`🔥 [Coordination] Applying setpoint boost for ${userId}`);

  // Get access token
  const { accessToken, error } = await getValidAccessToken();
  if (error) {
    console.error(`❌ [Coordination] Auth error:`, error);
    return {
      success: false,
      error,
      appliedRooms: [],
      cappedRooms: [],
      previousSetpoints: {},
    };
  }

  // Get current state for previousSetpoints
  const state = await getCoordinationState();
  const previousSetpoints = state.previousSetpoints || {};

  // Build room list with boost amounts
  const enabledZones = preferences.zones.filter(z => z.enabled);
  const rooms = enabledZones.map(z => ({
    id: z.roomId,
    name: z.roomName,
  }));

  // Apply boost mode (zone-specific or default)
  const results = [];
  const cappedRooms = [];
  const updatedPreviousSetpoints = { ...previousSetpoints };

  for (const zone of enabledZones) {
    const boostAmount = zone.boost ?? preferences.defaultBoost;

    const result = await setRoomsToBoostMode(
      { homeId, rooms: [{ id: zone.roomId, name: zone.roomName }], accessToken },
      boostAmount,
      updatedPreviousSetpoints
    );

    if (result.success) {
      const roomInfo = result.appliedSetpoints[zone.roomId];
      if (roomInfo) {
        results.push({
          roomId: zone.roomId,
          roomName: zone.roomName,
          previous: roomInfo.previous,
          applied: roomInfo.applied,
          boost: boostAmount,
        });

        // Track capped rooms
        if (roomInfo.capped) {
          cappedRooms.push(zone.roomName);
        }
      }

      // Merge returned previousSetpoints
      Object.assign(updatedPreviousSetpoints, result.previousSetpoints);
    }
  }

  // Update state with previous setpoints
  await updateCoordinationState({
    previousSetpoints: updatedPreviousSetpoints,
  });

  console.log(`✅ [Coordination] Boost applied to ${results.length} rooms, ${cappedRooms.length} capped`);

  return {
    success: results.length > 0,
    appliedRooms: results,
    cappedRooms,
    previousSetpoints: updatedPreviousSetpoints,
  };
}

/**
 * Restore previous setpoints after coordination ends
 *
 * Orchestrates restoration via netatmoStoveSync.js with state management
 *
 * @param {string} userId - User ID
 * @param {string} homeId - Netatmo home ID
 * @returns {Promise<Object>} Result:
 *   - success: boolean
 *   - restoredRooms: array of restored room info
 */
export async function restorePreviousSetpoints(userId, homeId) {
  console.log(`❄️ [Coordination] Restoring previous setpoints for ${userId}`);

  // Get access token
  const { accessToken, error } = await getValidAccessToken();
  if (error) {
    console.error(`❌ [Coordination] Auth error:`, error);
    return {
      success: false,
      error,
      restoredRooms: [],
    };
  }

  // Get previous setpoints and zone configurations from state/preferences
  const state = await getCoordinationState();
  const preferences = await getCoordinationPreferences(userId);

  const previousSetpoints = state.previousSetpoints || {};
  const enabledZones = preferences.zones.filter(z => z.enabled);

  const rooms = enabledZones.map(z => ({
    id: z.roomId,
    name: z.roomName,
  }));

  // Restore setpoints
  const result = await restoreRoomSetpoints(
    { homeId, rooms, accessToken },
    previousSetpoints
  );

  if (result.success) {
    // Clear previous setpoints from state
    await updateCoordinationState({
      previousSetpoints: null,
    });

    console.log(`✅ [Coordination] Restored ${result.restoredRooms.length} rooms`);
  }

  return result;
}

/**
 * Send coordination notification with throttling
 *
 * Handles throttled notification sending via triggerNotificationServer
 *
 * @param {string} userId - User ID
 * @param {string} type - Notification type:
 *   - 'coordination_applied': Boost applied
 *   - 'coordination_restored': Setpoints restored
 *   - 'automation_paused': Automation paused due to user intent
 *   - 'max_setpoint_reached': Room hit 30°C cap
 * @param {Object} data - Type-specific data
 * @returns {Promise<Object>} Result:
 *   - sent: boolean
 *   - reason: string|null ('global_throttle' if blocked)
 *   - waitSeconds: number (if throttled)
 */
export async function sendCoordinationNotification(userId, type, data) {
  // Check throttle
  const throttleCheck = shouldSendCoordinationNotification(userId);

  if (!throttleCheck.allowed) {
    console.log(`⏱️ [Coordination] Notification throttled: ${type}, wait ${throttleCheck.waitSeconds}s`);

    // Log throttled notification event (fire-and-forget)
    // Note: We don't have stoveStatus here, so we'll use 'UNKNOWN'
    logCoordinationEvent({
      userId,
      eventType: 'notification_throttled',
      stoveStatus: 'UNKNOWN',
      action: 'throttled',
      details: {
        waitSeconds: throttleCheck.waitSeconds,
        intendedType: type,
      },
      notificationSent: false,
    }).catch(() => {});

    return {
      sent: false,
      reason: 'global_throttle',
      waitSeconds: throttleCheck.waitSeconds,
    };
  }

  // Build notification message (Italian)
  let title = 'Coordinamento Stufa-Termostato';
  let body = '';

  switch (type) {
    case 'coordination_applied':
      {
        const rooms = data.appliedRooms?.map(r => r.roomName).join(', ') || 'stanze';
        const boostInfo = data.appliedRooms?.[0]?.boost ? `+${data.appliedRooms[0].boost}°C` : '+N°C';
        body = `Boost ${boostInfo} applicato (${rooms})`;
      }
      break;

    case 'coordination_restored':
      {
        const rooms = data.restoredRooms?.map(r => r.roomName).join(', ') || 'stanze';
        body = `Setpoint ripristinati (${rooms})`;
      }
      break;

    case 'automation_paused':
      {
        const pauseDate = new Date(data.pausedUntil);
        const hours = pauseDate.getHours().toString().padStart(2, '0');
        const minutes = pauseDate.getMinutes().toString().padStart(2, '0');
        body = `Automazione in pausa fino alle ${hours}:${minutes}`;
      }
      break;

    case 'max_setpoint_reached':
      {
        const rooms = data.cappedRooms?.join(', ') || 'stanze';
        body = `Setpoint limitato a 30°C (${rooms})`;
      }
      break;

    default:
      body = 'Evento di coordinamento';
  }

  // Send notification using generic notification (bypasses preference check for coordination events)
  const result = await triggerNotificationServer(
    userId,
    'generic',
    {
      title,
      body,
      type: 'coordination_event',
    },
    { skipPreferenceCheck: false } // Still check preferences
  );

  if (result.success && !result.skipped) {
    // Record notification sent for throttle
    recordNotificationSent(userId);

    console.log(`📨 [Coordination] Notification sent: ${type}`);
    return {
      sent: true,
      reason: null,
    };
  } else {
    console.log(`📭 [Coordination] Notification not sent: ${result.error || result.reason}`);
    return {
      sent: false,
      reason: result.error || result.reason,
    };
  }
}

export default {
  processCoordinationCycle,
  applySetpointBoost,
  restorePreviousSetpoints,
  sendCoordinationNotification,
};
