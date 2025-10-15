import { formatHoursToHHMM } from '../formatUtils';

describe('formatUtils', () => {
  describe('formatHoursToHHMM', () => {
    test('converts decimal hours to HH:MM format correctly', () => {
      expect(formatHoursToHHMM(47.5)).toBe('47:30');
      expect(formatHoursToHHMM(10.25)).toBe('10:15');
      expect(formatHoursToHHMM(0.5)).toBe('0:30');
      expect(formatHoursToHHMM(1.75)).toBe('1:45');
    });

    test('handles whole numbers correctly', () => {
      expect(formatHoursToHHMM(5)).toBe('5:00');
      expect(formatHoursToHHMM(0)).toBe('0:00');
      expect(formatHoursToHHMM(100)).toBe('100:00');
    });

    test('pads minutes with leading zero when needed', () => {
      expect(formatHoursToHHMM(5.05)).toBe('5:03'); // 0.05 * 60 = 3 minutes
      expect(formatHoursToHHMM(10.0833)).toBe('10:05'); // 0.0833 * 60 ≈ 5 minutes
    });

    test('handles edge case when rounding gives 60 minutes', () => {
      expect(formatHoursToHHMM(5.9999)).toBe('6:00');
      expect(formatHoursToHHMM(10.999)).toBe('11:00');
    });

    test('handles null, undefined and NaN values', () => {
      expect(formatHoursToHHMM(null)).toBe('0:00');
      expect(formatHoursToHHMM(undefined)).toBe('0:00');
      expect(formatHoursToHHMM(NaN)).toBe('0:00');
    });

    test('handles very small decimal values', () => {
      expect(formatHoursToHHMM(0.01)).toBe('0:01');
      expect(formatHoursToHHMM(0.001)).toBe('0:00'); // Rounds to 0
    });

    test('handles large numbers correctly', () => {
      expect(formatHoursToHHMM(1000.5)).toBe('1000:30');
      expect(formatHoursToHHMM(9999.99)).toBe('9999:59');
      expect(formatHoursToHHMM(9999.9999)).toBe('10000:00');
    });

    test('handles precise fractions correctly', () => {
      expect(formatHoursToHHMM(2.333333)).toBe('2:20'); // 1/3 hour = 20 minutes
      expect(formatHoursToHHMM(3.666666)).toBe('3:40'); // 2/3 hour = 40 minutes
      expect(formatHoursToHHMM(1.1666)).toBe('1:10'); // 10 minutes
    });
  });
});
