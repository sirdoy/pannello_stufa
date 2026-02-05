/**
 * Notification data types - matches Firebase /notifications/* structure
 */

/** Notification types available in the system */
export type NotificationType =
  | 'alert'
  | 'system'
  | 'maintenance'
  | 'scheduler'
  | 'coordination';

/** Notification delivery status */
export type NotificationStatus =
  | 'pending'
  | 'sent'
  | 'delivered'
  | 'displayed'
  | 'failed';

/** FCM token record in Firebase */
export interface FCMToken {
  token: string;
  deviceId: string;
  deviceName?: string;
  platform: 'web' | 'android' | 'ios';
  createdAt: string;
  lastUsedAt: string;
  status: 'active' | 'inactive' | 'invalid';
}

/** Notification preferences */
export interface NotificationPreferences {
  enabled: boolean;
  types: {
    alert: boolean;
    system: boolean;
    maintenance: boolean;
    scheduler: boolean;
    coordination: boolean;
  };
  dndEnabled: boolean;
  dndStart?: string; // HH:MM format
  dndEnd?: string; // HH:MM format
  timezone?: string;
}

/** Notification history entry (Firestore) */
export interface NotificationHistoryEntry {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  status: NotificationStatus;
  sentAt: string;
  deliveredAt?: string;
  displayedAt?: string;
  deviceId?: string;
}
