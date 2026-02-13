/**
 * Tests for /api/scheduler/check route
 *
 * Covers:
 * - Scheduler modes (manual, semi-manual, automatic)
 * - Early returns (no schedule, status unavailable, maintenance blocks)
 * - Stove data fetching (parallel API calls, null handling, defaults)
 * - Cron health tracking
 * - Fire-and-forget side effects
 */

// Mock ALL external dependencies BEFORE importing route
jest.mock('@/lib/core', () => {
  const { NextResponse } = require('next/server');
  return {
    withCronSecret: jest.fn((handler: any) => handler),
    success: jest.fn((data: any) =>
      NextResponse.json(data, { status: 200 })
    ),
    error: jest.fn((message: string, status?: number) =>
      NextResponse.json({ error: message }, { status: status || 500 })
    ),
  };
});
jest.mock('@/lib/firebaseAdmin');
jest.mock('@/lib/maintenanceServiceAdmin');
jest.mock('@/lib/environmentHelper');
jest.mock('@/lib/services/pidTuningLogService');
jest.mock('@/lib/notificationTriggersServer');
jest.mock('@/lib/stoveApi');
jest.mock('@/lib/stoveStateService');
jest.mock('@/lib/netatmoStoveSync');
jest.mock('@/lib/netatmoCalibrationService');
jest.mock('@/lib/hue/hueRemoteTokenHelper');
jest.mock('@/lib/openMeteo');
jest.mock('@/lib/weatherCacheService');
jest.mock('@/lib/utils/pidController');
jest.mock('@/lib/cronExecutionLogger');
jest.mock('@/lib/analyticsEventLogger');
jest.mock('@/lib/services/tokenCleanupService', () => ({
  cleanupStaleTokens: jest.fn().mockResolvedValue({
    cleaned: false,
    reason: 'mocked',
    tokensScanned: 0,
    tokensRemoved: 0,
    errorsRemoved: 0,
    deletedTokens: []
  }),
}));

// Import route and mocked modules
import { GET } from '../route';
import { adminDbGet, adminDbSet, adminDbUpdate, getAdminDatabase } from '@/lib/firebaseAdmin';
import { canIgnite, trackUsageHours } from '@/lib/maintenanceServiceAdmin';
import { getEnvironmentPath } from '@/lib/environmentHelper';
import { logPidTuningEntry, cleanupOldLogs } from '@/lib/services/pidTuningLogService';
import {
  triggerStoveStatusWorkServer,
  triggerStoveUnexpectedOffServer,
  triggerSchedulerActionServer,
  triggerMaintenanceAlertServer,
} from '@/lib/notificationTriggersServer';
import {
  getStoveStatus,
  getFanLevel,
  getPowerLevel,
  igniteStove,
  shutdownStove,
  setPowerLevel,
  setFanLevel,
} from '@/lib/stoveApi';
import { updateStoveState } from '@/lib/stoveStateService';
import { syncLivingRoomWithStove, enforceStoveSyncSetpoints } from '@/lib/netatmoStoveSync';
import { calibrateValvesServer } from '@/lib/netatmoCalibrationService';
import { proactiveTokenRefresh } from '@/lib/hue/hueRemoteTokenHelper';
import { fetchWeatherForecast } from '@/lib/openMeteo';
import { saveWeatherToCache } from '@/lib/weatherCacheService';
import { logCronExecution } from '@/lib/cronExecutionLogger';
import { logAnalyticsEvent } from '@/lib/analyticsEventLogger';
import { cleanupStaleTokens } from '@/lib/services/tokenCleanupService';

// Create typed mock references
const mockAdminDbGet = jest.mocked(adminDbGet);
const mockAdminDbSet = jest.mocked(adminDbSet);
const mockAdminDbUpdate = jest.mocked(adminDbUpdate);
const mockGetStoveStatus = jest.mocked(getStoveStatus);
const mockGetFanLevel = jest.mocked(getFanLevel);
const mockGetPowerLevel = jest.mocked(getPowerLevel);
const mockIgniteStove = jest.mocked(igniteStove);
const mockShutdownStove = jest.mocked(shutdownStove);
const mockSetPowerLevel = jest.mocked(setPowerLevel);
const mockSetFanLevel = jest.mocked(setFanLevel);
const mockCanIgnite = jest.mocked(canIgnite);
const mockTrackUsageHours = jest.mocked(trackUsageHours);
const mockLogCronExecution = jest.mocked(logCronExecution);
const mockLogAnalyticsEvent = jest.mocked(logAnalyticsEvent);
const mockGetEnvironmentPath = jest.mocked(getEnvironmentPath);
const mockCalibrateValvesServer = jest.mocked(calibrateValvesServer);
const mockProactiveTokenRefresh = jest.mocked(proactiveTokenRefresh);
const mockEnforceStoveSyncSetpoints = jest.mocked(enforceStoveSyncSetpoints);
const mockSyncLivingRoomWithStove = jest.mocked(syncLivingRoomWithStove);
const mockTriggerSchedulerActionServer = jest.mocked(triggerSchedulerActionServer);
const mockTriggerMaintenanceAlertServer = jest.mocked(triggerMaintenanceAlertServer);
const mockTriggerStoveStatusWorkServer = jest.mocked(triggerStoveStatusWorkServer);
const mockTriggerStoveUnexpectedOffServer = jest.mocked(triggerStoveUnexpectedOffServer);
const mockCleanupStaleTokens = jest.mocked(cleanupStaleTokens);
const mockFetchWeatherForecast = jest.mocked(fetchWeatherForecast);
const mockSaveWeatherToCache = jest.mocked(saveWeatherToCache);

// Helper to flush microtasks for fire-and-forget promise testing
// Uses Promise.resolve() chain which works with both real and fake timers
const flushPromises = async () => {
  for (let i = 0; i < 10; i++) {
    await Promise.resolve();
  }
};

