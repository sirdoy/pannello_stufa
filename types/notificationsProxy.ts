/**
 * Web Push notifications sent by the Pi (workspace ROADMAP M48).
 * Source: ../docs/api/notifications.md
 */

export type PushEvent =
  | 'scheduler_ignition'
  | 'scheduler_shutdown'
  | 'scheduler_ignite_failed'
  | 'stove_unexpected_off'
  | 'stove_alarm'
  | 'stove_status_work'
  | 'stove_pellet_low'
  | 'maintenance_80'
  | 'maintenance_90'
  | 'maintenance_100'
  | 'dirigera_sensors_unreachable'
  | 'test';

/** Browser `PushSubscription.toJSON()` (the fields the backend needs). */
export interface PushSubscriptionJson {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export interface SubscribeRequest extends PushSubscriptionJson {
  device_name?: string | null;
  user_agent?: string | null;
  user_id?: string | null;
}

export interface RotateRequest {
  old_endpoint: string;
  subscription: PushSubscriptionJson;
}

export interface PushSubscriptionInfo {
  id: number;
  endpoint_host: string;
  device_name: string | null;
  user_agent: string | null;
  user_id: string | null;
  created_at: number;
  updated_at: number;
  last_success_at: number | null;
  last_error: string | null;
  failure_count: number;
}

export interface PushSubscriptionList {
  items: PushSubscriptionInfo[];
  total_count: number;
}

export interface PushSendResult {
  sent: number;
  failed: number;
  removed: number;
  /** Devices skipped because their user switched the event off (M61). */
  muted?: number;
}

export interface PushHistoryItem {
  id: number;
  ts: number;
  event: PushEvent | string;
  title: string;
  body: string;
  url: string | null;
  sent: number;
  failed: number;
}

export interface PushHistory {
  items: PushHistoryItem[];
  total_count: number;
  limit: number;
  offset: number;
}

/** One event the user can switch on/off (M61); `enabled` is the choice of that user only. */
export interface EventPreference {
  event: PushEvent | string;
  title: string;
  description: string;
  group: string;
  group_title: string;
  priority: 'normal' | 'high';
  enabled: boolean;
}

export interface PushPreferences {
  user_id: string;
  items: EventPreference[];
}

/** JSON decrypted by the service worker (`app/sw.ts`). */
export interface PushPayload {
  title: string;
  body: string;
  url: string;
  tag: string;
  priority: 'normal' | 'high';
  event: PushEvent | string;
  ts: number;
}
