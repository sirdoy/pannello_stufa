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

import { ref, get, onValue, Unsubscribe } from 'firebase/database';
import { db } from './firebase';

/** Schedule metadata */
export interface ScheduleMetadata {
  id: string;
  name: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  intervalCount: number;
}

/** Full schedule with slots */
export interface Schedule {
  id: string;
  name: string;
  enabled: boolean;
  slots: Record<string, unknown[]>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get all schedules (metadata only, no slots)
 */
export async function getAllSchedules(): Promise<ScheduleMetadata[]> {
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
 */
export async function getScheduleById(scheduleId: string): Promise<Schedule | null> {
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
 */
export async function getActiveScheduleId(): Promise<string | null> {
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
 */
export async function getActiveSchedule(): Promise<Schedule | null> {
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
 */
export function subscribeToActiveScheduleId(callback: (activeId: string | null) => void): Unsubscribe {
  const activeIdRef = ref(db, 'schedules-v2/activeScheduleId');
  return onValue(activeIdRef, (snapshot) => {
    const activeId = snapshot.exists() ? snapshot.val() : null;
    callback(activeId);
  });
}

/**
 * Subscribe to specific schedule changes
 */
export function subscribeToSchedule(scheduleId: string, callback: (data: Schedule | null) => void): Unsubscribe {
  const scheduleRef = ref(db, `schedules-v2/schedules/${scheduleId}`);
  return onValue(scheduleRef, (snapshot) => {
    const data = snapshot.exists() ? { id: scheduleId, ...snapshot.val() } : null;
    callback(data);
  });
}

/**
 * Subscribe to all schedules changes (metadata only)
 */
export function subscribeToAllSchedules(callback: (schedules: ScheduleMetadata[]) => void): Unsubscribe {
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
 */
function calculateTotalIntervals(slots: Record<string, unknown[]> | undefined): number {
  if (!slots) return 0;
  return Object.values(slots).reduce((total, dayIntervals) => {
    return total + (Array.isArray(dayIntervals) ? dayIntervals.length : 0);
  }, 0);
}
