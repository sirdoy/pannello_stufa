/**
 * Tests for Coordination Preferences Service
 */

import {
  getCoordinationPreferences,
  updateCoordinationPreferences,
  getDefaultCoordinationPreferences,
} from '../../lib/coordinationPreferences';

// Mock dependencies
jest.mock('../../lib/firebaseAdmin');
jest.mock('../../lib/environmentHelper');

import { adminDbGet, adminDbSet } from '../../lib/firebaseAdmin';
import { getEnvironmentPath } from '../../lib/environmentHelper';

describe('coordinationPreferences', () => {
  const testUserId = 'auth0|12345';

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock implementations
    (getEnvironmentPath as jest.Mock).mockImplementation(path => `test/${path}`);
  });

  describe('getCoordinationPreferences', () => {
    it('returns defaults for new user', async () => {
      (adminDbGet as jest.Mock).mockResolvedValue(null);

      const prefs = await getCoordinationPreferences(testUserId);

      expect(prefs).toMatchObject({
        enabled: true,
        defaultBoost: 2,
        zones: [],
        notificationPreferences: {
          coordinationApplied: true,
          coordinationRestored: false,
          automationPaused: true,
          maxSetpointReached: true,
        },
        version: 1,
      });
      expect(adminDbGet).toHaveBeenCalledWith(`test/coordination/preferences/${testUserId}`);
    });

    it('returns stored preferences', async () => {
      const storedPrefs = {
        enabled: false,
        defaultBoost: 3,
        zones: [
          { roomId: '12345', roomName: 'Living Room', enabled: true, boost: null },
          { roomId: '67890', roomName: 'Bedroom', enabled: true, boost: 2.5 },
        ],
        notificationPreferences: {
          coordinationApplied: false,
          coordinationRestored: true,
          automationPaused: false,
          maxSetpointReached: true,
        },
        version: 5,
        updatedAt: '2026-01-27T10:00:00Z',
      };
      (adminDbGet as jest.Mock).mockResolvedValue(storedPrefs);

      const prefs = await getCoordinationPreferences(testUserId);

      expect(prefs).toEqual(storedPrefs);
      expect(adminDbGet).toHaveBeenCalledWith(`test/coordination/preferences/${testUserId}`);
    });

    it('uses environment-aware path', async () => {
      (adminDbGet as jest.Mock).mockResolvedValue(null);

      await getCoordinationPreferences(testUserId);

      expect(getEnvironmentPath).toHaveBeenCalledWith(`coordination/preferences/${testUserId}`);
    });
  });

  describe('updateCoordinationPreferences', () => {
    it('validates input with Zod', async () => {
      const existingPrefs = {
        enabled: true,
        defaultBoost: 2,
        zones: [],
        notificationPreferences: {
          coordinationApplied: true,
          coordinationRestored: false,
          automationPaused: true,
          maxSetpointReached: true,
        },
        version: 1,
      };
      (adminDbGet as jest.Mock).mockResolvedValue(existingPrefs);

      const updates = {
        defaultBoost: 3,
        zones: [
          { roomId: '12345', roomName: 'Living Room', enabled: true, boost: null },
        ],
      };

      const updatedPrefs = await updateCoordinationPreferences(testUserId, updates);

      expect(updatedPrefs.defaultBoost).toBe(3);
      expect(updatedPrefs.zones).toHaveLength(1);
      expect(updatedPrefs.zones[0]).toMatchObject({
        roomId: '12345',
        roomName: 'Living Room',
        enabled: true,
        boost: null,
      });
      expect(adminDbSet).toHaveBeenCalledWith(
        `test/coordination/preferences/${testUserId}`,
        updatedPrefs
      );
    });

    it('rejects invalid data', async () => {
      (adminDbGet as jest.Mock).mockResolvedValue({
        enabled: true,
        defaultBoost: 2,
        zones: [],
        notificationPreferences: {
          coordinationApplied: true,
          coordinationRestored: false,
          automationPaused: true,
          maxSetpointReached: true,
        },
        version: 1,
      });

      const invalidUpdates = {
        defaultBoost: 10, // Too high (max is 5)
      };

      await expect(
        updateCoordinationPreferences(testUserId, invalidUpdates)
      ).rejects.toThrow();

      expect(adminDbSet).not.toHaveBeenCalled();
    });

    it('increments version', async () => {
      const existingPrefs = {
        enabled: true,
        defaultBoost: 2,
        zones: [],
        notificationPreferences: {
          coordinationApplied: true,
          coordinationRestored: false,
          automationPaused: true,
          maxSetpointReached: true,
        },
        version: 3,
      };
      (adminDbGet as jest.Mock).mockResolvedValue(existingPrefs);

      const updatedPrefs = await updateCoordinationPreferences(testUserId, {
        defaultBoost: 3,
      });

      expect(updatedPrefs.version).toBe(4);
    });

    it('sets updatedAt', async () => {
      (adminDbGet as jest.Mock).mockResolvedValue({
        enabled: true,
        defaultBoost: 2,
        zones: [],
        notificationPreferences: {
          coordinationApplied: true,
          coordinationRestored: false,
          automationPaused: true,
          maxSetpointReached: true,
        },
        version: 1,
      });

      const before = new Date().toISOString();
      const updatedPrefs = await updateCoordinationPreferences(testUserId, {
        defaultBoost: 3,
      });
      const after = new Date().toISOString();

      expect(updatedPrefs.updatedAt).toBeDefined();
      expect(updatedPrefs.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(updatedPrefs.updatedAt >= before).toBe(true);
      expect(updatedPrefs.updatedAt <= after).toBe(true);
    });

    it('handles partial updates', async () => {
      const existingPrefs = {
        enabled: true,
        defaultBoost: 2,
        zones: [
          { roomId: '12345', roomName: 'Living Room', enabled: true, boost: null },
        ],
        notificationPreferences: {
          coordinationApplied: true,
          coordinationRestored: false,
          automationPaused: true,
          maxSetpointReached: true,
        },
        version: 2,
        updatedAt: '2026-01-27T10:00:00Z',
      };
      (adminDbGet as jest.Mock).mockResolvedValue(existingPrefs);

      const updates = {
        enabled: false, // Just disable coordination
      };

      const updatedPrefs = await updateCoordinationPreferences(testUserId, updates);

      expect(updatedPrefs.enabled).toBe(false);
      expect(updatedPrefs.defaultBoost).toBe(2); // Unchanged
      expect(updatedPrefs.zones).toHaveLength(1); // Unchanged
      expect(updatedPrefs.version).toBe(3); // Incremented
      expect(updatedPrefs.updatedAt).not.toBe('2026-01-27T10:00:00Z'); // Updated
    });
  });

  describe('zone configuration', () => {
    it('validates zone correctly', async () => {
      (adminDbGet as jest.Mock).mockResolvedValue({
        enabled: true,
        defaultBoost: 2,
        zones: [],
        notificationPreferences: {
          coordinationApplied: true,
          coordinationRestored: false,
          automationPaused: true,
          maxSetpointReached: true,
        },
        version: 1,
      });

      const updates = {
        zones: [
          { roomId: '12345', roomName: 'Living Room', enabled: true, boost: 2.5 },
          { roomId: '67890', roomName: 'Bedroom', enabled: false, boost: null },
        ],
      };

      const updatedPrefs = await updateCoordinationPreferences(testUserId, updates);

      expect(updatedPrefs.zones).toHaveLength(2);
      expect(updatedPrefs.zones[0]).toMatchObject({
        roomId: '12345',
        roomName: 'Living Room',
        enabled: true,
        boost: 2.5,
      });
      expect(updatedPrefs.zones[1]).toMatchObject({
        roomId: '67890',
        roomName: 'Bedroom',
        enabled: false,
        boost: null,
      });
    });

    it('rejects invalid zone (missing roomId)', async () => {
      (adminDbGet as jest.Mock).mockResolvedValue({
        enabled: true,
        defaultBoost: 2,
        zones: [],
        notificationPreferences: {
          coordinationApplied: true,
          coordinationRestored: false,
          automationPaused: true,
          maxSetpointReached: true,
        },
        version: 1,
      });

      const invalidUpdates = {
        zones: [
          { roomName: 'Living Room', enabled: true, boost: 2.5 }, // Missing roomId
        ],
      };

      await expect(
        updateCoordinationPreferences(testUserId, invalidUpdates)
      ).rejects.toThrow();
    });
  });

  describe('boost amount constraints', () => {
    it('accepts valid boost amounts', async () => {
      (adminDbGet as jest.Mock).mockResolvedValue({
        enabled: true,
        defaultBoost: 2,
        zones: [],
        notificationPreferences: {
          coordinationApplied: true,
          coordinationRestored: false,
          automationPaused: true,
          maxSetpointReached: true,
        },
        version: 1,
      });

      // Test min (0.5), middle (2.5), max (5)
      for (const boost of [0.5, 2.5, 5]) {
        const updatedPrefs = await updateCoordinationPreferences(testUserId, {
          defaultBoost: boost,
        });
        expect(updatedPrefs.defaultBoost).toBe(boost);
      }
    });

    it('rejects boost below minimum (0.5°C)', async () => {
      (adminDbGet as jest.Mock).mockResolvedValue({
        enabled: true,
        defaultBoost: 2,
        zones: [],
        notificationPreferences: {
          coordinationApplied: true,
          coordinationRestored: false,
          automationPaused: true,
          maxSetpointReached: true,
        },
        version: 1,
      });

      await expect(
        updateCoordinationPreferences(testUserId, { defaultBoost: 0.4 })
      ).rejects.toThrow();
    });

    it('rejects boost above maximum (5°C)', async () => {
      (adminDbGet as jest.Mock).mockResolvedValue({
        enabled: true,
        defaultBoost: 2,
        zones: [],
        notificationPreferences: {
          coordinationApplied: true,
          coordinationRestored: false,
          automationPaused: true,
          maxSetpointReached: true,
        },
        version: 1,
      });

      await expect(
        updateCoordinationPreferences(testUserId, { defaultBoost: 5.1 })
      ).rejects.toThrow();
    });
  });

  describe('getDefaultCoordinationPreferences', () => {
    it('returns validated defaults', () => {
      const defaults = getDefaultCoordinationPreferences();

      expect(defaults).toMatchObject({
        enabled: true,
        defaultBoost: 2,
        zones: [],
        notificationPreferences: {
          coordinationApplied: true,
          coordinationRestored: false,
          automationPaused: true,
          maxSetpointReached: true,
        },
        version: 1,
      });
    });
  });
});
