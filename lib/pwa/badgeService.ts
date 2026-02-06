/**
 * App Badge Service
 *
 * Manages the app badge (notification count) shown on the app icon.
 * Works with the Service Worker for badge updates on push notifications.
 *
 * Badge count = active errors + maintenance alerts
 *
 * @example
 * import { setBadgeCount, clearBadge, incrementBadge } from '@/lib/pwa/badgeService';
 *
 * // Set specific count
 * await setBadgeCount(3);
 *
 * // Clear badge
 * await clearBadge();
 *
 * // Increment badge (called on new notification)
 * await incrementBadge();
 */

import { put, get, STORES } from './indexedDB';

// Badge API declarations (not in all TypeScript DOM libs yet)
declare global {
  interface Navigator {
    setAppBadge?(count?: number): Promise<void>;
    clearAppBadge?(): Promise<void>;
  }
}

// Badge count key in IndexedDB
const BADGE_KEY = 'badgeCount';

interface BadgeState {
  key: string;
  value: number;
}

interface AlertData {
  errors?: number;
  needsMaintenance?: boolean;
}

/**
 * Check if Badge API is supported
 * @returns {boolean}
 */
export function isBadgeSupported(): boolean {
  return typeof navigator !== 'undefined' && 'setAppBadge' in navigator;
}

/**
 * Get current badge count from IndexedDB
 * @returns {Promise<number>}
 */
export async function getBadgeCount(): Promise<number> {
  try {
    const result = await get<BadgeState>(STORES.APP_STATE, BADGE_KEY);
    return result?.value || 0;
  } catch (error) {
    console.error('[BadgeService] Failed to get badge count:', error);
    return 0;
  }
}

/**
 * Save badge count to IndexedDB
 * @param {number} count - Badge count
 * @returns {Promise<void>}
 */
async function saveBadgeCount(count: number): Promise<void> {
  try {
    await put(STORES.APP_STATE, { key: BADGE_KEY, value: count });
  } catch (error) {
    console.error('[BadgeService] Failed to save badge count:', error);
  }
}

/**
 * Set the app badge count
 * @param {number} count - Number to show on badge
 * @returns {Promise<boolean>} Success status
 */
export async function setBadgeCount(count: number): Promise<boolean> {
  if (!isBadgeSupported()) {
    console.log('[BadgeService] Badge API not supported');
    return false;
  }

  try {
    const safeCount = Math.max(0, Math.floor(count));

    if (safeCount > 0) {
      await navigator.setAppBadge!(safeCount);
    } else {
      await navigator.clearAppBadge!();
    }

    await saveBadgeCount(safeCount);
    console.log('[BadgeService] Badge set to:', safeCount);
    return true;
  } catch (error) {
    console.error('[BadgeService] Failed to set badge:', error);
    return false;
  }
}

/**
 * Clear the app badge
 * @returns {Promise<boolean>} Success status
 */
export async function clearBadge(): Promise<boolean> {
  if (!isBadgeSupported()) {
    return false;
  }

  try {
    await navigator.clearAppBadge!();
    await saveBadgeCount(0);

    // Also notify Service Worker
    await notifyServiceWorker('CLEAR_BADGE');

    console.log('[BadgeService] Badge cleared');
    return true;
  } catch (error) {
    console.error('[BadgeService] Failed to clear badge:', error);
    return false;
  }
}

/**
 * Increment badge count by 1
 * @returns {Promise<number>} New badge count
 */
export async function incrementBadge(): Promise<number> {
  const current = await getBadgeCount();
  const newCount = current + 1;
  await setBadgeCount(newCount);
  return newCount;
}

/**
 * Decrement badge count by 1 (min 0)
 * @returns {Promise<number>} New badge count
 */
export async function decrementBadge(): Promise<number> {
  const current = await getBadgeCount();
  const newCount = Math.max(0, current - 1);
  await setBadgeCount(newCount);
  return newCount;
}

/**
 * Update badge based on active alerts
 * @param {Object} alerts - Alert counts
 * @param {number} alerts.errors - Number of active errors
 * @param {boolean} alerts.needsMaintenance - Whether maintenance is needed
 * @returns {Promise<number>} Total badge count
 */
export async function updateBadgeFromAlerts({ errors = 0, needsMaintenance = false }: AlertData): Promise<number> {
  const totalCount = errors + (needsMaintenance ? 1 : 0);
  await setBadgeCount(totalCount);
  return totalCount;
}

/**
 * Send message to Service Worker
 * @param {string} type - Message type
 * @param {Object} data - Message data
 */
async function notifyServiceWorker(type: string, data: Record<string, unknown> = {}): Promise<void> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    if (registration.active) {
      registration.active.postMessage({ type, data });
    }
  } catch (error) {
    console.error('[BadgeService] Failed to notify Service Worker:', error);
  }
}

/**
 * Initialize badge on app load
 * Syncs badge count from IndexedDB to actual badge
 * @returns {Promise<number>} Current badge count
 */
export async function initializeBadge(): Promise<number> {
  if (!isBadgeSupported()) {
    return 0;
  }

  const count = await getBadgeCount();

  if (count > 0) {
    await navigator.setAppBadge!(count);
  } else {
    await navigator.clearAppBadge!();
  }

  console.log('[BadgeService] Badge initialized:', count);
  return count;
}

export default {
  isBadgeSupported,
  getBadgeCount,
  setBadgeCount,
  clearBadge,
  incrementBadge,
  decrementBadge,
  updateBadgeFromAlerts,
  initializeBadge,
};
