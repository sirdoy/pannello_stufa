/**
 * Health Monitoring Notifications Tests
 *
 * Tests for notification types and triggering logic added in 10-05 gap closure.
 */

import {
  NOTIFICATION_TYPES,
  NOTIFICATION_CATEGORIES,
  buildNotificationPayload,
} from '@/lib/notificationTriggers';

describe('Health Monitoring Notification Types', () => {
  describe('Notification Type Definitions', () => {
    test('monitoring_connection_lost type exists with correct config', () => {
      const type = NOTIFICATION_TYPES.monitoring_connection_lost;

      expect(type).toBeDefined();
      expect(type.id).toBe('monitoring_connection_lost');
      expect(type.category).toBe('monitoring');
      expect(type.defaultEnabled).toBe(true);
      expect(type.priority).toBe('high');
      expect(type.url).toBe('/monitoring');
    });

    test('monitoring_state_mismatch type exists with correct config', () => {
      const type = NOTIFICATION_TYPES.monitoring_state_mismatch;

      expect(type).toBeDefined();
      expect(type.id).toBe('monitoring_state_mismatch');
      expect(type.category).toBe('monitoring');
      expect(type.defaultEnabled).toBe(true);
      expect(type.priority).toBe('high');
    });

    test('monitoring_stove_error type exists with correct config', () => {
      const type = NOTIFICATION_TYPES.monitoring_stove_error;

      expect(type).toBeDefined();
      expect(type.id).toBe('monitoring_stove_error');
      expect(type.category).toBe('monitoring');
      expect(type.defaultEnabled).toBe(true);
      expect(type.priority).toBe('high');
    });
  });

  describe('Monitoring Category', () => {
    test('monitoring category exists', () => {
      const category = NOTIFICATION_CATEGORIES.monitoring;

      expect(category).toBeDefined();
      expect(category.id).toBe('monitoring');
      expect(category.masterToggle).toBe(true);
    });
  });

  describe('Payload Building', () => {
    test('builds connection_lost payload with default message', () => {
      const payload = buildNotificationPayload('monitoring_connection_lost', {});

      expect(payload.notification.title).toBe('Stufa Disconnessa');
      expect(payload.notification.body).toContain('non risponde');
      expect(payload.data.priority).toBe('high');
    });

    test('builds state_mismatch payload with custom data', () => {
      const payload = buildNotificationPayload('monitoring_state_mismatch', {
        expected: 'ON',
        actual: 'STANDBY',
        message: 'Custom mismatch message',
      });

      expect(payload.notification.title).toBe('Anomalia Rilevata');
      expect(payload.notification.body).toBe('Custom mismatch message');
      expect((payload.data as any).expected).toBe('ON');
      expect((payload.data as any).actual).toBe('STANDBY');
    });

    test('builds stove_error payload with error code', () => {
      const payload = buildNotificationPayload('monitoring_stove_error', {
        errorCode: '03',
        errorDescription: 'Mancanza pellet',
      });

      expect(payload.notification.title).toBe('Errore Stufa Rilevato');
      expect(payload.notification.body).toContain('AL03');
      expect(payload.notification.body).toContain('Mancanza pellet');
    });
  });
});
