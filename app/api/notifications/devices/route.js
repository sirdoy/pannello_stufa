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

  // Transform tokens data into device list
  const devices = Object.entries(tokensData).map(([tokenKey, tokenData]) => ({
    tokenKey,
    token: tokenData.token,
    deviceId: tokenData.deviceId || 'unknown',
    displayName: tokenData.displayName || 'Unknown Device',
    platform: tokenData.platform || 'web',
    browser: tokenData.browser || 'Unknown',
    os: tokenData.os || 'Unknown',
    createdAt: tokenData.createdAt,
    lastUsed: tokenData.lastUsed || tokenData.createdAt,
  }));

  // Sort by lastUsed descending (most recent first)
  devices.sort((a, b) => new Date(b.lastUsed) - new Date(a.lastUsed));

  return success({
    devices,
    count: devices.length
  });
}, 'Notifications/Devices');