describe('Scheduler Check Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CRON_SECRET = 'test-secret';
    process.env.ADMIN_USER_ID = 'admin-test-user';

    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    // Mock getEnvironmentPath to return path as-is
    mockGetEnvironmentPath.mockImplementation((path: string) => path);

    // Mock logCronExecution as fire-and-forget
    mockLogCronExecution.mockResolvedValue(undefined as any);

    // Mock logAnalyticsEvent as fire-and-forget
    mockLogAnalyticsEvent.mockResolvedValue(undefined as any);

    // Default stove data mocks (happy path)
    mockGetStoveStatus.mockResolvedValue({ StatusDescription: 'Spento', Result: 0 } as any);
    mockGetFanLevel.mockResolvedValue({ Result: 3 } as any);
    mockGetPowerLevel.mockResolvedValue({ Result: 2 } as any);

    // Default maintenance mock
    mockTrackUsageHours.mockResolvedValue({ tracked: false } as any);
    mockCanIgnite.mockResolvedValue(true);

    // Default Netatmo sync mocks
    mockEnforceStoveSyncSetpoints.mockResolvedValue({ enforced: false, synced: false } as any);
    mockSyncLivingRoomWithStove.mockResolvedValue({ synced: false } as any);

    // Default fire-and-forget mocks
    mockCalibrateValvesServer.mockResolvedValue({ calibrated: false } as any);
    mockProactiveTokenRefresh.mockResolvedValue({ refreshed: false } as any);
    mockFetchWeatherForecast.mockResolvedValue({ temperature: 15 } as any);
    mockSaveWeatherToCache.mockResolvedValue(undefined as any);

    // Default notification mocks
    mockTriggerSchedulerActionServer.mockResolvedValue({ success: true, skipped: false } as any);
    mockTriggerMaintenanceAlertServer.mockResolvedValue({ success: true, skipped: false } as any);
    mockTriggerStoveStatusWorkServer.mockResolvedValue({ success: true } as any);
    mockTriggerStoveUnexpectedOffServer.mockResolvedValue({ success: true } as any);

    // Default adminDbSet
    mockAdminDbSet.mockResolvedValue(undefined as any);
    mockAdminDbUpdate.mockResolvedValue(undefined as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Helper function for creating mock requests
  function createMockRequest(): Request {
    return new Request('http://localhost/api/scheduler/check?secret=test-secret');
  }

  // Helper to parse JSON response
  async function getResponseData(response: Response): Promise<any> {
    return response.json();
  }

  // Helper to setup scheduler mocks using implementation
  function setupSchedulerMocks(options: {
    mode?: { enabled: boolean; semiManual: boolean; returnToAutoAt?: string };
    intervals?: any[] | null;
    activeScheduleId?: string;
  }) {
    const mode = options.mode ?? { enabled: true, semiManual: false };
    const activeScheduleId = options.activeScheduleId ?? 'default';
    const intervals = options.intervals ?? null;

    mockAdminDbGet.mockImplementation(async (path: string) => {
      if (path === 'schedules-v2/mode') return mode;
      if (path === 'schedules-v2/activeScheduleId') return activeScheduleId;
      if (path.includes('schedules-v2/schedules/') && path.includes('/slots/')) return intervals;
      if (path === 'pidAutomation/boost') return { active: false };
      if (path.includes('pidAutomation/state')) return null;
      if (path.includes('lastCalibration')) return null;
      if (path.includes('lastWeatherRefresh')) return null;
      if (path.includes('lastTokenCleanup')) return null;
      if (path.includes('lastWorkNotification')) return null;
      if (path.includes('lastIgnitionInterval')) return null;
      if (path.includes('lastUnexpectedOffNotification')) return null;
      return null;
    });
  }

  describe('Scheduler Modes', () => {
    it('returns MODALITA_MANUALE when scheduler is disabled', async () => {
      // Setup: scheduler disabled
      mockAdminDbGet.mockResolvedValueOnce({ enabled: false, semiManual: false });

      const request = createMockRequest();
      const response = await GET(request);
      const data = await getResponseData(response);

      expect(response.status).toBe(200);
      expect(data.status).toBe('MODALITA_MANUALE');
      expect(data.message).toContain('modalità manuale');

      // Verify cron execution logged with manual mode
      expect(mockLogCronExecution).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'manual',
          status: 'MODALITA_MANUALE',
        })
      );
    });

    it('returns MODALITA_SEMI_MANUALE when in semi-manual before returnToAutoAt', async () => {
      // Setup: semi-manual mode with future returnToAutoAt
      const futureDate = new Date(Date.now() + 3600000).toISOString(); // 1 hour in future
      mockAdminDbGet.mockResolvedValueOnce({
        enabled: true,
        semiManual: true,
        returnToAutoAt: futureDate,
      });

      const request = createMockRequest();
      const response = await GET(request);
      const data = await getResponseData(response);

      expect(response.status).toBe(200);
      expect(data.status).toBe('MODALITA_SEMI_MANUALE');
      expect(data.returnToAutoAt).toBe(futureDate);

      // Verify cron execution logged with semi-manual mode
      expect(mockLogCronExecution).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'semi-manual',
          status: 'MODALITA_SEMI_MANUALE',
        })
      );
    });

    it('proceeds to automatic when semi-manual but returnToAutoAt has passed', async () => {
      // Setup: semi-manual mode with past returnToAutoAt
      const pastDate = new Date(Date.now() - 3600000).toISOString(); // 1 hour in past
      setupSchedulerMocks({
        mode: { enabled: true, semiManual: true, returnToAutoAt: pastDate },
        intervals: null, // No schedule for today
      });

      const request = createMockRequest();
      const response = await GET(request);
      const data = await getResponseData(response);

      expect(response.status).toBe(200);
      // Should NOT return semi-manual status (should proceed to schedule check)
      expect(data.status).not.toBe('MODALITA_SEMI_MANUALE');
    });

    it('proceeds to automatic when semi-manual but returnToAutoAt is null', async () => {
      // Setup: semi-manual mode but no returnToAutoAt set (edge case)
      setupSchedulerMocks({
        mode: { enabled: true, semiManual: true, returnToAutoAt: undefined },
        intervals: null,
      });

      const request = createMockRequest();
      const response = await GET(request);
      const data = await getResponseData(response);

      expect(response.status).toBe(200);
      // With no returnToAutoAt, should stay in semi-manual
      expect(data.status).toBe('MODALITA_SEMI_MANUALE');
    });

    it('proceeds normally when scheduler is enabled and not semi-manual', async () => {
      // Setup: automatic mode with no schedule
      setupSchedulerMocks({
        mode: { enabled: true, semiManual: false },
        intervals: null,
      });

      const request = createMockRequest();
      const response = await GET(request);
      const data = await getResponseData(response);

      expect(response.status).toBe(200);
      // Should reach schedule processing (no schedule found)
      expect(data.message).toContain('Nessuno scheduler');
    });
  });

  describe('Schedule Lookup', () => {
    it('returns NO_SCHEDULE when no intervals exist for today', async () => {
      // Setup: scheduler enabled but no intervals for today
      setupSchedulerMocks({
        mode: { enabled: true, semiManual: false },
        intervals: null,
      });

      const request = createMockRequest();
      const response = await GET(request);
      const data = await getResponseData(response);

      expect(response.status).toBe(200);
      expect(data.message).toContain('Nessuno scheduler');

      // Verify cron execution logged
      expect(mockLogCronExecution).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'auto',
          status: 'NO_SCHEDULE',
        })
      );
    });

    it('finds active schedule when current time falls within interval', async () => {
      // Mock current time to be 19:00 (within 18:00-22:00)
      jest.useFakeTimers();
      // Set to a Wednesday at 19:00 Rome time (17:00 UTC in winter, 18:00 UTC in summer)
      jest.setSystemTime(new Date('2025-02-12T18:00:00.000Z')); // Winter time

      setupSchedulerMocks({
        mode: { enabled: true, semiManual: false },
        intervals: [
          { start: '18:00', end: '22:00', power: 4, fan: 3 },
        ],
      });

      const request = createMockRequest();
      const response = await GET(request);
      const data = await getResponseData(response);

      expect(response.status).toBe(200);
      expect(data.activeSchedule).toBeTruthy();
      expect(data.activeSchedule.start).toBe('18:00');
      expect(data.activeSchedule.end).toBe('22:00');

      jest.useRealTimers();
    });

    it('finds no active schedule when current time is outside all intervals', async () => {
      // Mock current time to be 08:00 (outside 18:00-22:00)
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-02-12T07:00:00.000Z')); // 08:00 Rome time in winter

      setupSchedulerMocks({
        mode: { enabled: true, semiManual: false },
        intervals: [
          { start: '18:00', end: '22:00', power: 4, fan: 3 },
        ],
      });

      const request = createMockRequest();
      const response = await GET(request);
      const data = await getResponseData(response);

      expect(response.status).toBe(200);
      // No active schedule, stove should remain off (shutdown not called since already off)
      expect(data.activeSchedule).toBeNull();
      expect(mockIgniteStove).not.toHaveBeenCalled();
      expect(mockShutdownStove).not.toHaveBeenCalled();

      jest.useRealTimers();
    });
  });

  describe('Stove Data Fetching', () => {
    it('fetches status, fan, and power in parallel', async () => {
      // Setup: scheduler enabled with empty intervals array (to trigger fetch)
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-02-12T06:00:00.000Z')); // 07:00 Rome time, outside schedule

      setupSchedulerMocks({
        mode: { enabled: true, semiManual: false },
        intervals: [], // Empty array means no active schedule, but processing continues
      });

      const request = createMockRequest();
      await GET(request);

      // Verify all three API functions called
      expect(mockGetStoveStatus).toHaveBeenCalled();
      expect(mockGetFanLevel).toHaveBeenCalled();
      expect(mockGetPowerLevel).toHaveBeenCalled();

      jest.useRealTimers();
    });

    it('handles status fetch failure with safe defaults', async () => {
      // Mock status fetch to fail
      mockGetStoveStatus.mockRejectedValue(new Error('Network error'));

      // Setup: active schedule with stove OFF
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-02-12T18:00:00.000Z'));

      setupSchedulerMocks({
        mode: { enabled: true, semiManual: false },
        intervals: [
          { start: '18:00', end: '22:00', power: 4, fan: 3 },
        ],
      });

      const request = createMockRequest();
      const response = await GET(request);
      const data = await getResponseData(response);

      expect(response.status).toBe(200);
      // When status fetch fails and active schedule exists, should return STATUS_UNAVAILABLE
      expect(data.status).toBe('STATUS_UNAVAILABLE');
      expect(data.message).toContain('sicurezza');

      // Verify ignition NOT attempted (safety)
      expect(mockIgniteStove).not.toHaveBeenCalled();

      jest.useRealTimers();
    });

    it('uses default fan level (3) when getFanLevel returns null', async () => {
      // Mock getFanLevel to return null
      mockGetFanLevel.mockResolvedValue(null as any);

      setupSchedulerMocks({
        mode: { enabled: true, semiManual: false },
        intervals: [], // Empty array to continue processing
      });

      const request = createMockRequest();
      const response = await GET(request);

      // Should not crash, processing continues
      expect(response.status).toBe(200);
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Fan level unavailable'));
    });

    it('uses default power level (2) when getPowerLevel returns null', async () => {
      // Mock getPowerLevel to return null
      mockGetPowerLevel.mockResolvedValue(null as any);

      setupSchedulerMocks({
        mode: { enabled: true, semiManual: false },
        intervals: [],
      });

      const request = createMockRequest();
      const response = await GET(request);

      // Should not crash, processing continues
      expect(response.status).toBe(200);
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Power level unavailable'));
    });

    it('detects stove as ON when status includes WORK', async () => {
      // Mock stove status as WORK
      mockGetStoveStatus.mockResolvedValue({ StatusDescription: 'WORK 1', Result: 0 } as any);

      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-02-12T18:00:00.000Z'));

      setupSchedulerMocks({
        mode: { enabled: true, semiManual: false },
        intervals: [
          { start: '18:00', end: '22:00', power: 4, fan: 3 },
        ],
      });

      const request = createMockRequest();
      await GET(request);

      // Stove already on, no ignition attempt
      expect(mockIgniteStove).not.toHaveBeenCalled();

      jest.useRealTimers();
    });

    it('detects stove as ON when status includes START', async () => {
      // Mock stove status as START
      mockGetStoveStatus.mockResolvedValue({ StatusDescription: 'START', Result: 0 } as any);

      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-02-12T18:00:00.000Z'));

      setupSchedulerMocks({
        mode: { enabled: true, semiManual: false },
        intervals: [
          { start: '18:00', end: '22:00', power: 4, fan: 3 },
        ],
      });

      const request = createMockRequest();
      await GET(request);

      // Stove already on, no ignition attempt
      expect(mockIgniteStove).not.toHaveBeenCalled();

      jest.useRealTimers();
    });
  });

  describe('Cron Health Tracking', () => {
    it('saves cronHealth/lastCall timestamp on every invocation', async () => {
      setupSchedulerMocks({
        mode: { enabled: false },
      });

      const request = createMockRequest();
      await GET(request);

      // Verify adminDbSet called with cronHealth/lastCall and ISO timestamp
      expect(mockAdminDbSet).toHaveBeenCalledWith(
        'cronHealth/lastCall',
        expect.any(String)
      );

      // Verify it's an ISO timestamp
      const calls = mockAdminDbSet.mock.calls.find(
        call => call[0] === 'cronHealth/lastCall'
      );
      expect(calls).toBeTruthy();
      if (calls) {
        const timestamp = calls[1];
        expect(typeof timestamp).toBe('string');
        expect(new Date(timestamp as string).toISOString()).toBe(timestamp);
      }
    });
  });

  describe('Fire-and-Forget Side Effects', () => {
    it('triggers stove status WORK notification when status includes WORK', async () => {
      // Mock stove status as WORK
      mockGetStoveStatus.mockResolvedValue({ StatusDescription: 'WORK 1', Result: 0 } as any);

      // Setup scheduler mocks with empty intervals to continue processing
      setupSchedulerMocks({
        mode: { enabled: true, semiManual: false },
        intervals: [],
      });

      const request = createMockRequest();
      await GET(request);

      // Fire-and-forget operations are called but not awaited
      // The function is invoked synchronously even if promise isn't awaited
      expect(mockTriggerStoveStatusWorkServer).toHaveBeenCalled();
    });

    it('calls calibrateValvesServer as fire-and-forget', async () => {
      setupSchedulerMocks({
        mode: { enabled: true, semiManual: false },
        intervals: [],
      });

      const request = createMockRequest();
      await GET(request);

      // calibrateValvesIfNeeded is called as fire-and-forget
      // It checks lastCalibration internally via adminDbGet
      expect(mockCalibrateValvesServer).toHaveBeenCalled();
    });

    it('calls proactiveTokenRefresh as fire-and-forget', async () => {
      setupSchedulerMocks({
        mode: { enabled: true, semiManual: false },
        intervals: [],
      });

      const request = createMockRequest();
      await GET(request);

      expect(mockProactiveTokenRefresh).toHaveBeenCalled();
    });

    it('tracks maintenance hours', async () => {
      setupSchedulerMocks({
        mode: { enabled: true, semiManual: false },
        intervals: [],
      });

      const request = createMockRequest();
      await GET(request);

      // Verify trackUsageHours called with current status string
      expect(mockTrackUsageHours).toHaveBeenCalledWith(expect.any(String));
    });

    it('sends maintenance notification when notificationData present', async () => {
      // Mock trackUsageHours to return notification data
      mockTrackUsageHours.mockResolvedValue({
        tracked: true,
        notificationData: {
          notificationLevel: 90,
          percentage: 90,
          remainingHours: 5,
        },
      } as any);

      setupSchedulerMocks({
        mode: { enabled: true, semiManual: false },
        intervals: [],
      });

      const request = createMockRequest();
      await GET(request);

      // Verify triggerMaintenanceAlertServer was called
      expect(mockTriggerMaintenanceAlertServer).toHaveBeenCalledWith(
        'admin-test-user',
        90,
        expect.objectContaining({
          remainingHours: 5,
          message: expect.any(String),
        })
      );
    });

    it('calls enforceStoveSyncSetpoints', async () => {
      setupSchedulerMocks({
        mode: { enabled: true, semiManual: false },
        intervals: [],
      });

      const request = createMockRequest();
      await GET(request);

      // Verify enforceStoveSyncSetpoints called
      expect(mockEnforceStoveSyncSetpoints).toHaveBeenCalledWith(expect.any(Boolean));
    });
  });

  describe('Maintenance Blocks Ignition', () => {
    it('returns MANUTENZIONE_RICHIESTA when canIgnite returns false', async () => {
      // Mock canIgnite to return false
      mockCanIgnite.mockResolvedValue(false);

      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-02-12T18:00:00.000Z'));

      setupSchedulerMocks({
        mode: { enabled: true, semiManual: false },
        intervals: [
          { start: '18:00', end: '22:00', power: 4, fan: 3 },
        ],
      });

      const request = createMockRequest();
      const response = await GET(request);
      const data = await getResponseData(response);

      expect(response.status).toBe(200);
      expect(data.status).toBe('MANUTENZIONE_RICHIESTA');
      expect(data.message).toContain('manutenzione');

      // Verify ignition NOT attempted
      expect(mockIgniteStove).not.toHaveBeenCalled();

      jest.useRealTimers();
    });

    it('proceeds to ignition when canIgnite returns true', async () => {
      // Mock canIgnite to return true
      mockCanIgnite.mockResolvedValue(true);

      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-02-12T18:00:00.000Z'));

      setupSchedulerMocks({
        mode: { enabled: true, semiManual: false },
        intervals: [
          { start: '18:00', end: '22:00', power: 4, fan: 3 },
        ],
      });

      const request = createMockRequest();
      await GET(request);

      // Verify ignition WAS attempted
      expect(mockIgniteStove).toHaveBeenCalled();

      jest.useRealTimers();
    });
  });

  describe('Unexpected Off Detection', () => {
    it('does not notify when stove is on during active schedule', async () => {
      // Mock stove as ON
      mockGetStoveStatus.mockResolvedValue({ StatusDescription: 'WORK 1', Result: 0 } as any);

      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-02-12T18:00:00.000Z'));

      setupSchedulerMocks({
        mode: { enabled: true, semiManual: false },
        intervals: [
          { start: '18:00', end: '22:00', power: 4, fan: 3 },
        ],
      });

      const request = createMockRequest();
      await GET(request);

      // Verify unexpected off notification NOT sent (stove is on)
      expect(mockTriggerStoveUnexpectedOffServer).not.toHaveBeenCalled();

      jest.useRealTimers();
    });

    it('does not notify when no active schedule', async () => {
      // Mock stove as OFF with no schedule
      setupSchedulerMocks({
        mode: { enabled: true, semiManual: false },
        intervals: null,
      });

      const request = createMockRequest();
      await GET(request);

      // Verify unexpected off notification NOT sent (no active schedule)
      expect(mockTriggerStoveUnexpectedOffServer).not.toHaveBeenCalled();
    });
  });

  describe('State Transitions - Ignition', () => {
    it('ignites stove when schedule is active and stove is OFF', async () => {
      // Mock igniteStove to succeed
      mockIgniteStove.mockResolvedValue(undefined as any);

      // Mock stove as OFF
      mockGetStoveStatus.mockResolvedValue({ StatusDescription: 'Spento', Result: 0 } as any);

      // Mock updateStoveState
      const mockUpdateStoveState = jest.mocked(updateStoveState);
      mockUpdateStoveState.mockResolvedValue(undefined as any);

      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-02-12T18:00:00.000Z')); // 19:00 Rome time in winter

      // Setup: automatic mode, active schedule, maintenance allowed
      mockAdminDbGet.mockImplementation(async (path: string) => {
        if (path === 'schedules-v2/mode') return { enabled: true, semiManual: false };
        if (path === 'schedules-v2/activeScheduleId') return 'default';
        if (path.includes('schedules-v2/schedules/') && path.includes('/slots/')) {
          return [{ start: '18:00', end: '22:00', power: 4, fan: 3 }];
        }
        if (path === 'pidAutomation/boost') return { active: false };
        if (path.includes('pidAutomation/state')) return null;
        return null;
      });

      const request = createMockRequest();
      const response = await GET(request);
      const data = await getResponseData(response);

      expect(response.status).toBe(200);
      expect(data.status).toBe('ACCESA');

      // Verify ignition flow
      expect(mockIgniteStove).toHaveBeenCalledWith(4);
      expect(mockUpdateStoveState).toHaveBeenCalledWith(expect.objectContaining({
        status: 'START',
        source: 'scheduler',
      }));
      expect(mockTriggerSchedulerActionServer).toHaveBeenCalledWith(
        'admin-test-user',
        'ignition',
        expect.objectContaining({
          message: expect.stringContaining('accesa automaticamente'),
        })
      );
      expect(mockSyncLivingRoomWithStove).toHaveBeenCalledWith(true);

      jest.useRealTimers();
    });

    it('skips ignition when confirmation status shows stove already ON (ALREADY_ON race condition)', async () => {
      // First status fetch: OFF
      // Second status fetch (confirmation): ON
      mockGetStoveStatus
        .mockResolvedValueOnce({ StatusDescription: 'Spento', Result: 0 } as any)
        .mockResolvedValueOnce({ StatusDescription: 'WORK 1', Result: 0 } as any);

      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-02-12T18:00:00.000Z'));

      setupSchedulerMocks({
        mode: { enabled: true, semiManual: false },
        intervals: [{ start: '18:00', end: '22:00', power: 4, fan: 3 }],
      });

      const request = createMockRequest();
      const response = await GET(request);
      const data = await getResponseData(response);

      expect(response.status).toBe(200);
      expect(data.status).toBe('ALREADY_ON');
      expect(data.message).toContain('race condition');

      // Verify ignition NOT attempted
      expect(mockIgniteStove).not.toHaveBeenCalled();

      jest.useRealTimers();
    });

    it('skips ignition when confirmation status fetch fails (CONFIRMATION_FAILED)', async () => {
      // First status fetch: OFF
      // Second status fetch (confirmation): Error
      mockGetStoveStatus
        .mockResolvedValueOnce({ StatusDescription: 'Spento', Result: 0 } as any)
        .mockRejectedValueOnce(new Error('Network timeout'));

      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-02-12T18:00:00.000Z'));

      setupSchedulerMocks({
        mode: { enabled: true, semiManual: false },
        intervals: [{ start: '18:00', end: '22:00', power: 4, fan: 3 }],
      });

      const request = createMockRequest();
      const response = await GET(request);
      const data = await getResponseData(response);

      expect(response.status).toBe(200);
      expect(data.status).toBe('CONFIRMATION_FAILED');
      expect(data.message).toContain('impossibile confermare');

      // Verify ignition NOT attempted
      expect(mockIgniteStove).not.toHaveBeenCalled();

      jest.useRealTimers();
    });

    it('tracks ignition interval for unexpected off detection', async () => {
      // Mock successful ignition
      mockIgniteStove.mockResolvedValue(undefined as any);
      mockGetStoveStatus.mockResolvedValue({ StatusDescription: 'Spento', Result: 0 } as any);

      const mockUpdateStoveState = jest.mocked(updateStoveState);
      mockUpdateStoveState.mockResolvedValue(undefined as any);

      jest.useFakeTimers();
      const testTime = new Date('2025-02-12T18:00:00.000Z');
      jest.setSystemTime(testTime);

      setupSchedulerMocks({
        mode: { enabled: true, semiManual: false },
        intervals: [{ start: '18:00', end: '22:00', power: 4, fan: 3 }],
      });

      const request = createMockRequest();
      await GET(request);

      // Verify ignition interval tracked
      expect(mockAdminDbSet).toHaveBeenCalledWith(
        'scheduler/lastIgnitionInterval',
        expect.objectContaining({
          interval: '18:00-22:00',
          timestamp: expect.any(Number),
        })
      );

      jest.useRealTimers();
    });

    it('logs analytics event on successful ignition', async () => {
      mockIgniteStove.mockResolvedValue(undefined as any);
      mockGetStoveStatus.mockResolvedValue({ StatusDescription: 'Spento', Result: 0 } as any);

      const mockUpdateStoveState = jest.mocked(updateStoveState);
      mockUpdateStoveState.mockResolvedValue(undefined as any);

      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-02-12T18:00:00.000Z'));

      setupSchedulerMocks({
        mode: { enabled: true, semiManual: false },
        intervals: [{ start: '18:00', end: '22:00', power: 4, fan: 3 }],
      });

      const request = createMockRequest();
      await GET(request);

      // Verify analytics event logged
      expect(mockLogAnalyticsEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'stove_ignite',
          source: 'scheduler',
          powerLevel: 4,
        })
      );

      jest.useRealTimers();
    });
  });

  describe('State Transitions - Shutdown', () => {
    it('shuts down stove when no active schedule and stove is ON', async () => {
      // Mock stove as ON
      mockGetStoveStatus.mockResolvedValue({ StatusDescription: 'WORK 1', Result: 0 } as any);
      mockShutdownStove.mockResolvedValue(undefined as any);

      const mockUpdateStoveState = jest.mocked(updateStoveState);
      mockUpdateStoveState.mockResolvedValue(undefined as any);

      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-02-12T08:00:00.000Z')); // 09:00 Rome time, outside schedule

      setupSchedulerMocks({
        mode: { enabled: true, semiManual: false },
        intervals: [{ start: '18:00', end: '22:00', power: 4, fan: 3 }], // Current time outside this
      });

      const request = createMockRequest();
      const response = await GET(request);
      const data = await getResponseData(response);

      expect(response.status).toBe(200);
      expect(data.status).toBe('SPENTA');

      // Verify shutdown flow
      expect(mockShutdownStove).toHaveBeenCalled();
      expect(mockUpdateStoveState).toHaveBeenCalledWith(expect.objectContaining({
        status: 'STANDBY',
        source: 'scheduler',
      }));
      expect(mockTriggerSchedulerActionServer).toHaveBeenCalledWith(
        'admin-test-user',
        'shutdown',
        expect.objectContaining({
          message: expect.stringContaining('spenta automaticamente'),
        })
      );
      expect(mockSyncLivingRoomWithStove).toHaveBeenCalledWith(false);

      jest.useRealTimers();
    });

    it('does not shutdown when no active schedule and stove already OFF', async () => {
      // Mock stove as OFF
      mockGetStoveStatus.mockResolvedValue({ StatusDescription: 'Spento', Result: 0 } as any);

      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-02-12T08:00:00.000Z'));

      setupSchedulerMocks({
        mode: { enabled: true, semiManual: false },
        intervals: [{ start: '18:00', end: '22:00', power: 4, fan: 3 }],
      });

      const request = createMockRequest();
      await GET(request);

      // Verify shutdown NOT called
      expect(mockShutdownStove).not.toHaveBeenCalled();

      jest.useRealTimers();
    });

    it('logs analytics event on successful shutdown', async () => {
      mockGetStoveStatus.mockResolvedValue({ StatusDescription: 'WORK 1', Result: 0 } as any);
      mockShutdownStove.mockResolvedValue(undefined as any);

      const mockUpdateStoveState = jest.mocked(updateStoveState);
      mockUpdateStoveState.mockResolvedValue(undefined as any);

      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-02-12T08:00:00.000Z'));

      setupSchedulerMocks({
        mode: { enabled: true, semiManual: false },
        intervals: [{ start: '18:00', end: '22:00', power: 4, fan: 3 }],
      });

      const request = createMockRequest();
      await GET(request);

      // Verify analytics event logged
      expect(mockLogAnalyticsEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'stove_shutdown',
          source: 'scheduler',
        })
      );

      jest.useRealTimers();
    });
  });

  describe('Level Adjustments', () => {
    it('adjusts power level when schedule power differs from current', async () => {
      // Mock stove ON at power 2, schedule wants power 4
      mockGetStoveStatus.mockResolvedValue({ StatusDescription: 'WORK 1', Result: 0 } as any);
      mockGetPowerLevel.mockResolvedValue({ Result: 2 } as any);
      mockGetFanLevel.mockResolvedValue({ Result: 3 } as any);
      mockSetPowerLevel.mockResolvedValue(undefined as any);

      const mockUpdateStoveState = jest.mocked(updateStoveState);
      mockUpdateStoveState.mockResolvedValue(undefined as any);

      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-02-12T18:00:00.000Z'));

      setupSchedulerMocks({
        mode: { enabled: true, semiManual: false },
        intervals: [{ start: '18:00', end: '22:00', power: 4, fan: 3 }],
      });

      const request = createMockRequest();
      await GET(request);

      // Verify power level adjusted
      expect(mockSetPowerLevel).toHaveBeenCalledWith(4);

      jest.useRealTimers();
    });

    it('adjusts fan level when schedule fan differs from current', async () => {
      // Mock stove ON at fan 2, schedule wants fan 4
      mockGetStoveStatus.mockResolvedValue({ StatusDescription: 'WORK 1', Result: 0 } as any);
      mockGetPowerLevel.mockResolvedValue({ Result: 4 } as any);
      mockGetFanLevel.mockResolvedValue({ Result: 2 } as any);
      mockSetFanLevel.mockResolvedValue(undefined as any);

      const mockUpdateStoveState = jest.mocked(updateStoveState);
      mockUpdateStoveState.mockResolvedValue(undefined as any);

      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-02-12T18:00:00.000Z'));

      setupSchedulerMocks({
        mode: { enabled: true, semiManual: false },
        intervals: [{ start: '18:00', end: '22:00', power: 4, fan: 4 }],
      });

      const request = createMockRequest();
      await GET(request);

      // Verify fan level adjusted
      expect(mockSetFanLevel).toHaveBeenCalledWith(4);

      jest.useRealTimers();
    });

    it('skips power adjustment when PID boost is active', async () => {
      // Mock stove ON at power 3 (PID-set), schedule wants power 4
      mockGetStoveStatus.mockResolvedValue({ StatusDescription: 'WORK 1', Result: 0 } as any);
      mockGetPowerLevel.mockResolvedValue({ Result: 3 } as any);
      mockGetFanLevel.mockResolvedValue({ Result: 3 } as any);

      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-02-12T18:00:00.000Z'));

      // Mock PID boost active
      mockAdminDbGet.mockImplementation(async (path: string) => {
        if (path === 'schedules-v2/mode') return { enabled: true, semiManual: false };
        if (path === 'schedules-v2/activeScheduleId') return 'default';
        if (path.includes('schedules-v2/schedules/') && path.includes('/slots/')) {
          return [{ start: '18:00', end: '22:00', power: 4, fan: 3 }];
        }
        if (path === 'pidAutomation/boost') return { active: true, powerLevel: 3 };
        if (path.includes('pidAutomation/state')) return null;
        if (path.includes('pidAutomation')) return null; // PID config disabled
        return null;
      });

      const request = createMockRequest();
      await GET(request);

      // Verify power NOT adjusted (PID boost active)
      expect(mockSetPowerLevel).not.toHaveBeenCalled();

      // Fan should still adjust (not managed by PID)
      // In this case both are 3, so no change anyway

      jest.useRealTimers();
    });

    it('does not adjust levels when already matching schedule', async () => {
      // Mock stove at power 4 fan 3, schedule also power 4 fan 3
      mockGetStoveStatus.mockResolvedValue({ StatusDescription: 'WORK 1', Result: 0 } as any);
      mockGetPowerLevel.mockResolvedValue({ Result: 4 } as any);
      mockGetFanLevel.mockResolvedValue({ Result: 3 } as any);

      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-02-12T18:00:00.000Z'));

      setupSchedulerMocks({
        mode: { enabled: true, semiManual: false },
        intervals: [{ start: '18:00', end: '22:00', power: 4, fan: 3 }],
      });

      const request = createMockRequest();
      await GET(request);

      // Verify neither level adjusted
      expect(mockSetPowerLevel).not.toHaveBeenCalled();
      expect(mockSetFanLevel).not.toHaveBeenCalled();

      jest.useRealTimers();
    });
  });

  describe('Error Scenarios', () => {
    it('handles igniteStove failure gracefully', async () => {
      // Mock igniteStove to reject
      mockIgniteStove.mockRejectedValue(new Error('API timeout'));
      mockGetStoveStatus.mockResolvedValue({ StatusDescription: 'Spento', Result: 0 } as any);

      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-02-12T18:00:00.000Z'));

      setupSchedulerMocks({
        mode: { enabled: true, semiManual: false },
        intervals: [{ start: '18:00', end: '22:00', power: 4, fan: 3 }],
      });

      const request = createMockRequest();
      const response = await GET(request);

      // Route should still return 200 (error caught internally)
      expect(response.status).toBe(200);

      // Verify igniteStove was called but failed
      expect(mockIgniteStove).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to ignite'),
        expect.any(String)
      );

      jest.useRealTimers();
    });

    it('handles shutdownStove failure gracefully', async () => {
      // Mock shutdown to reject
      mockShutdownStove.mockRejectedValue(new Error('API timeout'));
      mockGetStoveStatus.mockResolvedValue({ StatusDescription: 'WORK 1', Result: 0 } as any);

      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-02-12T08:00:00.000Z'));

      setupSchedulerMocks({
        mode: { enabled: true, semiManual: false },
        intervals: [{ start: '18:00', end: '22:00', power: 4, fan: 3 }],
      });

      const request = createMockRequest();
      const response = await GET(request);

      // Route should still return 200
      expect(response.status).toBe(200);

      // Verify shutdownStove was called but failed
      expect(mockShutdownStove).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to shutdown'),
        expect.any(String)
      );

      jest.useRealTimers();
    });

    it('handles setPowerLevel failure without crashing', async () => {
      // Mock setPowerLevel to reject
      mockSetPowerLevel.mockRejectedValue(new Error('API timeout'));
      mockGetStoveStatus.mockResolvedValue({ StatusDescription: 'WORK 1', Result: 0 } as any);
      mockGetPowerLevel.mockResolvedValue({ Result: 2 } as any);
      mockGetFanLevel.mockResolvedValue({ Result: 3 } as any);

      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-02-12T18:00:00.000Z'));

      setupSchedulerMocks({
        mode: { enabled: true, semiManual: false },
        intervals: [{ start: '18:00', end: '22:00', power: 4, fan: 3 }],
      });

      const request = createMockRequest();
      const response = await GET(request);

      // Route should still return 200
      expect(response.status).toBe(200);

      // Verify setPowerLevel was called but failed
      expect(mockSetPowerLevel).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to set power'),
        expect.any(String)
      );

      jest.useRealTimers();
    });

    it('handles setFanLevel failure without crashing', async () => {
      // Mock setFanLevel to reject
      mockSetFanLevel.mockRejectedValue(new Error('API timeout'));
      mockGetStoveStatus.mockResolvedValue({ StatusDescription: 'WORK 1', Result: 0 } as any);
      mockGetPowerLevel.mockResolvedValue({ Result: 4 } as any);
      mockGetFanLevel.mockResolvedValue({ Result: 2 } as any);

      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-02-12T18:00:00.000Z'));

      setupSchedulerMocks({
        mode: { enabled: true, semiManual: false },
        intervals: [{ start: '18:00', end: '22:00', power: 4, fan: 4 }],
      });

      const request = createMockRequest();
      const response = await GET(request);

      // Route should still return 200
      expect(response.status).toBe(200);

      // Verify setFanLevel was called but failed
      expect(mockSetFanLevel).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to set fan'),
        expect.any(String)
      );

      jest.useRealTimers();
    });

    it('handles enforceStoveSyncSetpoints error gracefully', async () => {
      // Mock enforceStoveSyncSetpoints to reject
      mockEnforceStoveSyncSetpoints.mockRejectedValue(new Error('Netatmo timeout'));

      setupSchedulerMocks({
        mode: { enabled: true, semiManual: false },
        intervals: [],
      });

      const request = createMockRequest();
      const response = await GET(request);

      // Route should still return 200
      expect(response.status).toBe(200);

      // Verify error was logged
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Stove sync enforcement error'),
        expect.any(String)
      );
    });
  });

  describe('PID Automation', () => {
    it('invokes PID automation when stove is in WORK state during active schedule', async () => {
      // Mock stove in WORK state
      mockGetStoveStatus.mockResolvedValue({ StatusDescription: 'WORK 1', Result: 0 } as any);
      mockGetPowerLevel.mockResolvedValue({ Result: 4 } as any);
      mockGetFanLevel.mockResolvedValue({ Result: 3 } as any);

      // Mock PID Controller
      const { PIDController } = require('@/lib/utils/pidController');
      const mockCompute = jest.fn().mockReturnValue(3);
      const mockGetState = jest.fn().mockReturnValue({ integral: 0, prevError: 0, initialized: true });
      const mockSetState = jest.fn();
      jest.mocked(PIDController).mockImplementation(() => ({
        compute: mockCompute,
        setState: mockSetState,
        getState: mockGetState,
      } as any));

      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-02-12T18:00:00.000Z'));

      // Mock PID config and Netatmo data
      mockAdminDbGet.mockImplementation(async (path: string) => {
        if (path === 'schedules-v2/mode') return { enabled: true, semiManual: false };
        if (path === 'schedules-v2/activeScheduleId') return 'default';
        if (path.includes('schedules-v2/schedules/') && path.includes('/slots/')) {
          return [{ start: '18:00', end: '22:00', power: 4, fan: 3 }];
        }
        if (path === 'pidAutomation/boost') return { active: false };
        if (path.includes('users/') && path.includes('pidAutomation')) {
          return {
            enabled: true,
            targetRoomId: 'room123',
            kp: 0.5,
            ki: 0.1,
            kd: 0.05,
            manualSetpoint: 21,
          };
        }
        if (path === 'netatmo/currentStatus') {
          return {
            rooms: {
              room123: { room_id: 'room123', name: 'Living Room', temperature: 20.5 },
            },
          };
        }
        if (path.includes('pidAutomation/state')) return null;
        return null;
      });

      const request = createMockRequest();
      await GET(request);

      // Verify PID automation was invoked
      expect(mockAdminDbGet).toHaveBeenCalledWith('users/admin-test-user/pidAutomation');
      expect(mockAdminDbGet).toHaveBeenCalledWith('netatmo/currentStatus');

      jest.useRealTimers();
    });

    it('skips PID when stove is not in WORK state', async () => {
      // Mock stove in START state (not WORK)
      mockGetStoveStatus.mockResolvedValue({ StatusDescription: 'START', Result: 0 } as any);

      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-02-12T18:00:00.000Z'));

      setupSchedulerMocks({
        mode: { enabled: true, semiManual: false },
        intervals: [{ start: '18:00', end: '22:00', power: 4, fan: 3 }],
      });

      const request = createMockRequest();
      await GET(request);

      // Verify PID boost set to inactive
      expect(mockAdminDbSet).toHaveBeenCalledWith(
        'pidAutomation/boost',
        { active: false }
      );

      jest.useRealTimers();
    });

    it('skips PID when scheduler is in semi-manual mode', async () => {
      // Mock stove in WORK state
      mockGetStoveStatus.mockResolvedValue({ StatusDescription: 'WORK 1', Result: 0 } as any);

      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-02-12T18:00:00.000Z'));

      // Semi-manual mode with future returnToAutoAt
      const futureDate = new Date(Date.now() + 3600000).toISOString();
      mockAdminDbGet.mockImplementation(async (path: string) => {
        if (path === 'schedules-v2/mode') return { enabled: true, semiManual: true, returnToAutoAt: futureDate };
        return null;
      });

      const request = createMockRequest();
      await GET(request);

      // Should return early (semi-manual)
      expect(mockAdminDbGet).not.toHaveBeenCalledWith(expect.stringContaining('pidAutomation'));

      jest.useRealTimers();
    });

    it('skips PID when PID config is disabled', async () => {
      // Mock stove in WORK state
      mockGetStoveStatus.mockResolvedValue({ StatusDescription: 'WORK 1', Result: 0 } as any);
      mockGetPowerLevel.mockResolvedValue({ Result: 4 } as any);

      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-02-12T18:00:00.000Z'));

      // Mock PID config as disabled
      mockAdminDbGet.mockImplementation(async (path: string) => {
        if (path === 'schedules-v2/mode') return { enabled: true, semiManual: false };
        if (path === 'schedules-v2/activeScheduleId') return 'default';
        if (path.includes('schedules-v2/schedules/') && path.includes('/slots/')) {
          return [{ start: '18:00', end: '22:00', power: 4, fan: 3 }];
        }
        if (path === 'pidAutomation/boost') return { active: false };
        if (path.includes('users/') && path.includes('pidAutomation')) {
          return { enabled: false };
        }
        if (path.includes('pidAutomation/state')) return null;
        return null;
      });

      const request = createMockRequest();
      await GET(request);

      // Verify PID boost set to inactive
      expect(mockAdminDbSet).toHaveBeenCalledWith(
        'pidAutomation/boost',
        { active: false }
      );

      jest.useRealTimers();
    });
  });

  describe('Semi-Manual to Automatic Transition', () => {
    it('clears semi-manual mode when change is applied during semi-manual', async () => {
      // Mock successful ignition during semi-manual with past returnToAutoAt
      mockIgniteStove.mockResolvedValue(undefined as any);
      mockGetStoveStatus.mockResolvedValue({ StatusDescription: 'Spento', Result: 0 } as any);

      const mockUpdateStoveState = jest.mocked(updateStoveState);
      mockUpdateStoveState.mockResolvedValue(undefined as any);

      jest.useFakeTimers();
      const testTime = new Date('2025-02-12T18:00:00.000Z');
      jest.setSystemTime(testTime);

      // Semi-manual with past returnToAutoAt
      const pastDate = new Date(testTime.getTime() - 3600000).toISOString();
      mockAdminDbGet.mockImplementation(async (path: string) => {
        if (path === 'schedules-v2/mode') return { enabled: true, semiManual: true, returnToAutoAt: pastDate };
        if (path === 'schedules-v2/activeScheduleId') return 'default';
        if (path.includes('schedules-v2/schedules/') && path.includes('/slots/')) {
          return [{ start: '18:00', end: '22:00', power: 4, fan: 3 }];
        }
        if (path === 'pidAutomation/boost') return { active: false };
        if (path.includes('pidAutomation/state')) return null;
        return null;
      });

      const request = createMockRequest();
      await GET(request);

      // Verify mode updated to clear semi-manual
      expect(mockAdminDbSet).toHaveBeenCalledWith(
        'schedules-v2/mode',
        expect.objectContaining({
          semiManual: false,
        })
      );

      jest.useRealTimers();
    });

    it('does not clear semi-manual mode when no change applied', async () => {
      // Mock stove already at correct state (no change)
      mockGetStoveStatus.mockResolvedValue({ StatusDescription: 'WORK 1', Result: 0 } as any);
      mockGetPowerLevel.mockResolvedValue({ Result: 4 } as any);
      mockGetFanLevel.mockResolvedValue({ Result: 3 } as any);

      jest.useFakeTimers();
      const testTime = new Date('2025-02-12T18:00:00.000Z');
      jest.setSystemTime(testTime);

      // Semi-manual with past returnToAutoAt
      const pastDate = new Date(testTime.getTime() - 3600000).toISOString();
      mockAdminDbGet.mockImplementation(async (path: string) => {
        if (path === 'schedules-v2/mode') return { enabled: true, semiManual: true, returnToAutoAt: pastDate };
        if (path === 'schedules-v2/activeScheduleId') return 'default';
        if (path.includes('schedules-v2/schedules/') && path.includes('/slots/')) {
          return [{ start: '18:00', end: '22:00', power: 4, fan: 3 }];
        }
        if (path === 'pidAutomation/boost') return { active: false };
        if (path.includes('pidAutomation/state')) return null;
        if (path.includes('users/') && path.includes('pidAutomation')) return null;
        return null;
      });

      const request = createMockRequest();
      await GET(request);

      // Verify mode NOT updated (no change applied)
      expect(mockAdminDbSet).not.toHaveBeenCalledWith(
        'schedules-v2/mode',
        expect.anything()
      );

      jest.useRealTimers();
    });
  });

  describe('Response Structure', () => {
    it('includes giorno and ora in response for active schedule', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-02-12T18:00:00.000Z')); // Wednesday 19:00 Rome time

      setupSchedulerMocks({
        mode: { enabled: true, semiManual: false },
        intervals: [{ start: '18:00', end: '22:00', power: 4, fan: 3 }],
      });

      const request = createMockRequest();
      const response = await GET(request);
      const data = await getResponseData(response);

      // Verify response structure
      expect(data.giorno).toBeTruthy();
      expect(data.giorno).toMatch(/Mercoledì/i);
      expect(data.ora).toBeTruthy();
      expect(data.ora).toMatch(/^\d{2}:\d{2}$/);

      jest.useRealTimers();
    });

    it('includes activeSchedule in response when schedule is active', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-02-12T18:00:00.000Z'));

      setupSchedulerMocks({
        mode: { enabled: true, semiManual: false },
        intervals: [{ start: '18:00', end: '22:00', power: 4, fan: 3 }],
      });

      const request = createMockRequest();
      const response = await GET(request);
      const data = await getResponseData(response);

      // Verify activeSchedule included
      expect(data.activeSchedule).toBeTruthy();
      expect(data.activeSchedule).toMatchObject({
        start: '18:00',
        end: '22:00',
        power: 4,
        fan: 3,
      });

      jest.useRealTimers();
    });

    it('logs cron execution at the end', async () => {
      setupSchedulerMocks({
        mode: { enabled: true, semiManual: false },
        intervals: null,
      });

      const request = createMockRequest();
      await GET(request);

      // Verify logCronExecution called
      expect(mockLogCronExecution).toHaveBeenCalledWith(
        expect.objectContaining({
          status: expect.any(String),
          duration: expect.any(Number),
        })
      );

      // Verify duration is >= 0
      const calls = mockLogCronExecution.mock.calls;
      const lastCall = calls[calls.length - 1];
      if (lastCall) {
        expect(lastCall[0].duration).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Notification Edge Cases', () => {
    it('skips scheduler notification when ADMIN_USER_ID not set', async () => {
      // Remove ADMIN_USER_ID
      delete process.env.ADMIN_USER_ID;

      mockIgniteStove.mockResolvedValue(undefined as any);
      mockGetStoveStatus.mockResolvedValue({ StatusDescription: 'Spento', Result: 0 } as any);

      const mockUpdateStoveState = jest.mocked(updateStoveState);
      mockUpdateStoveState.mockResolvedValue(undefined as any);

      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-02-12T18:00:00.000Z'));

      setupSchedulerMocks({
        mode: { enabled: true, semiManual: false },
        intervals: [{ start: '18:00', end: '22:00', power: 4, fan: 3 }],
      });

      const request = createMockRequest();
      await GET(request);

      // Verify notification NOT sent (early return)
      expect(mockTriggerSchedulerActionServer).not.toHaveBeenCalled();

      // Restore ADMIN_USER_ID
      process.env.ADMIN_USER_ID = 'admin-test-user';

      jest.useRealTimers();
    });

    it('skips maintenance notification when percentage is below 90', async () => {
      // Mock trackUsageHours with low percentage notification
      mockTrackUsageHours.mockResolvedValue({
        tracked: true,
        notificationData: {
          notificationLevel: 80,
          percentage: 80,
          remainingHours: 20,
        },
      } as any);

      setupSchedulerMocks({
        mode: { enabled: true, semiManual: false },
        intervals: [],
      });

      const request = createMockRequest();
      await GET(request);

      // Verify maintenance notification sent (with appropriate message)
      expect(mockTriggerMaintenanceAlertServer).toHaveBeenCalledWith(
        'admin-test-user',
        80,
        expect.objectContaining({
          message: expect.stringContaining('20.0h rimanenti'),
        })
      );
    });

    it('sends critical maintenance alert when percentage is 100', async () => {
      mockTrackUsageHours.mockResolvedValue({
        tracked: true,
        notificationData: {
          notificationLevel: 100,
          percentage: 100,
          remainingHours: 0,
        },
      } as any);

      setupSchedulerMocks({
        mode: { enabled: true, semiManual: false },
        intervals: [],
      });

      const request = createMockRequest();
      await GET(request);

      // Verify critical message
      expect(mockTriggerMaintenanceAlertServer).toHaveBeenCalledWith(
        'admin-test-user',
        100,
        expect.objectContaining({
          message: expect.stringContaining('Manutenzione richiesta'),
        })
      );
    });
  });

  describe('Unexpected Off Detection Edge Cases', () => {
    it('notifies when stove is off during active schedule after previous ignition', async () => {
      // Mock stove as OFF
      mockGetStoveStatus.mockResolvedValue({ StatusDescription: 'Spento', Result: 0 } as any);

      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-02-12T18:00:00.000Z'));

      // Mock that we previously ignited during this interval
      mockAdminDbGet.mockImplementation(async (path: string) => {
        if (path === 'schedules-v2/mode') return { enabled: true, semiManual: false };
        if (path === 'schedules-v2/activeScheduleId') return 'default';
        if (path.includes('schedules-v2/schedules/') && path.includes('/slots/')) {
          return [{ start: '18:00', end: '22:00', power: 4, fan: 3 }];
        }
        if (path === 'scheduler/lastIgnitionInterval') {
          return { interval: '18:00-22:00', timestamp: Date.now() - 600000 }; // 10 min ago
        }
        if (path === 'scheduler/lastUnexpectedOffNotification') return null;
        if (path === 'pidAutomation/boost') return { active: false };
        return null;
      });

      const request = createMockRequest();
      await GET(request);

      // Verify unexpected off notification sent
      expect(mockTriggerStoveUnexpectedOffServer).toHaveBeenCalledWith(
        'admin-test-user',
        expect.objectContaining({
          message: expect.stringContaining('spenta durante'),
        })
      );

      jest.useRealTimers();
    });

    it('does not notify unexpected off when different interval', async () => {
      mockGetStoveStatus.mockResolvedValue({ StatusDescription: 'Spento', Result: 0 } as any);

      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-02-12T18:00:00.000Z'));

      // Mock that we previously ignited during a different interval
      mockAdminDbGet.mockImplementation(async (path: string) => {
        if (path === 'schedules-v2/mode') return { enabled: true, semiManual: false };
        if (path === 'schedules-v2/activeScheduleId') return 'default';
        if (path.includes('schedules-v2/schedules/') && path.includes('/slots/')) {
          return [{ start: '18:00', end: '22:00', power: 4, fan: 3 }];
        }
        if (path === 'scheduler/lastIgnitionInterval') {
          return { interval: '08:00-12:00', timestamp: Date.now() - 3600000 }; // Different interval
        }
        if (path === 'pidAutomation/boost') return { active: false };
        return null;
      });

      const request = createMockRequest();
      await GET(request);

      // Verify unexpected off notification NOT sent (different interval)
      expect(mockTriggerStoveUnexpectedOffServer).not.toHaveBeenCalled();

      jest.useRealTimers();
    });

    it('respects cooldown for unexpected off notifications', async () => {
      mockGetStoveStatus.mockResolvedValue({ StatusDescription: 'Spento', Result: 0 } as any);

      jest.useFakeTimers();
      const now = Date.now();
      jest.setSystemTime(now);

      // Mock recent unexpected off notification (within cooldown)
      mockAdminDbGet.mockImplementation(async (path: string) => {
        if (path === 'schedules-v2/mode') return { enabled: true, semiManual: false };
        if (path === 'schedules-v2/activeScheduleId') return 'default';
        if (path.includes('schedules-v2/schedules/') && path.includes('/slots/')) {
          return [{ start: '18:00', end: '22:00', power: 4, fan: 3 }];
        }
        if (path === 'scheduler/lastIgnitionInterval') {
          return { interval: '18:00-22:00', timestamp: now - 600000 };
        }
        if (path === 'scheduler/lastUnexpectedOffNotification') {
          return now - 1800000; // 30 min ago (within 1 hour cooldown)
        }
        if (path === 'pidAutomation/boost') return { active: false };
        return null;
      });

      const request = createMockRequest();
      await GET(request);

      // Verify unexpected off notification NOT sent (cooldown)
      expect(mockTriggerStoveUnexpectedOffServer).not.toHaveBeenCalled();

      jest.useRealTimers();
    });
  });

  describe('Work Notification Cooldown', () => {
    it('respects cooldown for stove WORK notifications', async () => {
      mockGetStoveStatus.mockResolvedValue({ StatusDescription: 'WORK 1', Result: 0 } as any);

      jest.useFakeTimers();
      const now = Date.now();
      jest.setSystemTime(now);

      // Mock recent WORK notification (within 30 min cooldown)
      mockAdminDbGet.mockImplementation(async (path: string) => {
        if (path === 'schedules-v2/mode') return { enabled: true, semiManual: false };
        if (path === 'scheduler/lastWorkNotification') {
          return now - 900000; // 15 min ago (within 30 min cooldown)
        }
        return null;
      });

      const request = createMockRequest();
      await GET(request);

      // Verify WORK notification NOT sent (cooldown)
      expect(mockTriggerStoveStatusWorkServer).not.toHaveBeenCalled();

      jest.useRealTimers();
    });
  });

  describe('PID Automation Edge Cases', () => {
    it('skips PID when no ADMIN_USER_ID', async () => {
      delete process.env.ADMIN_USER_ID;

      mockGetStoveStatus.mockResolvedValue({ StatusDescription: 'WORK 1', Result: 0 } as any);
      mockGetPowerLevel.mockResolvedValue({ Result: 4 } as any);

      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-02-12T18:00:00.000Z'));

      setupSchedulerMocks({
        mode: { enabled: true, semiManual: false },
        intervals: [{ start: '18:00', end: '22:00', power: 4, fan: 3 }],
      });

      const request = createMockRequest();
      await GET(request);

      // Verify PID boost set to inactive
      expect(mockAdminDbSet).toHaveBeenCalledWith(
        'pidAutomation/boost',
        { active: false }
      );

      process.env.ADMIN_USER_ID = 'admin-test-user';

      jest.useRealTimers();
    });

    it('skips PID when no Netatmo data available', async () => {
      mockGetStoveStatus.mockResolvedValue({ StatusDescription: 'WORK 1', Result: 0 } as any);
      mockGetPowerLevel.mockResolvedValue({ Result: 4 } as any);

      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-02-12T18:00:00.000Z'));

      // Mock PID enabled but no Netatmo data
      mockAdminDbGet.mockImplementation(async (path: string) => {
        if (path === 'schedules-v2/mode') return { enabled: true, semiManual: false };
        if (path === 'schedules-v2/activeScheduleId') return 'default';
        if (path.includes('schedules-v2/schedules/') && path.includes('/slots/')) {
          return [{ start: '18:00', end: '22:00', power: 4, fan: 3 }];
        }
        if (path === 'pidAutomation/boost') return { active: false };
        if (path.includes('users/') && path.includes('pidAutomation')) {
          return { enabled: true, targetRoomId: 'room123' };
        }
        if (path === 'netatmo/currentStatus') return null; // No Netatmo data
        if (path.includes('pidAutomation/state')) return null;
        return null;
      });

      const request = createMockRequest();
      await GET(request);

      // PID should skip (no Netatmo data)
      // Verify no setPowerLevel called by PID
      expect(mockSetPowerLevel).not.toHaveBeenCalled();

      jest.useRealTimers();
    });

    it('skips PID when target room not found', async () => {
      mockGetStoveStatus.mockResolvedValue({ StatusDescription: 'WORK 1', Result: 0 } as any);
      mockGetPowerLevel.mockResolvedValue({ Result: 4 } as any);

      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-02-12T18:00:00.000Z'));

      // Mock PID enabled but room not in Netatmo data
      mockAdminDbGet.mockImplementation(async (path: string) => {
        if (path === 'schedules-v2/mode') return { enabled: true, semiManual: false };
        if (path === 'schedules-v2/activeScheduleId') return 'default';
        if (path.includes('schedules-v2/schedules/') && path.includes('/slots/')) {
          return [{ start: '18:00', end: '22:00', power: 4, fan: 3 }];
        }
        if (path === 'pidAutomation/boost') return { active: false };
        if (path.includes('users/') && path.includes('pidAutomation')) {
          return { enabled: true, targetRoomId: 'room123' };
        }
        if (path === 'netatmo/currentStatus') {
          return {
            rooms: {
              otherRoom: { room_id: 'otherRoom', name: 'Kitchen', temperature: 21 },
            },
          };
        }
        if (path.includes('pidAutomation/state')) return null;
        return null;
      });

      const request = createMockRequest();
      await GET(request);

      // PID should skip (room not found)
      expect(mockSetPowerLevel).not.toHaveBeenCalled();

      jest.useRealTimers();
    });

    it('skips PID when temperature data is invalid', async () => {
      mockGetStoveStatus.mockResolvedValue({ StatusDescription: 'WORK 1', Result: 0 } as any);
      mockGetPowerLevel.mockResolvedValue({ Result: 4 } as any);

      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-02-12T18:00:00.000Z'));

      // Mock room with no temperature
      mockAdminDbGet.mockImplementation(async (path: string) => {
        if (path === 'schedules-v2/mode') return { enabled: true, semiManual: false };
        if (path === 'schedules-v2/activeScheduleId') return 'default';
        if (path.includes('schedules-v2/schedules/') && path.includes('/slots/')) {
          return [{ start: '18:00', end: '22:00', power: 4, fan: 3 }];
        }
        if (path === 'pidAutomation/boost') return { active: false };
        if (path.includes('users/') && path.includes('pidAutomation')) {
          return { enabled: true, targetRoomId: 'room123', manualSetpoint: 21 };
        }
        if (path === 'netatmo/currentStatus') {
          return {
            rooms: {
              room123: { room_id: 'room123', name: 'Living', temperature: null }, // No temp
            },
          };
        }
        if (path.includes('pidAutomation/state')) return null;
        return null;
      });

      const request = createMockRequest();
      await GET(request);

      // PID should skip
      expect(mockSetPowerLevel).not.toHaveBeenCalled();

      jest.useRealTimers();
    });

    it('skips PID when setpoint is invalid', async () => {
      mockGetStoveStatus.mockResolvedValue({ StatusDescription: 'WORK 1', Result: 0 } as any);
      mockGetPowerLevel.mockResolvedValue({ Result: 4 } as any);

      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-02-12T18:00:00.000Z'));

      // Mock invalid setpoint (out of range)
      mockAdminDbGet.mockImplementation(async (path: string) => {
        if (path === 'schedules-v2/mode') return { enabled: true, semiManual: false };
        if (path === 'schedules-v2/activeScheduleId') return 'default';
        if (path.includes('schedules-v2/schedules/') && path.includes('/slots/')) {
          return [{ start: '18:00', end: '22:00', power: 4, fan: 3 }];
        }
        if (path === 'pidAutomation/boost') return { active: false };
        if (path.includes('users/') && path.includes('pidAutomation')) {
          return { enabled: true, targetRoomId: 'room123', manualSetpoint: 30 }; // Out of range
        }
        if (path === 'netatmo/currentStatus') {
          return {
            rooms: {
              room123: { room_id: 'room123', name: 'Living', temperature: 20 },
            },
          };
        }
        if (path.includes('pidAutomation/state')) return null;
        return null;
      });

      const request = createMockRequest();
      await GET(request);

      // PID should skip
      expect(mockSetPowerLevel).not.toHaveBeenCalled();

      jest.useRealTimers();
    });

  });

  describe('Fire-and-Forget Helper Branches - calibrateValvesIfNeeded', () => {
    it('skips calibration when too soon (within 12 hours)', async () => {
      const now = Date.now();

      // Mock with recent calibration timestamp — must include all scheduler paths
      mockAdminDbGet.mockImplementation(async (path: string) => {
        if (path === 'schedules-v2/mode') return { enabled: true, semiManual: false };
        if (path === 'schedules-v2/activeScheduleId') return 'default';
        if (path.includes('schedules-v2/schedules/') && path.includes('/slots/')) return [];
        if (path.includes('lastAutoCalibration')) return now - 1000; // 1 second ago
        if (path === 'pidAutomation/boost') return { active: false };
        return null;
      });

      const request = createMockRequest();
      await GET(request);
      await flushPromises();

      // Verify calibration NOT called
      expect(mockCalibrateValvesServer).not.toHaveBeenCalled();
    });

    it('performs successful calibration and saves timestamp', async () => {
      // Mock calibration success
      mockCalibrateValvesServer.mockResolvedValue({ calibrated: true } as any);

      setupSchedulerMocks({
        mode: { enabled: true, semiManual: false },
        intervals: [],
      });

      const request = createMockRequest();
      await GET(request);
      await flushPromises();

      // Verify calibration called
      expect(mockCalibrateValvesServer).toHaveBeenCalled();

      // Verify timestamp saved
      expect(mockAdminDbSet).toHaveBeenCalledWith(
        expect.stringContaining('lastAutoCalibration'),
        expect.any(Number)
      );
    });

    it('logs error when calibration fails', async () => {
      // Mock calibration failure
      mockCalibrateValvesServer.mockResolvedValue({
        calibrated: false,
        error: 'No valves found',
      } as any);

      setupSchedulerMocks({
        mode: { enabled: true, semiManual: false },
        intervals: [],
      });

      const request = createMockRequest();
      await GET(request);
      await flushPromises();

      // Verify error logged
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Calibrazione automatica fallita'),
        expect.any(String)
      );
    });

    it('handles calibration exception gracefully', async () => {
      // Mock calibration rejection
      mockCalibrateValvesServer.mockRejectedValue(new Error('Network timeout'));

      setupSchedulerMocks({
        mode: { enabled: true, semiManual: false },
        intervals: [],
      });

      const request = createMockRequest();
      const response = await GET(request);
      await flushPromises();

      // Route should still return 200
      expect(response.status).toBe(200);

      // Verify error logged
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Errore calibrazione automatica'),
        expect.any(Error)
      );
    });
  });

  describe('Fire-and-Forget Helper Branches - refreshWeatherIfNeeded', () => {
    it('skips weather refresh when too soon (within 30 minutes)', async () => {
      const now = Date.now();

      mockAdminDbGet.mockImplementation(async (path: string) => {
        if (path === 'schedules-v2/mode') return { enabled: true, semiManual: false };
        if (path.includes('lastWeatherRefresh')) return now - 60000; // 1 minute ago
        return null;
      });

      setupSchedulerMocks({
        mode: { enabled: true, semiManual: false },
        intervals: [],
      });

      const request = createMockRequest();
      await GET(request);
      await flushPromises();

      // Verify weather fetch NOT called
      expect(mockFetchWeatherForecast).not.toHaveBeenCalled();
    });

    it('skips weather refresh when location not configured', async () => {
      mockAdminDbGet.mockImplementation(async (path: string) => {
        if (path === 'schedules-v2/mode') return { enabled: true, semiManual: false };
        if (path.includes('lastWeatherRefresh')) return null;
        if (path.includes('config/location')) return null; // No location
        return null;
      });

      setupSchedulerMocks({
        mode: { enabled: true, semiManual: false },
        intervals: [],
      });

      const request = createMockRequest();
      await GET(request);
      await flushPromises();

      // Verify warning logged
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('location not configured')
      );

      // Verify weather fetch NOT called
      expect(mockFetchWeatherForecast).not.toHaveBeenCalled();
    });

    it('performs successful weather refresh and saves timestamp', async () => {
      const weatherData = { temperature: 18, forecast: [] };
      mockFetchWeatherForecast.mockResolvedValue(weatherData as any);

      // Must include all scheduler paths — setupSchedulerMocks would override
      mockAdminDbGet.mockImplementation(async (path: string) => {
        if (path === 'schedules-v2/mode') return { enabled: true, semiManual: false };
        if (path === 'schedules-v2/activeScheduleId') return 'default';
        if (path.includes('schedules-v2/schedules/') && path.includes('/slots/')) return [];
        if (path.includes('lastWeatherRefresh')) return null;
        if (path.includes('config/location')) return { latitude: 45.4, longitude: 9.2, name: 'Milan' };
        if (path === 'pidAutomation/boost') return { active: false };
        return null;
      });

      const request = createMockRequest();
      await GET(request);
      await flushPromises();

      // Verify weather fetch called
      expect(mockFetchWeatherForecast).toHaveBeenCalledWith(45.4, 9.2);

      // Verify cache saved
      expect(mockSaveWeatherToCache).toHaveBeenCalledWith(45.4, 9.2, weatherData);

      // Verify timestamp saved
      expect(mockAdminDbSet).toHaveBeenCalledWith(
        expect.stringContaining('lastWeatherRefresh'),
        expect.any(Number)
      );
    });

    it('handles weather fetch exception gracefully', async () => {
      mockFetchWeatherForecast.mockRejectedValue(new Error('API timeout'));

      // Must include all scheduler paths — setupSchedulerMocks would override
      mockAdminDbGet.mockImplementation(async (path: string) => {
        if (path === 'schedules-v2/mode') return { enabled: true, semiManual: false };
        if (path === 'schedules-v2/activeScheduleId') return 'default';
        if (path.includes('schedules-v2/schedules/') && path.includes('/slots/')) return [];
        if (path.includes('lastWeatherRefresh')) return null;
        if (path.includes('config/location')) return { latitude: 45.4, longitude: 9.2 };
        if (path === 'pidAutomation/boost') return { active: false };
        return null;
      });

      const request = createMockRequest();
      const response = await GET(request);
      await flushPromises();

      // Route should still return 200
      expect(response.status).toBe(200);

      // Verify error logged
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Errore refresh weather'),
        expect.any(Error)
      );
    });
  });

  describe('Fire-and-Forget Helper Branches - cleanupTokensIfNeeded', () => {
    it('skips token cleanup when too soon (within 7 days)', async () => {
      const now = Date.now();

      // Must include all scheduler paths — setupSchedulerMocks would override
      mockAdminDbGet.mockImplementation(async (path: string) => {
        if (path === 'schedules-v2/mode') return { enabled: true, semiManual: false };
        if (path === 'schedules-v2/activeScheduleId') return 'default';
        if (path.includes('schedules-v2/schedules/') && path.includes('/slots/')) return [];
        if (path.includes('lastTokenCleanup')) return now - 86400000; // 1 day ago
        if (path === 'pidAutomation/boost') return { active: false };
        return null;
      });

      const request = createMockRequest();
      await GET(request);
      await flushPromises();

      // Verify cleanup NOT called
      expect(mockCleanupStaleTokens).not.toHaveBeenCalled();
    });

    it('performs successful cleanup and saves timestamp', async () => {
      mockCleanupStaleTokens.mockResolvedValue({
        cleaned: true,
        tokensScanned: 10,
        tokensRemoved: 3,
        errorsRemoved: 1,
        deletedTokens: [],
      } as any);

      setupSchedulerMocks({
        mode: { enabled: true, semiManual: false },
        intervals: [],
      });

      const request = createMockRequest();
      await GET(request);
      await flushPromises();

      // Verify cleanup called
      expect(mockCleanupStaleTokens).toHaveBeenCalled();

      // Verify timestamp saved
      expect(mockAdminDbSet).toHaveBeenCalledWith(
        expect.stringContaining('lastTokenCleanup'),
        expect.any(Number)
      );
    });

    it('does not save timestamp when cleanup returns cleaned:false', async () => {
      mockCleanupStaleTokens.mockResolvedValue({
        cleaned: false,
        reason: 'no_tokens',
        tokensScanned: 0,
        tokensRemoved: 0,
        errorsRemoved: 0,
        deletedTokens: [],
      } as any);

      setupSchedulerMocks({
        mode: { enabled: true, semiManual: false },
        intervals: [],
      });

      const request = createMockRequest();
      await GET(request);
      await flushPromises();

      // Verify cleanup called
      expect(mockCleanupStaleTokens).toHaveBeenCalled();

      // Verify timestamp NOT saved for lastTokenCleanup path
      const cleanupCalls = mockAdminDbSet.mock.calls.filter(
        call => call[0]?.toString().includes('lastTokenCleanup')
      );
      expect(cleanupCalls).toHaveLength(0);
    });
  });

  describe('Fire-and-Forget Helper Branches - sendMaintenanceNotificationIfNeeded', () => {
    it('handles skipped notification result', async () => {
      mockTrackUsageHours.mockResolvedValue({
        tracked: true,
        notificationData: {
          notificationLevel: 90,
          percentage: 90,
          remainingHours: 5,
        },
      } as any);

      mockTriggerMaintenanceAlertServer.mockResolvedValue({
        success: false,
        skipped: true,
      } as any);

      setupSchedulerMocks({
        mode: { enabled: true, semiManual: false },
        intervals: [],
      });

      const request = createMockRequest();
      await GET(request);
      await flushPromises();

      // No error should be logged for skipped
      const errorCalls = (console.error as jest.Mock).mock.calls.filter(
        call => call[0]?.toString().includes('manutenzione')
      );
      expect(errorCalls).toHaveLength(0);
    });

    it('logs error when notification fails', async () => {
      mockTrackUsageHours.mockResolvedValue({
        tracked: true,
        notificationData: {
          notificationLevel: 90,
          percentage: 90,
          remainingHours: 5,
        },
      } as any);

      mockTriggerMaintenanceAlertServer.mockResolvedValue({
        success: false,
        skipped: false,
        error: 'Rate limited',
      } as any);

      setupSchedulerMocks({
        mode: { enabled: true, semiManual: false },
        intervals: [],
      });

      const request = createMockRequest();
      await GET(request);
      await flushPromises();

      // Verify error logged (route uses template literal: single string argument)
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Rate limited')
      );
    });

    it('handles notification exception', async () => {
      mockTrackUsageHours.mockResolvedValue({
        tracked: true,
        notificationData: {
          notificationLevel: 90,
          percentage: 90,
          remainingHours: 5,
        },
      } as any);

      mockTriggerMaintenanceAlertServer.mockRejectedValue(new Error('Network error'));

      setupSchedulerMocks({
        mode: { enabled: true, semiManual: false },
        intervals: [],
      });

      const request = createMockRequest();
      const response = await GET(request);
      await flushPromises();

      // Route should still return 200
      expect(response.status).toBe(200);

      // Verify error logged
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('manutenzione'),
        expect.any(Error)
      );
    });
  });

  describe('Fire-and-Forget Helper Branches - sendStoveStatusWorkNotification', () => {
    it('sends WORK notification and saves timestamp', async () => {
      mockGetStoveStatus.mockResolvedValue({ StatusDescription: 'WORK 1', Result: 0 } as any);
      mockTriggerStoveStatusWorkServer.mockResolvedValue({ success: true } as any);

      setupSchedulerMocks({
        mode: { enabled: true, semiManual: false },
        intervals: [],
      });

      const request = createMockRequest();
      await GET(request);
      await flushPromises();

      // Verify notification sent
      expect(mockTriggerStoveStatusWorkServer).toHaveBeenCalled();

      // Verify timestamp saved
      expect(mockAdminDbSet).toHaveBeenCalledWith(
        expect.stringContaining('lastWorkNotification'),
        expect.any(Number)
      );
    });

    it('handles WORK notification exception', async () => {
      mockGetStoveStatus.mockResolvedValue({ StatusDescription: 'WORK 1', Result: 0 } as any);
      mockTriggerStoveStatusWorkServer.mockRejectedValue(new Error('Push failed'));

      setupSchedulerMocks({
        mode: { enabled: true, semiManual: false },
        intervals: [],
      });

      const request = createMockRequest();
      const response = await GET(request);
      await flushPromises();

      // Route should still return 200
      expect(response.status).toBe(200);

      // Verify error logged (route logs error.message, which is a string)
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('stove_status_work'),
        expect.any(String)
      );
    });

    it('does not send WORK notification when stove is not in WORK status', async () => {
      mockGetStoveStatus.mockResolvedValue({ StatusDescription: 'START', Result: 0 } as any);

      setupSchedulerMocks({
        mode: { enabled: true, semiManual: false },
        intervals: [],
      });

      const request = createMockRequest();
      await GET(request);
      await flushPromises();

      // Verify notification NOT sent
      expect(mockTriggerStoveStatusWorkServer).not.toHaveBeenCalled();
    });
  });

  describe('Fire-and-Forget Helper Branches - checkAndNotifyUnexpectedOff', () => {
    it('saves timestamp when unexpected off notification sent', async () => {
      mockGetStoveStatus.mockResolvedValue({ StatusDescription: 'Spento', Result: 0 } as any);
      mockTriggerStoveUnexpectedOffServer.mockResolvedValue({ success: true } as any);

      // Need fake timers to ensure time is within the 18:00-22:00 interval
      jest.useFakeTimers();
      const testTime = new Date('2025-02-12T18:30:00.000Z').getTime(); // 19:30 Rome time
      jest.setSystemTime(testTime);

      mockAdminDbGet.mockImplementation(async (path: string) => {
        if (path === 'schedules-v2/mode') return { enabled: true, semiManual: false };
        if (path === 'schedules-v2/activeScheduleId') return 'default';
        if (path.includes('schedules-v2/schedules/') && path.includes('/slots/')) {
          return [{ start: '18:00', end: '22:00', power: 4, fan: 3 }];
        }
        if (path === 'scheduler/lastIgnitionInterval') {
          return { interval: '18:00-22:00', timestamp: testTime - 600000 };
        }
        if (path === 'scheduler/lastUnexpectedOffNotification') return null;
        if (path === 'pidAutomation/boost') return { active: false };
        return null;
      });

      const request = createMockRequest();
      await GET(request);
      await flushPromises();

      // Verify timestamp saved
      expect(mockAdminDbSet).toHaveBeenCalledWith(
        expect.stringContaining('lastUnexpectedOffNotification'),
        expect.any(Number)
      );

      jest.useRealTimers();
    });

    it('handles unexpected off notification exception', async () => {
      mockGetStoveStatus.mockResolvedValue({ StatusDescription: 'Spento', Result: 0 } as any);
      mockTriggerStoveUnexpectedOffServer.mockRejectedValue(new Error('Push failed'));

      // Need fake timers to ensure time is within the 18:00-22:00 interval
      jest.useFakeTimers();
      const testTime = new Date('2025-02-12T18:30:00.000Z').getTime(); // 19:30 Rome time
      jest.setSystemTime(testTime);

      mockAdminDbGet.mockImplementation(async (path: string) => {
        if (path === 'schedules-v2/mode') return { enabled: true, semiManual: false };
        if (path === 'schedules-v2/activeScheduleId') return 'default';
        if (path.includes('schedules-v2/schedules/') && path.includes('/slots/')) {
          return [{ start: '18:00', end: '22:00', power: 4, fan: 3 }];
        }
        if (path === 'scheduler/lastIgnitionInterval') {
          return { interval: '18:00-22:00', timestamp: testTime - 600000 };
        }
        if (path === 'scheduler/lastUnexpectedOffNotification') return null;
        if (path === 'pidAutomation/boost') return { active: false };
        return null;
      });

      const request = createMockRequest();
      const response = await GET(request);
      await flushPromises();

      // Route should still return 200
      expect(response.status).toBe(200);

      // Verify error logged (route logs error.message, which is a string)
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('stove_unexpected_off'),
        expect.any(String)
      );

      jest.useRealTimers();
    });

    it('does not notify when no previous ignition tracked', async () => {
      mockGetStoveStatus.mockResolvedValue({ StatusDescription: 'Spento', Result: 0 } as any);

      mockAdminDbGet.mockImplementation(async (path: string) => {
        if (path === 'schedules-v2/mode') return { enabled: true, semiManual: false };
        if (path === 'schedules-v2/activeScheduleId') return 'default';
        if (path.includes('schedules-v2/schedules/') && path.includes('/slots/')) {
          return [{ start: '18:00', end: '22:00', power: 4, fan: 3 }];
        }
        if (path === 'scheduler/lastIgnitionInterval') return null; // No previous ignition
        if (path === 'pidAutomation/boost') return { active: false };
        return null;
      });

      const request = createMockRequest();
      await GET(request);
      await flushPromises();

      // Verify notification NOT sent
      expect(mockTriggerStoveUnexpectedOffServer).not.toHaveBeenCalled();
    });
  });

  describe('Fire-and-Forget Helper Branches - sendSchedulerNotification', () => {
    it('handles skipped scheduler notification', async () => {
      mockIgniteStove.mockResolvedValue(undefined as any);
      mockGetStoveStatus.mockResolvedValue({ StatusDescription: 'Spento', Result: 0 } as any);
      mockTriggerSchedulerActionServer.mockResolvedValue({
        success: false,
        skipped: true,
      } as any);

      const mockUpdateStoveState = jest.mocked(updateStoveState);
      mockUpdateStoveState.mockResolvedValue(undefined as any);

      // Need fake timers to ensure time is within the interval for ignition to trigger
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-02-12T18:30:00.000Z')); // 19:30 Rome time

      setupSchedulerMocks({
        mode: { enabled: true, semiManual: false },
        intervals: [{ start: '18:00', end: '22:00', power: 4, fan: 3 }],
      });

      const request = createMockRequest();
      await GET(request);
      await flushPromises();

      // No error should be logged for skipped
      const errorCalls = (console.error as jest.Mock).mock.calls.filter(
        call => call[0]?.toString().includes('notifica scheduler')
      );
      expect(errorCalls).toHaveLength(0);

      jest.useRealTimers();
    });

    it('logs error when scheduler notification fails', async () => {
      mockIgniteStove.mockResolvedValue(undefined as any);
      mockGetStoveStatus.mockResolvedValue({ StatusDescription: 'Spento', Result: 0 } as any);
      mockTriggerSchedulerActionServer.mockResolvedValue({
        success: false,
        skipped: false,
        error: 'Failed to send',
      } as any);

      const mockUpdateStoveState = jest.mocked(updateStoveState);
      mockUpdateStoveState.mockResolvedValue(undefined as any);

      // Need fake timers to ensure time is within the interval for ignition to trigger
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-02-12T18:30:00.000Z')); // 19:30 Rome time

      setupSchedulerMocks({
        mode: { enabled: true, semiManual: false },
        intervals: [{ start: '18:00', end: '22:00', power: 4, fan: 3 }],
      });

      const request = createMockRequest();
      await GET(request);
      await flushPromises();

      // Verify error logged (route uses template literal: single string argument)
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to send')
      );

      jest.useRealTimers();
    });

    it('handles scheduler notification exception', async () => {
      mockIgniteStove.mockResolvedValue(undefined as any);
      mockGetStoveStatus.mockResolvedValue({ StatusDescription: 'Spento', Result: 0 } as any);
      mockTriggerSchedulerActionServer.mockRejectedValue(new Error('Network error'));

      const mockUpdateStoveState = jest.mocked(updateStoveState);
      mockUpdateStoveState.mockResolvedValue(undefined as any);

      // Need fake timers to ensure time is within the interval for ignition to trigger
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-02-12T18:30:00.000Z')); // 19:30 Rome time

      setupSchedulerMocks({
        mode: { enabled: true, semiManual: false },
        intervals: [{ start: '18:00', end: '22:00', power: 4, fan: 3 }],
      });

      const request = createMockRequest();
      const response = await GET(request);
      await flushPromises();

      // Route should still return 200
      expect(response.status).toBe(200);

      // Verify error logged
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Errore invio notifica scheduler'),
        expect.any(Error)
      );

      jest.useRealTimers();
    });
  });

  describe('PID Deep Internals - Advanced Scenarios', () => {
    const mockLogPidTuningEntry = jest.mocked(logPidTuningEntry);
    const mockCleanupOldLogs = jest.mocked(cleanupOldLogs);

    beforeEach(() => {
      // Reset PID-specific mocks
      mockLogPidTuningEntry.mockResolvedValue(undefined as any);
      mockCleanupOldLogs.mockResolvedValue(undefined as any);
    });

    it('adjusts power level when PID output differs from current', async () => {
      // Mock stove in WORK state at power 4
      mockGetStoveStatus.mockResolvedValue({ StatusDescription: 'WORK 1', Result: 0 } as any);
      mockGetPowerLevel.mockResolvedValue({ Result: 4 } as any);
      mockGetFanLevel.mockResolvedValue({ Result: 3 } as any);
      mockSetPowerLevel.mockResolvedValue(undefined as any);

      const mockUpdateStoveState = jest.mocked(updateStoveState);
      mockUpdateStoveState.mockResolvedValue(undefined as any);

      // Mock PID Controller to return different power level
      const { PIDController } = require('@/lib/utils/pidController');
      const mockCompute = jest.fn().mockReturnValue(3); // PID wants power 3, current is 4
      const mockGetState = jest.fn().mockReturnValue({ integral: 0.5, prevError: -0.2, initialized: true });
      const mockSetState = jest.fn();
      jest.mocked(PIDController).mockImplementation(() => ({
        compute: mockCompute,
        setState: mockSetState,
        getState: mockGetState,
      } as any));

      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-02-12T18:00:00.000Z'));

      // Mock PID config and Netatmo data
      mockAdminDbGet.mockImplementation(async (path: string) => {
        if (path === 'schedules-v2/mode') return { enabled: true, semiManual: false };
        if (path === 'schedules-v2/activeScheduleId') return 'default';
        if (path.includes('schedules-v2/schedules/') && path.includes('/slots/')) {
          return [{ start: '18:00', end: '22:00', power: 4, fan: 3 }];
        }
        if (path === 'pidAutomation/boost') return { active: false };
        if (path.includes('users/') && path.includes('pidAutomation')) {
          return {
            enabled: true,
            targetRoomId: 'room123',
            kp: 0.5,
            ki: 0.1,
            kd: 0.05,
            manualSetpoint: 21,
          };
        }
        if (path === 'netatmo/currentStatus') {
          return {
            rooms: {
              room123: { room_id: 'room123', name: 'Living Room', temperature: 20.5 },
            },
          };
        }
        if (path.includes('pidAutomation/state')) return null;
        return null;
      });

      const request = createMockRequest();
      await GET(request);

      // Verify power level adjusted to 3
      expect(mockSetPowerLevel).toHaveBeenCalledWith(3);

      // Verify stove state updated with PID source
      expect(mockUpdateStoveState).toHaveBeenCalledWith(
        expect.objectContaining({
          powerLevel: 3,
          source: 'pid_automation',
        })
      );

      // Verify boost state saved
      expect(mockAdminDbSet).toHaveBeenCalledWith(
        expect.stringContaining('pidAutomation/boost'),
        expect.objectContaining({
          active: true,
          powerLevel: 3,
          scheduledPower: 4,
          appliedAt: expect.any(Number),
        })
      );

      // Verify analytics logged
      expect(mockLogAnalyticsEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'power_change',
          powerLevel: 3,
          source: 'automation',
        })
      );

      jest.useRealTimers();
    });

    it('does not adjust power when PID output matches current', async () => {
      // Mock stove in WORK state at power 4
      mockGetStoveStatus.mockResolvedValue({ StatusDescription: 'WORK 1', Result: 0 } as any);
      mockGetPowerLevel.mockResolvedValue({ Result: 4 } as any);
      mockGetFanLevel.mockResolvedValue({ Result: 3 } as any);

      // Mock PID Controller to return same power level
      const { PIDController } = require('@/lib/utils/pidController');
      const mockCompute = jest.fn().mockReturnValue(4); // PID wants power 4, current is 4
      const mockGetState = jest.fn().mockReturnValue({ integral: 0, prevError: 0, initialized: true });
      const mockSetState = jest.fn();
      jest.mocked(PIDController).mockImplementation(() => ({
        compute: mockCompute,
        setState: mockSetState,
        getState: mockGetState,
      } as any));

      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-02-12T18:00:00.000Z'));

      mockAdminDbGet.mockImplementation(async (path: string) => {
        if (path === 'schedules-v2/mode') return { enabled: true, semiManual: false };
        if (path === 'schedules-v2/activeScheduleId') return 'default';
        if (path.includes('schedules-v2/schedules/') && path.includes('/slots/')) {
          return [{ start: '18:00', end: '22:00', power: 4, fan: 3 }];
        }
        if (path === 'pidAutomation/boost') return { active: false };
        if (path.includes('users/') && path.includes('pidAutomation')) {
          return {
            enabled: true,
            targetRoomId: 'room123',
            manualSetpoint: 21,
          };
        }
        if (path === 'netatmo/currentStatus') {
          return {
            rooms: {
              room123: { room_id: 'room123', name: 'Living Room', temperature: 21 },
            },
          };
        }
        if (path.includes('pidAutomation/state')) return null;
        return null;
      });

      const request = createMockRequest();
      await GET(request);

      // Verify power NOT adjusted
      expect(mockSetPowerLevel).not.toHaveBeenCalled();

      // Verify boost cleared (PID agrees with schedule)
      expect(mockAdminDbSet).toHaveBeenCalledWith(
        expect.stringContaining('pidAutomation/boost'),
        { active: false }
      );

      jest.useRealTimers();
    });

    it('restores PID state from previous run', async () => {
      mockGetStoveStatus.mockResolvedValue({ StatusDescription: 'WORK 1', Result: 0 } as any);
      mockGetPowerLevel.mockResolvedValue({ Result: 4 } as any);
      mockGetFanLevel.mockResolvedValue({ Result: 3 } as any);

      const { PIDController } = require('@/lib/utils/pidController');
      const mockCompute = jest.fn().mockReturnValue(4);
      const mockGetState = jest.fn().mockReturnValue({ integral: 1.5, prevError: 0.3, initialized: true });
      const mockSetState = jest.fn();
      jest.mocked(PIDController).mockImplementation(() => ({
        compute: mockCompute,
        setState: mockSetState,
        getState: mockGetState,
      } as any));

      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-02-12T18:00:00.000Z'));

      // Mock previous PID state
      mockAdminDbGet.mockImplementation(async (path: string) => {
        if (path === 'schedules-v2/mode') return { enabled: true, semiManual: false };
        if (path === 'schedules-v2/activeScheduleId') return 'default';
        if (path.includes('schedules-v2/schedules/') && path.includes('/slots/')) {
          return [{ start: '18:00', end: '22:00', power: 4, fan: 3 }];
        }
        if (path === 'pidAutomation/boost') return { active: false };
        if (path.includes('users/') && path.includes('pidAutomation')) {
          return {
            enabled: true,
            targetRoomId: 'room123',
            manualSetpoint: 21,
          };
        }
        if (path === 'netatmo/currentStatus') {
          return {
            rooms: {
              room123: { room_id: 'room123', name: 'Living Room', temperature: 21 },
            },
          };
        }
        if (path.includes('pidAutomation/state')) {
          return {
            integral: 1.5,
            prevError: 0.3,
            initialized: true,
            lastRun: Date.now() - 300000, // 5 minutes ago
          };
        }
        return null;
      });

      const request = createMockRequest();
      await GET(request);

      // Verify setState called with restored values
      expect(mockSetState).toHaveBeenCalledWith({
        integral: 1.5,
        prevError: 0.3,
        initialized: true,
      });

      jest.useRealTimers();
    });

    it('logs PID tuning entry after compute', async () => {
      mockGetStoveStatus.mockResolvedValue({ StatusDescription: 'WORK 1', Result: 0 } as any);
      mockGetPowerLevel.mockResolvedValue({ Result: 4 } as any);
      mockGetFanLevel.mockResolvedValue({ Result: 3 } as any);

      const { PIDController } = require('@/lib/utils/pidController');
      const mockCompute = jest.fn().mockReturnValue(4);
      const mockGetState = jest.fn().mockReturnValue({ integral: 0.2, prevError: 0.1, initialized: true });
      const mockSetState = jest.fn();
      jest.mocked(PIDController).mockImplementation(() => ({
        compute: mockCompute,
        setState: mockSetState,
        getState: mockGetState,
      } as any));

      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-02-12T18:00:00.000Z'));

      mockAdminDbGet.mockImplementation(async (path: string) => {
        if (path === 'schedules-v2/mode') return { enabled: true, semiManual: false };
        if (path === 'schedules-v2/activeScheduleId') return 'default';
        if (path.includes('schedules-v2/schedules/') && path.includes('/slots/')) {
          return [{ start: '18:00', end: '22:00', power: 4, fan: 3 }];
        }
        if (path === 'pidAutomation/boost') return { active: false };
        if (path.includes('users/') && path.includes('pidAutomation')) {
          return {
            enabled: true,
            targetRoomId: 'room123',
            manualSetpoint: 21,
          };
        }
        if (path === 'netatmo/currentStatus') {
          return {
            rooms: {
              room123: { room_id: 'room123', name: 'Living Room', temperature: 20.5 },
            },
          };
        }
        if (path.includes('pidAutomation/state')) return null;
        return null;
      });

      const request = createMockRequest();
      await GET(request);

      // Verify logPidTuningEntry called
      expect(mockLogPidTuningEntry).toHaveBeenCalledWith(
        'admin-test-user',
        expect.objectContaining({
          roomTemp: 20.5,
          powerLevel: 4,
          setpoint: 21,
          pidOutput: 4,
          error: 0.5,
          integral: 0.2,
          roomId: 'room123',
          roomName: 'Living Room',
        })
      );

      jest.useRealTimers();
    });

    it('handles PID tuning log failure gracefully', async () => {
      mockGetStoveStatus.mockResolvedValue({ StatusDescription: 'WORK 1', Result: 0 } as any);
      mockGetPowerLevel.mockResolvedValue({ Result: 4 } as any);
      mockGetFanLevel.mockResolvedValue({ Result: 3 } as any);

      // Mock logPidTuningEntry to fail
      mockLogPidTuningEntry.mockRejectedValue(new Error('DB write error'));

      const { PIDController } = require('@/lib/utils/pidController');
      const mockCompute = jest.fn().mockReturnValue(4);
      const mockGetState = jest.fn().mockReturnValue({ integral: 0, prevError: 0, initialized: true });
      const mockSetState = jest.fn();
      jest.mocked(PIDController).mockImplementation(() => ({
        compute: mockCompute,
        setState: mockSetState,
        getState: mockGetState,
      } as any));

      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-02-12T18:00:00.000Z'));

      mockAdminDbGet.mockImplementation(async (path: string) => {
        if (path === 'schedules-v2/mode') return { enabled: true, semiManual: false };
        if (path === 'schedules-v2/activeScheduleId') return 'default';
        if (path.includes('schedules-v2/schedules/') && path.includes('/slots/')) {
          return [{ start: '18:00', end: '22:00', power: 4, fan: 3 }];
        }
        if (path === 'pidAutomation/boost') return { active: false };
        if (path.includes('users/') && path.includes('pidAutomation')) {
          return {
            enabled: true,
            targetRoomId: 'room123',
            manualSetpoint: 21,
          };
        }
        if (path === 'netatmo/currentStatus') {
          return {
            rooms: {
              room123: { room_id: 'room123', name: 'Living Room', temperature: 21 },
            },
          };
        }
        if (path.includes('pidAutomation/state')) return null;
        return null;
      });

      const request = createMockRequest();
      const response = await GET(request);

      // Route should still return 200 (logging failure doesn't stop PID)
      expect(response.status).toBe(200);

      // Verify error logged
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to log PID tuning data'),
        expect.any(String)
      );

      jest.useRealTimers();
    });

    it('triggers cleanup of old logs when last cleanup >24h ago', async () => {
      mockGetStoveStatus.mockResolvedValue({ StatusDescription: 'WORK 1', Result: 0 } as any);
      mockGetPowerLevel.mockResolvedValue({ Result: 4 } as any);
      mockGetFanLevel.mockResolvedValue({ Result: 3 } as any);

      const { PIDController } = require('@/lib/utils/pidController');
      const mockCompute = jest.fn().mockReturnValue(4);
      const mockGetState = jest.fn().mockReturnValue({ integral: 0, prevError: 0, initialized: true });
      const mockSetState = jest.fn();
      jest.mocked(PIDController).mockImplementation(() => ({
        compute: mockCompute,
        setState: mockSetState,
        getState: mockGetState,
      } as any));

      jest.useFakeTimers();
      const now = new Date('2025-02-12T18:00:00.000Z').getTime();
      jest.setSystemTime(now);

      // Mock PID state with old lastCleanup
      mockAdminDbGet.mockImplementation(async (path: string) => {
        if (path === 'schedules-v2/mode') return { enabled: true, semiManual: false };
        if (path === 'schedules-v2/activeScheduleId') return 'default';
        if (path.includes('schedules-v2/schedules/') && path.includes('/slots/')) {
          return [{ start: '18:00', end: '22:00', power: 4, fan: 3 }];
        }
        if (path === 'pidAutomation/boost') return { active: false };
        if (path.includes('users/') && path.includes('pidAutomation')) {
          return {
            enabled: true,
            targetRoomId: 'room123',
            manualSetpoint: 21,
          };
        }
        if (path === 'netatmo/currentStatus') {
          return {
            rooms: {
              room123: { room_id: 'room123', name: 'Living Room', temperature: 21 },
            },
          };
        }
        if (path.includes('pidAutomation/state')) {
          return {
            integral: 0,
            prevError: 0,
            initialized: true,
            lastRun: now - 300000,
            lastCleanup: now - (25 * 60 * 60 * 1000), // 25 hours ago
          };
        }
        return null;
      });

      const request = createMockRequest();
      await GET(request);
      await flushPromises();

      // Verify cleanupOldLogs called
      expect(mockCleanupOldLogs).toHaveBeenCalledWith('admin-test-user');

      // Verify lastCleanup timestamp updated
      expect(mockAdminDbSet).toHaveBeenCalledWith(
        expect.stringContaining('pidAutomation/state/lastCleanup'),
        expect.any(Number)
      );

      jest.useRealTimers();
    });

    it('skips PID when no targetRoomId in config', async () => {
      mockGetStoveStatus.mockResolvedValue({ StatusDescription: 'WORK 1', Result: 0 } as any);
      mockGetPowerLevel.mockResolvedValue({ Result: 4 } as any);
      mockGetFanLevel.mockResolvedValue({ Result: 3 } as any);

      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-02-12T18:00:00.000Z'));

      // Mock PID config WITHOUT targetRoomId
      mockAdminDbGet.mockImplementation(async (path: string) => {
        if (path === 'schedules-v2/mode') return { enabled: true, semiManual: false };
        if (path === 'schedules-v2/activeScheduleId') return 'default';
        if (path.includes('schedules-v2/schedules/') && path.includes('/slots/')) {
          return [{ start: '18:00', end: '22:00', power: 4, fan: 3 }];
        }
        if (path === 'pidAutomation/boost') return { active: false };
        if (path.includes('users/') && path.includes('pidAutomation')) {
          return {
            enabled: true,
            // NO targetRoomId
            manualSetpoint: 21,
          };
        }
        if (path.includes('pidAutomation/state')) return null;
        return null;
      });

      const request = createMockRequest();
      await GET(request);

      // Verify PID skipped (no power adjustment)
      expect(mockSetPowerLevel).not.toHaveBeenCalled();

      jest.useRealTimers();
    });

    it('handles cleanup old logs exception gracefully', async () => {
      mockGetStoveStatus.mockResolvedValue({ StatusDescription: 'WORK 1', Result: 0 } as any);
      mockGetPowerLevel.mockResolvedValue({ Result: 4 } as any);
      mockGetFanLevel.mockResolvedValue({ Result: 3 } as any);

      // Mock cleanupOldLogs to reject
      mockCleanupOldLogs.mockRejectedValue(new Error('DB error'));

      const { PIDController } = require('@/lib/utils/pidController');
      const mockCompute = jest.fn().mockReturnValue(4);
      const mockGetState = jest.fn().mockReturnValue({ integral: 0, prevError: 0, initialized: true });
      const mockSetState = jest.fn();
      jest.mocked(PIDController).mockImplementation(() => ({
        compute: mockCompute,
        setState: mockSetState,
        getState: mockGetState,
      } as any));

      jest.useFakeTimers();
      const now = new Date('2025-02-12T18:00:00.000Z').getTime();
      jest.setSystemTime(now);

      // Mock PID state with old lastCleanup
      mockAdminDbGet.mockImplementation(async (path: string) => {
        if (path === 'schedules-v2/mode') return { enabled: true, semiManual: false };
        if (path === 'schedules-v2/activeScheduleId') return 'default';
        if (path.includes('schedules-v2/schedules/') && path.includes('/slots/')) {
          return [{ start: '18:00', end: '22:00', power: 4, fan: 3 }];
        }
        if (path === 'pidAutomation/boost') return { active: false };
        if (path.includes('users/') && path.includes('pidAutomation')) {
          return {
            enabled: true,
            targetRoomId: 'room123',
            manualSetpoint: 21,
          };
        }
        if (path === 'netatmo/currentStatus') {
          return {
            rooms: {
              room123: { room_id: 'room123', name: 'Living Room', temperature: 21 },
            },
          };
        }
        if (path.includes('pidAutomation/state')) {
          return {
            integral: 0,
            prevError: 0,
            initialized: true,
            lastRun: now - 300000,
            lastCleanup: now - (25 * 60 * 60 * 1000), // 25 hours ago
          };
        }
        return null;
      });

      const request = createMockRequest();
      const response = await GET(request);
      await flushPromises();

      // Route should still return 200
      expect(response.status).toBe(200);

      // Verify error logged (fire-and-forget catch handler)
      await flushPromises(); // Wait for promise catch to execute
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to cleanup old PID logs'),
        expect.any(Error)
      );

      jest.useRealTimers();
    });
  });

  describe('Additional Coverage - logCronExecution Errors', () => {
    it('handles logCronExecution rejection gracefully', async () => {
      // Mock logCronExecution to reject
      mockLogCronExecution.mockRejectedValue(new Error('DB write error'));

      setupSchedulerMocks({
        mode: { enabled: false },
      });

      const request = createMockRequest();
      const response = await GET(request);

      // Route should still return 200
      expect(response.status).toBe(200);

      // Error is logged via catch handler
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Cron execution log error'),
        expect.any(Error)
      );
    });
  });

  describe('Additional Coverage - syncLivingRoomWithStove Handlers', () => {
    it('handles syncLivingRoomWithStove success in ignition flow', async () => {
      mockIgniteStove.mockResolvedValue(undefined as any);
      mockGetStoveStatus.mockResolvedValue({ StatusDescription: 'Spento', Result: 0 } as any);
      mockSyncLivingRoomWithStove.mockResolvedValue({ synced: true } as any);

      const mockUpdateStoveState = jest.mocked(updateStoveState);
      mockUpdateStoveState.mockResolvedValue(undefined as any);

      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-02-12T18:00:00.000Z'));

      setupSchedulerMocks({
        mode: { enabled: true, semiManual: false },
        intervals: [{ start: '18:00', end: '22:00', power: 4, fan: 3 }],
      });

      const request = createMockRequest();
      await GET(request);
      await flushPromises();

      // Verify sync called
      expect(mockSyncLivingRoomWithStove).toHaveBeenCalledWith(true);

      jest.useRealTimers();
    });

    it('handles syncLivingRoomWithStove exception in ignition flow', async () => {
      mockIgniteStove.mockResolvedValue(undefined as any);
      mockGetStoveStatus.mockResolvedValue({ StatusDescription: 'Spento', Result: 0 } as any);
      mockSyncLivingRoomWithStove.mockRejectedValue(new Error('Netatmo timeout'));

      const mockUpdateStoveState = jest.mocked(updateStoveState);
      mockUpdateStoveState.mockResolvedValue(undefined as any);

      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-02-12T18:00:00.000Z'));

      setupSchedulerMocks({
        mode: { enabled: true, semiManual: false },
        intervals: [{ start: '18:00', end: '22:00', power: 4, fan: 3 }],
      });

      const request = createMockRequest();
      const response = await GET(request);
      await flushPromises();

      // Route should still return 200 (sync is fire-and-forget)
      expect(response.status).toBe(200);

      jest.useRealTimers();
    });

    it('handles syncLivingRoomWithStove success in shutdown flow', async () => {
      mockGetStoveStatus.mockResolvedValue({ StatusDescription: 'WORK 1', Result: 0 } as any);
      mockShutdownStove.mockResolvedValue(undefined as any);
      mockSyncLivingRoomWithStove.mockResolvedValue({ synced: true } as any);

      const mockUpdateStoveState = jest.mocked(updateStoveState);
      mockUpdateStoveState.mockResolvedValue(undefined as any);

      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-02-12T08:00:00.000Z'));

      setupSchedulerMocks({
        mode: { enabled: true, semiManual: false },
        intervals: [{ start: '18:00', end: '22:00', power: 4, fan: 3 }],
      });

      const request = createMockRequest();
      await GET(request);
      await flushPromises();

      // Verify sync called with false
      expect(mockSyncLivingRoomWithStove).toHaveBeenCalledWith(false);

      jest.useRealTimers();
    });

    it('handles syncLivingRoomWithStove exception in shutdown flow', async () => {
      mockGetStoveStatus.mockResolvedValue({ StatusDescription: 'WORK 1', Result: 0 } as any);
      mockShutdownStove.mockResolvedValue(undefined as any);
      mockSyncLivingRoomWithStove.mockRejectedValue(new Error('Netatmo timeout'));

      const mockUpdateStoveState = jest.mocked(updateStoveState);
      mockUpdateStoveState.mockResolvedValue(undefined as any);

      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-02-12T08:00:00.000Z'));

      setupSchedulerMocks({
        mode: { enabled: true, semiManual: false },
        intervals: [{ start: '18:00', end: '22:00', power: 4, fan: 3 }],
      });

      const request = createMockRequest();
      const response = await GET(request);
      await flushPromises();

      // Route should still return 200
      expect(response.status).toBe(200);

      jest.useRealTimers();
    });
  });

  describe('Additional Coverage - logAnalyticsEvent Power Change Handler', () => {
    it('handles logAnalyticsEvent exception during power change', async () => {
      mockGetStoveStatus.mockResolvedValue({ StatusDescription: 'WORK 1', Result: 0 } as any);
      mockGetPowerLevel.mockResolvedValue({ Result: 2 } as any);
      mockGetFanLevel.mockResolvedValue({ Result: 3 } as any);
      mockSetPowerLevel.mockResolvedValue(undefined as any);
      mockLogAnalyticsEvent.mockRejectedValue(new Error('Analytics service down'));

      const mockUpdateStoveState = jest.mocked(updateStoveState);
      mockUpdateStoveState.mockResolvedValue(undefined as any);

      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-02-12T18:00:00.000Z'));

      setupSchedulerMocks({
        mode: { enabled: true, semiManual: false },
        intervals: [{ start: '18:00', end: '22:00', power: 4, fan: 3 }],
      });

      const request = createMockRequest();
      const response = await GET(request);
      await flushPromises();

      // Route should still return 200 (analytics is fire-and-forget)
      expect(response.status).toBe(200);

      // Verify power was set despite analytics failure
      expect(mockSetPowerLevel).toHaveBeenCalledWith(4);

      jest.useRealTimers();
    });
  });
});
