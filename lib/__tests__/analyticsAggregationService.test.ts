/**
 * Tests for Analytics Aggregation Service
 */

import { aggregateDailyStats, saveDailyStats } from '../analyticsAggregationService';
import type { AnalyticsEvent } from '@/types/analytics';

// Mock dependencies
jest.mock('../firebaseAdmin');
jest.mock('../analyticsEventLogger');
jest.mock('../pelletEstimationService');
jest.mock('../environmentHelper');

import { adminDbGet, adminDbSet } from '../firebaseAdmin';
import { getAnalyticsEventsForDate } from '../analyticsEventLogger';
import { estimatePelletConsumption } from '../pelletEstimationService';
import { getEnvironmentPath } from '../environmentHelper';

const mockAdminDbGet = jest.mocked(adminDbGet);
const mockAdminDbSet = jest.mocked(adminDbSet);
const mockGetAnalyticsEventsForDate = jest.mocked(getAnalyticsEventsForDate);
const mockEstimatePelletConsumption = jest.mocked(estimatePelletConsumption);
const mockGetEnvironmentPath = jest.mocked(getEnvironmentPath);

describe('analyticsAggregationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    mockGetEnvironmentPath.mockImplementation((path) => `dev/${path}`);
    mockEstimatePelletConsumption.mockReturnValue({
      totalKg: 10.5,
      costEstimate: 5.25,
      dailyAverage: 10.5,
      byPowerLevel: {},
    });
  });

  describe('aggregateDailyStats', () => {
    it('returns empty stats when no events exist', async () => {
      mockGetAnalyticsEventsForDate.mockResolvedValue([]);
      mockAdminDbGet.mockResolvedValue(null);

      const result = await aggregateDailyStats('2024-01-15');

      expect(result).toEqual({
        date: '2024-01-15',
        totalHours: 0,
        byPowerLevel: {},
        pelletEstimate: {
          totalKg: 0,
          costEstimate: 0,
        },
        ignitionCount: 0,
        shutdownCount: 0,
        automationHours: 0,
        manualHours: 0,
      });
    });

    it('calculates correct hours for single ignite+shutdown session', async () => {
      const events: AnalyticsEvent[] = [
        {
          timestamp: '2024-01-15T08:00:00.000Z',
          eventType: 'stove_ignite',
          powerLevel: 3,
          source: 'manual',
        },
        {
          timestamp: '2024-01-15T10:00:00.000Z',
          eventType: 'stove_shutdown',
          source: 'manual',
        },
      ];

      mockGetAnalyticsEventsForDate.mockResolvedValue(events);
      mockAdminDbGet.mockResolvedValue(null);

      const result = await aggregateDailyStats('2024-01-15');

      expect(result.totalHours).toBe(2);
      expect(result.byPowerLevel[3]).toBe(2);
      expect(result.manualHours).toBe(2);
      expect(result.automationHours).toBe(0);
      expect(result.ignitionCount).toBe(1);
      expect(result.shutdownCount).toBe(1);
    });

    it('splits time correctly when power_change events occur', async () => {
      const events: AnalyticsEvent[] = [
        {
          timestamp: '2024-01-15T08:00:00.000Z',
          eventType: 'stove_ignite',
          powerLevel: 2,
          source: 'manual',
        },
        {
          timestamp: '2024-01-15T09:00:00.000Z',
          eventType: 'power_change',
          powerLevel: 4,
          source: 'manual',
        },
        {
          timestamp: '2024-01-15T11:00:00.000Z',
          eventType: 'stove_shutdown',
          source: 'manual',
        },
      ];

      mockGetAnalyticsEventsForDate.mockResolvedValue(events);
      mockAdminDbGet.mockResolvedValue(null);

      const result = await aggregateDailyStats('2024-01-15');

      expect(result.totalHours).toBe(3);
      expect(result.byPowerLevel[2]).toBe(1); // 08:00-09:00
      expect(result.byPowerLevel[4]).toBe(2); // 09:00-11:00
    });

    it('tracks automation vs manual hours by source field', async () => {
      const events: AnalyticsEvent[] = [
        {
          timestamp: '2024-01-15T08:00:00.000Z',
          eventType: 'stove_ignite',
          powerLevel: 3,
          source: 'scheduler',
        },
        {
          timestamp: '2024-01-15T10:00:00.000Z',
          eventType: 'stove_shutdown',
          source: 'scheduler',
        },
        {
          timestamp: '2024-01-15T14:00:00.000Z',
          eventType: 'stove_ignite',
          powerLevel: 2,
          source: 'manual',
        },
        {
          timestamp: '2024-01-15T15:00:00.000Z',
          eventType: 'stove_shutdown',
          source: 'manual',
        },
      ];

      mockGetAnalyticsEventsForDate.mockResolvedValue(events);
      mockAdminDbGet.mockResolvedValue(null);

      const result = await aggregateDailyStats('2024-01-15');

      expect(result.automationHours).toBe(2); // Scheduler source
      expect(result.manualHours).toBe(1);     // Manual source
    });

    it('counts ignition and shutdown events correctly', async () => {
      const events: AnalyticsEvent[] = [
        {
          timestamp: '2024-01-15T08:00:00.000Z',
          eventType: 'stove_ignite',
          powerLevel: 3,
          source: 'manual',
        },
        {
          timestamp: '2024-01-15T10:00:00.000Z',
          eventType: 'stove_shutdown',
          source: 'manual',
        },
        {
          timestamp: '2024-01-15T14:00:00.000Z',
          eventType: 'stove_ignite',
          powerLevel: 2,
          source: 'scheduler',
        },
        {
          timestamp: '2024-01-15T16:00:00.000Z',
          eventType: 'stove_shutdown',
          source: 'scheduler',
        },
      ];

      mockGetAnalyticsEventsForDate.mockResolvedValue(events);
      mockAdminDbGet.mockResolvedValue(null);

      const result = await aggregateDailyStats('2024-01-15');

      expect(result.ignitionCount).toBe(2);
      expect(result.shutdownCount).toBe(2);
    });

    it('calls estimatePelletConsumption with correct usage data', async () => {
      const events: AnalyticsEvent[] = [
        {
          timestamp: '2024-01-15T08:00:00.000Z',
          eventType: 'stove_ignite',
          powerLevel: 3,
          source: 'manual',
        },
        {
          timestamp: '2024-01-15T10:00:00.000Z',
          eventType: 'stove_shutdown',
          source: 'manual',
        },
      ];

      mockGetAnalyticsEventsForDate.mockResolvedValue(events);
      mockAdminDbGet.mockResolvedValue(null);

      await aggregateDailyStats('2024-01-15');

      expect(mockEstimatePelletConsumption).toHaveBeenCalledWith([
        { powerLevel: 3, hours: 2 },
      ]);
    });

    it('includes pellet estimates in result', async () => {
      const events: AnalyticsEvent[] = [
        {
          timestamp: '2024-01-15T08:00:00.000Z',
          eventType: 'stove_ignite',
          powerLevel: 3,
          source: 'manual',
        },
        {
          timestamp: '2024-01-15T10:00:00.000Z',
          eventType: 'stove_shutdown',
          source: 'manual',
        },
      ];

      mockGetAnalyticsEventsForDate.mockResolvedValue(events);
      mockAdminDbGet.mockResolvedValue(null);
      mockEstimatePelletConsumption.mockReturnValue({
        totalKg: 2.4,
        costEstimate: 1.2,
        dailyAverage: 2.4,
        byPowerLevel: { 3: { hours: 2, kg: 2.4 } },
      });

      const result = await aggregateDailyStats('2024-01-15');

      expect(result.pelletEstimate).toEqual({
        totalKg: 2.4,
        costEstimate: 1.2,
      });
    });

    it('handles unclosed session at end of day', async () => {
      const events: AnalyticsEvent[] = [
        {
          timestamp: '2024-01-15T22:00:00.000Z',
          eventType: 'stove_ignite',
          powerLevel: 3,
          source: 'manual',
        },
        // No shutdown - stove still running at midnight
      ];

      mockGetAnalyticsEventsForDate.mockResolvedValue(events);
      mockAdminDbGet.mockResolvedValue(null);

      const result = await aggregateDailyStats('2024-01-15');

      // Should calculate hours until 23:59:59.999
      expect(result.totalHours).toBeCloseTo(2, 1); // ~2 hours (22:00 to 23:59:59)
      expect(result.ignitionCount).toBe(1);
      expect(result.shutdownCount).toBe(0);
    });
  });

  describe('saveDailyStats', () => {
    it('writes stats to correct Firebase path', async () => {
      const stats = {
        date: '2024-01-15',
        totalHours: 5,
        byPowerLevel: { 3: 5 },
        pelletEstimate: { totalKg: 6, costEstimate: 3 },
        ignitionCount: 1,
        shutdownCount: 1,
        automationHours: 5,
        manualHours: 0,
      };

      mockAdminDbSet.mockResolvedValue(undefined);

      await saveDailyStats(stats);

      expect(mockGetEnvironmentPath).toHaveBeenCalledWith('analyticsStats/daily/2024-01-15');
      expect(mockAdminDbSet).toHaveBeenCalledWith('dev/analyticsStats/daily/2024-01-15', stats);
    });

    it('does not throw on error (fire-and-forget)', async () => {
      const stats = {
        date: '2024-01-15',
        totalHours: 5,
        byPowerLevel: { 3: 5 },
        pelletEstimate: { totalKg: 6, costEstimate: 3 },
        ignitionCount: 1,
        shutdownCount: 1,
        automationHours: 5,
        manualHours: 0,
      };

      mockAdminDbSet.mockRejectedValue(new Error('Firebase error'));

      // Should not throw
      await expect(saveDailyStats(stats)).resolves.not.toThrow();
    });
  });
});
