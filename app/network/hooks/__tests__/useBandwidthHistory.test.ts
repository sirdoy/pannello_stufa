import { renderHook, act } from '@testing-library/react';
import { useBandwidthHistory } from '../useBandwidthHistory';
import { decimateLTTB } from '@/lib/utils/decimateLTTB';
import type { BandwidthData } from '@/app/components/devices/network/types';

// Mock the decimation function
jest.mock('@/lib/utils/decimateLTTB', () => ({
  decimateLTTB: jest.fn((data) => data), // Default: pass-through
}));

const mockDecimateLTTB = jest.mocked(decimateLTTB);

describe('useBandwidthHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset to pass-through behavior
    mockDecimateLTTB.mockImplementation((data) => data);
  });

  const createBandwidthData = (timestamp: number, download: number, upload: number): BandwidthData => ({
    timestamp,
    download,
    upload,
  });

  describe('Initialization', () => {
    it('returns empty chartData initially', () => {
      const { result } = renderHook(() => useBandwidthHistory());

      expect(result.current.chartData).toEqual([]);
      expect(result.current.isEmpty).toBe(true);
      expect(result.current.isCollecting).toBe(false);
      expect(result.current.pointCount).toBe(0);
    });

    it('defaults to 24h time range', () => {
      const { result } = renderHook(() => useBandwidthHistory());

      expect(result.current.timeRange).toBe('24h');
    });
  });

  describe('Data accumulation', () => {
    it('accumulates data points via addDataPoint', () => {
      const { result } = renderHook(() => useBandwidthHistory());
      const now = Date.now();

      act(() => {
        result.current.addDataPoint(createBandwidthData(now, 50, 10));
      });

      expect(result.current.chartData.length).toBe(1);
      expect(result.current.chartData[0]).toEqual({
        time: now,
        download: 50,
        upload: 10,
      });
      expect(result.current.pointCount).toBe(1);
    });

    it('sets isCollecting=true after adding 5 points (< 10)', () => {
      const { result } = renderHook(() => useBandwidthHistory());
      const now = Date.now();

      act(() => {
        for (let i = 0; i < 5; i++) {
          result.current.addDataPoint(createBandwidthData(now + i * 1000, 50, 10));
        }
      });

      expect(result.current.isEmpty).toBe(false);
      expect(result.current.isCollecting).toBe(true);
      expect(result.current.pointCount).toBe(5);
    });

    it('sets isCollecting=false after adding 15 points (>= 10)', () => {
      const { result } = renderHook(() => useBandwidthHistory());
      const now = Date.now();

      act(() => {
        for (let i = 0; i < 15; i++) {
          result.current.addDataPoint(createBandwidthData(now + i * 1000, 50, 10));
        }
      });

      expect(result.current.isEmpty).toBe(false);
      expect(result.current.isCollecting).toBe(false);
      expect(result.current.pointCount).toBe(15);
    });

    it('caps buffer at 10080 points (7-day max)', () => {
      const { result } = renderHook(() => useBandwidthHistory());
      const now = Date.now();

      act(() => {
        // Add 10100 points (exceeds limit)
        for (let i = 0; i < 10100; i++) {
          result.current.addDataPoint(createBandwidthData(now + i * 1000, 50, 10));
        }
      });

      expect(result.current.pointCount).toBe(10080);
      // Oldest points should be dropped
      expect(result.current.chartData[0].time).toBe(now + 20 * 1000); // First 20 dropped
    });
  });

  describe('Time range filtering', () => {
    it('filters data by time range 1h (only last 60 minutes)', () => {
      const { result } = renderHook(() => useBandwidthHistory());
      const now = Date.now();

      act(() => {
        // Add points spanning 2 hours
        result.current.addDataPoint(createBandwidthData(now - 2 * 60 * 60 * 1000, 30, 5)); // 2h ago
        result.current.addDataPoint(createBandwidthData(now - 30 * 60 * 1000, 40, 6));      // 30m ago
        result.current.addDataPoint(createBandwidthData(now, 50, 10));                      // now
      });

      act(() => {
        result.current.setTimeRange('1h');
      });

      expect(result.current.timeRange).toBe('1h');
      expect(result.current.chartData.length).toBe(2); // Only last 2 within 1h
      expect(result.current.chartData[0].download).toBe(40);
      expect(result.current.chartData[1].download).toBe(50);
    });

    it('filters data by time range 24h (only last 24 hours)', () => {
      const { result } = renderHook(() => useBandwidthHistory());
      const now = Date.now();

      act(() => {
        // Add points spanning 48 hours
        result.current.addDataPoint(createBandwidthData(now - 48 * 60 * 60 * 1000, 20, 3)); // 48h ago
        result.current.addDataPoint(createBandwidthData(now - 12 * 60 * 60 * 1000, 40, 6)); // 12h ago
        result.current.addDataPoint(createBandwidthData(now, 50, 10));                      // now
      });

      act(() => {
        result.current.setTimeRange('24h');
      });

      expect(result.current.timeRange).toBe('24h');
      expect(result.current.chartData.length).toBe(2); // Only last 2 within 24h
      expect(result.current.chartData[0].download).toBe(40);
      expect(result.current.chartData[1].download).toBe(50);
    });

    it('filters data by time range 7d (full 7-day buffer)', () => {
      const { result } = renderHook(() => useBandwidthHistory());
      const now = Date.now();

      act(() => {
        // Add points spanning 10 days
        result.current.addDataPoint(createBandwidthData(now - 10 * 24 * 60 * 60 * 1000, 20, 3)); // 10d ago
        result.current.addDataPoint(createBandwidthData(now - 5 * 24 * 60 * 60 * 1000, 30, 5));  // 5d ago
        result.current.addDataPoint(createBandwidthData(now - 1 * 24 * 60 * 60 * 1000, 40, 6));  // 1d ago
        result.current.addDataPoint(createBandwidthData(now, 50, 10));                           // now
      });

      act(() => {
        result.current.setTimeRange('7d');
      });

      expect(result.current.timeRange).toBe('7d');
      expect(result.current.chartData.length).toBe(3); // Only last 3 within 7d (10d point excluded)
      expect(result.current.chartData[0].download).toBe(30);
      expect(result.current.chartData[2].download).toBe(50);
    });

    it('setTimeRange updates the active time range', () => {
      const { result } = renderHook(() => useBandwidthHistory());

      act(() => {
        result.current.setTimeRange('1h');
      });
      expect(result.current.timeRange).toBe('1h');

      act(() => {
        result.current.setTimeRange('7d');
      });
      expect(result.current.timeRange).toBe('7d');
    });
  });

  describe('Decimation', () => {
    it('decimates data when filtered result exceeds 500 points', () => {
      const { result } = renderHook(() => useBandwidthHistory());
      const now = Date.now();

      // Mock decimateLTTB to return exactly 500 points
      mockDecimateLTTB.mockImplementation((data) =>
        data.slice(0, 500)
      );

      act(() => {
        // Add 600 points
        for (let i = 0; i < 600; i++) {
          result.current.addDataPoint(createBandwidthData(now + i * 1000, 50, 10));
        }
      });

      // Should call decimateLTTB with threshold 500
      expect(mockDecimateLTTB).toHaveBeenCalled();
      expect(result.current.chartData.length).toBe(500);
    });

    it('does NOT decimate when filtered result <= 500 points', () => {
      const { result } = renderHook(() => useBandwidthHistory());
      const now = Date.now();

      mockDecimateLTTB.mockClear();

      act(() => {
        // Add 100 points
        for (let i = 0; i < 100; i++) {
          result.current.addDataPoint(createBandwidthData(now + i * 1000, 50, 10));
        }
      });

      // Should NOT call decimateLTTB
      expect(mockDecimateLTTB).not.toHaveBeenCalled();
      expect(result.current.chartData.length).toBe(100);
    });

    it('decimates with threshold of 500', () => {
      const { result } = renderHook(() => useBandwidthHistory());
      const now = Date.now();

      let capturedThreshold: number | undefined;
      mockDecimateLTTB.mockImplementation((data, threshold) => {
        capturedThreshold = threshold;
        return data.slice(0, threshold);
      });

      act(() => {
        // Add 600 points
        for (let i = 0; i < 600; i++) {
          result.current.addDataPoint(createBandwidthData(now + i * 1000, 50 + i, 10 + i));
        }
      });

      expect(capturedThreshold).toBe(500);
    });
  });

  describe('Hook interface', () => {
    it('exposes correct return type properties', () => {
      const { result } = renderHook(() => useBandwidthHistory());

      expect(result.current).toHaveProperty('chartData');
      expect(result.current).toHaveProperty('timeRange');
      expect(result.current).toHaveProperty('setTimeRange');
      expect(result.current).toHaveProperty('addDataPoint');
      expect(result.current).toHaveProperty('pointCount');
      expect(result.current).toHaveProperty('isEmpty');
      expect(result.current).toHaveProperty('isCollecting');
    });
  });
});
