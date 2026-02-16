'use client';

import { useState, useCallback, useMemo } from 'react';
import { decimateLTTB, type TimeSeriesPoint } from '@/lib/utils/decimateLTTB';
import type {
  BandwidthData,
  BandwidthHistoryPoint,
  BandwidthTimeRange,
  UseBandwidthHistoryReturn,
} from '@/app/components/devices/network/types';

const MAX_POINTS = 10080; // 7 days * 24 hours * 60 minutes = 10080 minutes
const DECIMATION_THRESHOLD = 500; // Target data points for chart rendering
const COLLECTING_THRESHOLD = 10; // Minimum points needed for meaningful chart

// Time range cutoffs in milliseconds
const TIME_RANGE_MS: Record<BandwidthTimeRange, number> = {
  '1h': 60 * 60 * 1000,        // 1 hour
  '24h': 24 * 60 * 60 * 1000,  // 24 hours
  '7d': 7 * 24 * 60 * 60 * 1000, // 7 days
};

/**
 * useBandwidthHistory
 *
 * Manages bandwidth data history with automatic buffering, time range filtering, and decimation.
 *
 * Key features:
 * - Buffers up to 7 days of data (10080 points max)
 * - Filters by time range (1h, 24h, 7d)
 * - Automatically decimates to 500 points when filtered data exceeds threshold
 * - Passive data accumulator (no polling — data fed via addDataPoint from page orchestrator)
 *
 * @returns {UseBandwidthHistoryReturn} Hook interface with chartData, controls, and status
 */
export function useBandwidthHistory(): UseBandwidthHistoryReturn {
  const [history, setHistory] = useState<BandwidthHistoryPoint[]>([]);
  const [timeRange, setTimeRange] = useState<BandwidthTimeRange>('24h');

  /**
   * Add a new bandwidth data point to the history buffer.
   * Automatically caps at MAX_POINTS by dropping oldest points.
   */
  const addDataPoint = useCallback((bandwidth: BandwidthData) => {
    setHistory((prev) => {
      const newPoint: BandwidthHistoryPoint = {
        time: bandwidth.timestamp,
        download: bandwidth.download,
        upload: bandwidth.upload,
      };

      const updated = [...prev, newPoint];

      // Cap at MAX_POINTS (drop oldest if exceeded)
      if (updated.length > MAX_POINTS) {
        return updated.slice(-MAX_POINTS);
      }

      return updated;
    });
  }, []);

  /**
   * Filter history by time range and decimate if necessary.
   * Uses download Mbps as the selection criterion for LTTB.
   */
  const chartData = useMemo(() => {
    if (history.length === 0) {
      return [];
    }

    const now = Date.now();
    const cutoff = now - TIME_RANGE_MS[timeRange];

    // Filter by time range
    const filtered = history.filter((point) => point.time >= cutoff);

    // If filtered data <= threshold, return as-is (no decimation needed)
    if (filtered.length <= DECIMATION_THRESHOLD) {
      return filtered;
    }

    // Decimate using download as the value criterion
    // Convert to TimeSeriesPoint format for decimation
    const downloadSeries: TimeSeriesPoint[] = filtered.map((p) => ({
      time: p.time,
      value: p.download,
    }));

    const decimated = decimateLTTB(downloadSeries, DECIMATION_THRESHOLD);

    // Map back to BandwidthHistoryPoint by finding upload values at selected times
    return decimated.map((point) => {
      const original = filtered.find((p) => p.time === point.time);
      return {
        time: point.time,
        download: point.value,
        upload: original?.upload ?? 0, // Should always find, but fallback to 0
      };
    });
  }, [history, timeRange]);

  // Derived status
  const pointCount = history.length;
  const isEmpty = history.length === 0;
  const isCollecting = history.length > 0 && history.length < COLLECTING_THRESHOLD;

  return {
    chartData,
    timeRange,
    setTimeRange,
    addDataPoint,
    pointCount,
    isEmpty,
    isCollecting,
  };
}
