/**
 * Schedule Helpers
 * Utilities for parsing and formatting Netatmo schedule data
 */

/**
 * Italian day abbreviations
 */
export const DAY_NAMES = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

/**
 * Parse Netatmo timetable into day-grouped timeline slots
 * @param {Object} schedule - Schedule object with zones[] and timetable[]
 * @returns {Array} Array of timeline slots grouped by day
 *
 * @example
 * const slots = parseTimelineSlots(schedule);
 * // Returns: [{ day: 0, startMinutes: 420, endMinutes: 780, temperature: 20, zoneName: 'Comfort', durationPercent: 25 }, ...]
 */
export function parseTimelineSlots(schedule) {
  if (!schedule || !schedule.timetable || !schedule.zones) {
    return [];
  }

  const slots = [];
  const timetable = schedule.timetable;

  for (let i = 0; i < timetable.length; i++) {
    const slot = timetable[i];
    const nextSlot = timetable[i + 1];

    // Find zone for this slot
    const zone = schedule.zones.find(z => z.id === slot.zone_id);
    if (!zone) continue;

    // Skip zones without temperature (e.g., type 5 "Away" zones)
    // These zones don't have a temp property after parseSchedules filtering
    if (zone.temp === undefined || zone.temp === null) continue;

    // m_offset is minutes from Monday 00:00 (NOT per-day)
    const startOffset = slot.m_offset;
    const endOffset = nextSlot ? nextSlot.m_offset : 10080; // Week ends at 10080 minutes (7 * 1440)

    // Calculate day (0-6) and minutes within day
    const startDay = Math.floor(startOffset / 1440);
    const startMinutes = startOffset % 1440;
    const endDay = Math.floor(endOffset / 1440);
    const endMinutes = endOffset % 1440;

    // Handle slots that span multiple days
    if (startDay === endDay) {
      // Slot within single day
      const duration = endMinutes - startMinutes;
      slots.push({
        day: startDay,
        startMinutes,
        endMinutes,
        temperature: zone.temp,
        zoneName: zone.name,
        durationPercent: (duration / 1440) * 100,
      });
    } else {
      // Slot spans multiple days - split into segments
      // First segment: from startMinutes to end of day
      slots.push({
        day: startDay,
        startMinutes,
        endMinutes: 1440,
        temperature: zone.temp,
        zoneName: zone.name,
        durationPercent: ((1440 - startMinutes) / 1440) * 100,
      });

      // Middle days (full days)
      for (let d = startDay + 1; d < endDay; d++) {
        slots.push({
          day: d,
          startMinutes: 0,
          endMinutes: 1440,
          temperature: zone.temp,
          zoneName: zone.name,
          durationPercent: 100,
        });
      }

      // Last segment: from start of day to endMinutes
      if (endMinutes > 0) {
        slots.push({
          day: endDay,
          startMinutes: 0,
          endMinutes,
          temperature: zone.temp,
          zoneName: zone.name,
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
export function tempToColor(temp) {
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
export function formatTimeFromMinutes(minutes) {
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
export function formatDuration(minutes) {
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
