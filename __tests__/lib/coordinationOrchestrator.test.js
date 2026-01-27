/**
 * Tests for coordinationOrchestrator.js
 *
 * Tests the main coordination workflow orchestrator
 */

import {
  processCoordinationCycle,
  applySetpointBoost,
  restorePreviousSetpoints,
  sendCoordinationNotification,
} from '@/lib/coordinationOrchestrator';
import * as coordinationPreferences from '@/lib/coordinationPreferences';
import * as coordinationState from '@/lib/coordinationState';
import * as coordinationDebounce from '@/lib/coordinationDebounce';
import * as coordinationUserIntent from '@/lib/coordinationUserIntent';
import * as coordinationPauseCalculator from '@/lib/coordinationPauseCalculator';
import * as coordinationNotificationThrottle from '@/lib/coordinationNotificationThrottle';
import * as netatmoStoveSync from '@/lib/netatmoStoveSync';
import * as netatmoTokenHelper from '@/lib/netatmoTokenHelper';
import * as notificationTriggersServer from '@/lib/notificationTriggersServer';
import NETATMO_API from '@/lib/netatmoApi';

// Mock all dependencies
jest.mock('@/lib/coordinationPreferences');
jest.mock('@/lib/coordinationState');
jest.mock('@/lib/coordinationDebounce');
jest.mock('@/lib/coordinationUserIntent');
jest.mock('@/lib/coordinationPauseCalculator');
jest.mock('@/lib/coordinationNotificationThrottle');
jest.mock('@/lib/netatmoStoveSync');
jest.mock('@/lib/netatmoTokenHelper');
jest.mock('@/lib/notificationTriggersServer');
jest.mock('@/lib/netatmoApi');

