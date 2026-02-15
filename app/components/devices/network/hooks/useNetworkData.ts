/**
 * useNetworkData Hook
 *
 * Encapsulates all Fritz!Box network state management:
 * - Polling via useAdaptivePolling (30s visible / 5min hidden)
 * - Data fetching from 3 Fritz!Box API routes
 * - Sparkline data buffering (max 12 points)
 * - Health computation with hysteresis
 * - Error handling that preserves cached data
 * - Staleness tracking
 *
 * This hook guarantees SINGLE polling loop for NetworkCard.
 */

'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAdaptivePolling } from '@/lib/hooks/useAdaptivePolling';
import { useVisibility } from '@/lib/hooks/useVisibility';
import { computeNetworkHealth, mapHealthToDeviceCard } from '../networkHealthUtils';
import type {
  BandwidthData,
  DeviceData,
  WanData,
  SparklinePoint,
  NetworkHealthStatus,
  NetworkError,
  UseNetworkDataReturn,
} from '../types';

/**
 * Custom hook for Fritz!Box network data management
 *
 * @returns All network state and actions
 */
export function useNetworkData(): UseNetworkDataReturn {
  // Core state
  const [bandwidth, setBandwidth] = useState<BandwidthData | null>(null);
  const [devices, setDevices] = useState<DeviceData[]>([]);
  const [wan, setWan] = useState<WanData | null>(null);
  const [downloadHistory, setDownloadHistory] = useState<SparklinePoint[]>([]);
  const [uploadHistory, setUploadHistory] = useState<SparklinePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [stale, setStale] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [error, setError] = useState<NetworkError | null>(null);
  const [health, setHealth] = useState<NetworkHealthStatus>('poor');

  // Refs for hysteresis tracking
  const healthRef = useRef<NetworkHealthStatus>('poor');
  const consecutiveReadingsRef = useRef<number>(0);

  // Visibility tracking for adaptive polling
  const isVisible = useVisibility();
  const interval = isVisible ? 30000 : 300000; // 30s visible, 5min hidden

  // Fetch data from Fritz!Box API routes
  const fetchData = useCallback(async () => {
    try {
      setError(null);

      const [bwRes, devRes, wanRes] = await Promise.all([
        fetch('/api/fritzbox/bandwidth'),
        fetch('/api/fritzbox/devices'),
        fetch('/api/fritzbox/wan'),
      ]);

      // Handle individual response errors
      if (!bwRes.ok || !devRes.ok || !wanRes.ok) {
        // Find the first failed response
        const errorRes = [bwRes, devRes, wanRes].find(r => !r.ok);
        if (errorRes) {
          const errorData = await errorRes.json() as {
            code?: string;
            message?: string;
            retryAfter?: number;
          };

          // Map RFC 9457 error codes to NetworkError
          if (errorData.code === 'TR064_NOT_ENABLED' || errorData.code === 'FRITZBOX_NOT_CONFIGURED') {
            setError({
              type: 'setup',
              message: errorData.message || 'Fritz!Box non configurato'
            });
          } else if (errorData.code === 'FRITZBOX_TIMEOUT') {
            // Timeout - mark stale but keep cached data
            setStale(true);
            // DON'T clear existing data
          } else if (errorData.code === 'RATE_LIMITED') {
            setError({
              type: 'rate_limited',
              message: errorData.message || 'Troppo veloce, riprova tra poco',
              retryAfter: errorData.retryAfter
            });
          } else {
            setError({
              type: 'generic',
              message: errorData.message || 'Errore connessione Fritz!Box'
            });
          }
          return; // Keep previous data
        }
      }

      const [bwData, devData, wanData] = await Promise.all([
        bwRes.json(),
        devRes.json(),
        wanRes.json(),
      ]) as [
        { bandwidth?: BandwidthData },
        { devices?: DeviceData[] },
        { wan?: WanData }
      ];

      // Update state
      const bw = bwData.bandwidth;
      if (bw) {
        setBandwidth(bw);

        // Update sparkline buffers (max 12 points = 6 min at 30s interval)
        const now = Date.now();
        setDownloadHistory(prev => [...prev, { time: now, mbps: bw.download }].slice(-12));
        setUploadHistory(prev => [...prev, { time: now, mbps: bw.upload }].slice(-12));
      }

      setDevices(devData.devices || []);
      setWan(wanData.wan || null);

      // Update health
      const newHealthResult = computeNetworkHealth({
        wanConnected: wanData.wan?.connected ?? false,
        wanUptime: wanData.wan?.uptime ?? 0,
        downloadMbps: bw?.download ?? 0,
        uploadMbps: bw?.upload ?? 0,
        linkSpeedMbps: wanData.wan?.linkSpeed,
        previousHealth: healthRef.current,
        consecutiveReadings: consecutiveReadingsRef.current,
      });

      setHealth(newHealthResult.health);
      healthRef.current = newHealthResult.health;
      consecutiveReadingsRef.current = newHealthResult.consecutiveReadings;

      // Clear error and stale
      setError(null);
      setStale(false);
      setLastUpdated(Date.now());
    } catch (err) {
      // Network error — keep cached data, mark stale
      setStale(true);
      if (!bandwidth && !wan) {
        // No cached data at all — set generic error
        setError({
          type: 'generic',
          message: 'Impossibile raggiungere Fritz!Box'
        });
      }
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies - stable callback

  // Adaptive polling - 30s visible, 5min hidden
  useAdaptivePolling({
    callback: fetchData,
    interval,
    alwaysActive: false,  // Non-safety-critical monitoring
    immediate: true,      // Fetch on mount
  });

  // Derived state
  const connected = useMemo(() => wan?.connected ?? false, [wan]);
  const activeDeviceCount = useMemo(() => devices.filter(d => d.active).length, [devices]);
  const healthMapped = useMemo(() => mapHealthToDeviceCard(health), [health]);

  return {
    // Core data
    bandwidth,
    devices,
    wan,

    // Sparkline buffers
    downloadHistory,
    uploadHistory,

    // Status
    loading,
    connected,
    stale,
    lastUpdated,

    // Health
    health,
    healthMapped,

    // Error
    error,

    // Derived
    activeDeviceCount,
  };
}
