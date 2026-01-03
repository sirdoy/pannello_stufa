/**
 * Multi-Schedule Service (Read-Only Operations)
 *
 * Handles reading multiple schedule configurations from Firebase.
 * All write operations go through API routes (Admin SDK server-side).
 *
 * Firebase Structure:
 * /schedules-v2
 *   /schedules
 *     /{scheduleId}
 *       name: string
 *       enabled: boolean
 *       slots: { Lunedì: [...], Martedì: [...], ... }
 *       createdAt: ISO timestamp
 *       updatedAt: ISO timestamp
 *   /activeScheduleId: string
 *   /mode: { enabled, semiManual, ... }
 */

import { ref, get, onValue } from 'firebase/database';
import { db } from './firebase';

/**
 * Get all schedules (metadata only, no slots)
 * @returns {Promise<Array>} Array of schedule metadata
 */
export async function getAllSchedules() {
  try {
    const snapshot = await get(ref(db, 'schedules-v2/schedules'));
    if (!snapshot.exists()) {
      return [];
    }

    const schedulesData = snapshot.val();
    const schedules = Object.entries(schedulesData).map(([id, data]) => ({
      id,
      name: data.name,
      enabled: data.enabled,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      intervalCount: calculateTotalIntervals(data.slots)
    }));

    // Sort by createdAt (oldest first)
    return schedules.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  } catch (error) {
    console.error('Error fetching all schedules:', error);
    return [];
  }
}

/**
 * Get specific schedule by ID (includes full slots data)
 * @param {string} scheduleId - Schedule ID
 * @returns {Promise<Object|null>} Schedule object or null
 */
export async function getScheduleById(scheduleId) {
  try {
    const snapshot = await get(ref(db, `schedules-v2/schedules/${scheduleId}`));
    if (!snapshot.exists()) {
      return null;
    }

    return {
      id: scheduleId,
      ...snapshot.val()
    };
  } catch (error) {
    console.error(`Error fetching schedule ${scheduleId}:`, error);
    return null;
  }
}

/**
 * Get active schedule ID
 * @returns {Promise<string|null>} Active schedule ID or null
 */
export async function getActiveScheduleId() {
  try {
    const snapshot = await get(ref(db, 'schedules-v2/activeScheduleId'));
    return snapshot.exists() ? snapshot.val() : null;
  } catch (error) {
    console.error('Error fetching active schedule ID:', error);
    return null;
  }
}

/**
 * Get active schedule (full data with slots)
 * @returns {Promise<Object|null>} Active schedule object or null
 */
export async function getActiveSchedule() {
  try {
    const activeId = await getActiveScheduleId();
    if (!activeId) {
      return null;
    }

    return await getScheduleById(activeId);
  } catch (error) {
    console.error('Error fetching active schedule:', error);
    return null;
  }
}

/**
 * Subscribe to active schedule ID changes
 * @param {Function} callback - Called with new active schedule ID
 * @returns {Function} Unsubscribe function
 */
export function subscribeToActiveScheduleId(callback) {
  const activeIdRef = ref(db, 'schedules-v2/activeScheduleId');
  return onValue(activeIdRef, (snapshot) => {
    const activeId = snapshot.exists() ? snapshot.val() : null;
    callback(activeId);
  });
}

/**
 * Subscribe to specific schedule changes
 * @param {string} scheduleId - Schedule ID to watch
 * @param {Function} callback - Called with updated schedule data
 * @returns {Function} Unsubscribe function
 */
export function subscribeToSchedule(scheduleId, callback) {
  const scheduleRef = ref(db, `schedules-v2/schedules/${scheduleId}`);
  return onValue(scheduleRef, (snapshot) => {
    const data = snapshot.exists() ? { id: scheduleId, ...snapshot.val() } : null;
    callback(data);
  });
}

/**
 * Subscribe to all schedules changes (metadata only)
 * @param {Function} callback - Called with array of schedule metadata
 * @returns {Function} Unsubscribe function
 */
export function subscribeToAllSchedules(callback) {
  const schedulesRef = ref(db, 'schedules-v2/schedules');
  return onValue(schedulesRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }

    const schedulesData = snapshot.val();
    const schedules = Object.entries(schedulesData).map(([id, data]) => ({
      id,
      name: data.name,
      enabled: data.enabled,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      intervalCount: calculateTotalIntervals(data.slots)
    }));

    // Sort by createdAt
    const sorted = schedules.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    callback(sorted);
  });
}

/**
 * Helper: Calculate total intervals across all days
 * @param {Object} slots - Slots object with days as keys
 * @returns {number} Total interval count
 */
function calculateTotalIntervals(slots) {
  if (!slots) return 0;
  return Object.values(slots).reduce((total, dayIntervals) => {
    return total + (Array.isArray(dayIntervals) ? dayIntervals.length : 0);
  }, 0);
}
