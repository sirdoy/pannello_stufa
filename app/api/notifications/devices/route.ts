/**
 * API Route: Device List
 *
 * GET /api/notifications/devices
 *
 * Returns list of registered FCM devices for authenticated user
 */

import {
  withAuthAndErrorHandler,
  success,
} from '@/lib/core';
import { adminDbGet } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/notifications/devices
 * Fetch all registered devices for the authenticated user
 * Protected: Requires Auth0 authentication
 */
export const GET = withAuthAndErrorHandler(async (request, context, session) => {
  const user = session.user;

  // Fetch user's FCM tokens from Firebase
  const tokensData = await adminDbGet(`users/${user.sub}/fcmTokens`);

  if (!tokensData) {
    return success({
      devices: []
    });
  }

  /**
   * Calculate device status based on lastUsed timestamp
   * - active: used within 7 days
   * - stale: not used in 30+ days
   * - unknown: no lastUsed data
   */
  const calculateStatus = (lastUsed) => {
    if (!lastUsed) return 'unknown';
    const lastUsedDate = new Date(lastUsed);
    const now = new Date();
    const daysDiff = Math.floor((now - lastUsedDate) / (1000 * 60 * 60 * 24));

    if (daysDiff <= 7) return 'active';      // Used within 7 days
    if (daysDiff > 30) return 'stale';       // Not used in 30+ days
    return 'active';                          // 8-30 days still considered active
  };

  // Transform tokens data into device list
  const devices = Object.entries(tokensData).map(([tokenKey, tokenData]) => {
    const lastUsed = tokenData.lastUsed || tokenData.createdAt;
    return {
      id: tokenKey,                          // For React key prop
      tokenKey,
      token: tokenData.token,
      tokenPrefix: tokenData.token?.substring(0, 20) || 'unknown', // First 20 chars
      deviceId: tokenData.deviceId || 'unknown',
      displayName: tokenData.displayName || 'Unknown Device',
      platform: tokenData.platform || 'web',
      browser: tokenData.browser || 'Unknown',
      os: tokenData.os || 'Unknown',
      createdAt: tokenData.createdAt,
      lastUsed,
      status: calculateStatus(lastUsed),     // Calculated status
    };
  });

  // Sort by lastUsed descending (most recent first)
  devices.sort((a, b) => new Date(b.lastUsed) - new Date(a.lastUsed));

  return success({
    devices,
    count: devices.length
  });
}, 'Notifications/Devices');
