import { withAuthAndErrorHandler, success, ApiError, ERROR_CODES, HTTP_STATUS } from '@/lib/core';
import { fritzboxClient, getCachedData, checkRateLimitFritzBox, logDeviceEvent, getDeviceStates, updateDeviceStates } from '@/lib/fritzbox';

export const dynamic = 'force-dynamic';

/**
 * GET /api/fritzbox/devices
 * Retrieves network device list from Fritz!Box
 * Protected: Requires Auth0 authentication
 * Rate limited: 10 requests per minute
 * Cached: 60-second TTL
 *
 * Success: { devices: [...] }
 * Errors:
 *   - 429 RATE_LIMITED: Too many requests
 *   - Plus all health endpoint errors (403, 504, 500)
 */
export const GET = withAuthAndErrorHandler(async (request, context, session) => {
  // 1. Rate limit check
  const rateLimitResult = await checkRateLimitFritzBox(session.user.sub, 'devices');
  if (!rateLimitResult.allowed) {
    throw new ApiError(
      ERROR_CODES.RATE_LIMITED,
      `Troppe richieste. Riprova tra ${rateLimitResult.nextAllowedIn}s`,
      HTTP_STATUS.TOO_MANY_REQUESTS,
      { retryAfter: rateLimitResult.nextAllowedIn }
    );
  }

  // 2. Fetch with cache (60s TTL)
  const devices = await getCachedData('devices', () => fritzboxClient.getDevices());

  // 3. Detect device state changes and log events (fire-and-forget side-effect)
  try {
    const previousStates = await getDeviceStates();
    const currentStates = new Map<string, { active: boolean; lastSeen: number }>();
    const now = Date.now();

    for (const device of devices) {
      // Build current state
      currentStates.set(device.mac, {
        active: device.active,
        lastSeen: now,
      });

      const prevState = previousStates.get(device.mac);

      // Detect state changes
      if (!prevState && device.active) {
        // New device that is active -> connected
        await logDeviceEvent({
          deviceMac: device.mac,
          deviceName: device.name,
          deviceIp: device.ip,
          eventType: 'connected',
          timestamp: now,
        });
      } else if (prevState && prevState.active !== device.active) {
        // State change -> log appropriate event
        await logDeviceEvent({
          deviceMac: device.mac,
          deviceName: device.name,
          deviceIp: device.ip,
          eventType: device.active ? 'connected' : 'disconnected',
          timestamp: now,
        });
      }
      // No state change -> skip logging
    }

    // Persist current states for next poll
    await updateDeviceStates(currentStates);
  } catch (error) {
    // Event detection errors must NOT break the devices response
    console.error('[FritzBox/Devices] Event detection error:', error);
  }

  // 4. Return data
  return success({ devices });
}, 'FritzBox/Devices');
