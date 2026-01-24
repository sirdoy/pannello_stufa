/**
 * Notifications Devices API
 *
 * GET /api/notifications/devices
 *
 * Lists all registered FCM devices for the authenticated user.
 *
 * Response:
 * {
 *   success: true,
 *   devices: [{
 *     id: string,           // tokenKey
 *     deviceId: string,     // Stable device identifier
 *     displayName: string,  // "Chrome on Windows"
 *     platform: string,     // ios, android, web
 *     browser: string,      // From deviceInfo
 *     os: string,           // From deviceInfo
 *     createdAt: ISO string,
 *     lastUsed: ISO string,
 *     status: 'active' | 'stale' | 'unknown',
 *     tokenPrefix: string   // First 20 chars for identification
 *   }],
 *   count: number
 * }
 */

import { NextResponse } from 'next/server';
import { adminDbGet } from '@/lib/firebaseAdmin';
import { subDays } from 'date-fns';

export const dynamic = 'force-dynamic';

/**
 * Format device display name from deviceInfo
 */
function formatDeviceName(deviceInfo) {
  if (!deviceInfo) return 'Unknown Device';

  const browser = deviceInfo.browser?.name || 'Browser';
  const os = deviceInfo.os?.name || 'Unknown OS';

  return `${browser} on ${os}`;
}

/**
 * Calculate device status based on lastUsed timestamp
 */
function calculateStatus(lastUsed) {
  if (!lastUsed) return 'unknown';

  const lastUsedDate = new Date(lastUsed);
  const now = new Date();
  const sevenDaysAgo = subDays(now, 7);
  const thirtyDaysAgo = subDays(now, 30);

  if (lastUsedDate >= sevenDaysAgo) {
    return 'active';
  } else if (lastUsedDate < thirtyDaysAgo) {
    return 'stale';
  }

  return 'unknown';
}

/**
 * Get all registered devices for the current user
 */
export async function GET(request) {
  try {
    // TODO: Replace with actual authentication
    // For now, get devices from all users (admin view)
    // In production, filter by authenticated userId
    const userId = 'current-user'; // This should come from auth session

    // For admin dashboard, get all users' devices
    const usersData = await adminDbGet('users') || {};

    const devices = [];

    Object.entries(usersData).forEach(([uid, userData]) => {
      const tokens = userData.fcmTokens || {};

      Object.entries(tokens).forEach(([tokenKey, tokenData]) => {
        const device = {
          id: tokenKey,
          deviceId: tokenData.deviceId || 'unknown',
          displayName: formatDeviceName(tokenData.deviceInfo),
          platform: tokenData.deviceInfo?.platform || 'web',
          browser: tokenData.deviceInfo?.browser?.name || 'Unknown',
          os: tokenData.deviceInfo?.os?.name || 'Unknown',
          createdAt: tokenData.createdAt || null,
          lastUsed: tokenData.lastUsed || null,
          status: calculateStatus(tokenData.lastUsed),
          tokenPrefix: tokenData.token ? tokenData.token.substring(0, 20) : 'unknown',
          userId: uid, // Include userId for admin context
        };

        devices.push(device);
      });
    });

    // Sort by lastUsed descending (most recent first)
    devices.sort((a, b) => {
      if (!a.lastUsed) return 1;
      if (!b.lastUsed) return -1;
      return new Date(b.lastUsed) - new Date(a.lastUsed);
    });

    return NextResponse.json({
      success: true,
      devices,
      count: devices.length,
    });
  } catch (error) {
    console.error('❌ Error fetching devices:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch devices',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
