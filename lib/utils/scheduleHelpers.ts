/**
 * Schedule Helpers
 * Utilities for parsing and formatting Netatmo schedule data
 */

/**
 * Italian day abbreviations
 */
export const DAY_NAMES = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'] as const;

/**
 * Zone color configuration
 */
export interface ZoneColor {
  bg: string;
  text: string;
  name: string;
}

/**
 * Zone type to color mapping (Ember Noir theme)
 * Each Netatmo zone type has a fixed, distinctive color
 */
export const ZONE_COLORS: Record<number, ZoneColor> = {
  // type 0: Comfort - Warm amber/orange
  0: { bg: 'hsl(25, 95%, 53%)', text: 'hsl(0, 0%, 100%)', name: 'Comfort' },
  // type 1: Night - Deep indigo/blue
  1: { bg: 'hsl(230, 60%, 45%)', text: 'hsl(0, 0%, 100%)', name: 'Notte' },
  // type 5: Away/Eco - Cool gray
  5: { bg: 'hsl(220, 15%, 40%)', text: 'hsl(0, 0%, 100%)', name: 'Eco' },
  // type 8: Comfort+ - Bright ember red
  8: { bg: 'hsl(15, 90%, 55%)', text: 'hsl(0, 0%, 100%)', name: 'Comfort+' },
};

const ZONE_COLORS_DEFAULT: ZoneColor = { bg: 'hsl(0, 0%, 50%)', text: 'hsl(0, 0%, 100%)', name: 'Altro' };

/**
 * Netatmo schedule zone
 */
export interface NetatmoZone {
  id: number;
  type: number;
  name: string;
}

/**
 * Netatmo timetable slot
 */
export interface NetatmoTimetableSlot {
  zone_id: number;
  m_offset: number;
}

/**
 * Netatmo schedule structure
 */
export interface NetatmoSchedule {
  zones: NetatmoZone[];
  timetable: NetatmoTimetableSlot[];
}

/**
 * Parsed timeline slot for UI display
 */
export interface TimelineSlot {
  day: number;
  startMinutes: number;
  endMinutes: number;
  zoneType: number;
  zoneName: string;
  zoneId: number;
  durationPercent: number;
}

/**
 * Get color for a zone type
 * @param {number} zoneType - Netatmo zone type (0, 1, 5, 8, etc.)
 * @returns {Object} { bg, text, name } color configuration
 */
export function getZoneColor(zoneType: number): ZoneColor {
  return ZONE_COLORS[zoneType] || ZONE_COLORS_DEFAULT;
}

/**
 * Parse Netatmo timetable into day-grouped timeline slots
 * @param {Object} schedule - Schedule object with zones[] and timetable[]
 * @returns {Array} Array of timeline slots grouped by day
 *
 * @example
 * const slots = parseTimelineSlots(schedule);
 * // Returns: [{ day: 0, startMinutes: 420, endMinutes: 780, zoneType: 0, zoneName: 'Comfort', durationPercent: 25 }, ...]
 */
