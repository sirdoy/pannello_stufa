import { decimateLTTB, type TimeSeriesPoint } from '../decimateLTTB';

describe('decimateLTTB', () => {
  // Helper to create synthetic time series
  const createPoints = (count: number, valueGenerator?: (i: number) => number): TimeSeriesPoint[] =>
    Array.from({ length: count }, (_, i) => ({
      time: Date.now() + i * 1000,
      value: valueGenerator ? valueGenerator(i) : Math.random() * 100,
    }));

  describe('Pass-through for small datasets', () => {
    it('returns data unchanged when length <= threshold', () => {
      const data = createPoints(10);
      const result = decimateLTTB(data, 10);

      expect(result).toEqual(data);
      expect(result.length).toBe(10);
    });

    it('returns data unchanged when length < threshold', () => {
      const data = createPoints(5);
      const result = decimateLTTB(data, 10);

      expect(result).toEqual(data);
      expect(result.length).toBe(5);
    });
  });

  describe('Decimation to threshold', () => {
    it('reduces 1000 points to 500', () => {
      const data = createPoints(1000);
      const result = decimateLTTB(data, 500);

      expect(result.length).toBe(500);
    });

    it('reduces 10080 points to 500 (7-day simulation)', () => {
      const data = createPoints(10080);
      const result = decimateLTTB(data, 500);

      expect(result.length).toBe(500);
    });
  });

  describe('Boundary preservation', () => {
    it('always keeps first and last point', () => {
      const data = createPoints(1000);
      const firstPoint = data[0];
      const lastPoint = data[999];

      const result = decimateLTTB(data, 500);

      expect(result[0]).toEqual(firstPoint);
      expect(result[result.length - 1]).toEqual(lastPoint);
    });
  });

  describe('Peak and valley preservation', () => {
    it('preserves peak values', () => {
      // Create dataset with known spike at index 500
      const data = createPoints(1000, (i) => {
        if (i === 500) return 1000; // Peak
        return 50 + Math.random() * 10; // Baseline
      });

      const result = decimateLTTB(data, 200);

      // Peak point should be retained
      const hasPeak = result.some((p) => p.value === 1000);
      expect(hasPeak).toBe(true);
    });

    it('preserves valley values', () => {
      // Create dataset with known dip at index 500
      const data = createPoints(1000, (i) => {
        if (i === 500) return 5; // Valley
        return 50 + Math.random() * 10; // Baseline
      });

      const result = decimateLTTB(data, 200);

      // Valley point should be retained
      const hasValley = result.some((p) => p.value === 5);
      expect(hasValley).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('handles threshold of 2 (returns only first and last)', () => {
      const data = createPoints(100);
      const result = decimateLTTB(data, 2);

      expect(result.length).toBe(2);
      expect(result[0]).toEqual(data[0]);
      expect(result[1]).toEqual(data[99]);
    });

    it('handles empty array', () => {
      const data: TimeSeriesPoint[] = [];
      const result = decimateLTTB(data, 10);

      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });

    it('handles single point', () => {
      const data = createPoints(1);
      const result = decimateLTTB(data, 10);

      expect(result).toEqual(data);
      expect(result.length).toBe(1);
    });

    it('handles threshold of 1 with multiple points', () => {
      const data = createPoints(100);
      const result = decimateLTTB(data, 1);

      // Should return at least first point
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result[0]).toEqual(data[0]);
    });
  });

  describe('Time series integrity', () => {
    it('maintains chronological order', () => {
      const data = createPoints(1000);
      const result = decimateLTTB(data, 200);

      for (let i = 1; i < result.length; i++) {
        expect(result[i]!.time).toBeGreaterThan(result[i - 1]!.time);
      }
    });

    it('returns subset of original points (no interpolation)', () => {
      const data = createPoints(100);
      const result = decimateLTTB(data, 20);

      // Every result point should exist in original data
      result.forEach((point) => {
        const found = data.some((p) => p.time === point.time && p.value === point.value);
        expect(found).toBe(true);
      });
    });
  });
});
