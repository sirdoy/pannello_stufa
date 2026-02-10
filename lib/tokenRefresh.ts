/**
 * Token Refresh - Proactive token refresh for FCM
 *
 * Firebase recommends monthly token refresh to maintain deliverability.
 * This module checks token age on app startup and refreshes if >30 days old.
 */

import { getMessaging, getToken, deleteToken } from 'firebase/messaging';
import { loadToken, saveToken, getTokenAge, updateLastUsed } from './tokenStorage';
import { getCurrentDeviceFingerprint } from './deviceFingerprint';

// Refresh tokens older than 30 days
const REFRESH_THRESHOLD_DAYS = 30;

/**
 * Check if token should be refreshed based on age
 * @returns {Promise<boolean>} true if token needs refresh
 */
export async function shouldRefreshToken() {
  const age = await getTokenAge();

  if (age === null) {
    // No token stored - needs fresh registration, not refresh
    return false;
  }

  return age > REFRESH_THRESHOLD_DAYS;
}

/**
 * Get VAPID key (duplicated from notificationService to avoid circular deps)
 */
function getVapidKey() {
  return process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
}

/**
 * Debug logger
 * Note: Debug log API has been removed, using console only
 */
function debugLog(message: string, data: Record<string, unknown> = {}): void {
}

/**
 * Check token age and refresh if necessary
 *
 * Called on app startup to ensure token freshness.
 * Does NOT request new permissions - only refreshes existing valid token.
 *
 * @param {string} userId - User ID for server registration
 * @returns {Promise<{refreshed: boolean, token: string|null, error?: string}>}
 */
export async function checkAndRefreshToken(userId: string): Promise<{
  refreshed: boolean;
  token: string | null;
  error?: string;
}> {
  if (typeof window === 'undefined') {
    return { refreshed: false, token: null, error: 'SSR' };
  }

  // Check if notification permission is granted
  if (Notification.permission !== 'granted') {
    return { refreshed: false, token: null, error: 'No permission' };
  }

  try {
    // Load existing token from storage
    const stored = await loadToken();

    if (!stored?.token) {
      debugLog('No stored token found, skipping refresh');
      return { refreshed: false, token: null, error: 'No stored token' };
    }

    // Calculate token age
    const age = await getTokenAge();
    debugLog('Token age check', { ageDays: age?.toFixed(1), threshold: REFRESH_THRESHOLD_DAYS });

    if (age !== null && age <= REFRESH_THRESHOLD_DAYS) {
      // Token is fresh enough, just update lastUsed
      await updateLastUsed();
      debugLog('Token is fresh, updated lastUsed');
      return { refreshed: false, token: stored.token };
    }

    // Token needs refresh
    debugLog('Token needs refresh', { ageDays: age?.toFixed(1) });

    const vapidKey = getVapidKey();
    if (!vapidKey) {
      return { refreshed: false, token: stored.token, error: 'No VAPID key' };
    }

    const messaging = getMessaging();

    // Step 1: Delete the old token (explicit revocation)
    try {
      await deleteToken(messaging);
      debugLog('Old token deleted');
    } catch (deleteError: unknown) {
      // If delete fails, continue anyway - we'll overwrite
      debugLog('Delete token failed (continuing)', { error: (deleteError as Error).message });
    }

    // Step 2: Get service worker registration
    let registration = null;
    try {
      registration = await navigator.serviceWorker.getRegistration();
    } catch (e: unknown) {
      debugLog('Could not get SW registration', { error: (e as Error).message });
    }

    // Step 3: Get new token
    const getTokenOptions: { vapidKey: string; serviceWorkerRegistration?: ServiceWorkerRegistration } = { vapidKey };
    if (registration?.active) {
      getTokenOptions.serviceWorkerRegistration = registration;
    }

    const newToken = await getToken(messaging, getTokenOptions);

    if (!newToken) {
      debugLog('Failed to get new token');
      return { refreshed: false, token: stored.token, error: 'getToken returned null' };
    }

    debugLog('New token obtained', { tokenPreview: newToken.substring(0, 20) + '...' });

    // Step 4: Get device fingerprint for registration
    const fingerprint = getCurrentDeviceFingerprint();

    // Step 5: Register new token with server
    const response = await fetch('/api/notifications/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: newToken,
        deviceId: fingerprint?.deviceId || stored.deviceId,
        displayName: fingerprint?.displayName,
        deviceInfo: fingerprint?.deviceInfo || stored.deviceInfo,
        userAgent: navigator.userAgent,
        platform: stored.platform || 'other',
        isPWA: stored.isPWA || false,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      debugLog('Server registration failed', { error });
      // Still save locally even if server fails
    }

    // Step 6: Save new token locally
    await saveToken(newToken, {
      deviceId: fingerprint?.deviceId ?? stored.deviceId ?? undefined,
      deviceInfo: fingerprint?.deviceInfo ?? stored.deviceInfo ?? undefined,
      createdAt: new Date().toISOString(), // Reset creation date
    });

    debugLog('Token refresh complete');

    return { refreshed: true, token: newToken };

  } catch (error: unknown) {
    debugLog('Token refresh error', { error: (error as Error).message });
    console.error('[tokenRefresh] Error:', error);

    // Return stored token if refresh failed
    const stored = await loadToken();
    return { refreshed: false, token: stored?.token || null, error: (error as Error).message };
  }
}

/**
 * Initialize token management on app startup
 *
 * Should be called once when app loads. Checks for stored token,
 * refreshes if needed, and returns current token status.
 *
 * @param {string} userId - User ID
 * @returns {Promise<{hasToken: boolean, token: string|null, wasRefreshed: boolean}>}
 */
export async function initializeTokenManagement(userId: string): Promise<{
  hasToken: boolean;
  token: string | null;
  wasRefreshed: boolean;
}> {
  if (typeof window === 'undefined') {
    return { hasToken: false, token: null, wasRefreshed: false };
  }

  try {
    // Check for stored token
    const stored = await loadToken();

    if (!stored?.token) {
      return { hasToken: false, token: null, wasRefreshed: false };
    }

    // Check if refresh is needed
    const result = await checkAndRefreshToken(userId);

    return {
      hasToken: !!result.token,
      token: result.token,
      wasRefreshed: result.refreshed,
    };

  } catch (error) {
    console.error('[tokenRefresh] Initialize failed:', error);
    return { hasToken: false, token: null, wasRefreshed: false };
  }
}

/**
 * Force token refresh (for manual refresh button or troubleshooting)
 *
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, token: string|null, error?: string}>}
 */
export async function forceTokenRefresh(userId: string): Promise<{
  success: boolean;
  token: string | null;
  error?: string;
}> {
  if (typeof window === 'undefined') {
    return { success: false, token: null, error: 'SSR' };
  }

  debugLog('Force refresh requested');

  // Temporarily set a very old createdAt to trigger refresh
  const stored = await loadToken();
  if (stored) {
    // Modify stored data to force refresh
    await saveToken(stored.token, {
      deviceId: stored.deviceId ?? undefined,
      deviceInfo: stored.deviceInfo ?? undefined,
      createdAt: new Date(0).toISOString(), // Very old date
    });
  }

  const result = await checkAndRefreshToken(userId);

  return {
    success: result.refreshed,
    token: result.token,
    error: result.error,
  };
}
