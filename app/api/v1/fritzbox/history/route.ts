import { withAuthAndErrorHandler, success } from '@/lib/core';
import { fritzboxClient } from '@/lib/fritzbox';
import { MAC_PARAM } from '@/lib/fritzbox/fritzboxQuery';
import type { DeviceHistoryTimeRange } from '@/app/components/devices/network/types';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/fritzbox/history
 * Retrieves device connection/disconnection events from the backend
 * (/api/v1/fritzbox/history/device-events, computed from device snapshots).
 * Events are state changes only (connected/disconnected), not raw snapshots.
 * (The legacy Firebase event log is no longer written by anything.)
 * Protected: Requires an authenticated session
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

  // Invalid MAC filter → no match (same outcome as the old exact-match filter)
  if (deviceParam && !MAC_PARAM.test(deviceParam)) {
    return success({ events: [], range, totalCount: 0 });
  }

  const events = [...(await fritzboxClient.getDeviceEvents(hours, deviceParam ?? undefined))]
    .sort((a, b) => b.timestamp - a.timestamp); // newest first

  return success({
    events,
    range,
    totalCount: events.length,
  });
}, 'FritzBox/History');
