/**
 * Tests for Bandwidth History Logger
 *
 * Tests Firebase RTDB bandwidth persistence, querying, and cleanup.
 * Also tests computeNetworkHealth with historicalAvgSaturation.
 *
 * Quick Task 27: Historical Bandwidth Data
 */

import type { BandwidthData } from '@/app/components/devices/network/types';

// Mock Firebase Admin and Environment Helper BEFORE imports
jest.mock('@/lib/firebaseAdmin');
jest.mock('@/lib/environmentHelper');

// NOW import the module under test and mocked modules
import { appendBandwidthReading, getBandwidthHistory, cleanupOldBandwidthHistory } from '../bandwidthHistoryLogger';
import { adminDbSet, adminDbGet, adminDbRemove } from '@/lib/firebaseAdmin';
import { getEnvironmentPath } from '@/lib/environmentHelper';
import { computeNetworkHealth } from '@/app/components/devices/network/networkHealthUtils';

// Get references to the mocked functions
const mockedAdminDbSet = jest.mocked(adminDbSet);
const mockedAdminDbGet = jest.mocked(adminDbGet);
const mockedAdminDbRemove = jest.mocked(adminDbRemove);
const mockedGetEnvironmentPath = jest.mocked(getEnvironmentPath);

describe('bandwidthHistoryLogger', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default environment path behavior: return path as-is with dev/ prefix
    mockedGetEnvironmentPath.mockImplementation((path: string) => `dev/${path}`);
  });

  describe('appendBandwidthReading', () => {
    it('should write bandwidth reading to date-keyed Firebase path', async () => {
      const data: BandwidthData = {
        timestamp: 1708000000000, // 2024-02-15T14:13:20.000Z
        download: 45.5,
        upload: 12.3,
      };

      await appendBandwidthReading(data);

      expect(mockedAdminDbSet).toHaveBeenCalledWith(
        'dev/fritzbox/bandwidth_history/2024-02-15/1708000000000',
        {
          time: 1708000000000,
          download: 45.5,
          upload: 12.3,
        }
      );
    });

    it('should use getEnvironmentPath for environment-aware paths', async () => {
      const data: BandwidthData = {
        timestamp: 1708000000000,
        download: 30,
        upload: 10,
      };

      await appendBandwidthReading(data);

      expect(mockedGetEnvironmentPath).toHaveBeenCalledWith('fritzbox/bandwidth_history');
    });

    it('should write to correct date node based on timestamp', async () => {
      // Use a timestamp that is at midnight UTC 2024-01-01
      const data: BandwidthData = {
        timestamp: 1704067200000, // 2024-01-01T00:00:00.000Z
        download: 10,
        upload: 5,
      };

      await appendBandwidthReading(data);

      expect(mockedAdminDbSet).toHaveBeenCalledWith(
        expect.stringContaining('2024-01-01'),
        expect.any(Object)
      );
    });
  });

  describe('getBandwidthHistory', () => {
    it('should query single date node and return sorted points (oldest first)', async () => {
      // Query same day: 2024-02-15
      const startTime = 1708000000000; // 2024-02-15T14:13:20.000Z
      const endTime = 1708020000000;   // 2024-02-15T19:46:40.000Z

      mockedAdminDbGet.mockResolvedValue({
        '1708005000000': { time: 1708005000000, download: 30, upload: 8 },
        '1708015000000': { time: 1708015000000, download: 50, upload: 12 },
        '1708010000000': { time: 1708010000000, download: 40, upload: 10 },
      });

      const points = await getBandwidthHistory(startTime, endTime);

      // Should read single date node
      expect(mockedAdminDbGet).toHaveBeenCalledTimes(1);
      expect(mockedAdminDbGet).toHaveBeenCalledWith('dev/fritzbox/bandwidth_history/2024-02-15');

      // Should return 3 points sorted oldest first (ascending)
      expect(points).toHaveLength(3);
      expect(points[0]?.time).toBe(1708005000000);
      expect(points[1]?.time).toBe(1708010000000);
      expect(points[2]?.time).toBe(1708015000000);
    });

    it('should query multiple date nodes and merge results', async () => {
      // Query spanning 3 days
      const startTime = 1708000000000; // 2024-02-15
      const endTime = 1708200000000;   // 2024-02-17

      // Mock different data for each date
      mockedAdminDbGet
        .mockResolvedValueOnce({
          '1708005000000': { time: 1708005000000, download: 20, upload: 5 },
        })
        .mockResolvedValueOnce({
          '1708095000000': { time: 1708095000000, download: 35, upload: 8 },
        })
        .mockResolvedValueOnce({
          '1708185000000': { time: 1708185000000, download: 60, upload: 15 },
        });

      const points = await getBandwidthHistory(startTime, endTime);

      // Should read 3 date nodes
      expect(mockedAdminDbGet).toHaveBeenCalledTimes(3);
      expect(mockedAdminDbGet).toHaveBeenCalledWith('dev/fritzbox/bandwidth_history/2024-02-15');
      expect(mockedAdminDbGet).toHaveBeenCalledWith('dev/fritzbox/bandwidth_history/2024-02-16');
      expect(mockedAdminDbGet).toHaveBeenCalledWith('dev/fritzbox/bandwidth_history/2024-02-17');

      // Should merge and sort ascending
      expect(points).toHaveLength(3);
      expect(points[0]?.time).toBe(1708005000000);
      expect(points[1]?.time).toBe(1708095000000);
      expect(points[2]?.time).toBe(1708185000000);
    });

    it('should filter points outside timestamp range', async () => {
      const startTime = 1708005000000; // Filter start
      const endTime = 1708015000000;   // Filter end

      mockedAdminDbGet.mockResolvedValue({
        '1708000000000': { time: 1708000000000, download: 10, upload: 3 }, // Before range
        '1708010000000': { time: 1708010000000, download: 40, upload: 10 }, // Inside range
        '1708020000000': { time: 1708020000000, download: 60, upload: 15 }, // After range
      });

      const points = await getBandwidthHistory(startTime, endTime);

      // Should only return point inside range
      expect(points).toHaveLength(1);
      expect(points[0]?.time).toBe(1708010000000);
    });

    it('should return empty array if no data exists', async () => {
      mockedAdminDbGet.mockResolvedValue(null);

      const points = await getBandwidthHistory(1708000000000, 1708100000000);

      expect(points).toEqual([]);
    });

    it('should handle date node with no readings', async () => {
      mockedAdminDbGet.mockResolvedValue({});

      const points = await getBandwidthHistory(1708000000000, 1708100000000);

      expect(points).toEqual([]);
    });

    it('should return points with correct structure', async () => {
      // Query same day: 1708000000000 = 2024-02-15T14:13:20 and 1708010000000 = 2024-02-15T17:06:40
      const startTime = 1708000000000;
      const endTime = 1708010000000; // Same day
      mockedAdminDbGet.mockResolvedValue({
        '1708005000000': { time: 1708005000000, download: 45.5, upload: 12.3 },
      });

      const points = await getBandwidthHistory(startTime, endTime);

      expect(points).toHaveLength(1);
      expect(points[0]).toEqual({
        time: 1708005000000,
        download: 45.5,
        upload: 12.3,
      });
    });
  });

  describe('cleanupOldBandwidthHistory', () => {
    it('should remove date nodes older than 7 days', async () => {
      // Mock current time using a fixed reference
      const now = Date.now();
      const cutoffDate = new Date(now - 7 * 24 * 60 * 60 * 1000);

      // Format cutoff to YYYY-MM-DD
      const pad = (n: number) => n.toString().padStart(2, '0');
      const cutoffStr = `${cutoffDate.getFullYear()}-${pad(cutoffDate.getMonth() + 1)}-${pad(cutoffDate.getDate())}`;

      // Create an old date (14 days ago)
      const oldDate = new Date(now - 14 * 24 * 60 * 60 * 1000);
      const oldDateStr = `${oldDate.getFullYear()}-${pad(oldDate.getMonth() + 1)}-${pad(oldDate.getDate())}`;

      // Create a recent date (2 days ago — always within 7 days)
      const recentDate = new Date(now - 2 * 24 * 60 * 60 * 1000);
      const recentDateStr = `${recentDate.getFullYear()}-${pad(recentDate.getMonth() + 1)}-${pad(recentDate.getDate())}`;

      // Mock RTDB to return both old and recent date nodes
      const mockData: Record<string, unknown> = {
        [oldDateStr]: { '1700000000000': { time: 1700000000000, download: 10, upload: 3 } },
        [recentDateStr]: { '1708000000000': { time: 1708000000000, download: 50, upload: 12 } },
      };
      mockedAdminDbGet.mockResolvedValue(mockData);

      await cleanupOldBandwidthHistory();

      // Should remove old date node only
      expect(mockedAdminDbRemove).toHaveBeenCalledTimes(1);
      expect(mockedAdminDbRemove).toHaveBeenCalledWith(
        `dev/fritzbox/bandwidth_history/${oldDateStr}`
      );
      // Should NOT remove recent date node
      expect(mockedAdminDbRemove).not.toHaveBeenCalledWith(
        `dev/fritzbox/bandwidth_history/${recentDateStr}`
      );
    });

    it('should do nothing if no history data exists', async () => {
      mockedAdminDbGet.mockResolvedValue(null);

      await cleanupOldBandwidthHistory();

      expect(mockedAdminDbRemove).not.toHaveBeenCalled();
    });

    it('should do nothing if all data is within 7 days', async () => {
      // All recent dates
      const now = Date.now();
      const yesterday = new Date(now - 24 * 60 * 60 * 1000);
      const pad = (n: number) => n.toString().padStart(2, '0');
      const yesterdayStr = `${yesterday.getFullYear()}-${pad(yesterday.getMonth() + 1)}-${pad(yesterday.getDate())}`;

      mockedAdminDbGet.mockResolvedValue({
        [yesterdayStr]: { '1708000000000': { time: 1708000000000, download: 50, upload: 12 } },
      });

      await cleanupOldBandwidthHistory();

      expect(mockedAdminDbRemove).not.toHaveBeenCalled();
    });

    it('should use getEnvironmentPath for environment-aware paths', async () => {
      mockedAdminDbGet.mockResolvedValue(null);

      await cleanupOldBandwidthHistory();

      expect(mockedGetEnvironmentPath).toHaveBeenCalledWith('fritzbox/bandwidth_history');
    });
  });
});

