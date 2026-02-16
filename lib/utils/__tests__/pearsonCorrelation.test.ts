import { calculatePearsonCorrelation } from '../pearsonCorrelation';

describe('calculatePearsonCorrelation', () => {
  it('returns 0 for empty arrays', () => {
    expect(calculatePearsonCorrelation([], [])).toBe(0);
  });

  it('returns 0 for mismatched array lengths', () => {
    expect(calculatePearsonCorrelation([1, 2, 3], [4, 5])).toBe(0);
  });

  it('returns 0 for single element', () => {
    expect(calculatePearsonCorrelation([1], [2])).toBe(0);
  });

  it('returns 1 for perfect positive correlation', () => {
    const x = [1, 2, 3, 4, 5];
    const y = [2, 4, 6, 8, 10];
    const result = calculatePearsonCorrelation(x, y);
    expect(result).toBeCloseTo(1.0, 5);
  });

  it('returns -1 for perfect negative correlation', () => {
    const x = [1, 2, 3, 4, 5];
    const y = [10, 8, 6, 4, 2];
    const result = calculatePearsonCorrelation(x, y);
    expect(result).toBeCloseTo(-1.0, 5);
  });

  it('returns 0 for no correlation (constant y values)', () => {
    const x = [1, 2, 3, 4, 5];
    const y = [5, 5, 5, 5, 5];
    expect(calculatePearsonCorrelation(x, y)).toBe(0);
  });

  it('returns moderate correlation for known dataset', () => {
    // Dataset with moderate positive correlation
    // High variance to reduce correlation strength to moderate range
    const x = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const y = [2, 5, 1, 6, 4, 7, 3, 8, 6, 9];
    const result = calculatePearsonCorrelation(x, y);
    expect(result).toBeGreaterThan(0.3);
    expect(result).toBeLessThan(0.7);
  });

  it('returns 0 for all identical x values (division by zero guard)', () => {
    const x = [5, 5, 5, 5, 5];
    const y = [1, 2, 3, 4, 5];
    expect(calculatePearsonCorrelation(x, y)).toBe(0);
  });

  it('returns 0 for all identical y values (division by zero guard)', () => {
    const x = [1, 2, 3, 4, 5];
    const y = [7, 7, 7, 7, 7];
    expect(calculatePearsonCorrelation(x, y)).toBe(0);
  });
});
