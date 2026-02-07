/**
 * Tests for Pause Duration Calculator
 */

import {
  calculatePauseUntil,
  getNextScheduleSlot,
  formatPauseReason,
} from '@/lib/coordinationPauseCalculator';

describe('coordinationPauseCalculator', () => {
  // Sample schedule matching Netatmo structure
  const sampleSchedule = {
    zones: [
      { id: 1, name: 'Comfort', temp: 21 },
      { id: 2, name: 'Night', temp: 18 },
      { id: 3, name: 'Eco', temp: 19 },
    ],
    timetable: [
      { m_offset: 0, zone_id: 2 },      // Monday 00:00 - Night
      { m_offset: 420, zone_id: 1 },    // Monday 07:00 - Comfort
      { m_offset: 1320, zone_id: 2 },   // Monday 22:00 - Night
      { m_offset: 1860, zone_id: 1 },   // Tuesday 07:00 - Comfort
      { m_offset: 2760, zone_id: 2 },   // Tuesday 22:00 - Night
      { m_offset: 3300, zone_id: 1 },   // Wednesday 07:00 - Comfort
    ],
  };

  describe('calculatePauseUntil', () => {
    it('finds next slot correctly mid-week', () => {
      // Monday 10:00 (600 minutes from Monday 00:00)
      const monday10am = new Date('2024-01-08T10:00:00Z'); // Monday

      const result = calculatePauseUntil(monday10am, sampleSchedule);

      // Next slot is Monday 22:00 (m_offset: 1320)
      expect(result.nextSlot.offset).toBe(1320);
      expect(result.nextSlot.zoneName).toBe('Night');
      expect(result.nextSlot.temp).toBe(18);

      // Wait time: 1320 - 600 = 720 minutes (12 hours)
      expect(result.waitMinutes).toBe(720);

      // Verify timestamp is correct
      const expectedTime = monday10am.getTime() + (720 * 60 * 1000);
      expect(result.pauseUntil).toBe(expectedTime);
    });

    it('handles Sunday → Monday wrap', () => {
      // Sunday 20:00 (9840 minutes from Monday 00:00)
      const sunday8pm = new Date('2024-01-14T20:00:00Z'); // Sunday
      // Day 0 (Sunday) = 6 days since Monday = 8640 minutes + 20 hours (1200 min) = 9840

      const result = calculatePauseUntil(sunday8pm, sampleSchedule);

      // Should wrap to Monday 00:00 (m_offset: 0)
      expect(result.nextSlot.offset).toBe(0);
      expect(result.nextSlot.zoneName).toBe('Night');

      // Wait time: 10080 - 9840 = 240 minutes (4 hours until Monday 00:00)
      expect(result.waitMinutes).toBe(240);
    });

    it('handles slot boundary edge case', () => {
      // Exactly at Monday 07:00 (m_offset: 420)
      const monday7am = new Date('2024-01-08T07:00:00Z'); // Monday

      const result = calculatePauseUntil(monday7am, sampleSchedule);

      // Should return NEXT slot (Monday 22:00), not current slot
      expect(result.nextSlot.offset).toBe(1320);
      expect(result.nextSlot.zoneName).toBe('Night');
    });

    it('returns correct pauseUntil timestamp', () => {
      // Monday 10:00
      const monday10am = new Date('2024-01-08T10:00:00Z');

      const result = calculatePauseUntil(monday10am, sampleSchedule);

      // pauseUntil should be Monday 22:00 (12 hours later)
      const pauseDate = new Date(result.pauseUntil);
      expect(pauseDate.getUTCHours()).toBe(22);
      expect(pauseDate.getUTCMinutes()).toBe(0);
    });

    it('empty timetable returns 1-hour default pause', () => {
      const now = new Date('2024-01-08T10:00:00Z');
      const emptySchedule = {
        zones: [],
        timetable: [],
      };

      const result = calculatePauseUntil(now, emptySchedule);

      expect(result.waitMinutes).toBe(60);
      expect(result.nextSlot).toBe(null);

      // Verify 1-hour pause
      const expectedTime = now.getTime() + (60 * 60 * 1000);
      expect(result.pauseUntil).toBe(expectedTime);
    });

    it('handles invalid schedule gracefully', () => {
      const now = new Date('2024-01-08T10:00:00Z');

      const result = calculatePauseUntil(now, null);

      expect(result.waitMinutes).toBe(60);
      expect(result.nextSlot).toBe(null);
    });

    it('handles schedule without zones', () => {
      const now = new Date('2024-01-08T10:00:00Z'); // Monday 10:00
      const scheduleWithoutZones = {
        timetable: [
          { m_offset: 0, zone_id: 1 },
          { m_offset: 1320, zone_id: 2 },
        ],
      };

      const result = calculatePauseUntil(now, scheduleWithoutZones);

      // Should still find next slot
      expect(result.nextSlot.offset).toBe(1320);
      // Zone name should have fallback
      expect(result.nextSlot.zoneName).toBe('Zone 2');
      expect(result.nextSlot.temp).toBeUndefined();
    });

    it('works with timestamp input', () => {
      // Monday 10:00 as timestamp
      const timestamp = new Date('2024-01-08T10:00:00Z').getTime();

      const result = calculatePauseUntil(timestamp, sampleSchedule);

      // Should work same as Date input
      expect(result.nextSlot.offset).toBe(1320);
      expect(result.waitMinutes).toBe(720);
    });

    it('handles unsorted timetable', () => {
      const now = new Date('2024-01-08T10:00:00Z'); // Monday 10:00
      const unsortedSchedule = {
        zones: [{ id: 1, name: 'Comfort', temp: 21 }],
        timetable: [
          { m_offset: 1320, zone_id: 1 }, // Out of order
          { m_offset: 420, zone_id: 1 },
          { m_offset: 0, zone_id: 1 },
        ],
      };

      const result = calculatePauseUntil(now, unsortedSchedule);

      // Should correctly find next slot after sorting
      expect(result.nextSlot.offset).toBe(1320);
    });
  });

  describe('getNextScheduleSlot', () => {
    const timetable = [
      { m_offset: 0, zone_id: 1 },
      { m_offset: 360, zone_id: 2 },
      { m_offset: 720, zone_id: 1 },
      { m_offset: 1080, zone_id: 3 },
    ];

    it('finds next slot in middle of timetable', () => {
      // Current: 500 minutes (Monday 08:20)
      const nextSlot = getNextScheduleSlot(500, timetable);

      expect(nextSlot.m_offset).toBe(720);
      expect(nextSlot.zone_id).toBe(1);
    });

    it('wraps to first slot when at end', () => {
      // Current: 1200 minutes (past all slots)
      const nextSlot = getNextScheduleSlot(1200, timetable);

      // Should wrap to Monday 00:00
      expect(nextSlot.m_offset).toBe(0);
      expect(nextSlot.zone_id).toBe(1);
    });

    it('returns first slot when before all slots', () => {
      // Current: -10 minutes (shouldn't happen, but edge case)
      const nextSlot = getNextScheduleSlot(-10, timetable);

      expect(nextSlot.m_offset).toBe(0);
    });

    it('handles exactly on slot boundary', () => {
      // Current: exactly 720 minutes
      const nextSlot = getNextScheduleSlot(720, timetable);

      // Should return NEXT slot
      expect(nextSlot.m_offset).toBe(1080);
    });

    it('returns null for empty timetable', () => {
      const nextSlot = getNextScheduleSlot(500, []);

      expect(nextSlot).toBe(null);
    });

    it('handles unsorted timetable', () => {
      const unsorted = [
        { m_offset: 720, zone_id: 1 },
        { m_offset: 0, zone_id: 2 },
        { m_offset: 360, zone_id: 3 },
      ];

      const nextSlot = getNextScheduleSlot(100, unsorted);

      // Should find 360 (first after 100 when sorted)
      expect(nextSlot.m_offset).toBe(360);
    });
  });

  describe('formatPauseReason', () => {
    it('formats setpoint change reason in Italian', () => {
      // 15:30 timestamp
      const pauseTime = new Date('2024-01-08T15:30:00').getTime();

      const reason = formatPauseReason('setpoint', pauseTime);

      expect(reason).toContain('Automazione in pausa fino alle 15:30');
      expect(reason).toContain('setpoint modificato');
    });

    it('formats mode change reason in Italian', () => {
      const pauseTime = new Date('2024-01-08T22:00:00').getTime();

      const reason = formatPauseReason('mode', pauseTime);

      expect(reason).toContain('22:00');
      expect(reason).toContain('modalità modificata');
    });

    it('formats both changes reason in Italian', () => {
      const pauseTime = new Date('2024-01-08T08:45:00').getTime();

      const reason = formatPauseReason('both', pauseTime);

      expect(reason).toContain('08:45');
      expect(reason).toContain('setpoint e modalità modificati');
    });

    it('handles unknown change type with fallback', () => {
      const pauseTime = new Date('2024-01-08T12:00:00').getTime();

      const reason = formatPauseReason('unknown', pauseTime);

      expect(reason).toContain('12:00');
      expect(reason).toContain('modifica manuale rilevata');
    });

    it('pads single-digit hours and minutes', () => {
      // 09:05 timestamp
      const pauseTime = new Date('2024-01-08T09:05:00').getTime();

      const reason = formatPauseReason('setpoint', pauseTime);

      expect(reason).toContain('09:05');
    });
  });

  describe('timezone handling', () => {
    it('uses UTC for calculations', () => {
      // Create date in different timezone context
      const utcDate = new Date('2024-01-08T10:00:00Z'); // Monday 10:00 UTC

      const result = calculatePauseUntil(utcDate, sampleSchedule);

      // Should calculate based on UTC time
      expect(result.waitMinutes).toBe(720); // 12 hours until 22:00 UTC
    });
  });

  describe('edge cases', () => {
    it('handles very short wait times', () => {
      // Monday 06:59 (419 minutes)
      const monday659am = new Date('2024-01-08T06:59:00Z');

      const result = calculatePauseUntil(monday659am, sampleSchedule);

      // Next slot at 07:00 (420 minutes)
      expect(result.waitMinutes).toBe(1); // Just 1 minute wait
      expect(result.nextSlot.offset).toBe(420);
    });

    it('handles week wraparound correctly', () => {
      // Sunday 23:59 (latest possible time in week)
      const sunday2359 = new Date('2024-01-14T23:59:00Z');

      const result = calculatePauseUntil(sunday2359, sampleSchedule);

      // Should wrap to Monday 00:00
      expect(result.nextSlot.offset).toBe(0);
      expect(result.waitMinutes).toBeLessThan(10); // Very short wait
    });
  });
});
