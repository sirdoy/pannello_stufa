/**
 * Thermorossi scheduler + maintenance proxy (server-only).
 *
 * Thin wrappers over haClient for the backend endpoints documented in
 * ../docs/api/scheduler.md. The schedule lives on the Pi (workspace ROADMAP D2).
 */

import { haDelete, haGet, haPatch, haPost, haPut } from '@/lib/haClient';
import type {
  ExecutionLogResponse,
  MaintenanceCleanResponse,
  MaintenanceState,
  NextActionResponse,
  ScheduleDetail,
  ScheduleListResponse,
  ScheduleSlot,
  SchedulerEngineHealth,
  SchedulerMode,
  ScheduleSummary,
} from '@/types/thermorossiScheduler';

const BASE = '/api/v1/thermorossi';

// Schedules ------------------------------------------------------------------

export const listSchedules = () => haGet<ScheduleListResponse>(`${BASE}/schedules`);

export const createSchedule = (body: { name?: string; copy_from_id?: number }) =>
  haPost<ScheduleSummary>(`${BASE}/schedules`, body);

export const getSchedule = (id: number) => haGet<ScheduleDetail>(`${BASE}/schedules/${id}`);

export const patchSchedule = (id: number, body: { name?: string; enabled?: boolean }) =>
  haPatch<ScheduleSummary>(`${BASE}/schedules/${id}`, body);

export const deleteSchedule = (id: number) => haDelete(`${BASE}/schedules/${id}`);

export const activateSchedule = (id: number) =>
  haPut<{ active_schedule_id: number }>(`${BASE}/schedules/${id}/active`, {});

export const replaceDaySlots = (id: number, day: number, slots: ScheduleSlot[]) =>
  haPut<{ schedule_id: number; day: number; slot_count: number }>(
    `${BASE}/schedules/${id}/days/${day}/slots`,
    { slots }
  );

export const replaceWeek = (id: number, days: Record<string, ScheduleSlot[]>) =>
  haPut<ScheduleDetail>(`${BASE}/schedules/${id}/week`, { days });

// Mode / override / next action / log -----------------------------------------

export const getMode = () => haGet<SchedulerMode>(`${BASE}/scheduler/mode`);

/** Engine heartbeat (ROADMAP V8). */
export const getEngineHealth = () => haGet<SchedulerEngineHealth>(`${BASE}/scheduler/engine`);

export const setMode = (enabled: boolean) =>
  haPost<SchedulerMode>(`${BASE}/scheduler/mode`, { enabled });

export const setOverride = (returnToAutoAt: number) =>
  haPost<SchedulerMode>(`${BASE}/scheduler/override`, { return_to_auto_at: returnToAutoAt });

/** haDelete discards the response body, so re-read the mode after clearing. */
export const clearOverride = async (): Promise<SchedulerMode> => {
  await haDelete(`${BASE}/scheduler/override`);
  return getMode();
};

export const getNextAction = () => haGet<NextActionResponse>(`${BASE}/scheduler/next-action`);

export const getExecutionLog = (query: string) =>
  haGet<ExecutionLogResponse>(`${BASE}/scheduler/log${query ? `?${query}` : ''}`);

// Maintenance ----------------------------------------------------------------

export const getMaintenance = () => haGet<MaintenanceState>(`${BASE}/maintenance`);

export const patchMaintenance = (body: {
  target_hours?: number;
  current_hours?: number;
  last_cleaned_at?: number;
}) => haPatch<MaintenanceState>(`${BASE}/maintenance`, body);

export const confirmMaintenanceCleaning = () =>
  haPost<MaintenanceCleanResponse>(`${BASE}/maintenance/clean`, {});
