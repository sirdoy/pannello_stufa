import {
  parseTimelineSlots,
  tempToColor,
  formatTimeFromMinutes,
  formatDuration,
  DAY_NAMES,
  ZONE_COLORS,
  getZoneColor,
} from '@/lib/utils/scheduleHelpers';

describe('scheduleHelpers', () => {
  describe('DAY_NAMES', () => {
    it('should export Italian day abbreviations', () => {
      expect(DAY_NAMES).toEqual(['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']);
      expect(DAY_NAMES).toHaveLength(7);
    });
  });

  describe('parseTimelineSlots', () => {
    it('should parse timetable with m_offset correctly', () => {
      const schedule = {
        zones: [
          { id: 1, name: 'Comfort', type: 0 },
          { id: 2, name: 'Night', type: 1 },
        ],
        timetable: [
          { m_offset: 0, zone_id: 2 }, // Monday 00:00 - Night
          { m_offset: 420, zone_id: 1 }, // Monday 07:00 - Comfort
          { m_offset: 1320, zone_id: 2 }, // Monday 22:00 - Night (extends to end of week)
        ],
      };

      const slots = parseTimelineSlots(schedule);

      // Last slot spans to end of week (10080 min), creating segments for each remaining day
      expect(slots.length).toBeGreaterThanOrEqual(3);

      // First slot: Monday 00:00-07:00 (Night)
      expect(slots[0]).toMatchObject({
        day: 0, // Monday
        startMinutes: 0,
        endMinutes: 420,
        zoneType: 1,
        zoneName: 'Night',
      });
      expect(slots[0].durationPercent).toBeCloseTo((420 / 1440) * 100);

      // Second slot: Monday 07:00-22:00 (Comfort)
      expect(slots[1]).toMatchObject({
        day: 0,
        startMinutes: 420,
        endMinutes: 1320,
        zoneType: 0,
        zoneName: 'Comfort',
      });
      expect(slots[1].durationPercent).toBeCloseTo((900 / 1440) * 100);

      // Third slot: Monday 22:00-24:00 (Night, first segment)
      expect(slots[2]).toMatchObject({
        day: 0,
        startMinutes: 1320,
        endMinutes: 1440,
        zoneType: 1,
        zoneName: 'Night',
      });

      // Remaining days should all be Night zones
      slots.slice(3).forEach(slot => {
        expect(slot.zoneType).toBe(1);
        expect(slot.zoneName).toBe('Night');
      });
    });

    it('should calculate day index correctly from m_offset', () => {
      const schedule = {
        zones: [{ id: 1, name: 'Comfort', type: 0 }],
        timetable: [
          { m_offset: 0, zone_id: 1 }, // Monday (day 0)
          { m_offset: 1440, zone_id: 1 }, // Tuesday (day 1)
          { m_offset: 2880, zone_id: 1 }, // Wednesday (day 2)
          { m_offset: 8640, zone_id: 1 }, // Sunday (day 6)
        ],
      };

      const slots = parseTimelineSlots(schedule);

      expect(slots[0].day).toBe(0); // Monday
      expect(slots[1].day).toBe(1); // Tuesday
      expect(slots[2].day).toBe(2); // Wednesday
    });

    it('should handle slots spanning multiple days', () => {
      const schedule = {
        zones: [{ id: 1, name: 'Comfort', type: 0 }],
        timetable: [
          { m_offset: 1200, zone_id: 1 }, // Monday 20:00
          { m_offset: 3000, zone_id: 1 }, // Wednesday 02:00 (spans 2+ days)
        ],
      };

      const slots = parseTimelineSlots(schedule);

      // Should split into: Mon 20:00-24:00, Tue 00:00-24:00, Wed 00:00-02:00
      expect(slots.length).toBeGreaterThanOrEqual(3);
      expect(slots[0].day).toBe(0); // Monday
      expect(slots[0].startMinutes).toBe(1200);
      expect(slots[0].endMinutes).toBe(1440);
    });

    it('should return empty array for invalid input', () => {
      expect(parseTimelineSlots(null)).toEqual([]);
      expect(parseTimelineSlots({})).toEqual([]);
      expect(parseTimelineSlots({ zones: [] })).toEqual([]);
      expect(parseTimelineSlots({ timetable: [] })).toEqual([]);
    });

    it('should skip slots with missing zones', () => {
      const schedule = {
        zones: [{ id: 1, name: 'Comfort', type: 0 }],
        timetable: [
          { m_offset: 0, zone_id: 1 },
          { m_offset: 420, zone_id: 999 }, // Zone doesn't exist
        ],
      };

      const slots = parseTimelineSlots(schedule);

      expect(slots).toHaveLength(1);
      expect(slots[0].zoneName).toBe('Comfort');
    });

    it('should include all zone types including Away', () => {
      const schedule = {
        zones: [
          { id: 1, name: 'Comfort', type: 0 },
          { id: 2, name: 'Away', type: 5 },
          { id: 3, name: 'Night', type: 1 },
        ],
        timetable: [
          { m_offset: 0, zone_id: 1 }, // Comfort
          { m_offset: 420, zone_id: 2 }, // Away
          { m_offset: 1320, zone_id: 3 }, // Night
        ],
      };

      const slots = parseTimelineSlots(schedule);

      // Should have slots for all zones including Away
      expect(slots.length).toBeGreaterThan(0);

      // Check all zone types are present
      const zoneTypes = new Set(slots.map(s => s.zoneType));
      expect(zoneTypes.has(0)).toBe(true); // Comfort
      expect(zoneTypes.has(5)).toBe(true); // Away
      expect(zoneTypes.has(1)).toBe(true); // Night

      // All slots should have zoneType
      slots.forEach(slot => {
        expect(slot.zoneType).toBeDefined();
        expect(slot.zoneName).toBeDefined();
      });
    });
  });

  describe('getZoneColor', () => {
    it('should return correct colors for known zone types', () => {
      expect(getZoneColor(0)).toBe(ZONE_COLORS[0]); // Comfort
      expect(getZoneColor(1)).toBe(ZONE_COLORS[1]); // Night
      expect(getZoneColor(5)).toBe(ZONE_COLORS[5]); // Away
      expect(getZoneColor(8)).toBe(ZONE_COLORS[8]); // Comfort+
    });

    it('should return default color for unknown zone types', () => {
      expect(getZoneColor(99)).toBe(ZONE_COLORS.default);
      expect(getZoneColor(undefined)).toBe(ZONE_COLORS.default);
    });

    it('should have bg and text properties', () => {
      const color = getZoneColor(0);
      expect(color).toHaveProperty('bg');
      expect(color).toHaveProperty('text');
      expect(color).toHaveProperty('name');
    });
  });

  describe('tempToColor', () => {
    it('should return valid HSL string', () => {
      const color = tempToColor(20);
      expect(color).toMatch(/^hsl\(\d+, \d+%, \d+%\)$/);
    });

    it('should use cyan-yellow-red gradient', () => {
      const cold = tempToColor(15); // Min temp
      const medium = tempToColor(19); // Mid temp
      const hot = tempToColor(23); // Max temp

      // Cold should be cyan-ish (hue 180-210)
      expect(cold).toMatch(/hsl\((18\d|19\d|20\d|21\d)/);

      // Hot should be red-ish (hue 0-30)
      expect(hot).toMatch(/hsl\((\d|[12]\d|3\d),/);
    });

    it('should handle temperatures outside range', () => {
      const tooLow = tempToColor(10); // Below min
      const tooHigh = tempToColor(30); // Above max

      // Should clamp and still return valid HSL
      expect(tooLow).toMatch(/^hsl\(\d+, \d+%, \d+%\)$/);
      expect(tooHigh).toMatch(/^hsl\(\d+, \d+%, \d+%\)$/);
    });

    it('should produce different colors for different temps', () => {
      const colors = [15, 17, 19, 21, 23].map(tempToColor);

      // All colors should be unique
      const uniqueColors = new Set(colors);
      expect(uniqueColors.size).toBe(5);
    });
  });

  describe('formatTimeFromMinutes', () => {
    it('should format midnight correctly', () => {
      expect(formatTimeFromMinutes(0)).toBe('00:00');
    });

    it('should format morning times', () => {
      expect(formatTimeFromMinutes(420)).toBe('07:00');
      expect(formatTimeFromMinutes(485)).toBe('08:05');
    });

    it('should format afternoon times', () => {
      expect(formatTimeFromMinutes(720)).toBe('12:00');
      expect(formatTimeFromMinutes(900)).toBe('15:00');
    });

    it('should format end of day', () => {
      expect(formatTimeFromMinutes(1439)).toBe('23:59');
    });

    it('should handle edge case: 1440 (next day midnight)', () => {
      expect(formatTimeFromMinutes(1440)).toBe('00:00');
    });

    it('should pad single digits with zero', () => {
      expect(formatTimeFromMinutes(65)).toBe('01:05');
      expect(formatTimeFromMinutes(9)).toBe('00:09');
    });
  });

  describe('formatDuration', () => {
    it('should format minutes only for < 60', () => {
      expect(formatDuration(5)).toBe('5 min');
      expect(formatDuration(15)).toBe('15 min');
      expect(formatDuration(45)).toBe('45 min');
    });

    it('should format hours only when no remainder', () => {
      expect(formatDuration(60)).toBe('1h');
      expect(formatDuration(120)).toBe('2h');
      expect(formatDuration(360)).toBe('6h');
    });

    it('should format hours and minutes', () => {
      expect(formatDuration(90)).toBe('1h 30m');
      expect(formatDuration(135)).toBe('2h 15m');
      expect(formatDuration(385)).toBe('6h 25m');
    });

    it('should handle edge cases', () => {
      expect(formatDuration(0)).toBe('0 min');
      expect(formatDuration(1)).toBe('1 min');
      expect(formatDuration(61)).toBe('1h 1m');
    });
  });
});