describe('coordinationOrchestrator', () => {
  const mockUserId = 'user123';
  const mockHomeId = 'home456';

  beforeEach(() => {
    jest.clearAllMocks();

    // Default NETATMO_API mock
    NETATMO_API.getThermSchedules = jest.fn().mockResolvedValue([]);
  });

  // =============================================================================
  // Task 1: processCoordinationCycle
  // =============================================================================

  describe('processCoordinationCycle', () => {
    const mockPreferences = {
      enabled: true,
      defaultBoost: 2,
      zones: [
        { roomId: 'room1', roomName: 'Living Room', enabled: true, boost: 2 },
        { roomId: 'room2', roomName: 'Bedroom', enabled: true, boost: 1.5 },
      ],
    };

    const mockState = {
      stoveOn: false,
      automationPaused: false,
      pausedUntil: null,
      pauseReason: null,
      pendingDebounce: false,
      previousSetpoints: null,
    };

    beforeEach(() => {
      coordinationPreferences.getCoordinationPreferences.mockResolvedValue(mockPreferences);
      coordinationState.getCoordinationState.mockResolvedValue(mockState);
      coordinationState.updateCoordinationState.mockResolvedValue({});
      netatmoTokenHelper.getValidAccessToken.mockResolvedValue({ accessToken: 'token123' });
    });

    test('skips when coordination disabled', async () => {
      coordinationPreferences.getCoordinationPreferences.mockResolvedValue({
        ...mockPreferences,
        enabled: false,
      });

      const result = await processCoordinationCycle(mockUserId, 'WORK', mockHomeId);

      expect(result.action).toBe('skipped');
      expect(result.reason).toBe('disabled');
    });

    test('respects pause until pausedUntil', async () => {
      const pausedUntil = Date.now() + 30 * 60 * 1000; // 30 minutes from now
      coordinationState.getCoordinationState.mockResolvedValue({
        ...mockState,
        automationPaused: true,
        pausedUntil,
      });

      const result = await processCoordinationCycle(mockUserId, 'WORK', mockHomeId);

      expect(result.action).toBe('skipped');
      expect(result.reason).toBe('paused');
      expect(result.pausedUntil).toBe(pausedUntil);
      expect(result.remainingMs).toBeGreaterThan(0);
    });

    test('clears expired pause', async () => {
      const expiredPause = Date.now() - 1000; // 1 second ago
      coordinationState.getCoordinationState.mockResolvedValue({
        ...mockState,
        automationPaused: true,
        pausedUntil: expiredPause,
      });
      coordinationDebounce.handleStoveStateChange.mockResolvedValue({
        action: 'no_change',
      });

      const result = await processCoordinationCycle(mockUserId, 'STANDBY', mockHomeId);

      expect(coordinationState.updateCoordinationState).toHaveBeenCalledWith({
        automationPaused: false,
        pausedUntil: null,
        pauseReason: null,
      });
    });

    test('detects user intent and pauses', async () => {
      coordinationUserIntent.detectUserIntent.mockResolvedValue({
        manualChange: true,
        reason: 'Setpoint modificato manualmente (Living Room)',
        changes: [
          { roomId: 'room1', roomName: 'Living Room', type: 'setpoint_changed' },
        ],
      });

      // Mock NETATMO_API as an object with methods
      NETATMO_API.getThermSchedules = jest.fn().mockResolvedValue([
        {
          selected: true,
          timetable: [
            { m_offset: 0, zone_id: 1 },
            { m_offset: 360, zone_id: 2 },
          ],
          zones: [
            { id: 1, name: 'Comfort', temp: 21 },
            { id: 2, name: 'Night', temp: 18 },
          ],
        },
      ]);

      coordinationPauseCalculator.calculatePauseUntil.mockReturnValue({
        pauseUntil: Date.now() + 3600000,
        waitMinutes: 60,
      });

      coordinationNotificationThrottle.shouldSendCoordinationNotification.mockReturnValue({
        allowed: true,
      });

      notificationTriggersServer.triggerNotificationServer.mockResolvedValue({
        success: true,
      });

      const result = await processCoordinationCycle(mockUserId, 'WORK', mockHomeId);

      expect(result.action).toBe('paused');
      expect(result.reason).toBe('user_intent');
      expect(result.pausedUntil).toBeDefined();
      expect(coordinationState.updateCoordinationState).toHaveBeenCalledWith(
        expect.objectContaining({
          automationPaused: true,
          pausedUntil: expect.any(Number),
        })
      );
    });

    test('starts debounce on stove ON', async () => {
      coordinationUserIntent.detectUserIntent.mockResolvedValue({
        manualChange: false,
        changes: [],
      });

      coordinationDebounce.handleStoveStateChange.mockResolvedValue({
        action: 'timer_started',
        delayMs: 120000,
      });

      const result = await processCoordinationCycle(mockUserId, 'WORK', mockHomeId);

      expect(result.action).toBe('debouncing');
      expect(result.remainingMs).toBe(120000);
      expect(coordinationDebounce.handleStoveStateChange).toHaveBeenCalledWith(
        mockUserId,
        'ON',
        expect.any(Function)
      );
    });

    test('handles OFF during debounce (30s retry)', async () => {
      coordinationState.getCoordinationState.mockResolvedValue({
        ...mockState,
        stoveOn: true,
        pendingDebounce: true,
      });

      coordinationDebounce.handleStoveStateChange.mockResolvedValue({
        action: 'retry_started',
        delayMs: 30000,
      });

      const result = await processCoordinationCycle(mockUserId, 'STANDBY', mockHomeId);

      expect(result.action).toBe('retry_timer');
      expect(result.remainingMs).toBe(30000);
    });

    test('restores setpoints on stove OFF', async () => {
      coordinationState.getCoordinationState.mockResolvedValue({
        ...mockState,
        stoveOn: true,
        previousSetpoints: {
          room1: 21,
          room2: 19,
        },
      });

      coordinationDebounce.handleStoveStateChange.mockResolvedValue({
        action: 'executed_immediately',
        delayMs: 0,
      });

      netatmoStoveSync.restoreRoomSetpoints.mockResolvedValue({
        success: true,
        restoredRooms: [
          { roomId: 'room1', roomName: 'Living Room' },
          { roomId: 'room2', roomName: 'Bedroom' },
        ],
      });

      coordinationNotificationThrottle.shouldSendCoordinationNotification.mockReturnValue({
        allowed: true,
      });

      notificationTriggersServer.triggerNotificationServer.mockResolvedValue({
        success: true,
      });

      const result = await processCoordinationCycle(mockUserId, 'STANDBY', mockHomeId);

      expect(result.action).toBe('restored');
      expect(coordinationDebounce.handleStoveStateChange).toHaveBeenCalled();
    });
  });

  // =============================================================================
  // Task 2: applySetpointBoost and restorePreviousSetpoints
  // =============================================================================

  describe('applySetpointBoost', () => {
    const mockPreferences = {
      defaultBoost: 2,
      zones: [
        { roomId: 'room1', roomName: 'Living Room', enabled: true, boost: 2.5 },
        { roomId: 'room2', roomName: 'Bedroom', enabled: true }, // No zone-specific boost
      ],
    };

    beforeEach(() => {
      netatmoTokenHelper.getValidAccessToken.mockResolvedValue({ accessToken: 'token123' });
      coordinationState.getCoordinationState.mockResolvedValue({
        previousSetpoints: {},
      });
      coordinationState.updateCoordinationState.mockResolvedValue({});
    });

    test('uses zone-specific boost amounts', async () => {
      netatmoStoveSync.setRoomsToBoostMode.mockResolvedValue({
        success: true,
        appliedSetpoints: {
          room1: { previous: 20, applied: 22.5, capped: false },
        },
        previousSetpoints: { room1: 20 },
      });

      const result = await applySetpointBoost(mockUserId, mockHomeId, mockPreferences);

      expect(result.success).toBe(true);
      expect(netatmoStoveSync.setRoomsToBoostMode).toHaveBeenCalledWith(
        expect.objectContaining({
          rooms: [{ id: 'room1', name: 'Living Room' }],
        }),
        2.5, // Zone-specific boost
        expect.any(Object)
      );
    });

    test('caps at 30°C', async () => {
      netatmoStoveSync.setRoomsToBoostMode.mockResolvedValue({
        success: true,
        appliedSetpoints: {
          room1: { previous: 28, applied: 30, capped: true },
        },
        previousSetpoints: { room1: 28 },
        cappedRooms: ['Living Room'],
      });

      const result = await applySetpointBoost(mockUserId, mockHomeId, mockPreferences);

      expect(result.cappedRooms).toContain('Living Room');
    });

    test('stores previous setpoints in state', async () => {
      netatmoStoveSync.setRoomsToBoostMode.mockResolvedValue({
        success: true,
        appliedSetpoints: {
          room1: { previous: 21, applied: 23.5, capped: false },
        },
        previousSetpoints: { room1: 21 },
      });

      const result = await applySetpointBoost(mockUserId, mockHomeId, mockPreferences);

      expect(coordinationState.updateCoordinationState).toHaveBeenCalledWith({
        previousSetpoints: expect.objectContaining({
          room1: 21,
        }),
      });
    });
  });

  describe('restorePreviousSetpoints', () => {
    beforeEach(() => {
      netatmoTokenHelper.getValidAccessToken.mockResolvedValue({ accessToken: 'token123' });
      coordinationState.getCoordinationState.mockResolvedValue({
        previousSetpoints: {
          room1: 21,
          room2: 19,
        },
      });
      coordinationPreferences.getCoordinationPreferences.mockResolvedValue({
        zones: [
          { roomId: 'room1', roomName: 'Living Room', enabled: true },
          { roomId: 'room2', roomName: 'Bedroom', enabled: true },
        ],
      });
      coordinationState.updateCoordinationState.mockResolvedValue({});
    });

    test('uses stored previous setpoints', async () => {
      netatmoStoveSync.restoreRoomSetpoints.mockResolvedValue({
        success: true,
        restoredRooms: [
          { roomId: 'room1', roomName: 'Living Room', restoredTo: 21 },
          { roomId: 'room2', roomName: 'Bedroom', restoredTo: 19 },
        ],
      });

      const result = await restorePreviousSetpoints(mockUserId, mockHomeId);

      expect(result.success).toBe(true);
      expect(netatmoStoveSync.restoreRoomSetpoints).toHaveBeenCalledWith(
        expect.any(Object),
        { room1: 21, room2: 19 }
      );
    });

    test('clears state after restore', async () => {
      netatmoStoveSync.restoreRoomSetpoints.mockResolvedValue({
        success: true,
        restoredRooms: [
          { roomId: 'room1', roomName: 'Living Room' },
        ],
      });

      await restorePreviousSetpoints(mockUserId, mockHomeId);

      expect(coordinationState.updateCoordinationState).toHaveBeenCalledWith({
        previousSetpoints: null,
      });
    });
  });

  // =============================================================================
  // Task 3: sendCoordinationNotification
  // =============================================================================

  describe('sendCoordinationNotification', () => {
    beforeEach(() => {
      coordinationNotificationThrottle.recordNotificationSent.mockImplementation(() => {});
    });

    test('respects throttle', async () => {
      coordinationNotificationThrottle.shouldSendCoordinationNotification.mockReturnValue({
        allowed: false,
        waitSeconds: 1200,
        reason: 'global_throttle',
      });

      const result = await sendCoordinationNotification(mockUserId, 'coordination_applied', {});

      expect(result.sent).toBe(false);
      expect(result.reason).toBe('global_throttle');
      expect(result.waitSeconds).toBe(1200);
      expect(notificationTriggersServer.triggerNotificationServer).not.toHaveBeenCalled();
    });

    test('calls triggerNotificationServer when allowed', async () => {
      coordinationNotificationThrottle.shouldSendCoordinationNotification.mockReturnValue({
        allowed: true,
      });

      notificationTriggersServer.triggerNotificationServer.mockResolvedValue({
        success: true,
        skipped: false,
      });

      const result = await sendCoordinationNotification(mockUserId, 'coordination_applied', {
        appliedRooms: [
          { roomName: 'Living Room', boost: 2 },
        ],
      });

      expect(result.sent).toBe(true);
      expect(notificationTriggersServer.triggerNotificationServer).toHaveBeenCalledWith(
        mockUserId,
        'generic',
        expect.objectContaining({
          title: 'Coordinamento Stufa-Termostato',
          type: 'coordination_event',
        }),
        expect.any(Object)
      );
    });

    test('records notification sent', async () => {
      coordinationNotificationThrottle.shouldSendCoordinationNotification.mockReturnValue({
        allowed: true,
      });

      notificationTriggersServer.triggerNotificationServer.mockResolvedValue({
        success: true,
        skipped: false,
      });

      await sendCoordinationNotification(mockUserId, 'coordination_applied', {});

      expect(coordinationNotificationThrottle.recordNotificationSent).toHaveBeenCalledWith(mockUserId);
    });

    test('formats messages correctly', async () => {
      coordinationNotificationThrottle.shouldSendCoordinationNotification.mockReturnValue({
        allowed: true,
      });

      notificationTriggersServer.triggerNotificationServer.mockResolvedValue({
        success: true,
        skipped: false,
      });

      // Test coordination_applied
      await sendCoordinationNotification(mockUserId, 'coordination_applied', {
        appliedRooms: [
          { roomName: 'Living Room', boost: 2.5 },
        ],
      });

      expect(notificationTriggersServer.triggerNotificationServer).toHaveBeenCalledWith(
        mockUserId,
        'generic',
        expect.objectContaining({
          body: expect.stringContaining('Boost'),
          body: expect.stringContaining('Living Room'),
        }),
        expect.any(Object)
      );

      // Test automation_paused
      const pausedUntil = new Date('2024-01-01T15:30:00Z').getTime();
      await sendCoordinationNotification(mockUserId, 'automation_paused', {
        pausedUntil,
      });

      expect(notificationTriggersServer.triggerNotificationServer).toHaveBeenCalledWith(
        mockUserId,
        'generic',
        expect.objectContaining({
          body: expect.stringContaining('pausa fino alle'),
        }),
        expect.any(Object)
      );
    });

    test('returns throttle info when blocked', async () => {
      coordinationNotificationThrottle.shouldSendCoordinationNotification.mockReturnValue({
        allowed: false,
        waitSeconds: 600,
        reason: 'global_throttle',
      });

      const result = await sendCoordinationNotification(mockUserId, 'coordination_restored', {});

      expect(result).toEqual({
        sent: false,
        reason: 'global_throttle',
        waitSeconds: 600,
      });
    });
  });
});
