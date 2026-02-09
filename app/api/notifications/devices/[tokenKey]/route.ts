/**
 * API Route: Device Management
 *
 * PATCH /api/notifications/devices/[tokenKey] - Update device display name
 * DELETE /api/notifications/devices/[tokenKey] - Remove device
 *
 * Protected: Requires Auth0 authentication
 * Security: Only device owner can modify their own devices
 */

import {
  withAuthAndErrorHandler,
  success,
  error,
  parseJsonOrThrow,
} from '@/lib/core';
import { adminDbGet, adminDbUpdate, adminDbRemove } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

interface UpdateDeviceBody {
  displayName: string;
}

/**
 * PATCH /api/notifications/devices/[tokenKey]
 * Update device display name
 *
 * Body: { displayName: string }
 *
 * Validates:
 * - displayName is non-empty string (max 50 chars)
 * - Device belongs to authenticated user
 *
 * Returns:
 * - 200: { message, displayName, tokenKey }
 * - 400: displayName validation error
 * - 404: Device not found or unauthorized
 */
export const PATCH = withAuthAndErrorHandler(async (request, context, session) => {
  const userId = session.user.sub;
  const { tokenKey } = await context.params;
  const body = await parseJsonOrThrow(request) as UpdateDeviceBody;

  // Validate displayName
  const { displayName } = body;
  if (!displayName || typeof displayName !== 'string') {
    return error('displayName is required', 'VALIDATION_ERROR', 400);
  }
  if (displayName.length > 50) {
    return error('displayName must be 50 characters or less', 'VALIDATION_ERROR', 400);
  }

  // Verify device belongs to user
  const devicePath = `users/${userId}/fcmTokens/${tokenKey}`;
  const device = await adminDbGet(devicePath);
  if (!device) {
    return error('Device not found', 'NOT_FOUND', 404);
  }

  // Update device name
  await adminDbUpdate(devicePath, {
    displayName: displayName.trim(),
    updatedAt: new Date().toISOString(),
  });

  return success({
    message: 'Device name updated',
    displayName: displayName.trim(),
    tokenKey,
  });
}, 'Notifications/DeviceName');

/**
 * DELETE /api/notifications/devices/[tokenKey]
 * Remove device from user's registered devices
 *
 * Validates:
 * - Device belongs to authenticated user
 *
 * Effect:
 * - Removes device from Firebase users/{userId}/fcmTokens/{tokenKey}
 * - Device will no longer receive notifications
 *
 * Returns:
 * - 200: { message, tokenKey }
 * - 404: Device not found or unauthorized
 */
export const DELETE = withAuthAndErrorHandler(async (request, context, session) => {
  const userId = session.user.sub;
  const { tokenKey } = await context.params;

  // Verify device belongs to user
  const devicePath = `users/${userId}/fcmTokens/${tokenKey}`;
  const device = await adminDbGet(devicePath);
  if (!device) {
    return error('Device not found', 'NOT_FOUND', 404);
  }

  // Remove device
  await adminDbRemove(devicePath);

  return success({
    message: 'Device removed successfully',
    tokenKey,
  });
}, 'Notifications/DeviceRemove');
