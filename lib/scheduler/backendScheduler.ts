/**
 * Browser-side access to the stove scheduler on the Pi (workspace ROADMAP D2).
 *
 * Calls the Next proxy routes under /api/v1/thermorossi/{schedules,scheduler,maintenance}
 * and converts between the backend shapes (day 0..6, minutes, Unix seconds, numeric ids)
 * and the UI shapes kept from the Firebase era (Italian day names, "HH:MM", ISO strings,
 * string ids), so the scheduler UI works unchanged.
 */
import type {
  ScheduleDetail,
  ScheduleListResponse,
  ScheduleSlot,
  SchedulerMode as BackendMode,
} from '@/types/thermorossiScheduler';

export const API = '/api/v1/thermorossi';

/** Index = backend day number (0 = Monday). */
export const DAY_NAMES = [
  'Lunedì',
  'Martedì',
  'Mercoledì',
  'Giovedì',
  'Venerdì',
  'Sabato',
  'Domenica',
] as const;

export interface UiInterval {
  start: string; // HH:MM
  end: string; // HH:MM
  power: number;
  fan: number;
}

export function dayIndex(day: string): number {
  const index = DAY_NAMES.indexOf(day as (typeof DAY_NAMES)[number]);
  if (index < 0) throw new Error(`Giorno non valido: ${day}`);
  return index;
}

export function minutesToHHMM(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

export function hhmmToMinutes(value: string): number {
  const [h, m] = value.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function toSlot(interval: UiInterval): ScheduleSlot {
  return {
    start_minutes: hhmmToMinutes(interval.start),
    end_minutes: hhmmToMinutes(interval.end),
    power: interval.power,
    fan: interval.fan,
  };
}

export function toInterval(slot: ScheduleSlot): UiInterval {
  return {
    start: minutesToHHMM(slot.start_minutes),
    end: minutesToHHMM(slot.end_minutes),
    power: slot.power,
    fan: slot.fan,
  };
}

/** All 7 days, keyed by Italian name, sorted by start. */
export function toWeekly(detail: ScheduleDetail): Record<string, UiInterval[]> {
  const week: Record<string, UiInterval[]> = {};
  DAY_NAMES.forEach((name, index) => {
    const slots = detail.slots_by_day[String(index)] ?? [];
    week[name] = [...slots]
      .sort((a, b) => a.start_minutes - b.start_minutes)
      .map(toInterval);
  });
  return week;
}

export const secondsToIso = (s: number | null): string | undefined =>
  s ? new Date(s * 1000).toISOString() : undefined;

export const isoToSeconds = (iso: string): number => Math.floor(new Date(iso).getTime() / 1000);

/** fetch → JSON; throws Error(message) on non-2xx. The Next envelope adds `success`. */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  });
  if (response.status === 204) return undefined as T;
  const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    const message = body['message'] ?? body['error'] ?? `HTTP ${response.status}`;
    throw new Error(String(message));
  }
  return body as T;
}

export const fetchScheduleList = () => apiFetch<ScheduleListResponse>(`${API}/schedules`);

export const fetchSchedule = (id: number) => apiFetch<ScheduleDetail>(`${API}/schedules/${id}`);

export const fetchMode = () => apiFetch<BackendMode>(`${API}/scheduler/mode`);

/** Active schedule id, or throws when none is active. */
export async function activeScheduleId(): Promise<number> {
  const { active_schedule_id: id } = await fetchScheduleList();
  if (id === null) throw new Error('Nessuno schedule attivo');
  return id;
}
