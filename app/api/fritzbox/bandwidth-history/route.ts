import { withAuthAndErrorHandler, success } from '@/lib/core';
import { getBandwidthHistory } from '@/lib/fritzbox';
import type { BandwidthTimeRange } from '@/app/components/devices/network/types';

export const dynamic = 'force-dynamic';

/**
 * GET /api/fritzbox/bandwidth-history
 * Retrieves persisted bandwidth history from Firebase RTDB by time range
 * Protected: Requires Auth0 authentication
 * No rate limiting: Read-only, low frequency (only called on page mount)
 *
 * Query params:
 *   - range: '1h' | '24h' | '7d' (default: '24h')
 *
 * Success: { points: BandwidthHistoryPoint[], range: string, totalCount: number }
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

  // Validate and normalize range
  const validRanges: BandwidthTimeRange[] = ['1h', '24h', '7d'];
  const range: BandwidthTimeRange = validRanges.includes(rangeParam as BandwidthTimeRange)
    ? (rangeParam as BandwidthTimeRange)
    : '24h';

  // 2. Calculate time window
  const endTime = Date.now();
  const startTime = endTime - getTimeRangeMs(range);

  // 3. Get points from Firebase
  const points = await getBandwidthHistory(startTime, endTime);

  // 4. Return response
  return success({
    points,
    range,
    totalCount: points.length,
  });
}, 'FritzBox/BandwidthHistory');
