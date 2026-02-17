'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
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
 * - Loads 7 days of persisted history from Firebase RTDB on mount (immediately pre-populates chart)
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
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Load stored bandwidth history from server on mount.
   * Fetches 7 days of history so chart pre-populates immediately on page open.
   * Silently fails — chart will still work with live polling data.
   */
  const loadHistoryFromServer = useCallback(async () => {
    try {
      const response = await fetch('/api/fritzbox/bandwidth-history?range=7d');
      if (!response.ok) {
        return;
      }

      const json = await response.json() as {
        success?: boolean;
        points?: BandwidthHistoryPoint[];
        range?: string;
        totalCount?: number;
      };

      const points = json.points ?? [];
      if (points.length > 0) {
        // Sort ascending by time (oldest first — for chart rendering)
        const sorted = [...points].sort((a, b) => a.time - b.time);
        // Cap at MAX_POINTS (drop oldest if server returned more)
        const capped = sorted.length > MAX_POINTS ? sorted.slice(-MAX_POINTS) : sorted;
        setHistory(capped);
      }
    } catch {
      // Silent failure — chart still works with live polling data
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load historical data from server on mount
  useEffect(() => {
    void loadHistoryFromServer();
  }, [loadHistoryFromServer]);

  /**
   * Add a new bandwidth data point to the history buffer.
   * Automatically caps at MAX_POINTS by dropping oldest points.
   * Called from page orchestrator as new polling data arrives.
   *
   * Deduplicates by bandwidth.timestamp: the server-side 60s cache can return
   * the same response (same timestamp) for two consecutive 30s polls, which would
   * create duplicate entries in the history buffer. We skip the point if an entry
   * with the same timestamp already exists as the last point.
   */
  const addDataPoint = useCallback((bandwidth: BandwidthData) => {
    setHistory((prev) => {
      // Deduplicate: skip if the last point has the same timestamp.
      // This handles the case where the 60s server cache returns the same
      // bandwidth response (same fetched_at) for two consecutive 30s polls.
      const lastPoint = prev[prev.length - 1];
      if (lastPoint && lastPoint.time === bandwidth.timestamp) {
        return prev;
      }

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
  const isEmpty = history.length === 0 && !isLoading;
  const isCollecting = history.length > 0 && history.length < COLLECTING_THRESHOLD && !isLoading;

  return {
    chartData,
    timeRange,
    setTimeRange,
    addDataPoint,
    pointCount,
    isEmpty,
    isCollecting,
    isLoading,
  };
}
