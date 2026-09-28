/**
 * Schedules API Client (browser).
 *
 * Named schedules on the Pi scheduler (workspace ROADMAP D2), through the Next
 * proxy routes. Ids are numeric on the backend and strings in the UI.
 */
import { API, apiFetch, fetchSchedule, fetchScheduleList, secondsToIso, toWeekly } from './backendScheduler';
import type { ScheduleSummary } from '@/types/thermorossiScheduler';

/** Schedule metadata */
export interface ScheduleMetadata {
  id: string;
  name: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  intervalCount?: number;
}

/** Schedule with full data */
export interface Schedule extends ScheduleMetadata {
  slots: Record<string, unknown[]>;
}

/** Response of getAllSchedules */
interface GetSchedulesResponse {
  schedules: ScheduleMetadata[];
  activeScheduleId: string;
}

function toMetadata(s: ScheduleSummary): ScheduleMetadata {
  return {
    id: String(s.id),
    name: s.name,
    enabled: s.enabled,
    createdAt: secondsToIso(s.created_at) ?? '',
    updatedAt: secondsToIso(s.updated_at) ?? '',
    intervalCount: s.interval_count,
  };
}

async function toSchedule(id: number): Promise<Schedule> {
  const detail = await fetchSchedule(id);
  return { ...toMetadata(detail), slots: toWeekly(detail) };
}

/**
 * Get all schedules (metadata only), oldest first
 */
export async function getAllSchedules(): Promise<GetSchedulesResponse> {
  const { schedules, active_schedule_id: activeId } = await fetchScheduleList();
  return {
    schedules: [...schedules].sort((a, b) => a.created_at - b.created_at).map(toMetadata),
    activeScheduleId: activeId === null ? '' : String(activeId),
  };
}

/**
 * Create new schedule (empty, or a copy of copyFromId)
 */
export async function createSchedule(name: string, copyFromId: string | null = null): Promise<Schedule> {
  const created = await apiFetch<ScheduleSummary>(`${API}/schedules`, {
    method: 'POST',
    body: JSON.stringify(copyFromId ? { name, copy_from_id: Number(copyFromId) } : { name }),
  });
  return toSchedule(created.id);
}

/**
 * Update schedule name / enabled
 */
export async function updateSchedule(scheduleId: string, updates: Partial<Schedule>): Promise<Schedule> {
  const body: { name?: string; enabled?: boolean } = {};
  if (updates.name !== undefined) body.name = updates.name;
  if (updates.enabled !== undefined) body.enabled = updates.enabled;
  await apiFetch(`${API}/schedules/${scheduleId}`, { method: 'PATCH', body: JSON.stringify(body) });
  return toSchedule(Number(scheduleId));
}

/**
 * Delete schedule (the backend refuses the active or the last one)
 */
export async function deleteSchedule(scheduleId: string): Promise<{ success: boolean }> {
  await apiFetch(`${API}/schedules/${scheduleId}`, { method: 'DELETE' });
  return { success: true };
}

/**
 * Set active schedule
 */
export async function setActiveSchedule(scheduleId: string): Promise<{ success: boolean }> {
  await apiFetch(`${API}/schedules/${scheduleId}/active`, { method: 'PUT' });
  return { success: true };
}
