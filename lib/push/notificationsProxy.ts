/**
 * Web Push notifications proxy (server-only, workspace ROADMAP M48).
 *
 * Thin wrappers over haClient for ../docs/api/notifications.md: the Pi stores
 * the browser subscriptions and sends every push itself.
 */

import { haDelete, haGet, haPost, haPostNoContent } from '@/lib/haClient';
import type {
  PushHistory,
  PushSendResult,
  PushSubscriptionInfo,
  PushSubscriptionList,
  RotateRequest,
  SubscribeRequest,
} from '@/types/notificationsProxy';

const BASE = '/api/v1/notifications';

export const getVapidPublicKey = () => haGet<{ public_key: string }>(`${BASE}/vapid-public-key`);

export const listSubscriptions = () => haGet<PushSubscriptionList>(`${BASE}/subscriptions`);

export const subscribe = (body: SubscribeRequest) =>
  haPost<PushSubscriptionInfo>(`${BASE}/subscriptions`, body);

export const removeSubscriptionByEndpoint = (endpoint: string) =>
  haPostNoContent(`${BASE}/subscriptions/remove`, { endpoint });

export const rotateSubscription = (body: RotateRequest) =>
  haPost<PushSubscriptionInfo>(`${BASE}/subscriptions/rotate`, body);

export const deleteSubscription = (id: number) => haDelete(`${BASE}/subscriptions/${id}`);

export const sendTestPush = (subscriptionId?: number) =>
  haPost<PushSendResult>(
    `${BASE}/test`,
    subscriptionId === undefined ? {} : { subscription_id: subscriptionId }
  );

export const getPushHistory = (limit: number, offset: number) =>
  haGet<PushHistory>(`${BASE}/history?limit=${limit}&offset=${offset}`);
