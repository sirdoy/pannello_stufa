/**
 * Stove scheduler — read side (browser).
 *
 * Since workspace ROADMAP D2 the schedule lives on the Pi: these functions read it
 * through the Next proxy routes and keep the UI shapes of the Firebase era
 * (Italian day names, "HH:MM", ISO strings). Writes live in schedulerApiClient.
 */
import {
  API,
  activeScheduleId,
  apiFetch,
  fetchMode,
  fetchSchedule,
  secondsToIso,
  toWeekly,
} from './backendScheduler';
import * as writes from './schedulerApiClient';
import type { NextActionResponse } from '@/types/thermorossiScheduler';

/** Schedule interval */
export interface ScheduleInterval {
  start: string; // HH:MM format
  end: string; // HH:MM format
  power: number; // 1-5
  fan: number; // 1-6
}

/** Weekly schedule data, keyed by Italian day name ("Lunedì" … "Domenica") */
export interface WeeklySchedule {
  [day: string]: ScheduleInterval[];
}

/** Scheduler mode */
export interface SchedulerMode {
  enabled: boolean;
  semiManual?: boolean;
  semiManualActivatedAt?: string; // ISO
  returnToAutoAt?: string; // ISO
  lastUpdated?: string;
}

/** Next scheduled action */
export interface NextScheduledAction {
  timestamp: string; // ISO
  /** adjust = the next slot starts where the current one ends (level change) */
  action: 'ignite' | 'shutdown' | 'adjust';
  power?: number;
  fan?: number;
}

async function nextAction(): Promise<NextActionResponse['nextAction']> {
  const { nextAction: action } = await apiFetch<NextActionResponse>(`${API}/scheduler/next-action`);
  return action;
}

/** ISO time of the next scheduled change (slot start or end), or null. */
export const getNextScheduledChange = async (): Promise<string | null> => {
  try {
    const action = await nextAction();
    return action ? new Date(action.at * 1000).toISOString() : null;
  } catch (error) {
    console.error('Errore calcolo prossimo cambio scheduler:', error);
    return null;
  }
};

/** Next ignite/shutdown/adjust of the active schedule, or null (manual, semi-manual, no slots). */
export const getNextScheduledAction = async (): Promise<NextScheduledAction | null> => {
  try {
    const action = await nextAction();
    if (!action) return null;
    return {
      timestamp: new Date(action.at * 1000).toISOString(),
      action: action.action,
      power: action.power,
      fan: action.fan,
    };
  } catch (error) {
    console.error('Errore calcolo prossima azione scheduler:', error);
    return null;
  }
};

export const saveSchedule = async (day: string, intervals: ScheduleInterval[]): Promise<void> => {
  await writes.saveSchedule(day, intervals);
};

export const getWeeklySchedule = async (): Promise<WeeklySchedule> => {
  const detail = await fetchSchedule(await activeScheduleId());
  return toWeekly(detail);
};

export const getSchedule = async (day: string): Promise<ScheduleInterval[]> => {
  const week = await getWeeklySchedule();
  return week[day] ?? [];
};

export const setSchedulerMode = async (enabled: boolean): Promise<void> => {
  await writes.setSchedulerMode(enabled);
};

export const getSchedulerMode = async (): Promise<boolean> => {
  try {
    return (await fetchMode()).enabled;
  } catch (error) {
    console.error('Errore lettura modalità scheduler:', error);
    return false;
  }
};

export const getFullSchedulerMode = async (): Promise<SchedulerMode> => {
  const mode = await fetchMode();
  return {
    enabled: mode.enabled,
    semiManual: mode.semi_manual,
    semiManualActivatedAt: secondsToIso(mode.semi_manual_activated_at),
    returnToAutoAt: secondsToIso(mode.return_to_auto_at),
  };
};

export const setSemiManualMode = async (nextScheduledChange: string): Promise<void> => {
  await writes.setSemiManualMode(nextScheduledChange);
};

export const clearSemiManualMode = async (): Promise<void> => {
  await writes.clearSemiManualMode();
};
