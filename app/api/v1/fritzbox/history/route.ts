import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getDeviceEvents } from '@/lib/fritzbox';
import type { DeviceHistoryTimeRange } from '@/app/components/devices/network/types';

export const dynamic = 'force-dynamic';

/**
 * GET /api/fritzbox/history
 * Retrieves device connection/disconnection events from Firebase RTDB.
 * Events are state changes only (connected/disconnected), not raw snapshots.
 * Protected: Requires Auth0 authentication
 *
 * Query params:
 *   - range: '1h' | '24h' | '7d' (default: '24h')
 *   - device: MAC address (optional, filters events to specific device)
 *
 * Success: { events: DeviceEvent[], range: string, totalCount: number }
 */

function getTimeRangeHours(range: string): number {
  switch (range) {
    case '1h': return 1;
    case '24h': return 24;
    case '7d': return 168;
    default: return 24;
  }
}

export const GET = withAuthAndErrorHandler(async (request) => {
  const url = new URL(request.url);
  const rangeParam = url.searchParams.get('range') ?? '24h';
  const deviceParam = url.searchParams.get('device');

  const validRanges: DeviceHistoryTimeRange[] = ['1h', '24h', '7d'];
  const range: DeviceHistoryTimeRange = validRanges.includes(rangeParam as DeviceHistoryTimeRange)
    ? (rangeParam as DeviceHistoryTimeRange)
    : '24h';

  const hours = getTimeRangeHours(range);
  const now = Date.now();
  const startTime = now - hours * 60 * 60 * 1000;
  const endTime = now;
  const allEvents = await getDeviceEvents(startTime, endTime);

  // Filter by device MAC if specified
  const events = deviceParam
    ? allEvents.filter(e => e.deviceMac === deviceParam)
    : allEvents;

  return success({
    events,
    range,
    totalCount: events.length,
  });
}, 'FritzBox/History');