describe('computeNetworkHealth with historicalAvgSaturation', () => {
  it('should use current reading only when historicalAvgSaturation is undefined', () => {
    const result = computeNetworkHealth({
      wanConnected: true,
      wanUptime: 86400, // 24h
      downloadMbps: 50,
      uploadMbps: 20,
      linkSpeedMbps: 100, // 50% saturation
      previousHealth: 'excellent',
      consecutiveReadings: 2,
      historicalAvgSaturation: undefined,
    });

    // 50% saturation < 70% threshold → excellent
    expect(result.health).toBe('excellent');
  });

  it('should return degraded when current is fine but historical is high (70% weight)', () => {
    // Current: 30% saturation (fine by itself → excellent)
    // Historical: 90% saturation (high trend)
    // Effective = 0.3 * 0.3 + 0.7 * 0.9 = 0.09 + 0.63 = 0.72
    // 0.72 >= 0.7 → not excellent; 0.72 < 0.85 → good (with 24h uptime)
    const result = computeNetworkHealth({
      wanConnected: true,
      wanUptime: 86400, // 24h
      downloadMbps: 30, // 30% saturation
      uploadMbps: 10,
      linkSpeedMbps: 100,
      previousHealth: 'good',
      consecutiveReadings: 2,
      historicalAvgSaturation: 0.9, // 90% historical average
    });

    // Effective = 0.3 * 0.3 + 0.7 * 0.9 = 0.72 → exceeds 0.7, so NOT excellent
    // 0.72 < 0.85 → 'good' (stable from previous)
    expect(result.health).toBe('good');
    // Was 'good' before, computed 'good', consistent reading → increment counter
    expect(result.consecutiveReadings).toBe(3);
  });

  it('should return degraded when both current and historical push saturation above 0.85', () => {
    // Current: 70% saturation, Historical: 90% saturation
    // Effective = 0.3 * 0.7 + 0.7 * 0.9 = 0.21 + 0.63 = 0.84
    // 0.84 < 0.85 → good (with long uptime)
    const result1 = computeNetworkHealth({
      wanConnected: true,
      wanUptime: 3600, // 1h
      downloadMbps: 80, // 80% saturation
      uploadMbps: 10,
      linkSpeedMbps: 100,
      previousHealth: 'degraded',
      consecutiveReadings: 1,
      historicalAvgSaturation: 0.9, // 90% historical average
    });

    // Effective = 0.3 * 0.8 + 0.7 * 0.9 = 0.24 + 0.63 = 0.87
    // 0.87 >= 0.85 → degraded (with 1h uptime)
    expect(result1.health).toBe('degraded');
  });

  it('should produce stable good status when both readings are moderate', () => {
    // Current: 50% saturation, Historical: 60% saturation
    // Effective = 0.3 * 0.5 + 0.7 * 0.6 = 0.15 + 0.42 = 0.57
    // 0.57 < 0.7 → excellent (with 24h uptime, stable)
    const result = computeNetworkHealth({
      wanConnected: true,
      wanUptime: 86400,
      downloadMbps: 50, // 50% saturation
      uploadMbps: 10,
      linkSpeedMbps: 100,
      previousHealth: 'excellent',
      consecutiveReadings: 5,
      historicalAvgSaturation: 0.6, // 60% historical average
    });

    // Effective = 0.57 < 0.7 → excellent, stable reading
    expect(result.health).toBe('excellent');
  });
});
