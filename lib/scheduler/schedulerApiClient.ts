/**
 * Stove scheduler — write side (browser).
 *
 * Writes go to the scheduler on the Pi through the Next proxy routes
 * (workspace ROADMAP D2). Signatures unchanged from the Firebase era.
 */
import { API, activeScheduleId, apiFetch, dayIndex, isoToSeconds, toSlot } from './backendScheduler';

/** Schedule interval */
export interface ScheduleInterval {
  start: string;
  end: string;
  power: number;
  fan: number;
}

/** API response */
interface ApiResponse {
  success: boolean;
  error?: string;
}

const post = (path: string, body: unknown, method = 'POST') =>
  apiFetch<ApiResponse>(path, { method, body: JSON.stringify(body) });

/**
 * Save the intervals of one day (Italian name) in the active schedule.
 */
export async function saveSchedule(day: string, schedule: ScheduleInterval[]): Promise<ApiResponse> {
  const id = await activeScheduleId();
  await post(`${API}/schedules/${id}/days/${dayIndex(day)}/slots`, { slots: schedule.map(toSlot) }, 'PUT');
  return { success: true };
}

/**
 * Set scheduler mode (enabled = automatic, disabled = manual)
 */
export async function setSchedulerMode(enabled: boolean): Promise<ApiResponse> {
  await post(`${API}/scheduler/mode`, { enabled });
  return { success: true };
}

/**
 * Semi-manual override until returnToAutoAt (ISO)
 */
export async function setSemiManualMode(returnToAutoAt: string): Promise<ApiResponse> {
  await post(`${API}/scheduler/override`, { return_to_auto_at: isoToSeconds(returnToAutoAt) });
  return { success: true };
}

/**
 * Clear semi-manual mode (back to automatic)
 */
export async function clearSemiManualMode(): Promise<ApiResponse> {
  await apiFetch(`${API}/scheduler/override`, { method: 'DELETE' });
  return { success: true };
}
