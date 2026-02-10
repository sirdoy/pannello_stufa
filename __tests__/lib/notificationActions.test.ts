import {
  NOTIFICATION_ACTIONS,
  ACTION_CATEGORIES,
  getStoveActions,
  getThermostatActions,
  getActionsForNotificationType,
  supportsNotificationActions,
  getNotificationCapabilities,
} from '@/lib/notificationActions';

describe('notificationActions', () => {
  describe('NOTIFICATION_ACTIONS constants', () => {
    it('defines stove shutdown action', () => {
      expect(NOTIFICATION_ACTIONS.STOVE_SHUTDOWN).toBe('stove-shutdown');
    });

    it('defines stove view details action', () => {
      expect(NOTIFICATION_ACTIONS.STOVE_VIEW_DETAILS).toBe('view-details');
    });

    it('defines thermostat manual action', () => {
      expect(NOTIFICATION_ACTIONS.THERMOSTAT_MANUAL).toBe('thermostat-manual');
    });

    it('defines thermostat view action', () => {
      expect(NOTIFICATION_ACTIONS.THERMOSTAT_VIEW).toBe('thermostat-view');
    });
  });

  describe('ACTION_CATEGORIES constants', () => {
    it('defines stove error category', () => {
      expect(ACTION_CATEGORIES.STOVE_ERROR).toBe('STOVE_ERROR_ACTIONS');
    });

    it('defines thermostat alert category', () => {
      expect(ACTION_CATEGORIES.THERMOSTAT_ALERT).toBe('THERMOSTAT_ALERT_ACTIONS');
    });

    it('defines maintenance category', () => {
      expect(ACTION_CATEGORIES.MAINTENANCE).toBe('MAINTENANCE_ACTIONS');
    });
  });

  describe('getStoveActions', () => {
    it('returns array with shutdown and view-details actions', () => {
      const actions = getStoveActions();
      expect(actions).toHaveLength(2);
      expect(actions[0]).toEqual({
        action: 'stove-shutdown',
        title: 'Spegni stufa',
      });
      expect(actions[1]).toEqual({
        action: 'view-details',
        title: 'Dettagli',
      });
    });
  });

  describe('getThermostatActions', () => {
    it('returns array with manual and view actions', () => {
      const actions = getThermostatActions();
      expect(actions).toHaveLength(2);
      expect(actions[0]).toEqual({
        action: 'thermostat-manual',
        title: 'Imposta manuale',
      });
      expect(actions[1]).toEqual({
        action: 'thermostat-view',
        title: 'Dettagli',
      });
    });
  });

  describe('getActionsForNotificationType', () => {
    it('returns stove actions for stove_error_critical', () => {
      const actions = getActionsForNotificationType('stove_error_critical');
      expect(actions).not.toBeNull();
      expect(actions![0]!.action).toBe(NOTIFICATION_ACTIONS.STOVE_SHUTDOWN);
    });

    it('returns stove actions for stove_error_error', () => {
      const actions = getActionsForNotificationType('stove_error_error');
      expect(actions).not.toBeNull();
      expect(actions![0]!.action).toBe(NOTIFICATION_ACTIONS.STOVE_SHUTDOWN);
    });

    it('returns stove actions for stove_error_warning', () => {
      const actions = getActionsForNotificationType('stove_error_warning');
      expect(actions).not.toBeNull();
      expect(actions![0]!.action).toBe(NOTIFICATION_ACTIONS.STOVE_SHUTDOWN);
    });

    it('returns stove actions for stove_unexpected_off', () => {
      const actions = getActionsForNotificationType('stove_unexpected_off');
      expect(actions).not.toBeNull();
      expect(actions![0]!.action).toBe(NOTIFICATION_ACTIONS.STOVE_SHUTDOWN);
    });

    it('returns stove actions for monitoring_stove_error', () => {
      const actions = getActionsForNotificationType('monitoring_stove_error');
      expect(actions).not.toBeNull();
      expect(actions![0]!.action).toBe(NOTIFICATION_ACTIONS.STOVE_SHUTDOWN);
    });

    it('returns thermostat actions for netatmo_temperature_low', () => {
      const actions = getActionsForNotificationType('netatmo_temperature_low');
      expect(actions).not.toBeNull();
      expect(actions![0]!.action).toBe(NOTIFICATION_ACTIONS.THERMOSTAT_MANUAL);
    });

    it('returns thermostat actions for netatmo_temperature_high', () => {
      const actions = getActionsForNotificationType('netatmo_temperature_high');
      expect(actions).not.toBeNull();
      expect(actions![0]!.action).toBe(NOTIFICATION_ACTIONS.THERMOSTAT_MANUAL);
    });

    it('returns thermostat actions for netatmo_connection_lost', () => {
      const actions = getActionsForNotificationType('netatmo_connection_lost');
      expect(actions).not.toBeNull();
      expect(actions![0]!.action).toBe(NOTIFICATION_ACTIONS.THERMOSTAT_MANUAL);
    });

    it('returns null for scheduler_ignition (no actions)', () => {
      expect(getActionsForNotificationType('scheduler_ignition')).toBeNull();
    });

    it('returns null for scheduler_shutdown (no actions)', () => {
      expect(getActionsForNotificationType('scheduler_shutdown')).toBeNull();
    });

    it('returns null for maintenance_80 (no actions)', () => {
      expect(getActionsForNotificationType('maintenance_80')).toBeNull();
    });

    it('returns null for system_update (no actions)', () => {
      expect(getActionsForNotificationType('system_update')).toBeNull();
    });

    it('returns null for unknown type', () => {
      expect(getActionsForNotificationType('unknown_type')).toBeNull();
    });
  });

  describe('supportsNotificationActions', () => {
    it('returns false on server (no window)', () => {
      // In Jest/Node, window is not undefined but Notification is not available
      // The function should handle this gracefully
      expect(typeof supportsNotificationActions()).toBe('boolean');
    });

    it('returns false when Notification API not available', () => {
      // Default test env doesn't have Notification
      expect(supportsNotificationActions()).toBe(false);
    });
  });

  describe('getNotificationCapabilities', () => {
    it('returns capabilities object', () => {
      const caps = getNotificationCapabilities();
      expect(caps).toHaveProperty('supported');
      expect(caps).toHaveProperty('actions');
      expect(caps).toHaveProperty('maxActions');
      expect(typeof caps.maxActions).toBe('number');
    });

    it('reports actions not supported in test environment', () => {
      const caps = getNotificationCapabilities();
      expect(caps.actions).toBe(false);
      expect(caps.maxActions).toBe(0);
    });
  });
});
