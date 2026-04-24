import { withAuthAndErrorHandler, success } from '@/lib/core';
import { fritzboxClient } from '@/lib/fritzbox';
import type { BandwidthTimeRange } from '@/app/components/devices/network/types';

export const dynamic = 'force-dynamic';

/**
 * GET /api/fritzbox/bandwidth-history
 * Proxies historical bandwidth data from external Fritz!Box API
 * Protected: Requires Auth0 authentication
 *
 * Query params:
 *   - range: '1h' | '24h' | '7d' (default: '24h')
 *
 * Success: { points: BandwidthHistoryPoint[], range: string, totalCount: number }
 */

function rangeToHours(range: BandwidthTimeRange): number {
  switch (range) {
    case '1h': return 1;
    case '24h': return 24;
    case '7d': return 168;
  }
}

export const GET = withAuthAndErrorHandler(async (request) => {
  const url = new URL(request.url);
  const rangeParam = url.searchParams.get('range') ?? '24h';

  const validRanges: BandwidthTimeRange[] = ['1h', '24h', '7d'];
  const range: BandwidthTimeRange = validRanges.includes(rangeParam as BandwidthTimeRange)
    ? (rangeParam as BandwidthTimeRange)
    : '24h';

  const hours = rangeToHours(range);
  const points = await fritzboxClient.getBandwidthHistory(hours);

  return success({
    points,
    range,
    totalCount: points.length,
  });
}, 'FritzBox/BandwidthHistory');
