/**
 * Stove maintenance (browser).
 *
 * Since workspace ROADMAP D2.3 the working-hours counter lives on the Pi, which also
 * blocks ignition while cleaning is due. These functions read/write it through the
 * Next routes and keep the UI shapes of the Firebase era (ISO dates, camelCase).
 */
import { API, apiFetch, secondsToIso } from '@/lib/scheduler/backendScheduler';
import type { MaintenanceState } from '@/types/thermorossiScheduler';

/** Maintenance data (UI shape) */
export interface MaintenanceData {
  currentHours: number;
  targetHours: number;
  lastCleanedAt: string | null;
  needsCleaning: boolean;
  lastUpdatedAt: string | null;
  lastNotificationLevel?: number;
}

/** Maintenance status summary */
export interface MaintenanceStatus extends MaintenanceData {
  percentage: number;
  remainingHours: number;
  isNearLimit: boolean;
}

export function toMaintenanceData(state: MaintenanceState): MaintenanceData {
  return {
    currentHours: state.current_hours,
    targetHours: state.target_hours,
    lastCleanedAt: secondsToIso(state.last_cleaned_at) ?? null,
    needsCleaning: state.needs_cleaning,
    lastUpdatedAt: secondsToIso(state.updated_at) ?? null,
    lastNotificationLevel: state.last_notification_level,
  };
}

/**
 * Get maintenance data from the Pi
 */
export async function getMaintenanceData(): Promise<MaintenanceData> {
  return toMaintenanceData(await apiFetch<MaintenanceState>(`${API}/maintenance`));
}

/**
 * Update target hours (from config page)
 */
export async function updateTargetHours(hours: number | string): Promise<boolean> {
  await apiFetch(`${API}/maintenance`, {
    method: 'PATCH',
    body: JSON.stringify({ target_hours: Number(hours) }),
  });
  return true;
}

/**
 * Confirm cleaning: resets the counter on the Pi and logs the action
 * (the route keeps the activity log entry).
 */
export async function confirmCleaning(_user?: unknown): Promise<boolean> {
  await apiFetch('/api/maintenance/confirm-cleaning', { method: 'POST' });
  return true;
}

/**
 * Check if stove can be ignited (maintenance check)
 */
export async function canIgnite(): Promise<boolean> {
  try {
    return !(await getMaintenanceData()).needsCleaning;
  } catch (error) {
    console.error('Error checking if can ignite:', error);
    return true; // The Pi enforces the block anyway (409 on ignite)
  }
}

/**
 * Get maintenance status summary
 */
export async function getMaintenanceStatus(): Promise<MaintenanceStatus> {
  const data = await getMaintenanceData();
  const percentage = data.targetHours > 0 ? (data.currentHours / data.targetHours) * 100 : 0;
  return {
    ...data,
    percentage: Math.min(100, percentage),
    remainingHours: Math.max(0, data.targetHours - data.currentHours),
    isNearLimit: percentage >= 80 && !data.needsCleaning, // Warning at 80%
  };
}
