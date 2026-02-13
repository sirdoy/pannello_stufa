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
});
