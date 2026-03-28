/**
 * useNetworkData Hook
 *
 * Encapsulates all Fritz!Box network state management:
 * - Polling via useAdaptivePolling (60s visible / 5min hidden)
 * - Data fetching from 3 Fritz!Box API routes
 * - Sparkline data buffering (max 120 points = 2h at 60s)
 * - Seeds sparklines with historical bandwidth data on mount
 * - Health computation with hysteresis (trend-aware via historical avg)
 * - Error handling that preserves cached data
 * - Staleness tracking
 *
 * This hook guarantees SINGLE polling loop for NetworkCard.
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useAdaptivePolling } from '@/lib/hooks/useAdaptivePolling';
import { useVisibility } from '@/lib/hooks/useVisibility';
import { useWebSocketContext } from '@/app/context/WebSocketContext';
import { ReadyState } from '@/lib/hooks/useWebSocketManager';
import { computeNetworkHealth, mapHealthToDeviceCard } from '../networkHealthUtils';
import type { FritzBoxData } from '@/types/websocket';
import type {
  BandwidthData,
  BandwidthHistoryPoint,
  DeviceData,
  WanData,
  SparklinePoint,
  NetworkHealthStatus,
  NetworkError,
  UseNetworkDataReturn,
} from '../types';
import type { DeviceCategory } from '@/types/firebase/network';

// 2h of data at 60s polling interval
const SPARKLINE_MAX_POINTS = 120;

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

  // Ref to track MACs that have been enriched with categories
  const enrichedMacsRef = useRef<Set<string>>(new Set());

  // Refs for stale-closure-safe reads of bandwidth/wan in fetchData error guards
  const bandwidthRef = useRef<BandwidthData | null>(null);
  const wanRef = useRef<WanData | null>(null);

  // WS context — primary data channel (MIG-04)
  const { subscribe, unsubscribe, readyState } = useWebSocketContext();
  const isWsConnected = readyState === ReadyState.OPEN;

  // Seed sparklines with historical data on mount (fire-and-forget)
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await fetch('/api/fritzbox/bandwidth-history?range=1h');
        if (!res.ok) return;

        const json = await res.json() as {
          success?: boolean;
          points?: BandwidthHistoryPoint[];
        };

        const points = json.points;
        if (points && points.length > 0) {
          const sorted = [...points].sort((a, b) => a.time - b.time);
          setDownloadHistory(sorted.map(p => ({ time: p.time, mbps: p.download })));
          setUploadHistory(sorted.map(p => ({ time: p.time, mbps: p.upload })));
        }
      } catch {
        // Silent failure — sparklines will populate from polling
      }
    };

    void loadHistory();
  }, []);

  // Visibility tracking for adaptive polling
  const isVisible = useVisibility();
  const interval = isVisible ? 60000 : 300000; // 60s visible, 5min hidden

  /**
   * Enrich devices with categories via vendor-lookup API.
   * Only enriches new/unenriched MACs (not in enrichedMacsRef).
   * Fire-and-forget with silent failure — self-heals on next poll.
   */
  const enrichDevicesWithCategories = async (rawDevices: DeviceData[]): Promise<DeviceData[]> => {
    try {
      // Find MACs that need enrichment (not in enrichedMacsRef)
      const unenrichedDevices = rawDevices.filter(
        d => d.mac && !enrichedMacsRef.current.has(d.mac)
      );

      if (unenrichedDevices.length === 0) {
        // All devices already enriched — skip API calls
        return rawDevices;
      }

      // Batch enrichment with rate limiting (5 at a time to avoid overwhelming API)
      const enrichedData = [...rawDevices];
      const batchSize = 5;

      for (let i = 0; i < unenrichedDevices.length; i += batchSize) {
        const batch = unenrichedDevices.slice(i, i + batchSize);

        const results = await Promise.allSettled(
          batch.map(async (device) => {
            const response = await fetch(`/api/fritzbox/vendor-lookup?mac=${encodeURIComponent(device.mac)}`);
            if (!response.ok) return null;

            const data = await response.json() as {
              vendor?: string;
              category?: DeviceCategory;
              cached?: boolean;
              overridden?: boolean;
            };

            return { mac: device.mac, category: data.category };
          })
        );

        // Update enrichedData with successful results
        results.forEach((result, idx) => {
          if (result.status === 'fulfilled' && result.value) {
            const { mac, category } = result.value;
            const deviceIndex = enrichedData.findIndex(d => d.mac === mac);
            if (deviceIndex !== -1 && category) {
              const device = enrichedData[deviceIndex];
              enrichedData[deviceIndex] = {
                ...device,
                category
              } as DeviceData;
              enrichedMacsRef.current.add(mac);
            }
          }
        });
      }

      return enrichedData;
    } catch {
      // Silent failure — return devices unchanged, will retry on next poll
      return rawDevices;
    }
  };

  // Ref to avoid stale closure on enrichDevicesWithCategories in WS useEffect (D-18)
  const enrichDevicesWithCategoriesRef = useRef(enrichDevicesWithCategories);
  enrichDevicesWithCategoriesRef.current = enrichDevicesWithCategories;

  // WS subscription: primary data channel (MIG-04)
  // Only subscribe when WS is OPEN — avoids spurious subscribe calls when disconnected
  useEffect(() => {
    if (!isWsConnected) return;

    const handleMessage = (raw: unknown) => {
      const data = raw as FritzBoxData;

      // Bandwidth: bps → Mbps (D-04)
      if (data.bandwidth) {
        const downloadMbps = data.bandwidth.downstream_bps / 1_000_000;
        const uploadMbps = data.bandwidth.upstream_bps / 1_000_000;
        const bw: BandwidthData = { download: downloadMbps, upload: uploadMbps, timestamp: Date.now() };
        setBandwidth(bw);
        bandwidthRef.current = bw;
        // Append to sparkline — same arrays as HTTP path (D-07)
        const now = Date.now();
        setDownloadHistory(prev => [...prev, { time: now, mbps: downloadMbps }].slice(-SPARKLINE_MAX_POINTS));
        setUploadHistory(prev => [...prev, { time: now, mbps: uploadMbps }].slice(-SPARKLINE_MAX_POINTS));
      }

      // WAN: field rename (D-05)
      if (data.wan) {
        const mappedWan: WanData = {
          connected: data.wan.is_connected,
          uptime: data.wan.uptime,
          externalIp: data.wan.external_ip ?? undefined,
          linkSpeed: data.wan.max_downstream_bps / 1_000_000,
          timestamp: Date.now(),
        };
        setWan(mappedWan);
        wanRef.current = mappedWan;
      }

      // Devices: status 0|1 → active boolean (D-06)
      if (data.devices) {
        const rawDevices: DeviceData[] = data.devices.map(d => ({
          id: d.mac,
          name: d.name,
          ip: d.ip,
          mac: d.mac,
          active: d.status === 1,
        }));
        setDevices(rawDevices);
        // Fire-and-forget enrichment (D-10)
        void enrichDevicesWithCategoriesRef.current(rawDevices).then(setDevices).catch(() => {});
      }

      setLoading(false);
      setStale(false);
      setLastUpdated(Date.now());
      setError(null);
    };

    subscribe('fritzbox', handleMessage);
    return () => { unsubscribe('fritzbox', handleMessage); };
  }, [subscribe, unsubscribe, isWsConnected]);

  // Health computation — runs on every data update from WS or HTTP (D-11)
  useEffect(() => {
    if (!bandwidth && !wan) return;

    const THIRTY_MIN_MS = 30 * 60 * 1000;
    const cutoff = Date.now() - THIRTY_MIN_MS;
    const recentDownload = downloadHistory.filter(p => p.time >= cutoff);
    const recentUpload = uploadHistory.filter(p => p.time >= cutoff);
    const linkSpd = wan?.linkSpeed ?? 100;
    let historicalAvgSaturation: number | undefined;
    if (recentDownload.length >= 3) {
      const avgDown = recentDownload.reduce((s, p) => s + p.mbps, 0) / recentDownload.length;
      const avgUp = recentUpload.reduce((s, p) => s + p.mbps, 0) / Math.max(recentUpload.length, 1);
      historicalAvgSaturation = Math.max(avgDown, avgUp) / linkSpd;
    }

    const newHealthResult = computeNetworkHealth({
      wanConnected: wan?.connected ?? false,
      wanUptime: wan?.uptime ?? 0,
      downloadMbps: bandwidth?.download ?? 0,
      uploadMbps: bandwidth?.upload ?? 0,
      linkSpeedMbps: wan?.linkSpeed,
      previousHealth: healthRef.current,
      consecutiveReadings: consecutiveReadingsRef.current,
      historicalAvgSaturation,
    });

    setHealth(newHealthResult.health);
    healthRef.current = newHealthResult.health;
    consecutiveReadingsRef.current = newHealthResult.consecutiveReadings;
  }, [bandwidth, wan, downloadHistory, uploadHistory]);

  // Fetch data from Fritz!Box API routes
  const fetchData = async () => {
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
            setStale(true);
            // Show error only if no cached data to display
            if (!bandwidthRef.current && !wanRef.current) {
              setError({
                type: 'generic',
                message: 'Fritz!Box non raggiungibile. Verifica che il server API sia attivo.'
              });
            }
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
        bandwidthRef.current = bw;

        // Append to sparkline buffers (max 120 points = 2h at 60s interval)
        const now = Date.now();
        setDownloadHistory(prev => [...prev, { time: now, mbps: bw.download }].slice(-SPARKLINE_MAX_POINTS));
        setUploadHistory(prev => [...prev, { time: now, mbps: bw.upload }].slice(-SPARKLINE_MAX_POINTS));
      }

      const rawDevices = devData.devices || [];
      setDevices(rawDevices);
      setWan(wanData.wan || null);
      wanRef.current = wanData.wan || null;

      // Fire-and-forget category enrichment (non-blocking, self-heals on next poll)
      enrichDevicesWithCategories(rawDevices).then(enrichedDevices => {
        setDevices(enrichedDevices);
      }).catch(() => {
        // Intentional silent failure: category enrichment is non-critical.
        // Self-heals on next poll — unenriched MACs will be retried.
      });

      // Health computation is handled by the separate useEffect watching [bandwidth, wan, downloadHistory, uploadHistory]

      // Clear error and stale
      setError(null);
      setStale(false);
      setLastUpdated(Date.now());
    } catch (err) {
      // Network error — keep cached data, mark stale
      setStale(true);
      if (!bandwidthRef.current && !wanRef.current) {
        // No cached data at all — set generic error
        setError({
          type: 'generic',
          message: 'Impossibile raggiungere Fritz!Box'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Adaptive polling - 60s visible, 5min hidden
  // D-01: suppress polling when WS is live (interval=null)
  // initialDelay: 500ms stagger to avoid thundering herd on dashboard mount
  useAdaptivePolling({
    callback: fetchData,
    interval: isWsConnected ? null : interval,  // D-01: suppress when WS live
    alwaysActive: false,  // D-02: non-safety-critical
    immediate: true,      // Fetch on mount
    initialDelay: 500,
  });

  // Update a single device's category (used by manual overrides)
  const updateDeviceCategory = (mac: string, category: DeviceCategory) => {
    setDevices(prev => prev.map(d =>
      d.mac === mac ? { ...d, category } : d
    ));
    // Mark as enriched so polling doesn't overwrite manual override
    enrichedMacsRef.current.add(mac);
  };

  // Derived state
  const connected = wan?.connected ?? false;
  const activeDeviceCount = devices.filter(d => d.active).length;
  const healthMapped = mapHealthToDeviceCard(health);

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
    lastUpdatedAt: lastUpdated,

    // Health
    health,
    healthMapped,

    // Error
    error,

    // Derived
    activeDeviceCount,

    // Actions
    updateDeviceCategory,
  };
}
