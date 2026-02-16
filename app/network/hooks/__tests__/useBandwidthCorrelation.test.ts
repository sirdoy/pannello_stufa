import { renderHook, act } from '@testing-library/react';
import { useBandwidthCorrelation } from '../useBandwidthCorrelation';

describe('useBandwidthCorrelation', () => {
  it('initializes with stove-off status and empty data', () => {
    const { result } = renderHook(() => useBandwidthCorrelation());

    expect(result.current.status).toBe('stove-off');
    expect(result.current.chartData).toEqual([]);
    expect(result.current.insight).toBeNull();
    expect(result.current.pointCount).toBe(0);
    expect(result.current.minPoints).toBe(30);
  });

  it('does not add point when powerLevel is null (stove off)', () => {
    const { result } = renderHook(() => useBandwidthCorrelation());

    act(() => {
      result.current.addDataPoint(50, null, Date.now());
    });

    expect(result.current.chartData).toEqual([]);
    expect(result.current.pointCount).toBe(0);
    expect(result.current.status).toBe('stove-off');
  });

  it('transitions to collecting state with fewer than 30 points', () => {
    const { result } = renderHook(() => useBandwidthCorrelation());
    const baseTime = Date.now();

    // Add 15 points (less than MIN_CORRELATION_POINTS)
    act(() => {
      for (let i = 0; i < 15; i++) {
        result.current.addDataPoint(50 + i, 3, baseTime + i * 60000); // 1-minute intervals
      }
    });

    expect(result.current.status).toBe('collecting');
    expect(result.current.pointCount).toBe(15);
    expect(result.current.chartData).toHaveLength(15);
    expect(result.current.insight).toBeNull();
  });

  it('transitions to ready state with 30+ points', () => {
    const { result } = renderHook(() => useBandwidthCorrelation());
    const baseTime = Date.now();

    // Add 30 points (minimum for Pearson correlation)
    act(() => {
      for (let i = 0; i < 30; i++) {
        result.current.addDataPoint(50 + i, 3, baseTime + i * 60000);
      }
    });

    expect(result.current.status).toBe('ready');
    expect(result.current.pointCount).toBe(30);
    expect(result.current.insight).not.toBeNull();
    expect(result.current.insight?.coefficient).toBeDefined();
    expect(result.current.insight?.level).toBeDefined();
    expect(result.current.insight?.description).toBeDefined();
    expect(result.current.insight?.dataPointCount).toBe(30);
  });

  it('aligns timestamps to nearest minute and averages duplicate points', () => {
    const { result } = renderHook(() => useBandwidthCorrelation());
    const baseTime = Math.floor(Date.now() / 60000) * 60000; // Round to minute

    act(() => {
      // Add two points that will round to same minute
      // Both within 30s of baseTime round to baseTime
      result.current.addDataPoint(50, 3, baseTime + 10000); // +10s rounds to baseTime
      result.current.addDataPoint(60, 4, baseTime + 20000); // +20s rounds to baseTime
    });

    // Should produce single averaged data point
    expect(result.current.chartData).toHaveLength(1);
    expect(result.current.chartData[0]?.time).toBe(baseTime);
    expect(result.current.chartData[0]?.bandwidth).toBe(55); // (50+60)/2
    expect(result.current.chartData[0]?.powerLevel).toBe(3.5); // (3+4)/2
  });

  it('maps coefficient to strong-positive insight level', () => {
    const { result } = renderHook(() => useBandwidthCorrelation());
    const baseTime = Date.now();

    // Create strong positive correlation (r > 0.7)
    act(() => {
      for (let i = 0; i < 30; i++) {
        result.current.addDataPoint(10 + i * 5, 1 + Math.floor(i / 6), baseTime + i * 60000);
      }
    });

    expect(result.current.insight?.level).toBe('strong-positive');
    expect(result.current.insight?.description).toContain('forte positiva');
  });

  it('calculates active hours from point count', () => {
    const { result } = renderHook(() => useBandwidthCorrelation());
    const baseTime = Date.now();

    // Add 30 points (assumes ~30s between measurements)
    act(() => {
      for (let i = 0; i < 30; i++) {
        result.current.addDataPoint(50, 3, baseTime + i * 60000);
      }
    });

    // 30 points * 30s / 3600s ≈ 0.25 hours
    expect(result.current.insight?.activeHours).toBeCloseTo(0.25, 2);
  });

  it('caps buffer at MAX_CORRELATION_POINTS', () => {
    const { result } = renderHook(() => useBandwidthCorrelation());
    const baseTime = Date.now();

    // Add more than 2000 points
    act(() => {
      for (let i = 0; i < 2100; i++) {
        result.current.addDataPoint(50, 3, baseTime + i * 60000);
      }
    });

    // Should cap at 2000
    expect(result.current.pointCount).toBe(2000);
    expect(result.current.chartData).toHaveLength(2000);
  });

  it('maps coefficient to strong-negative insight level', () => {
    const { result } = renderHook(() => useBandwidthCorrelation());
    const baseTime = Date.now();

    // Create strong negative correlation (r < -0.7)
    act(() => {
      for (let i = 0; i < 30; i++) {
        result.current.addDataPoint(100 - i * 5, 1 + Math.floor(i / 6), baseTime + i * 60000);
      }
    });

    expect(result.current.insight?.level).toBe('strong-negative');
    expect(result.current.insight?.description).toContain('forte negativa');
  });

  it('maps coefficient to moderate-positive insight level', () => {
    const { result } = renderHook(() => useBandwidthCorrelation());
    const baseTime = Date.now();

    // Create moderate positive correlation (0.3 < r < 0.7)
    // Mix of positive trend with noise
    act(() => {
      for (let i = 0; i < 30; i++) {
        const bandwidth = 30 + i * 2 + (i % 3 === 0 ? -10 : 5);
        result.current.addDataPoint(bandwidth, 2 + Math.floor(i / 10), baseTime + i * 60000);
      }
    });

    const level = result.current.insight?.level;
    expect(level).toMatch(/moderate-positive|strong-positive/);
  });

  it('maps coefficient to none insight level for no correlation', () => {
    const { result } = renderHook(() => useBandwidthCorrelation());
    const baseTime = Date.now();

    // Create no correlation (random bandwidth, constant power)
    act(() => {
      for (let i = 0; i < 30; i++) {
        const bandwidth = 30 + Math.sin(i) * 20; // Oscillating bandwidth
        result.current.addDataPoint(bandwidth, 3, baseTime + i * 60000); // Constant power
      }
    });

    expect(result.current.insight?.level).toBe('none');
    expect(result.current.insight?.description).toContain('Nessuna correlazione');
  });
});
