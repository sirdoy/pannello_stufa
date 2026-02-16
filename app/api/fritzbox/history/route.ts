import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getDeviceEvents } from '@/lib/fritzbox';
import type { DeviceHistoryTimeRange } from '@/app/components/devices/network/types';

export const dynamic = 'force-dynamic';

/**
 * GET /api/fritzbox/history
 * Retrieves device connection event history with time range and device filtering
 * Protected: Requires Auth0 authentication
 *
 * Query params:
 *   - range: '1h' | '24h' | '7d' (default: '24h')
 *   - device: MAC address (optional, filters events to specific device)
 *
 * Success: { events: DeviceEvent[], range: string, totalCount: number }
 */

/**
 * Convert time range string to milliseconds
 */
function getTimeRangeMs(range: string): number {
  switch (range) {
    case '1h':
      return 60 * 60 * 1000; // 1 hour
    case '24h':
      return 24 * 60 * 60 * 1000; // 24 hours
    case '7d':
      return 7 * 24 * 60 * 60 * 1000; // 7 days
    default:
      return 24 * 60 * 60 * 1000; // Default to 24h
  }
}

export const GET = withAuthAndErrorHandler(async (request) => {
  // 1. Parse query params
  const url = new URL(request.url);
  const rangeParam = url.searchParams.get('range') ?? '24h';
  const deviceParam = url.searchParams.get('device');

  // Validate and normalize range
  const validRanges: DeviceHistoryTimeRange[] = ['1h', '24h', '7d'];
  const range: DeviceHistoryTimeRange = validRanges.includes(rangeParam as DeviceHistoryTimeRange)
    ? (rangeParam as DeviceHistoryTimeRange)
    : '24h';

  // 2. Calculate time window
  const endTime = Date.now();
  const startTime = endTime - getTimeRangeMs(range);

  // 3. Get events from Firebase
  let events = await getDeviceEvents(startTime, endTime);

  // 4. Filter by device MAC if provided
  if (deviceParam) {
    events = events.filter(e => e.deviceMac === deviceParam);
  }

  // 5. Return response
  return success({
    events,
    range,
    totalCount: events.length,
  });
}, 'FritzBox/History');