export function parseTimelineSlots(schedule: NetatmoSchedule | null | undefined): TimelineSlot[] {
  if (!schedule || !schedule.timetable || !schedule.zones) {
    return [];
  }

  const slots: TimelineSlot[] = [];
  const timetable = schedule.timetable;

  for (let i = 0; i < timetable.length; i++) {
    const slot = timetable[i];
    const nextSlot = timetable[i + 1];

    // Find zone for this slot
    const zone = schedule.zones.find(z => z.id === slot.zone_id);
    if (!zone) continue;

    // m_offset is minutes from Monday 00:00 (NOT per-day)
    const startOffset = slot.m_offset;
    const endOffset = nextSlot ? nextSlot.m_offset : 10080; // Week ends at 10080 minutes (7 * 1440)

    // Calculate day (0-6) and minutes within day
    const startDay = Math.floor(startOffset / 1440);
    const startMinutes = startOffset % 1440;
    const endDay = Math.floor(endOffset / 1440);
    const endMinutes = endOffset % 1440;

    // Common slot data
    const slotData = {
      zoneType: zone.type,
      zoneName: zone.name,
      zoneId: zone.id,
    };

    // Handle slots that span multiple days
    if (startDay === endDay) {
      // Slot within single day
      const duration = endMinutes - startMinutes;
      slots.push({
        ...slotData,
        day: startDay,
        startMinutes,
        endMinutes,
        durationPercent: (duration / 1440) * 100,
      });
    } else {
      // Slot spans multiple days - split into segments
      // First segment: from startMinutes to end of day
      slots.push({
        ...slotData,
        day: startDay,
        startMinutes,
        endMinutes: 1440,
        durationPercent: ((1440 - startMinutes) / 1440) * 100,
      });

      // Middle days (full days)
      for (let d = startDay + 1; d < endDay; d++) {
        slots.push({
          ...slotData,
          day: d,
          startMinutes: 0,
          endMinutes: 1440,
          durationPercent: 100,
        });
      }

      // Last segment: from start of day to endMinutes
      if (endMinutes > 0) {
        slots.push({
          ...slotData,
          day: endDay,
          startMinutes: 0,
          endMinutes,
          durationPercent: (endMinutes / 1440) * 100,
        });
      }
    }
  }

  return slots;
}

/**
 * Convert temperature to color-blind accessible gradient
 * Uses cyan-yellow-red gradient to avoid red-green confusion
 * @param {number} temp - Temperature in Celsius
 * @returns {string} HSL color string for CSS
 *
 * @example
 * const color = tempToColor(20);
 * // Returns: "hsl(210, 70%, 80%)"
 */
export function tempToColor(temp: number): string {
  // Temperature range for typical home heating
  const minTemp = 15;
  const maxTemp = 23;

  // Clamp and normalize temperature (0-1)
  const normalized = Math.max(0, Math.min(1, (temp - minTemp) / (maxTemp - minTemp)));

  // Cyan-yellow-red gradient (colorblind safe)
  if (normalized < 0.33) {
    // Low temps: Cyan to blue-white
    const hue = 180 + normalized * 30; // 180-190
    const lightness = 60 + normalized * 20; // 60-80
    return `hsl(${Math.round(hue)}, 70%, ${Math.round(lightness)}%)`;
  } else if (normalized < 0.66) {
    // Medium temps: Blue-white to yellow
    const progress = (normalized - 0.33) / 0.33;
    const hue = 210 - progress * 180; // 210-30
    return `hsl(${Math.round(hue)}, 70%, 80%)`;
  } else {
    // High temps: Yellow to red
    const progress = (normalized - 0.66) / 0.34;
    const hue = 30 - progress * 30; // 30-0 (red)
    const lightness = 70 - progress * 20; // 70-50
    return `hsl(${Math.round(hue)}, 85%, ${Math.round(lightness)}%)`;
  }
}

/**
 * Format minutes from midnight to HH:MM
 * @param {number} minutes - Minutes from midnight (0-1440)
 * @returns {string} Formatted time "HH:MM"
 *
 * @example
 * formatTimeFromMinutes(420); // "07:00"
 * formatTimeFromMinutes(1440); // "00:00" (next day)
 */
export function formatTimeFromMinutes(minutes: number): string {
  // Handle edge case: 1440 minutes = next day midnight
  const normalizedMinutes = minutes % 1440;

  const hours = Math.floor(normalizedMinutes / 60);
  const mins = normalizedMinutes % 60;

  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/**
 * Format duration in minutes to human-readable string
 * @param {number} minutes - Duration in minutes
 * @returns {string} Formatted duration "Xh Ym" or "X min"
 *
 * @example
 * formatDuration(15); // "15 min"
 * formatDuration(90); // "1h 30m"
 * formatDuration(120); // "2h"
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (mins === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${mins}m`;
}
