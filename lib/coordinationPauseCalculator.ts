/**
 * Pause Duration Calculator
 *
 * Calculates when automation pause should end based on Netatmo schedule timetable.
 * Pause duration is schedule-aware: automation resumes at next schedule slot, not fixed duration.
 *
 * Netatmo schedule structure:
 * {
 *   timetable: [
 *     { m_offset: 0, zone_id: 1 },      // Monday 00:00
 *     { m_offset: 360, zone_id: 2 },    // Monday 06:00
 *     { m_offset: 720, zone_id: 1 },    // Monday 12:00
 *     ...
 *   ],
 *   zones: [
 *     { id: 1, name: "Comfort", temp: 21 },
 *     { id: 2, name: "Night", temp: 18 },
 *   ]
 * }
 *
 * m_offset: Minutes from Monday 00:00 (week-relative)
 */

import type { NetatmoSchedule } from './netatmoApi';

/**
 * Default pause duration when schedule unavailable (1 hour)
 */
const DEFAULT_PAUSE_MINUTES = 60;

/**
 * Minutes in a week (7 days × 24 hours × 60 minutes)
 */
const MINUTES_IN_WEEK = 7 * 24 * 60;

/**
 * Netatmo schedule timetable entry
 */
interface TimetableEntry {
  m_offset: number;
  zone_id: number;
}

/**
 * Netatmo schedule zone
 */
interface ScheduleZone {
  id: number;
  name: string;
  temp: number;
}

/**
 * Pause calculation result
 */
interface PauseResult {
  pauseUntil: number;
  nextSlot: {
    offset: number;
    zoneId: number;
    zoneName: string;
    temp?: number;
  } | null;
  waitMinutes: number;
}

/**
 * Calculate when automation pause should end
 * Returns timestamp of next schedule slot
 */
export function calculatePauseUntil(
  currentTime: Date | number,
  schedule: NetatmoSchedule
): PauseResult {
  // Convert to Date if timestamp
  const now = currentTime instanceof Date ? currentTime : new Date(currentTime);

  // Validate schedule
  if (!schedule || !schedule.timetable || schedule.timetable.length === 0) {
    console.warn('Empty or invalid schedule, using default 1-hour pause');
    const pauseUntil = now.getTime() + (DEFAULT_PAUSE_MINUTES * 60 * 1000);
    return {
      pauseUntil,
      nextSlot: null,
      waitMinutes: DEFAULT_PAUSE_MINUTES,
    };
  }

  // Calculate current m_offset (minutes since Monday 00:00)
  const currentOffset = calculateCurrentOffset(now);

  // Find next schedule slot
  const nextSlot = getNextScheduleSlot(currentOffset, schedule.timetable);

  if (!nextSlot) {
    // Fallback: use default pause
    console.warn('Could not find next schedule slot, using default pause');
    const pauseUntil = now.getTime() + (DEFAULT_PAUSE_MINUTES * 60 * 1000);
    return {
      pauseUntil,
      nextSlot: null,
      waitMinutes: DEFAULT_PAUSE_MINUTES,
    };
  }

  // Calculate wait time in minutes
  let waitMinutes = nextSlot.m_offset - currentOffset;

  // Handle week wraparound (Sunday → Monday)
  if (waitMinutes <= 0) {
    waitMinutes += MINUTES_IN_WEEK;
  }

  // Convert wait time to actual timestamp
  const pauseUntil = now.getTime() + (waitMinutes * 60 * 1000);

  // Enrich with zone information
  const zone = schedule.zones?.find(z => z.id === nextSlot.zone_id);

  return {
    pauseUntil,
    nextSlot: {
      offset: nextSlot.m_offset,
      zoneId: nextSlot.zone_id,
      zoneName: zone?.name || `Zone ${nextSlot.zone_id}`,
      temp: zone?.temp,
    },
    waitMinutes,
  };
}

/**
 * Calculate current m_offset (minutes since Monday 00:00)
 * Uses UTC to match Netatmo API behavior
 */
function calculateCurrentOffset(date: Date): number {
  // Get day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const dayOfWeek = date.getUTCDay();

  // Convert Sunday (0) to 7 for easier calculation (Monday = 1, Sunday = 7)
  const mondayBasedDay = dayOfWeek === 0 ? 7 : dayOfWeek;

  // Days since Monday (0 for Monday, 6 for Sunday)
  const daysSinceMonday = mondayBasedDay - 1;

  // Current time in minutes
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const timeInMinutes = (hours * 60) + minutes;

  // Total offset
  return (daysSinceMonday * 24 * 60) + timeInMinutes;
}

/**
 * Get next schedule slot from timetable
 * Returns first slot with m_offset > currentOffset, or wraps to Monday if needed
 */
export function getNextScheduleSlot(
  currentOffset: number,
  timetable: TimetableEntry[]
): TimetableEntry | null {
  // Sort timetable by offset (in case it's not sorted)
  const sortedTimetable = [...timetable].sort((a, b) => a.m_offset - b.m_offset);

  // Find first slot after current offset
  const nextSlot = sortedTimetable.find(slot => slot.m_offset > currentOffset);

  if (nextSlot) {
    return nextSlot;
  }

  // No slot found after current time → wrap to Monday 00:00 (first slot)
  return sortedTimetable[0] || null;
}

/**
 * Format human-readable pause reason in Italian
 */
export function formatPauseReason(
  changeType: 'setpoint' | 'mode' | 'both',
  pauseUntil: number
): string {
  const pauseDate = new Date(pauseUntil);
  const hours = pauseDate.getHours().toString().padStart(2, '0');
  const minutes = pauseDate.getMinutes().toString().padStart(2, '0');
  const timeString = `${hours}:${minutes}`;

  const changeTypeMap = {
    setpoint: 'setpoint modificato',
    mode: 'modalità modificata',
    both: 'setpoint e modalità modificati',
  };

  const changeDescription = changeTypeMap[changeType] || 'modifica manuale rilevata';

  return `Automazione in pausa fino alle ${timeString} (${changeDescription})`;
}
