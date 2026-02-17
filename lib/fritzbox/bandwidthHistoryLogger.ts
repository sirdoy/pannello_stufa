/**
 * Bandwidth History Logger
 *
 * Provides Firebase RTDB persistence and querying for bandwidth readings.
 * Readings are stored in date-keyed paths for efficient range queries.
 * Old data (>7 days) is cleaned up on each write.
 *
 * Quick Task 27: Historical Bandwidth Data
 */

import { adminDbSet, adminDbGet, adminDbRemove } from '@/lib/firebaseAdmin';
import { getEnvironmentPath } from '@/lib/environmentHelper';
import { format, eachDayOfInterval } from 'date-fns';
import type { BandwidthData, BandwidthHistoryPoint } from '@/app/components/devices/network/types';

/**
 * Append a bandwidth reading to Firebase RTDB.
 * Stored at: {env}/fritzbox/bandwidth_history/{YYYY-MM-DD}/{timestamp}
 *
 * @param data - Bandwidth reading to persist
 */
export async function appendBandwidthReading(data: BandwidthData): Promise<void> {
  const dateKey = format(new Date(data.timestamp), 'yyyy-MM-dd');
  const eventKey = `${data.timestamp}`;

  const basePath = getEnvironmentPath('fritzbox/bandwidth_history');
  const path = `${basePath}/${dateKey}/${eventKey}`;

  await adminDbSet(path, {
    time: data.timestamp,
    download: data.download,
    upload: data.upload,
  });
}

/**
 * Generate array of date strings between start and end (inclusive)
 * Uses date-fns eachDayOfInterval for correctness
 *
 * @param startDate - Start date (YYYY-MM-DD)
 * @param endDate - End date (YYYY-MM-DD)
 * @returns Array of date strings
 */
function generateDateRange(startDate: string, endDate: string): string[] {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const dates = eachDayOfInterval({ start, end });
  return dates.map(date => format(date, 'yyyy-MM-dd'));
}

/**
 * Get bandwidth readings within a time range.
 * Queries all date nodes in range in parallel, merges, filters by exact timestamp,
 * and sorts oldest first (ascending — for chart rendering).
 *
 * @param startTime - Start timestamp (Unix ms)
 * @param endTime - End timestamp (Unix ms)
 * @returns Array of bandwidth history points sorted oldest first
 */
export async function getBandwidthHistory(startTime: number, endTime: number): Promise<BandwidthHistoryPoint[]> {
  const startDate = format(new Date(startTime), 'yyyy-MM-dd');
  const endDate = format(new Date(endTime), 'yyyy-MM-dd');

  const dateRange = generateDateRange(startDate, endDate);
  const basePath = getEnvironmentPath('fritzbox/bandwidth_history');

  // Query all date nodes in parallel
  const dateQueries = dateRange.map(async (date) => {
    const path = `${basePath}/${date}`;
    const data = await adminDbGet(path);
    return data;
  });

  const results = await Promise.all(dateQueries);

  // Merge all readings from all date nodes
  const allPoints: BandwidthHistoryPoint[] = [];

  for (const dateData of results) {
    if (!dateData || typeof dateData !== 'object') {
      continue;
    }

    const readings = Object.values(dateData) as { time: number; download: number; upload: number }[];
    for (const reading of readings) {
      allPoints.push({
        time: reading.time,
        download: reading.download,
        upload: reading.upload,
      });
    }
  }

  // Filter readings within exact timestamp range
  const filteredPoints = allPoints.filter(
    point => point.time >= startTime && point.time <= endTime
  );

  // Sort oldest first (ascending — for chart rendering)
  filteredPoints.sort((a, b) => a.time - b.time);

  return filteredPoints;
}

/**
 * Clean up bandwidth history older than 7 days.
 * Lists all date nodes under the bandwidth_history path and removes old ones.
 *
 * Called fire-and-forget from the bandwidth route on each poll.
 */
export async function cleanupOldBandwidthHistory(): Promise<void> {
  const basePath = getEnvironmentPath('fritzbox/bandwidth_history');
  const data = await adminDbGet(basePath);

  if (!data || typeof data !== 'object') {
    return;
  }

  const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const cutoffDateStr = format(cutoffDate, 'yyyy-MM-dd');

  const dateKeys = Object.keys(data as Record<string, unknown>);

  // Remove all date nodes older than 7 days
  const removalPromises = dateKeys
    .filter(dateKey => dateKey < cutoffDateStr)
    .map(dateKey => adminDbRemove(`${basePath}/${dateKey}`));

  await Promise.all(removalPromises);
}
